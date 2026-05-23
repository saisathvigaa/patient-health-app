import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest, unauthorized } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return unauthorized();

  const patients = await prisma.patient.findMany({
    where: { userId: user.id },
    include: { _count: { select: { reports: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    patients.map((p: any) => ({
      id: p.id,
      name: p.name,
      date_of_birth: p.dateOfBirth?.toISOString().split("T")[0] || null,
      sex: p.sex,
      blood_group: p.bloodGroup,
      referring_doctor: p.referringDoctor,
      hospital: p.hospital,
      report_count: p._count.reports,
    }))
  );
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return unauthorized();

  const body = await req.json();

  const patient = await prisma.patient.create({
    data: {
      userId: user.id,
      name: body.name,
      dateOfBirth: body.date_of_birth ? new Date(body.date_of_birth) : null,
      sex: body.sex || null,
      bloodGroup: body.blood_group || null,
      referringDoctor: body.referring_doctor || null,
      hospital: body.hospital || null,
    },
  });

  return NextResponse.json({
    id: patient.id,
    name: patient.name,
    date_of_birth: patient.dateOfBirth?.toISOString().split("T")[0] || null,
    sex: patient.sex,
    blood_group: patient.bloodGroup,
    report_count: 0,
  }, { status: 201 });
}
