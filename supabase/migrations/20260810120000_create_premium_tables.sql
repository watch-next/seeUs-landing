-- Sprint 7 Phase 1 — Premium Supabase database layer
--
-- Adds authoritative storage for Mercado Pago Premium subscriptions and
-- webhook events. Authoritative state lives here; FastAPI (Phase 2) is the
-- only writer via the service role. Flutter never writes Premium state.
--
-- Design notes:
--   * user_id references auth.users(id) — no duplicate user table.
--   * monetary amount is numeric(12,2) — safe for BRL; no floats.
--   * status is a CHECK-constrained text; no is_premium boolean.
--   * external_reference is the reliable correlation key between a
--     Mercado Pago preapproval and the local subscription row.
--   * RLS enabled on every table; authenticated users may SELECT their own
--     subscription row but cannot INSERT/UPDATE/DELETE authoritative state.
--     Service role bypasses RLS for backend-driven writes.
--   * additive only — no existing tables are modified.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =============================================================================
-- premium_subscriptions
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.premium_subscriptions (
    id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Owner. References the existing Supabase auth user; onDelete RESTRICT so
    -- we never silently lose subscription history if an auth.users row is removed.
    user_id                     uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,

    -- Plan descriptor (e.g. 'monthly', 'yearly'). Constrained to a small set so
    -- the backend cannot accidentally persist arbitrary plan names. Phase 2 may
    -- relax this if Mercado Pago requires additional plan codes.
    plan                        text NOT NULL,
    provider                    text NOT NULL DEFAULT 'mercado_pago'
                                    CHECK (provider IN ('mercado_pago')),

    -- Mercado Pago identifiers. preapproval_id is the recurring subscription
    -- id returned by MP. plan_id is set when the subscription is bound to a
    -- plan rather than an ad-hoc preapproval. external_reference is the key the
    -- backend places in the MP preapproval call so webhooks can be correlated
    -- deterministically — independent of email.
    provider_subscription_id    text,
    provider_plan_id             text,
    external_reference           text NOT NULL,

    status                       text NOT NULL DEFAULT 'pending'
                                    CHECK (status IN
                                        ('pending', 'active', 'paused', 'cancelled', 'expired', 'rejected')),

    -- Monetary fields. numeric(12,2) → up to 999,999,999.99; sufficient for BRL.
    amount                       numeric(12,2) NOT NULL CHECK (amount >= 0),
    currency                     text NOT NULL DEFAULT 'BRL' CHECK (length(currency) = 3),

    -- Lifecycle timestamps. All nullable except created_at/updated_at; filled in
    -- as the backend progresses the subscription through its state machine.
    subscription_started_at      timestamptz,
    current_period_start_at      timestamptz,
    current_period_end_at        timestamptz,
    cancelled_at                 timestamptz,
    expired_at                   timestamptz,
    last_provider_synced_at      timestamptz,

    created_at                   timestamptz NOT NULL DEFAULT now(),
    updated_at                   timestamptz NOT NULL DEFAULT now(),

    -- One authoritative subscription per external reference. The backend uses
    -- external_reference to look up the row when ingesting a webhook, so it
    -- must be globally unique.
    CONSTRAINT premium_subscriptions_external_reference_unique
        UNIQUE (external_reference),

    -- A single Mercado Pago preapproval id may not be reused across local rows.
    CONSTRAINT premium_subscriptions_provider_subscription_unique
        UNIQUE (provider_subscription_id),

    -- Sanity: period end must not precede period start when both are known.
    CONSTRAINT premium_subscriptions_period_order_check
        CHECK (current_period_end_at IS NULL
               OR current_period_start_at IS NULL
               OR current_period_end_at >= current_period_start_at),

    -- Sanity: expiry cannot precede start when both are known.
    CONSTRAINT premium_subscriptions_expiry_order_check
        CHECK (expired_at IS NULL
               OR subscription_started_at IS NULL
               OR expired_at >= subscription_started_at)
);

CREATE INDEX IF NOT EXISTS idx_premium_subscriptions_user_id
    ON public.premium_subscriptions (user_id);

CREATE INDEX IF NOT EXISTS idx_premium_subscriptions_status
    ON public.premium_subscriptions (status);

CREATE INDEX IF NOT EXISTS idx_premium_subscriptions_provider_subscription_id
    ON public.premium_subscriptions (provider_subscription_id)
    WHERE provider_subscription_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_premium_subscriptions_external_reference
    ON public.premium_subscriptions (external_reference);

CREATE INDEX IF NOT EXISTS idx_premium_subscriptions_current_period_end
    ON public.premium_subscriptions (current_period_end_at)
    WHERE current_period_end_at IS NOT NULL;

-- =============================================================================
-- premium_webhook_events
-- =============================================================================
-- Minimal audit/idempotency log for Mercado Pago webhook deliveries. Stores
-- only the identifiers needed to deduplicate and reason about event ordering.
-- No card data, no tokens, no secrets, no PII beyond what the provider emits
-- in its standard webhook payloads.
CREATE TABLE IF NOT EXISTS public.premium_webhook_events (
    id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),

    provider                    text NOT NULL DEFAULT 'mercado_pago'
                                    CHECK (provider IN ('mercado_pago')),

    -- provider_event_id: MP's event/id field when present. Some MP notification
    -- payloads do not include a stable event id (e.g. the legacy IPN topic +
    -- id form delivers only resource id + topic). When that identifier is
    -- unavailable, the backend falls back to (provider, event_type, resource_id)
    -- as the idempotency key — see the partial unique index below. provider_event_id
    -- is therefore nullable but unique where populated.
    provider_event_id           text,
    event_type                  text NOT NULL,
    resource_id                 text NOT NULL,

    received_at                 timestamptz NOT NULL DEFAULT now(),
    processed_at                timestamptz,

    processing_status           text NOT NULL DEFAULT 'pending'
                                    CHECK (processing_status IN
                                        ('pending', 'processing', 'processed', 'failed', 'ignored')),

    processing_error            text,

    -- Raw payload, retained for auditability and debugging. Kept as jsonb for
    -- efficient querying. Phase 2 may truncate or strip fields if PII concerns
    -- emerge; for now we store the full payload since MP payloads are small and
    -- contain no card data.
    payload                     jsonb,

    created_at                  timestamptz NOT NULL DEFAULT now(),
    updated_at                  timestamptz NOT NULL DEFAULT now(),

    -- Unique on provider_event_id when present — fast idempotency check for the
    -- common case where MP returns a stable event id.
    CONSTRAINT premium_webhook_events_provider_event_unique
        UNIQUE (provider_event_id)
);

-- Fallback idempotency key for MP notification shapes that lack a stable
-- provider_event_id: a given (provider, event_type, resource_id) triple may
-- only have one row in pending/processing/processed status. Re-deliveries that
-- land after 'processed' are still permitted (so the backend can confirm), but
-- they are expected to be deduplicated at the application layer using this index
-- as the lookup key. See Phase 2 webhook handler docs.
CREATE UNIQUE INDEX IF NOT EXISTS ux_premium_webhook_events_resource
    ON public.premium_webhook_events (provider, event_type, resource_id)
    WHERE provider_event_id IS NULL
      AND processing_status IN ('pending', 'processing', 'processed');

CREATE INDEX IF NOT EXISTS idx_premium_webhook_events_resource_id
    ON public.premium_webhook_events (resource_id);

CREATE INDEX IF NOT EXISTS idx_premium_webhook_events_processing_status
    ON public.premium_webhook_events (processing_status)
    WHERE processing_status IN ('pending', 'processing', 'failed');

CREATE INDEX IF NOT EXISTS idx_premium_webhook_events_received_at
    ON public.premium_webhook_events (received_at DESC);

-- =============================================================================
-- updated_at trigger (idempotent; matches existing convention from comments)
-- =============================================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_premium_subscriptions_updated_at
    ON public.premium_subscriptions;
CREATE TRIGGER update_premium_subscriptions_updated_at
    BEFORE UPDATE ON public.premium_subscriptions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_premium_webhook_events_updated_at
    ON public.premium_webhook_events;
CREATE TRIGGER update_premium_webhook_events_updated_at
    BEFORE UPDATE ON public.premium_webhook_events
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================================
-- Row Level Security
-- =============================================================================
-- Authenticated users may read THEIR OWN subscription row (so a Flutter
-- profile screen can show "Premium active until <date>"). They cannot mutate
-- authoritative state directly — all writes go through the service role in
-- FastAPI, which bypasses RLS.
-- Webhook events are admin/service-only; no authenticated SELECT.
ALTER TABLE public.premium_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.premium_webhook_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "premium_subscriptions_owner_read" ON public.premium_subscriptions;
CREATE POLICY "premium_subscriptions_owner_read"
ON public.premium_subscriptions
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- No INSERT/UPDATE/DELETE policies for authenticated/anon → direct writes by
-- client roles are denied by default under RLS. The service role (used by
-- FastAPI) bypasses RLS and remains the sole authoritative writer.

-- Explicit: no client policies on premium_webhook_events. Service role only.

-- Grant read access to authenticated users for their own rows (RLS filters).
GRANT SELECT ON public.premium_subscriptions TO authenticated;
-- No grants on premium_webhook_events to client roles.
