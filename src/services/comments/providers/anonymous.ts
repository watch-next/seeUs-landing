import type { CommentAuthProvider } from './CommentAuthProvider'
import { getAnonymousProfile, persistDisplayName } from '../auth.service'
import type { AnonymousProfile } from '../auth.service'

export class AnonymousProvider implements CommentAuthProvider {
  readonly provider = 'anonymous' as const

  async restoreSession(): Promise<AnonymousProfile | null> {
    return this.getProfile()
  }

  async isAuthenticated(): Promise<boolean> {
    return true
  }

  async getProfile(): Promise<AnonymousProfile> {
    return getAnonymousProfile()
  }

  async login(): Promise<AnonymousProfile> {
    return getAnonymousProfile()
  }

  async logout(): Promise<void> {
    // Anonymous mode has no remote session to clear.
  }

  setDisplayName(displayName: string): void {
    persistDisplayName(displayName)
  }
}

export default AnonymousProvider
