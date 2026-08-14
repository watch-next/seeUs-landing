/**
 * Premium / Subscription service.
 *
 * Handles all premium-related API calls to the backend.
 * Implements the PremiumService contract from src/types/premium.ts.
 */

import { httpClient } from '@/lib/http/client';
import { handleApiError } from '@/lib/http/error-handler';
import {
  PremiumNotImplementedError,
  type CancelSubscriptionResponse,
  type CheckoutResponse,
  type CreateCheckoutRequest,
  type PremiumPlanDTO,
  type PremiumService,
  type PremiumSubscriptionDTO,
} from '@/types/premium';

/**
 * Static plan catalog. Mirrors pricing approved on 2026-08-10:
 *   monthly  R$ 9,90/mês
 *   annual   R$ 99,90/ano (economize R$ 18,90 = R$ 8,33/mês)
 *
 * Free plan is included so listPlans() returns the full matrix; UI filters
 * it out of checkout flows via CreateCheckoutRequest.planId typing.
 */
const PLAN_CATALOG: PremiumPlanDTO[] = [
  {
    id: 'free',
    billingCycle: 'monthly',
    priceCents: 0,
    currency: 'BRL',
    durationDays: null,
  },
  {
    id: 'premium',
    billingCycle: 'monthly',
    priceCents: 990,
    currency: 'BRL',
    durationDays: 30,
  },
  {
    id: 'premium-annual',
    billingCycle: 'annual',
    priceCents: 9990,
    currency: 'BRL',
    durationDays: 365,
  },
];

export const premiumService: PremiumService = {
  async listPlans(): Promise<PremiumPlanDTO[]> {
    try {
      // Try to fetch from backend first
      const response = await httpClient.get<PremiumPlanDTO[]>('/premium/plans');
      return response.data;
    } catch (error) {
      // Fallback to static data if backend endpoint doesn't exist yet
      // This maintains UI functionality during development
      return structuredClone(PLAN_CATALOG);
    }
  },

  async getSubscription(): Promise<PremiumSubscriptionDTO | null> {
    try {
      const response = await httpClient.get<PremiumSubscriptionDTO>('/premium/subscription');
      return response.data;
    } catch (error) {
      // Return null if backend endpoint doesn't exist or request fails
      // This treats user as never subscribed, showing CTAs instead of stale state
      return null;
    }
  },

  async createCheckout(
    req: CreateCheckoutRequest,
  ): Promise<CheckoutResponse> {
    try {
      const response = await httpClient.post<CheckoutResponse>('/premium/checkout', req);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  async cancelSubscription(): Promise<CancelSubscriptionResponse> {
    try {
      const response = await httpClient.post<CancelSubscriptionResponse>('/premium/subscription/cancel');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
};

export default premiumService;