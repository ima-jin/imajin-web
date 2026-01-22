import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { contacts, mailingLists, contactSubscriptions } from "@/db/schema-auth";
import { eq, and } from "drizzle-orm";
import { logger } from "@/lib/utils/logger";

/**
 * Simplified subscription endpoint for /updates page
 * Automatically subscribes to the "newsletter" mailing list
 * Skips verification for quick show signup
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const emailLower = email.toLowerCase().trim();

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailLower)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    // Get or create the "newsletter" mailing list (default updates list)
    let [updatesList] = await db
      .select()
      .from(mailingLists)
      .where(eq(mailingLists.slug, "newsletter"))
      .limit(1);

    if (!updatesList) {
      // Auto-create the newsletter list if it doesn't exist
      [updatesList] = await db
        .insert(mailingLists)
        .values({
          slug: "newsletter",
          name: "Newsletter",
          description: "Updates about products, installations, and events",
          isDefault: false,
          isActive: true,
        })
        .returning();
    }

    // Check if contact already exists
    let [contact] = await db
      .select()
      .from(contacts)
      .where(
        and(
          eq(contacts.value, emailLower),
          eq(contacts.kind, "email")
        )
      )
      .limit(1);

    // Create contact if it doesn't exist
    if (!contact) {
      [contact] = await db
        .insert(contacts)
        .values({
          kind: "email",
          value: emailLower,
          isPrimary: true,
          isVerified: false,
          source: "signup_form",
        })
        .returning();
    }

    // Check if subscription already exists
    const [existingSubscription] = await db
      .select()
      .from(contactSubscriptions)
      .where(
        and(
          eq(contactSubscriptions.contactId, contact.id),
          eq(contactSubscriptions.mailingListId, updatesList.id)
        )
      )
      .limit(1);

    if (existingSubscription) {
      // If they were unsubscribed, resubscribe them
      if (existingSubscription.status === "unsubscribed") {
        await db
          .update(contactSubscriptions)
          .set({
            status: "subscribed",
            optInAt: new Date(),
            optInIp: request.headers.get("x-forwarded-for") || null,
            optInUserAgent: request.headers.get("user-agent") || null,
            updatedAt: new Date(),
          })
          .where(eq(contactSubscriptions.id, existingSubscription.id));

        return NextResponse.json({ success: true });
      }

      // Already subscribed
      return NextResponse.json({ success: true });
    }

    // Create new subscription (skip verification for shows)
    await db.insert(contactSubscriptions).values({
      contactId: contact.id,
      mailingListId: updatesList.id,
      status: "subscribed", // Direct subscribe, skip verification
      optInAt: new Date(),
      optInIp: request.headers.get("x-forwarded-for") || null,
      optInUserAgent: request.headers.get("user-agent") || null,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error(
      "Subscription error",
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      { error: "Failed to subscribe. Please try again." },
      { status: 500 }
    );
  }
}
