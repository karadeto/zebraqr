import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'

export const qrCodes = pgTable(
  'qr_codes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull(),
    title: varchar('title', { length: 255 }),
    shortCode: varchar('short_code', { length: 8 }).notNull().unique(),
    destinationUrl: text('destination_url').notNull(),
    qrImageData: text('qr_image_data').notNull(),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull(),
  },
  (table) => ({
    userIdCreatedAtIdx: index('qr_codes_user_id_created_at_idx').on(
      table.userId,
      table.createdAt,
    ),
    shortCodeIdx: index('qr_codes_short_code_idx').on(table.shortCode),
  }),
)

export type QRCode = typeof qrCodes.$inferSelect
export type NewQRCode = typeof qrCodes.$inferInsert
