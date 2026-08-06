import { upsertFacebookCommentUser } from '@/services/comments/comments.service'
import { commentsSupabase } from '../client'
import type { CommentAuthProfile, CommentUser } from '@/types/comments'
import type { CommentAuthProvider } from './CommentAuthProvider'
import { profileFromCommentUser } from '../auth.service'

const STORAGE_PROVIDER = 'seeus:comments_provider'
const STORAGE_COMMENT_USER_ID = 'seeus:comments_comment_user_id'
const STORAGE_RETURN_TO = 'comment_auth_return_url'
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
    /* ignore */
  }
}

function writeSessionStorage(key: string, value: string): void {
  try {
    sessionStorage.setItem(key, value)
  } catch {
    /* ignore */
  }
}

function removeSessionStorage(key: string): void {
  try {
    sessionStorage.removeItem(key)
  } catch {
    /* ignore */
  }
}

function clearStorage(): void {
  try {
    localStorage.removeItem(STORAGE_PROVIDER)
    localStorage.removeItem(STORAGE_COMMENT_USER_ID)
    localStorage.removeItem(STORAGE_RETURN_TO)
  } catch {
    /* ignore */
  }
}

function toProfile(user: CommentUser): CommentAuthProfile {
  return {
    ...profileFromCommentUser(user),
    provider: 'facebook',
    isAuthenticated: true,
  }
}

function defaultProfile(): CommentAuthProfile {
  return {
    provider: 'facebook',
    commentUserId: null,
    providerUserId: null,
    anonymousToken: null,
    displayName: '',
    avatarSeed: '',
    avatarUrl: null,
    email: null,
    isAuthenticated: false,
  }
}

export class FacebookProvider implements CommentAuthProvider {
  readonly provider = 'facebook' as const
  private cachedProfile: CommentAuthProfile | null = null

  private getOAuthRedirectUrl(): string {
    if (import.meta.env.PROD) {
      return 'https://see-us-landing.vercel.app/auth/callback'
    }
    return `${window.location.origin}/auth/callback`
  }

  private getAppBaseUrl(): string {
    return import.meta.env.PROD
      ? 'https://see-us-landing.vercel.app'
      : window.location.origin
  }

  async restoreSession(): Promise<CommentAuthProfile | null> {
    const { data, error } = await commentsSupabase.auth.getSession()
    if (error || !data.session?.user) {
      this.cachedProfile = null
      clearStorage()
      return null
    }

    const { user } = data.session
    const commentUser = await upsertFacebookCommentUser({
      displayName:
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email ||
        'Facebook User',
      avatarUrl:
        user.user_metadata?.avatar_url ||
        user.user_metadata?.picture ||
        null,
      email: user.email || null,
    })

    const profile = toProfile(commentUser)
    this.cachedProfile = profile
    writeStorage(STORAGE_PROVIDER, this.provider)
    writeStorage(STORAGE_COMMENT_USER_ID, commentUser.id)
    return profile
  }

  async isAuthenticated(): Promise<boolean> {
    const profile = this.cachedProfile ?? (await this.restoreSession())
    return !!profile?.isAuthenticated
  }

  async getProfile(): Promise<CommentAuthProfile> {
    return this.cachedProfile ?? (await this.restoreSession()) ?? defaultProfile()
  }

  async login(): Promise<CommentAuthProfile | void> {
    const currentPath = `${window.location.pathname}${window.location.search}`
    const returnTo = currentPath === '/' ? '/blog' : currentPath
    writeSessionStorage(STORAGE_RETURN_TO, returnTo)

    const { data, error } = await commentsSupabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: {
        redirectTo: this.getOAuthRedirectUrl(),
      },
    })

    if (error) {
      throw error
    }

    if (data.url) {
      window.location.assign(data.url)
    }
  }

  async logout(): Promise<void> {
    await commentsSupabase.auth.signOut()
    this.cachedProfile = null
    clearStorage()
    removeSessionStorage(STORAGE_RETURN_TO)
  }

  setDisplayName(): void {
    // Facebook display names are sourced from the OAuth profile.
  }

  getAppUrl(pathname: string): string {
    return `${this.getAppBaseUrl()}${pathname}`
  }
}