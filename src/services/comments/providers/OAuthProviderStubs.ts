import type { CommentAuthProfile } from '@/types/comments'
import { notImplementedProvider, type CommentAuthProvider } from './CommentAuthProvider'

/**
 * Placeholder for a future OAuth-backed comment authorship provider.
 *
 * v1 does NOT integrate OAuth. These stubs exist so callers can compile
 * and the architecture can be filled in later without touching consumers.
 * Throwing here makes accidental usage loud rather than silently failing.
 */
export const facebookProvider: CommentAuthProvider = notImplementedProvider('facebook')
export const googleProvider: CommentAuthProvider = notImplementedProvider('google')
export const githubProvider: CommentAuthProvider = notImplementedProvider('github')

export type NotImplementedProfile = CommentAuthProfile
