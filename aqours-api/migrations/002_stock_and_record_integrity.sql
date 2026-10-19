ALTER TABLE records ADD CONSTRAINT domain_required_fields CHECK(
 (kind<>'report' OR (data ?& ARRAY['category','status','customerId','connectionId','noticedAt','submittedAt'] AND data->>'category' IS NOT NULL AND data->>'status' IS NOT NULL)) AND
 (kind<>'assistance' OR (data ?& ARRAY['type','status','customerId','reportId','details'] AND data->>'type' IS NOT NULL AND data->>'status' IS NOT NULL AND data->>'reportId'=parent_id::text)) AND
 (kind<>'connection' OR (owner_id IS NOT NULL AND data->>'customerId'=owner_id::text))
);
CREATE FUNCTION enforce_stock_commitment() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE total_amount numeric; commitment numeric;
BEGIN
 IF TG_TABLE_NAME='allocations' THEN
  SELECT total INTO total_amount FROM stock_sessions WHERE id=NEW.session_id FOR UPDATE;
  SELECT COALESCE(sum(liters),0) INTO commitment FROM allocations WHERE session_id=NEW.session_id AND state IN ('reserved','collected') AND id<>NEW.id;
  IF NEW.state IN ('reserved','collected') AND commitment+NEW.liters>total_amount THEN RAISE EXCEPTION 'Stock commitment exceeds total' USING ERRCODE='23514'; END IF;
 ELSE
  SELECT COALESCE(sum(liters),0) INTO commitment FROM allocations WHERE session_id=NEW.id AND state IN ('reserved','collected');
  IF NEW.total<commitment THEN RAISE EXCEPTION 'Stock below commitment' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER allocation_stock_commitment BEFORE INSERT OR UPDATE ON allocations FOR EACH ROW EXECUTE FUNCTION enforce_stock_commitment();
CREATE TRIGGER session_stock_commitment BEFORE UPDATE ON stock_sessions FOR EACH ROW EXECUTE FUNCTION enforce_stock_commitment();
CREATE FUNCTION prevent_allocation_deletion() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'Water ledger rows cannot be deleted'; END $$;
CREATE TRIGGER immutable_allocation_ledger BEFORE DELETE ON allocations FOR EACH ROW EXECUTE FUNCTION prevent_allocation_deletion();
