const { Pool } = require('pg');

// Create a pool using environment variable settings
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: 5433, // Default PostgreSQL port
});

// Export a query method that any part of the application can use to execute SQL queries
module.exports = {
  query: (text, params) => pool.query(text, params),
};
