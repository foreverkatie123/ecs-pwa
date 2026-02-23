import { gql } from '@apollo/client';

export const GET_PROJECT_FILES = gql`
  query GetProjectFiles($projectId: String!, $includeDeleted: Boolean) {
    projectFiles(projectId: $projectId, includeDeleted: $includeDeleted) {
      id
      projectId
      fileName
      originalFileName
      blobUrl
      thumbnailUrl
      category
      fileType
      fileSize
      pageCount
      processingStatus
      processedAt
      sentToStack
      stackSentAt
      stackId
      createdAt
      updatedAt
    }
  }
`;

export const UPLOAD_FILES = gql`
  mutation UploadFiles($projectId: String!, $files: [ProjectFileInput!]!) {
    uploadFiles(projectId: $projectId, files: $files)
  }
`;

export const DELETE_FILE = gql`
  mutation DeleteFile($id: Int!) {
    deleteFile(id: $id) {
      success
      message
    }
  }
`;

export const UPDATE_FILE = gql`
  mutation UpdateFile($id: Int!, $category: String!) {
    updateFile(id: $id, category: $category) {
      success
      message
    }
  }
`;

// You can add these later when you implement them
export const SEND_FILES_TO_STACK = gql`
  mutation SendFilesToStack($fileIds: [Int!]!) {
    sendFilesToStack(fileIds: $fileIds) {
      success
      message
    }
  }
`;

export const RESET_STACK_STATUS = gql`
  mutation ResetStackStatus($fileIds: [Int!]!) {
    resetStackStatus(fileIds: $fileIds) {
      success
      message
    }
  }
`;

export const GET_PROJECT_FILE_WITH_SAS = gql`
  query GetProjectFileWithSas($id: Int!, $expiryHours: Int) {
    projectFileWithSasUrl(id: $id, expiryHours: $expiryHours) {
      id
      fileName
      sasUrl
      blobUrl
    }
  }
`;

export const UPLOAD_FILE = gql`
  mutation UploadFile($input: ProjectFileUploadInput!) {
    uploadFile(input: $input) {
      id
      fileName
      blobUrl
      processingStatus
    }
  }
`;

export const GET_FILE_DOWNLOAD_URL = gql`
  query GetFileDownloadUrl($id: Int!) {
    getFileDownloadUrl(id: $id)
  }
`;

export const REPROCESS_FILE = gql`
  mutation ReprocessFile($id: Int!) {
    reprocessFile(id: $id) {
      success
      message
    }
  }
`;