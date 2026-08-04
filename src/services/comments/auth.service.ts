// Anonymous comment auth service
// Owns the client-side anonymous identity (UUID). Completely isolated from
// the admin Supabase Auth in src/lib/supabase.ts.
//
// Storage keys:
//   seeus:anonymous_id          — UUID identifying this browser's commenter
//   seeus:anonymous_display_name — persisted display name (optional)
//   seeus:anonymous_avatar_seed  — persisted avatar seed

import type { CommentAuthProfile, CommentUser } from '@/types/comments'

const STORAGE_KEY_TOKEN = 'seeus:anonymous_id'
const STORAGE_KEY_NAME = 'seeus:anonymous_display_name'
const STORAGE_KEY_SEED = 'seeus:anonymous_avatar_seed'
const AVATAR_STYLE = 'bottts-neutral'

export type AnonymousProfile = CommentAuthProfile

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* ignore quota / privacy mode failures */
  }
}

function generateUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  // Fallback: RFC4122 v4-ish
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

function generateSeed(): string {
  return Math.random().toString(36).slice(2, 10)
}

export function dicebearUrl(seed: string): string {
  return `https://api.dicebear.com/7.x/${AVATAR_STYLE}/svg?seed=${encodeURIComponent(seed)}`
}

/**
 * Returns the AnonymousProfile for this browser, generating a fresh identity
 * on first visit. The anonymousToken MUST be sent on every mutation so the
 * backend can verify ownership — it is the only proof of identity.
 */
export function getAnonymousProfile(): AnonymousProfile {
  let token = readStorage(STORAGE_KEY_TOKEN)
  if (!token) {
    token = generateUuid()
    writeStorage(STORAGE_KEY_TOKEN, token)
  }

  let displayName = readStorage(STORAGE_KEY_NAME) ?? ''
  let avatarSeed = readStorage(STORAGE_KEY_SEED)
  if (!avatarSeed) {
    avatarSeed = generateSeed()
    writeStorage(STORAGE_KEY_SEED, avatarSeed)
  }

  return {
    provider: 'anonymous',
    commentUserId: null,
    providerUserId: null,
    anonymousToken: token,
    displayName,
    avatarSeed,
    avatarUrl: dicebearUrl(avatarSeed),
    email: null,
    isAuthenticated: false,
  }
}

/**
 * Persist display name chosen by the user. The token and avatar seed are
 * stable across sessions; only the display name is mutable.
 */
export function persistDisplayName(displayName: string): void {
  writeStorage(STORAGE_KEY_NAME, displayName)
}

export function persistAvatarSeed(seed: string): void {
  writeStorage(STORAGE_KEY_SEED, seed)
}

/**
 * Map a CommentUser (returned by other services) onto the AnonymousProfile
 * shape for convenience. Used by useComments to surface the current profile.
 */
export function profileFromCommentUser(user: CommentUser): AnonymousProfile {
  return {
    provider: user.provider,
    commentUserId: user.id,
    providerUserId: user.providerUserId,
    anonymousToken: user.anonymousToken,
    displayName: user.displayName,
    avatarSeed: user.avatarSeed,
    avatarUrl: user.avatarUrl ?? dicebearUrl(user.avatarSeed),
    email: user.email,
    isAuthenticated: user.provider !== 'anonymous',
  }
}
