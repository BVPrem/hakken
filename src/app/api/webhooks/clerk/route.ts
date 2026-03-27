import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error("Missing CLERK_WEBHOOK_SECRET in .env.local");
  }

  // Get headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  // Get raw body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Verify webhook signature
  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Webhook verification failed:", err);
    return new Response("Invalid webhook signature", { status: 400 });
  }

  const eventType = evt.type;

  // ─── user.created ─────────────────────────────────────
  if (eventType === "user.created") {
    const {
      id,
      email_addresses,
      username,
      first_name,
      last_name,
      image_url,
    } = evt.data;

    const primaryEmail = email_addresses.find(
      (e) => e.id === evt.data.primary_email_address_id
    );

    if (!primaryEmail) {
      return new Response("No primary email found", { status: 400 });
    }

    const displayName =
      [first_name, last_name].filter(Boolean).join(" ") || username || null;

    try {
      await db.insert(users).values({
        id,
        email: primaryEmail.email_address,
        username: username ?? null,
        displayName,
        avatarUrl: image_url ?? null,
        onboarded: false,
      });

      console.log(`✅ User created in Neon: ${id}`);
    } catch (error) {
      console.error("Failed to insert user:", error);
      return new Response("Database error", { status: 500 });
    }
  }

  // ─── user.updated ─────────────────────────────────────
  if (eventType === "user.updated") {
    const {
      id,
      email_addresses,
      username,
      first_name,
      last_name,
      image_url,
    } = evt.data;

    const primaryEmail = email_addresses.find(
      (e) => e.id === evt.data.primary_email_address_id
    );

    if (!primaryEmail) {
      return new Response("No primary email found", { status: 400 });
    }

    const displayName =
      [first_name, last_name].filter(Boolean).join(" ") || username || null;

    try {
      await db
        .update(users)
        .set({
          email: primaryEmail.email_address,
          username: username ?? null,
          displayName,
          avatarUrl: image_url ?? null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, id));

      console.log(`✅ User updated in Neon: ${id}`);
    } catch (error) {
      console.error("Failed to update user:", error);
      return new Response("Database error", { status: 500 });
    }
  }

  // ─── user.deleted ─────────────────────────────────────
  if (eventType === "user.deleted") {
    const { id } = evt.data;

    if (!id) {
      return new Response("No user ID in payload", { status: 400 });
    }

    try {
      await db.delete(users).where(eq(users.id, id));
      console.log(`✅ User deleted from Neon: ${id}`);
    } catch (error) {
      console.error("Failed to delete user:", error);
      return new Response("Database error", { status: 500 });
    }
  }

  return new Response("Webhook processed", { status: 200 });
}
