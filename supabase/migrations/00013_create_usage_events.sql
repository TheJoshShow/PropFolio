-- PropFolio: Event log for analytics and pricing/usage limits (e.g. properties per month).
-- Indexed for aggregations by user and by event_type + time.

CREATE TABLE public.usage_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    resource_type TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.usage_events IS 'Event stream for analytics and enforcing usage limits.';

CREATE INDEX idx_usage_events_user_id_created_at ON public.usage_events(user_id, created_at DESC);
CREATE INDEX idx_usage_events_event_type_created_at ON public.usage_events(event_type, created_at DESC);
