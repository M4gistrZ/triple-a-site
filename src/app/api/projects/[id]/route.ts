import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const project = await db.project.findUnique({
      where: { id },
      include: { creator: { select: { nickname: true } } },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error("Error fetching project:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { title, description, status, images, coverImage, galleryImages } = body;

    const project = await db.project.findUnique({ where: { id } });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const updated = await db.$transaction(async (tx) => {
      const result = await tx.project.update({
        where: { id },
        data: {
          ...(title && { title }),
          ...(description && { description }),
          ...(status && { status }),
          ...(coverImage !== undefined && { coverImage }),
          ...(images !== undefined && { images: JSON.stringify(images) }),
        },
        include: { creator: { select: { nickname: true } } },
      });

      await tx.activity.create({
        data: {
          userId: session.id,
          projectId: project.id,
          action: "updated",
          content: `Обновил проект "${title || project.title}"`,
        },
      });

      return result;
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating project:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const project = await db.project.findUnique({ where: { id } });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    await db.$transaction(async (tx) => {
      await tx.activity.create({
        data: {
          userId: session.id,
          projectId: id,
          action: "deleted",
          content: `Удалил проект "${project.title}"`,
        },
      });
      await tx.project.delete({ where: { id } });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting project:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
