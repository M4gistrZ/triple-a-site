import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const posts = await db.post.findMany({
    include: {
      user: { select: { id: true, nickname: true, profile: { select: { avatar: true } } } },
      _count: { select: { comments: true, reactions: true } },
      reactions: { select: { emoji: true, userId: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(posts);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { content } = await req.json();

  if (!content || content.trim().length === 0) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 });
  }

  if (content.length > 5000) {
    return NextResponse.json({ error: "Content exceeds 5000 characters" }, { status: 400 });
  }

  const post = await db.$transaction(async (tx) => {
    const newPost = await tx.post.create({
      data: { userId: session.id, content: content.trim() },
      include: {
        user: { select: { id: true, nickname: true, profile: { select: { avatar: true } } } },
      },
    });

    await tx.activity.create({
      data: {
        userId: session.id,
        action: "posted",
        content: `Написал новый пост`,
      },
    });

    return newPost;
  });

  return NextResponse.json(post, { status: 201 });
}
