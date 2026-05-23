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

  const patient = await prisma.patient.findFirst({
    where: { id: patientId, userId: user.id },
    include: { _count: { select: { reports: true } } },
  });

  if (!patient) {
    return NextResponse.json({ detail: "Patient not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: patient.id,
    name: patient.name,
    date_of_birth: patient.dateOfBirth?.toISOString().split("T")[0] || null,
    sex: patient.sex,
    blood_group: patient.bloodGroup,
    referring_doctor: patient.referringDoctor,
    hospital: patient.hospital,
    report_count: patient._count.reports,
  });
}

export async function DELETE(
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

  await prisma.patient.delete({ where: { id: patientId } });
  return new NextResponse(null, { status: 204 });
}
