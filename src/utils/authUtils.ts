// Auth Store - Enhanced with Tenant Context
// Note: Import as 'import jwtDecode from "jwt-decode"' not named import
// For now, we'll use a simpler approach without external dependencies

const TOKEN_KEY = 'auth_token';

interface JWTPayload {
  sub: number; // user ID
  username: string;
  tenantId?: string;
  tenantRole?: string;
  iat?: number;
  exp?: number;
}

let cachedToken: string | null = null;
let cachedPayload: JWTPayload | null = null;

/**
 * Simple JWT decoder (doesn't verify signature - that's done server-side)
 */
function decodeJWT(token: string): JWTPayload {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    throw new Error('Invalid JWT token');
  }
}

export async function getToken(): Promise<string | null> {
  if (cachedToken) {
    return cachedToken;
  }
  
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    cachedToken = token;
  }
  return token;
}

export async function setToken(token: string): Promise<void> {
  localStorage.setItem(TOKEN_KEY, token);
  cachedToken = token;
  cachedPayload = null; // Clear cached payload
}

export async function removeToken(): Promise<void> {
  localStorage.removeItem(TOKEN_KEY);
  cachedToken = null;
  cachedPayload = null;
}

export async function isAuthenticated(): Promise<boolean> {
  const token = await getToken();
  if (!token) return false;
  
  try {
    const payload = decodeToken(token);
    if (!payload.exp) return true;
    
    // Check if token is expired
    const now = Date.now() / 1000;
    return payload.exp > now;
  } catch {
    return false;
  }
}

/**
 * Decode JWT and extract payload
 */
export function decodeToken(token?: string): JWTPayload {
  if (cachedPayload && token === cachedToken) {
    return cachedPayload;
  }
  
  const tokenToUse = token || cachedToken;
  if (!tokenToUse) {
    throw new Error('No token available');
  }
  
  try {
    const payload = decodeJWT(tokenToUse);
    if (token === cachedToken) {
      cachedPayload = payload;
    }
    return payload;
  } catch (error) {
    throw new Error('Invalid token');
  }
}

/**
 * Get current user ID from JWT
 */
export async function getCurrentUserId(): Promise<number | null> {
  try {
    const token = await getToken();
    if (!token) return null;
    
    const payload = decodeToken(token);
    return payload.sub;
  } catch {
    return null;
  }
}

/**
 * Get current tenant ID from JWT (synchronous)
 */
export function getCurrentTenantIdSync(): string | null {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;
    
    const payload = decodeToken(token);
    return payload.tenantId || null;
  } catch {
    return null;
  }
}

/**
 * Get current tenant ID from JWT
 */
export async function getCurrentTenantId(): Promise<string | null> {
  try {
    const token = await getToken();
    if (!token) return null;
    
    const payload = decodeToken(token);
    return payload.tenantId || null;
  } catch {
    return null;
  }
}

/**
 * Get current tenant role from JWT
 */
export async function getCurrentTenantRole(): Promise<string | null> {
  try {
    const token = await getToken();
    if (!token) return null;
    
    const payload = decodeToken(token);
    return payload.tenantRole || null;
  } catch {
    return null;
  }
}

/**
 * Get full user context from JWT
 */
export async function getUserContext(): Promise<{
  userId: number;
  username: string;
  tenantId: string;
  tenantRole: string;
} | null> {
  try {
    const token = await getToken();
    if (!token) return null;
    
    const payload = decodeToken(token);
    
    if (!payload.tenantId) {
      console.warn('⚠️ JWT token missing tenantId - user needs to re-login');
      return null;
    }
    
    return {
      userId: payload.sub,
      username: payload.username,
      tenantId: payload.tenantId,
      tenantRole: payload.tenantRole || 'member',
    };
  } catch (error) {
    console.error('Failed to get user context:', error);
    return null;
  }
}
