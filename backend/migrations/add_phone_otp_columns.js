const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { logger } = require('../utils/logger');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'database.sqlite');

const runMigration = () => {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        logger.error('Error opening database for migration:', err);
        reject(err);
        return;
      }

      logger.info('Connected to database for migration');

      // Check if columns already exist
      db.get("PRAGMA table_info(users)", (err, result) => {
        if (err) {
          logger.error('Error checking table info:', err);
          db.close();
          reject(err);
          return;
        }

        // Get all columns
        db.all("PRAGMA table_info(users)", (err, columns) => {
          if (err) {
            logger.error('Error getting column info:', err);
            db.close();
            reject(err);
            return;
          }

          const existingColumns = columns.map(col => col.name);
          const requiredColumns = ['phone_number', 'is_phone_verified', 'otp_code', 'otp_expires'];
          const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));

          if (missingColumns.length === 0) {
            logger.info('All required columns already exist. No migration needed.');
            db.close();
            resolve();
            return;
          }

          logger.info(`Adding missing columns: ${missingColumns.join(', ')}`);

          // Add missing columns one by one
          let completedCount = 0;
          const totalCount = missingColumns.length;

          const addColumn = (columnName, columnDef) => {
            const sql = `ALTER TABLE users ADD COLUMN ${columnName} ${columnDef}`;
            db.run(sql, (err) => {
              if (err) {
                logger.error(`Error adding column ${columnName}:`, err);
                db.close();
                reject(err);
                return;
              }

              logger.info(`Added column: ${columnName}`);
              completedCount++;

              if (completedCount === totalCount) {
                logger.info('All columns added successfully');
                db.close();
                resolve();
              }
            });
          };

          // Add each missing column (SQLite doesn't support UNIQUE constraint when adding columns)
          missingColumns.forEach(column => {
            switch (column) {
              case 'phone_number':
                addColumn('phone_number', 'TEXT');
                break;
              case 'is_phone_verified':
                addColumn('is_phone_verified', 'BOOLEAN DEFAULT FALSE');
                break;
              case 'otp_code':
                addColumn('otp_code', 'TEXT');
                break;
              case 'otp_expires':
                addColumn('otp_expires', 'DATETIME');
                break;
            }
          });
        });
      });
    });
  });
};

// Run migration if this file is executed directly
if (require.main === module) {
  runMigration()
    .then(() => {
      logger.info('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { runMigration };
