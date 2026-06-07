import crypto from 'crypto';

const authCodes = new Map();

export function generateAuthCode(tokenData) {
  const code = crypto.randomUUID();

  authCodes.set(code, {
    data: tokenData,
    expiresAt: Date.now() + 30000
  });

  setTimeout(() => authCodes.delete(code), 30000);

  return code;
}

export function exchangeAuthCode(code) {
  const entry = authCodes.get(code);

  if (!entry) {
    return null;
  }

  if (Date.now() > entry.expiresAt) {
    authCodes.delete(code);
    return null;
  }

  authCodes.delete(code);

  return entry.data;
}
