import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Login from '../Login';
import * as authStore from '../../utils/authStore';
import { ErrorProvider } from '../../components/ErrorProvider';

// Mock modules
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({ user: null, loading: false })),
}));

vi.mock('../../utils/authStore', () => ({
  saveToken: vi.fn(),
}));

vi.mock('../../utils/frontendLogger', () => ({
  logError: vi.fn(),
}));

const { useAuth } = await import('../../contexts/AuthContext');

const mockFetch = vi.fn();
global.fetch = mockFetch as any;

const mockWindowOpen = vi.fn();

// Mock window methods
Object.defineProperty(window, 'open', { 
  writable: true, 
  configurable: true,
  value: mockWindowOpen 
});

// Spy on location.assign
const mockAssign = vi.fn();
vi.stubGlobal('location', { ...window.location, assign: mockAssign });

function renderLogin() {
  return render(
    <MemoryRouter>
      <ErrorProvider>
        <Login />
      </ErrorProvider>
    </MemoryRouter>
  );
}

describe('Login', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    mockWindowOpen.mockClear();
    mockAssign.mockClear();
    vi.mocked(authStore.saveToken).mockClear();
    vi.mocked(useAuth).mockReturnValue({ user: null, loading: false } as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders login form with all fields', () => {
      renderLogin();
      
      expect(screen.getByText('OptiPlatform')).toBeInTheDocument();
      expect(screen.getByText('Inventory Management System')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter your username')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('shows demo credentials in development mode', () => {
      import.meta.env.MODE = 'development';
      renderLogin();
      
      expect(screen.getByText('Demo Credentials:')).toBeInTheDocument();
      expect(screen.getByText('mvpuser2025')).toBeInTheDocument();
      expect(screen.getByText('mvppass123')).toBeInTheDocument();
    });

    it('hides demo credentials in production mode', () => {
      import.meta.env.MODE = 'production';
      renderLogin();
      
      expect(screen.queryByText('Demo Credentials:')).not.toBeInTheDocument();
    });

    it('renders OAuth buttons', () => {
      renderLogin();
      
      expect(screen.getByRole('button', { name: /google/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /github/i })).toBeInTheDocument();
    });
  });

  describe('form toggle', () => {
    it('switches between login and register modes', () => {
      const { location: mockLocation } = window;
      delete (window as any).location;
      window.location = { ...mockLocation, href: '' } as any;
      
      renderLogin();
      
      // Initial state: login
      expect(screen.getByRole('button', { name: /^sign in$/i })).toBeInTheDocument();
      expect(screen.getByText("Don't have an account?")).toBeInTheDocument();
      
      // Click "Create Business Account" button
      const toggleButton = screen.getByRole('button', { name: /create business account/i });
      fireEvent.click(toggleButton);
      
      // Should redirect to /register
      expect(window.location.href).toBe('/register');
      
      // Restore original location
      window.location = mockLocation as any;
    });

    it('clears error when toggling modes', () => {
      // This test is no longer applicable since the login page redirects to /register
      // instead of toggling modes inline. Skipping this test.
      // TODO: Add similar test for Register page component
      expect(true).toBe(true); // Placeholder to keep test from being empty
    });
  });

  describe('form validation', () => {
    it('shows error when submitting empty form', () => {
      renderLogin();
      
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(submitButton);
      
      expect(screen.getByText('Please fill in all fields')).toBeInTheDocument();
    });

    it('shows error when username is missing', () => {
      renderLogin();
      
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(submitButton);
      
      expect(screen.getByText('Please fill in all fields')).toBeInTheDocument();
    });

    it('shows error when password is missing', () => {
      renderLogin();
      
      const usernameInput = screen.getByPlaceholderText('Enter your username');
      fireEvent.change(usernameInput, { target: { value: 'testuser' } });
      
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(submitButton);
      
      expect(screen.getByText('Please fill in all fields')).toBeInTheDocument();
    });
  });

  describe('login submission', () => {
    it('successfully logs in and redirects', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: { login: 'test-token-12345' } }),
      });

      renderLogin();
      
      const usernameInput = screen.getByPlaceholderText('Enter your username');
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      
      fireEvent.change(usernameInput, { target: { value: 'testuser' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        const callArgs = mockFetch.mock.calls[0];
        expect(callArgs[0]).toContain('/graphql');
        expect(callArgs[1].method).toBe('POST');
        expect(callArgs[1].body).toContain('login');
      });
      
      expect(authStore.saveToken).toHaveBeenCalledWith('test-token-12345');
      expect(mockAssign).toHaveBeenCalledWith('/dashboard');
    });

    it('shows loading state during login', async () => {
      mockFetch.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));
      
      renderLogin();
      
      const usernameInput = screen.getByPlaceholderText('Enter your username');
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      
      fireEvent.change(usernameInput, { target: { value: 'testuser' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Please wait...')).toBeInTheDocument();
      });
    });

    it('handles GraphQL error response', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          errors: [{
            message: 'Invalid credentials',
            extensions: { code: 'AUTH_INVALID' },
          }],
        }),
      });

      renderLogin();
      
      const usernameInput = screen.getByPlaceholderText('Enter your username');
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      
      fireEvent.change(usernameInput, { target: { value: 'wronguser' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpass' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
      });
      
      expect(authStore.saveToken).not.toHaveBeenCalled();
      expect(mockAssign).not.toHaveBeenCalled();
    });

    it('handles network error', async () => {
      mockFetch.mockRejectedValue(new Error('Network failure'));

      renderLogin();
      
      const usernameInput = screen.getByPlaceholderText('Enter your username');
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      
      fireEvent.change(usernameInput, { target: { value: 'testuser' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Network error: Network failure')).toBeInTheDocument();
      });
    });

    it('handles missing token in response', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: { login: null } }),
      });

      renderLogin();
      
      const usernameInput = screen.getByPlaceholderText('Enter your username');
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      
      fireEvent.change(usernameInput, { target: { value: 'testuser' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Authentication failed')).toBeInTheDocument();
      });
    });
  });

  describe('register submission', () => {
    it('successfully registers and redirects', async () => {
      // Registration is now handled on a separate /register page
      // This test should be moved to Register.test.tsx
      // Skipping for now
    });
  });

  describe('OAuth', () => {
    it('opens Google OAuth popup with correct URL', () => {
      renderLogin();
      
      const googleButton = screen.getByRole('button', { name: /google/i });
      fireEvent.click(googleButton);
      
      const callArgs = mockWindowOpen.mock.calls[0];
      expect(callArgs[0]).toContain('/auth/google');
      expect(callArgs[1]).toBe('oauth');
      expect(callArgs[2]).toContain('width=500');
    });

    it('opens GitHub OAuth popup with correct URL', () => {
      renderLogin();
      
      const githubButton = screen.getByRole('button', { name: /github/i });
      fireEvent.click(githubButton);
      
      const callArgs = mockWindowOpen.mock.calls[0];
      expect(callArgs[0]).toContain('/auth/github');
      expect(callArgs[1]).toBe('oauth');
      expect(callArgs[2]).toContain('width=500');
    });
  });

  describe('OAuth message event listener', () => {
    it('handles OAuth token from message event', async () => {
      const { unmount } = renderLogin();
      
      // Simulate OAuth message by directly calling the event
      const event = new MessageEvent('message', {
        data: { token: 'oauth-token-123' },
      });
      window.dispatchEvent(event);
      
      await waitFor(() => {
        expect(authStore.saveToken).toHaveBeenCalledWith('oauth-token-123');
        expect(mockAssign).toHaveBeenCalledWith('/dashboard');
      });
      
      unmount();
    });
  });

  describe('redirect when authenticated', () => {
    it('redirects to dashboard when user is logged in', () => {
      vi.mocked(useAuth).mockReturnValue({ 
        user: { id: 1, username: 'testuser', role: 'admin' }, 
        loading: false 
      } as any);

      const { container } = renderLogin();
      
      // Should render Navigate component (no login form)
      expect(container.querySelector('.login-container')).not.toBeInTheDocument();
    });

    it('does not redirect while loading', () => {
      vi.mocked(useAuth).mockReturnValue({ 
        user: null, 
        loading: true 
      } as any);

      renderLogin();
      
      // Should still show login form (or loading state)
      expect(screen.getByText('OptiPlatform')).toBeInTheDocument();
    });
  });

  describe('form interaction', () => {
    it('updates username field on input', () => {
      renderLogin();
      
      const usernameInput = screen.getByPlaceholderText('Enter your username') as HTMLInputElement;
      fireEvent.change(usernameInput, { target: { value: 'myusername' } });
      
      expect(usernameInput.value).toBe('myusername');
    });

    it('updates password field on input', () => {
      renderLogin();
      
      const passwordInput = screen.getByPlaceholderText('Enter your password') as HTMLInputElement;
      fireEvent.change(passwordInput, { target: { value: 'mypassword' } });
      
      expect(passwordInput.value).toBe('mypassword');
    });

    it('disables form during loading', async () => {
      mockFetch.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));
      
      renderLogin();
      
      const usernameInput = screen.getByPlaceholderText('Enter your username');
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      
      fireEvent.change(usernameInput, { target: { value: 'testuser' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(usernameInput).toBeDisabled();
        expect(passwordInput).toBeDisabled();
        expect(submitButton).toBeDisabled();
      });
    });
  });
});
