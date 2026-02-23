// components/IrrigationLogin/irrigationLogin.tsx
import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { LOGIN_MUTATION } from '../../graphql/authMutations';
import {SEND_PASSWORD_RESET} from './../../graphql/mutations'

interface IrrigationLoginProps {
  onLoginSuccess: (token: string, user: any) => void;
}

export default function IrrigationLogin({ onLoginSuccess }: IrrigationLoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [login, { loading: loginLoading }] = useMutation(LOGIN_MUTATION, {
    onCompleted: (data) => {
      const { token, user } = data.login;
      // Store token in localStorage
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(user));
      onLoginSuccess(token, user);
    },
    onError: (error) => {
      setError(error.message);
    }
  });

  const handleLogin = async () => {
    setError('');
    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }

    try {
      await login({
        variables: { username, password }
      });
    } catch (err) {
      // Error is handled by onError callback
    }
  };

  const [sendPasswordReset, { loading: sendingReset }] = useMutation(SEND_PASSWORD_RESET, {
      onCompleted: (data) => {
        if (data.requestPasswordReset.success) {
          alert(`Password reset email sent to ${resetEmail}`);
        } else {
          alert(`Failed to send email: ${data.sendPasswordReset.message}`);
        }
      },
      onError: (error) => {
        alert(`Error sending password reset: ${error.message}`);
      }
    });

  if (showForgotPassword) {
    return (
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundImage: 'url(/loginBackground.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          margin: 0,
          padding: 16,
          width: '100%',
          height: '100vh',
          position: 'fixed',
          top: 0,
          left: 0
        }}
      >
        <div 
          className="rounded-lg shadow-2xl relative" 
          style={{ 
            zIndex: 10,
            backgroundColor: '#FFFFFF',
            padding: '48px 40px',
            width: '33%',
            minWidth: '400px'
          }}
        >
          <button
            onClick={() => {
              setShowForgotPassword(false);
              setError('');
              setSuccessMessage('');
            }}
            className="absolute"
            style={{
              top: '16px',
              left: '16px',
              background: 'none',
              border: 'none',
              color: '#9CA3AF',
              fontSize: '24px',
              cursor: 'pointer',
              lineHeight: '1'
            }}
          >
            ← Back
          </button>
          
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <img 
              src="/logo.png" 
              alt="Ewing Outdoor Supply" 
              style={{ 
                width: '70%',
                marginBottom: '24px',
                display: 'inline-block'
              }} 
            />
            <h2 style={{ 
              fontSize: '24px', 
              fontWeight: '600', 
              color: '#1F2937',
              marginBottom: '8px'
            }}>
              Reset Password
            </h2>
            <p style={{ 
              fontSize: '14px', 
              color: '#6B7280',
              margin: 0
            }}>
              Enter your email address and we'll send you a link to reset your password. Do more with this later!
            </p>
          </div>
          
          {error && (
            <div style={{
              backgroundColor: '#FEE2E2',
              border: '1px solid #EF4444',
              color: '#DC2626',
              padding: '12px',
              marginBottom: '16px',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          {successMessage && (
            <div style={{
              backgroundColor: '#D1FAE5',
              border: '1px solid #10B981',
              color: '#059669',
              padding: '12px',
              marginBottom: '16px',
              fontSize: '14px'
            }}>
              {successMessage}
            </div>
          )}
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ position: 'relative' }}>
              <label
                htmlFor="resetEmail"
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: resetEmail ? '-8px' : '12px',
                  fontSize: resetEmail ? '11px' : '14px',
                  color: '#6B7280',
                  backgroundColor: '#FFFFFF',
                  padding: '0 4px',
                  transition: 'all 0.2s ease',
                  pointerEvents: 'none'
                }}
              >
                Email Address
              </label>
              <input
                id="resetEmail"
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                disabled={sendingReset}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #D1D5DB',
                  fontSize: '14px',
                  outline: 'none'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3B82F6';
                  e.target.style.boxShadow = '0 0 0 1px #3B82F6';
                  const label = e.target.previousElementSibling as HTMLElement;
                  if (label) {
                    label.style.top = '-8px';
                    label.style.fontSize = '11px';
                  }
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#D1D5DB';
                  e.target.style.boxShadow = 'none';
                  if (!resetEmail) {
                    const label = e.target.previousElementSibling as HTMLElement;
                    if (label) {
                      label.style.top = '12px';
                      label.style.fontSize = '14px';
                    }
                  }
                }}
              />
            </div>
            
            <button
              onClick={() => {
                sendPasswordReset({ 
                  variables: { email: resetEmail } 
                });
              }}
              disabled={sendingReset}
              style={{
                backgroundColor: sendingReset ? '#D1D5DB' : '#99CC66',
                color: 'white',
                padding: '12px 32px',
                border: 'none',
                fontSize: '14px',
                fontWeight: '500',
                cursor: sendingReset ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s',
                marginTop: '8px',
                width: '100%'
              }}
              onMouseEnter={(e) => !sendingReset && (e.currentTarget.style.backgroundColor = '#7AB84A')}
              onMouseLeave={(e) => !sendingReset && (e.currentTarget.style.backgroundColor = '#99CC66')}
            >
              {sendingReset ? 'Sending...' : 'Send Reset Link'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundImage: 'url(/loginBackground.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        margin: 0,
        padding: 16,
        width: '100%',
        height: '100vh',
        position: 'fixed',
        top: 0,
        left: 0
      }}
    >
      <div 
        className="rounded-lg shadow-2xl relative" 
        style={{ 
          zIndex: 10,
          backgroundColor: '#FFFFFF',
          padding: '48px 40px',
          width: '33%',
          minWidth: '400px'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <img 
            src="/logo.png" 
            alt="Ewing Outdoor Supply" 
            style={{ 
              width: '70%',
              marginBottom: '0',
              display: 'inline-block'
            }} 
          />
        </div>

        {error && (
          <div style={{
            backgroundColor: '#FEE2E2',
            border: '1px solid #EF4444',
            color: '#DC2626',
            padding: '12px',
            marginBottom: '16px',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ position: 'relative' }}>
            <label
              htmlFor="username"
              style={{
                position: 'absolute',
                left: '12px',
                top: username ? '-8px' : '12px',
                fontSize: username ? '11px' : '14px',
                color: '#6B7280',
                backgroundColor: '#FFFFFF',
                padding: '0 4px',
                transition: 'all 0.2s ease',
                pointerEvents: 'none'
              }}
            >
              User Name
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              disabled={loginLoading}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #D1D5DB',
                fontSize: '14px',
                outline: 'none'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3B82F6';
                e.target.style.boxShadow = '0 0 0 1px #3B82F6';
                const label = e.target.previousElementSibling as HTMLElement;
                if (label) {
                  label.style.top = '-8px';
                  label.style.fontSize = '11px';
                }
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#D1D5DB';
                e.target.style.boxShadow = 'none';
                if (!username) {
                  const label = e.target.previousElementSibling as HTMLElement;
                  if (label) {
                    label.style.top = '12px';
                    label.style.fontSize = '14px';
                  }
                }
              }}
            />
          </div>
          
          <div style={{ position: 'relative' }}>
            <label
              htmlFor="password"
              style={{
                position: 'absolute',
                left: '12px',
                top: password ? '-8px' : '12px',
                fontSize: password ? '11px' : '14px',
                color: '#6B7280',
                backgroundColor: '#FFFFFF',
                padding: '0 4px',
                transition: 'all 0.2s ease',
                pointerEvents: 'none'
              }}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              disabled={loginLoading}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #D1D5DB',
                fontSize: '14px',
                outline: 'none'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3B82F6';
                e.target.style.boxShadow = '0 0 0 1px #3B82F6';
                const label = e.target.previousElementSibling as HTMLElement;
                if (label) {
                  label.style.top = '-8px';
                  label.style.fontSize = '11px';
                }
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#D1D5DB';
                e.target.style.boxShadow = 'none';
                if (!password) {
                  const label = e.target.previousElementSibling as HTMLElement;
                  if (label) {
                    label.style.top = '12px';
                    label.style.fontSize = '14px';
                  }
                }
              }}
            />
          </div>
          
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            marginTop: '8px'
          }}>
            <a 
              onClick={() => {
                setShowForgotPassword(true);
                setError('');
              }}
              style={{
                fontSize: '14px',
                fontWeight: '700',
                color: '#0099D8',
                textDecoration: 'none',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
              onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
            >
              Forgot your password?
            </a>
            <button
              onClick={handleLogin}
              disabled={loginLoading}
              style={{
                backgroundColor: loginLoading ? '#D1D5DB' : '#99CC66',
                color: 'white',
                padding: '10px 32px',
                border: 'none',
                fontSize: '14px',
                fontWeight: '500',
                cursor: loginLoading ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => !loginLoading && (e.currentTarget.style.backgroundColor = '#7AB84A')}
              onMouseLeave={(e) => !loginLoading && (e.currentTarget.style.backgroundColor = '#99CC66')}
            >
              {loginLoading ? 'Logging in...' : 'Login'}
            </button>
          </div>
        </div>

        {/* Test credentials hint */}
        <div style={{
          marginTop: '24px',
          padding: '12px',
          backgroundColor: '#F3F4F6',
          fontSize: '12px',
          color: '#6B7280'
        }}>
          <strong>Test Credentials:</strong><br />
          Username: admin<br />
          Password: SuperDuper1!
        </div>
      </div>
    </div>
  );
}