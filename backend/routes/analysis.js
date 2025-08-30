const express = require('express');
const { getDatabase } = require('../config/database');
const LogAnalyzer = require('../services/logAnalyzer');
const { logger } = require('../utils/logger');

const router = express.Router();

/**
 * GET /api/analysis/dashboard
 * Get dashboard summary data
 */
router.get('/dashboard', async (req, res) => {
  try {
    const db = getDatabase();

    // Get total files count
    const totalFiles = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM log_files', (err, row) => {
        if (err) reject(err);
        else resolve(row.count);
      });
    });

    // Get recent analyses
    const recentAnalyses = await new Promise((resolve, reject) => {
      db.all(
        `SELECT lf.original_name, lf.upload_date, ar.created_at, ar.results
         FROM log_files lf 
         JOIN analysis_results ar ON lf.id = ar.log_file_id
         ORDER BY ar.created_at DESC LIMIT 5`,
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    // Get aggregated stats
    const stats = await new Promise((resolve, reject) => {
      db.all(
        `SELECT 
           SUM(CASE WHEN level = 'ERROR' THEN 1 ELSE 0 END) as total_errors,
           SUM(CASE WHEN level = 'WARN' THEN 1 ELSE 0 END) as total_warnings,
           COUNT(*) as total_entries
         FROM log_entries`,
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows[0]);
        }
      );
    });

    // Process recent analyses to extract key metrics
    const dashboardData = {
      overview: {
        totalFiles,
        totalLogEntries: stats.total_entries || 0,
        totalErrors: stats.total_errors || 0,
        totalWarnings: stats.total_warnings || 0
      },
      recentAnalyses: recentAnalyses.map(analysis => {
        const results = JSON.parse(analysis.results);
        return {
          filename: analysis.original_name,
          uploadDate: analysis.upload_date,
          analysisDate: analysis.created_at,
          errorCount: results.errorCount,
          totalLines: results.totalLines,
          insights: results.insights.length
        };
      })
    };

    res.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    logger.error('Error fetching dashboard data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard data'
    });
  }
});

/**
 * GET /api/analysis/trends
 * Get trending patterns across all analyzed logs
 */
router.get('/trends', async (req, res) => {
  try {
    const db = getDatabase();

    // Get all analysis results
    const analyses = await new Promise((resolve, reject) => {
      db.all(
        'SELECT results, created_at FROM analysis_results ORDER BY created_at DESC LIMIT 50',
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    const trends = {
      errorTrends: [],
      patternTrends: [],
      anomalyTrends: []
    };

    // Aggregate data from all analyses
    const allPatterns = [];
    const allAnomalies = [];
    const errorRates = [];

    analyses.forEach(analysis => {
      const results = JSON.parse(analysis.results);
      
      // Collect error rates over time
      errorRates.push({
        date: analysis.created_at,
        errorRate: (results.errorCount / results.parsedLines * 100).toFixed(2)
      });

      // Collect patterns
      if (results.patterns) {
        allPatterns.push(...results.patterns);
      }

      // Collect anomalies
      if (results.anomalies) {
        allAnomalies.push(...results.anomalies);
      }
    });

    // Analyze error trends
    trends.errorTrends = errorRates.slice(0, 20);

    // Find most common patterns
    const patternCounts = {};
    allPatterns.forEach(pattern => {
      const key = pattern.pattern || pattern.type;
      patternCounts[key] = (patternCounts[key] || 0) + 1;
    });

    trends.patternTrends = Object.entries(patternCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([pattern, count]) => ({ pattern, count }));

    // Analyze anomaly trends
    const anomalyCounts = {};
    allAnomalies.forEach(anomaly => {
      anomalyCounts[anomaly.type] = (anomalyCounts[anomaly.type] || 0) + 1;
    });

    trends.anomalyTrends = Object.entries(anomalyCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => ({ type, count }));

    res.json({
      success: true,
      data: trends
    });

  } catch (error) {
    logger.error('Error fetching trends:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch trends data'
    });
  }
});

/**
 * POST /api/analysis/compare
 * Compare analysis results between multiple log files
 */
router.post('/compare', async (req, res) => {
  try {
    const { fileIds } = req.body;
    
    if (!fileIds || !Array.isArray(fileIds) || fileIds.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'At least 2 file IDs are required for comparison'
      });
    }

    const db = getDatabase();
    const comparisons = [];

    // Get analysis results for each file
    for (const fileId of fileIds) {
      const analysis = await new Promise((resolve, reject) => {
        db.get(
          `SELECT lf.original_name, ar.results, ar.created_at
           FROM log_files lf
           JOIN analysis_results ar ON lf.id = ar.log_file_id
           WHERE lf.id = ?
           ORDER BY ar.created_at DESC LIMIT 1`,
          [fileId],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });

      if (analysis) {
        const results = JSON.parse(analysis.results);
        comparisons.push({
          filename: analysis.original_name,
          errorRate: (results.errorCount / results.parsedLines * 100).toFixed(2),
          totalLines: results.totalLines,
          errorCount: results.errorCount,
          patterns: results.patterns.length,
          anomalies: results.anomalies.length,
          analysisDate: analysis.created_at
        });
      }
    }

    // Generate comparison insights
    const insights = [];
    
    if (comparisons.length >= 2) {
      const errorRates = comparisons.map(c => parseFloat(c.errorRate));
      const maxErrorRate = Math.max(...errorRates);
      const minErrorRate = Math.min(...errorRates);
      
      if (maxErrorRate - minErrorRate > 5) {
        insights.push({
          type: 'error_rate_variance',
          description: `Significant variance in error rates: ${minErrorRate}% to ${maxErrorRate}%`,
          recommendation: 'Investigate systems with higher error rates'
        });
      }

      // Compare patterns
      const totalPatterns = comparisons.reduce((sum, c) => sum + c.patterns, 0);
      const avgPatterns = totalPatterns / comparisons.length;
      
      comparisons.forEach(comp => {
        if (comp.patterns > avgPatterns * 1.5) {
          insights.push({
            type: 'high_pattern_count',
            description: `${comp.filename} has unusually high pattern count: ${comp.patterns}`,
            recommendation: 'Review this system for recurring issues'
          });
        }
      });
    }

    res.json({
      success: true,
      data: {
        comparisons,
        insights
      }
    });

  } catch (error) {
    logger.error('Error comparing analyses:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to compare analyses'
    });
  }
});

/**
 * POST /api/analysis/reanalyze/:id
 * Re-analyze a specific log file with updated algorithms
 */
router.post('/reanalyze/:id', async (req, res) => {
  try {
    const db = getDatabase();
    const fileId = req.params.id;
    const logAnalyzer = new LogAnalyzer();

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

    // Read the file content
    const fs = require('fs').promises;
    const fileContent = await fs.readFile(file.file_path, 'utf8');

    // Re-analyze
    const analysisResult = await logAnalyzer.analyzeLogFile(fileContent, file.original_name);

    // Save new analysis results
    await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO analysis_results (log_file_id, analysis_type, results, insights, anomalies, patterns) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          fileId,
          'reanalysis',
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

    logger.info(`Re-analyzed log file: ${file.original_name}`);

    res.json({
      success: true,
      data: {
        analysis: analysisResult.analysis,
        summary: logAnalyzer.generateSummaryStats(analysisResult.analysis, analysisResult.parsedEntries)
      }
    });

  } catch (error) {
    logger.error('Error re-analyzing log file:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to re-analyze log file'
    });
  }
});

module.exports = router;
