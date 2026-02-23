import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useMutation, useQuery, useLazyQuery } from '@apollo/client';
import {
  GET_PROJECT_FILES,
  GET_FILE_DOWNLOAD_URL,
  UPLOAD_FILE,
  UPLOAD_FILES,
  UPDATE_FILE,
  DELETE_FILE,
  SEND_FILES_TO_STACK,
  RESET_STACK_STATUS,
  REPROCESS_FILE
} from '../../graphql/fileOperations';

interface ProjectFile {
  id: string;
  projectId: number;
  fileName: string;
  originalFileName: string;
  blobUrl: string;
  thumbnailUrl?: string;
  category: string;
  fileType: string;
  fileSize: number;
  pageCount: number;
  processingStatus: string;
  processedAt?: string;
  sentToStack: boolean;
  stackSentAt?: string;
  stackId?: string;
  createdAt: string;
  selected?: boolean;
}

interface ProjectFilesContentProps {
  projectId: string;
}

const ProjectFilesContent: React.FC<ProjectFilesContentProps> = ({ projectId }) => {
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<Map<string, number>>(new Map());
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [getDownloadUrl] = useLazyQuery(GET_FILE_DOWNLOAD_URL);

  const categoryOptions = ['Original Plan', 'Revised Plan', 'Specification', 'Reference', 'Addenda', 'Other'];

  // GraphQL queries and mutations
  const { data, loading, error, refetch } = useQuery(GET_PROJECT_FILES, {
    variables: { 
      projectId: projectId,
      includeDeleted: false 
    },
    fetchPolicy: 'cache-and-network'
  });

  const [uploadFileMutation] = useMutation(UPLOAD_FILE);
  const [uploadFilesMutation] = useMutation(UPLOAD_FILES);
  const [updateFileMutation] = useMutation(UPDATE_FILE);
  const [deleteFileMutation] = useMutation(DELETE_FILE);
  const [sendToStackMutation] = useMutation(SEND_FILES_TO_STACK);
  const [resetStackMutation] = useMutation(RESET_STACK_STATUS);
  const [reprocessFileMutation] = useMutation(REPROCESS_FILE);

  const files: ProjectFile[] = data?.projectFiles || [];

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles, 'Original Plan');
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      handleFiles(selectedFiles, 'Original Plan');
    }
  }, []);

  const handleFiles = async (fileList: File[], category: string) => {
    const fileInputs = [];

    for (const file of fileList) {
      const fileId = `temp-${Date.now()}-${file.name}`;
      setUploadingFiles(prev => new Map(prev).set(fileId, 0));

      try {
        // Convert file to base64
        const base64Data = await fileToBase64(file);

        fileInputs.push({
          category,
          fileName: file.name,
          fileData: base64Data,
        });

        // Simulate upload progress
        let progress = 0;
        const interval = setInterval(() => {
          progress += 10;
          setUploadingFiles(prev => new Map(prev).set(fileId, Math.min(progress, 90)));
          if (progress >= 90) clearInterval(interval);
        }, 200);

      } catch (error) {
        console.error('Error preparing file:', error);
        setUploadingFiles(prev => {
          const newMap = new Map(prev);
          newMap.delete(fileId);
          return newMap;
        });
      }
    }

    // Upload all files at once
    if (fileInputs.length > 0) {
      try {
        const result = await uploadFilesMutation({
          variables: { 
            projectId: projectId,
            files: fileInputs 
          }
        });

        // Clear uploading states
        setUploadingFiles(new Map());
        
        // Refetch files
        await refetch();

        alert(`${fileInputs.length} file(s) uploaded successfully`);
      } catch (error) {
        console.error('Upload error:', error);
        alert('Failed to upload files. Please try again.');
        setUploadingFiles(new Map());
      }
    }
  };

  const handleCategoryChange = async (fileId: string, category: string) => {
    try {
      await updateFileMutation({
        variables: {
          id: parseInt(fileId),
          category: category
        }
      });
      await refetch();
    } catch (error) {
      console.error('Error updating category:', error);
      alert('Failed to update category');
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result as string;
        const base64Data = base64.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleSelectAll = () => {
    if (selectedFiles.size === files.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(files.map(f => f.id)));
    }
  };

  const handleFileSelect = (fileId: string) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(fileId)) {
      newSelected.delete(fileId);
    } else {
      newSelected.add(fileId);
    }
    setSelectedFiles(newSelected);
  };

  const handleSendToStack = async () => {
    if (selectedFiles.size === 0) {
      alert('Please select files to send to Stack');
      return;
    }

    try {
      const fileIds = Array.from(selectedFiles).map(id => parseInt(id));
      const result = await sendToStackMutation({
        variables: {
          input: {
            fileIds,
            stackOptions: {}
          }
        }
      });

      if (result.data?.sendFilesToStack?.success) {
        setSelectedFiles(new Set());
        await refetch();
        alert(result.data.sendFilesToStack.message);
      }
    } catch (error) {
      console.error('Error sending to Stack:', error);
      alert('Failed to send files to Stack');
    }
  };

  const handleResetSendToStack = async () => {
    const filesToReset = files
      .filter(f => f.sentToStack)
      .map(f => parseInt(f.id));

    if (filesToReset.length === 0) {
      alert('No files have been sent to Stack');
      return;
    }

    if (!confirm('Are you sure you want to reset Stack status for all files?')) {
      return;
    }

    try {
      const result = await resetStackMutation({
        variables: { fileIds: filesToReset }
      });

      if (result.data?.resetStackStatus?.success) {
        await refetch();
        alert(result.data.resetStackStatus.message);
      }
    } catch (error) {
      console.error('Error resetting Stack status:', error);
      alert('Failed to reset Stack status');
    }
  };

  const handleDownload = async (file: ProjectFile) => {
    try {
      setDownloadingFileId(file.id);
      console.log('Starting download for file:', file.id, file.fileName);
      
      const { data, error: queryError } = await getDownloadUrl({
        variables: { id: parseInt(file.id) }
      });
      
      console.log('Download URL response:', { data, error: queryError });
      
      if (queryError) {
        throw new Error(queryError.message || 'Failed to get download URL');
      }
      
      if (!data?.getFileDownloadUrl) {
        throw new Error('No download URL returned from server');
      }
      
      const downloadUrl = data.getFileDownloadUrl;
      console.log('Download URL:', downloadUrl);
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = file.fileName || 'download';
      link.target = '_blank';
      
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        document.body.removeChild(link);
        setDownloadingFileId(null);
      }, 100);
      
    } catch (error) {
      console.error('Download error:', error);
      setDownloadingFileId(null);
      
      let errorMessage = 'Failed to download file. ';
      if (error instanceof Error) {
        errorMessage += error.message;
      } else {
        errorMessage += 'Please try again.';
      }
      
      alert(errorMessage);
    }
  };

  const handleDelete = async (fileId: string) => {
    if (!confirm('Are you sure you want to delete this file?')) {
      return;
    }

    try {
      const result = await deleteFileMutation({
        variables: { id: parseInt(fileId) }
      });

      if (result.data?.deleteFile?.success) {
        await refetch();
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Failed to delete file');
    }
  };

  const handleViewFile = (file: ProjectFile) => {
    // Open file viewer
    window.open(file.blobUrl, '_blank');
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: '2-digit', 
      day: '2-digit', 
      year: 'numeric' 
    });
  };

  if (loading && files.length === 0) {
    return (
      <div className="project-files-content">
        <h2 className="content-title">Project Files</h2>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div className="loading-spinner" style={{ margin: '0 auto 16px' }}></div>
          <p>Loading files...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="project-files-content">
      <h2 className="content-title">Project Files</h2>

      {/* Action Buttons */}
      <div className="files-actions">
        <button 
          className="reset-stack-button"
          onClick={handleResetSendToStack}
          disabled={!files.some(f => f.sentToStack)}
        >
          Reset Send to Stack
        </button>
        <button 
          className="send-stack-button"
          onClick={handleSendToStack}
          disabled={selectedFiles.size === 0}
        >
          Send Selected to Stack
        </button>
      </div>

      {/* File Upload Area */}
      <div
        className={`file-upload-area ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none" className="upload-icon">
          <circle cx="40" cy="40" r="30" fill="#0099d8" fillOpacity="0.1" />
          <path
            d="M40 25V55M25 40H55"
            stroke="#0099d8"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
        <p className="upload-text">
          Drop your file here or <span className="upload-link">click to upload</span>
        </p>
        <p className="upload-info">
          File Types: .cad .pdf .png .jpg .doc .csv  |  Max File Size: 100MB
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".cad,.pdf,.png,.jpg,.jpeg,.doc,.docx,.csv,.dwg,.dxf"
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
        />
      </div>

      {/* Uploading Files Indicators */}
      {Array.from(uploadingFiles.entries()).map(([fileId, progress]) => (
        <div key={fileId} className="uploading-indicator">
          <div className="uploading-content">
            <div className="upload-spinner"></div>
            <div className="upload-details">
              <span className="upload-filename">Uploading...</span>
              <div className="upload-progress-bar">
                <div 
                  className="upload-progress-fill" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Files Table */}
      <div className="files-table-container">
        <table className="files-table">
          <thead>
            <tr>
              <th className="checkbox-column">
                <input
                  type="checkbox"
                  checked={files.length > 0 && selectedFiles.size === files.length}
                  onChange={handleSelectAll}
                  className="file-checkbox"
                />
              </th>
              <th>Thumbnail</th>
              <th>File Name</th>
              <th>Pages</th>
              <th>Category</th>
              <th>Date Created</th>
              <th className="actions-column"></th>
            </tr>
          </thead>
          <tbody>
            {files.map((file) => (
              <tr key={file.id} className="file-row">
                <td className="checkbox-column">
                  <input
                    type="checkbox"
                    checked={selectedFiles.has(file.id)}
                    onChange={() => handleFileSelect(file.id)}
                    className="file-checkbox"
                  />
                </td>
                <td className="thumbnail-column">
                  <div className="file-thumbnail">
                    {file.thumbnailUrl ? (
                      <img src={file.thumbnailUrl} alt={file.fileName} />
                    ) : (
                      <div className="thumbnail-placeholder">
                        <svg width="40" height="50" viewBox="0 0 40 50" fill="none">
                          <path d="M5 0C2.23858 0 0 2.23858 0 5V45C0 47.7614 2.23858 50 5 50H35C37.7614 50 40 47.7614 40 45V12.5L27.5 0H5Z" fill="#E5E7EB"/>
                          <path d="M27.5 0V12.5H40L27.5 0Z" fill="#D1D5DB"/>
                        </svg>
                      </div>
                    )}
                  </div>
                </td>
                <td className="filename-column">
                  <a href="#" className="file-link" onClick={(e) => {
                    e.preventDefault();
                    handleViewFile(file);
                  }}>
                    {file.fileName}
                  </a>
                  <div className="file-meta">
                    {formatFileSize(file.fileSize)}
                  </div>
                  {file.sentToStack && (
                    <div className="stack-status sent">
                      Sent to Stack
                    </div>
                  )}
                  {file.processingStatus === 'processing' && (
                    <div className="processing-status">
                      Processing...
                    </div>
                  )}
                  {file.processingStatus === 'failed' && (
                    <div className="processing-status error">
                      Processing Failed
                    </div>
                  )}
                </td>
                <td>{file.pageCount}</td>
                <td className="category-column">
                  <select
                    value={file.category}
                    onChange={(e) => handleCategoryChange(file.id, e.target.value)}
                    className="category-select"
                  >
                    {categoryOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </td>
                <td>{formatDate(file.createdAt)}</td>
                <td className="actions-column">
                  <div className="file-actions">
                    <button
                      className="action-button download-button"
                      onClick={() => handleDownload(file)}
                      title="Download"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M14 10V12.6667C14 13.0203 13.8595 13.3594 13.6095 13.6095C13.3594 13.8595 13.0203 14 12.6667 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M4.66675 6.66663L8.00008 9.99996L11.3334 6.66663" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M8 10V2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    <button
                      className="action-button delete-button"
                      onClick={() => handleDelete(file.id)}
                      title="Delete"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M2 4H3.33333H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M5.33325 4.00004V2.66671C5.33325 2.31309 5.47373 1.97395 5.72378 1.7239C5.97383 1.47385 6.31296 1.33337 6.66659 1.33337H9.33325C9.68687 1.33337 10.026 1.47385 10.2761 1.7239C10.5261 1.97395 10.6666 2.31309 10.6666 2.66671V4.00004M12.6666 4.00004V13.3334C12.6666 13.687 12.5261 14.0261 12.2761 14.2762C12.026 14.5262 11.6869 14.6667 11.3333 14.6667H4.66659C4.31296 14.6667 3.97383 14.5262 3.72378 14.2762C3.47373 14.0261 3.33325 13.687 3.33325 13.3334V4.00004H12.6666Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    <button
                      className="action-button view-button"
                      onClick={() => handleViewFile(file)}
                      title="View"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M9.33325 8L14.6666 2.66663" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M14.6667 2.66663H10" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M14.6667 2.66663V7.33329" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {files.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                  No files uploaded yet. Drag and drop files above to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProjectFilesContent;