import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const projects = await db.project.findMany({
    select: { id: true, title: true, coverImage: true, images: true },
  });

  const galleryItems: { url: string; title: string; projectId: string; isCover: boolean }[] = [];

  projects.forEach((p) => {
    if (p.coverImage) {
      galleryItems.push({
        url: p.coverImage,
        title: `${p.title} (обложка)`,
        projectId: p.id,
        isCover: true,
      });
    }
    const imgs: string[] = JSON.parse(p.images || "[]");
    imgs.forEach((img) => {
      galleryItems.push({
        url: img,
        title: p.title,
        projectId: p.id,
        isCover: false,
      });
    });
  });

  return NextResponse.json(galleryItems);
}
