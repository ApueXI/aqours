-- Nullable snapshots preserve legacy addresses without inferred administrative codes.
ALTER TABLE service_connections ADD COLUMN structured_address JSONB;
ALTER TABLE reports ADD COLUMN structured_address JSONB;
ALTER TABLE pickup_sites ADD COLUMN structured_address JSONB;
