SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
-- SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: tiger; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA IF NOT EXISTS tiger;


--
-- Name: tiger_data; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA IF NOT EXISTS tiger_data;


--
-- Name: topology; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA IF NOT EXISTS topology;


--
-- Name: SCHEMA topology; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA topology IS 'PostGIS Topology schema';


--
-- Name: fuzzystrmatch; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS fuzzystrmatch WITH SCHEMA public;


--
-- Name: EXTENSION fuzzystrmatch; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION fuzzystrmatch IS 'determine similarities and distance between strings';


--
-- Name: postgis; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;


--
-- Name: EXTENSION postgis; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION postgis IS 'PostGIS geometry and geography spatial types and functions';


--
-- Name: postgis_tiger_geocoder; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis_tiger_geocoder WITH SCHEMA tiger;


--
-- Name: EXTENSION postgis_tiger_geocoder; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION postgis_tiger_geocoder IS 'PostGIS tiger geocoder and reverse geocoder';


--
-- Name: postgis_topology; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis_topology WITH SCHEMA topology;


--
-- Name: EXTENSION postgis_topology; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION postgis_topology IS 'PostGIS topology spatial types and functions';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: alerts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.alerts (
    id bigint NOT NULL,
    work_session_id bigint NOT NULL,
    safety_log_id bigint,
    handled_by_user_id bigint,
    status integer DEFAULT 0 NOT NULL,
    resolved_at timestamp(6) without time zone,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL,
    severity integer DEFAULT 0 NOT NULL,
    alert_type integer DEFAULT 0 NOT NULL
);


--
-- Name: alerts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.alerts_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: alerts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.alerts_id_seq OWNED BY public.alerts.id;


--
-- Name: ar_internal_metadata; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ar_internal_metadata (
    key character varying NOT NULL,
    value character varying,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
);


--
-- Name: invitations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invitations (
    id bigint NOT NULL,
    inviter_id bigint NOT NULL,
    invited_email character varying NOT NULL,
    token character varying NOT NULL,
    role integer NOT NULL,
    expires_at timestamp(6) without time zone,
    accepted_at timestamp(6) without time zone,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL,
    organization_id bigint
);


--
-- Name: COLUMN invitations.role; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.invitations.role IS '付与されるロール（worker/admin）';


--
-- Name: invitations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.invitations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: invitations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.invitations_id_seq OWNED BY public.invitations.id;


--
-- Name: memberships; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.memberships (
    id bigint NOT NULL,
    organization_id bigint NOT NULL,
    user_id bigint NOT NULL,
    role integer DEFAULT 0 NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
);


--
-- Name: COLUMN memberships.role; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.memberships.role IS '0=worker, 1=admin';


--
-- Name: memberships_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.memberships_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: memberships_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.memberships_id_seq OWNED BY public.memberships.id;


--
-- Name: organizations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.organizations (
    id bigint NOT NULL,
    name character varying NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
);


--
-- Name: organizations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.organizations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: organizations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.organizations_id_seq OWNED BY public.organizations.id;


--
-- Name: risk_assessments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.risk_assessments (
    id bigint NOT NULL,
    safety_log_id bigint NOT NULL,
    score integer DEFAULT 0 NOT NULL,
    level integer DEFAULT 0 NOT NULL,
    details jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
);


--
-- Name: risk_assessments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.risk_assessments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: risk_assessments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.risk_assessments_id_seq OWNED BY public.risk_assessments.id;


--
-- Name: safety_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.safety_logs (
    id bigint NOT NULL,
    work_session_id bigint NOT NULL,
    logged_at timestamp(6) without time zone NOT NULL,
    battery_level integer NOT NULL,
    trigger_type integer DEFAULT 0 NOT NULL,
    is_offline_sync boolean DEFAULT false NOT NULL,
    gps_accuracy double precision,
    weather_temp double precision,
    weather_condition character varying,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL,
    lonlat public.geography(Point,4326) NOT NULL,
    CONSTRAINT battery_level_range CHECK (((battery_level >= 0) AND (battery_level <= 100)))
);


--
-- Name: COLUMN safety_logs.trigger_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.safety_logs.trigger_type IS '0=heartbeat, 1=sos, 2=check_in';


--
-- Name: safety_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.safety_logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: safety_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.safety_logs_id_seq OWNED BY public.safety_logs.id;


--
-- Name: schema_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schema_migrations (
    version character varying NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id bigint NOT NULL,
    provider character varying DEFAULT 'email'::character varying NOT NULL,
    uid character varying DEFAULT ''::character varying NOT NULL,
    encrypted_password character varying DEFAULT ''::character varying NOT NULL,
    reset_password_token character varying,
    reset_password_sent_at timestamp(6) without time zone,
    allow_password_change boolean DEFAULT false,
    remember_created_at timestamp(6) without time zone,
    name character varying,
    phone_number character varying,
    avatar_url character varying,
    email character varying,
    tokens json,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL,
    settings jsonb DEFAULT '{}'::jsonb NOT NULL,
    home_location public.geography(Point,4326),
    home_radius integer DEFAULT 50 NOT NULL,
    onboarded boolean DEFAULT false NOT NULL
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: work_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.work_sessions (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    organization_id bigint NOT NULL,
    started_at timestamp(6) without time zone NOT NULL,
    ended_at timestamp(6) without time zone,
    status integer DEFAULT 0 NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL,
    active_monitoring_jid character varying,
    scheduled_at timestamp(6) without time zone,
    created_by_user_id bigint
);


--
-- Name: work_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.work_sessions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: work_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.work_sessions_id_seq OWNED BY public.work_sessions.id;


--
-- Name: alerts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alerts ALTER COLUMN id SET DEFAULT nextval('public.alerts_id_seq'::regclass);


--
-- Name: invitations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invitations ALTER COLUMN id SET DEFAULT nextval('public.invitations_id_seq'::regclass);


--
-- Name: memberships id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.memberships ALTER COLUMN id SET DEFAULT nextval('public.memberships_id_seq'::regclass);


--
-- Name: organizations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizations ALTER COLUMN id SET DEFAULT nextval('public.organizations_id_seq'::regclass);


--
-- Name: risk_assessments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.risk_assessments ALTER COLUMN id SET DEFAULT nextval('public.risk_assessments_id_seq'::regclass);


--
-- Name: safety_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.safety_logs ALTER COLUMN id SET DEFAULT nextval('public.safety_logs_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: work_sessions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_sessions ALTER COLUMN id SET DEFAULT nextval('public.work_sessions_id_seq'::regclass);


--
-- Name: alerts alerts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alerts
    ADD CONSTRAINT alerts_pkey PRIMARY KEY (id);


--
-- Name: ar_internal_metadata ar_internal_metadata_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ar_internal_metadata
    ADD CONSTRAINT ar_internal_metadata_pkey PRIMARY KEY (key);


--
-- Name: invitations invitations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invitations
    ADD CONSTRAINT invitations_pkey PRIMARY KEY (id);


--
-- Name: memberships memberships_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.memberships
    ADD CONSTRAINT memberships_pkey PRIMARY KEY (id);


--
-- Name: organizations organizations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_pkey PRIMARY KEY (id);


--
-- Name: risk_assessments risk_assessments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.risk_assessments
    ADD CONSTRAINT risk_assessments_pkey PRIMARY KEY (id);


--
-- Name: safety_logs safety_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.safety_logs
    ADD CONSTRAINT safety_logs_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: work_sessions work_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_sessions
    ADD CONSTRAINT work_sessions_pkey PRIMARY KEY (id);


--
-- Name: index_alerts_on_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_alerts_on_created_at ON public.alerts USING btree (created_at);


--
-- Name: index_alerts_on_handled_by_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_alerts_on_handled_by_user_id ON public.alerts USING btree (handled_by_user_id);


--
-- Name: index_alerts_on_safety_log_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_alerts_on_safety_log_id ON public.alerts USING btree (safety_log_id);


--
-- Name: index_alerts_on_severity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_alerts_on_severity ON public.alerts USING btree (severity);


--
-- Name: index_alerts_on_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_alerts_on_status ON public.alerts USING btree (status);


--
-- Name: index_alerts_on_work_session_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_alerts_on_work_session_id ON public.alerts USING btree (work_session_id);


--
-- Name: index_invitations_on_inviter_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_invitations_on_inviter_id ON public.invitations USING btree (inviter_id);


--
-- Name: index_invitations_on_organization_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_invitations_on_organization_id ON public.invitations USING btree (organization_id);


--
-- Name: index_invitations_on_token; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_invitations_on_token ON public.invitations USING btree (token);


--
-- Name: index_memberships_on_organization_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_memberships_on_organization_id ON public.memberships USING btree (organization_id);


--
-- Name: index_memberships_on_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_memberships_on_user_id ON public.memberships USING btree (user_id);


--
-- Name: index_memberships_on_user_id_and_organization_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_memberships_on_user_id_and_organization_id ON public.memberships USING btree (user_id, organization_id);


--
-- Name: index_risk_assessments_on_safety_log_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_risk_assessments_on_safety_log_id ON public.risk_assessments USING btree (safety_log_id);


--
-- Name: index_safety_logs_on_lonlat; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_safety_logs_on_lonlat ON public.safety_logs USING gist (lonlat);


--
-- Name: index_safety_logs_on_work_session_id_and_logged_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_safety_logs_on_work_session_id_and_logged_at ON public.safety_logs USING btree (work_session_id, logged_at DESC);


--
-- Name: index_users_on_email; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_users_on_email ON public.users USING btree (email);


--
-- Name: index_users_on_home_location; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_users_on_home_location ON public.users USING gist (home_location);


--
-- Name: index_users_on_onboarded; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_users_on_onboarded ON public.users USING btree (onboarded);


--
-- Name: index_users_on_reset_password_token; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_users_on_reset_password_token ON public.users USING btree (reset_password_token);


--
-- Name: index_users_on_uid_and_provider; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_users_on_uid_and_provider ON public.users USING btree (uid, provider);


--
-- Name: index_work_sessions_on_active_monitoring_jid; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_work_sessions_on_active_monitoring_jid ON public.work_sessions USING btree (active_monitoring_jid);


--
-- Name: index_work_sessions_on_created_by_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_work_sessions_on_created_by_user_id ON public.work_sessions USING btree (created_by_user_id);


--
-- Name: index_work_sessions_on_organization_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_work_sessions_on_organization_id ON public.work_sessions USING btree (organization_id);


--
-- Name: index_work_sessions_on_scheduled_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_work_sessions_on_scheduled_at ON public.work_sessions USING btree (scheduled_at);


--
-- Name: index_work_sessions_on_started_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_work_sessions_on_started_at ON public.work_sessions USING btree (started_at);


--
-- Name: index_work_sessions_on_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_work_sessions_on_user_id ON public.work_sessions USING btree (user_id);


--
-- Name: invitations fk_rails_0fe4c14f0e; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invitations
    ADD CONSTRAINT fk_rails_0fe4c14f0e FOREIGN KEY (organization_id) REFERENCES public.organizations(id);


--
-- Name: work_sessions fk_rails_3c6162c0f1; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_sessions
    ADD CONSTRAINT fk_rails_3c6162c0f1 FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: safety_logs fk_rails_4ccad19169; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.safety_logs
    ADD CONSTRAINT fk_rails_4ccad19169 FOREIGN KEY (work_session_id) REFERENCES public.work_sessions(id);


--
-- Name: alerts fk_rails_5de5ae72d1; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alerts
    ADD CONSTRAINT fk_rails_5de5ae72d1 FOREIGN KEY (handled_by_user_id) REFERENCES public.users(id);


--
-- Name: alerts fk_rails_6293374c83; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alerts
    ADD CONSTRAINT fk_rails_6293374c83 FOREIGN KEY (work_session_id) REFERENCES public.work_sessions(id);


--
-- Name: memberships fk_rails_64267aab58; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.memberships
    ADD CONSTRAINT fk_rails_64267aab58 FOREIGN KEY (organization_id) REFERENCES public.organizations(id);


--
-- Name: alerts fk_rails_65a79e646f; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alerts
    ADD CONSTRAINT fk_rails_65a79e646f FOREIGN KEY (safety_log_id) REFERENCES public.safety_logs(id);


--
-- Name: invitations fk_rails_7480156672; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invitations
    ADD CONSTRAINT fk_rails_7480156672 FOREIGN KEY (inviter_id) REFERENCES public.users(id);


--
-- Name: risk_assessments fk_rails_8c63bb3a09; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.risk_assessments
    ADD CONSTRAINT fk_rails_8c63bb3a09 FOREIGN KEY (safety_log_id) REFERENCES public.safety_logs(id);


--
-- Name: memberships fk_rails_99326fb65d; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.memberships
    ADD CONSTRAINT fk_rails_99326fb65d FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: work_sessions fk_rails_b4b23f5a90; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_sessions
    ADD CONSTRAINT fk_rails_b4b23f5a90 FOREIGN KEY (organization_id) REFERENCES public.organizations(id);


--
-- Name: work_sessions fk_rails_c93a3a131e; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_sessions
    ADD CONSTRAINT fk_rails_c93a3a131e FOREIGN KEY (created_by_user_id) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

SET search_path TO "$user", public, topology, tiger;

INSERT INTO "schema_migrations" (version) VALUES
('20251231141114'),
('20251230100109'),
('20251229184728'),
('20251229184201'),
('20251228203224'),
('20251226134358'),
('20251226080843'),
('20251225072559'),
('20251225072458'),
('20251224070718'),
('20251223133448'),
('20251221080452'),
('20251220124602'),
('20251220124601'),
('20251214070214'),
('20251214070206'),
('20251214070158'),
('20251213071341'),
('20251202041352'),
('20251201063103');
