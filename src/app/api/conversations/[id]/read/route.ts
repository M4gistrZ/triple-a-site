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

  const conversation = await db.conversation.findUnique({
    where: { id },
    include: { participants: true },
  });

  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  const isParticipant = conversation.participants.some((p) => p.userId === session.id);
  if (!isParticipant) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const lastMessage = await db.message.findFirst({
    where: { conversationId: id },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });

  if (lastMessage) {
    await db.conversationParticipant.updateMany({
      where: { conversationId: id, userId: session.id },
      data: { lastReadMsgId: lastMessage.id },
    });
  }

  return NextResponse.json({ success: true });
}
