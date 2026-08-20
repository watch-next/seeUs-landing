/**
 * Premium / Subscription central types.
 *
 * Frontend-only placeholder contract. Backend endpoints are not yet
 * implemented in watch-next-backend; types here mirror the DB model
 * (app/models/premium_subscription.py) so they will be wire-compatible
 * once /v1/premium/* routes land.
 *
 * Update this file when the backend contract changes.
 */

/** ISO 8601 timestamps returned by the API (UTC). */
export type ISODateString = string;

/** Plan identifiers used across UI, analytics and (future) checkout. */
export type PremiumPlanId = 'free' | 'premium' | 'premium-annual';

/** Billing cycle derived from plan id. */
export type PremiumBillingCycle = 'monthly' | 'annual';

/** Mercado Pago preference status (mirrors backend enum). */
export type MercadoPagoPreferenceStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'refunded'
  | 'expired';

/**
 * Subscription lifecycle.
 *
 * Mirrors `app/models/premium_subscription.py::SubscriptionStatus` on the
 * backend. Keep in sync.
 */
export type PremiumSubscriptionStatus =
  | 'active'
  | 'pending'
  | 'cancelled'
  | 'expired'
  | 'paused';

/** Raw plan descriptor consumed by PremiumPage.vue. */
export interface PremiumPlan {
  id: PremiumPlanId;
  /** Free plan flag — controls button + layout branch in PremiumPage. */
  freePlan: boolean;
  /** i18n key for plan name (rendered via $t). */
  nameKey: string;
  /** i18n key for price amount (e.g. "R$ 9,90"). Omitted on free plan. */
  priceKey?: string;
  /** i18n key for billing period (e.g. "/mês"). Omitted on free plan. */
  periodKey?: string;
  /** i18n key for short description. */
  description?: string;
  /** i18n badge key for highlighted plan (e.g. "Mais popular"). */
  badge?: string;
  /** i18n footer note (e.g. annual savings). */
  footer?: string;
  /** i18n feature keys list. */
  features: string[];
}

/** Body returned by (future) GET /v1/premium/plans. */
export interface PremiumPlanDTO {
  id: PremiumPlanId;
  billingCycle: PremiumBillingCycle;
  /** Price in BRL cents (avoid float). R$ 9,90 → 990. */
  priceCents: number;
  /** ISO currency code. */
  currency: 'BRL';
  /** Days the subscription stays active after payment approval. */
  durationDays: number | null;
  /** Mercado Pago plan id, when the plan is linked to a preapproval. */
  mercadoPagoPlanId?: string;
}

/**
 * Current subscription state for the logged-in user.
 *
 * Returned by (future) GET /v1/premium/subscription. `null` when the user
 * has never subscribed; status 'cancelled'/'expired' otherwise.
 */
export interface PremiumSubscriptionDTO {
  id: string;
  userId: string;
  planId: PremiumPlanId;
  status: PremiumSubscriptionStatus;
  /** ISO date when the current cycle ends. null for free plan. */
  currentPeriodEnd: ISODateString | null;
  /** True when status is 'active' and currentPeriodEnd is in the future. */
  isActive: boolean;
  /** Mercado Pago preapproval id, when subscription was created via MP. */
  mercadoPagoPreapprovalId?: string;
  /** Reason for cancellation, when applicable. */
  cancelReason?: string;
  cancelledAt?: ISODateString | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

/** Body for (future) POST /v1/premium/checkout. */
export interface CreateCheckoutRequest {
  plan_id: Exclude<PremiumPlanId, 'free'>;
  user_email: string;
  /** Where Mercado Pago should redirect after approval. */
  successUrl?: string;
  /** Where Mercado Pago should redirect on failure/cancel. */
  failureUrl?: string;
  /** Where Mercado Pago should send the user back pending payment. */
  pendingUrl?: string;
}

/** Response from (future) POST /v1/premium/checkout. */
export interface CheckoutResponse {
  /** Mercado Pago Preapproval init point to redirect the user to. */
  initPoint: string;
  /** Mercado Pago Preapproval init point for sandbox/test environment. */
  sandboxInitPoint?: string | null;
  /** Mercado Pago preapproval id. */
  preapprovalId: string;
}

/** Response from (future) POST /v1/premium/subscription/cancel. */
export interface CancelSubscriptionResponse {
  success: boolean;
  status: PremiumSubscriptionStatus;
  cancelledAt: ISODateString;
}

/**
 * Manager for the placeholder service contract.
 *
 * `src/services/premium.service.ts` (#5) will export an object satisfying
 * this interface. Until the backend lands, methods reject with a typed
 * 'PREMIUM_NOT_IMPLEMENTED' error so the UI can fall back to disabled
 * buttons (current PremiumPage.vue behavior).
 */
export interface PremiumService {
  /** List available plans. Always available (static data until backend). */
  listPlans(): Promise<PremiumPlanDTO[]>;
  /** Get the current user's subscription; null if never subscribed. */
  getSubscription(): Promise<PremiumSubscriptionDTO | null>;
  /** Create a Mercado Pago checkout for a paid plan. */
  createCheckout(req: CreateCheckoutRequest, accessToken: string): Promise<CheckoutResponse>;
  /** Cancel the active subscription. */
  cancelSubscription(): Promise<CancelSubscriptionResponse>;
  /**
   * Query the backend for the subscription status tied to a Mercado Pago
   * preapproval. Used by the /premium/success return page.
   */
  getSubscriptionStatus(
    preapprovalId: string,
    accessToken: string,
  ): Promise<PremiumSubscriptionDTO | null>;
}

/** Typed error emitted by the placeholder service when backend is absent. */
export class PremiumNotImplementedError extends Error {
  readonly code = 'PREMIUM_NOT_IMPLEMENTED' as const;

  constructor(message = 'Premium backend endpoints are not implemented yet.') {
    super(message);
    this.name = 'PremiumNotImplementedError';
  }
}
