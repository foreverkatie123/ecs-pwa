// components/Header/Header.tsx
import React, { useState, useRef, useEffect } from 'react';
import { getCurrentUser, logout, changePassword } from '../../graphql/client';
import ChangePasswordModal from './changePasswordModal';

interface HeaderProps {
  onNavigate?: (page: 'home' | 'form' | 'details' | 'users') => void;
  onLogout?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onNavigate, onLogout }) => {
  const currentUser = getCurrentUser();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    if (onLogout) {
      onLogout();
    } else {
      // Fallback: reload the page
      window.location.reload();
    }
  };

  const handleChangePasswordClick = () => {
    setShowUserMenu(false);
    setShowPasswordModal(true);
  };

  const handlePasswordChange = async (currentPassword: string, newPassword: string) => {
    try {
      await changePassword(currentPassword, newPassword);
      alert('Password changed successfully!');
    } catch (error: any) {
      throw error;
    }
  };

  return (
    <>
      <header className="header">
        <div className="main-header">
          <img 
            src="/ecsLogo.png" 
            alt="Ewing Commercial Services" 
            className="header-logo"
            style={{ cursor: 'pointer' }}
            onClick={() => onNavigate && onNavigate('home')}
          />

          <div className="header-actions">
            <button 
              className="header-button"
              onClick={() => onNavigate && onNavigate('home')}
            >
              <img
                src="/Icon.png" 
                alt="Heartbeat Icon" 
                className="header-icon"
              />
              <span className="header-text">Project Dashboard</span>
            </button>
            <button 
              className="header-button"
              onClick={() => onNavigate && onNavigate('details')}
            >
              <img
                src="/Calendar.png" 
                alt="Calendar Icon" 
                className="header-icon"
              />
              <span className="header-text">Calendar</span>
            </button>
            
            {/* Show Manage Users only for Administrators */}
            {currentUser?.role === 'Administrator' && (
              <button
                className="header-button"
                onClick={() => onNavigate && onNavigate('users')}
              >
                <img 
                  src="/manageUsers.png" 
                  alt="People Silhouette Icon" 
                  className="header-icon" 
                />
                <span className="header-text">Manage Users</span>
              </button>
            )}
            
            {/* User Menu with Dropdown */}
            <div style={{ position: 'relative' }} ref={dropdownRef}>
              <button 
                className="header-button"
                onClick={() => setShowUserMenu(!showUserMenu)}
                onMouseEnter={() => setShowUserMenu(true)}
              >
                <span className="header-text">
                  {currentUser?.firstName && currentUser?.lastName 
                    ? `${currentUser.firstName} ${currentUser.lastName}`
                    : currentUser?.username || 'User'}
                </span>
                <img
                  src="/Vector.png" 
                  alt="Downward Facing Carrot Icon" 
                  className="header-vector"
                  style={{
                    transform: showUserMenu ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease'
                  }}
                />
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '4px',
                    backgroundColor: 'white',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    minWidth: '200px',
                    zIndex: 1000,
                    overflow: 'hidden',
                    border: '1px solid #e5e7eb'
                  }}
                  onMouseLeave={() => setShowUserMenu(false)}
                >
                  <button
                    onClick={handleChangePasswordClick}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: 'none',
                      background: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '14px',
                      color: '#374151',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      transition: 'background-color 0.15s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                    Change Password
                  </button>

                  <div style={{ height: '1px', backgroundColor: '#e5e7eb', margin: '0' }}></div>

                  <button
                    onClick={handleLogout}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: 'none',
                      background: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '14px',
                      color: '#dc2626',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      fontWeight: '500',
                      transition: 'background-color 0.15s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                      <polyline points="16 17 21 12 16 7"></polyline>
                      <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Password Change Modal */}
      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSubmit={handlePasswordChange}
      />
    </>
  );
};

export default Header;