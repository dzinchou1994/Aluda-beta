import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';

export interface SessionData {
  sessionId: string;
  userId?: string;
  guestId?: string;
  expiresAt: Date;
}

const SESSION_COOKIE_NAME = 'aluda_session';
const SESSION_DURATION_DAYS = 7;

/**
 * Generate a new session ID
 */
export function generateSessionId(): string {
  return uuidv4();
}

/**
 * Create a new session cookie
 */
export function createSessionCookie(sessionId: string, userId?: string, guestId?: string): void {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);
  
  const cookieStore = cookies();
  cookieStore.set(SESSION_COOKIE_NAME, JSON.stringify({
    sessionId,
    userId,
    guestId,
    expiresAt: expiresAt.toISOString(),
  }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
    path: '/',
  });
}

/**
 * Get session data from cookie
 */
export function getSessionFromCookie(): SessionData | null {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
    
    if (!sessionCookie?.value) {
      return null;
    }
    
    const sessionData: SessionData = JSON.parse(sessionCookie.value);
    
    // Check if session has expired
    if (new Date(sessionData.expiresAt) < new Date()) {
      // Clear expired cookie
      cookieStore.delete(SESSION_COOKIE_NAME);
      return null;
    }
    
    return sessionData;
  } catch (error) {
    console.error('Error parsing session cookie:', error);
    return null;
  }
}

/**
 * Clear session cookie
 */
export function clearSessionCookie(): void {
  const cookieStore = cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Get or create a session for the current request
 */
export function getOrCreateSession(): SessionData {
  let sessionData = getSessionFromCookie();
  
  if (!sessionData) {
    // Create new guest session
    const sessionId = generateSessionId();
    const guestId = uuidv4();
    
    sessionData = {
      sessionId,
      guestId,
      expiresAt: new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000),
    };
    
    createSessionCookie(sessionId, undefined, guestId);
  }
  
  return sessionData;
}

/**
 * Update session with user ID after authentication
 */
export function updateSessionWithUser(sessionId: string, userId: string): void {
  const sessionData = getSessionFromCookie();
  
  if (sessionData && sessionData.sessionId === sessionId) {
    createSessionCookie(sessionId, userId, sessionData.guestId);
  }
}
