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

  const labValues = await prisma.labValue.findMany({
    where: {
      report: {
        patientId,
        status: "completed",
      },
    },
    include: {
      report: { select: { reportDate: true } },
    },
    orderBy: { report: { reportDate: "asc" } },
  });

  // Group by test name
  const markers: Record<string, any> = {};
  for (const lv of labValues) {
    const key = lv.testName;
    if (!markers[key]) {
      markers[key] = {
        test_name: lv.testName,
        unit: lv.unit,
        ref_low: lv.refLow,
        ref_high: lv.refHigh,
        data_points: [],
      };
    }
    markers[key].data_points.push({
      date: lv.report.reportDate.toISOString().split("T")[0],
      value: lv.valueNumeric,
      value_text: lv.valueText,
      flag: lv.flag,
    });
  }

  return NextResponse.json(Object.values(markers));
}
