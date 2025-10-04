import postgres from 'postgres'
import 'dotenv/config'

const databaseUrl = process.env.DATABASE_URL

console.log('🔌 Testing Supabase Pooler connection...')
console.log('📍 URL:', databaseUrl.replace(/:[^:@]+@/, ':****@'))

const connection = postgres(databaseUrl, {
  prepare: false,
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10,
})

try {
  // Test basic query
  const result =
    await connection`SELECT NOW() as time, current_database() as db`
  console.log('✅ Pooler connection successful!')
  console.log('⏰ Server time:', result[0].time)
  console.log('💾 Database:', result[0].db)

  // Test qr_codes table
  const count = await connection`SELECT COUNT(*) as count FROM qr_codes`
  console.log('📊 QR codes count:', count[0].count)

  // Test select with where clause (like in the failing queries)
  const testUserId = '932c1b05-16ea-4d3a-a256-784a7c60b657'
  const userCount = await connection`
    SELECT COUNT(*) as count FROM qr_codes WHERE user_id = ${testUserId}
  `
  console.log(`📊 QR codes for test user: ${userCount[0].count}`)

  await connection.end()
  console.log('✅ All tests passed!')
} catch (error) {
  console.error('❌ Test failed:', error.message)
  console.error('Error code:', error.code)
  await connection.end()
  process.exit(1)
}
