CREATE TABLE IF NOT EXISTS records (
 id uuid PRIMARY KEY, kind text NOT NULL, owner_id uuid, parent_id uuid, version integer NOT NULL DEFAULT 1 CHECK(version>0),
 data jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(id,kind)
);
CREATE INDEX records_kind_owner ON records(kind,owner_id);
CREATE INDEX records_parent ON records(parent_id,kind);
CREATE UNIQUE INDEX users_email ON records(lower(data->>'email')) WHERE kind='user';
CREATE UNIQUE INDEX connection_reference ON records((data->>'reference')) WHERE kind='connection';
CREATE UNIQUE INDEX zone_code ON records((data->>'code')) WHERE kind='zone';
CREATE UNIQUE INDEX active_assistance ON records(owner_id,parent_id,(data->>'type'))
 WHERE kind='assistance' AND data->>'status' IN ('requested','accepted','scheduled','in_progress');
CREATE UNIQUE INDEX affected_assertion ON records(owner_id,(data->>'connectionId'),(data->>'assertedIncidentId'))
 WHERE kind='report' AND data ? 'assertedIncidentId';
CREATE TABLE IF NOT EXISTS credentials(user_id uuid PRIMARY KEY REFERENCES records(id), password_hash text NOT NULL);
CREATE TABLE IF NOT EXISTS sessions(
 token_hash text PRIMARY KEY, user_id uuid NOT NULL REFERENCES records(id), client text NOT NULL CHECK(client IN ('web','mobile')),
 csrf text NOT NULL, expires_at timestamptz NOT NULL, revoked_at timestamptz
);
CREATE INDEX sessions_user ON sessions(user_id);
CREATE TABLE IF NOT EXISTS operations(
 actor_id uuid NOT NULL REFERENCES records(id), scope text NOT NULL, key uuid NOT NULL, fingerprint text NOT NULL,
 response jsonb, PRIMARY KEY(actor_id,scope,key)
);
CREATE TABLE IF NOT EXISTS events(
 id uuid PRIMARY KEY, target_id uuid NOT NULL REFERENCES records(id), actor_id uuid REFERENCES records(id), action text NOT NULL,
 text text NOT NULL, from_status text, to_status text, private boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now(), metadata jsonb NOT NULL DEFAULT '{}'
);
CREATE TABLE IF NOT EXISTS notifications(
 id uuid PRIMARY KEY, user_id uuid NOT NULL REFERENCES records(id), source_event_key text NOT NULL,
 data jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), read_at timestamptz,
 UNIQUE(user_id,source_event_key)
);
CREATE TABLE IF NOT EXISTS stock_sessions(
 id uuid PRIMARY KEY REFERENCES records(id), total numeric(14,2) NOT NULL CHECK(total>=0 AND total<=1000000000)
);
CREATE TABLE IF NOT EXISTS allocations(
 id uuid PRIMARY KEY, request_id uuid NOT NULL UNIQUE REFERENCES records(id), session_id uuid NOT NULL REFERENCES stock_sessions(id),
 liters numeric(14,2) NOT NULL CHECK(liters>0 AND liters<=1000000000), reference text NOT NULL UNIQUE,
 state text NOT NULL CHECK(state IN ('reserved','collected','released')), reserved_at timestamptz NOT NULL DEFAULT now(),
 collected_at timestamptz, released_at timestamptz
);
CREATE INDEX allocation_session ON allocations(session_id,state);
CREATE FUNCTION prevent_event_changes() RETURNS trigger LANGUAGE plpgsql AS $$
 BEGIN RAISE EXCEPTION 'Immutable history cannot be modified'; END $$;
CREATE TRIGGER immutable_events BEFORE UPDATE OR DELETE ON events FOR EACH ROW EXECUTE FUNCTION prevent_event_changes();
ALTER TABLE records ADD CONSTRAINT records_owner_fk FOREIGN KEY(owner_id) REFERENCES records(id);
ALTER TABLE records ADD CONSTRAINT records_parent_fk FOREIGN KEY(parent_id) REFERENCES records(id);
ALTER TABLE records ADD COLUMN connection_customer uuid GENERATED ALWAYS AS (CASE WHEN kind='connection' THEN owner_id END) STORED;
ALTER TABLE records ADD COLUMN report_customer uuid GENERATED ALWAYS AS (CASE WHEN kind='report' THEN owner_id END) STORED;
ALTER TABLE records ADD COLUMN report_connection uuid GENERATED ALWAYS AS (CASE WHEN kind='report' THEN (data->>'connectionId')::uuid END) STORED;
ALTER TABLE records ADD COLUMN assistance_customer uuid GENERATED ALWAYS AS (CASE WHEN kind='assistance' THEN owner_id END) STORED;
ALTER TABLE records ADD CONSTRAINT connection_customer_unique UNIQUE(id,connection_customer);
ALTER TABLE records ADD CONSTRAINT report_customer_unique UNIQUE(id,report_customer);
ALTER TABLE records ADD CONSTRAINT report_connection_owner FOREIGN KEY(report_connection,report_customer) REFERENCES records(id,connection_customer);
ALTER TABLE records ADD CONSTRAINT assistance_report_owner FOREIGN KEY(parent_id,assistance_customer) REFERENCES records(id,report_customer);
ALTER TABLE records ADD CONSTRAINT report_state CHECK(kind<>'report' OR (data->>'status' IN ('received','under_review','in_progress','resolved') AND data->>'category' IN ('outage','low_pressure','leak','water_quality') AND owner_id IS NOT NULL AND report_connection IS NOT NULL));
ALTER TABLE records ADD CONSTRAINT assistance_state CHECK(kind<>'assistance' OR (data->>'status' IN ('requested','accepted','scheduled','in_progress','completed','unavailable','cancelled') AND data->>'type' IN ('callback','inspection','water_support') AND owner_id IS NOT NULL AND parent_id IS NOT NULL));
ALTER TABLE records ADD CONSTRAINT incident_state CHECK(kind<>'incident' OR data->>'status' IN ('investigating','confirmed','work_in_progress','monitoring','resolved'));
ALTER TABLE records ADD CONSTRAINT coordinate_pair CHECK(kind NOT IN ('report','connection','site') OR
 ((data->>'latitude' IS NULL AND data->>'longitude' IS NULL) OR
 (data->>'latitude' IS NOT NULL AND data->>'longitude' IS NOT NULL AND (data->>'latitude')::double precision BETWEEN -90 AND 90 AND (data->>'longitude')::double precision BETWEEN -180 AND 180)));
ALTER TABLE records ADD CONSTRAINT user_role CHECK(kind<>'user' OR (data->>'role' IN ('customer','staff','admin') AND data->>'active' IN ('true','false')));
ALTER TABLE records ADD CONSTRAINT advisory_state CHECK(kind<>'advisory' OR (data->>'state' IN ('draft','published','lifted') AND data->>'kind' IN ('scheduled_interruption','boil_water','do_not_drink','do_not_use','general')));
ALTER TABLE records ADD CONSTRAINT pickup_state CHECK(kind<>'pickup_session' OR (data->>'status' IN ('open','closed','cancelled') AND (data->>'startsAt')::timestamptz < (data->>'endsAt')::timestamptz));
CREATE FUNCTION validate_record_references() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE item text; target uuid; expected_kind text; field text;
BEGIN
 IF NEW.kind IN ('user','zone','supplier','rule','approved_guidance','seed_marker') THEN RETURN NEW; END IF;
 IF NEW.kind IN ('report','connection','assistance') THEN
  IF NOT EXISTS(SELECT 1 FROM records WHERE id=NEW.owner_id AND kind='user' AND data->>'role'='customer') THEN RAISE EXCEPTION 'Invalid customer owner' USING ERRCODE='23503'; END IF;
  IF NEW.data->>'customerId' IS DISTINCT FROM NEW.owner_id::text THEN RAISE EXCEPTION 'Owner mismatch' USING ERRCODE='23514'; END IF;
 END IF;
 FOREACH field IN ARRAY ARRAY['zoneId','incidentId','siteId','reportId','ownerId','guidanceId'] LOOP
  target := (NEW.data->>field)::uuid;
  expected_kind := CASE field WHEN 'zoneId' THEN 'zone' WHEN 'incidentId' THEN 'incident' WHEN 'siteId' THEN 'site' WHEN 'reportId' THEN 'report' WHEN 'ownerId' THEN 'user' ELSE 'guidance' END;
  IF target IS NOT NULL AND NOT EXISTS(SELECT 1 FROM records WHERE id=target AND kind=expected_kind) THEN RAISE EXCEPTION 'Invalid record reference' USING ERRCODE='23503'; END IF;
 END LOOP;
 IF NEW.data->>'ownerId' IS NOT NULL AND NOT EXISTS(SELECT 1 FROM records WHERE id=(NEW.data->>'ownerId')::uuid AND kind='user' AND data->>'role' IN ('staff','admin')) THEN RAISE EXCEPTION 'Invalid staff owner' USING ERRCODE='23503'; END IF;
 FOR item IN SELECT jsonb_array_elements_text(COALESCE(NEW.data->'zoneIds','[]')) LOOP
  IF NOT EXISTS(SELECT 1 FROM records WHERE id=item::uuid AND kind='zone') THEN RAISE EXCEPTION 'Invalid zone target' USING ERRCODE='23503'; END IF;
 END LOOP;
 FOR item IN SELECT jsonb_array_elements_text(COALESCE(NEW.data->'connectionIds','[]')) LOOP
  IF NOT EXISTS(SELECT 1 FROM records WHERE id=item::uuid AND kind='connection') THEN RAISE EXCEPTION 'Invalid connection target' USING ERRCODE='23503'; END IF;
 END LOOP;
 IF NEW.kind='assistance' AND NEW.data->'details'->>'sessionId' IS NOT NULL AND NOT EXISTS(SELECT 1 FROM records WHERE id=(NEW.data->'details'->>'sessionId')::uuid AND kind='pickup_session') THEN RAISE EXCEPTION 'Invalid pickup session' USING ERRCODE='23503'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER record_references BEFORE INSERT OR UPDATE ON records FOR EACH ROW EXECUTE FUNCTION validate_record_references();
CREATE FUNCTION immutable_record_history() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF OLD.kind IN ('incident_update','advisory_revision','guidance','guidance_choice','approved_guidance','rule','message','attachment') THEN RAISE EXCEPTION 'Immutable domain history'; END IF;
 RETURN CASE WHEN TG_OP='DELETE' THEN OLD ELSE NEW END;
END $$;
CREATE TRIGGER immutable_record_history BEFORE UPDATE OR DELETE ON records FOR EACH ROW EXECUTE FUNCTION immutable_record_history();
CREATE FUNCTION allocation_invariants() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM records WHERE id=NEW.request_id AND kind='assistance' AND data->>'type'='water_support' AND data->'details'->>'sessionId'=NEW.session_id::text) THEN RAISE EXCEPTION 'Invalid allocation request/session' USING ERRCODE='23514'; END IF;
 IF TG_OP='UPDATE' AND (OLD.state<>'reserved' OR NEW.state NOT IN ('collected','released') OR NEW.request_id<>OLD.request_id OR NEW.session_id<>OLD.session_id OR NEW.liters<>OLD.liters OR NEW.reference<>OLD.reference) THEN RAISE EXCEPTION 'Invalid allocation transition' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER allocation_invariants BEFORE INSERT OR UPDATE ON allocations FOR EACH ROW EXECUTE FUNCTION allocation_invariants();

ALTER TABLE records ADD COLUMN latitude double precision GENERATED ALWAYS AS (CASE WHEN kind IN ('report','connection','site') THEN (data->>'latitude')::double precision END) STORED;
ALTER TABLE records ADD COLUMN longitude double precision GENERATED ALWAYS AS (CASE WHEN kind IN ('report','connection','site') THEN (data->>'longitude')::double precision END) STORED;
ALTER TABLE records ADD CONSTRAINT numeric_coordinates CHECK((latitude IS NULL AND longitude IS NULL) OR (latitude IS NOT NULL AND longitude IS NOT NULL AND latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180));
CREATE INDEX report_viewport_coordinates ON records(longitude,latitude) WHERE kind='report' AND latitude IS NOT NULL AND longitude IS NOT NULL;
