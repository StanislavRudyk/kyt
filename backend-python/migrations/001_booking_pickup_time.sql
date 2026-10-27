-- Apply once to an existing database before deploying the pickup-time schema.
ALTER TABLE bookings
    ADD COLUMN IF NOT EXISTS pickup_time VARCHAR(5) NOT NULL DEFAULT '09:00';

ALTER TABLE bookings
    ADD COLUMN IF NOT EXISTS privacy_notice_accepted BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE users
    ALTER COLUMN email DROP NOT NULL;
