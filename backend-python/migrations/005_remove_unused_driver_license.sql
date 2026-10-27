-- The public booking flow never asks for or uses a driver's license.
-- Back up the database before applying; this removes any legacy stored values.
ALTER TABLE users DROP COLUMN IF EXISTS driver_license;
