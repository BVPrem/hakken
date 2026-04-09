import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { userSeries } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const seriesId = req.nextUrl.searchParams.get("seriesId");
  if (!seriesId)
    return NextResponse.json({ error: "seriesId required" }, { status: 400 });

  const result = await db
    .select()
    .from(userSeries)
    .where(and(eq(userSeries.userId, userId), eq(userSeries.seriesId, seriesId)))
    .limit(1);

  return NextResponse.json({ entry: result[0] ?? null });
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { seriesId, status, score, progress } = body;

  if (!seriesId || !status)
    return NextResponse.json(
      { error: "seriesId and status required" },
      { status: 400 }
    );

  await db
    .insert(userSeries)
    .values({
      userId,
      seriesId,
      status,
      score: score ?? null,
      progress: progress ?? 0,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [userSeries.userId, userSeries.seriesId],
      set: {
        status,
        score: score ?? null,
        progress: progress ?? 0,
        updatedAt: new Date(),
      },
    });

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const seriesId = req.nextUrl.searchParams.get("seriesId");
  if (!seriesId)
    return NextResponse.json({ error: "seriesId required" }, { status: 400 });

  await db
    .delete(userSeries)
    .where(and(eq(userSeries.userId, userId), eq(userSeries.seriesId, seriesId)));

  return NextResponse.json({ success: true });
}