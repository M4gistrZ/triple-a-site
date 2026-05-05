import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { emoji } = await req.json();

  if (!emoji) {
    return NextResponse.json({ error: "Emoji is required" }, { status: 400 });
  }

  const existing = await db.reaction.findUnique({
    where: { userId_postId_emoji: { userId: session.id, postId: id, emoji } },
  });

  if (existing) {
    await db.reaction.delete({ where: { id: existing.id } });
    return NextResponse.json({ success: true, removed: true });
  }

  const reaction = await db.reaction.create({
    data: { userId: session.id, postId: id, emoji },
  });

  return NextResponse.json({ success: true, removed: false, reaction });
}
