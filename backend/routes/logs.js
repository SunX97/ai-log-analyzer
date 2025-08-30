const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('../config/database');
const LogAnalyzer = require('../services/logAnalyzer');
const { logger } = require('../utils/logger');

const router = express.Router();

// Temporarily removed authentication for troubleshooting

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept log files and text files
    const allowedTypes = ['.log', '.txt', '.out', '.err'];
    const fileExt = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(fileExt) || file.mimetype.startsWith('text/')) {
      cb(null, true);
    } else {
      cb(new Error('Only log and text files are allowed'), false);
    }
  }
});

/**
 * POST /api/logs/upload
 * Upload and analyze a log file
 */
router.post('/upload', upload.single('logFile'), async (req, res) => {
  try {
    logger.info('Upload request received');
    
    if (!req.file) {
      logger.warn('No file in upload request');
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }
    
    logger.info(`File uploaded: ${req.file.originalname}, size: ${req.file.size} bytes`);

    const db = getDatabase();
    const logAnalyzer = new LogAnalyzer();

    // Read the uploaded file
    const fileContent = await fs.readFile(req.file.path, 'utf8');
    
    // Save file info to database
    const fileRecord = await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO log_files (filename, original_name, file_path, file_size, status) 
         VALUES (?, ?, ?, ?, ?)`,
        [req.file.filename, req.file.originalname, req.file.path, req.file.size, 'processing'],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID });
        }
      );
    });

    // Analyze the log file
    const analysisResult = await logAnalyzer.analyzeLogFile(fileContent, req.file.originalname);
    
    // Save analysis results
    await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO analysis_results (log_file_id, analysis_type, results, insights, anomalies, patterns) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          fileRecord.id,
          'full_analysis',
          JSON.stringify(analysisResult.analysis),
          JSON.stringify(analysisResult.analysis.insights),
          JSON.stringify(analysisResult.analysis.anomalies),
          JSON.stringify(analysisResult.analysis.patterns)
        ],
        function(err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    // Save parsed log entries (sample for performance)
    const entriesToSave = analysisResult.parsedEntries.slice(0, 500);
    for (const entry of entriesToSave) {
      await new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO log_entries (log_file_id, timestamp, level, message, raw_line, line_number) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            fileRecord.id,
            entry.timestamp,
            entry.level,
            entry.message,
            entry.rawLine,
            entry.lineNumber
          ],
          function(err) {
            if (err) reject(err);
            else resolve();
          }
        );
      });
    }

    // Update file status
    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE log_files SET status = ? WHERE id = ?',
        ['analyzed', fileRecord.id],
        function(err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    logger.info(`Successfully analyzed log file: ${req.file.originalname}`);

    res.json({
      success: true,
      data: {
        fileId: fileRecord.id,
        filename: req.file.originalname,
        analysis: analysisResult.analysis,
        summary: logAnalyzer.generateSummaryStats(analysisResult.analysis, analysisResult.parsedEntries)
      }
    });

  } catch (error) {
    logger.error('Error processing log upload:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process log file: ' + error.message
    });
  }
});

/**
 * GET /api/logs
 * Get list of uploaded log files
 */
router.get('/', async (req, res) => {
  try {
    const db = getDatabase();
    
    const files = await new Promise((resolve, reject) => {
      db.all(
        'SELECT id, original_name, file_size, upload_date, status FROM log_files ORDER BY upload_date DESC',
        [],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    res.json({
      success: true,
      data: files
    });

  } catch (error) {
    logger.error('Error fetching log files:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch log files'
    });
  }
});

/**
 * GET /api/logs/:id
 * Get specific log file details and analysis
 */
router.get('/:id', async (req, res) => {
  try {
    const db = getDatabase();
    const fileId = req.params.id;

    // Get file info
    const file = await new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM log_files WHERE id = ?',
        [fileId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        error: 'Log file not found'
      });
    }

    // Get analysis results
    const analysis = await new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM analysis_results WHERE log_file_id = ? ORDER BY created_at DESC LIMIT 1',
        [fileId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    // Get sample log entries
    const entries = await new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM log_entries WHERE log_file_id = ? ORDER BY line_number LIMIT 100',
        [fileId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    res.json({
      success: true,
      data: {
        file,
        analysis: analysis ? JSON.parse(analysis.results) : null,
        entries
      }
    });

  } catch (error) {
    logger.error('Error fetching log file details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch log file details'
    });
  }
});

/**
 * DELETE /api/logs/:id
 * Delete a log file and its analysis
 */
router.delete('/:id', async (req, res) => {
  try {
    const db = getDatabase();
    const fileId = req.params.id;

    // Get file info first
    const file = await new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM log_files WHERE id = ?',
        [fileId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        error: 'Log file not found'
      });
    }

    // Delete file from filesystem
    try {
      await fs.unlink(file.file_path);
    } catch (fsError) {
      logger.warn(`Failed to delete file from filesystem: ${fsError.message}`);
    }

    // Delete from database
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM log_entries WHERE log_file_id = ?', [fileId], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    await new Promise((resolve, reject) => {
      db.run('DELETE FROM analysis_results WHERE log_file_id = ?', [fileId], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    await new Promise((resolve, reject) => {
      db.run('DELETE FROM log_files WHERE id = ?', [fileId], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    logger.info(`Deleted log file: ${file.original_name}`);

    res.json({
      success: true,
      message: 'Log file deleted successfully'
    });

  } catch (error) {
    logger.error('Error deleting log file:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete log file'
    });
  }
});

module.exports = router;
