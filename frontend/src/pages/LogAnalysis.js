import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemText,
  Alert,
  Button,
  Tabs,
  Tab,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import {
  ExpandMore,
  Error,
  Warning,
  Info,
  Timeline,
  Analytics,
  Refresh
} from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { format } from 'date-fns';

import { logService, analysisService } from '../services/api';
import { useApp } from '../contexts/AppContext';

const TabPanel = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`analysis-tabpanel-${index}`}
    aria-labelledby={`analysis-tab-${index}`}
    {...other}
  >
    {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
  </div>
);

const LogAnalysis = () => {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useApp();
  const [activeTab, setActiveTab] = useState(0);

  // Fetch log file analysis
  const { data: logData, isLoading, error } = useQuery(
    ['logFile', id],
    () => logService.getLogFile(id),
    {
      onError: (error) => {
        showError(error.response?.data?.error || 'Failed to load analysis');
      }
    }
  );

  // Re-analyze mutation
  const reanalyzeMutation = useMutation(
    () => analysisService.reanalyzeFile(id),
    {
      onSuccess: () => {
        showSuccess('Re-analysis completed successfully');
        queryClient.invalidateQueries(['logFile', id]);
      },
      onError: (error) => {
        showError(error.response?.data?.error || 'Failed to re-analyze file');
      }
    }
  );

  if (isLoading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Log Analysis
        </Typography>
        <LinearProgress />
      </Box>
    );
  }

  if (error || !logData?.data) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Log Analysis
        </Typography>
        <Alert severity="error">
          Failed to load log analysis. The file may not exist or analysis may have failed.
        </Alert>
      </Box>
    );
  }

  const { file, analysis, entries } = logData.data;
  
  if (!analysis) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Log Analysis
        </Typography>
        <Alert severity="warning">
          Analysis not available for this file. Try re-analyzing.
        </Alert>
        <Button
          variant="contained"
          startIcon={<Refresh />}
          onClick={() => reanalyzeMutation.mutate()}
          disabled={reanalyzeMutation.isLoading}
          sx={{ mt: 2 }}
        >
          Re-analyze File
        </Button>
      </Box>
    );
  }

  // Prepare chart data
  const logLevelData = Object.entries(analysis.logLevels).map(([level, count]) => ({
    level,
    count,
    percentage: ((count / analysis.parsedLines) * 100).toFixed(1)
  }));

  const COLORS = {
    ERROR: '#f44336',
    WARN: '#ff9800',
    INFO: '#2196f3',
    DEBUG: '#4caf50',
    UNKNOWN: '#9e9e9e'
  };

  const pieData = logLevelData.filter(item => item.count > 0);

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Log Analysis
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            {file.original_name}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={() => reanalyzeMutation.mutate()}
          disabled={reanalyzeMutation.isLoading}
        >
          Re-analyze
        </Button>
      </Box>

      {/* Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Lines
              </Typography>
              <Typography variant="h5">
                {analysis.totalLines?.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Error Count
              </Typography>
              <Typography variant="h5" color="error.main">
                {analysis.errorCount?.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Patterns Found
              </Typography>
              <Typography variant="h5">
                {Array.isArray(analysis.patterns) ? analysis.patterns.length : 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Anomalies
              </Typography>
              <Typography variant="h5" color="warning.main">
                {Array.isArray(analysis.anomalies) ? analysis.anomalies.length : 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Analysis Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={activeTab} 
            onChange={(e, newValue) => setActiveTab(newValue)}
            aria-label="analysis tabs"
          >
            <Tab label="Overview" icon={<Analytics />} />
            <Tab label="Timeline" icon={<Timeline />} />
            <Tab label="Patterns" icon={<Info />} />
            <Tab label="Anomalies" icon={<Warning />} />
            <Tab label="Log Entries" icon={<Error />} />
          </Tabs>
        </Box>

        {/* Overview Tab */}
        <TabPanel value={activeTab} index={0}>
          <Grid container spacing={3}>
            {/* Log Level Distribution */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Log Level Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ level, percentage }) => `${level}: ${percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[entry.level]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Grid>

            {/* Insights */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                AI Insights
              </Typography>
              {Array.isArray(analysis.insights) && analysis.insights.length > 0 ? (
                <List>
                  {analysis.insights.map((insight, index) => (
                    <ListItem key={index} sx={{ px: 0 }}>
                      <ListItemText
                        primary={insight.description}
                        secondary={
                          <Box>
                            <Chip 
                              size="small" 
                              label={insight.type} 
                              color="primary" 
                              sx={{ mr: 1, mt: 0.5 }}
                            />
                            <Typography variant="body2" sx={{ mt: 1 }}>
                              {insight.recommendation}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography color="textSecondary">
                  No insights generated for this log file.
                </Typography>
              )}
            </Grid>
          </Grid>
        </TabPanel>

        {/* Timeline Tab */}
        <TabPanel value={activeTab} index={1}>
          <Typography variant="h6" gutterBottom>
            Log Activity Timeline
          </Typography>
          {Array.isArray(analysis.timeline) && analysis.timeline.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={analysis.timeline}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={(value) => format(new Date(value), 'MMM dd HH:mm')}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => format(new Date(value), 'MMM dd, yyyy HH:mm')}
                />
                <Legend />
                <Line type="monotone" dataKey="total" stroke="#2196f3" name="Total" />
                <Line type="monotone" dataKey="errors" stroke="#f44336" name="Errors" />
                <Line type="monotone" dataKey="warnings" stroke="#ff9800" name="Warnings" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <Typography color="textSecondary">
              No timeline data available. Logs may not contain timestamps.
            </Typography>
          )}
        </TabPanel>

        {/* Patterns Tab */}
        <TabPanel value={activeTab} index={2}>
          <Typography variant="h6" gutterBottom>
            Detected Patterns
          </Typography>
          {Array.isArray(analysis.patterns) && analysis.patterns.length > 0 ? (
            analysis.patterns.map((pattern, index) => (
              <Accordion key={index}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Chip 
                      size="small" 
                      label={pattern.severity} 
                      color={
                        pattern.severity === 'high' ? 'error' :
                        pattern.severity === 'medium' ? 'warning' : 'default'
                      }
                    />
                    <Typography variant="subtitle1">
                      {pattern.type.replace(/_/g, ' ').toUpperCase()}
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    {pattern.pattern}
                  </Typography>
                  {pattern.frequency && (
                    <Typography variant="caption" color="textSecondary">
                      Frequency: {pattern.frequency} occurrences
                    </Typography>
                  )}
                </AccordionDetails>
              </Accordion>
            ))
          ) : (
            <Typography color="textSecondary">
              No patterns detected in this log file.
            </Typography>
          )}
        </TabPanel>

        {/* Anomalies Tab */}
        <TabPanel value={activeTab} index={3}>
          <Typography variant="h6" gutterBottom>
            Anomalies Detected
          </Typography>
          {Array.isArray(analysis.anomalies) && analysis.anomalies.length > 0 ? (
            analysis.anomalies.map((anomaly, index) => (
              <Alert 
                key={index} 
                severity={
                  anomaly.severity === 'high' ? 'error' :
                  anomaly.severity === 'medium' ? 'warning' : 'info'
                }
                sx={{ mb: 2 }}
              >
                <Typography variant="subtitle2" gutterBottom>
                  {anomaly.type.replace(/_/g, ' ').toUpperCase()}
                </Typography>
                <Typography variant="body2">
                  {anomaly.description}
                </Typography>
                {anomaly.timestamp && (
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    Time: {format(new Date(anomaly.timestamp), 'MMM dd, yyyy HH:mm')}
                  </Typography>
                )}
              </Alert>
            ))
          ) : (
            <Alert severity="success">
              No anomalies detected in this log file. Your system appears to be running normally!
            </Alert>
          )}
        </TabPanel>

        {/* Log Entries Tab */}
        <TabPanel value={activeTab} index={4}>
          <Typography variant="h6" gutterBottom>
            Sample Log Entries
          </Typography>
          {Array.isArray(entries) && entries.length > 0 ? (
            <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Line</TableCell>
                    <TableCell>Timestamp</TableCell>
                    <TableCell>Level</TableCell>
                    <TableCell>Message</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{entry.line_number}</TableCell>
                      <TableCell>
                        {entry.timestamp ? 
                          format(new Date(entry.timestamp), 'yyyy-MM-dd HH:mm:ss') : 
                          'N/A'
                        }
                      </TableCell>
                      <TableCell>
                        <Chip 
                          size="small" 
                          label={entry.level}
                          color={
                            entry.level === 'ERROR' ? 'error' :
                            entry.level === 'WARN' ? 'warning' :
                            entry.level === 'INFO' ? 'info' : 'default'
                          }
                        />
                      </TableCell>
                      <TableCell sx={{ maxWidth: 400, wordBreak: 'break-word' }}>
                        {entry.message}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography color="textSecondary">
              No log entries available for display.
            </Typography>
          )}
        </TabPanel>
      </Card>

      {/* Top Errors */}
      {Array.isArray(analysis.topErrors) && analysis.topErrors.length > 0 && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Most Frequent Errors
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Error Message</TableCell>
                    <TableCell align="right">Count</TableCell>
                    <TableCell align="right">Percentage</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {analysis.topErrors.map((error, index) => (
                    <TableRow key={index}>
                      <TableCell sx={{ maxWidth: 500, wordBreak: 'break-word' }}>
                        {error.message}
                      </TableCell>
                      <TableCell align="right">{error.count}</TableCell>
                      <TableCell align="right">{error.percentage}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default LogAnalysis;
