import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  LinearProgress
} from '@mui/material';
import {
  Assessment,
  Error,
  Warning,
  Info,
  CloudUpload,
  TrendingUp,
  Description
} from '@mui/icons-material';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

import { analysisService, logService } from '../services/api';
import { useApp } from '../contexts/AppContext';

const Dashboard = () => {
  const navigate = useNavigate();
  const { showError } = useApp();

  // Fetch dashboard data
  const { data: dashboardData, isLoading: dashboardLoading, error: dashboardError } = useQuery(
    'dashboardData',
    analysisService.getDashboardData,
    {
      onError: (error) => {
        showError(error.response?.data?.error || 'Failed to load dashboard data');
      }
    }
  );

  // Fetch recent log files
  const { data: logFiles, isLoading: filesLoading } = useQuery(
    'logFiles',
    logService.getLogFiles,
    {
      onError: (error) => {
        showError(error.response?.data?.error || 'Failed to load log files');
      }
    }
  );

  if (dashboardLoading || filesLoading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>
        <LinearProgress />
      </Box>
    );
  }

  if (dashboardError) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>
        <Typography color="error">
          Failed to load dashboard data. Please try again.
        </Typography>
      </Box>
    );
  }

  const overview = dashboardData?.data?.overview || {};
  const recentAnalyses = dashboardData?.data?.recentAnalyses || [];
  const recentFiles = logFiles?.data?.slice(0, 5) || [];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      
      {/* Overview Statistics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Files
                  </Typography>
                  <Typography variant="h4">
                    {overview.totalFiles || 0}
                  </Typography>
                </Box>
                <Description color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Log Entries
                  </Typography>
                  <Typography variant="h4">
                    {overview.totalLogEntries?.toLocaleString() || 0}
                  </Typography>
                </Box>
                <Assessment color="info" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Errors
                  </Typography>
                  <Typography variant="h4">
                    {overview.totalErrors?.toLocaleString() || 0}
                  </Typography>
                </Box>
                <Error color="error" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Warnings
                  </Typography>
                  <Typography variant="h4">
                    {overview.totalWarnings?.toLocaleString() || 0}
                  </Typography>
                </Box>
                <Warning color="warning" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Quick Actions */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Box display="flex" flexDirection="column" gap={2}>
                <Button
                  variant="contained"
                  startIcon={<CloudUpload />}
                  onClick={() => navigate('/upload')}
                  fullWidth
                >
                  Upload New Log File
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<TrendingUp />}
                  onClick={() => navigate('/trends')}
                  fullWidth
                >
                  View Trends
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Analyses */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Analyses
              </Typography>
              {recentAnalyses.length > 0 ? (
                <List dense>
                  {recentAnalyses.map((analysis, index) => (
                    <ListItem key={index} sx={{ px: 0 }}>
                      <ListItemIcon>
                        <Assessment color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={analysis.filename}
                        secondary={
                          <Box>
                            <Typography variant="caption" display="block">
                              {format(new Date(analysis.analysisDate), 'MMM dd, yyyy HH:mm')}
                            </Typography>
                            <Box display="flex" gap={1} mt={0.5}>
                              <Chip size="small" label={`${analysis.errorCount} errors`} color="error" />
                              <Chip size="small" label={`${analysis.insights} insights`} color="info" />
                            </Box>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography color="textSecondary">
                  No analyses yet. Upload a log file to get started!
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Files */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Files
              </Typography>
              {recentFiles.length > 0 ? (
                <List dense>
                  {recentFiles.map((file) => (
                    <ListItem 
                      key={file.id} 
                      sx={{ px: 0, cursor: 'pointer' }}
                      onClick={() => navigate(`/analysis/${file.id}`)}
                    >
                      <ListItemIcon>
                        <Description color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={file.original_name}
                        secondary={
                          <Box>
                            <Typography variant="caption" display="block">
                              {format(new Date(file.upload_date), 'MMM dd, yyyy HH:mm')}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {(file.file_size / 1024).toFixed(1)} KB
                            </Typography>
                          </Box>
                        }
                      />
                      <Chip 
                        size="small" 
                        label={file.status} 
                        color={file.status === 'analyzed' ? 'success' : 'default'}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography color="textSecondary">
                  No files uploaded yet.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
