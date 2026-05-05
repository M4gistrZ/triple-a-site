import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = await db.user.findMany({
    select: { id: true, nickname: true, role: true, createdAt: true, profile: { select: { avatar: true } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(users);
}
