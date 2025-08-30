const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { logger } = require('../utils/logger');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'database.sqlite');

let db;

const initializeDatabase = () => {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        logger.error('Error opening database:', err);
        reject(err);
        return;
      }
      
      logger.info('Connected to SQLite database');
      
      // Create tables
      const createTables = `
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS log_files (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          filename TEXT NOT NULL,
          original_name TEXT NOT NULL,
          file_path TEXT NOT NULL,
          file_size INTEGER,
          upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
          status TEXT DEFAULT 'uploaded',
          FOREIGN KEY (user_id) REFERENCES users (id)
        );

        CREATE TABLE IF NOT EXISTS analysis_results (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          log_file_id INTEGER,
          analysis_type TEXT NOT NULL,
          results TEXT NOT NULL,
          insights TEXT,
          anomalies TEXT,
          patterns TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (log_file_id) REFERENCES log_files (id)
        );

        CREATE TABLE IF NOT EXISTS log_entries (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          log_file_id INTEGER,
          timestamp DATETIME,
          level TEXT,
          message TEXT,
          source TEXT,
          raw_line TEXT,
          line_number INTEGER,
          parsed_data TEXT,
          FOREIGN KEY (log_file_id) REFERENCES log_files (id)
        );

        CREATE INDEX IF NOT EXISTS idx_log_entries_timestamp ON log_entries(timestamp);
        CREATE INDEX IF NOT EXISTS idx_log_entries_level ON log_entries(level);
        CREATE INDEX IF NOT EXISTS idx_analysis_results_type ON analysis_results(analysis_type);
      `;

      db.exec(createTables, (err) => {
        if (err) {
          logger.error('Error creating tables:', err);
          reject(err);
          return;
        }
        
        logger.info('Database tables created successfully');
        resolve();
      });
    });
  });
};

const getDatabase = () => {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
};

const closeDatabase = () => {
  return new Promise((resolve) => {
    if (db) {
      db.close((err) => {
        if (err) {
          logger.error('Error closing database:', err);
        } else {
          logger.info('Database connection closed');
        }
        resolve();
      });
    } else {
      resolve();
    }
  });
};

module.exports = {
  initializeDatabase,
  getDatabase,
  closeDatabase
};
