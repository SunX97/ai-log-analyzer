const natural = require('natural');
const moment = require('moment');
const _ = require('lodash');
const { logger } = require('../utils/logger');

class LogAnalyzer {
  constructor() {
    this.tokenizer = new natural.WordTokenizer();
    this.stemmer = natural.PorterStemmer;
    this.sentiment = new natural.SentimentAnalyzer('English', 
      natural.PorterStemmer, ['negation']);
    
    // Common log level patterns
    this.logLevelPatterns = {
      ERROR: /\b(error|err|exception|fail|fatal|critical)\b/i,
      WARN: /\b(warn|warning|caution)\b/i,
      INFO: /\b(info|information|notice)\b/i,
      DEBUG: /\b(debug|trace|verbose)\b/i
    };

    // Common timestamp patterns
    this.timestampPatterns = [
      /\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/,
      /\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}/,
      /\w{3} \d{2} \d{2}:\d{2}:\d{2}/,
      /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
      /\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\]/
    ];

    // Error patterns for anomaly detection
    this.errorPatterns = [
      /\b(timeout|connection.*refused|out.*of.*memory|null.*pointer|segmentation.*fault)\b/i,
      /\b(404|500|502|503|504)\b/,
      /\b(failed.*to.*connect|database.*error|authentication.*failed)\b/i,
      /\b(stack.*trace|exception|error.*code)\b/i
    ];
  }

  /**
   * Parse a single log line and extract structured information
   */
  parseLogLine(line, lineNumber) {
    const parsed = {
      lineNumber,
      rawLine: line.trim(),
      timestamp: null,
      level: 'UNKNOWN',
      message: '',
      source: null,
      isError: false,
      tokens: []
    };

    if (!line.trim()) return null;

    // Extract timestamp
    for (const pattern of this.timestampPatterns) {
      const match = line.match(pattern);
      if (match) {
        parsed.timestamp = this.parseTimestamp(match[0]);
        break;
      }
    }

    // Extract log level
    for (const [level, pattern] of Object.entries(this.logLevelPatterns)) {
      if (pattern.test(line)) {
        parsed.level = level;
        break;
      }
    }

    // Check for errors
    parsed.isError = this.errorPatterns.some(pattern => pattern.test(line));

    // Extract message (remove timestamp and level indicators)
    parsed.message = line
      .replace(/^\[?\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}[^\]]*\]?\s*/, '')
      .replace(/^\w{3} \d{2} \d{2}:\d{2}:\d{2}\s*/, '')
      .replace(/^\[(ERROR|WARN|INFO|DEBUG)\]\s*/i, '')
      .trim();

    // Tokenize for further analysis
    parsed.tokens = this.tokenizer.tokenize(parsed.message.toLowerCase()) || [];

    return parsed;
  }

  /**
   * Parse timestamp from various formats
   */
  parseTimestamp(timestampStr) {
    const formats = [
      'YYYY-MM-DD HH:mm:ss',
      'MM/DD/YYYY HH:mm:ss',
      'MMM DD HH:mm:ss',
      'YYYY-MM-DDTHH:mm:ss',
      '[YYYY-MM-DD HH:mm:ss]'
    ];

    for (const format of formats) {
      const parsed = moment(timestampStr, format, true);
      if (parsed.isValid()) {
        return parsed.toDate();
      }
    }

    return null;
  }

  /**
   * Analyze log file content and return comprehensive insights
   */
  async analyzeLogFile(content, filename) {
    try {
      const lines = content.split('\n');
      const parsedEntries = [];
      const analysis = {
        filename,
        totalLines: lines.length,
        parsedLines: 0,
        timeRange: { start: null, end: null },
        logLevels: { ERROR: 0, WARN: 0, INFO: 0, DEBUG: 0, UNKNOWN: 0 },
        errorCount: 0,
        patterns: [],
        anomalies: [],
        insights: [],
        topErrors: [],
        timeline: [],
        performance: {}
      };

      // Parse each line
      for (let i = 0; i < lines.length; i++) {
        const parsed = this.parseLogLine(lines[i], i + 1);
        if (parsed) {
          parsedEntries.push(parsed);
          analysis.parsedLines++;
          analysis.logLevels[parsed.level]++;
          
          if (parsed.isError) {
            analysis.errorCount++;
          }

          // Update time range
          if (parsed.timestamp) {
            if (!analysis.timeRange.start || parsed.timestamp < analysis.timeRange.start) {
              analysis.timeRange.start = parsed.timestamp;
            }
            if (!analysis.timeRange.end || parsed.timestamp > analysis.timeRange.end) {
              analysis.timeRange.end = parsed.timestamp;
            }
          }
        }
      }

      // Perform advanced analysis
      analysis.patterns = this.detectPatterns(parsedEntries);
      analysis.anomalies = this.detectAnomalies(parsedEntries);
      analysis.insights = this.generateInsights(analysis, parsedEntries);
      analysis.topErrors = this.getTopErrors(parsedEntries);
      analysis.timeline = this.generateTimeline(parsedEntries);
      analysis.performance = this.analyzePerformance(parsedEntries);

      return {
        analysis,
        parsedEntries: parsedEntries.slice(0, 1000) // Limit for performance
      };
    } catch (error) {
      logger.error('Error analyzing log file:', error);
      throw new Error('Failed to analyze log file: ' + error.message);
    }
  }

  /**
   * Detect common patterns in log entries
   */
  detectPatterns(entries) {
    const patterns = [];

    // Frequency analysis of error messages
    const errorMessages = entries
      .filter(entry => entry.isError)
      .map(entry => entry.message);

    const messageFrequency = _.countBy(errorMessages, msg => 
      msg.replace(/\d+/g, 'X').replace(/[a-f0-9]{8,}/gi, 'HASH')
    );

    Object.entries(messageFrequency)
      .filter(([, count]) => count > 1)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([pattern, count]) => {
        patterns.push({
          type: 'recurring_error',
          pattern,
          frequency: count,
          severity: 'high'
        });
      });

    // Time-based patterns
    const timeGrouped = _.groupBy(entries.filter(e => e.timestamp), entry => 
      moment(entry.timestamp).format('YYYY-MM-DD HH')
    );

    const hourlyErrorCounts = Object.entries(timeGrouped).map(([hour, entries]) => ({
      hour,
      errorCount: entries.filter(e => e.isError).length,
      totalCount: entries.length
    }));

    const avgErrorsPerHour = _.meanBy(hourlyErrorCounts, 'errorCount');
    const highErrorHours = hourlyErrorCounts.filter(h => 
      h.errorCount > avgErrorsPerHour * 2
    );

    if (highErrorHours.length > 0) {
      patterns.push({
        type: 'error_spike',
        pattern: `High error rates detected in ${highErrorHours.length} time periods`,
        details: highErrorHours,
        severity: 'medium'
      });
    }

    return patterns;
  }

  /**
   * Detect anomalies in log data
   */
  detectAnomalies(entries) {
    const anomalies = [];

    // Sudden increase in error rate
    const errorsByMinute = _.groupBy(
      entries.filter(e => e.timestamp && e.isError),
      entry => moment(entry.timestamp).format('YYYY-MM-DD HH:mm')
    );

    const errorCounts = Object.values(errorsByMinute).map(errors => errors.length);
    const avgErrors = _.mean(errorCounts);
    const stdDev = this.calculateStandardDeviation(errorCounts, avgErrors);

    Object.entries(errorsByMinute).forEach(([minute, errors]) => {
      if (errors.length > avgErrors + (2 * stdDev)) {
        anomalies.push({
          type: 'error_spike',
          timestamp: minute,
          value: errors.length,
          expected: Math.round(avgErrors),
          severity: 'high',
          description: `Unusual spike in errors: ${errors.length} errors in 1 minute`
        });
      }
    });

    // Long silence periods
    const timestamps = entries
      .filter(e => e.timestamp)
      .map(e => e.timestamp)
      .sort();

    for (let i = 1; i < timestamps.length; i++) {
      const gap = (timestamps[i] - timestamps[i-1]) / 1000 / 60; // minutes
      if (gap > 30) { // More than 30 minutes gap
        anomalies.push({
          type: 'silence_period',
          start: timestamps[i-1],
          end: timestamps[i],
          duration: Math.round(gap),
          severity: 'medium',
          description: `${Math.round(gap)} minute gap in logging activity`
        });
      }
    }

    // Unusual patterns in log messages
    const uniqueMessages = [...new Set(entries.map(e => e.message))];
    if (uniqueMessages.length < entries.length * 0.1) {
      anomalies.push({
        type: 'repetitive_messages',
        value: uniqueMessages.length,
        total: entries.length,
        severity: 'low',
        description: 'High repetition in log messages detected'
      });
    }

    return anomalies;
  }

  /**
   * Generate intelligent insights from the analysis
   */
  generateInsights(analysis, entries) {
    const insights = [];

    // Error rate insights
    const errorRate = (analysis.errorCount / analysis.parsedLines * 100).toFixed(2);
    insights.push({
      type: 'error_rate',
      value: `${errorRate}%`,
      description: `Error rate is ${errorRate}%`,
      recommendation: errorRate > 5 ? 
        'High error rate detected. Consider investigating root causes.' :
        'Error rate is within normal range.'
    });

    // Time span analysis
    if (analysis.timeRange.start && analysis.timeRange.end) {
      const duration = moment(analysis.timeRange.end).diff(
        moment(analysis.timeRange.start), 'hours'
      );
      insights.push({
        type: 'time_span',
        value: `${duration} hours`,
        description: `Log data spans ${duration} hours`,
        recommendation: duration > 24 ? 
          'Consider archiving older logs for better performance.' :
          'Time span is manageable for analysis.'
      });
    }

    // Log level distribution
    const totalLogs = Object.values(analysis.logLevels).reduce((a, b) => a + b, 0);
    const errorPercentage = (analysis.logLevels.ERROR / totalLogs * 100).toFixed(1);
    
    if (errorPercentage > 10) {
      insights.push({
        type: 'log_distribution',
        value: `${errorPercentage}% errors`,
        description: 'High proportion of error messages',
        recommendation: 'Review error handling and logging practices.'
      });
    }

    // Pattern-based insights
    const uniqueErrors = new Set(
      entries.filter(e => e.isError).map(e => e.message)
    ).size;
    
    if (uniqueErrors > 0) {
      insights.push({
        type: 'error_diversity',
        value: `${uniqueErrors} unique error types`,
        description: `Found ${uniqueErrors} different error patterns`,
        recommendation: uniqueErrors > 20 ? 
          'High error diversity suggests multiple system issues.' :
          'Error patterns are focused and manageable.'
      });
    }

    return insights;
  }

  /**
   * Get top error messages by frequency
   */
  getTopErrors(entries) {
    const errorEntries = entries.filter(entry => entry.isError);
    const errorCounts = _.countBy(errorEntries, 'message');
    
    return Object.entries(errorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([message, count]) => ({
        message: message.substring(0, 200), // Truncate long messages
        count,
        percentage: ((count / errorEntries.length) * 100).toFixed(1)
      }));
  }

  /**
   * Generate timeline data for visualization
   */
  generateTimeline(entries) {
    const timelineData = [];
    
    // Group by hour
    const hourlyGroups = _.groupBy(
      entries.filter(e => e.timestamp),
      entry => moment(entry.timestamp).format('YYYY-MM-DD HH:00')
    );

    Object.entries(hourlyGroups).forEach(([hour, hourEntries]) => {
      timelineData.push({
        timestamp: hour,
        total: hourEntries.length,
        errors: hourEntries.filter(e => e.isError).length,
        warnings: hourEntries.filter(e => e.level === 'WARN').length,
        info: hourEntries.filter(e => e.level === 'INFO').length
      });
    });

    return timelineData.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }

  /**
   * Analyze performance metrics from logs
   */
  analyzePerformance(entries) {
    const performance = {
      responseTimePattern: null,
      slowRequests: [],
      throughputAnalysis: null
    };

    // Look for response time patterns
    const responseTimeRegex = /(\d+)(?:ms|milliseconds?)/i;
    const responseTimes = [];

    entries.forEach(entry => {
      const match = entry.message.match(responseTimeRegex);
      if (match) {
        responseTimes.push(parseInt(match[1]));
      }
    });

    if (responseTimes.length > 0) {
      performance.responseTimePattern = {
        average: _.mean(responseTimes).toFixed(2),
        median: this.calculateMedian(responseTimes),
        p95: this.calculatePercentile(responseTimes, 95),
        max: Math.max(...responseTimes),
        count: responseTimes.length
      };

      // Identify slow requests (> 2 standard deviations from mean)
      const avgResponseTime = _.mean(responseTimes);
      const stdDev = this.calculateStandardDeviation(responseTimes, avgResponseTime);
      const slowThreshold = avgResponseTime + (2 * stdDev);

      performance.slowRequests = entries.filter(entry => {
        const match = entry.message.match(responseTimeRegex);
        return match && parseInt(match[1]) > slowThreshold;
      }).slice(0, 20); // Limit to top 20
    }

    return performance;
  }

  /**
   * Calculate standard deviation
   */
  calculateStandardDeviation(values, mean) {
    const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
    return Math.sqrt(_.mean(squaredDiffs));
  }

  /**
   * Calculate median value
   */
  calculateMedian(values) {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? 
      (sorted[mid - 1] + sorted[mid]) / 2 : 
      sorted[mid];
  }

  /**
   * Calculate percentile value
   */
  calculatePercentile(values, percentile) {
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * Perform sentiment analysis on log messages
   */
  analyzeSentiment(entries) {
    const textEntries = entries.filter(e => e.message && e.message.length > 10);
    
    if (textEntries.length === 0) return null;

    const sentiments = textEntries.map(entry => {
      const tokens = this.tokenizer.tokenize(entry.message.toLowerCase());
      const stemmedTokens = tokens.map(token => this.stemmer.stem(token));
      return natural.SentimentAnalyzer.getSentiment(stemmedTokens);
    });

    const avgSentiment = _.mean(sentiments);
    
    return {
      average: avgSentiment.toFixed(3),
      distribution: {
        positive: sentiments.filter(s => s > 0.1).length,
        neutral: sentiments.filter(s => s >= -0.1 && s <= 0.1).length,
        negative: sentiments.filter(s => s < -0.1).length
      },
      interpretation: avgSentiment > 0.1 ? 'Positive' : 
                     avgSentiment < -0.1 ? 'Negative' : 'Neutral'
    };
  }

  /**
   * Generate summary statistics
   */
  generateSummaryStats(analysis, entries) {
    return {
      overview: {
        totalLines: analysis.totalLines,
        parsedLines: analysis.parsedLines,
        parsingRate: ((analysis.parsedLines / analysis.totalLines) * 100).toFixed(1) + '%',
        timeSpan: analysis.timeRange.start && analysis.timeRange.end ? 
          moment(analysis.timeRange.end).diff(moment(analysis.timeRange.start), 'hours') + ' hours' :
          'Unknown'
      },
      logLevels: analysis.logLevels,
      errorAnalysis: {
        totalErrors: analysis.errorCount,
        errorRate: ((analysis.errorCount / analysis.parsedLines) * 100).toFixed(2) + '%',
        uniqueErrors: analysis.topErrors.length
      },
      patterns: {
        total: analysis.patterns.length,
        highSeverity: analysis.patterns.filter(p => p.severity === 'high').length
      },
      anomalies: {
        total: analysis.anomalies.length,
        critical: analysis.anomalies.filter(a => a.severity === 'high').length
      }
    };
  }
}

module.exports = LogAnalyzer;
