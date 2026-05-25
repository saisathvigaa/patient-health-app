import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest, unauthorized } from "@/lib/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";
export const maxDuration = 60;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const SYSTEM_PROMPT = `You are a medical lab report parser. Extract all lab test values from the report.
Return ONLY a valid JSON object with this exact structure (no markdown, no explanation):
{
  "lab_name": "name of the lab/hospital or null",
  "bill_id": "bill/invoice number or null",
  "report_type": "Blood Test|Urine Analysis|Thyroid Panel|Lipid Profile|Liver Function|Kidney Function|Other",
  "lab_values": [
    {
      "test_name": "exact name of the test",
      "test_category": "CBC|Kidney Function|Liver Function|Thyroid|Lipid Profile|Blood Sugar|Urine|Electrolytes|Other",
      "value_numeric": <number or null>,
      "value_text": "text result if not numeric, else null",
      "unit": "unit of measurement or null",
      "ref_low": <lower reference range as number or null>,
      "ref_high": <upper reference range as number or null>,
      "flag": "H|L|N|null"
    }
  ]
}
Rules:
- Extract every single test listed in the report
- For flag: H = above high ref, L = below low ref, N = within range, null = unknown
- Infer flag from value vs reference range if not explicitly stated
- test_category should group tests logically (e.g. Haemoglobin → CBC, Creatinine → Kidney Function)`;

async function parseWithGemini(
  buffer: Buffer,
  mimeType: string,
  isPdf: boolean,
  pdfText?: string
): Promise<any> {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  let result;

  if (isPdf && pdfText) {
    const truncatedText = pdfText.slice(0, 15000);
    result = await model.generateContent([
      SYSTEM_PROMPT,
      `Extract all lab values from this medical report:\n\n${truncatedText}`,
    ]);
  } else {
    const validMimeTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    const safeMime = validMimeTypes.includes(mimeType) ? mimeType : "image/jpeg";

    result = await model.generateContent([
      SYSTEM_PROMPT,
      {
        inlineData: {
          data: buffer.toString("base64"),
          mimeType: safeMime,
        },
      },
      "Extract all lab values from this medical report image.",
    ]);
  }

  const rawText = result.response.text();

  const cleaned = rawText
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON found in Gemini response");

  return JSON.parse(jsonMatch[0]);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ patientId: string }> }
) {
  const user = await getUserFromRequest(req);
  if (!user) return unauthorized();

  const { patientId } = await params;

  const patient = await prisma.patient.findFirst({
    where: { id: patientId, userId: user.id },
  });
  if (!patient) {
    return NextResponse.json({ detail: "Patient not found" }, { status: 404 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const reportDateStr = (formData.get("report_date") as string) || new Date().toISOString().split("T")[0];

    if (!file) {
      return NextResponse.json({ detail: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type || "application/octet-stream";
    const isPdf = mimeType === "application/pdf";

    let pdfText: string | undefined;
    if (isPdf) {
      try {
        const pdfParse = (await import("pdf-parse")).default;
        const pdfData = await pdfParse(buffer);
        pdfText = pdfData.text;
      } catch (pdfErr) {
        console.error("PDF parse error:", pdfErr);
      }
    }

    let parsed: any = { lab_name: null, bill_id: null, report_type: "Blood Test", lab_values: [] };
    try {
      parsed = await parseWithGemini(buffer, mimeType, isPdf, pdfText);
    } catch (aiErr: any) {
      console.error("Gemini parse error:", aiErr);
    }

    const labValues: any[] = Array.isArray(parsed.lab_values) ? parsed.lab_values : [];

    const report = await prisma.report.create({
      data: {
        patientId,
        reportDate: new Date(reportDateStr),
        labName: parsed.lab_name || file.name.replace(/\.[^/.]+$/, ""),
        billId: parsed.bill_id || null,
        reportType: parsed.report_type || "Blood Test",
        status: "completed",
        labValues:
          labValues.length > 0
            ? {
                create: labValues.map((lv: any) => ({
                  testName: String(lv.test_name || "Unknown"),
                  testCategory: String(lv.test_category || "Other"),
                  valueNumeric:
                    typeof lv.value_numeric === "number" ? lv.value_numeric : null,
                  valueText: lv.value_text ? String(lv.value_text) : null,
                  unit: lv.unit ? String(lv.unit) : null,
                  refLow: typeof lv.ref_low === "number" ? lv.ref_low : null,
                  refHigh: typeof lv.ref_high === "number" ? lv.ref_high : null,
                  flag: lv.flag ? String(lv.flag) : null,
                  ocrConfidence: 0.9,
                  userVerified: false,
                })),
              }
            : undefined,
      },
      include: { labValues: true },
    });

    return NextResponse.json(
      {
        id: report.id,
        patient_id: report.patientId,
        report_date: report.reportDate.toISOString().split("T")[0],
        lab_name: report.labName,
        bill_id: report.billId,
        report_type: report.reportType,
        status: report.status,
        lab_values: report.labValues.map((lv: any) => ({
          id: lv.id,
          test_name: lv.testName,
          test_category: lv.testCategory,
          value_numeric: lv.valueNumeric,
          value_text: lv.valueText,
          unit: lv.unit,
          ref_low: lv.refLow,
          ref_high: lv.refHigh,
          flag: lv.flag,
          user_verified: lv.userVerified,
        })),
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Upload route error:", error);
    return NextResponse.json(
      { detail: error.message || "Upload failed" },
      { status: 500 }
    );
  }
        }
