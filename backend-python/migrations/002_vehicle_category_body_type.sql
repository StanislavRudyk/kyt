-- Apply to databases created before category/body_type were introduced.
-- Preserve the former `body` value as catalog category; true body-style data is unknown.
ALTER TABLE vehicles
    ADD COLUMN IF NOT EXISTS category VARCHAR(50);

ALTER TABLE vehicles
    ADD COLUMN IF NOT EXISTS body_type VARCHAR(50);

UPDATE vehicles
SET category = body
WHERE category IS NULL;

ALTER TABLE vehicles
    ALTER COLUMN category SET NOT NULL;
