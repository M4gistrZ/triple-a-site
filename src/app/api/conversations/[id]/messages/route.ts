import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { emit } from "@/lib/chatEvents";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { content, image } = body as { content?: string; image?: string };

  if ((!content || content.trim().length === 0) && !image) {
    return NextResponse.json({ error: "Content or image is required" }, { status: 400 });
  }

  if (content && content.length > 5000) {
    return NextResponse.json({ error: "Message too long (max 5000)" }, { status: 400 });
  }

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

  const message = await db.message.create({
    data: {
      conversationId: id,
      senderId: session.id,
      content: (content || "").trim(),
      image: image || "",
    },
    include: {
      sender: {
        select: { id: true, nickname: true, profile: { select: { avatar: true } } },
      },
    },
  });

  await db.conversation.update({
    where: { id },
    data: { updatedAt: new Date() },
  });

  emit(id, { type: "message", data: message });
  emit("*", { type: "message", data: message });

  return NextResponse.json(message, { status: 201 });
}
