import mysql from 'mysql2/promise';

// Debug environment variables
console.log('DB Environment variables:', {
  DB_HOST: process.env.DB_HOST,
  DB_USERNAME: process.env.DB_USERNAME,
  DB_NAME: process.env.DB_NAME,
  hasPassword: !!process.env.DB_PASSWORD
});

if (!process.env.DB_HOST || !process.env.DB_USERNAME || !process.env.DB_NAME) {
  console.error('❌ Missing required database environment variables');
  console.error('Please check your .env.local file configuration');
}

export const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  // For AWS RDS/EC2 MySQL, you might need to adjust SSL settings
  // ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});
