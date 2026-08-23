import { supabaseApp } from '@/lib/supabase-app'
import { httpClient } from '@/lib/http/client'
import { handleApiError } from '@/lib/http/error-handler'
import {
  type CreateCheckoutRequest,
  type CheckoutResponse,
  type CancelSubscriptionResponse,
  type PremiumPlanDTO,
  type PremiumSubscriptionDTO,
} from '@/types/premium'
import { premiumService } from '@/services/premium.service'

/**
 * Composable for premium service operations
 * Separates Supabase App auth-dependent operations from backend-dependent operations
 */
export function usePremiumService() {
  /**
   * Get available subscription plans
   * Delegates to premiumService which handles backend fallback to static data
   */
  async function listPlans(): Promise<PremiumPlanDTO[]> {
    return premiumService.listPlans()
  }

  /**
   * Get current user's subscription from Supabase App
   * Only works when user is authenticated via Supabase App
   */
  async function getSubscription(): Promise<PremiumSubscriptionDTO | null> {
    try {
      // Check if user is authenticated using getSession to match auth composable pattern
      const { data: { session } } = await supabaseApp.auth.getSession()

      if (!session?.user) {
        // User not authenticated
        return null
      }

      // Fetch subscription from Supabase App
      const { data, error } = await supabaseApp
        .from('premium_subscriptions')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle()

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows found - user has no subscription
          return null
        }
        throw error
      }

      return data
    } catch (error) {
      console.error('Error in getSubscription:', error)
      throw error
    }
  }

  /**
   * Create a Mercado Pago checkout for a paid plan
   * Requires authentication via Supabase App
   */
  async function createCheckout(req: CreateCheckoutRequest): Promise<CheckoutResponse> {
    try {
      // Verify user is authenticated using getSession to match auth composable pattern
      const { data: { session } } = await supabaseApp.auth.getSession()

      if (!session?.user) {
        throw new Error('User must be authenticated to create checkout')
      }

      // Delegate to premiumService which handles the backend call
      // Add user_id to the request since the backend expects it
      const requestWithUserId = {
        ...req,
        user_id: session.user.id
      }

      // Send the Supabase App access_token as the Authorization header so the
      // backend can authenticate the user from the App JWT's sub claim.
      return premiumService.createCheckout(requestWithUserId, session.access_token)
    } catch (error) {
      console.error('Error in createCheckout:', error)
      throw error
    }
  }

  /**
   * Cancel the current user's subscription
   * Requires authentication via Supabase App
   */
  async function cancelSubscription(): Promise<CancelSubscriptionResponse> {
    try {
      // Verify user is authenticated using getSession to match auth composable pattern
      const { data: { session } } = await supabaseApp.auth.getSession()

      if (!session?.user) {
        throw new Error('User must be authenticated to cancel subscription')
      }

      // Delegate to premiumService which handles the backend call
      // Pass the access token for authentication
      return premiumService.cancelSubscription(session.access_token)
    } catch (error) {
      console.error('Error in cancelSubscription:', error)
      throw error
    }
  }

  /**
   * Check if user has an active subscription
   */
  async function getSubscriptionStatus(
    preapprovalId: string,
  ): Promise<PremiumSubscriptionDTO | null> {
    try {
      const { data: { session } } = await supabaseApp.auth.getSession()

      if (!session?.access_token) {
        return null
      }

      return premiumService.getSubscriptionStatus(preapprovalId, session.access_token)
    } catch (error) {
      throw error
    }
  }

  async function hasActiveSubscription(): Promise<boolean> {
    try {
      const subscription = await getSubscription()
      return !!subscription && subscription.status === 'active'
    } catch (error) {
      console.error('Error in hasActiveSubscription:', error)
      return false
    }
  }

  // Return the composable functions
  return {
    listPlans,
    getSubscription,
    getSubscriptionStatus,
    createCheckout,
    cancelSubscription,
    hasActiveSubscription,
  }
}