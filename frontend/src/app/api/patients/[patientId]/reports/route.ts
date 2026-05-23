import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest, unauthorized } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ patientId: string }> }
) {
  const user = await getUserFromRequest(req);
  if (!user) return unauthorized();
  const { patientId } = await params;

  // Verify patient access
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, userId: user.id },
  });
  if (!patient) {
    return NextResponse.json({ detail: "Patient not found" }, { status: 404 });
  }

  const reports = await prisma.report.findMany({
    where: { patientId },
    include: { _count: { select: { labValues: true } } },
    orderBy: { reportDate: "desc" },
  });

  return NextResponse.json(
    reports.map((r: any) => ({
      id: r.id,
      report_date: r.reportDate.toISOString().split("T")[0],
      lab_name: r.labName,
      status: r.status,
      value_count: r._count.labValues,
    }))
  );
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ patientId: string }> }
) {
  const user = await getUserFromRequest(req);
  if (!user) return unauthorized();
  const { patientId } = await params;

  // Verify patient access
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, userId: user.id },
  });
  if (!patient) {
    return NextResponse.json({ detail: "Patient not found" }, { status: 404 });
  }

  // For now, accept manual lab value entry as JSON
  const body = await req.json();

  const report = await prisma.report.create({
    data: {
      patientId,
      reportDate: new Date(body.report_date),
      labName: body.lab_name || null,
      billId: body.bill_id || null,
      reportType: body.report_type || "Blood Test",
      status: "completed",
      labValues: body.lab_values
        ? {
            create: body.lab_values.map((lv: any) => ({
              testName: lv.test_name,
              testCategory: lv.test_category || null,
              valueNumeric: lv.value_numeric ?? null,
              valueText: lv.value_text || null,
              unit: lv.unit || null,
              refLow: lv.ref_low ?? null,
              refHigh: lv.ref_high ?? null,
              flag: lv.flag || null,
              note: lv.note || null,
              ocrConfidence: 1.0,
              userVerified: true,
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
}
