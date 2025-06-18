
import { Pool } from 'pg';

let pool: Pool;

const initializePool = async () => {
  if (!process.env.POSTGRES_URL) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('POSTGRES_URL environment variable is not set in production');
    } else {
      console.warn('--------------------------------------------------------------------------------------');
      console.warn('WARNING: POSTGRES_URL environment variable is not set.');
      console.warn('Database queries will fail. Please set POSTGRES_URL in your .env.local file.');
      console.warn('Example: POSTGRES_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"');
      console.warn('--------------------------------------------------------------------------------------');
      // Provide a mock pool for development if no URL is set
      return {
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
    const newPool = new Pool({
      connectionString: process.env.POSTGRES_URL,
      // ssl: {
      //   rejectUnauthorized: false // For some cloud providers or local setups without proper SSL
      // }
    });

    try {
      const client = await newPool.connect();
      await client.query('SELECT NOW()');
      client.release();
      console.log('Successfully connected to PostgreSQL database via connection string.');
    } catch (error: any) {
      console.error('--------------------------------------------------------------------------------------');
      console.error('CRITICAL: Failed to connect to PostgreSQL database using the provided POSTGRES_URL.');
      console.error('Provided POSTGRES_URL:', process.env.POSTGRES_URL.replace(/:[^@:]*@/, ':********@')); // Mask password
      console.error('Error:', error.message);
      if (error.code === 'ECONNREFUSED') {
        console.error(`This usually means the PostgreSQL server is not running or not accessible at ${error.address}:${error.port}.`);
        console.error('Please ensure your PostgreSQL server is running and your POSTGRES_URL in .env.local is correct.');
      } else if (error.code === '28P01' || error.routine === 'auth_failed') {
         console.error('This usually means authentication failed. Check your username and password in POSTGRES_URL.');
      } else if (error.code === '3D000') {
        console.error('This usually means the database specified in POSTGRES_URL does not exist.');
      }
      console.error('--------------------------------------------------------------------------------------');
      // Depending on desired behavior, you might want to throw the error or exit the process
      // For now, we'll allow the app to start but queries will likely fail.
    }
    return newPool;
  }
};

// Initialize the pool when the module is loaded.
// Note: Top-level await is not used here to ensure wider compatibility,
// so pool might be undefined for a brief moment.
// However, Next.js API routes and server components will typically await its availability.
let poolInitializationPromise = initializePool().then(p => {
  pool = p;
  return p;
});


export const getPool = async (): Promise<Pool> => {
  if (!pool) {
    pool = await poolInitializationPromise;
  }
  return pool;
};

export const query = async (text: string, params?: any[]) => {
  const currentPool = await getPool();
  return currentPool.query(text, params);
};

// Optional: A function to test the connection (can be called explicitly if needed)
export const testConnection = async () => {
  if (!process.env.POSTGRES_URL) {
    console.log("Skipping DB connection test: POSTGRES_URL not set.");
    return;
  }
  try {
    const currentPool = await getPool();
    const client = await currentPool.connect(); // Test connect explicitly
    await client.query('SELECT NOW()');
    client.release();
    console.log('Successfully connected to PostgreSQL database (explicit test).');
  } catch (error) {
    console.error('Failed to connect to PostgreSQL database (explicit test):', error);
  }
};

// If you want to run testConnection on module load for immediate feedback in dev
if (process.env.NODE_ENV !== 'production' && process.env.POSTGRES_URL) {
  // testConnection(); // This might be redundant if initializePool does a thorough check
}
