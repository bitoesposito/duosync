import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Retry connection configuration
  max: 1,
});

async function waitForDatabase(maxRetries = 30, delayMs = 1000) {
  console.log("Waiting for database to be ready...");
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const client = await pool.connect();
      await client.query("SELECT 1");
      client.release();
      console.log("Database is ready!");
      await pool.end();
      return true;
    } catch (error) {
      if (i < maxRetries - 1) {
        console.log(`Database is unavailable - attempt ${i + 1}/${maxRetries} - sleeping...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      } else {
        console.error("Failed to connect to database after all retries");
        await pool.end();
        throw error;
      }
    }
  }
  
  await pool.end();
  return false;
}

waitForDatabase()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error waiting for database:", error);
    process.exit(1);
  });

