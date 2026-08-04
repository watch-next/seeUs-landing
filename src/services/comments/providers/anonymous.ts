// Anonymous provider — re-exports auth.service as the canonical CommentAuthProvider
// for anonymous commenters. Kept as a thin wrapper so future social providers
// can sit sibling to it without the rest of the system re-importing auth.service.

import type { CommentAuthProvider } from './CommentAuthProvider'
import {
  getAnonymousProfile,
  persistDisplayName,
  type AnonymousProfile,
} from '../auth.service'

class AnonymousProvider implements CommentAuthProvider {
  readonly provider = 'anonymous' as const

  getProfile(): AnonymousProfile {
    return getAnonymousProfile()
  }

  setDisplayName(displayName: string): void {
    persistDisplayName(displayName)
  }

  async login(): Promise<AnonymousProfile> {
    return getAnonymousProfile()
  }

  async logout(): Promise<void> {
    // Intentionally a no-op. See AnonymousProviderImpl.logout comment.
  }
}

export { AnonymousProvider }
export default AnonymousProvider
