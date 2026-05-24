import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest, unauthorized } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  const user = await getUserFromRequest(req);
  if (!user) return unauthorized();
  const { reportId } = await params;

  const report = await prisma.report.findFirst({
    where: {
      id: reportId,
      patient: { userId: user.id },
    },
    include: { labValues: true },
  });

  if (!report) {
    return NextResponse.json({ detail: "Report not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: report.id,
    patient_id: report.patientId,
    report_date: report.reportDate.toISOString().split("T")[0],
    lab_name: report.labName,
    bill_id: report.billId,
    report_type: report.reportType,
    status: report.status,
    lab_values: report.labValues.map((lv) => ({
      id: lv.id,
      test_name: lv.testName,
      test_category: lv.testCategory,
      value_numeric: lv.valueNumeric,
      value_text: lv.valueText,
      unit: lv.unit,
      ref_low: lv.refLow,
      ref_high: lv.refHigh,
      flag: lv.flag,
      note: lv.note,
      user_verified: lv.userVerified,
    })),
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  const user = await getUserFromRequest(req);
  if (!user) return unauthorized();
  const { reportId } = await params;

  const report = await prisma.report.findFirst({
    where: { id: reportId, patient: { userId: user.id } },
  });
  if (!report) {
    return NextResponse.json({ detail: "Report not found" }, { status: 404 });
  }

  await prisma.report.delete({ where: { id: reportId } });
  return new NextResponse(null, { status: 204 });
}
