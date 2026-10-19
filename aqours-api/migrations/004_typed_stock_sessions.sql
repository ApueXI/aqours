-- A stock ledger belongs to a pickup session, never an arbitrary domain record.
ALTER TABLE stock_sessions ADD COLUMN record_kind text NOT NULL DEFAULT 'pickup_session'
 CHECK(record_kind='pickup_session');
ALTER TABLE stock_sessions ADD CONSTRAINT stock_session_record_kind
 FOREIGN KEY(id,record_kind) REFERENCES records(id,kind);
