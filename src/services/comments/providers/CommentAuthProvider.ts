// CommentAuthProvider abstraction
//
// All comment auth, anonymous and social alike, runs through this interface.
// The anonymous provider is the only one implemented in v1. Facebook, Google,
// and GitHub are scaffolded as stubs so the rest of the system can be written
// against this contract today.
//
// IMPORTANT: This abstraction is intentionally decoupled from the existing
// Supabase Auth in src/lib/supabase.ts (which is admin-only and must not be
// touched or reused for blog readers).

import type { CommentProvider } from '@/types/comments'
import type { AnonymousProfile } from '../auth.service'

export interface CommentAuthProvider {
  readonly provider: CommentProvider
  /** Returns the current user profile, generating one if needed (anonymous). */
  getProfile(): AnonymousProfile | Promise<AnonymousProfile>
  /** Persist a chosen display name (anonymous uid stays fixed). */
  setDisplayName(displayName: string): void | Promise<void>
  /** Future OAuth flow. Resolves to a new profile on success. */
  login(): Promise<AnonymousProfile>
  /** Clears the provider session. Anonymous clears localStorage identity. */
  logout(): Promise<void>
}

/**
 * Stubs for social providers. Implementations will live here later; for now
 * they throw so callers know OAuth is not wired up.
 */
export class FacebookProvider implements CommentAuthProvider {
  readonly provider: CommentProvider = 'facebook'
  getProfile(): AnonymousProfile { throwNotImplemented('facebook') }
  setDisplayName(): void { throwNotImplemented('facebook') }
  async login(): Promise<AnonymousProfile> { throwNotImplemented('facebook') }
  async logout(): Promise<void> { throwNotImplemented('facebook') }
}

export class GoogleProvider implements CommentAuthProvider {
  readonly provider: CommentProvider = 'google'
  getProfile(): AnonymousProfile { throwNotImplemented('google') }
  setDisplayName(): void { throwNotImplemented('google') }
  async login(): Promise<AnonymousProfile> { throwNotImplemented('google') }
  async logout(): Promise<void> { throwNotImplemented('google') }
}

export class GitHubProvider implements CommentAuthProvider {
  readonly provider: CommentProvider = 'github'
  getProfile(): AnonymousProfile { throwNotImplemented('github') }
  setDisplayName(): void { throwNotImplemented('github') }
  async login(): Promise<AnonymousProfile> { throwNotImplemented('github') }
  async logout(): Promise<void> { throwNotImplemented('github') }
}

function throwNotImplemented(name: string): never {
  throw new Error(`comment provider "${name}" is not implemented yet`)
}
