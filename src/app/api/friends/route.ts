import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { friendships, users } from "@/lib/db/schema";
import { eq, or, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json(
    { error: "Unauthorized" }, { status: 401 }
  );

  const type = req.nextUrl.searchParams.get("type")
    ?? "friends";

  try {
    if (type === "friends") {
      const rows = await db
        .select()
        .from(friendships)
        .where(
          and(
            or(
              eq(friendships.requesterId, userId),
              eq(friendships.addresseeId, userId)
            ),
            eq(friendships.status, "accepted")
          )
        );
      return NextResponse.json({ friends: rows });
    }

    if (type === "pending") {
      const rows = await db
        .select()
        .from(friendships)
        .where(
          and(
            eq(friendships.requesterId, userId),
            eq(friendships.status, "pending")
          )
        );
      return NextResponse.json({ pending: rows });
    }

    if (type === "requests") {
      const rows = await db
        .select()
        .from(friendships)
        .where(
          and(
            eq(friendships.addresseeId, userId),
            eq(friendships.status, "pending")
          )
        );
      return NextResponse.json({ requests: rows });
    }

    return NextResponse.json({ error: "Invalid type" },
      { status: 400 });
  } catch (err) {
    console.error("Friends GET error:", err);
    return NextResponse.json(
      { error: "Failed" }, { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json(
    { error: "Unauthorized" }, { status: 401 }
  );

  const { friendId } = await req.json();
  if (!friendId || friendId === userId) {
    return NextResponse.json(
      { error: "Invalid friendId" }, { status: 400 }
    );
  }

  try {
    const existing = await db
      .select()
      .from(friendships)
      .where(
        or(
          and(
            eq(friendships.requesterId, userId),
            eq(friendships.addresseeId, friendId)
          ),
          and(
            eq(friendships.requesterId, friendId),
            eq(friendships.addresseeId, userId)
          )
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Friendship already exists" },
        { status: 409 }
      );
    }

    await db.insert(friendships).values({
      requesterId: userId,
      addresseeId: friendId,
      status: "pending",
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Friends POST error:", err);
    return NextResponse.json(
      { error: "Failed" }, { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json(
    { error: "Unauthorized" }, { status: 401 }
  );

  const { requesterId, action } = await req.json();

  try {
    if (action === "accept") {
      await db
        .update(friendships)
        .set({ status: "accepted" })
        .where(
          and(
            eq(friendships.requesterId, requesterId),
            eq(friendships.addresseeId, userId),
            eq(friendships.status, "pending")
          )
        );
    } else {
      await db
        .delete(friendships)
        .where(
          and(
            eq(friendships.requesterId, requesterId),
            eq(friendships.addresseeId, userId)
          )
        );
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Friends PATCH error:", err);
    return NextResponse.json(
      { error: "Failed" }, { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json(
    { error: "Unauthorized" }, { status: 401 }
  );

  const friendId = req.nextUrl.searchParams.get("friendId");
  if (!friendId) return NextResponse.json(
    { error: "friendId required" }, { status: 400 }
  );

  try {
    await db
      .delete(friendships)
      .where(
        or(
          and(
            eq(friendships.requesterId, userId),
            eq(friendships.addresseeId, friendId)
          ),
          and(
            eq(friendships.requesterId, friendId),
            eq(friendships.addresseeId, userId)
          )
        )
      );
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Friends DELETE error:", err);
    return NextResponse.json(
      { error: "Failed" }, { status: 500 }
    );
  }
}