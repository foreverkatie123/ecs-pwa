// components/Header/manageUsers.tsx
import React, { useState, useEffect } from 'react';
import { Search, X, Mail, Phone, Building, MapPin, Shield, Calendar, Power, ChevronLeft, ChevronRight } from 'lucide-react';
import { useQuery, useMutation } from '@apollo/client';
import { gql } from '@apollo/client';
import Header from './../Header/Header';
import {GET_USERS} from './../../graphql/queries'
import {CREATE_USER, UPDATE_USER, SYNC_EMPLOYEES, SEND_PASSWORD_RESET} from './../../graphql/mutations'

const ROLES = [
  { value: 'Administrator', label: 'Administrator', description: 'All rights (ECS Admin Team Members)' },
  { value: 'Standard User', label: 'Standard User', description: 'No Manager User rights (Sales Team Members)' },
  { value: 'External Access', label: 'External Access', description: 'Take-Off Monkey' }
];

interface ManageUsersProps {
  onNavigate?: (page: 'home' | 'form' | 'details' | 'users') => void;
}

export default function ManageUsers({ onNavigate }: ManageUsersProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [sortBy, setSortBy] = useState('lastName');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showUserPanel, setShowUserPanel] = useState(false);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [editedUser, setEditedUser] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const [sendPasswordReset, { loading: sendingReset }] = useMutation(SEND_PASSWORD_RESET, {
    onCompleted: (data) => {
      if (data.sendPasswordReset.success) {
        alert(`Password reset email sent to ${editedUser.email}`);
      } else {
        alert(`Failed to send email: ${data.sendPasswordReset.message}`);
      }
    },
    onError: (error) => {
      alert(`Error sending password reset: ${error.message}`);
    }
  });

  // Fetch users with debounced search
  const { data, loading, refetch } = useQuery(GET_USERS, {
    variables: { search: searchTerm },
  });

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInput);
      setCurrentPage(1); // Reset to first page on search
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Mutations
  const [createUser] = useMutation(CREATE_USER, {
    onCompleted: () => {
      refetch();
      handleClosePanel();
    },
    onError: (error) => {
      alert(`Error creating user: ${error.message}`);
    }
  });

  const [updateUser] = useMutation(UPDATE_USER, {
    onCompleted: () => {
      refetch();
      handleClosePanel();
    },
    onError: (error) => {
      alert(`Error updating user: ${error.message}`);
    }
  });

  const [syncEmployees, { loading: syncing }] = useMutation(SYNC_EMPLOYEES, {
    onCompleted: (data) => {
      if (data.syncEmployees.success) {
        alert(
          `Employee sync completed!\n\n` +
          `Total: ${data.syncEmployees.totalEmployees}\n` +
          `Created: ${data.syncEmployees.created}\n` +
          `Updated: ${data.syncEmployees.updated}\n` +
          `Synced: ${data.syncEmployees.synced}`
        );
        refetch();
      } else {
        alert(`Sync failed: ${data.syncEmployees.message}`);
      }
    },
    onError: (error) => {
      alert(`Error syncing employees: ${error.message}`);
    }
  });

  const handleSyncEmployees = () => {
    if (confirm('This will sync all active employees from P21. Continue?')) {
      syncEmployees();
    }
  };

  const users = data?.users || [];

  // Filter and sort users
  const sortedUsers = [...users].sort((a: any, b: any) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];
    
    // Handle null/undefined values
    if (aValue == null) aValue = '';
    if (bValue == null) bValue = '';
    
    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Pagination
  const ITEMS_PER_PAGE = 25;
  const totalPages = Math.ceil(sortedUsers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedUsers = sortedUsers.slice(startIndex, endIndex);

  const handleAddExternalUser = () => {
    const newUser = {
      username: '',
      firstName: '',
      lastName: '',
      email: '',
      jobType: '',
      phone: '',
      organization: 'Take-Off Monkey',
      branch: null,
      role: 'External Access',
      //status: 'Active',
      password: 'TempPassword123!',
    };
    setEditedUser(newUser);
    setSelectedUser(null);
    setIsAddingUser(true);
    setShowUserPanel(true);
  };

  const handleRowClick = (user: any) => {
    setEditedUser({ ...user });
    setSelectedUser(user);
    setIsAddingUser(false);
    setShowUserPanel(true);
  };

  const handleClosePanel = () => {
    setShowUserPanel(false);
    setSelectedUser(null);
    setEditedUser(null);
    setIsAddingUser(false);
  };

  const handleSave = async () => {
    if (isAddingUser) {
      if (!editedUser.username || !editedUser.email || !editedUser.firstName || !editedUser.lastName) {
        alert('Please fill in all required fields');
        return;
      }

      await createUser({
        variables: {
          input: {
            username: editedUser.username,
            email: editedUser.email,
            password: editedUser.password,
            firstName: editedUser.firstName,
            lastName: editedUser.lastName,
            role: editedUser.role,
            organization: editedUser.organization,
            branch: editedUser.branch,
            phone: editedUser.phone,
            jobType: editedUser.jobType,
            //status: 'Active',
          }
        }
      });
    } else {
      await updateUser({
        variables: {
          id: selectedUser.id,
          input: {
            firstName: editedUser.firstName,
            lastName: editedUser.lastName,
            email: editedUser.email,
            role: editedUser.role,
            branch: editedUser.branch,
            phone: editedUser.phone,
            jobType: editedUser.jobType,
            //status: editedUser.status,
          }
        }
      });
    }
  };

  const handleChangePassword = async () => {
    await sendPasswordReset({
      variables: { email: editedUser.email }
    });
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const clearSearch = () => {
    setSearchInput('');
    setSearchTerm('');
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div style={{ backgroundColor: '#f5f5f5', minHeight: '100vh', padding: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ fontSize: '18px', color: '#6b7280' }}>Loading users...</div>
      </div>
    );
  }

   return (
    <div style={{ backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <Header onNavigate={onNavigate} />
      <div style={{ padding: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '600', color: '#1a1a1a', margin: 0 }}>Manage Users</h1>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={handleSyncEmployees} 
              disabled={syncing}
              style={{ 
                padding: '12px 24px', 
                backgroundColor: syncing ? '#9ca3af' : '#0099d8', 
                color: 'white', 
                border: 'none', 
                fontSize: '14px', 
                fontWeight: '500', 
                cursor: syncing ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }} 
              onMouseEnter={(e) => !syncing && (e.currentTarget.style.backgroundColor = '#0077b3')} 
              onMouseLeave={(e) => !syncing && (e.currentTarget.style.backgroundColor = '#0099d8')}
            >
              {syncing ? (
                <>
                  <span style={{ 
                    display: 'inline-block', 
                    width: '14px', 
                    height: '14px', 
                    border: '2px solid white', 
                    borderRadius: '50%',
                    borderTopColor: 'transparent', 
                    animation: 'spin 0.8s linear infinite'
                  }} />
                  Syncing...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
                  </svg>
                  Sync Employees
                </>
              )}
            </button>
            <button 
              onClick={handleAddExternalUser} 
              style={{ 
                padding: '12px 24px', 
                backgroundColor: '#99cc66', 
                color: 'white', 
                border: 'none', 
                fontSize: '14px', 
                fontWeight: '500', 
                cursor: 'pointer' 
              }} 
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#7ab84a'} 
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#99cc66'}
            >
              Add External User
            </button>
            <button 
              onClick={() => {
                sendPasswordReset({ 
                  variables: { email: 'ktroxell@ewingos.com' } 
                });
              }}
              style={{ padding: '10px 20px', margin: '20px', backgroundColor: '#0099d8', color: 'white' }}
            >
              Test Password Reset
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div style={{ marginBottom: '20px', position: 'relative', maxWidth: '500px' }}>
          <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', color: '#9ca3af' }} />
          <input
            type="text"
            placeholder="Search by name, email, or organization..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 40px 12px 40px',
              border: '1px solid #d1d5db',
              fontSize: '14px',
              outline: 'none'
            }}
            onFocus={(e) => e.currentTarget.style.borderColor = '#0099d8'}
            onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
          />
          {searchInput && (
            <button
              onClick={clearSearch}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <X style={{ width: '18px', height: '18px', color: '#6b7280' }} />
            </button>
          )}
        </div>

        {/* Results Summary */}
        <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '14px', color: '#6b7280' }}>
            Showing {startIndex + 1}-{Math.min(endIndex, sortedUsers.length)} of {sortedUsers.length} users
            {searchTerm && <span style={{ fontWeight: '500', color: '#374151' }}> (filtered)</span>}
          </div>
        </div>

        <div style={{ backgroundColor: 'white', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#0099d8', color: 'white' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }} onClick={() => handleSort('firstName')}>First Name {sortBy === 'firstName' && (sortOrder === 'asc' ? '↑' : '↓')}</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }} onClick={() => handleSort('lastName')}>Last Name {sortBy === 'lastName' && (sortOrder === 'asc' ? '↑' : '↓')}</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }} onClick={() => handleSort('email')}>Email Address {sortBy === 'email' && (sortOrder === 'asc' ? '↑' : '↓')}</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600' }}>Phone Number</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }} onClick={() => handleSort('organization')}>Organization {sortBy === 'organization' && (sortOrder === 'asc' ? '↑' : '↓')}</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600' }}>Branch</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }} onClick={() => handleSort('role')}>Role {sortBy === 'role' && (sortOrder === 'asc' ? '↑' : '↓')}</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.map((user: any, i: number) => (
                <tr key={user.id} onClick={() => handleRowClick(user)} style={{ backgroundColor: i % 2 === 0 ? 'white' : '#f9fafb', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f9ff'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = i % 2 === 0 ? 'white' : '#f9fafb'}>
                  <td style={{ padding: '12px 16px', fontSize: '13px', borderTop: '1px solid #e5e7eb' }}>{user.firstName || '-'}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', borderTop: '1px solid #e5e7eb' }}>{user.lastName || '-'}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', borderTop: '1px solid #e5e7eb' }}>{user.email}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', borderTop: '1px solid #e5e7eb' }}>{user.phone || '-'}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', borderTop: '1px solid #e5e7eb' }}>{user.organization}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', borderTop: '1px solid #e5e7eb', color: '#6b7280' }}>{user.branch || '-'}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', borderTop: '1px solid #e5e7eb' }}>
                    <span style={{ padding: '4px 12px', fontSize: '12px', fontWeight: '500', backgroundColor: user.role === 'Administrator' ? '#dbeafe' : user.role === 'External Access' ? '#fef3c7' : '#f3f4f6', color: user.role === 'Administrator' ? '#1e40af' : user.role === 'External Access' ? '#92400e' : '#374151' }}>{user.role}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {paginatedUsers.length === 0 && (
            <div style={{ padding: '48px', textAlign: 'center', color: '#6b7280' }}>
              {searchTerm ? `No users found matching "${searchTerm}"` : 'No users found'}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                backgroundColor: currentPage === 1 ? '#f9fafb' : 'white',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <ChevronLeft style={{ width: '16px', height: '16px', color: currentPage === 1 ? '#d1d5db' : '#374151' }} />
            </button>

            <div style={{ display: 'flex', gap: '4px' }}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                // Show first page, last page, current page, and pages around current
                const showPage = page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1);
                const showEllipsis = (page === 2 && currentPage > 3) || (page === totalPages - 1 && currentPage < totalPages - 2);

                if (showEllipsis) {
                  return <span key={page} style={{ padding: '8px 4px', color: '#9ca3af' }}>...</span>;
                }

                if (!showPage) return null;

                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    style={{
                      padding: '8px 12px',
                      border: page === currentPage ? 'none' : '1px solid #d1d5db',
                      backgroundColor: page === currentPage ? '#0099d8' : 'white',
                      color: page === currentPage ? 'white' : '#374151',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: page === currentPage ? '600' : '400',
                      minWidth: '36px'
                    }}
                  >
                    {page}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              style={{
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                backgroundColor: currentPage === totalPages ? '#f9fafb' : 'white',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <ChevronRight style={{ width: '16px', height: '16px', color: currentPage === totalPages ? '#d1d5db' : '#374151' }} />
            </button>
          </div>
        )}
      </div>

      {/* User Edit Panel */}
      {showUserPanel && editedUser && (
        <>
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1000 }} onClick={handleClosePanel} />
          <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '600px', backgroundColor: 'white', boxShadow: '-4px 0 24px rgba(0, 0, 0, 0.15)', zIndex: 1001, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>{isAddingUser ? 'Add External User' : 'Edit User Profile'}</h2>
              <button onClick={handleClosePanel} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}><X style={{ width: '24px', height: '24px', color: '#6b7280' }} /></button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#1a1a1a' }}>User Information</h3>

                {isAddingUser && (
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: '#374151' }}>Username <span style={{ color: '#ef4444' }}>*</span></label>
                    <input type="text" value={editedUser.username || ''} onChange={(e) => setEditedUser({ ...editedUser, username: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', fontSize: '14px' }} placeholder="Enter username" />
                  </div>
                )}

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: '#374151' }}>First Name <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="text" value={editedUser.firstName || ''} onChange={(e) => setEditedUser({ ...editedUser, firstName: e.target.value })} disabled={!isAddingUser && editedUser.organization !== 'Take-Off Monkey'} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', fontSize: '14px', backgroundColor: !isAddingUser && editedUser.organization !== 'Take-Off Monkey' ? '#f9fafb' : 'white', cursor: !isAddingUser && editedUser.organization !== 'Take-Off Monkey' ? 'not-allowed' : 'text' }} placeholder="Enter first name" />
                  {!isAddingUser && editedUser.organization !== 'Take-Off Monkey' && <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>Synced from Employee Master</p>}
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: '#374151' }}>Last Name <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="text" value={editedUser.lastName || ''} onChange={(e) => setEditedUser({ ...editedUser, lastName: e.target.value })} disabled={!isAddingUser && editedUser.organization !== 'Take-Off Monkey'} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', fontSize: '14px', backgroundColor: !isAddingUser && editedUser.organization !== 'Take-Off Monkey' ? '#f9fafb' : 'white', cursor: !isAddingUser && editedUser.organization !== 'Take-Off Monkey' ? 'not-allowed' : 'text' }} placeholder="Enter last name" />
                  {!isAddingUser && editedUser.organization !== 'Take-Off Monkey' && <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>Synced from Employee Master</p>}
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: '#374151' }}><Mail style={{ width: '14px', height: '14px', display: 'inline', marginRight: '4px' }} />Email Address <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="email" value={editedUser.email || ''} onChange={(e) => setEditedUser({ ...editedUser, email: e.target.value })} disabled={!isAddingUser && editedUser.organization !== 'Take-Off Monkey'} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', fontSize: '14px', backgroundColor: !isAddingUser && editedUser.organization !== 'Take-Off Monkey' ? '#f9fafb' : 'white', cursor: !isAddingUser && editedUser.organization !== 'Take-Off Monkey' ? 'not-allowed' : 'text' }} placeholder="email@example.com" />
                  {!isAddingUser && editedUser.organization !== 'Take-Off Monkey' && <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>Synced from Employee Master</p>}
                  {editedUser.organization === 'Take-Off Monkey' && <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>Used for Login ID. Changing this will trigger OTP verification.</p>}
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: '#374151' }}>Job Type</label>
                  <input type="text" value={editedUser.jobType || ''} onChange={(e) => setEditedUser({ ...editedUser, jobType: e.target.value })} disabled={!isAddingUser && editedUser.organization !== 'Take-Off Monkey'} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', fontSize: '14px', backgroundColor: !isAddingUser && editedUser.organization !== 'Take-Off Monkey' ? '#f9fafb' : 'white', cursor: !isAddingUser && editedUser.organization !== 'Take-Off Monkey' ? 'not-allowed' : 'text' }} placeholder="Enter job type" />
                  {!isAddingUser && editedUser.organization !== 'Take-Off Monkey' && <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>Synced from Employee Master</p>}
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: '#374151' }}><Phone style={{ width: '14px', height: '14px', display: 'inline', marginRight: '4px' }} />Phone Number</label>
                  <input type="tel" value={editedUser.phone || ''} onChange={(e) => setEditedUser({ ...editedUser, phone: e.target.value })} disabled={!isAddingUser && editedUser.organization !== 'Take-Off Monkey'} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', fontSize: '14px', backgroundColor: !isAddingUser && editedUser.organization !== 'Take-Off Monkey' ? '#f9fafb' : 'white', cursor: !isAddingUser && editedUser.organization !== 'Take-Off Monkey' ? 'not-allowed' : 'text' }} placeholder="(555) 123-4567" />
                  {!isAddingUser && editedUser.organization !== 'Take-Off Monkey' && <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>Synced from Employee Master</p>}
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: '#374151' }}><Building style={{ width: '14px', height: '14px', display: 'inline', marginRight: '4px' }} />Organization <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="text" value={editedUser.organization || ''} onChange={(e) => setEditedUser({ ...editedUser, organization: e.target.value })} disabled={!isAddingUser} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', fontSize: '14px', backgroundColor: !isAddingUser ? '#f9fafb' : 'white', cursor: !isAddingUser ? 'not-allowed' : 'text' }} placeholder="Ewing or Take-Off Monkey" />
                  {!isAddingUser && <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>Cannot be changed after user creation</p>}
                </div>

                {editedUser.organization === 'Ewing' && (
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: '#374151' }}><MapPin style={{ width: '14px', height: '14px', display: 'inline', marginRight: '4px' }} />Region</label>
                    <input type="text" value={editedUser.branch || ''} onChange={(e) => setEditedUser({ ...editedUser, branch: e.target.value })} disabled={!isAddingUser && editedUser.organization !== 'Take-Off Monkey'} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', fontSize: '14px', backgroundColor: !isAddingUser && editedUser.organization !== 'Take-Off Monkey' ? '#f9fafb' : 'white', cursor: !isAddingUser && editedUser.organization !== 'Take-Off Monkey' ? 'not-allowed' : 'text' }} placeholder="Enter branch #" />
                    <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>Based on Employee Home Branch</p>
                  </div>
                )}
              </div>

              <div style={{ paddingTop: '24px', borderTop: '1px solid #e5e7eb' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#1a1a1a' }}>Permissions & Access</h3>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: '#374151' }}><Shield style={{ width: '14px', height: '14px', display: 'inline', marginRight: '4px' }} />Role <span style={{ color: '#ef4444' }}>*</span></label>
                  <select value={editedUser.role || ''} onChange={(e) => setEditedUser({ ...editedUser, role: e.target.value })} disabled={isAddingUser && editedUser.organization === 'Take-Off Monkey'} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', fontSize: '14px', backgroundColor: isAddingUser && editedUser.organization === 'Take-Off Monkey' ? '#f9fafb' : 'white', cursor: isAddingUser && editedUser.organization === 'Take-Off Monkey' ? 'not-allowed' : 'pointer' }}>
                    {ROLES.map(role => <option key={role.value} value={role.value}>{role.label}</option>)}
                  </select>
                  <div style={{ marginTop: '8px', padding: '8px 12px', backgroundColor: '#f0f9ff', fontSize: '12px', color: '#1e40af' }}>
                    {ROLES.find(r => r.value === editedUser.role)?.description || 'Select a role'}
                  </div>
                </div>

                {!isAddingUser && (
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: '#374151' }}><Power style={{ width: '14px', height: '14px', display: 'inline', marginRight: '4px' }} />Status</label>
                    <div style={{ display: 'flex', gap: '16px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                        <input type="radio" name="status" value="Active" checked={editedUser.status === 'Active'} onChange={(e) => setEditedUser({ ...editedUser, status: e.target.value })} style={{ marginRight: '8px' }} />
                        <span style={{ fontSize: '14px' }}>Active</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                        <input type="radio" name="status" value="Inactive" checked={editedUser.status === 'Inactive'} onChange={(e) => setEditedUser({ ...editedUser, status: e.target.value })} style={{ marginRight: '8px' }} />
                        <span style={{ fontSize: '14px' }}>Inactive</span>
                      </label>
                    </div>
                  </div>
                )}

                {!isAddingUser && selectedUser?.lastLogin && (
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: '#374151' }}><Calendar style={{ width: '14px', height: '14px', display: 'inline', marginRight: '4px' }} />Last Login</label>
                    <div style={{ padding: '10px 12px', backgroundColor: '#f9fafb', border: '1px solid #d1d5db', fontSize: '14px', color: '#6b7280' }}>
                      {new Date(selectedUser.lastLogin).toLocaleString()}
                    </div>
                  </div>
                )}

                {!isAddingUser && (
                  <div style={{ marginTop: '24px' }}>
                    <button onClick={handleChangePassword} style={{ padding: '10px 20px', backgroundColor: 'white', color: '#0099d8', border: '1px solid #0099d8', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#0099d8'; e.currentTarget.style.color = 'white'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'white'; e.currentTarget.style.color = '#0099d8'; }}>Send Password Reset Email</button>
                    <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>User will receive an email with a link to reset their password</p>
                  </div>
                )}
              </div>
            </div>

            <div style={{ padding: '24px', borderTop: '1px solid #e5e7eb', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={handleClosePanel} style={{ padding: '10px 24px', backgroundColor: '#6b7280', color: 'white', border: 'none', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSave} style={{ padding: '10px 32px', backgroundColor: '#99cc66', color: 'white', border: 'none', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>Save</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}