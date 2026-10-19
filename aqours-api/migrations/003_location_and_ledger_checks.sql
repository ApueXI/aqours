ALTER TABLE records ADD CONSTRAINT confirmed_zone_present CHECK(
 kind NOT IN ('report','connection') OR (data->>'zoneConfirmed')::boolean IS NOT TRUE OR data->>'zoneId' IS NOT NULL
);
ALTER TABLE allocations ADD CONSTRAINT allocation_event_times CHECK(
 (state='reserved' AND collected_at IS NULL AND released_at IS NULL) OR
 (state='collected' AND collected_at IS NOT NULL AND collected_at>=reserved_at AND released_at IS NULL) OR
 (state='released' AND released_at IS NOT NULL AND released_at>=reserved_at AND collected_at IS NULL)
);
CREATE OR REPLACE FUNCTION allocation_invariants() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM records WHERE id=NEW.request_id AND kind='assistance' AND data->>'type'='water_support' AND data->'details'->>'sessionId'=NEW.session_id::text) THEN RAISE EXCEPTION 'Invalid allocation request/session' USING ERRCODE='23514'; END IF;
 IF TG_OP='INSERT' AND NEW.state<>'reserved' THEN RAISE EXCEPTION 'Allocation must begin reserved' USING ERRCODE='23514'; END IF;
 IF TG_OP='UPDATE' AND (OLD.state<>'reserved' OR NEW.state NOT IN ('collected','released') OR NEW.request_id<>OLD.request_id OR NEW.session_id<>OLD.session_id OR NEW.liters<>OLD.liters OR NEW.reference<>OLD.reference OR NEW.reserved_at<>OLD.reserved_at) THEN RAISE EXCEPTION 'Invalid allocation transition' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
