import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

export default function Register() {
  const navigate = useNavigate();

  return (
    <div className="login-container">
      <div className="login-card" style={{ maxWidth: '600px' }}>
        <div className="login-header">
          <h1 className="login-title">Create Your Business Account</h1>
          <p className="login-subtitle">Start your 14-day free trial</p>
        </div>

        <p style={{ textAlign: 'center', padding: '2rem' }}>
          Business registration form will be available soon.
        </p>

        <div className="login-toggle-container" style={{ marginTop: '1.5rem' }}>
          <span className="login-toggle-text">Already have an account?</span>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="login-toggle-button"
          >
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
}
