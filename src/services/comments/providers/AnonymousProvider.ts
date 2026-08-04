import type { CommentUser } from '@/types/comments'
import type { CommentAuthProvider } from './CommentAuthProvider'

const STORAGE_TOKEN = 'seeus:anonymous_id'
const STORAGE_NAME = 'seeus:anonymous_name'
const STORAGE_SEED = 'seeus:anonymous_avatar_seed'

/**
 * Anonymous comment authorship.
 *
 * Identity is a UUID generated client-side and persisted in localStorage.
 * Ownership is established by matching this token against
 * `comment_users.anonymous_token` via the SECURITY DEFINER RPCs in the
 * Supabase migration. No network login, no admin auth coupling.
 */
export class AnonymousProvider implements CommentAuthProvider {
  readonly provider = 'anonymous' as const

  async getCurrentUser(): Promise<CommentUser> {
    let token = this.readToken()
    if (!token) {
      token = crypto.randomUUID()
      localStorage.setItem(STORAGE_TOKEN, token)
    }
    const displayName = localStorage.getItem(STORAGE_NAME) || this.defaultName()
    if (!localStorage.getItem(STORAGE_NAME)) {
      localStorage.setItem(STORAGE_NAME, displayName)
    }
    let seed = localStorage.getItem(STORAGE_SEED)
    if (!seed) {
      seed = token
      localStorage.setItem(STORAGE_SEED, seed)
    }

    return {
      id: '',
      provider: 'anonymous',
      providerUserId: null,
      anonymousToken: token,
      displayName,
      avatarSeed: seed,
      avatarUrl: null,
      email: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  }

  owns(author: CommentUser): boolean {
    const token = this.readToken()
    return (
      author.provider === 'anonymous' &&
      author.anonymousToken !== null &&
      author.anonymousToken === token
    )
  }

  async logout(): Promise<void> {
    localStorage.removeItem(STORAGE_TOKEN)
    localStorage.removeItem(STORAGE_NAME)
    localStorage.removeItem(STORAGE_SEED)
  }

  /** Persists a chosen display name on top of the existing token. */
  setDisplayName(name: string): void {
    localStorage.setItem(STORAGE_NAME, name.trim().slice(0, 64) || this.defaultName())
  }

  /** Persists an explicit avatar seed (otherwise defaults to the token). */
  setAvatarSeed(seed: string): void {
    localStorage.setItem(STORAGE_SEED, seed.trim() || this.readToken() || crypto.randomUUID())
  }

  readToken(): string | null {
    return localStorage.getItem(STORAGE_TOKEN)
  }

  private defaultName(): string {
    return 'Anonymous'
  }
}

/** Singleton instance used by auth.service. */
export const anonymousProvider = new AnonymousProvider()
