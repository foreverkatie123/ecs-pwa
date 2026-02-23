import { gql } from '@apollo/client';

export const CREATE_PROJECT = gql`
  mutation CreateProject(
    $projectInfo: ProjectInfoInput!
    $contactInfo: ContactInfoInput!
    $services: ServicesInput!
    $designDetails: DesignDetailsInput
  ) {
    createProject(
      projectInfo: $projectInfo
      contactInfo: $contactInfo
      services: $services
      designDetails: $designDetails
    ) {
      id
      projectName
      planName
      address1
      address2
      city
      state
      zipcode
      bidDate
      dueDate
      zoneCount
      existingQuote
      projectNotes
      companyName
      accountNumber
      contactName
      contactEmail
      contactPhone
      preferredBranch
      ewingRepresentative
      createdAt
      updatedAt
    }
  }
`;

export const UPLOAD_FILES = gql`
  mutation UploadFiles(
    $projectId: String!
    $files: [ProjectFileInput!]!
  ) {
    uploadFiles(
      projectId: $projectId
      files: $files
    )
  }
`;

export const CREATE_DESIGN_TEMPLATE = gql`
  mutation CreateDesignTemplate($name: String!, $designDetails: String!) {
    createDesignTemplate(name: $name, designDetails: $designDetails) {
      id
      name
      designDetails
      createdAt
    }
  }
`;

export const DELETE_DESIGN_TEMPLATE = gql`
  mutation DeleteDesignTemplate($id: Int!) {
    deleteDesignTemplate(id: $id) {
      success
      message
    }
  }
`;

export const UPDATE_PROJECT_STATUS = gql`
  mutation UpdateProjectStatus($id: ID!, $status: String!) {
    updateProjectStatus(id: $id, status: $status) {
      id
      status
      updatedAt
    }
  }
`;

export const INDEX_PROJECT = gql`
  mutation IndexProject($objectID: String!, $data: String!) {
    indexToAlgolia(
      objectID: $objectID
      data: $data
    ) {
      objectID
      title
    }
  }
`;

export const CREATE_USER = gql`
  mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) {
      id
      username
      email
      firstName
      lastName
      role
      branch
      organization
      isInternal
    }
  }
`;

export const UPDATE_USER = gql`
  mutation UpdateUser($id: ID!, $input: UpdateUserInput!) {
    updateUser(id: $id, input: $input) {
      id
      username
      email
      firstName
      lastName
      role
      branch
      organization
      isInternal
    }
  }
`;

export const CHANGE_PASSWORD_MUTATION = gql`
  mutation ChangePassword($currentPassword: String!, $newPassword: String!) {
    changePassword(currentPassword: $currentPassword, newPassword: $newPassword) {
      success
      message
    }
  }
`;

export const SEND_PASSWORD_RESET = gql`
  mutation RequestPasswordReset($email: String!) {
    requestPasswordReset(email: $email) {
      success
      message
    }
  }
`;

export const RESET_PASSWORD = gql`
  mutation ResetPassword($token: String!, $email: String!, $newPassword: String!) {
    resetPassword(token: $token, email: $email, newPassword: $newPassword) {
      success
      message
    }
  }
`;

export const SYNC_EMPLOYEES = gql`
  mutation SyncEmployees {
    syncEmployees {
      success
      message
      totalEmployees
      synced
      created
      updated
    }
  }
`;

export const SEND_STACK = gql`
  mutation {
    sendFilesToStack(input: {
      fileIds: [1, 2, 3]
      stackOptions: {}
    }) {
      success
      message
      stackIds
    }
  }
`;