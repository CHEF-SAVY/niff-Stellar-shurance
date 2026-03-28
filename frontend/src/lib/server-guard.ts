/**
 * server-guard.ts
 * Import this file at the top of any module that must never run in the browser.
 * The `server-only` package throws a build-time error if bundled client-side.
 *
 * Usage:
 *   import '@/lib/server-guard'
 */
import 'server-only'
