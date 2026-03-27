"use client";

import { useState, useEffect, useCallback } from "react";

// ---------------------------------------------------------------------------
// In-memory JWT store — module-level variable, never written to localStorage,
// sessionStorage, or any DOM attribute (Requirements 4.4).
// ---------------------------------------------------------------------------
let _jwt: string | null = null;

/** Replace the in-memory JWT. Call this after a successful wallet auth. */
export function setJwt(token: string | null): void {
  _jwt = token;
}

// ---------------------------------------------------------------------------
// JWT helpers
// ---------------------------------------------------------------------------

interface JwtPayload {
  exp?: number;
  [key: string]: unknown;
}

/**
 * Decode the payload of a JWT without verifying the signature.
 * Returns null if the token is malformed.
 */
function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    // Base64url → Base64 → JSON
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(base64);
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * Returns the number of milliseconds until the JWT expires, or 0 if it is
 * already expired / has no `exp` claim.
 */
function msUntilExpiry(token: string): number {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return 0;
  const expiresAt = payload.exp * 1000; // exp is in seconds
  return Math.max(0, expiresAt - Date.now());
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface UseAuthReturn {
  /** The raw JWT string, or null when unauthenticated. */
  jwt: string | null;
  /** True when a non-expired JWT is present. */
  isAuthenticated: boolean;
  /**
   * Call this to manually trigger expiry handling — clears the in-memory JWT
   * and sets isAuthenticated to false. Also called automatically when the
   * token's `exp` claim is reached (Requirements 4.3).
   */
  onExpiry: () => void;
}

/**
 * Reads the JWT from the in-memory store (never from localStorage or DOM
 * attributes) and exposes authentication state plus an expiry callback.
 *
 * Requirements: 4.1, 4.3, 4.4
 */
export function useAuth(): UseAuthReturn {
  const [jwt, setJwtState] = useState<string | null>(() => _jwt);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    () => _jwt !== null && msUntilExpiry(_jwt) > 0,
  );

  const onExpiry = useCallback(() => {
    _jwt = null;
    setJwtState(null);
    setIsAuthenticated(false);
  }, []);

  // Schedule automatic expiry detection whenever the JWT changes.
  useEffect(() => {
    if (!jwt) {
      setIsAuthenticated(false);
      return;
    }

    const remaining = msUntilExpiry(jwt);

    if (remaining === 0) {
      // Already expired — trigger immediately.
      onExpiry();
      return;
    }

    setIsAuthenticated(true);

    const timerId = setTimeout(() => {
      onExpiry();
    }, remaining);

    return () => clearTimeout(timerId);
  }, [jwt, onExpiry]);

  // Sync with the module-level store on mount (handles the case where setJwt
  // was called before the component mounted).
  useEffect(() => {
    if (_jwt !== jwt) {
      setJwtState(_jwt);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { jwt, isAuthenticated, onExpiry };
}
