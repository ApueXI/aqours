BEGIN;

-- Preserve the complete pre-Prisma record store as a frozen archive.
ALTER TABLE records RENAME TO legacy_records;
DO $$ DECLARE c record; BEGIN
 FOR c IN SELECT conrelid::regclass AS tab, conname FROM pg_constraint
 WHERE contype='f' AND confrelid='legacy_records'::regclass AND conrelid<>'legacy_records'::regclass
 LOOP EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', c.tab, c.conname); END LOOP;
END $$;

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";



-- CreateTable
CREATE TABLE "suppliers" (
    "id" UUID NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "stored_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "demo" BOOLEAN NOT NULL,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);



-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "stored_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "active" BOOLEAN NOT NULL,
    "role" TEXT NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);



-- CreateTable
CREATE TABLE "zones" (
    "id" UUID NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "stored_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "boundary" JSONB,
    "active" BOOLEAN NOT NULL,
    "demo" BOOLEAN NOT NULL,

    CONSTRAINT "zones_pkey" PRIMARY KEY ("id")
);



-- CreateTable
CREATE TABLE "service_connections" (
    "id" UUID NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "stored_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "customer_id" UUID NOT NULL,
    "reference" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "zone_id" UUID,
    "zone_confirmed" BOOLEAN NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,

    CONSTRAINT "service_connections_pkey" PRIMARY KEY ("id")
);



-- CreateTable
CREATE TABLE "reports" (
    "id" UUID NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "stored_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "customer_id" UUID NOT NULL,
    "connection_id" UUID NOT NULL,
    "reference" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "noticed_at" TIMESTAMPTZ(6) NOT NULL,
    "submitted_at" TIMESTAMPTZ(6) NOT NULL,
    "status" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "location_source" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "accuracy" DOUBLE PRECISION,
    "location_confirmed" BOOLEAN NOT NULL,
    "zone_id" UUID,
    "zone_confirmed" BOOLEAN NOT NULL,
    "location_review" BOOLEAN NOT NULL,
    "priority" TEXT NOT NULL,
    "priority_reason" TEXT,
    "owner_id" UUID,
    "incident_id" UUID,
    "asserted_incident_id" UUID,
    "closure_outcome" TEXT,
    "closure_reason" TEXT,
    "first_responded_at" TIMESTAMPTZ(6),
    "first_resolved_at" TIMESTAMPTZ(6),
    "answers" JSONB NOT NULL,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);



-- CreateTable
CREATE TABLE "report_messages" (
    "id" UUID NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "stored_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "report_id" UUID NOT NULL,
    "text" TEXT NOT NULL,
    "author_id" UUID NOT NULL,
    "author_role" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "report_messages_pkey" PRIMARY KEY ("id")
);



-- CreateTable
CREATE TABLE "attachments" (
    "id" UUID NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "stored_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "report_id" UUID NOT NULL,
    "filename" TEXT NOT NULL,
    "media_type" TEXT NOT NULL,
    "byte_size" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);



-- CreateTable
CREATE TABLE "incidents" (
    "id" UUID NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "stored_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "category" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "owner_id" UUID,
    "area" TEXT NOT NULL,
    "geometry" JSONB,
    "restoration_at" TIMESTAMPTZ(6),
    "estimated_affected" INTEGER,
    "estimate_basis" TEXT,
    "estimate_updated_at" TIMESTAMPTZ(6),
    "demo" BOOLEAN NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "incidents_pkey" PRIMARY KEY ("id")
);



-- CreateTable
CREATE TABLE "incident_publications" (
    "id" UUID NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "stored_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "incident_id" UUID NOT NULL,
    "category" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "progress" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "restoration_at" TIMESTAMPTZ(6),
    "geometry" JSONB,
    "published_at" TIMESTAMPTZ(6) NOT NULL,
    "demo" BOOLEAN NOT NULL,

    CONSTRAINT "incident_publications_pkey" PRIMARY KEY ("id")
);



-- CreateTable
CREATE TABLE "advisories" (
    "id" UUID NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "stored_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "geometry" JSONB,
    "starts_at" TIMESTAMPTZ(6),
    "ends_at" TIMESTAMPTZ(6),
    "state" TEXT NOT NULL,
    "published_at" TIMESTAMPTZ(6),
    "lifted_at" TIMESTAMPTZ(6),
    "lift_reason" TEXT,
    "demo" BOOLEAN NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "advisories_pkey" PRIMARY KEY ("id")
);



-- CreateTable
CREATE TABLE "advisory_revisions" (
    "id" UUID NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "stored_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "advisory_id" UUID NOT NULL,
    "snapshot" JSONB NOT NULL,
    "action" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "advisory_revisions_pkey" PRIMARY KEY ("id")
);



-- CreateTable
CREATE TABLE "assistance_requests" (
    "id" UUID NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "stored_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "customer_id" UUID NOT NULL,
    "report_id" UUID NOT NULL,
    "incident_id" UUID,
    "reference" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "owner_id" UUID,
    "appointment_at" TIMESTAMPTZ(6),
    "outcome" TEXT,
    "next_steps" TEXT,
    "reason" TEXT,
    "started_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "assistance_requests_pkey" PRIMARY KEY ("id")
);



-- CreateTable
CREATE TABLE "pickup_sites" (
    "id" UUID NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "stored_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "instructions" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "active" BOOLEAN NOT NULL,
    "demo" BOOLEAN NOT NULL,

    CONSTRAINT "pickup_sites_pkey" PRIMARY KEY ("id")
);



-- CreateTable
CREATE TABLE "pickup_sessions" (
    "id" UUID NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "stored_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "site_id" UUID NOT NULL,
    "starts_at" TIMESTAMPTZ(6) NOT NULL,
    "ends_at" TIMESTAMPTZ(6) NOT NULL,
    "status" TEXT NOT NULL,
    "instructions" TEXT NOT NULL,
    "demo" BOOLEAN NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "pickup_sessions_pkey" PRIMARY KEY ("id")
);



-- CreateTable
CREATE TABLE "approved_guidance" (
    "id" UUID NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "stored_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "kind" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "approved_guidance_pkey" PRIMARY KEY ("id")
);



-- CreateTable
CREATE TABLE "guidance_rules" (
    "id" UUID NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "stored_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "active" BOOLEAN NOT NULL,
    "contact_text" TEXT NOT NULL,
    "inspection_text" TEXT NOT NULL,
    "water_text" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "guidance_rules_pkey" PRIMARY KEY ("id")
);



-- CreateTable
CREATE TABLE "guidance_evaluations" (
    "id" UUID NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "stored_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "customer_id" UUID NOT NULL,
    "report_id" UUID NOT NULL,
    "evaluated_at" TIMESTAMPTZ(6) NOT NULL,
    "rule_version" INTEGER NOT NULL,
    "current" BOOLEAN NOT NULL,
    "uncertainty" JSONB NOT NULL,
    "questions" JSONB NOT NULL,
    "cards" JSONB NOT NULL,
    "alternatives" JSONB NOT NULL,
    "source_signature" TEXT NOT NULL,
    "evidence" JSONB,
    "answers" JSONB NOT NULL,

    CONSTRAINT "guidance_evaluations_pkey" PRIMARY KEY ("id")
);



-- CreateTable
CREATE TABLE "guidance_choices" (
    "id" UUID NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "stored_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "guidance_id" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL,
    "customer_id" UUID NOT NULL,

    CONSTRAINT "guidance_choices_pkey" PRIMARY KEY ("id")
);



-- CreateTable
CREATE TABLE "seed_markers" (
    "id" UUID NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "stored_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fixture" TEXT NOT NULL,
    "applied_at" TIMESTAMPTZ(6) NOT NULL,
    "demo" BOOLEAN NOT NULL,

    CONSTRAINT "seed_markers_pkey" PRIMARY KEY ("id")
);



-- CreateTable
CREATE TABLE "entities" (
    "id" UUID NOT NULL,
    "kind" TEXT NOT NULL,

    CONSTRAINT "entities_pkey" PRIMARY KEY ("id")
);



-- CreateTable
CREATE TABLE "incidents_zone_ids" (
    "entity_id" UUID NOT NULL,
    "target_id" UUID NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "incidents_zone_ids_pkey" PRIMARY KEY ("entity_id","target_id")
);



-- CreateTable
CREATE TABLE "incident_publications_zone_ids" (
    "entity_id" UUID NOT NULL,
    "target_id" UUID NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "incident_publications_zone_ids_pkey" PRIMARY KEY ("entity_id","target_id")
);



-- CreateTable
CREATE TABLE "advisories_zone_ids" (
    "entity_id" UUID NOT NULL,
    "target_id" UUID NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "advisories_zone_ids_pkey" PRIMARY KEY ("entity_id","target_id")
);



-- CreateTable
CREATE TABLE "advisories_connection_ids" (
    "entity_id" UUID NOT NULL,
    "target_id" UUID NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "advisories_connection_ids_pkey" PRIMARY KEY ("entity_id","target_id")
);



-- CreateTable
CREATE TABLE "pickup_sessions_zone_ids" (
    "entity_id" UUID NOT NULL,
    "target_id" UUID NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "pickup_sessions_zone_ids_pkey" PRIMARY KEY ("entity_id","target_id")
);



-- CreateTable
CREATE TABLE "callback_details" (
    "request_id" UUID NOT NULL,
    "question" TEXT,
    "contact_method" TEXT,
    "contact_number" TEXT,
    "preferred_window" TEXT,

    CONSTRAINT "callback_details_pkey" PRIMARY KEY ("request_id")
);



-- CreateTable
CREATE TABLE "inspection_details" (
    "request_id" UUID NOT NULL,
    "issue_details" TEXT,
    "site_address" TEXT,
    "preferred_window" TEXT,
    "access_instructions" TEXT,

    CONSTRAINT "inspection_details_pkey" PRIMARY KEY ("request_id")
);



-- CreateTable
CREATE TABLE "water_support_details" (
    "request_id" UUID NOT NULL,
    "requested_liters" DECIMAL(14,2),
    "session_id" UUID,
    "notes" TEXT,

    CONSTRAINT "water_support_details_pkey" PRIMARY KEY ("request_id")
);



-- CreateIndex
CREATE INDEX "suppliers_stored_at_id_idx" ON "suppliers"("stored_at", "id");



-- CreateIndex
CREATE INDEX "users_stored_at_id_idx" ON "users"("stored_at", "id");



-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");



-- CreateIndex
CREATE INDEX "zones_stored_at_id_idx" ON "zones"("stored_at", "id");



-- CreateIndex
CREATE UNIQUE INDEX "zones_code_key" ON "zones"("code");



-- CreateIndex
CREATE INDEX "service_connections_stored_at_id_idx" ON "service_connections"("stored_at", "id");



-- CreateIndex
CREATE UNIQUE INDEX "service_connections_reference_key" ON "service_connections"("reference");



-- CreateIndex
CREATE UNIQUE INDEX "service_connections_id_customer_id_key" ON "service_connections"("id", "customer_id");



-- CreateIndex
CREATE INDEX "reports_longitude_latitude_idx" ON "reports"("longitude", "latitude");



-- CreateIndex
CREATE INDEX "reports_stored_at_id_idx" ON "reports"("stored_at", "id");



-- CreateIndex
CREATE UNIQUE INDEX "reports_id_customer_id_key" ON "reports"("id", "customer_id");



-- CreateIndex
CREATE INDEX "report_messages_stored_at_id_idx" ON "report_messages"("stored_at", "id");



-- CreateIndex
CREATE INDEX "attachments_stored_at_id_idx" ON "attachments"("stored_at", "id");



-- CreateIndex
CREATE INDEX "incidents_stored_at_id_idx" ON "incidents"("stored_at", "id");



-- CreateIndex
CREATE INDEX "incident_publications_stored_at_id_idx" ON "incident_publications"("stored_at", "id");



-- CreateIndex
CREATE INDEX "advisories_stored_at_id_idx" ON "advisories"("stored_at", "id");



-- CreateIndex
CREATE INDEX "advisory_revisions_stored_at_id_idx" ON "advisory_revisions"("stored_at", "id");



-- CreateIndex
CREATE INDEX "assistance_requests_stored_at_id_idx" ON "assistance_requests"("stored_at", "id");



-- CreateIndex
CREATE INDEX "pickup_sites_stored_at_id_idx" ON "pickup_sites"("stored_at", "id");



-- CreateIndex
CREATE INDEX "pickup_sessions_stored_at_id_idx" ON "pickup_sessions"("stored_at", "id");



-- CreateIndex
CREATE INDEX "approved_guidance_stored_at_id_idx" ON "approved_guidance"("stored_at", "id");



-- CreateIndex
CREATE INDEX "guidance_rules_stored_at_id_idx" ON "guidance_rules"("stored_at", "id");



-- CreateIndex
CREATE INDEX "guidance_evaluations_stored_at_id_idx" ON "guidance_evaluations"("stored_at", "id");



-- CreateIndex
CREATE INDEX "guidance_choices_stored_at_id_idx" ON "guidance_choices"("stored_at", "id");



-- CreateIndex
CREATE INDEX "seed_markers_stored_at_id_idx" ON "seed_markers"("stored_at", "id");

INSERT INTO entities(id,kind) SELECT id,kind FROM legacy_records;

INSERT INTO suppliers(id,version,stored_at,changed_at,name,demo) SELECT id,version,created_at,updated_at,data->>'name',(data->>'demo')::boolean FROM legacy_records WHERE kind='supplier';

INSERT INTO users(id,version,stored_at,changed_at,email,name,phone,active,role) SELECT id,version,created_at,updated_at,data->>'email',data->>'name',data->>'phone',(data->>'active')::boolean,data->>'role' FROM legacy_records WHERE kind='user';

INSERT INTO zones(id,version,stored_at,changed_at,code,name,boundary,active,demo) SELECT id,version,created_at,updated_at,data->>'code',data->>'name',data->'boundary',(data->>'active')::boolean,(data->>'demo')::boolean FROM legacy_records WHERE kind='zone';

INSERT INTO service_connections(id,version,stored_at,changed_at,customer_id,reference,address,zone_id,zone_confirmed,latitude,longitude) SELECT id,version,created_at,updated_at,(data->>'customerId')::uuid,data->>'reference',data->>'address',(data->>'zoneId')::uuid,(data->>'zoneConfirmed')::boolean,(data->>'latitude')::double precision,(data->>'longitude')::double precision FROM legacy_records WHERE kind='connection';

INSERT INTO reports(id,version,stored_at,changed_at,customer_id,connection_id,reference,category,description,noticed_at,submitted_at,status,address,location_source,latitude,longitude,accuracy,location_confirmed,zone_id,zone_confirmed,location_review,priority,priority_reason,owner_id,incident_id,asserted_incident_id,closure_outcome,closure_reason,first_responded_at,first_resolved_at,answers) SELECT id,version,created_at,updated_at,(data->>'customerId')::uuid,(data->>'connectionId')::uuid,data->>'reference',data->>'category',data->>'description',(data->>'noticedAt')::timestamptz,(data->>'submittedAt')::timestamptz,data->>'status',data->>'address',data->>'locationSource',(data->>'latitude')::double precision,(data->>'longitude')::double precision,(data->>'accuracy')::double precision,(data->>'locationConfirmed')::boolean,(data->>'zoneId')::uuid,(data->>'zoneConfirmed')::boolean,(data->>'locationReview')::boolean,data->>'priority',data->>'priorityReason',(data->>'ownerId')::uuid,(data->>'incidentId')::uuid,(data->>'assertedIncidentId')::uuid,data->>'closureOutcome',data->>'closureReason',(data->>'firstRespondedAt')::timestamptz,(data->>'firstResolvedAt')::timestamptz,data->'answers' FROM legacy_records WHERE kind='report';

INSERT INTO report_messages(id,version,stored_at,changed_at,report_id,text,author_id,author_role,created_at) SELECT id,version,created_at,updated_at,(data->>'reportId')::uuid,data->>'text',(data->>'authorId')::uuid,data->>'authorRole',(data->>'createdAt')::timestamptz FROM legacy_records WHERE kind='message';

INSERT INTO attachments(id,version,stored_at,changed_at,report_id,filename,media_type,byte_size,created_at) SELECT id,version,created_at,updated_at,(data->>'reportId')::uuid,data->>'filename',data->>'mediaType',(data->>'byteSize')::integer,(data->>'createdAt')::timestamptz FROM legacy_records WHERE kind='attachment';

INSERT INTO incidents(id,version,stored_at,changed_at,category,summary,status,owner_id,area,geometry,restoration_at,estimated_affected,estimate_basis,estimate_updated_at,demo,created_at) SELECT id,version,created_at,updated_at,data->>'category',data->>'summary',data->>'status',(data->>'ownerId')::uuid,data->>'area',data->'geometry',(data->>'restorationAt')::timestamptz,(data->>'estimatedAffected')::integer,data->>'estimateBasis',(data->>'estimateUpdatedAt')::timestamptz,(data->>'demo')::boolean,(data->>'createdAt')::timestamptz FROM legacy_records WHERE kind='incident';

INSERT INTO incident_publications(id,version,stored_at,changed_at,incident_id,category,summary,status,progress,area,restoration_at,geometry,published_at,demo) SELECT id,version,created_at,updated_at,(data->>'incidentId')::uuid,data->>'category',data->>'summary',data->>'status',data->>'progress',data->>'area',(data->>'restorationAt')::timestamptz,data->'geometry',(data->>'publishedAt')::timestamptz,(data->>'demo')::boolean FROM legacy_records WHERE kind='incident_update';

INSERT INTO advisories(id,version,stored_at,changed_at,kind,title,text,source,geometry,starts_at,ends_at,state,published_at,lifted_at,lift_reason,demo,updated_at) SELECT id,version,created_at,updated_at,data->>'kind',data->>'title',data->>'text',data->>'source',data->'geometry',(data->>'startsAt')::timestamptz,(data->>'endsAt')::timestamptz,data->>'state',(data->>'publishedAt')::timestamptz,(data->>'liftedAt')::timestamptz,data->>'liftReason',(data->>'demo')::boolean,(data->>'updatedAt')::timestamptz FROM legacy_records WHERE kind='advisory';

INSERT INTO advisory_revisions(id,version,stored_at,changed_at,advisory_id,snapshot,action,created_at) SELECT id,version,created_at,updated_at,(data->>'advisoryId')::uuid,data->'snapshot',data->>'action',(data->>'createdAt')::timestamptz FROM legacy_records WHERE kind='advisory_revision';

INSERT INTO assistance_requests(id,version,stored_at,changed_at,customer_id,report_id,incident_id,reference,type,status,owner_id,appointment_at,outcome,next_steps,reason,started_at,created_at,updated_at) SELECT id,version,created_at,updated_at,(data->>'customerId')::uuid,(data->>'reportId')::uuid,(data->>'incidentId')::uuid,data->>'reference',data->>'type',data->>'status',(data->>'ownerId')::uuid,(data->>'appointmentAt')::timestamptz,data->>'outcome',data->>'nextSteps',data->>'reason',(data->>'startedAt')::timestamptz,(data->>'createdAt')::timestamptz,(data->>'updatedAt')::timestamptz FROM legacy_records WHERE kind='assistance';

INSERT INTO pickup_sites(id,version,stored_at,changed_at,name,address,instructions,latitude,longitude,active,demo) SELECT id,version,created_at,updated_at,data->>'name',data->>'address',data->>'instructions',(data->>'latitude')::double precision,(data->>'longitude')::double precision,(data->>'active')::boolean,(data->>'demo')::boolean FROM legacy_records WHERE kind='site';

INSERT INTO pickup_sessions(id,version,stored_at,changed_at,site_id,starts_at,ends_at,status,instructions,demo,updated_at) SELECT id,version,created_at,updated_at,(data->>'siteId')::uuid,(data->>'startsAt')::timestamptz,(data->>'endsAt')::timestamptz,data->>'status',data->>'instructions',(data->>'demo')::boolean,(data->>'updatedAt')::timestamptz FROM legacy_records WHERE kind='pickup_session';

INSERT INTO approved_guidance(id,version,stored_at,changed_at,kind,text,source,created_at) SELECT id,version,created_at,updated_at,data->>'kind',data->>'text',data->>'source',(data->>'createdAt')::timestamptz FROM legacy_records WHERE kind='approved_guidance';

INSERT INTO guidance_rules(id,version,stored_at,changed_at,active,contact_text,inspection_text,water_text,created_at) SELECT id,version,created_at,updated_at,(data->>'active')::boolean,data->>'contactText',data->>'inspectionText',data->>'waterText',(data->>'createdAt')::timestamptz FROM legacy_records WHERE kind='rule';

INSERT INTO guidance_evaluations(id,version,stored_at,changed_at,customer_id,report_id,evaluated_at,rule_version,current,uncertainty,questions,cards,alternatives,source_signature,evidence,answers) SELECT id,version,created_at,updated_at,(data->>'customerId')::uuid,(data->>'reportId')::uuid,(data->>'evaluatedAt')::timestamptz,(data->>'ruleVersion')::integer,(data->>'current')::boolean,data->'uncertainty',data->'questions',data->'cards',data->'alternatives',data->>'sourceSignature',data->'evidence',data->'answers' FROM legacy_records WHERE kind='guidance';

INSERT INTO guidance_choices(id,version,stored_at,changed_at,guidance_id,action,created_at,customer_id) SELECT id,version,created_at,updated_at,(data->>'guidanceId')::uuid,data->>'action',(data->>'createdAt')::timestamptz,(data->>'customerId')::uuid FROM legacy_records WHERE kind='guidance_choice';

INSERT INTO seed_markers(id,version,stored_at,changed_at,fixture,applied_at,demo) SELECT id,version,created_at,updated_at,data->>'fixture',(data->>'appliedAt')::timestamptz,(data->>'demo')::boolean FROM legacy_records WHERE kind='seed_marker';

INSERT INTO incidents_zone_ids(entity_id,target_id,position)
 SELECT id, target::uuid, min(pos)::integer-1 FROM legacy_records,
 jsonb_array_elements_text(COALESCE(data->'zoneIds','[]')) WITH ORDINALITY AS targets(target,pos)
 WHERE kind='incident' GROUP BY id,target;

INSERT INTO incident_publications_zone_ids(entity_id,target_id,position)
 SELECT id, target::uuid, min(pos)::integer-1 FROM legacy_records,
 jsonb_array_elements_text(COALESCE(data->'zoneIds','[]')) WITH ORDINALITY AS targets(target,pos)
 WHERE kind='incident_update' GROUP BY id,target;

INSERT INTO advisories_zone_ids(entity_id,target_id,position)
 SELECT id, target::uuid, min(pos)::integer-1 FROM legacy_records,
 jsonb_array_elements_text(COALESCE(data->'zoneIds','[]')) WITH ORDINALITY AS targets(target,pos)
 WHERE kind='advisory' GROUP BY id,target;

INSERT INTO advisories_connection_ids(entity_id,target_id,position)
 SELECT id, target::uuid, min(pos)::integer-1 FROM legacy_records,
 jsonb_array_elements_text(COALESCE(data->'connectionIds','[]')) WITH ORDINALITY AS targets(target,pos)
 WHERE kind='advisory' GROUP BY id,target;

INSERT INTO pickup_sessions_zone_ids(entity_id,target_id,position)
 SELECT id, target::uuid, min(pos)::integer-1 FROM legacy_records,
 jsonb_array_elements_text(COALESCE(data->'zoneIds','[]')) WITH ORDINALITY AS targets(target,pos)
 WHERE kind='pickup_session' GROUP BY id,target;

INSERT INTO callback_details(request_id,question,contact_method,contact_number,preferred_window) SELECT (id)::uuid,data->'details'->>'question',data->'details'->>'contactMethod',data->'details'->>'contactNumber',data->'details'->>'preferredWindow' FROM legacy_records WHERE kind='assistance' AND data->>'type'='callback';

INSERT INTO inspection_details(request_id,issue_details,site_address,preferred_window,access_instructions) SELECT (id)::uuid,data->'details'->>'issueDetails',data->'details'->>'siteAddress',data->'details'->>'preferredWindow',data->'details'->>'accessInstructions' FROM legacy_records WHERE kind='assistance' AND data->>'type'='inspection';

INSERT INTO water_support_details(request_id,requested_liters,session_id,notes) SELECT (id)::uuid,(data->'details'->>'requestedLiters')::numeric(14,2),(data->'details'->>'sessionId')::uuid,data->'details'->>'notes' FROM legacy_records WHERE kind='assistance' AND data->>'type'='water_support';



-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_id_fkey" FOREIGN KEY ("id") REFERENCES "entities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;



-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_id_fkey" FOREIGN KEY ("id") REFERENCES "entities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;



-- AddForeignKey
ALTER TABLE "zones" ADD CONSTRAINT "zones_id_fkey" FOREIGN KEY ("id") REFERENCES "entities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;



-- AddForeignKey
ALTER TABLE "service_connections" ADD CONSTRAINT "service_connections_id_fkey" FOREIGN KEY ("id") REFERENCES "entities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;



-- AddForeignKey
ALTER TABLE "service_connections" ADD CONSTRAINT "service_connections_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;



-- AddForeignKey
ALTER TABLE "service_connections" ADD CONSTRAINT "service_connections_zone_id_fkey" FOREIGN KEY ("zone_id") REFERENCES "zones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;



-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_id_fkey" FOREIGN KEY ("id") REFERENCES "entities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;



-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;



-- AddForeignKey




-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_zone_id_fkey" FOREIGN KEY ("zone_id") REFERENCES "zones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;



-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;



-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_incident_id_fkey" FOREIGN KEY ("incident_id") REFERENCES "incidents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;



-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_asserted_incident_id_fkey" FOREIGN KEY ("asserted_incident_id") REFERENCES "incidents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;



-- AddForeignKey
ALTER TABLE "report_messages" ADD CONSTRAINT "report_messages_id_fkey" FOREIGN KEY ("id") REFERENCES "entities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;



-- AddForeignKey
ALTER TABLE "report_messages" ADD CONSTRAINT "report_messages_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "reports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;



-- AddForeignKey
ALTER TABLE "report_messages" ADD CONSTRAINT "report_messages_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;



-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_id_fkey" FOREIGN KEY ("id") REFERENCES "entities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;



-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "reports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;



-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_id_fkey" FOREIGN KEY ("id") REFERENCES "entities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;



-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;



-- AddForeignKey
ALTER TABLE "incident_publications" ADD CONSTRAINT "incident_publications_id_fkey" FOREIGN KEY ("id") REFERENCES "entities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;



-- AddForeignKey
ALTER TABLE "incident_publications" ADD CONSTRAINT "incident_publications_incident_id_fkey" FOREIGN KEY ("incident_id") REFERENCES "incidents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;



-- AddForeignKey
ALTER TABLE "advisories" ADD CONSTRAINT "advisories_id_fkey" FOREIGN KEY ("id") REFERENCES "entities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;



-- AddForeignKey
ALTER TABLE "advisory_revisions" ADD CONSTRAINT "advisory_revisions_id_fkey" FOREIGN KEY ("id") REFERENCES "entities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;



-- AddForeignKey
ALTER TABLE "advisory_revisions" ADD CONSTRAINT "advisory_revisions_advisory_id_fkey" FOREIGN KEY ("advisory_id") REFERENCES "advisories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;



-- AddForeignKey
ALTER TABLE "assistance_requests" ADD CONSTRAINT "assistance_requests_id_fkey" FOREIGN KEY ("id") REFERENCES "entities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;



-- AddForeignKey
ALTER TABLE "assistance_requests" ADD CONSTRAINT "assistance_requests_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;



-- AddForeignKey




-- AddForeignKey
ALTER TABLE "assistance_requests" ADD CONSTRAINT "assistance_requests_incident_id_fkey" FOREIGN KEY ("incident_id") REFERENCES "incidents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;



-- AddForeignKey
ALTER TABLE "assistance_requests" ADD CONSTRAINT "assistance_requests_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;



-- AddForeignKey
ALTER TABLE "pickup_sites" ADD CONSTRAINT "pickup_sites_id_fkey" FOREIGN KEY ("id") REFERENCES "entities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;



-- AddForeignKey
ALTER TABLE "pickup_sessions" ADD CONSTRAINT "pickup_sessions_id_fkey" FOREIGN KEY ("id") REFERENCES "entities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;



-- AddForeignKey
ALTER TABLE "pickup_sessions" ADD CONSTRAINT "pickup_sessions_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "pickup_sites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;



-- AddForeignKey
ALTER TABLE "approved_guidance" ADD CONSTRAINT "approved_guidance_id_fkey" FOREIGN KEY ("id") REFERENCES "entities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;



-- AddForeignKey
ALTER TABLE "guidance_rules" ADD CONSTRAINT "guidance_rules_id_fkey" FOREIGN KEY ("id") REFERENCES "entities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;



-- AddForeignKey
ALTER TABLE "guidance_evaluations" ADD CONSTRAINT "guidance_evaluations_id_fkey" FOREIGN KEY ("id") REFERENCES "entities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;



-- AddForeignKey
ALTER TABLE "guidance_evaluations" ADD CONSTRAINT "guidance_evaluations_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;



-- AddForeignKey
ALTER TABLE "guidance_evaluations" ADD CONSTRAINT "guidance_evaluations_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "reports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;



-- AddForeignKey
ALTER TABLE "guidance_choices" ADD CONSTRAINT "guidance_choices_id_fkey" FOREIGN KEY ("id") REFERENCES "entities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;



-- AddForeignKey
ALTER TABLE "guidance_choices" ADD CONSTRAINT "guidance_choices_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;



-- AddForeignKey
ALTER TABLE "guidance_choices" ADD CONSTRAINT "guidance_choices_guidance_id_fkey" FOREIGN KEY ("guidance_id") REFERENCES "guidance_evaluations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;



-- AddForeignKey
ALTER TABLE "seed_markers" ADD CONSTRAINT "seed_markers_id_fkey" FOREIGN KEY ("id") REFERENCES "entities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;



-- AddForeignKey
ALTER TABLE "incidents_zone_ids" ADD CONSTRAINT "incidents_zone_ids_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "incidents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;



-- AddForeignKey
ALTER TABLE "incidents_zone_ids" ADD CONSTRAINT "incidents_zone_ids_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "zones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;



-- AddForeignKey
ALTER TABLE "incident_publications_zone_ids" ADD CONSTRAINT "incident_publications_zone_ids_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "incident_publications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;



-- AddForeignKey
ALTER TABLE "incident_publications_zone_ids" ADD CONSTRAINT "incident_publications_zone_ids_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "zones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;



-- AddForeignKey
ALTER TABLE "advisories_zone_ids" ADD CONSTRAINT "advisories_zone_ids_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "advisories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;



-- AddForeignKey
ALTER TABLE "advisories_zone_ids" ADD CONSTRAINT "advisories_zone_ids_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "zones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;



-- AddForeignKey
ALTER TABLE "advisories_connection_ids" ADD CONSTRAINT "advisories_connection_ids_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "advisories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;



-- AddForeignKey
ALTER TABLE "advisories_connection_ids" ADD CONSTRAINT "advisories_connection_ids_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "service_connections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;



-- AddForeignKey
ALTER TABLE "pickup_sessions_zone_ids" ADD CONSTRAINT "pickup_sessions_zone_ids_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "pickup_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;



-- AddForeignKey
ALTER TABLE "pickup_sessions_zone_ids" ADD CONSTRAINT "pickup_sessions_zone_ids_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "zones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;



-- AddForeignKey
ALTER TABLE "callback_details" ADD CONSTRAINT "callback_details_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "assistance_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;



-- AddForeignKey
ALTER TABLE "inspection_details" ADD CONSTRAINT "inspection_details_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "assistance_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;



-- AddForeignKey
ALTER TABLE "water_support_details" ADD CONSTRAINT "water_support_details_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "assistance_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;



-- AddForeignKey
ALTER TABLE "water_support_details" ADD CONSTRAINT "water_support_details_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "pickup_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;



-- AddForeignKey
ALTER TABLE "credentials" ADD CONSTRAINT "credentials_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;



-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;



-- AddForeignKey
ALTER TABLE "operations" ADD CONSTRAINT "operations_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;



-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "entities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;



-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;



-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;



-- AddForeignKey
ALTER TABLE "stock_sessions" ADD CONSTRAINT "stock_sessions_id_fkey" FOREIGN KEY ("id") REFERENCES "pickup_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;



-- AddForeignKey
ALTER TABLE "allocations" ADD CONSTRAINT "allocations_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "assistance_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;



-- AddForeignKey


ALTER TABLE reports ADD CONSTRAINT report_connection_owner FOREIGN KEY(connection_id,customer_id) REFERENCES service_connections(id,customer_id);
ALTER TABLE assistance_requests ADD CONSTRAINT assistance_report_owner FOREIGN KEY(report_id,customer_id) REFERENCES reports(id,customer_id);
CREATE UNIQUE INDEX active_assistance_prisma ON assistance_requests(customer_id,report_id,type)
 WHERE status IN ('requested','accepted','scheduled','in_progress');
CREATE UNIQUE INDEX affected_assertion_prisma ON reports(customer_id,connection_id,asserted_incident_id) WHERE asserted_incident_id IS NOT NULL;
CREATE UNIQUE INDEX users_email_normalized ON users(lower(email));
ALTER TABLE users ADD CONSTRAINT user_role CHECK(role IN ('customer','staff','admin'));
ALTER TABLE reports ADD CONSTRAINT report_state CHECK(status IN ('received','under_review','in_progress','resolved'));
ALTER TABLE reports ADD CONSTRAINT report_category CHECK(category IN ('outage','low_pressure','leak','water_quality'));
ALTER TABLE assistance_requests ADD CONSTRAINT assistance_state CHECK(status IN ('requested','accepted','scheduled','in_progress','completed','unavailable','cancelled'));
ALTER TABLE assistance_requests ADD CONSTRAINT assistance_type CHECK(type IN ('callback','inspection','water_support'));
ALTER TABLE incidents ADD CONSTRAINT incident_state CHECK(status IN ('investigating','confirmed','work_in_progress','monitoring','resolved'));
ALTER TABLE advisories ADD CONSTRAINT advisory_state CHECK(state IN ('draft','published','lifted'));
ALTER TABLE advisories ADD CONSTRAINT advisory_kind CHECK(kind IN ('scheduled_interruption','boil_water','do_not_drink','do_not_use','general'));
ALTER TABLE pickup_sessions ADD CONSTRAINT pickup_state CHECK(status IN ('open','closed','cancelled') AND starts_at<ends_at);
ALTER TABLE water_support_details ADD CONSTRAINT water_requested_liters CHECK(requested_liters>0 AND requested_liters<=1000000000);


ALTER TABLE reports ADD CONSTRAINT coordinate_pair CHECK((latitude IS NULL AND longitude IS NULL) OR (latitude IS NOT NULL AND longitude IS NOT NULL AND latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180));

ALTER TABLE service_connections ADD CONSTRAINT coordinate_pair CHECK((latitude IS NULL AND longitude IS NULL) OR (latitude IS NOT NULL AND longitude IS NOT NULL AND latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180));

ALTER TABLE pickup_sites ADD CONSTRAINT coordinate_pair CHECK((latitude IS NULL AND longitude IS NULL) OR (latitude IS NOT NULL AND longitude IS NOT NULL AND latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180));

ALTER TABLE reports ADD CONSTRAINT confirmed_zone CHECK(NOT zone_confirmed OR zone_id IS NOT NULL);

ALTER TABLE service_connections ADD CONSTRAINT confirmed_zone CHECK(NOT zone_confirmed OR zone_id IS NOT NULL);

ALTER TABLE suppliers ADD CONSTRAINT positive_version CHECK(version>0);

ALTER TABLE users ADD CONSTRAINT positive_version CHECK(version>0);

ALTER TABLE zones ADD CONSTRAINT positive_version CHECK(version>0);

ALTER TABLE service_connections ADD CONSTRAINT positive_version CHECK(version>0);

ALTER TABLE reports ADD CONSTRAINT positive_version CHECK(version>0);

ALTER TABLE report_messages ADD CONSTRAINT positive_version CHECK(version>0);

ALTER TABLE attachments ADD CONSTRAINT positive_version CHECK(version>0);

ALTER TABLE incidents ADD CONSTRAINT positive_version CHECK(version>0);

ALTER TABLE incident_publications ADD CONSTRAINT positive_version CHECK(version>0);

ALTER TABLE advisories ADD CONSTRAINT positive_version CHECK(version>0);

ALTER TABLE advisory_revisions ADD CONSTRAINT positive_version CHECK(version>0);

ALTER TABLE assistance_requests ADD CONSTRAINT positive_version CHECK(version>0);

ALTER TABLE pickup_sites ADD CONSTRAINT positive_version CHECK(version>0);

ALTER TABLE pickup_sessions ADD CONSTRAINT positive_version CHECK(version>0);

ALTER TABLE approved_guidance ADD CONSTRAINT positive_version CHECK(version>0);

ALTER TABLE guidance_rules ADD CONSTRAINT positive_version CHECK(version>0);

ALTER TABLE guidance_evaluations ADD CONSTRAINT positive_version CHECK(version>0);

ALTER TABLE guidance_choices ADD CONSTRAINT positive_version CHECK(version>0);

ALTER TABLE seed_markers ADD CONSTRAINT positive_version CHECK(version>0);

CREATE VIEW records AS
SELECT r.id,'supplier'::text AS kind,NULL::uuid AS owner_id,NULL::uuid AS parent_id,r.version,jsonb_build_object('name',r.name,'demo',r.demo) AS data,r.stored_at AS created_at,r.changed_at AS updated_at,NULL::double precision AS latitude,NULL::double precision AS longitude FROM suppliers r
UNION ALL
SELECT r.id,'user'::text AS kind,NULL::uuid AS owner_id,NULL::uuid AS parent_id,r.version,jsonb_build_object('email',r.email,'name',r.name,'phone',r.phone,'active',r.active,'role',r.role) AS data,r.stored_at AS created_at,r.changed_at AS updated_at,NULL::double precision AS latitude,NULL::double precision AS longitude FROM users r
UNION ALL
SELECT r.id,'zone'::text AS kind,NULL::uuid AS owner_id,NULL::uuid AS parent_id,r.version,jsonb_build_object('code',r.code,'name',r.name,'boundary',r.boundary,'active',r.active,'demo',r.demo) AS data,r.stored_at AS created_at,r.changed_at AS updated_at,NULL::double precision AS latitude,NULL::double precision AS longitude FROM zones r
UNION ALL
SELECT r.id,'connection'::text AS kind,r.customer_id AS owner_id,NULL::uuid AS parent_id,r.version,jsonb_build_object('customerId',r.customer_id,'reference',r.reference,'address',r.address,'zoneId',r.zone_id,'zoneConfirmed',r.zone_confirmed,'latitude',r.latitude,'longitude',r.longitude) AS data,r.stored_at AS created_at,r.changed_at AS updated_at,r.latitude,r.longitude FROM service_connections r
UNION ALL
SELECT r.id,'report'::text AS kind,r.customer_id AS owner_id,r.connection_id AS parent_id,r.version,jsonb_build_object('customerId',r.customer_id,'connectionId',r.connection_id,'reference',r.reference,'category',r.category,'description',r.description,'noticedAt',to_char(r.noticed_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),'submittedAt',to_char(r.submitted_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),'status',r.status,'address',r.address,'locationSource',r.location_source,'latitude',r.latitude,'longitude',r.longitude,'accuracy',r.accuracy,'locationConfirmed',r.location_confirmed,'zoneId',r.zone_id,'zoneConfirmed',r.zone_confirmed,'locationReview',r.location_review,'priority',r.priority,'priorityReason',r.priority_reason,'ownerId',r.owner_id,'incidentId',r.incident_id,'assertedIncidentId',r.asserted_incident_id,'closureOutcome',r.closure_outcome,'closureReason',r.closure_reason,'firstRespondedAt',to_char(r.first_responded_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),'firstResolvedAt',to_char(r.first_resolved_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),'answers',r.answers) AS data,r.stored_at AS created_at,r.changed_at AS updated_at,r.latitude,r.longitude FROM reports r
UNION ALL
SELECT r.id,'message'::text AS kind,NULL::uuid AS owner_id,r.report_id AS parent_id,r.version,jsonb_build_object('reportId',r.report_id,'text',r.text,'authorId',r.author_id,'authorRole',r.author_role,'createdAt',to_char(r.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')) AS data,r.stored_at AS created_at,r.changed_at AS updated_at,NULL::double precision AS latitude,NULL::double precision AS longitude FROM report_messages r
UNION ALL
SELECT r.id,'attachment'::text AS kind,(SELECT customer_id FROM reports WHERE id=r.report_id) AS owner_id,r.report_id AS parent_id,r.version,jsonb_build_object('reportId',r.report_id,'filename',r.filename,'mediaType',r.media_type,'byteSize',r.byte_size,'createdAt',to_char(r.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')) AS data,r.stored_at AS created_at,r.changed_at AS updated_at,NULL::double precision AS latitude,NULL::double precision AS longitude FROM attachments r
UNION ALL
SELECT r.id,'incident'::text AS kind,NULL::uuid AS owner_id,NULL::uuid AS parent_id,r.version,jsonb_build_object('category',r.category,'summary',r.summary,'status',r.status,'ownerId',r.owner_id,'area',r.area,'geometry',r.geometry,'restorationAt',to_char(r.restoration_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),'estimatedAffected',r.estimated_affected,'estimateBasis',r.estimate_basis,'estimateUpdatedAt',to_char(r.estimate_updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),'demo',r.demo,'createdAt',to_char(r.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),'zoneIds',COALESCE((SELECT jsonb_agg(target_id ORDER BY position) FROM incidents_zone_ids j WHERE j.entity_id=r.id),'[]'::jsonb)) AS data,r.stored_at AS created_at,r.changed_at AS updated_at,NULL::double precision AS latitude,NULL::double precision AS longitude FROM incidents r
UNION ALL
SELECT r.id,'incident_update'::text AS kind,NULL::uuid AS owner_id,r.incident_id AS parent_id,r.version,jsonb_build_object('incidentId',r.incident_id,'category',r.category,'summary',r.summary,'status',r.status,'progress',r.progress,'area',r.area,'restorationAt',to_char(r.restoration_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),'geometry',r.geometry,'publishedAt',to_char(r.published_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),'demo',r.demo,'zoneIds',COALESCE((SELECT jsonb_agg(target_id ORDER BY position) FROM incident_publications_zone_ids j WHERE j.entity_id=r.id),'[]'::jsonb)) AS data,r.stored_at AS created_at,r.changed_at AS updated_at,NULL::double precision AS latitude,NULL::double precision AS longitude FROM incident_publications r
UNION ALL
SELECT r.id,'advisory'::text AS kind,NULL::uuid AS owner_id,NULL::uuid AS parent_id,r.version,jsonb_build_object('kind',r.kind,'title',r.title,'text',r.text,'source',r.source,'geometry',r.geometry,'startsAt',to_char(r.starts_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),'endsAt',to_char(r.ends_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),'state',r.state,'publishedAt',to_char(r.published_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),'liftedAt',to_char(r.lifted_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),'liftReason',r.lift_reason,'demo',r.demo,'updatedAt',to_char(r.updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),'zoneIds',COALESCE((SELECT jsonb_agg(target_id ORDER BY position) FROM advisories_zone_ids j WHERE j.entity_id=r.id),'[]'::jsonb),'connectionIds',COALESCE((SELECT jsonb_agg(target_id ORDER BY position) FROM advisories_connection_ids j WHERE j.entity_id=r.id),'[]'::jsonb)) AS data,r.stored_at AS created_at,r.changed_at AS updated_at,NULL::double precision AS latitude,NULL::double precision AS longitude FROM advisories r
UNION ALL
SELECT r.id,'advisory_revision'::text AS kind,NULL::uuid AS owner_id,r.advisory_id AS parent_id,r.version,jsonb_build_object('advisoryId',r.advisory_id,'snapshot',r.snapshot,'action',r.action,'createdAt',to_char(r.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')) ||jsonb_build_object('version',r.version) AS data,r.stored_at AS created_at,r.changed_at AS updated_at,NULL::double precision AS latitude,NULL::double precision AS longitude FROM advisory_revisions r
UNION ALL
SELECT r.id,'assistance'::text AS kind,r.customer_id AS owner_id,r.report_id AS parent_id,r.version,jsonb_build_object('customerId',r.customer_id,'reportId',r.report_id,'incidentId',r.incident_id,'reference',r.reference,'type',r.type,'status',r.status,'ownerId',r.owner_id,'appointmentAt',to_char(r.appointment_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),'outcome',r.outcome,'nextSteps',r.next_steps,'reason',r.reason,'startedAt',to_char(r.started_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),'createdAt',to_char(r.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),'updatedAt',to_char(r.updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),'details',CASE r.type WHEN 'callback' THEN (SELECT jsonb_strip_nulls(jsonb_build_object('question',question,'contactMethod',contact_method,'contactNumber',contact_number,'preferredWindow',preferred_window)) FROM callback_details d WHERE d.request_id=r.id) WHEN 'inspection' THEN (SELECT jsonb_strip_nulls(jsonb_build_object('issueDetails',issue_details,'siteAddress',site_address,'preferredWindow',preferred_window,'accessInstructions',access_instructions)) FROM inspection_details d WHERE d.request_id=r.id) ELSE (SELECT jsonb_build_object('requestedLiters',requested_liters::text,'sessionId',session_id,'notes',notes) FROM water_support_details d WHERE d.request_id=r.id) END) AS data,r.stored_at AS created_at,r.changed_at AS updated_at,NULL::double precision AS latitude,NULL::double precision AS longitude FROM assistance_requests r
UNION ALL
SELECT r.id,'site'::text AS kind,NULL::uuid AS owner_id,NULL::uuid AS parent_id,r.version,jsonb_build_object('name',r.name,'address',r.address,'instructions',r.instructions,'latitude',r.latitude,'longitude',r.longitude,'active',r.active,'demo',r.demo) AS data,r.stored_at AS created_at,r.changed_at AS updated_at,r.latitude,r.longitude FROM pickup_sites r
UNION ALL
SELECT r.id,'pickup_session'::text AS kind,NULL::uuid AS owner_id,r.site_id AS parent_id,r.version,jsonb_build_object('siteId',r.site_id,'startsAt',to_char(r.starts_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),'endsAt',to_char(r.ends_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),'status',r.status,'instructions',r.instructions,'demo',r.demo,'updatedAt',to_char(r.updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),'zoneIds',COALESCE((SELECT jsonb_agg(target_id ORDER BY position) FROM pickup_sessions_zone_ids j WHERE j.entity_id=r.id),'[]'::jsonb)) AS data,r.stored_at AS created_at,r.changed_at AS updated_at,NULL::double precision AS latitude,NULL::double precision AS longitude FROM pickup_sessions r
UNION ALL
SELECT r.id,'approved_guidance'::text AS kind,NULL::uuid AS owner_id,NULL::uuid AS parent_id,r.version,jsonb_build_object('kind',r.kind,'text',r.text,'source',r.source,'createdAt',to_char(r.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')) ||jsonb_build_object('version',r.version) AS data,r.stored_at AS created_at,r.changed_at AS updated_at,NULL::double precision AS latitude,NULL::double precision AS longitude FROM approved_guidance r
UNION ALL
SELECT r.id,'rule'::text AS kind,NULL::uuid AS owner_id,NULL::uuid AS parent_id,r.version,jsonb_build_object('active',r.active,'contactText',r.contact_text,'inspectionText',r.inspection_text,'waterText',r.water_text,'createdAt',to_char(r.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')) ||jsonb_build_object('version',r.version) AS data,r.stored_at AS created_at,r.changed_at AS updated_at,NULL::double precision AS latitude,NULL::double precision AS longitude FROM guidance_rules r
UNION ALL
SELECT r.id,'guidance'::text AS kind,r.customer_id AS owner_id,r.report_id AS parent_id,r.version,jsonb_build_object('customerId',r.customer_id,'reportId',r.report_id,'evaluatedAt',to_char(r.evaluated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),'ruleVersion',r.rule_version,'current',r.current,'uncertainty',r.uncertainty,'questions',r.questions,'cards',r.cards,'alternatives',r.alternatives,'sourceSignature',r.source_signature,'evidence',r.evidence,'answers',r.answers) AS data,r.stored_at AS created_at,r.changed_at AS updated_at,NULL::double precision AS latitude,NULL::double precision AS longitude FROM guidance_evaluations r
UNION ALL
SELECT r.id,'guidance_choice'::text AS kind,r.customer_id AS owner_id,r.guidance_id AS parent_id,r.version,jsonb_build_object('guidanceId',r.guidance_id,'action',r.action,'createdAt',to_char(r.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),'customerId',r.customer_id) AS data,r.stored_at AS created_at,r.changed_at AS updated_at,NULL::double precision AS latitude,NULL::double precision AS longitude FROM guidance_choices r
UNION ALL
SELECT r.id,'seed_marker'::text AS kind,NULL::uuid AS owner_id,NULL::uuid AS parent_id,r.version,jsonb_build_object('fixture',r.fixture,'appliedAt',to_char(r.applied_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),'demo',r.demo) AS data,r.stored_at AS created_at,r.changed_at AS updated_at,NULL::double precision AS latitude,NULL::double precision AS longitude FROM seed_markers r;

-- Keep trigger-enforced history and stock safety around typed tables.
CREATE FUNCTION reject_domain_history_changes() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'Immutable domain history'; END $$;


CREATE TRIGGER immutable_domain BEFORE UPDATE OR DELETE ON incident_publications FOR EACH ROW EXECUTE FUNCTION reject_domain_history_changes();

CREATE TRIGGER immutable_domain BEFORE UPDATE OR DELETE ON advisory_revisions FOR EACH ROW EXECUTE FUNCTION reject_domain_history_changes();

CREATE TRIGGER immutable_domain BEFORE UPDATE OR DELETE ON guidance_evaluations FOR EACH ROW EXECUTE FUNCTION reject_domain_history_changes();

CREATE TRIGGER immutable_domain BEFORE UPDATE OR DELETE ON guidance_choices FOR EACH ROW EXECUTE FUNCTION reject_domain_history_changes();

CREATE TRIGGER immutable_domain BEFORE UPDATE OR DELETE ON approved_guidance FOR EACH ROW EXECUTE FUNCTION reject_domain_history_changes();

CREATE TRIGGER immutable_domain BEFORE UPDATE OR DELETE ON guidance_rules FOR EACH ROW EXECUTE FUNCTION reject_domain_history_changes();

CREATE TRIGGER immutable_domain BEFORE UPDATE OR DELETE ON report_messages FOR EACH ROW EXECUTE FUNCTION reject_domain_history_changes();

CREATE TRIGGER immutable_domain BEFORE UPDATE OR DELETE ON attachments FOR EACH ROW EXECUTE FUNCTION reject_domain_history_changes();

CREATE TRIGGER frozen_legacy_records BEFORE INSERT OR UPDATE OR DELETE ON legacy_records FOR EACH ROW EXECUTE FUNCTION reject_domain_history_changes();

CREATE OR REPLACE FUNCTION allocation_invariants() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM assistance_requests a JOIN water_support_details w ON w.request_id=a.id WHERE a.id=NEW.request_id AND a.type='water_support' AND w.session_id=NEW.session_id) THEN RAISE EXCEPTION 'Invalid allocation request/session' USING ERRCODE='23514'; END IF;
 IF TG_OP='INSERT' AND NEW.state<>'reserved' THEN RAISE EXCEPTION 'Allocation must begin reserved' USING ERRCODE='23514'; END IF;
 IF TG_OP='UPDATE' AND (OLD.state<>'reserved' OR NEW.state NOT IN ('collected','released') OR NEW.request_id<>OLD.request_id OR NEW.session_id<>OLD.session_id OR NEW.liters<>OLD.liters OR NEW.reference<>OLD.reference OR NEW.reserved_at<>OLD.reserved_at) THEN RAISE EXCEPTION 'Invalid allocation transition' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE FUNCTION validate_domain_owner() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_ARGV[0]='customer' THEN IF NOT EXISTS(SELECT 1 FROM users WHERE id=NEW.customer_id AND role='customer') THEN RAISE EXCEPTION 'Invalid customer owner' USING ERRCODE='23503'; END IF; END IF;
 IF TG_ARGV[0]='staff' THEN IF NEW.owner_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM users WHERE id=NEW.owner_id AND role IN ('staff','admin')) THEN RAISE EXCEPTION 'Invalid staff owner' USING ERRCODE='23503'; END IF; END IF;
 RETURN NEW;
END $$;

CREATE TRIGGER customer_owner BEFORE INSERT OR UPDATE ON service_connections FOR EACH ROW EXECUTE FUNCTION validate_domain_owner('customer');

CREATE TRIGGER customer_owner BEFORE INSERT OR UPDATE ON reports FOR EACH ROW EXECUTE FUNCTION validate_domain_owner('customer');

CREATE TRIGGER customer_owner BEFORE INSERT OR UPDATE ON assistance_requests FOR EACH ROW EXECUTE FUNCTION validate_domain_owner('customer');

CREATE TRIGGER staff_owner BEFORE INSERT OR UPDATE ON reports FOR EACH ROW EXECUTE FUNCTION validate_domain_owner('staff');

CREATE TRIGGER staff_owner BEFORE INSERT OR UPDATE ON incidents FOR EACH ROW EXECUTE FUNCTION validate_domain_owner('staff');

CREATE TRIGGER staff_owner BEFORE INSERT OR UPDATE ON assistance_requests FOR EACH ROW EXECUTE FUNCTION validate_domain_owner('staff');

DO $$ BEGIN IF (SELECT count(*) FROM legacy_records)<>(SELECT count(*) FROM records) THEN RAISE EXCEPTION 'Domain migration row count mismatch'; END IF; END $$;

-- Publication target rows are part of the immutable published snapshot.
CREATE FUNCTION validate_publication_target_insert() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM incident_publications WHERE id=NEW.entity_id AND xmin=(pg_current_xact_id()::text)::xid) THEN
  RAISE EXCEPTION 'Published targets cannot be extended after publication';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER immutable_publication_targets BEFORE UPDATE OR DELETE ON incident_publications_zone_ids FOR EACH ROW EXECUTE FUNCTION reject_domain_history_changes();
CREATE TRIGGER publication_target_insert BEFORE INSERT ON incident_publications_zone_ids FOR EACH ROW EXECUTE FUNCTION validate_publication_target_insert();
CREATE FUNCTION validate_assistance_detail_type() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM assistance_requests WHERE id=NEW.request_id AND type=TG_ARGV[0]) THEN
  RAISE EXCEPTION 'Invalid assistance detail type' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER callback_detail_type BEFORE INSERT OR UPDATE ON callback_details FOR EACH ROW EXECUTE FUNCTION validate_assistance_detail_type('callback');
CREATE TRIGGER inspection_detail_type BEFORE INSERT OR UPDATE ON inspection_details FOR EACH ROW EXECUTE FUNCTION validate_assistance_detail_type('inspection');
CREATE TRIGGER water_detail_type BEFORE INSERT OR UPDATE ON water_support_details FOR EACH ROW EXECUTE FUNCTION validate_assistance_detail_type('water_support');

COMMIT;