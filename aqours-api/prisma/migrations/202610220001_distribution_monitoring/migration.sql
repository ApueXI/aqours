CREATE TABLE monitoring_configs (
 site_id uuid PRIMARY KEY REFERENCES pickup_sites(id), supplier_id uuid NOT NULL REFERENCES suppliers(id),
 version integer NOT NULL CHECK(version>0), enabled boolean NOT NULL,
 warning_temperature double precision NOT NULL, critical_temperature double precision NOT NULL,
 low_supply_liters numeric(14,2) NOT NULL, critical_supply_liters numeric(14,2) NOT NULL,
 capacity_liters numeric(14,2), updated_at timestamptz NOT NULL,
 CHECK(critical_temperature > warning_temperature),
 CHECK(critical_supply_liters >= 0 AND low_supply_liters > critical_supply_liters),
 CHECK(capacity_liters IS NULL OR capacity_liters>0)
);
CREATE TABLE monitoring_forecasts (
 site_id uuid PRIMARY KEY REFERENCES pickup_sites(id), supplier_id uuid NOT NULL REFERENCES suppliers(id),
 coordinate_key text NOT NULL, forecast jsonb, last_attempt_at timestamptz, last_success_at timestamptz,
 next_refresh_at timestamptz NOT NULL, error text, failures integer NOT NULL DEFAULT 0
);
CREATE TABLE monitoring_work (
 site_id uuid PRIMARY KEY REFERENCES pickup_sites(id), supplier_id uuid NOT NULL REFERENCES suppliers(id),
 revision integer NOT NULL DEFAULT 1, evaluated_revision integer NOT NULL DEFAULT 0,
 lease_token uuid, lease_until timestamptz, swept_at timestamptz
);
CREATE TABLE monitoring_warnings (
 id uuid PRIMARY KEY, supplier_id uuid NOT NULL REFERENCES suppliers(id), site_id uuid NOT NULL REFERENCES pickup_sites(id),
 site_name text NOT NULL, family text NOT NULL CHECK(family IN ('temperature','supply','combined')),
 forecast_date text NOT NULL, type text NOT NULL, severity text NOT NULL CHECK(severity IN ('warning','critical')),
 state text NOT NULL CHECK(state IN ('active','resolved','expired','suspended')), evidence jsonb NOT NULL,
 created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL, closed_reason text, revision integer NOT NULL
);
CREATE UNIQUE INDEX monitoring_active_warning ON monitoring_warnings(site_id,family,forecast_date) WHERE state='active';
CREATE INDEX monitoring_warnings_supplier_id_site_id_state_idx ON monitoring_warnings(supplier_id,site_id,state);
CREATE TABLE monitoring_history (
 id uuid PRIMARY KEY, warning_id uuid NOT NULL REFERENCES monitoring_warnings(id), revision integer NOT NULL,
 action text NOT NULL, severity text NOT NULL, state text NOT NULL, evidence jsonb NOT NULL,
 created_at timestamptz NOT NULL, reason text, UNIQUE(warning_id,revision)
);
CREATE TABLE monitoring_bands (
 supplier_id uuid PRIMARY KEY REFERENCES suppliers(id), version integer NOT NULL, boundaries jsonb NOT NULL
);
CREATE FUNCTION monitoring_immutable_history() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'Monitoring history is immutable' USING ERRCODE='23514'; END $$;
CREATE TRIGGER monitoring_history_immutable BEFORE UPDATE OR DELETE ON monitoring_history FOR EACH ROW EXECUTE FUNCTION monitoring_immutable_history();
CREATE FUNCTION monitoring_dirty_site(target uuid) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
 INSERT INTO monitoring_work(site_id,supplier_id)
 SELECT target,min(id::text)::uuid FROM suppliers HAVING count(*)=1
 ON CONFLICT(site_id) DO UPDATE SET revision=monitoring_work.revision+1;
END $$;
CREATE FUNCTION monitoring_dirty_trigger() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE target uuid;
BEGIN
 IF TG_TABLE_NAME='pickup_sites' THEN
   target=NEW.id;
   IF TG_OP='UPDATE' AND (OLD.latitude,OLD.longitude) IS DISTINCT FROM (NEW.latitude,NEW.longitude) THEN
     -- Same work-before-forecast order as forecast workers; avoid lock inversion.
     PERFORM monitoring_dirty_site(target);
     DELETE FROM monitoring_forecasts WHERE site_id=target;
     UPDATE monitoring_work SET lease_token=NULL,lease_until=NULL WHERE site_id=target;
     RETURN NEW;
   END IF;
 ELSIF TG_TABLE_NAME IN ('pickup_sessions','monitoring_configs') THEN target=NEW.site_id;
 ELSIF TG_TABLE_NAME='stock_sessions' THEN SELECT site_id INTO target FROM pickup_sessions WHERE id=NEW.id;
 ELSE SELECT site_id INTO target FROM pickup_sessions WHERE id=NEW.session_id;
 END IF;
 PERFORM monitoring_dirty_site(target);
 RETURN NEW;
END $$;
CREATE TRIGGER monitoring_site_dirty AFTER INSERT OR UPDATE ON pickup_sites FOR EACH ROW EXECUTE FUNCTION monitoring_dirty_trigger();
CREATE TRIGGER monitoring_session_dirty AFTER INSERT OR UPDATE ON pickup_sessions FOR EACH ROW EXECUTE FUNCTION monitoring_dirty_trigger();
CREATE TRIGGER monitoring_stock_dirty AFTER INSERT OR UPDATE ON stock_sessions FOR EACH ROW EXECUTE FUNCTION monitoring_dirty_trigger();
CREATE TRIGGER monitoring_allocation_dirty AFTER INSERT OR UPDATE ON allocations FOR EACH ROW EXECUTE FUNCTION monitoring_dirty_trigger();
CREATE TRIGGER monitoring_config_dirty AFTER INSERT OR UPDATE ON monitoring_configs FOR EACH ROW EXECUTE FUNCTION monitoring_dirty_trigger();
INSERT INTO monitoring_work(site_id,supplier_id)
 SELECT p.id,s.id FROM pickup_sites p CROSS JOIN suppliers s WHERE (SELECT count(*) FROM suppliers)=1;
