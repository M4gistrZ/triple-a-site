import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const projects = await db.project.findMany({
      include: { creator: { select: { nickname: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, status, images, coverImage } = body;

    if (!title || !description) {
      return NextResponse.json(
        { error: "Title and description are required" },
        { status: 400 }
      );
    }

    const project = await db.$transaction(async (tx) => {
      const newProject = await tx.project.create({
        data: {
          title,
          description,
          status: status || "planning",
          coverImage: coverImage || "",
          images: JSON.stringify(images || []),
          creatorId: session.id,
        },
        include: { creator: { select: { nickname: true } } },
      });

      await tx.activity.create({
        data: {
          userId: session.id,
          projectId: newProject.id,
          action: "created",
          content: `Создал проект "${title}"`,
        },
      });

      return newProject;
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
