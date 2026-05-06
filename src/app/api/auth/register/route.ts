import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, createToken, setSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { nickname, password } = await req.json();

    if (!nickname || !password) {
      return NextResponse.json(
        { error: "Nickname and password are required" },
        { status: 400 }
      );
    }

    const existingUser = await db.user.findUnique({ where: { nickname } });
    if (existingUser) {
      return NextResponse.json(
        { error: "Nickname already taken" },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password);
    const user = await db.user.create({
      data: { nickname, password: hashedPassword },
    });

    const token = await createToken({ id: user.id, nickname: user.nickname, role: user.role });
    await setSession(token);

    return NextResponse.json({
      id: user.id,
      nickname: user.nickname,
      role: user.role,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
