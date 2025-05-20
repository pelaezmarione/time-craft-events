
import mysql from 'mysql2/promise';

// Database configuration - you'll need to fill these with your Microsoft MySQL details
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'calendar_db',
  port: Number(process.env.DB_PORT) || 3306
};

// Create a pool of connections
export const pool = mysql.createPool(dbConfig);

// Helper function to execute database queries
export async function query(sql: string, params: any[] = []) {
  try {
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    console.error('Database error:', error);
    throw error;
  }
}
