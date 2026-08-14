/** Presentation metadata for premium plans derived from API DTOs.
 *
 * This file contains typed mappings from PremiumPlanDTO IDs to their
 * presentation-specific metadata (translation keys, feature lists, etc.).
 * It is used by PremiumPage.vue to properly type-access presentation
 * information without casting to `any` or modifying the DTO contract.
 */

export interface PlanPresentationMetadata {
  /** i18n key for plan name */
  nameKey: string;
  /** i18n key for plan description */
  descriptionKey: string;
  /** i18n key for price Display */
  priceKey: string;
  /** i18n key for billing period */
  periodKey: string;
  /** i18n key for badge (if applicable) */
  badgeKey?: string;
  /** i18n key for footer note (if applicable) */
  footerKey?: string;
  /** Array of feature i18n keys */
  featureKeys: string[];
  /** URL-safe identifier for plan type */
  id: string;
}

/**
 * Presentation metadata mapping for all supported premium plans.
 * Used to safely access presentation-specific translation keys
 * without modifying the PremiumPlanDTO interface.
 */
export const planPresentationMetadata: Record<string, PlanPresentationMetadata> = {
  'premium': {
    nameKey: 'premium.plans.monthly.name',
    descriptionKey: 'premium.plans.monthly.description',
    priceKey: 'premium.plans.monthly.price',
    periodKey: 'premium.plans.monthly.period',
    featureKeys: [
      'premium.plans.monthly.featuresList',
    ],
    badgeKey: 'premium.plans.monthly.badge',
    footerKey: 'premium.plans.monthly.footer',
    id: 'premium',
  },
  'premium-annual': {
    nameKey: 'premium.plans.annual.name',
    descriptionKey: 'premium.plans.annual.description',
    priceKey: 'premium.plans.annual.price',
    periodKey: 'premium.plans.annual.period',
    featureKeys: [
      'premium.plans.annual.featuresList',
    ],
    badgeKey: 'premium.plans.annual.badge',
    footerKey: 'premium.plans.annual.footer',
    id: 'premium-annual',
  },
  'free': {
    nameKey: 'premium.plans.free.name',
    descriptionKey: 'premium.plans.free.description',
    priceKey: '',
    periodKey: '',
    featureKeys: [],
    footerKey: '',
    id: 'free',
  },
};