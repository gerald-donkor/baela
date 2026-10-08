import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  index,
  uniqueIndex,
  check,
} from "drizzle-orm/pg-core";
import type { Interval } from "@/lib/domain/progress";

const id = () => uuid("id").defaultRandom().primaryKey();
const created = () =>
  timestamp("created_at", { withTimezone: true }).defaultNow().notNull();
export const users = pgTable("app_users", {
  id: id(),
  authId: text("auth_id").notNull().unique(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  state: text("state", { enum: ["active", "deleting", "deleted"] })
    .default("active")
    .notNull(),
  polarCustomerId: text("polar_customer_id").unique(),
  createdAt: created(),
});
export const courses = pgTable("courses", {
  id: id(),
  slug: text("slug").unique().notNull(),
  title: text("title").notNull(),
  description: text("description").default("").notNull(),
  summary: text("summary").default("").notNull(),
  coverId: uuid("cover_id"),
  previewLessonId: uuid("preview_lesson_id"),
  trailerId: uuid("trailer_asset_id").references(() => assets.id),
  trailerDraftId: uuid("trailer_draft_asset_id").references(() => assets.id),
  status: text("status", { enum: ["draft", "published", "archived"] })
    .default("draft")
    .notNull(),
  everPublished: boolean("ever_published").default(false).notNull(),
  createdAt: created(),
});
export const sections = pgTable(
  "sections",
  {
    id: id(),
    courseId: uuid("course_id")
      .references(() => courses.id, { onDelete: "cascade" })
      .notNull(),
    title: text("title").notNull(),
    position: integer("position").notNull(),
  },
  (t) => [index("section_order").on(t.courseId, t.position)],
);
export const lessons = pgTable(
  "lessons",
  {
    id: id(),
    sectionId: uuid("section_id")
      .references(() => sections.id, { onDelete: "cascade" })
      .notNull(),
    title: text("title").notNull(),
    position: integer("position").notNull(),
    publishedRevisionId: uuid("published_revision_id"),
    draftRevisionId: uuid("draft_revision_id"),
    retiredAt: timestamp("retired_at", { withTimezone: true }),
    createdAt: created(),
  },
  (t) => [index("lesson_order").on(t.sectionId, t.position)],
);
export const assets = pgTable("assets", {
  id: id(),
  fileId: text("file_id").notNull().unique(),
  filePath: text("file_path").notNull(),
  name: text("name").notNull(),
  kind: text("kind", { enum: ["video", "image", "attachment"] }).notNull(),
  mime: text("mime").notNull(),
  size: integer("size").notNull(),
  duration: integer("duration").default(0).notNull(),
  height: integer("height").default(0).notNull(),
  ready: boolean("ready").default(false).notNull(),
  private: boolean("private").default(true).notNull(),
  createdAt: created(),
});
export const revisions = pgTable("lesson_revisions", {
  id: id(),
  lessonId: uuid("lesson_id")
    .references(() => lessons.id, { onDelete: "cascade" })
    .notNull(),
  title: text("title").notNull(),
  markdown: text("markdown").default("").notNull(),
  videoId: uuid("video_id").references(() => assets.id),
  preview: boolean("preview").default(false).notNull(),
  attachmentIds: jsonb("attachment_ids")
    .$type<string[]>()
    .default([])
    .notNull(),
  imageIds: jsonb("image_ids").$type<string[]>().default([]).notNull(),
  createdAt: created(),
});
export const offers = pgTable(
  "offers",
  {
    id: id(),
    kind: text("kind", { enum: ["course", "monthly", "lifetime"] }).notNull(),
    courseId: uuid("course_id").references(() => courses.id),
    productId: text("product_id").unique().notNull(),
    amount: integer("amount").notNull(),
    currency: text("currency").default("usd").notNull(),
    active: boolean("active").default(true).notNull(),
  },
  (t) => [
    uniqueIndex("course_offer").on(t.courseId),
    check("positive_offer_price", sql`${t.amount} > 0`),
  ],
);
export const orders = pgTable("orders", {
  id: text("id").primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  offerId: uuid("offer_id")
    .references(() => offers.id)
    .notNull(),
  checkoutId: text("checkout_id"),
  subscriptionId: text("subscription_id"),
  amount: integer("amount").notNull(),
  refunded: integer("refunded").default(0).notNull(),
  currency: text("currency").notNull(),
  paid: boolean("paid").default(false).notNull(),
  providerUpdatedAt: timestamp("provider_updated_at", {
    withTimezone: true,
  }).notNull(),
  createdAt: created(),
});
export const subscriptions = pgTable("subscriptions", {
  id: text("id").primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  status: text("status").notNull(),
  periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
  periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  providerUpdatedAt: timestamp("provider_updated_at", {
    withTimezone: true,
  }).notNull(),
});
export const entitlements = pgTable(
  "entitlements",
  {
    id: id(),
    userId: uuid("user_id")
      .references(() => users.id)
      .notNull(),
    sourceOrderId: text("source_order_id")
      .references(() => orders.id)
      .notNull()
      .unique(),
    kind: text("kind", { enum: ["course", "monthly", "lifetime"] }).notNull(),
    courseId: uuid("course_id").references(() => courses.id),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (t) => [index("user_entitlements").on(t.userId)],
);
export const progress = pgTable(
  "lesson_progress",
  {
    id: id(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    lessonId: uuid("lesson_id")
      .references(() => lessons.id)
      .notNull(),
    position: integer("position").default(0).notNull(),
    intervals: jsonb("intervals").$type<Interval[]>().default([]).notNull(),
    completed: boolean("completed").default(false).notNull(),
    manualIncomplete: boolean("manual_incomplete").default(false).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [uniqueIndex("user_lesson_progress").on(t.userId, t.lessonId)],
);
export const playbackSessions = pgTable("playback_sessions", {
  id: id(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  lessonId: uuid("lesson_id")
    .references(() => lessons.id)
    .notNull(),
  sequence: integer("sequence").default(-1).notNull(),
  createdAt: created(),
});
export const refundRequests = pgTable(
  "refund_requests",
  {
    id: id(),
    userId: uuid("user_id")
      .references(() => users.id)
      .notNull(),
    orderId: text("order_id")
      .references(() => orders.id)
      .notNull(),
    reason: text("reason").notNull(),
    response: text("response").default("").notNull(),
    status: text("status", {
      enum: ["pending", "partial", "refunded", "declined"],
    })
      .default("pending")
      .notNull(),
    createdAt: created(),
  },
  (t) => [
    uniqueIndex("one_pending_refund")
      .on(t.orderId)
      .where(sql`${t.status} = 'pending'`),
  ],
);
export const webhookEvents = pgTable("webhook_events", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
  createdAt: created(),
  processedAt: timestamp("processed_at", { withTimezone: true }),
});
export const jobs = pgTable("jobs", {
  id: id(),
  key: text("key").unique().notNull(),
  type: text("type", {
    enum: ["webhook", "cancel_subscription", "delete_account"],
  }).notNull(),
  payload: jsonb("payload").$type<Record<string, string>>().notNull(),
  attempts: integer("attempts").default(0).notNull(),
  runAt: timestamp("run_at", { withTimezone: true }).defaultNow().notNull(),
  lockedUntil: timestamp("locked_until", { withTimezone: true }),
  lease: text("lease"),
  doneAt: timestamp("done_at", { withTimezone: true }),
  failedAt: timestamp("failed_at", { withTimezone: true }),
  lastError: text("last_error"),
  createdAt: created(),
});
export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").$type<Record<string, string>>().notNull(),
});
export const checkoutIntents = pgTable(
  "checkout_intents",
  {
    id: id(),
    userId: uuid("user_id")
      .references(() => users.id)
      .notNull(),
    offerId: uuid("offer_id")
      .references(() => offers.id)
      .notNull(),
    checkoutId: text("checkout_id"),
    url: text("url"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (t) => [uniqueIndex("one_checkout_offer").on(t.userId, t.offerId)],
);
export const rateLimits = pgTable("rate_limits", {
  key: text("key").primaryKey(),
  hits: integer("hits").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});
