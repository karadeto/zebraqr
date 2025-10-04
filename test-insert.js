import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import {
  pgTable,
  text,
  boolean,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'
import 'dotenv/config'

// Define schema (updated - updatedAt without default)
const qrCodes = pgTable('qr_codes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  title: varchar('title', { length: 255 }),
  shortCode: varchar('short_code', { length: 8 }).notNull().unique(),
  destinationUrl: text('destination_url').notNull(),
  qrImageData: text('qr_image_data').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull(),
})

const connection = postgres(process.env.DATABASE_URL, {
  prepare: false,
  max: 1,
})

const db = drizzle(connection, { schema: { qrCodes } })

console.log('🧪 Testing QR code insert...')

try {
  const testData = {
    userId: '00000000-0000-0000-0000-000000000001',
    title: 'Test QR',
    shortCode: 'TST' + Math.random().toString(36).substring(2, 6).toUpperCase(),
    destinationUrl: 'https://example.com',
    qrImageData: 'data:image/png;base64,test',
    isActive: true,
    updatedAt: new Date(), // Explicitly set
  }

  console.log('📝 Inserting with updatedAt:', testData.updatedAt)

  const result = await db.insert(qrCodes).values(testData).returning()

  console.log('✅ Insert successful!')
  console.log('📦 Returned:')
  console.log('  - id:', result[0].id)
  console.log('  - shortCode:', result[0].shortCode)
  console.log('  - updatedAt:', result[0].updatedAt)

  // Clean up
  await connection`DELETE FROM qr_codes WHERE short_code = ${testData.shortCode}`
  console.log('🧹 Test record cleaned up')

  await connection.end()
  console.log('✅ Test completed successfully!')
} catch (error) {
  console.error('❌ Test failed:', error.message)
  await connection.end()
  process.exit(1)
}
