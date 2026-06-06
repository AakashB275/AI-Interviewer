// In-memory OAuth authorization code store
// Codes expire after 30 seconds for one-time use

const authCodes = new Map();

export function generateAuthCode(tokenData) {
  const code = Math.random().toString(36).substring(2, 15) + 
               Math.random().toString(36).substring(2, 15);
  
  authCodes.set(code, tokenData);
  
  // Auto-delete after 30 seconds
  setTimeout(() => authCodes.delete(code), 30000);
  
  return code;
}

export function exchangeAuthCode(code) {
  const data = authCodes.get(code);
  
  if (!data) {
    return null;
  }
  
  // Delete immediately (one-time use)
  authCodes.delete(code);
  
  return data;
}
