// In-memory OAuth authorization code store
// Codes expire after 30 seconds for one-time use

import crypto from 'crypto';

const authCodes = new Map();

export function generateAuthCode(tokenData) {
  // Use cryptographically secure random bytes instead of Math.random()
  const code = crypto.randomUUID();
  
  authCodes.set(code, {
    data: tokenData,
    expiresAt: Date.now() + 30000  // 30 seconds
  });
  
  // Auto-delete after 30 seconds as backup
  setTimeout(() => authCodes.delete(code), 30000);
  
  return code;
}

/**
 * Exchange a code for token data (one-time use, checks expiration)
 * @param {string} code - Authorization code
 * @returns {Object|null} { token, user } or null if invalid/expired
 */
export function exchangeAuthCode(code) {
  const entry = authCodes.get(code);
  
  if (!entry) {
    return null;
  }
  
  // Check expiration explicitly
  if (Date.now() > entry.expiresAt) {
    authCodes.delete(code);
    return null;
  }
  
  // One-time use — delete immediately
  authCodes.delete(code);
  
  return entry.data;
}
