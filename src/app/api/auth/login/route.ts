import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword, createToken, setSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { nickname, password } = await req.json();

    if (!nickname || !password) {
      return NextResponse.json(
        { error: "Nickname and password are required" },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({ where: { nickname } });
    if (!user) {
      return NextResponse.json(
        { error: "Invalid nickname or password" },
        { status: 401 }
      );
    }

    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid nickname or password" },
        { status: 401 }
      );
    }

    const token = await createToken({ id: user.id, nickname: user.nickname });
    await setSession(token);

    return NextResponse.json({
      id: user.id,
      nickname: user.nickname,
      role: user.role,
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
