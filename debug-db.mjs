import { config } from 'dotenv';
config();
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(conn);

// Raw SQL to avoid schema import issues
const [agrs] = await conn.query('SELECT * FROM agreements LIMIT 10');
console.log('Agreements:', JSON.stringify(agrs, null, 2));

const [links] = await conn.query('SELECT slug, target_url, created_at FROM short_links LIMIT 10');
console.log('ShortLinks:', JSON.stringify(links, null, 2));

await conn.end();
