
import { Pool } from 'pg';

let pool: Pool;

if (!process.env.POSTGRES_URL) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('POSTGRES_URL environment variable is not set in production');
  } else {
    console.warn('POSTGRES_URL environment variable is not set. Database queries will fail.');
    // Provide a mock pool for development if no URL is set, to avoid crashing server start
    // but operations will fail.
    pool = {
        query: async () => { 
            console.error("Database not configured. POSTGRES_URL is missing.");
            throw new Error("Database not configured.");
        },
        connect: async () => {
            console.error("Database not configured. POSTGRES_URL is missing.");
            throw new Error("Database not configured.");
        }
    } as any as Pool;
  }
} else {
  pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    // You might want to add SSL configuration here if required by your provider
    // ssl: {
    //   rejectUnauthorized: false // Or more specific SSL configuration
    // }
  });
}


export const query = (text: string, params?: any[]) => pool.query(text, params);

// Optional: A function to test the connection
export const testConnection = async () => {
  if (!process.env.POSTGRES_URL) {
    console.log("Skipping DB connection test: POSTGRES_URL not set.");
    return;
  }
  try {
    await pool.query('SELECT NOW()');
    console.log('Successfully connected to PostgreSQL database.');
  } catch (error) {
    console.error('Failed to connect to PostgreSQL database:', error);
  }
};
