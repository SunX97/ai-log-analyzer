import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip
} from '@mui/material';
import { useQuery } from 'react-query';
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
  Bar
} from 'recharts';
import { format } from 'date-fns';

import { analysisService } from '../services/api';
import { useApp } from '../contexts/AppContext';

const Trends = () => {
  const { showError } = useApp();

  // Fetch trends data
  const { data: trendsData, isLoading, error } = useQuery(
    'trends',
    analysisService.getTrends,
    {
      onError: (error) => {
        showError(error.response?.data?.error || 'Failed to load trends data');
      }
    }
  );

  if (isLoading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Trends Analysis
        </Typography>
        <LinearProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Trends Analysis
        </Typography>
        <Alert severity="error">
          Failed to load trends data. Please try again.
        </Alert>
      </Box>
    );
  }

  const trends = trendsData?.data || {};
  const { errorTrends = [], patternTrends = [], anomalyTrends = [] } = trends;
  
  // Ensure all trends data are arrays
  const safeErrorTrends = Array.isArray(errorTrends) ? errorTrends : [];
  const safePatternTrends = Array.isArray(patternTrends) ? patternTrends : [];
  const safeAnomalyTrends = Array.isArray(anomalyTrends) ? anomalyTrends : [];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Trends Analysis
      </Typography>
      <Typography variant="subtitle1" color="textSecondary" sx={{ mb: 4 }}>
        Cross-file analysis and trending patterns across all your log data
      </Typography>

      <Grid container spacing={3}>
        {/* Error Rate Trends */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Error Rate Trends Over Time
              </Typography>
              {safeErrorTrends.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={safeErrorTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => format(new Date(value), 'MMM dd')}
                    />
                    <YAxis label={{ value: 'Error Rate (%)', angle: -90, position: 'insideLeft' }} />
                    <Tooltip 
                      labelFormatter={(value) => format(new Date(value), 'MMM dd, yyyy HH:mm')}
                      formatter={(value) => [`${value}%`, 'Error Rate']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="errorRate" 
                      stroke="#f44336" 
                      strokeWidth={2}
                      dot={{ fill: '#f44336' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <Typography color="textSecondary">
                  No error trend data available. Upload and analyze more log files to see trends.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Most Common Patterns */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Most Common Patterns
              </Typography>
              {safePatternTrends.length > 0 ? (
                <Box>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={safePatternTrends.slice(0, 8)} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis 
                        dataKey="pattern" 
                        type="category" 
                        width={150}
                        tickFormatter={(value) => 
                          value.length > 20 ? value.substring(0, 20) + '...' : value
                        }
                      />
                      <Tooltip />
                      <Bar dataKey="count" fill="#2196f3" />
                    </BarChart>
                  </ResponsiveContainer>
                  
                  <TableContainer sx={{ mt: 2 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Pattern</TableCell>
                          <TableCell align="right">Occurrences</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {safePatternTrends.slice(0, 10).map((pattern, index) => (
                          <TableRow key={index}>
                            <TableCell sx={{ maxWidth: 300, wordBreak: 'break-word' }}>
                              {pattern.pattern}
                            </TableCell>
                            <TableCell align="right">
                              <Chip size="small" label={pattern.count} color="primary" />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              ) : (
                <Typography color="textSecondary">
                  No pattern trends available. Analyze more log files to see common patterns.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Anomaly Types */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Common Anomaly Types
              </Typography>
              {safeAnomalyTrends.length > 0 ? (
                <Box>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={safeAnomalyTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="type" 
                        tickFormatter={(value) => 
                          value.replace(/_/g, ' ').toLowerCase()
                        }
                      />
                      <YAxis />
                      <Tooltip 
                        labelFormatter={(value) => value.replace(/_/g, ' ').toUpperCase()}
                      />
                      <Bar dataKey="count" fill="#ff9800" />
                    </BarChart>
                  </ResponsiveContainer>
                  
                  <TableContainer sx={{ mt: 2 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Anomaly Type</TableCell>
                          <TableCell align="right">Frequency</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {safeAnomalyTrends.map((anomaly, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              {anomaly.type.replace(/_/g, ' ').toUpperCase()}
                            </TableCell>
                            <TableCell align="right">
                              <Chip 
                                size="small" 
                                label={anomaly.count} 
                                color="warning" 
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              ) : (
                <Typography color="textSecondary">
                  No anomaly trends available. Great! This suggests your systems are running smoothly.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Summary Insights */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Trend Insights
              </Typography>
              
              {safePatternTrends.length > 0 || safeAnomalyTrends.length > 0 || safeErrorTrends.length > 0 ? (
                <Grid container spacing={3}>
                  {/* Pattern Insights */}
                  {safePatternTrends.length > 0 && (
                    <Grid item xs={12} md={4}>
                      <Alert severity="info">
                        <Typography variant="subtitle2" gutterBottom>
                          Pattern Analysis
                        </Typography>
                        <Typography variant="body2">
                          {safePatternTrends.length} distinct patterns identified across your logs. 
                          The most common pattern appears {safePatternTrends[0]?.count || 0} times.
                        </Typography>
                      </Alert>
                    </Grid>
                  )}

                  {/* Anomaly Insights */}
                  {safeAnomalyTrends.length > 0 && (
                    <Grid item xs={12} md={4}>
                      <Alert severity="warning">
                        <Typography variant="subtitle2" gutterBottom>
                          Anomaly Summary
                        </Typography>
                        <Typography variant="body2">
                          {safeAnomalyTrends.length} types of anomalies detected. 
                          Most frequent: {safeAnomalyTrends[0]?.type.replace(/_/g, ' ')} 
                          ({safeAnomalyTrends[0]?.count} occurrences).
                        </Typography>
                      </Alert>
                    </Grid>
                  )}

                  {/* Error Rate Insights */}
                  {safeErrorTrends.length > 0 && (
                    <Grid item xs={12} md={4}>
                      <Alert severity={
                        parseFloat(safeErrorTrends[0]?.errorRate) > 10 ? 'error' : 'success'
                      }>
                        <Typography variant="subtitle2" gutterBottom>
                          Error Rate Status
                        </Typography>
                        <Typography variant="body2">
                          Latest error rate: {safeErrorTrends[0]?.errorRate}%. 
                          {parseFloat(safeErrorTrends[0]?.errorRate) > 10 
                            ? ' Consider investigating high error sources.'
                            : ' Error rates are within acceptable range.'
                          }
                        </Typography>
                      </Alert>
                    </Grid>
                  )}
                </Grid>
              ) : (
                <Alert severity="info">
                  <Typography variant="subtitle2" gutterBottom>
                    Getting Started
                  </Typography>
                  <Typography variant="body2">
                    Upload and analyze multiple log files to see trends and patterns emerge. 
                    The AI will identify recurring issues, anomalies, and provide insights 
                    across all your log data.
                  </Typography>
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Trends;
