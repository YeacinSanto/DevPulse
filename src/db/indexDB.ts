import {Pool} from "pg"
import config from "../config/indexConfig"

export const pool = new Pool({
    connectionString : config.connection_string
})

export const initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users(
        id SERIAL PRIMARY KEY,
        name VARCHAR(30),
        email VARCHAR(80) UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role VARCHAR(15) DEFAULT 'contributor',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS issues(
        id SERIAL PRIMARY KEY,
        title VARCHAR(150) NOT NULL,
        description TEXT NOT NULL,
        type VARCHAR(20) NOT NULL,
        status VARCHAR(15) DEFAULT 'open',
        reporter_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    console.log("Database connected successfully!!");
  } catch (error) {
    console.log(error);
  }
};