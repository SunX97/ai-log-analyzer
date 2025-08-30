import React, { useState, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  LinearProgress,
  Alert,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Chip
} from '@mui/material';
import {
  CloudUpload,
  Description,
  Delete,
  CheckCircle,
  Error as ErrorIcon
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';

import { logService } from '../services/api';
import { useApp } from '../contexts/AppContext';

const LogUpload = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useApp();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  // Fetch existing log files
  const { data: logFiles, refetch } = useQuery('logFiles', logService.getLogFiles);

  // Upload mutation
  const uploadMutation = useMutation(
    ({ file }) => {
      setUploading(true);
      return logService.uploadFile(file, (progressEvent) => {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(progress);
      });
    },
    {
      onSuccess: (response) => {
        const { filename, analysis } = response.data.data;
        showSuccess(`Successfully analyzed ${filename}!`);
        setUploadProgress(0);
        setUploading(false);
        queryClient.invalidateQueries('logFiles');
        queryClient.invalidateQueries('dashboardData');
        
        // Navigate to analysis page
        navigate(`/analysis/${response.data.data.fileId}`);
      },
      onError: (error) => {
        showError(error.response?.data?.error || 'Failed to upload file');
        setUploadProgress(0);
        setUploading(false);
      }
    }
  );

  // Delete mutation
  const deleteMutation = useMutation(logService.deleteLogFile, {
    onSuccess: () => {
      showSuccess('File deleted successfully');
      queryClient.invalidateQueries('logFiles');
      queryClient.invalidateQueries('dashboardData');
    },
    onError: (error) => {
      showError(error.response?.data?.error || 'Failed to delete file');
    }
  });

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      uploadMutation.mutate({ file });
    }
  }, [uploadMutation]);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.log', '.txt', '.out', '.err'],
    },
    maxFiles: 1,
    maxSize: 100 * 1024 * 1024, // 100MB
    disabled: uploading
  });

  const handleDelete = (fileId) => {
    if (window.confirm('Are you sure you want to delete this file and its analysis?')) {
      deleteMutation.mutate(fileId);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Upload Log Files
      </Typography>

      <Grid container spacing={3}>
        {/* Upload Area */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Upload New Log File
              </Typography>
              
              {/* File Upload Dropzone */}
              <Box
                {...getRootProps()}
                sx={{
                  border: '2px dashed',
                  borderColor: isDragActive ? 'primary.main' : 'grey.300',
                  borderRadius: 2,
                  p: 4,
                  textAlign: 'center',
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  backgroundColor: isDragActive ? 'action.hover' : 'transparent',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: 'primary.main',
                    backgroundColor: 'action.hover'
                  }
                }}
              >
                <input {...getInputProps()} />
                <CloudUpload sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
                
                {uploading ? (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Analyzing log file...
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={uploadProgress} 
                      sx={{ mt: 2, mb: 1 }}
                    />
                    <Typography variant="body2" color="textSecondary">
                      {uploadProgress}% complete
                    </Typography>
                  </Box>
                ) : (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      {isDragActive
                        ? "Drop the log file here..."
                        : "Drag & drop a log file here, or click to select"
                      }
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                      Supports .log, .txt, .out, .err files (up to 100MB)
                    </Typography>
                    <Button variant="contained" component="span">
                      Select File
                    </Button>
                  </Box>
                )}
              </Box>

              {/* File Rejection Errors */}
              {fileRejections.length > 0 && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {fileRejections.map(({ file, errors }) => (
                    <div key={file.path}>
                      {errors.map(e => (
                        <div key={e.code}>{e.message}</div>
                      ))}
                    </div>
                  ))}
                </Alert>
              )}

              {/* Upload Instructions */}
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Supported Log Formats:
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  • Standard application logs with timestamps<br/>
                  • Web server access/error logs<br/>
                  • System logs (syslog, journald)<br/>
                  • Custom application logs
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Files */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Uploads
              </Typography>
              
              {logFiles?.data?.length > 0 ? (
                <List>
                  {logFiles.data.slice(0, 8).map((file) => (
                    <ListItem 
                      key={file.id}
                      secondaryAction={
                        <IconButton 
                          edge="end" 
                          aria-label="delete"
                          onClick={() => handleDelete(file.id)}
                          disabled={deleteMutation.isLoading}
                        >
                          <Delete />
                        </IconButton>
                      }
                    >
                      <ListItemIcon>
                        <Description color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box 
                            component="span" 
                            sx={{ cursor: 'pointer' }}
                            onClick={() => navigate(`/analysis/${file.id}`)}
                          >
                            {file.original_name}
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="caption" display="block">
                              Uploaded: {new Date(file.upload_date).toLocaleDateString()}
                            </Typography>
                            <Box display="flex" gap={1} mt={0.5} alignItems="center">
                              <Typography variant="caption" color="textSecondary">
                                {(file.file_size / 1024).toFixed(1)} KB
                              </Typography>
                              <Chip 
                                size="small" 
                                label={file.status}
                                color={
                                  file.status === 'analyzed' ? 'success' : 
                                  file.status === 'processing' ? 'warning' : 'default'
                                }
                                icon={
                                  file.status === 'analyzed' ? <CheckCircle /> :
                                  file.status === 'error' ? <ErrorIcon /> : undefined
                                }
                              />
                            </Box>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Box textAlign="center" py={4}>
                  <Typography color="textSecondary">
                    No files uploaded yet. Upload your first log file to get started!
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default LogUpload;
