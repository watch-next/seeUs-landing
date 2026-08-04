import type { CommentUser } from '@/types/comments'
import type { CommentAuthProvider } from './CommentAuthProvider'

/**
 * Placeholder for a future OAuth-backed comment authorship provider.
 *
 * v1 does NOT integrate OAuth. These stubs exist so callers can compile
 * and the architecture can be filled in later without touching consumers.
 * Throwing here makes accidental usage loud rather than silently failing.
 */
export class NotImplementedProvider implements CommentAuthProvider {
  constructor(readonly provider: 'facebook' | 'google' | 'github') {}

  async getCurrentUser(): Promise<CommentUser> {
    throw new Error(`comment provider "${this.provider}" is not implemented yet`)
  }

  owns(_author: CommentUser): boolean {
    return false
  }

  async logout(): Promise<void> {
    /* no-op */
  }
}

export const facebookProvider = new NotImplementedProvider('facebook')
export const googleProvider = new NotImplementedProvider('google')
export const githubProvider = new NotImplementedProvider('github')
