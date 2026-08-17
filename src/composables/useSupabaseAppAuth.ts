import { ref, computed, onMounted, onUnmounted } from 'vue';
import { supabaseApp } from '@/lib/supabase-app';
import type { Session, User } from '@supabase/supabase-js';

const user = ref<User | null>(null);
const isLoading = ref(false);
const hasCheckedAuth = ref(false);

/**
 * Authentication composable for the app's Supabase project.
 */
export function useSupabaseAppAuth() {
  // Computed properties
  const currentUser = computed(() => user.value);
  const isAuthenticated = computed(() => user.value !== null);
  const isLoadingAuth = computed(() => isLoading.value);
  const isAuthChecked = computed(() => hasCheckedAuth.value);

  /**
   * Initialize authentication state.
   * Checks if user has valid session and loads user data.
   */
  async function initAuth(): Promise<boolean> {
    if (hasCheckedAuth.value) {
      return !!user.value;
    }

    isLoading.value = true;

    try {
      const { data: { session }, error } = await supabaseApp.auth.getSession();

      if (error) {
        throw error;
      }

      if (session?.user) {
        user.value = session.user;
        hasCheckedAuth.value = true;
        return true;
      }

      // No session - not authenticated
      user.value = null;
      hasCheckedAuth.value = true;
      return false;
    } catch (err) {
      console.error('[SupabaseAppAuth] Error initializing auth:', err);
      user.value = null;
      hasCheckedAuth.value = true;
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Sign in with email and password.
   */
  async function signIn(email: string, password: string): Promise<void> {
    isLoading.value = true;
    try {
      const { error } = await supabaseApp.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      // After sign-in, get the session to update user state
      const { data: { session }, error: sessionError } = await supabaseApp.auth.getSession();
      if (sessionError) {
        throw sessionError;
      }

      user.value = session?.user ?? null;
    } catch (err) {
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Sign up with email and password.
   *
   * Returns the signup result so the caller can decide how to proceed based on the
   * actual Supabase response rather than assumptions:
   * - `{ user, session }` present -> immediately authenticated, checkout can resume.
   * - `{ user, session: null }`   -> email confirmation required; do NOT treat as
   *   authenticated and do NOT call checkout.
   */
  async function signUp(
    email: string,
    password: string
  ): Promise<{ user: User | null; session: UserSession | null }> {
    isLoading.value = true;
    try {
      const redirectTo = `${import.meta.env.VITE_APP_URL || 'https://see-us-landing.vercel.app'}/auth/callback`

      const { data, error } = await supabaseApp.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectTo,
        },
      });

      if (error) {
        throw error;
      }

      const { session, user } = data ?? {};

      // Only mark the user as authenticated when Supabase actually returned a session.
      if (session?.user) {
        user.value = session.user;
        hasCheckedAuth.value = true;
      }

      return { user: session?.user ?? data?.user ?? null, session: session ?? null };
    } catch (err) {
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Sign out.
   */
  async function signOut(): Promise<void> {
    isLoading.value = true;
    try {
      const { error } = await supabaseApp.auth.signOut();
      if (error) {
        throw error;
      }

      user.value = null;
    } catch (err) {
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Get the current user session.
   */
  async function getSession() {
    const { data: { session }, error } = await supabaseApp.auth.getSession();
    if (error) {
      throw error;
    }
    return session;
  }

  /**
   * Listen to auth changes.
   */
  onMounted(() => {
    initAuth();

    const { data: { subscription } } = supabaseApp.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          user.value = session?.user ?? null;
          hasCheckedAuth.value = true;
        } else if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
          user.value = null;
          hasCheckedAuth.value = true;
        }
      }
    );

    // Unsubscribe when the component is unmounted
    onUnmounted(() => {
      subscription.unsubscribe();
    });
  });

  return {
    currentUser,
    isAuthenticated,
    isLoadingAuth,
    isAuthChecked,
    initAuth,
    signIn,
    signUp,
    signOut,
    getSession,
  };
}