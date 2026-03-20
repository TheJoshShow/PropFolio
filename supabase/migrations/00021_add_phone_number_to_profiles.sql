-- PropFolio: add phone number to user profiles.
-- Canonical storage: public.profiles.phone_number (E.164, e.g. +15555555555).

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS phone_number TEXT;

COMMENT ON COLUMN public.profiles.phone_number IS 'Optional E.164 phone (e.g. +15555555555); nullable; set from signup or settings.';
