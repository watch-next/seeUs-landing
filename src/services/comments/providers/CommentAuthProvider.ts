import type { CommentAuthProfile, CommentProvider } from '@/types/comments'

export interface CommentAuthProvider {
  readonly provider: CommentProvider
  restoreSession(): Promise<CommentAuthProfile | null>
  isAuthenticated(): Promise<boolean>
  getProfile(): Promise<CommentAuthProfile>
  login(): Promise<CommentAuthProfile | void>
  logout(): Promise<void>
  setDisplayName?(displayName: string): void | Promise<void>
}

export function notImplementedProvider(provider: CommentProvider): CommentAuthProvider {
  return {
    provider,
    async restoreSession() {
      throw new Error(`comment provider "${provider}" is not implemented yet`)
    },
    async isAuthenticated() {
      throw new Error(`comment provider "${provider}" is not implemented yet`)
    },
    async getProfile() {
      throw new Error(`comment provider "${provider}" is not implemented yet`)
    },
    async login() {
      throw new Error(`comment provider "${provider}" is not implemented yet`)
    },
    async logout() {
      throw new Error(`comment provider "${provider}" is not implemented yet`)
    },
  }
}
