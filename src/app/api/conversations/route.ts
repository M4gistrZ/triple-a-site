import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const conversations = await db.conversation.findMany({
    where: {
      participants: { some: { userId: session.id } },
    },
    include: {
      participants: {
        include: {
          user: {
            select: { id: true, nickname: true, profile: { select: { avatar: true } } },
          },
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: {
          sender: { select: { id: true, nickname: true } },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const result = conversations.map((conv) => {
    const otherParticipants = conv.participants.filter((p) => p.userId !== session.id);
    let name = conv.name;
    let avatar = conv.avatar;
    if (!conv.isGroup && otherParticipants.length > 0) {
      name = otherParticipants[0].user.nickname;
      avatar = otherParticipants[0].user.profile?.avatar || "";
    }
    const participant = conv.participants.find((p) => p.userId === session.id);
    const unread = conv.messages.length > 0
      ? conv.messages.some((m) => m.senderId !== session.id && (!participant || m.id !== participant.lastReadMsgId))
        ? 1
        : 0
      : 0;

    return {
      id: conv.id,
      name,
      avatar,
      isGroup: conv.isGroup,
      lastMessage: conv.messages[0] || null,
      updatedAt: conv.updatedAt,
      unread,
    };
  });

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { userIds, name, isGroup } = body as { userIds: string[]; name?: string; isGroup?: boolean };

  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    return NextResponse.json({ error: "userIds are required" }, { status: 400 });
  }

  const allUserIds = [...new Set([session.id, ...userIds])];

  if (!isGroup && allUserIds.length === 2) {
    const existing = await db.conversation.findFirst({
      where: {
        isGroup: false,
        AND: [
          { participants: { every: { userId: { in: allUserIds } } } },
          { participants: { some: { userId: allUserIds[0] } } },
          { participants: { some: { userId: allUserIds[1] } } },
        ],
      },
      include: { participants: true },
    });

    if (existing && existing.participants.length === 2) {
      return NextResponse.json({ id: existing.id, existing: true });
    }
  }

  const conversation = await db.conversation.create({
    data: {
      name: name || "",
      isGroup: !!isGroup,
      participants: {
        create: allUserIds.map((uid) => ({ userId: uid })),
      },
    },
  });

  return NextResponse.json({ id: conversation.id, existing: false }, { status: 201 });
}
