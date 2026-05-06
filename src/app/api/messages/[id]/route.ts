import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { emit } from "@/lib/chatEvents";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: messageId } = await params;

  const message = await db.message.findUnique({
    where: { id: messageId },
    include: { conversation: true },
  });

  if (!message) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }

  const isSender = message.senderId === session.id;
  const isAdmin = session.role === "admin";

  if (!isSender && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.message.delete({ where: { id: messageId } });

  emit(message.conversationId, { type: "messageDeleted", data: { id: messageId } });
  emit("*", { type: "messageDeleted", data: { id: messageId } });

  return NextResponse.json({ success: true });
}
