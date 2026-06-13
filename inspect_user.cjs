// Usage: node inspect_user.cjs <username>
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { createClient } = require('@libsql/client');

const username = process.argv[2];
if (!username) {
  console.error('Usage: node inspect_user.cjs <username>');
  process.exit(1);
}

async function main() {
  const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  const userRes = await db.execute({
    sql: 'SELECT id, username FROM users WHERE username = ?',
    args: [username.toLowerCase()],
  });

  if (userRes.rows.length === 0) {
    console.log(`No user found with username "${username}"`);
    return;
  }

  const userId = userRes.rows[0].id;
  console.log(`User "${username}" -> id = ${userId}`);

  const countRes = await db.execute({
    sql: 'SELECT COUNT(*) as count FROM trades WHERE userId = ?',
    args: [userId],
  });
  console.log(`Trade count: ${countRes.rows[0].count}`);

  const tradesRes = await db.execute({
    sql: 'SELECT id, symbol, screenshot, tags, executions, notes FROM trades WHERE userId = ?',
    args: [userId],
  });

  let totalBytes = 0;
  let biggest = { id: null, field: null, size: 0 };

  for (const row of tradesRes.rows) {
    for (const field of ['screenshot', 'tags', 'executions', 'notes']) {
      const val = row[field];
      const size = val ? Buffer.byteLength(String(val), 'utf8') : 0;
      totalBytes += size;
      if (size > biggest.size) {
        biggest = { id: row.id, field, size };
      }
    }
  }

  console.log(`Total size of trades payload (approx): ${(totalBytes / 1024).toFixed(2)} KB`);
  console.log(`Largest single field: trade=${biggest.id}, field=${biggest.field}, size=${(biggest.size / 1024).toFixed(2)} KB`);

  const configRes = await db.execute({
    sql: 'SELECT key, length(value) as len FROM config WHERE key LIKE ?',
    args: [`${userId}_%`],
  });
  console.log('Config rows for this user:');
  for (const row of configRes.rows) {
    console.log(`  ${row.key}: ${row.len} bytes`);
  }
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
