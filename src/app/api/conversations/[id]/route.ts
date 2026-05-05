import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
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
    include: {
      participants: {
        include: {
          user: {
            select: { id: true, nickname: true, profile: { select: { avatar: true } } },
          },
        },
      },
    },
  });

  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  const isParticipant = conversation.participants.some((p) => p.userId === session.id);
  if (!isParticipant) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const participant = conversation.participants.find((p) => p.userId === session.id);
  const lastReadId = participant?.lastReadMsgId || "";

  const messages = await db.message.findMany({
    where: { conversationId: id },
    include: {
      sender: {
        select: { id: true, nickname: true, profile: { select: { avatar: true } } },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const otherParticipants = conversation.participants.filter((p) => p.userId !== session.id);
  let displayName = conversation.name;
  if (!conversation.isGroup && otherParticipants.length > 0) {
    displayName = otherParticipants[0].user.nickname;
  }

  return NextResponse.json({
    id: conversation.id,
    name: displayName,
    isGroup: conversation.isGroup,
    avatar: conversation.avatar,
    participants: otherParticipants.map((p) => ({
      id: p.user.id,
      nickname: p.user.nickname,
      avatar: p.user.profile?.avatar || "",
    })),
    messages,
    lastReadId,
  });
}
