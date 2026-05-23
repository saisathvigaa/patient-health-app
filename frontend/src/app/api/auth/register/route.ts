import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, name, password } = await req.json();

    if (!email || !name || !password) {
      return NextResponse.json({ detail: "Email, name, and password required" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ detail: "Password must be at least 6 characters" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ detail: "Email already registered" }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, name, hashedPassword },
    });

    const token = createToken(user.id);

    return NextResponse.json({
      access_token: token,
      token_type: "bearer",
      user: { id: user.id, email: user.email, name: user.name },
    }, { status: 201 });
  } catch (error: any) {
    console.error("Register error:", error);
    return NextResponse.json({ detail: "Registration failed" }, { status: 500 });
  }
}
