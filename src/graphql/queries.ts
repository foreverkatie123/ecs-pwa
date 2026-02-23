import { gql } from '@apollo/client';

export const SEARCH_PRODUCTS = gql`
  query SearchProducts($query: String!, $page: Int, $hitsPerPage: Int) {
    searchProducts(query: $query, page: $page, hitsPerPage: $hitsPerPage) {
      hits {
        sku
        name
        description
        price
        manufacturer
        category
        uom
      }
      nbHits
      page
      nbPages
    }
  }
`;

export const SEARCH_CUSTOMERS = gql`
  query SearchCustomers($query: String!, $page: Int, $hitsPerPage: Int) {
    searchCustomers(query: $query, page: $page, hitsPerPage: $hitsPerPage) {
      hits {
        accountNumber
        companyName
        contactName
        contactEmail
        contactPhone
        preferredBranch
      }
      nbHits
      page
      nbPages
    }
  }
`;

export const GET_PROJECTS = gql`
  query GetProjects($limit: Int, $offset: Int) {
    projects(limit: $limit, offset: $offset) {
      id
      projectName
      planName
      address1
      city
      state
      zipcode
      bidDate
      dueDate
      zoneCount
      createdAt
      updatedAt
    }
  }
`;

export const GET_PROJECT = gql`
  query GetProject($projectId: String!) {
    project(id: $projectId) {
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

export const LIST_PROJECTS = gql`
  query ListProjects($status: String, $limit: Int) {
    listProjects(status: $status, limit: $limit) {
      id
      projectName
      status
      customerInfo {
        companyName
      }
      createdAt
    }
  }
`;

export const GET_DESIGN_TEMPLATES = gql`
  query GetDesignTemplates {
    designTemplates {
      id
      name
      designDetails   # ← make sure this is here
    }
  }
`;

export const GET_USERS = gql`
  query GetUsers($search: String) {
    users(search: $search) {
      id
      username
      email
      firstName
      lastName
      role
      branch
      organization
      phone
      jobType
      status
      isInternal
      lastLogin
      createdAt
    }
  }
`;

export const GET_EMPLOYEES = gql`
  query GetEmployees {
    employees {
      employeeNumber
      firstName
      lastName
      email
    }
  }
`;

export const GET_BRANCHES = gql`
  query GetBranches {
    branches {
      branchId
      description
    }
  }
`;

export const GET_FILES = gql`
  query {
    projectFiles(projectId: 123, category: "Original Plan") {
      id
      fileName
      blobUrl
      thumbnailUrl
      pageCount
      sentToStack
      createdAt
    }
  }
`;

export const GET_FILE_WITH_SASS = gql`
  query {
    projectFileWithSasUrl(id: 456, expiryHours: 2) {
      id
      fileName
      sasUrl
      blobUrl
    }
  }
`;

export const GET_P21_QUOTE = gql`
  query GetP21Quote($quoteNumber: String!) {
    p21Quote(quoteNumber: $quoteNumber) {
      quoteNumber
      customerId
      customerName
      completed
    }
  }
`;

// Get all default field values
export const GET_DESIGN_FIELD_DEFAULTS = gql`
  query GetDesignFieldDefaults {
    designFieldDefaults {
      id
      fieldName
      fieldLabel
      defaultValue
      fieldType
      isRequired
      placeholderText
      helpText
      displayOrder
      isActive
    }
  }
`;

// Get default values as a simple key-value object
export const GET_DEFAULT_FORM_VALUES = gql`
  query GetDefaultFormValues {
    defaultFormValues
  }
`;

export const GET_ALL_DESIGN_OPTIONS = gql`
  query GetAllDesignOptions {
    # Default values
    defaultFormValues
    
    # Original options
    waterSourceOptions {
      id
      value
      displayName
      description
      isActive
      sortOrder
    }
    pressureOptions {
      id
      value
      displayName
      psi
      isActive
      sortOrder
    }
    meterSizeOptions {
      id
      value
      displayName
      sizeInches
      isActive
      sortOrder
    }
    sleevingOptions {
      id
      value
      displayName
      description
      isActive
      sortOrder
    }
    mainlineOptions {
      id
      value
      displayName
      isActive
      sortOrder
    }
    lateralsOptions {
      id
      value
      displayName
      isActive
      sortOrder
    }
    controllerOptions {
      id
      value
      displayName
      manufacturer
      modelNumber
      stationCount
      isActive
      sortOrder
    }
    
    # New additional options
    backflowOptions {
      id
      value
      displayName
      manufacturer
      type
      description
      isActive
      sortOrder
    }
    bedTreeIrrigationOptions {
      id
      value
      displayName
      description
      isActive
      sortOrder
    }
    bedTypeOptions {
      id
      value
      displayName
      description
      isActive
      sortOrder
    }
    couplerValveOptions {
      id
      value
      displayName
      manufacturer
      description
      isActive
      sortOrder
    }
    dripLineOptions {
      id
      value
      displayName
      flowRate
      spacing
      description
      isActive
      sortOrder
    }
    dripValveOptions {
      id
      value
      displayName
      manufacturer
      modelNumber
      description
      isActive
      sortOrder
    }
    fieldRotorOptions {
      id
      value
      displayName
      manufacturer
      modelNumber
      description
      isActive
      sortOrder
    }
    mpRotatorOptions {
      id
      value
      displayName
      manufacturer
      radius
      description
      isActive
      sortOrder
    }
    rainSensorOptions {
      id
      value
      displayName
      connectionType
      weatherBased
      description
      isActive
      sortOrder
    }
    rotorOptions {
      id
      value
      displayName
      manufacturer
      description
      isActive
      sortOrder
    }
    specificationOptions {
      id
      value
      displayName
      description
      isActive
      sortOrder
    }
    sprayOptions {
      id
      value
      displayName
      manufacturer
      radius
      description
      isActive
      sortOrder
    }
    treeIrrigationOptions {
      id
      value
      displayName
      manufacturer
      type
      description
      isActive
      sortOrder
    }
    valveOptions {
      id
      value
      displayName
      manufacturer
      modelNumber
      description
      isActive
      sortOrder
    }
  }
`;