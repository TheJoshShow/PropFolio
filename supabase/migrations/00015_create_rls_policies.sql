-- PropFolio: Row Level Security. All user data scoped to auth.uid().
-- Helper: property (or its parent chain) belongs to current user via portfolio.user_id.

-- ----- profiles (1:1 with auth user) -----
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "profiles_update_own"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_insert_own"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- ----- subscriptions -----
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscriptions_select_own"
    ON public.subscriptions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "subscriptions_insert_own"
    ON public.subscriptions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "subscriptions_update_own"
    ON public.subscriptions FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ----- portfolios -----
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "portfolios_all_own"
    ON public.portfolios FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ----- properties (access via portfolio ownership) -----
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "properties_select_own"
    ON public.properties FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.portfolios p
            WHERE p.id = properties.portfolio_id AND p.user_id = auth.uid()
        )
    );

CREATE POLICY "properties_insert_own"
    ON public.properties FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.portfolios p
            WHERE p.id = portfolio_id AND p.user_id = auth.uid()
        )
    );

CREATE POLICY "properties_update_own"
    ON public.properties FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.portfolios p
            WHERE p.id = properties.portfolio_id AND p.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.portfolios p
            WHERE p.id = portfolio_id AND p.user_id = auth.uid()
        )
    );

CREATE POLICY "properties_delete_own"
    ON public.properties FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.portfolios p
            WHERE p.id = properties.portfolio_id AND p.user_id = auth.uid()
        )
    );

-- ----- property_units (via property -> portfolio) -----
ALTER TABLE public.property_units ENABLE ROW LEVEL SECURITY;

CREATE POLICY "property_units_all_own"
    ON public.property_units FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.properties prop
            JOIN public.portfolios p ON p.id = prop.portfolio_id
            WHERE prop.id = property_units.property_id AND p.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.properties prop
            JOIN public.portfolios p ON p.id = prop.portfolio_id
            WHERE prop.id = property_id AND p.user_id = auth.uid()
        )
    );

-- ----- property_photos -----
ALTER TABLE public.property_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "property_photos_all_own"
    ON public.property_photos FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.properties prop
            JOIN public.portfolios p ON p.id = prop.portfolio_id
            WHERE prop.id = property_photos.property_id AND p.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.properties prop
            JOIN public.portfolios p ON p.id = prop.portfolio_id
            WHERE prop.id = property_id AND p.user_id = auth.uid()
        )
    );

-- ----- analyses (via property -> portfolio) -----
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "analyses_all_own"
    ON public.analyses FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.properties prop
            JOIN public.portfolios p ON p.id = prop.portfolio_id
            WHERE prop.id = analyses.property_id AND p.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.properties prop
            JOIN public.portfolios p ON p.id = prop.portfolio_id
            WHERE prop.id = property_id AND p.user_id = auth.uid()
        )
    );

-- ----- analysis_scenarios (via analysis -> property -> portfolio) -----
ALTER TABLE public.analysis_scenarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "analysis_scenarios_all_own"
    ON public.analysis_scenarios FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.analyses a
            JOIN public.properties prop ON prop.id = a.property_id
            JOIN public.portfolios p ON p.id = prop.portfolio_id
            WHERE a.id = analysis_scenarios.analysis_id AND p.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.analyses a
            JOIN public.properties prop ON prop.id = a.property_id
            JOIN public.portfolios p ON p.id = prop.portfolio_id
            WHERE a.id = analysis_id AND p.user_id = auth.uid()
        )
    );

-- ----- renovation_line_items (via analysis -> property -> portfolio) -----
ALTER TABLE public.renovation_line_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "renovation_line_items_all_own"
    ON public.renovation_line_items FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.analyses a
            JOIN public.properties prop ON prop.id = a.property_id
            JOIN public.portfolios p ON p.id = prop.portfolio_id
            WHERE a.id = renovation_line_items.analysis_id AND p.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.analyses a
            JOIN public.properties prop ON prop.id = a.property_id
            JOIN public.portfolios p ON p.id = prop.portfolio_id
            WHERE a.id = analysis_id AND p.user_id = auth.uid()
        )
    );

-- ----- imported_source_records (via property -> portfolio) -----
ALTER TABLE public.imported_source_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "imported_source_records_all_own"
    ON public.imported_source_records FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.properties prop
            JOIN public.portfolios p ON p.id = prop.portfolio_id
            WHERE prop.id = imported_source_records.property_id AND p.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.properties prop
            JOIN public.portfolios p ON p.id = prop.portfolio_id
            WHERE prop.id = property_id AND p.user_id = auth.uid()
        )
    );

-- ----- market_snapshots (reference data: read for authenticated) -----
ALTER TABLE public.market_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "market_snapshots_select_authenticated"
    ON public.market_snapshots FOR SELECT
    TO authenticated
    USING (true);

-- No INSERT/UPDATE/DELETE for authenticated; use service role or separate migration for backfill.

-- ----- api_cache_entries (service role only; no anon/authenticated policies) -----
ALTER TABLE public.api_cache_entries ENABLE ROW LEVEL SECURITY;

-- No policies for anon or authenticated => only service_role can read/write. Optional:
-- CREATE POLICY "api_cache_entries_service_only" ON public.api_cache_entries FOR ALL USING (false);

-- ----- usage_events (user inserts own; user reads own for analytics) -----
ALTER TABLE public.usage_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usage_events_insert_own"
    ON public.usage_events FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "usage_events_select_own"
    ON public.usage_events FOR SELECT
    USING (auth.uid() = user_id);
