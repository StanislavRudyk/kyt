-- Run after migrations 001–003 on an existing database.
-- Idempotency keys were added nullable so existing bookings remain valid.
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS idempotency_key varchar(100);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS request_hash varchar(64);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS daily_rate_snapshot integer;

UPDATE bookings b
SET daily_rate_snapshot = COALESCE(v.price_per_day, b.base_amount / GREATEST(b.days, 1))
FROM vehicles v
WHERE b.vehicle_id = v.id AND b.daily_rate_snapshot IS NULL;
UPDATE bookings
SET daily_rate_snapshot = base_amount / GREATEST(days, 1)
WHERE daily_rate_snapshot IS NULL;
ALTER TABLE bookings ALTER COLUMN daily_rate_snapshot SET NOT NULL;
ALTER TABLE bookings ALTER COLUMN daily_rate_snapshot SET DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS ix_bookings_idempotency_key
ON bookings (idempotency_key);

ALTER TABLE bookings DROP CONSTRAINT IF EXISTS booking_status_allowed;
ALTER TABLE bookings ADD CONSTRAINT booking_status_allowed
CHECK (status IN ('pending', 'confirmed', 'paid', 'active', 'completed', 'cancelled'));
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS booking_amounts_nonnegative;
ALTER TABLE bookings ADD CONSTRAINT booking_amounts_nonnegative
CHECK (days > 0 AND base_amount >= 0 AND total_amount >= 0 AND deposit_amount >= 0);

ALTER TABLE bookings DROP CONSTRAINT IF EXISTS booking_vehicle_period_no_overlap;
ALTER TABLE bookings ADD CONSTRAINT booking_vehicle_period_no_overlap
EXCLUDE USING gist (
    vehicle_id WITH =,
    tstzrange(start_at, end_at, '[)') WITH &&
) WHERE (status IN ('pending', 'confirmed', 'paid', 'active'));

CREATE OR REPLACE FUNCTION enforce_booking_status_transition() RETURNS trigger AS $$
BEGIN
    IF NEW.status = OLD.status THEN RETURN NEW; END IF;
    IF (OLD.status, NEW.status) NOT IN (
        ('pending', 'confirmed'), ('pending', 'cancelled'),
        ('confirmed', 'paid'), ('confirmed', 'cancelled'),
        ('paid', 'active'), ('active', 'completed')
    ) THEN
        RAISE EXCEPTION 'Invalid booking status transition: % -> %', OLD.status, NEW.status
            USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS booking_status_transition_guard ON bookings;
CREATE TRIGGER booking_status_transition_guard
    BEFORE UPDATE OF status ON bookings
    FOR EACH ROW EXECUTE FUNCTION enforce_booking_status_transition();
