-- Apply to an existing PostgreSQL database before deploying the new booking API.
-- Legacy dates are interpreted as Europe/Kyiv local time; confirm this assumption
-- against the actual business before applying to production data.
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS return_time VARCHAR(5) DEFAULT '09:00';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS start_at TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS end_at TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS pickup_location_id VARCHAR(50);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS pickup_location_name VARCHAR(100);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS pickup_address VARCHAR(250);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS pickup_timezone VARCHAR(80);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS return_location_id VARCHAR(50);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS return_location_name VARCHAR(100);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS return_address VARCHAR(250);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS return_timezone VARCHAR(80);

UPDATE bookings
SET return_time = COALESCE(return_time, pickup_time, '09:00'),
    start_at = COALESCE(start_at, (start_date + COALESCE(pickup_time, '09:00')::time) AT TIME ZONE 'Europe/Kyiv'),
    end_at = COALESCE(end_at, (end_date + COALESCE(return_time, pickup_time, '09:00')::time) AT TIME ZONE 'Europe/Kyiv'),
    pickup_location_id = COALESCE(pickup_location_id, 'legacy'),
    pickup_location_name = COALESCE(pickup_location_name, location),
    pickup_address = COALESCE(pickup_address, location),
    pickup_timezone = COALESCE(pickup_timezone, 'Europe/Kyiv'),
    return_location_id = COALESCE(return_location_id, 'legacy'),
    return_location_name = COALESCE(return_location_name, location),
    return_address = COALESCE(return_address, location),
    return_timezone = COALESCE(return_timezone, 'Europe/Kyiv');

ALTER TABLE bookings ALTER COLUMN return_time SET NOT NULL;
ALTER TABLE bookings ALTER COLUMN start_at SET NOT NULL;
ALTER TABLE bookings ALTER COLUMN end_at SET NOT NULL;
ALTER TABLE bookings ALTER COLUMN pickup_location_id SET NOT NULL;
ALTER TABLE bookings ALTER COLUMN pickup_location_name SET NOT NULL;
ALTER TABLE bookings ALTER COLUMN pickup_address SET NOT NULL;
ALTER TABLE bookings ALTER COLUMN pickup_timezone SET NOT NULL;
ALTER TABLE bookings ALTER COLUMN return_location_id SET NOT NULL;
ALTER TABLE bookings ALTER COLUMN return_location_name SET NOT NULL;
ALTER TABLE bookings ALTER COLUMN return_address SET NOT NULL;
ALTER TABLE bookings ALTER COLUMN return_timezone SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'booking_period_positive'
    ) THEN
        ALTER TABLE bookings
            ADD CONSTRAINT booking_period_positive CHECK (end_at > start_at);
    END IF;
END $$;

-- New availability is based on timestamp intervals; retain only manual schedule blocks.
DELETE FROM vehicle_schedules WHERE booking_id IS NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'booking_vehicle_period_no_overlap'
    ) THEN
        ALTER TABLE bookings
            ADD CONSTRAINT booking_vehicle_period_no_overlap
            EXCLUDE USING gist (
                vehicle_id WITH =,
                tstzrange(start_at, end_at, '[)') WITH &&
            ) WHERE (status IN ('pending', 'confirmed'));
    END IF;
END $$;
