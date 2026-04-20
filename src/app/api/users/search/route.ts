import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json(
    { error: "Unauthorized" }, { status: 401 }
  );

  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ users: [] });
  }

  try {
    const clerk = await clerkClient();
    const result = await clerk.users.getUserList({
      query: q,
      limit: 8,
    });

    const filtered = result.data
      .filter(u => u.id !== userId)
      .map(u => ({
        id: u.id,
        name: u.firstName && u.lastName
          ? `${u.firstName} ${u.lastName}`
          : u.firstName ?? u.username ?? "Unknown",
        username: u.username,
        imageUrl: u.imageUrl,
        email: u.primaryEmailAddress?.emailAddress,
      }));

    return NextResponse.json({ users: filtered });
  } catch (err) {
    console.error("User search error:", err);
    return NextResponse.json(
      { error: "Search failed" }, { status: 500 }
    );
  }
}