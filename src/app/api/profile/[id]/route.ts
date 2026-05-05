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

  const user = await db.user.findUnique({
    where: { id },
    include: {
      profile: true,
      posts: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(user);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  if (session.id !== id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { bio, avatar, skin } = await req.json();

  const profile = await db.profile.upsert({
    where: { userId: id },
    update: {
      ...(bio !== undefined && { bio: bio.slice(0, 1000) }),
      ...(avatar !== undefined && { avatar: avatar.slice(0, 500) }),
      ...(skin !== undefined && { skin: skin.slice(0, 500) }),
    },
    create: {
      userId: id,
      bio: bio ? bio.slice(0, 1000) : "",
      avatar: avatar ? avatar.slice(0, 500) : "",
      skin: skin ? skin.slice(0, 500) : "",
    },
  });

  return NextResponse.json(profile);
}
