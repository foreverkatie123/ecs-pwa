import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import { RESET_PASSWORD } from '../../graphql/mutations';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [resetPassword, { loading }] = useMutation(RESET_PASSWORD, {
    onCompleted: (data) => {
      if (data.resetPassword.success) {
        setCompleted(true);
      } else {
        setErrorMsg(data.resetPassword.message);
      }
    },
    onError: (error) => {
      setErrorMsg('An error occurred. Please try again.');
    }
  });

  const handleSubmit = async () => {
    setErrorMsg('');

    if (!newPassword || !confirmPassword) {
      setErrorMsg('Please fill in all fields.');
      return;
    }
    if (newPassword.length < 8) {
      setErrorMsg('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    if (!token || !email) {
      setErrorMsg('Invalid reset link. Please request a new password reset.');
      return;
    }

    await resetPassword({
      variables: { token, email, newPassword }
    });
  };

  // Success state
  if (completed) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ backgroundColor: 'white', padding: '48px', maxWidth: '440px', width: '100%', textAlign: 'center', border: '1px solid #e5e7eb' }}>
          <div style={{ width: '56px', height: '56px', backgroundColor: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: '600', color: '#1a1a1a', margin: '0 0 12px' }}>Password Reset!</h2>
          <p style={{ color: '#6b7280', fontSize: '15px', margin: '0 0 32px' }}>
            Your password has been reset successfully. You can now log in with your new password.
          </p>
          <a href="/login" style={{ display: 'inline-block', backgroundColor: '#0099d8', color: 'white', padding: '12px 32px', textDecoration: 'none', fontSize: '15px', fontWeight: '500' }}>
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  // Form state
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ backgroundColor: 'white', padding: '48px', maxWidth: '440px', width: '100%', border: '1px solid #e5e7eb' }}>
        
        {/* Logo */}
        <img 
          src="https://www.ewingirrigation.com/media/wysiwyg/ewing-outdoor-logo-resize-new.png" 
          style={{ width: '120px', marginBottom: '32px', display: 'block' }} 
        />

        <h2 style={{ fontSize: '22px', fontWeight: '600', color: '#1a1a1a', margin: '0 0 8px' }}>Set New Password</h2>
        <p style={{ color: '#6b7280', fontSize: '14px', margin: '0 0 32px' }}>
          Resetting password for <strong>{email}</strong>
        </p>

        {/* Error message */}
        {errorMsg && (
          <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '12px 16px', fontSize: '14px', marginBottom: '24px' }}>
            {errorMsg}
          </div>
        )}

        {/* New Password */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
            New Password
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min. 8 characters"
              style={{ width: '100%', padding: '10px 40px 10px 12px', border: '1px solid #d1d5db', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              onFocus={(e) => e.currentTarget.style.borderColor = '#0099d8'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
            />
            <button
              onClick={() => setShowPassword(!showPassword)}
              style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: '12px' }}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div style={{ marginBottom: '32px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
            Confirm Password
          </label>
          <input
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter your password"
            style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
            onFocus={(e) => e.currentTarget.style.borderColor = '#0099d8'}
            onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
          />
          {/* Password match indicator */}
          {confirmPassword && (
            <p style={{ fontSize: '12px', marginTop: '4px', color: newPassword === confirmPassword ? '#16a34a' : '#dc2626' }}>
              {newPassword === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
            </p>
          )}
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{ width: '100%', padding: '12px', backgroundColor: loading ? '#9ca3af' : '#0099d8', color: 'white', border: 'none', fontSize: '15px', fontWeight: '500', cursor: loading ? 'not-allowed' : 'pointer' }}
          onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#0077b3')}
          onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = '#0099d8')}
        >
          {loading ? 'Resetting...' : 'Reset Password'}
        </button>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px', color: '#9ca3af' }}>
          Remember your password?{' '}
          <a href="/login" style={{ color: '#0099d8', textDecoration: 'none' }}>Log in</a>
        </p>
      </div>
    </div>
  );
}
