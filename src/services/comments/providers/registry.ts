// Comment auth provider registry
//
// Single source of truth for the providers surfaced in the comment auth
// selector. Each entry binds a `CommentProvider` key to:
//   - `provider`: a `CommentAuthProvider` instance (real or stub)
//   - `ready`: whether the provider is wired up today
//
// To enable a future Google or Facebook OAuth implementation, swap the
// stub instance with a real provider class that implements the
// CommentAuthProvider contract and flip `ready` to true. No change to
// CommentSection.vue or CommentAuthSelector.vue is required — both read
// from this registry.
//
// IMPORTANT: This registry is decoupled from the admin Supabase Auth in
// src/lib/supabase.ts. Social providers here use their own OAuth flow,
// not the existing admin auth, and must not be added to the admin Supabase
// project.

import type { CommentProvider } from '@/types/comments'
import type { CommentAuthProvider } from './CommentAuthProvider'
import { AnonymousProvider } from './anonymous'
import {
  FacebookProvider,
  GitHubProvider,
  GoogleProvider,
} from './CommentAuthProvider'

export interface ProviderRegistration {
  readonly provider: CommentAuthProvider
  readonly ready: boolean
}

export const providerRegistry: Record<CommentProvider, ProviderRegistration> = {
  anonymous: { provider: new AnonymousProvider(), ready: true },
  google: { provider: new GoogleProvider(), ready: false },
  facebook: { provider: new FacebookProvider(), ready: false },
  github: { provider: new GitHubProvider(), ready: false },
}
