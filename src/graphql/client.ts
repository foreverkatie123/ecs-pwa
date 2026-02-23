// src/graphql/client.ts
import { ApolloClient, InMemoryCache, HttpLink, ApolloLink } from '@apollo/client';
import { onError } from '@apollo/client/link/error';

const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  throw new Error('REACT_APP_API_URL is not defined');
}

// Auth middleware to add JWT token to requests
const authLink = new ApolloLink((operation, forward) => {
  const token = localStorage.getItem('authToken');
  
  operation.setContext({
    headers: {
      authorization: token ? `Bearer ${token}` : '',
    }
  });
  
  return forward(operation);
});

// Error handling link
const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) => {
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
      );
      
      // Handle authentication errors
      if (message.includes('Not authenticated') || message.includes('Invalid token')) {
        logout();
        window.location.href = '/';
      }
    });
  }
  
  if (networkError) {
    console.error(`[Network error]: ${networkError}`);
  }
});

// Create Apollo Client
export const client = new ApolloClient({
  link: ApolloLink.from([
    errorLink,
    authLink,
    new HttpLink({
      uri: API_URL,
      credentials: 'include',
    })
  ]),
  cache: new InMemoryCache(),
});

// Authentication helper functions
export const isAuthenticated = (): boolean => {
  const token = localStorage.getItem('authToken');
  if (!token) return false;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const isExpired = payload.exp * 1000 < Date.now();
    
    if (isExpired) {
      logout();
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error validating token:', error);
    logout();
    return false;
  }
};

export const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  
  try {
    return JSON.parse(userStr);
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
};

export const logout = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
  client.clearStore();
};


export async function changePassword(
  currentPassword: string,
  newPassword: string
) {
  const token = localStorage.getItem('authToken');
  
  console.log('Change password called');
  console.log('API_URL:', API_URL);
  console.log('Token exists:', !!token);
  
  if (!token) {
    throw new Error('Not authenticated');
  }

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        query: `
          mutation ChangePassword($currentPassword: String!, $newPassword: String!) {
            changePassword(currentPassword: $currentPassword, newPassword: $newPassword) {
              success
              message
            }
          }
        `,
        variables: { 
          currentPassword, 
          newPassword 
        },
      }),
    });

    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const json = await response.json();
    console.log('Response data:', json);

    if (json.errors?.length) {
      throw new Error(json.errors[0].message);
    }

    if (!json.data?.changePassword?.success) {
      throw new Error(json.data?.changePassword?.message || 'Failed to change password');
    }

    return json.data.changePassword;
  } catch (error) {
    console.error('Change password error:', error);
    throw error;
  }
}
