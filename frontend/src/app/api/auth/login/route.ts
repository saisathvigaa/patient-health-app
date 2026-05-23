import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ detail: "Email and password required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ detail: "Invalid email or password" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.hashedPassword);
    if (!valid) {
      return NextResponse.json({ detail: "Invalid email or password" }, { status: 401 });
    }

    const token = createToken(user.id);

    return NextResponse.json({
      access_token: token,
      token_type: "bearer",
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json({ detail: "Login failed" }, { status: 500 });
  }
}
