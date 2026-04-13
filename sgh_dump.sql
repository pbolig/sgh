--
-- PostgreSQL database dump
--

\restrict pGrjaEmMC6vMzbX04BbP8DWXlhYhuM5QVx0QZJl4D6avMKkCMPvj1jsbybzV2hN

-- Dumped from database version 15.17
-- Dumped by pg_dump version 15.17

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: asignaciones; Type: TABLE; Schema: public; Owner: horarios_user
--

CREATE TABLE public.asignaciones (
    id integer NOT NULL,
    departamento_id integer,
    aula_id integer,
    modulo_id integer,
    dia_semana character varying,
    comision_id integer,
    docente_id integer,
    observaciones text,
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    updated_by character varying
);


ALTER TABLE public.asignaciones OWNER TO horarios_user;

--
-- Name: asignaciones_id_seq; Type: SEQUENCE; Schema: public; Owner: horarios_user
--

CREATE SEQUENCE public.asignaciones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.asignaciones_id_seq OWNER TO horarios_user;

--
-- Name: asignaciones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: horarios_user
--

ALTER SEQUENCE public.asignaciones_id_seq OWNED BY public.asignaciones.id;


--
-- Name: aula_departamento; Type: TABLE; Schema: public; Owner: horarios_user
--

CREATE TABLE public.aula_departamento (
    aula_id integer NOT NULL,
    departamento_id integer NOT NULL
);


ALTER TABLE public.aula_departamento OWNER TO horarios_user;

--
-- Name: aulas; Type: TABLE; Schema: public; Owner: horarios_user
--

CREATE TABLE public.aulas (
    id integer NOT NULL,
    departamento_id integer,
    nombre character varying,
    capacidad integer,
    activo integer,
    created_at timestamp without time zone,
    institucion_id integer
);


ALTER TABLE public.aulas OWNER TO horarios_user;

--
-- Name: aulas_id_seq; Type: SEQUENCE; Schema: public; Owner: horarios_user
--

CREATE SEQUENCE public.aulas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.aulas_id_seq OWNER TO horarios_user;

--
-- Name: aulas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: horarios_user
--

ALTER SEQUENCE public.aulas_id_seq OWNED BY public.aulas.id;


--
-- Name: calendario_categorias; Type: TABLE; Schema: public; Owner: horarios_user
--

CREATE TABLE public.calendario_categorias (
    id integer NOT NULL,
    calendario_id integer,
    nombre character varying,
    color character varying
);


ALTER TABLE public.calendario_categorias OWNER TO horarios_user;

--
-- Name: calendario_categorias_id_seq; Type: SEQUENCE; Schema: public; Owner: horarios_user
--

CREATE SEQUENCE public.calendario_categorias_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.calendario_categorias_id_seq OWNER TO horarios_user;

--
-- Name: calendario_categorias_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: horarios_user
--

ALTER SEQUENCE public.calendario_categorias_id_seq OWNED BY public.calendario_categorias.id;


--
-- Name: calendario_eventos; Type: TABLE; Schema: public; Owner: horarios_user
--

CREATE TABLE public.calendario_eventos (
    id integer NOT NULL,
    calendario_id integer,
    fecha character varying,
    categoria_id integer,
    descripcion text,
    es_privado boolean DEFAULT false,
    es_no_laborable boolean DEFAULT false,
    departamento_id integer
);


ALTER TABLE public.calendario_eventos OWNER TO horarios_user;

--
-- Name: calendario_eventos_id_seq; Type: SEQUENCE; Schema: public; Owner: horarios_user
--

CREATE SEQUENCE public.calendario_eventos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.calendario_eventos_id_seq OWNER TO horarios_user;

--
-- Name: calendario_eventos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: horarios_user
--

ALTER SEQUENCE public.calendario_eventos_id_seq OWNED BY public.calendario_eventos.id;


--
-- Name: calendarios; Type: TABLE; Schema: public; Owner: horarios_user
--

CREATE TABLE public.calendarios (
    id integer NOT NULL,
    nombre character varying,
    descripcion text,
    created_at timestamp without time zone,
    departamento_id integer
);


ALTER TABLE public.calendarios OWNER TO horarios_user;

--
-- Name: calendarios_id_seq; Type: SEQUENCE; Schema: public; Owner: horarios_user
--

CREATE SEQUENCE public.calendarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.calendarios_id_seq OWNER TO horarios_user;

--
-- Name: calendarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: horarios_user
--

ALTER SEQUENCE public.calendarios_id_seq OWNED BY public.calendarios.id;


--
-- Name: cargo_asignaciones; Type: TABLE; Schema: public; Owner: horarios_user
--

CREATE TABLE public.cargo_asignaciones (
    id integer NOT NULL,
    cargo_id integer,
    docente_id integer,
    departamento_id integer,
    horas_lunes double precision,
    horas_martes double precision,
    horas_miercoles double precision,
    horas_jueves double precision,
    horas_viernes double precision,
    horas_sabado double precision,
    horas_domingo double precision,
    total_horas double precision,
    activo integer,
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    hora_inicio character varying,
    hora_fin character varying
);


ALTER TABLE public.cargo_asignaciones OWNER TO horarios_user;

--
-- Name: cargo_asignaciones_id_seq; Type: SEQUENCE; Schema: public; Owner: horarios_user
--

CREATE SEQUENCE public.cargo_asignaciones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.cargo_asignaciones_id_seq OWNER TO horarios_user;

--
-- Name: cargo_asignaciones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: horarios_user
--

ALTER SEQUENCE public.cargo_asignaciones_id_seq OWNED BY public.cargo_asignaciones.id;


--
-- Name: cargo_horarios; Type: TABLE; Schema: public; Owner: horarios_user
--

CREATE TABLE public.cargo_horarios (
    id integer NOT NULL,
    asignacion_id integer,
    dia_semana character varying,
    hora_inicio character varying,
    hora_fin character varying,
    horas double precision,
    aula_id integer,
    comision_id integer,
    modulo_id integer,
    observaciones text
);


ALTER TABLE public.cargo_horarios OWNER TO horarios_user;

--
-- Name: cargo_horarios_id_seq; Type: SEQUENCE; Schema: public; Owner: horarios_user
--

CREATE SEQUENCE public.cargo_horarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.cargo_horarios_id_seq OWNER TO horarios_user;

--
-- Name: cargo_horarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: horarios_user
--

ALTER SEQUENCE public.cargo_horarios_id_seq OWNED BY public.cargo_horarios.id;


--
-- Name: cargos; Type: TABLE; Schema: public; Owner: horarios_user
--

CREATE TABLE public.cargos (
    id integer NOT NULL,
    nombre character varying,
    uso_multiple text,
    activo integer,
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    departamento_id integer
);


ALTER TABLE public.cargos OWNER TO horarios_user;

--
-- Name: cargos_id_seq; Type: SEQUENCE; Schema: public; Owner: horarios_user
--

CREATE SEQUENCE public.cargos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.cargos_id_seq OWNER TO horarios_user;

--
-- Name: cargos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: horarios_user
--

ALTER SEQUENCE public.cargos_id_seq OWNED BY public.cargos.id;


--
-- Name: comisiones; Type: TABLE; Schema: public; Owner: horarios_user
--

CREATE TABLE public.comisiones (
    id integer NOT NULL,
    codigo character varying,
    materia_id integer,
    turno character varying,
    activo integer,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


ALTER TABLE public.comisiones OWNER TO horarios_user;

--
-- Name: comisiones_id_seq; Type: SEQUENCE; Schema: public; Owner: horarios_user
--

CREATE SEQUENCE public.comisiones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.comisiones_id_seq OWNER TO horarios_user;

--
-- Name: comisiones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: horarios_user
--

ALTER SEQUENCE public.comisiones_id_seq OWNED BY public.comisiones.id;


--
-- Name: config_turnos; Type: TABLE; Schema: public; Owner: horarios_user
--

CREATE TABLE public.config_turnos (
    id integer NOT NULL,
    departamento_id integer NOT NULL,
    turno character varying(50) NOT NULL,
    dia_semana character varying(50) NOT NULL,
    hora_inicio character varying(10) NOT NULL,
    secuencia jsonb NOT NULL
);


ALTER TABLE public.config_turnos OWNER TO horarios_user;

--
-- Name: config_turnos_id_seq; Type: SEQUENCE; Schema: public; Owner: horarios_user
--

CREATE SEQUENCE public.config_turnos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.config_turnos_id_seq OWNER TO horarios_user;

--
-- Name: config_turnos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: horarios_user
--

ALTER SEQUENCE public.config_turnos_id_seq OWNED BY public.config_turnos.id;


--
-- Name: departamentos; Type: TABLE; Schema: public; Owner: horarios_user
--

CREATE TABLE public.departamentos (
    id integer NOT NULL,
    nombre character varying,
    codigo character varying,
    descripcion text,
    activo integer,
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    institucion_id integer
);


ALTER TABLE public.departamentos OWNER TO horarios_user;

--
-- Name: departamentos_id_seq; Type: SEQUENCE; Schema: public; Owner: horarios_user
--

CREATE SEQUENCE public.departamentos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.departamentos_id_seq OWNER TO horarios_user;

--
-- Name: departamentos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: horarios_user
--

ALTER SEQUENCE public.departamentos_id_seq OWNED BY public.departamentos.id;


--
-- Name: departamientos; Type: TABLE; Schema: public; Owner: horarios_user
--

CREATE TABLE public.departamientos (
    id integer NOT NULL,
    nombre character varying,
    codigo character varying,
    descripcion text,
    activo integer,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


ALTER TABLE public.departamientos OWNER TO horarios_user;

--
-- Name: departamientos_id_seq; Type: SEQUENCE; Schema: public; Owner: horarios_user
--

CREATE SEQUENCE public.departamientos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.departamientos_id_seq OWNER TO horarios_user;

--
-- Name: departamientos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: horarios_user
--

ALTER SEQUENCE public.departamientos_id_seq OWNED BY public.departamientos.id;


--
-- Name: docente_departamento; Type: TABLE; Schema: public; Owner: horarios_user
--

CREATE TABLE public.docente_departamento (
    docente_id integer NOT NULL,
    departamento_id integer NOT NULL
);


ALTER TABLE public.docente_departamento OWNER TO horarios_user;

--
-- Name: docente_institucion; Type: TABLE; Schema: public; Owner: horarios_user
--

CREATE TABLE public.docente_institucion (
    docente_id integer NOT NULL,
    institucion_id integer NOT NULL
);


ALTER TABLE public.docente_institucion OWNER TO horarios_user;

--
-- Name: docentes; Type: TABLE; Schema: public; Owner: horarios_user
--

CREATE TABLE public.docentes (
    id integer NOT NULL,
    apellido character varying,
    nombre character varying,
    email character varying,
    telefono character varying,
    activo integer,
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    institucion_id integer
);


ALTER TABLE public.docentes OWNER TO horarios_user;

--
-- Name: docentes_id_seq; Type: SEQUENCE; Schema: public; Owner: horarios_user
--

CREATE SEQUENCE public.docentes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.docentes_id_seq OWNER TO horarios_user;

--
-- Name: docentes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: horarios_user
--

ALTER SEQUENCE public.docentes_id_seq OWNED BY public.docentes.id;


--
-- Name: instituciones; Type: TABLE; Schema: public; Owner: horarios_user
--

CREATE TABLE public.instituciones (
    id integer NOT NULL,
    nombre character varying,
    codigo character varying,
    descripcion text,
    logo_url character varying,
    activo integer,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


ALTER TABLE public.instituciones OWNER TO horarios_user;

--
-- Name: instituciones_id_seq; Type: SEQUENCE; Schema: public; Owner: horarios_user
--

CREATE SEQUENCE public.instituciones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.instituciones_id_seq OWNER TO horarios_user;

--
-- Name: instituciones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: horarios_user
--

ALTER SEQUENCE public.instituciones_id_seq OWNED BY public.instituciones.id;


--
-- Name: materias; Type: TABLE; Schema: public; Owner: horarios_user
--

CREATE TABLE public.materias (
    id integer NOT NULL,
    nombre character varying,
    codigo character varying,
    departamento_id integer,
    activo integer,
    created_at timestamp without time zone,
    codigo_interno character varying,
    carga_horaria_modulos integer DEFAULT 0,
    correlativas text,
    anio integer DEFAULT 1
);


ALTER TABLE public.materias OWNER TO horarios_user;

--
-- Name: materias_id_seq; Type: SEQUENCE; Schema: public; Owner: horarios_user
--

CREATE SEQUENCE public.materias_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.materias_id_seq OWNER TO horarios_user;

--
-- Name: materias_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: horarios_user
--

ALTER SEQUENCE public.materias_id_seq OWNED BY public.materias.id;


--
-- Name: modulos; Type: TABLE; Schema: public; Owner: horarios_user
--

CREATE TABLE public.modulos (
    id integer NOT NULL,
    nombre character varying,
    etiqueta character varying,
    icono character varying
);


ALTER TABLE public.modulos OWNER TO horarios_user;

--
-- Name: modulos_horario; Type: TABLE; Schema: public; Owner: horarios_user
--

CREATE TABLE public.modulos_horario (
    id integer NOT NULL,
    numero integer,
    hora_inicio character varying,
    hora_fin character varying,
    turno character varying,
    activo integer
);


ALTER TABLE public.modulos_horario OWNER TO horarios_user;

--
-- Name: modulos_horario_id_seq; Type: SEQUENCE; Schema: public; Owner: horarios_user
--

CREATE SEQUENCE public.modulos_horario_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.modulos_horario_id_seq OWNER TO horarios_user;

--
-- Name: modulos_horario_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: horarios_user
--

ALTER SEQUENCE public.modulos_horario_id_seq OWNED BY public.modulos_horario.id;


--
-- Name: modulos_id_seq; Type: SEQUENCE; Schema: public; Owner: horarios_user
--

CREATE SEQUENCE public.modulos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.modulos_id_seq OWNER TO horarios_user;

--
-- Name: modulos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: horarios_user
--

ALTER SEQUENCE public.modulos_id_seq OWNED BY public.modulos.id;


--
-- Name: notas_adhesivas; Type: TABLE; Schema: public; Owner: horarios_user
--

CREATE TABLE public.notas_adhesivas (
    id integer NOT NULL,
    calendario_id integer,
    texto text,
    color character varying,
    created_at timestamp without time zone
);


ALTER TABLE public.notas_adhesivas OWNER TO horarios_user;

--
-- Name: notas_adhesivas_id_seq; Type: SEQUENCE; Schema: public; Owner: horarios_user
--

CREATE SEQUENCE public.notas_adhesivas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.notas_adhesivas_id_seq OWNER TO horarios_user;

--
-- Name: notas_adhesivas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: horarios_user
--

ALTER SEQUENCE public.notas_adhesivas_id_seq OWNED BY public.notas_adhesivas.id;


--
-- Name: permisos; Type: TABLE; Schema: public; Owner: horarios_user
--

CREATE TABLE public.permisos (
    id integer NOT NULL,
    rol_id integer,
    modulo_id integer,
    nivel character varying
);


ALTER TABLE public.permisos OWNER TO horarios_user;

--
-- Name: permisos_id_seq; Type: SEQUENCE; Schema: public; Owner: horarios_user
--

CREATE SEQUENCE public.permisos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.permisos_id_seq OWNER TO horarios_user;

--
-- Name: permisos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: horarios_user
--

ALTER SEQUENCE public.permisos_id_seq OWNED BY public.permisos.id;


--
-- Name: planificaciones; Type: TABLE; Schema: public; Owner: horarios_user
--

CREATE TABLE public.planificaciones (
    id integer NOT NULL,
    materia_id integer,
    docente_id integer,
    comision_id integer,
    anio_lectivo integer,
    jurisdiccion character varying,
    instituto character varying,
    carrera character varying,
    anio_cursada character varying,
    modalidad character varying,
    carga_horaria double precision,
    marco_curricular text,
    correlatividades text,
    normativa text,
    unidades text,
    fichas text,
    cronograma text,
    evaluacion text,
    bibliografia text,
    practica_profesionalizante text,
    firmas text,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


ALTER TABLE public.planificaciones OWNER TO horarios_user;

--
-- Name: planificaciones_id_seq; Type: SEQUENCE; Schema: public; Owner: horarios_user
--

CREATE SEQUENCE public.planificaciones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.planificaciones_id_seq OWNER TO horarios_user;

--
-- Name: planificaciones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: horarios_user
--

ALTER SEQUENCE public.planificaciones_id_seq OWNED BY public.planificaciones.id;


--
-- Name: recreos_excluidos; Type: TABLE; Schema: public; Owner: horarios_user
--

CREATE TABLE public.recreos_excluidos (
    id integer NOT NULL,
    departamento_id integer,
    dia_semana character varying,
    modulo_id_anterior integer
);


ALTER TABLE public.recreos_excluidos OWNER TO horarios_user;

--
-- Name: recreos_excluidos_id_seq; Type: SEQUENCE; Schema: public; Owner: horarios_user
--

CREATE SEQUENCE public.recreos_excluidos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.recreos_excluidos_id_seq OWNER TO horarios_user;

--
-- Name: recreos_excluidos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: horarios_user
--

ALTER SEQUENCE public.recreos_excluidos_id_seq OWNED BY public.recreos_excluidos.id;


--
-- Name: roles; Type: TABLE; Schema: public; Owner: horarios_user
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    nombre character varying,
    descripcion text,
    institucion_id integer
);


ALTER TABLE public.roles OWNER TO horarios_user;

--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: horarios_user
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.roles_id_seq OWNER TO horarios_user;

--
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: horarios_user
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- Name: usuarios; Type: TABLE; Schema: public; Owner: horarios_user
--

CREATE TABLE public.usuarios (
    id integer NOT NULL,
    username character varying,
    password_hash character varying,
    rol character varying,
    activo integer,
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    institucion_id integer,
    rol_id integer
);


ALTER TABLE public.usuarios OWNER TO horarios_user;

--
-- Name: usuarios_id_seq; Type: SEQUENCE; Schema: public; Owner: horarios_user
--

CREATE SEQUENCE public.usuarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.usuarios_id_seq OWNER TO horarios_user;

--
-- Name: usuarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: horarios_user
--

ALTER SEQUENCE public.usuarios_id_seq OWNED BY public.usuarios.id;


--
-- Name: asignaciones id; Type: DEFAULT; Schema: public; Owner: horarios_user
--

ALTER TABLE ONLY public.asignaciones ALTER COLUMN id SET DEFAULT nextval('public.asignaciones_id_seq'::regclass);


--
-- Name: aulas id; Type: DEFAULT; Schema: public; Owner: horarios_user
--

ALTER TABLE ONLY public.aulas ALTER COLUMN id SET DEFAULT nextval('public.aulas_id_seq'::regclass);


--
-- Name: calendario_categorias id; Type: DEFAULT; Schema: public; Owner: horarios_user
--

ALTER TABLE ONLY public.calendario_categorias ALTER COLUMN id SET DEFAULT nextval('public.calendario_categorias_id_seq'::regclass);


--
-- Name: calendario_eventos id; Type: DEFAULT; Schema: public; Owner: horarios_user
--

ALTER TABLE ONLY public.calendario_eventos ALTER COLUMN id SET DEFAULT nextval('public.calendario_eventos_id_seq'::regclass);


--
-- Name: calendarios id; Type: DEFAULT; Schema: public; Owner: horarios_user
--

ALTER TABLE ONLY public.calendarios ALTER COLUMN id SET DEFAULT nextval('public.calendarios_id_seq'::regclass);


--
-- Name: cargo_asignaciones id; Type: DEFAULT; Schema: public; Owner: horarios_user
--

ALTER TABLE ONLY public.cargo_asignaciones ALTER COLUMN id SET DEFAULT nextval('public.cargo_asignaciones_id_seq'::regclass);


--
-- Name: cargo_horarios id; Type: DEFAULT; Schema: public; Owner: horarios_user
--

ALTER TABLE ONLY public.cargo_horarios ALTER COLUMN id SET DEFAULT nextval('public.cargo_horarios_id_seq'::regclass);


--
-- Name: cargos id; Type: DEFAULT; Schema: public; Owner: horarios_user
--

ALTER TABLE ONLY public.cargos ALTER COLUMN id SET DEFAULT nextval('public.cargos_id_seq'::regclass);


--
-- Name: comisiones id; Type: DEFAULT; Schema: public; Owner: horarios_user
--

ALTER TABLE ONLY public.comisiones ALTER COLUMN id SET DEFAULT nextval('public.comisiones_id_seq'::regclass);


--
-- Name: config_turnos id; Type: DEFAULT; Schema: public; Owner: horarios_user
--

ALTER TABLE ONLY public.config_turnos ALTER COLUMN id SET DEFAULT nextval('public.config_turnos_id_seq'::regclass);


--
-- Name: departamentos id; Type: DEFAULT; Schema: public; Owner: horarios_user
--

ALTER TABLE ONLY public.departamentos ALTER COLUMN id SET DEFAULT nextval('public.departamentos_id_seq'::regclass);


--
-- Name: departamientos id; Type: DEFAULT; Schema: public; Owner: horarios_user
--

ALTER TABLE ONLY public.departamientos ALTER COLUMN id SET DEFAULT nextval('public.departamientos_id_seq'::regclass);


--
-- Name: docentes id; Type: DEFAULT; Schema: public; Owner: horarios_user
--

ALTER TABLE ONLY public.docentes ALTER COLUMN id SET DEFAULT nextval('public.docentes_id_seq'::regclass);


--
-- Name: instituciones id; Type: DEFAULT; Schema: public; Owner: horarios_user
--

ALTER TABLE ONLY public.instituciones ALTER COLUMN id SET DEFAULT nextval('public.instituciones_id_seq'::regclass);


--
-- Name: materias id; Type: DEFAULT; Schema: public; Owner: horarios_user
--

ALTER TABLE ONLY public.materias ALTER COLUMN id SET DEFAULT nextval('public.materias_id_seq'::regclass);


--
-- Name: modulos id; Type: DEFAULT; Schema: public; Owner: horarios_user
--

ALTER TABLE ONLY public.modulos ALTER COLUMN id SET DEFAULT nextval('public.modulos_id_seq'::regclass);


--
-- Name: modulos_horario id; Type: DEFAULT; Schema: public; Owner: horarios_user
--

ALTER TABLE ONLY public.modulos_horario ALTER COLUMN id SET DEFAULT nextval('public.modulos_horario_id_seq'::regclass);


--
-- Name: notas_adhesivas id; Type: DEFAULT; Schema: public; Owner: horarios_user
--

ALTER TABLE ONLY public.notas_adhesivas ALTER COLUMN id SET DEFAULT nextval('public.notas_adhesivas_id_seq'::regclass);


--
-- Name: permisos id; Type: DEFAULT; Schema: public; Owner: horarios_user
--

ALTER TABLE ONLY public.permisos ALTER COLUMN id SET DEFAULT nextval('public.permisos_id_seq'::regclass);


--
-- Name: planificaciones id; Type: DEFAULT; Schema: public; Owner: horarios_user
--

ALTER TABLE ONLY public.planificaciones ALTER COLUMN id SET DEFAULT nextval('public.planificaciones_id_seq'::regclass);


--
-- Name: recreos_excluidos id; Type: DEFAULT; Schema: public; Owner: horarios_user
--

ALTER TABLE ONLY public.recreos_excluidos ALTER COLUMN id SET DEFAULT nextval('public.recreos_excluidos_id_seq'::regclass);


--
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: horarios_user
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- Name: usuarios id; Type: DEFAULT; Schema: public; Owner: horarios_user
--

ALTER TABLE ONLY public.usuarios ALTER COLUMN id SET DEFAULT nextval('public.usuarios_id_seq'::regclass);


--
-- Data for Name: asignaciones; Type: TABLE DATA; Schema: public; Owner: horarios_user
--

COPY public.asignaciones (id, departamento_id, aula_id, modulo_id, dia_semana, comision_id, docente_id, observaciones, created_at, updated_at, updated_by) FROM stdin;
175	1	3	1	lunes	7	1		2026-04-13 01:59:18.073443	2026-04-13 01:59:18.073445	\N
15	1	1	1	martes	9	4		2026-03-13 13:09:44.231495	2026-03-13 13:09:44.231499	\N
16	1	3	1	martes	10	5		2026-03-13 13:10:08.213506	2026-03-13 13:10:08.213515	\N
19	1	1	1	jueves	13	6		2026-03-13 13:11:56.72467	2026-03-13 13:11:56.724674	\N
20	1	3	1	jueves	14	3		2026-03-13 13:13:27.283924	2026-03-13 13:13:27.283927	\N
21	1	1	1	viernes	15	6		2026-03-13 13:13:47.32852	2026-03-13 13:13:47.328523	\N
22	1	3	1	viernes	16	5		2026-03-13 13:14:14.476097	2026-03-13 13:14:14.476101	\N
24	1	1	2	martes	9	4		2026-03-13 13:15:34.865214	2026-03-13 13:15:34.865219	\N
25	1	3	2	martes	10	5		2026-03-13 13:15:47.416548	2026-03-13 13:15:47.416555	\N
29	1	1	2	jueves	13	6		2026-03-13 13:16:59.006783	2026-03-13 13:16:59.006786	\N
30	1	3	2	jueves	14	3		2026-03-13 13:17:12.780244	2026-03-13 13:17:12.780247	\N
31	1	1	2	viernes	15	6		2026-03-13 13:17:30.346819	2026-03-13 13:17:30.346822	\N
32	1	3	2	viernes	16	5		2026-03-13 13:17:41.832047	2026-03-13 13:17:41.83205	\N
34	1	1	4	lunes	17	6		2026-03-13 13:19:26.692079	2026-03-13 13:19:26.692084	\N
37	1	1	4	martes	18	4		2026-03-13 13:26:13.738534	2026-03-13 13:26:13.738537	\N
39	1	3	4	martes	19	5		2026-03-13 13:26:45.358527	2026-03-13 13:26:45.358534	\N
54	1	1	3	lunes	\N	\N		2026-03-13 16:05:48.091616	2026-03-13 16:05:48.091622	\N
55	1	1	5	lunes	17	6		2026-03-13 16:06:25.357816	2026-03-13 16:06:25.357827	\N
56	1	2	1	lunes	\N	\N		2026-03-13 16:22:54.804646	2026-03-13 16:22:54.804653	\N
57	1	2	2	lunes	\N	\N		2026-03-13 16:23:01.062078	2026-03-13 16:23:01.062104	\N
58	1	1	1	lunes	1	3	obs	2026-03-13 16:23:48.612886	2026-03-13 16:23:48.612894	\N
59	1	1	2	lunes	1	3	obs 2	2026-03-13 16:23:57.835035	2026-03-13 16:23:57.83504	\N
61	1	3	2	lunes	7	1		2026-03-13 16:24:07.591417	2026-03-13 16:24:07.591424	\N
62	1	1	6	lunes	26	6		2026-03-13 16:25:27.865615	2026-03-13 16:25:27.865625	\N
63	1	1	7	lunes	26	6		2026-03-13 16:25:44.087957	2026-03-13 16:25:44.087965	\N
66	1	3	6	lunes	27	10		2026-03-13 16:27:32.061508	2026-03-13 16:27:32.061514	\N
67	1	3	7	lunes	27	10		2026-03-13 16:27:44.212489	2026-03-13 16:27:44.212496	\N
68	1	2	6	lunes	\N	\N		2026-03-13 16:27:53.485002	2026-03-13 16:27:53.485011	\N
69	1	2	7	lunes	\N	\N		2026-03-13 16:28:02.847273	2026-03-13 16:28:02.847285	\N
70	1	1	12	lunes	\N	\N		2026-03-13 16:28:48.952493	2026-03-13 16:28:48.952509	\N
71	1	1	8	lunes	36	11		2026-03-13 16:38:07.264763	2026-03-13 16:38:07.264768	\N
72	1	1	9	lunes	36	11		2026-03-13 16:38:25.457854	2026-03-13 16:38:25.457861	\N
73	1	3	8	lunes	37	10		2026-03-13 16:38:57.729909	2026-03-13 16:38:57.729914	\N
74	1	3	9	lunes	37	10		2026-03-13 16:39:10.52625	2026-03-13 16:39:10.526257	\N
75	1	1	10	lunes	46	3		2026-03-13 16:39:42.596894	2026-03-13 16:39:42.596902	\N
76	1	1	11	lunes	46	3		2026-03-13 16:40:00.647771	2026-03-13 16:40:00.647778	\N
77	1	3	10	lunes	47	12		2026-03-13 16:40:30.647542	2026-03-13 16:40:30.64755	\N
78	1	3	11	lunes	47	12		2026-03-13 16:40:43.343717	2026-03-13 16:40:43.343729	\N
81	1	1	15	lunes	63	3		2026-03-13 16:43:41.787791	2026-03-13 16:43:41.787799	\N
82	1	1	16	lunes	63	3		2026-03-13 16:43:55.642435	2026-03-13 16:43:55.64244	\N
83	1	3	13	lunes	56	5		2026-03-13 17:41:15.244143	2026-03-13 17:41:15.244149	\N
84	1	1	13	lunes	55	3		2026-03-13 17:41:39.555724	2026-03-13 17:41:39.555727	\N
85	1	1	14	lunes	55	3		2026-03-13 17:41:46.380676	2026-03-13 17:41:46.380679	\N
86	1	3	14	lunes	56	5		2026-03-13 17:42:04.072144	2026-03-13 17:42:04.072148	\N
87	1	3	15	lunes	64	13		2026-03-13 17:42:46.35564	2026-03-13 17:42:46.355643	\N
88	1	3	16	lunes	64	13		2026-03-13 17:42:58.20105	2026-03-13 17:42:58.201054	\N
91	1	1	3	martes	\N	\N		2026-03-13 18:37:47.656262	2026-03-13 18:37:47.656265	\N
92	1	1	5	martes	18	4		2026-03-13 18:38:05.244745	2026-03-13 18:38:05.244752	\N
93	1	1	6	martes	28	4		2026-03-13 18:38:53.448064	2026-03-13 18:38:53.448068	\N
94	1	1	7	martes	28	4		2026-03-13 18:39:18.038858	2026-03-13 18:39:18.038861	\N
95	1	3	3	martes	\N	\N		2026-03-13 18:39:56.225445	2026-03-13 18:39:56.225448	\N
96	1	3	5	martes	19	5		2026-03-13 18:40:09.394641	2026-03-13 18:40:09.394643	\N
97	1	3	6	martes	29	10		2026-03-13 18:40:37.784403	2026-03-13 18:40:37.784406	\N
98	1	3	7	martes	29	10		2026-03-13 18:41:00.204114	2026-03-13 18:41:00.204117	\N
99	1	1	8	martes	38	9		2026-03-13 18:41:56.596204	2026-03-13 18:41:56.596211	\N
100	1	1	9	martes	38	9		2026-03-13 18:42:05.990469	2026-03-13 18:42:05.990475	\N
101	1	3	8	martes	39	10		2026-03-13 18:43:19.12446	2026-03-13 18:43:19.124463	\N
102	1	3	9	martes	39	10		2026-03-13 18:43:28.139739	2026-03-13 18:43:28.139744	\N
103	1	1	11	martes	48	13		2026-03-13 18:44:26.551031	2026-03-13 18:44:26.551035	\N
104	1	1	12	martes	48	13		2026-03-13 18:44:45.352429	2026-03-13 18:44:45.352451	\N
105	1	3	11	martes	49	7		2026-03-13 18:45:05.483825	2026-03-13 18:45:05.483829	\N
106	1	3	12	martes	49	7		2026-03-13 18:45:17.265333	2026-03-13 18:45:17.265336	\N
107	1	1	13	martes	57	13		2026-03-13 18:45:44.678409	2026-03-13 18:45:44.678412	\N
108	1	1	14	martes	57	13		2026-03-13 18:45:53.656334	2026-03-13 18:45:53.656337	\N
109	1	3	13	martes	58	4		2026-03-13 18:46:33.96148	2026-03-13 18:46:33.961483	\N
110	1	3	14	martes	58	4		2026-03-13 18:46:45.169622	2026-03-13 18:46:45.169625	\N
111	1	1	15	martes	65	13		2026-03-13 18:47:17.958737	2026-03-13 18:47:17.95874	\N
112	1	1	16	martes	65	13		2026-03-13 18:47:34.548242	2026-03-13 18:47:34.54826	\N
123	1	1	3	jueves	22	8		2026-03-13 22:18:01.094213	2026-03-13 22:18:01.09422	\N
124	1	1	4	jueves	22	8		2026-03-13 22:18:12.666838	2026-03-13 22:18:12.666843	\N
125	1	3	3	jueves	23	3		2026-03-13 22:18:41.708017	2026-03-13 22:18:41.708024	\N
126	1	3	4	jueves	23	3		2026-03-13 22:18:54.558806	2026-03-13 22:18:54.558815	\N
127	1	1	6	jueves	32	8		2026-03-13 22:21:43.929353	2026-03-13 22:21:43.929358	\N
128	1	1	7	jueves	32	8		2026-03-13 22:22:17.127134	2026-03-13 22:22:17.12714	\N
129	1	3	6	jueves	33	10		2026-03-13 22:22:55.686457	2026-03-13 22:22:55.686467	\N
130	1	3	7	jueves	33	10		2026-03-13 22:23:06.084294	2026-03-13 22:23:06.084307	\N
131	1	1	8	jueves	42	5		2026-03-13 22:26:06.180418	2026-03-13 22:26:06.180424	\N
132	1	1	9	jueves	42	5		2026-03-13 22:26:23.420353	2026-03-13 22:26:23.420358	\N
133	1	3	8	jueves	43	10		2026-03-13 22:26:38.843038	2026-03-13 22:26:38.843043	\N
134	1	3	9	jueves	43	10		2026-03-13 22:26:52.13905	2026-03-13 22:26:52.13906	\N
135	1	1	10	jueves	51	12		2026-03-13 22:37:52.626847	2026-03-13 22:37:52.626853	\N
136	1	1	11	jueves	51	12		2026-03-13 22:38:28.819424	2026-03-13 22:38:28.81943	\N
137	1	3	10	jueves	52	10		2026-03-13 22:39:07.097568	2026-03-13 22:39:07.097575	\N
138	1	3	11	jueves	52	10		2026-03-13 22:39:25.019602	2026-03-13 22:39:25.019617	\N
139	1	1	13	jueves	61	12		2026-03-13 22:41:55.462008	2026-03-13 22:41:55.46202	\N
140	1	1	14	jueves	61	12		2026-03-13 22:42:19.903583	2026-03-13 22:42:19.903592	\N
141	1	3	13	jueves	62	13		2026-03-13 22:42:46.193767	2026-03-13 22:42:46.193773	\N
142	1	3	14	jueves	62	13		2026-03-13 22:42:58.610492	2026-03-13 22:42:58.610499	\N
143	1	1	15	jueves	66	9		2026-03-13 22:43:25.356234	2026-03-13 22:43:25.356246	\N
144	1	1	16	jueves	66	9		2026-03-13 22:43:35.587657	2026-03-13 22:43:35.587672	\N
145	1	3	15	jueves	67	13		2026-03-13 22:43:52.474882	2026-03-13 22:43:52.474889	\N
146	1	3	16	jueves	67	13		2026-03-13 22:44:12.08847	2026-03-13 22:44:12.088477	\N
149	1	1	4	viernes	24	9		2026-03-13 22:48:09.0147	2026-03-13 22:48:09.014706	\N
151	1	3	4	viernes	25	5		2026-03-13 22:48:32.988884	2026-03-13 22:48:32.988905	\N
152	1	1	5	viernes	24	9		2026-03-13 22:49:33.819394	2026-03-13 22:49:33.819398	\N
153	1	1	3	viernes	\N	\N		2026-03-13 22:49:39.822003	2026-03-13 22:49:39.822009	\N
154	1	3	5	viernes	25	5		2026-03-13 22:49:59.356021	2026-03-13 22:49:59.356028	\N
155	1	3	3	viernes	\N	\N		2026-03-13 22:50:05.766522	2026-03-13 22:50:05.766531	\N
156	1	1	6	viernes	34	9		2026-03-13 22:51:02.276281	2026-03-13 22:51:02.276291	\N
157	1	1	7	viernes	34	9		2026-03-13 22:51:50.440043	2026-03-13 22:51:50.440052	\N
158	1	3	6	viernes	35	10		2026-03-13 22:52:13.197305	2026-03-13 22:52:13.197309	\N
159	1	3	7	viernes	35	10		2026-03-13 22:52:42.052358	2026-03-13 22:52:42.052374	\N
160	1	1	8	viernes	44	12		2026-03-13 22:53:11.829443	2026-03-13 22:53:11.82945	\N
161	1	1	9	viernes	44	12		2026-03-13 22:53:31.071378	2026-03-13 22:53:31.071401	\N
162	1	3	8	viernes	45	10		2026-03-13 22:53:53.667578	2026-03-13 22:53:53.667584	\N
163	1	3	9	viernes	45	10		2026-03-13 22:54:06.781659	2026-03-13 22:54:06.781662	\N
164	1	1	10	viernes	53	12		2026-03-13 22:54:29.342396	2026-03-13 22:54:29.342404	\N
165	1	1	11	viernes	53	12		2026-03-13 22:54:42.473371	2026-03-13 22:54:42.473377	\N
166	1	3	10	viernes	54	10		2026-03-13 22:55:28.153331	2026-03-13 22:55:28.153337	\N
167	1	3	11	viernes	54	10		2026-03-13 22:55:37.019424	2026-03-13 22:55:37.019431	\N
168	1	1	14	viernes	68	12		2026-03-13 22:56:19.582435	2026-03-13 22:56:19.582443	\N
169	1	1	15	viernes	68	12		2026-03-13 22:56:43.435812	2026-03-13 22:56:43.435828	\N
170	1	3	14	viernes	69	11		2026-03-13 22:57:08.097158	2026-03-13 22:57:08.097166	\N
171	1	3	15	viernes	69	11		2026-03-13 22:57:29.314353	2026-03-13 22:57:29.314359	\N
17	1	1	1	miércoles	11	6		2026-03-13 13:10:46.563675	2026-03-13 13:10:46.563679	\N
18	1	3	1	miércoles	12	5		2026-03-13 13:11:11.169886	2026-03-13 13:11:11.169893	\N
26	1	1	2	miércoles	11	6		2026-03-13 13:16:20.426845	2026-03-13 13:16:20.426848	\N
28	1	3	2	miércoles	12	5		2026-03-13 13:16:42.155737	2026-03-13 13:16:42.155739	\N
41	1	1	4	miércoles	20	7		2026-03-13 13:35:17.84561	2026-03-13 13:35:17.845613	\N
43	1	3	4	miércoles	21	5		2026-03-13 15:56:14.873941	2026-03-13 15:56:14.873945	\N
46	1	1	3	miércoles	\N	\N		2026-03-13 16:02:09.016568	2026-03-13 16:02:09.016572	\N
49	1	1	5	miércoles	20	7		2026-03-13 16:03:26.821912	2026-03-13 16:03:26.821919	\N
113	1	2	1	miércoles	\N	\N		2026-03-13 18:48:23.239174	2026-03-13 18:48:23.239177	\N
114	1	2	2	miércoles	\N	\N		2026-03-13 18:48:29.881634	2026-03-13 18:48:29.881638	\N
115	1	2	4	miércoles	\N	\N		2026-03-13 18:48:36.224604	2026-03-13 18:48:36.224608	\N
116	1	2	5	miércoles	\N	\N		2026-03-13 18:48:43.308264	2026-03-13 18:48:43.308268	\N
117	1	3	3	miércoles	\N	\N		2026-03-13 18:49:07.841309	2026-03-13 18:49:07.841312	\N
118	1	3	5	miércoles	21	5		2026-03-13 18:49:25.643013	2026-03-13 18:49:25.643018	\N
119	1	1	6	miércoles	30	10		2026-03-13 19:45:24.322057	2026-03-13 19:45:24.322075	\N
120	1	1	7	miércoles	30	10		2026-03-13 19:45:37.591898	2026-03-13 19:45:37.591902	\N
121	1	3	6	miércoles	31	5		2026-03-13 19:46:13.610455	2026-03-13 19:46:13.610461	\N
122	1	3	7	miércoles	31	5		2026-03-13 19:46:26.554091	2026-03-13 19:46:26.554099	\N
\.


--
-- Data for Name: aula_departamento; Type: TABLE DATA; Schema: public; Owner: horarios_user
--

COPY public.aula_departamento (aula_id, departamento_id) FROM stdin;
1	1
2	1
3	1
9	10
10	10
11	9
12	9
13	9
14	10
15	10
\.


--
-- Data for Name: aulas; Type: TABLE DATA; Schema: public; Owner: horarios_user
--

COPY public.aulas (id, departamento_id, nombre, capacidad, activo, created_at, institucion_id) FROM stdin;
1	1	Aula 1	\N	1	2026-03-12 19:16:03.995575	2
2	1	Aula 2	\N	1	2026-03-12 19:16:13.305142	2
3	1	Aula 3	\N	1	2026-03-12 19:16:19.022452	2
9	\N	LabMediciones	15	1	2026-04-09 10:54:30.950737	1
10	\N	AulaGen	20	1	2026-04-09 10:55:35.047037	1
11	\N	Aula 1A HSeg	30	1	2026-04-09 10:56:50.435755	1
12	\N	Aula 2A HSeg	29	1	2026-04-09 10:57:40.605359	1
13	\N	Aula 3A HSeg	30	1	2026-04-09 10:58:14.539776	1
14	\N	AulaInfo	20	1	2026-04-09 10:59:23.768225	1
15	\N	Aula 1ro	\N	1	2026-04-09 11:00:02.48717	1
\.


--
-- Data for Name: calendario_categorias; Type: TABLE DATA; Schema: public; Owner: horarios_user
--

COPY public.calendario_categorias (id, calendario_id, nombre, color) FROM stdin;
1	1	Feriado	#ef4444
3	1	Exámenes	#3b82f6
4	1	Evento Especial	#10b981
2	1	Asueto / Puente	#f59e0b
5	1	Trabajo Académico	#ab57ff
6	1	Receso / Vacaciones	#d2d09d
7	2	Feriado	#ef4444
8	2	Asueto	#f59e0b
9	2	Exámenes	#3b82f6
10	2	Evento Especial	#10b981
11	3	Feriado	#ef4444
12	3	Asueto	#f59e0b
13	3	Exámenes	#3b82f6
14	3	Evento Especial	#10b981
15	4	Feriado	#ef4444
16	4	Asueto	#f59e0b
17	4	Exámenes	#3b82f6
18	4	Evento Especial	#10b981
\.


--
-- Data for Name: calendario_eventos; Type: TABLE DATA; Schema: public; Owner: horarios_user
--

COPY public.calendario_eventos (id, calendario_id, fecha, categoria_id, descripcion, es_privado, es_no_laborable, departamento_id) FROM stdin;
616	1	2026-12-04	2	Dia del empleado administrativo	f	t	\N
619	1	2026-12-23	4	Colación	f	f	\N
620	1	2026-12-25	1	Navidad	f	t	\N
621	1	2026-12-31	1	Fin de Año	f	t	\N
390	1	2026-02-16	1	Carnaval	f	f	\N
391	1	2026-02-17	1	Carnaval	f	f	\N
392	1	2026-04-02	1	Día del Veterano y de los Caídos en la Guerra de Malvinas	f	f	\N
393	1	2026-03-24	1	Día Nacional de la Memoria por la Verdad y la Justicia	f	f	\N
394	1	2026-03-23	1	Puente turístico no laborable	f	f	\N
395	1	2026-01-01	1	Año nuevo	f	f	\N
396	1	2026-07-09	1	Día de la Independencia	f	f	\N
397	1	2026-06-20	1	Paso a la Inmortalidad del General Manuel Belgrano	f	f	\N
398	1	2026-06-15	1	Paso a la Inmortalidad del General Martín Güemes (17/6)	f	f	\N
399	1	2026-04-03	1	Viernes Santo	f	f	\N
400	1	2026-10-12	1	Día del Respeto a la Diversidad Cultural	f	f	\N
401	1	2026-05-25	1	Día de la Revolución de Mayo	f	f	\N
402	1	2026-05-01	1	Día del Trabajador	f	f	\N
403	1	2026-07-10	1	Puente turístico no laborable	f	f	\N
404	1	2026-08-17	1	Paso a la Inmortalidad del Gral. José de San Martín	f	f	\N
405	1	2026-11-23	1	Día de la Soberanía Nacional (20/11)	f	f	\N
409	1	2026-11-15	1	Fundación de Santa Fe (Provincial)	f	f	\N
410	1	2026-10-07	1	Día de la Virgen del Rosario (Local Rosario)	f	f	\N
411	1	2026-02-13	5	Inscripción de los/las estudiantes a Exámenes Finales Primer Turno	f	f	\N
412	1	2026-02-09	5	Inscripción de los/las estudiantes a Exámenes Finales Primer Turno	f	f	\N
413	1	2026-02-11	5	Inscripción de los/las estudiantes a Exámenes Finales Primer Turno	f	f	\N
414	1	2026-02-12	5	Inscripción de los/las estudiantes a Exámenes Finales Primer Turno	f	f	\N
415	1	2026-02-10	5	Inscripción de los/las estudiantes a Exámenes Finales Primer Turno	f	f	\N
416	1	2026-02-18	5	Reintegro de la totalidad del personal	f	f	\N
417	1	2026-02-25	3	Exámenes Finales Primer Turno	f	f	\N
418	1	2026-02-18	3	Exámenes Finales Primer Turno	f	f	\N
419	1	2026-02-20	3	Exámenes Finales Primer Turno	f	f	\N
420	1	2026-02-23	3	Exámenes Finales Primer Turno	f	f	\N
421	1	2026-02-19	3	Exámenes Finales Primer Turno	f	f	\N
422	1	2026-02-24	3	Exámenes Finales Primer Turno	f	f	\N
423	1	2026-02-26	3	Exámenes Finales Primer Turno	f	f	\N
424	1	2026-02-27	3	Exámenes Finales Primer Turno	f	f	\N
425	1	2026-03-03	3	Exámenes Finales Primer Turno	f	f	\N
426	1	2026-03-02	3	Exámenes Finales Primer Turno	f	f	\N
427	1	2026-03-04	3	Exámenes Finales Primer Turno	f	f	\N
428	1	2026-03-05	3	Exámenes Finales Primer Turno	f	f	\N
429	1	2026-03-06	3	Exámenes Finales Primer Turno	f	f	\N
430	1	2026-03-09	3	Exámenes Finales Primer Turno	f	f	\N
431	1	2026-03-10	3	Exámenes Finales Primer Turno	f	f	\N
432	1	2026-03-11	3	Exámenes Finales Primer Turno	f	f	\N
433	1	2026-03-12	3	Exámenes Finales Primer Turno	f	f	\N
434	1	2026-03-13	3	Exámenes Finales Primer Turno	f	f	\N
435	1	2026-03-16	3	Exámenes Finales Primer Turno	f	f	\N
436	1	2026-03-17	3	Exámenes Finales Primer Turno	f	f	\N
437	1	2026-03-18	3	Exámenes Finales Primer Turno	f	f	\N
438	1	2026-03-23	5	Inicio de Ciclo Lectivo	f	f	\N
439	1	2026-04-13	5	Inscripción de los/las estudiantes a Mesas Examinadoras Especiales	f	f	\N
440	1	2026-04-14	5	Inscripción de los/las estudiantes a Mesas Examinadoras Especiales	f	f	\N
441	1	2026-04-15	5	Inscripción de los/las estudiantes a Mesas Examinadoras Especiales	f	f	\N
442	1	2026-06-22	5	Inscripción de los/las estudiantes a Exámenes Finales Segundo Turno	f	f	\N
443	1	2026-06-23	5	Inscripción de los/las estudiantes a Exámenes Finales Segundo Turno	f	f	\N
444	1	2026-06-17	5	Inscripción de los/las estudiantes a Exámenes Finales Segundo Turno	f	f	\N
445	1	2026-06-18	5	Inscripción de los/las estudiantes a Exámenes Finales Segundo Turno	f	f	\N
446	1	2026-06-16	5	Inscripción de los/las estudiantes a Exámenes Finales Segundo Turno	f	f	\N
447	1	2026-06-19	5	Inscripción de los/las estudiantes a Exámenes Finales Segundo Turno	f	f	\N
448	1	2026-06-24	5	Inscripción de los/las estudiantes a Exámenes Finales Segundo Turno	f	f	\N
449	1	2026-06-25	5	Inscripción de los/las estudiantes a Exámenes Finales Segundo Turno	f	f	\N
450	1	2026-06-26	5	Inscripción de los/las estudiantes a Exámenes Finales Segundo Turno	f	f	\N
452	1	2026-07-09	6	Receso escolar de invierno	f	f	\N
453	1	2026-07-10	6	Receso escolar de invierno	f	f	\N
484	1	2026-08-14	5	Inscripción de los/las estudiantes a Mesas Examinadoras Especiales	f	f	\N
485	1	2026-08-10	5	Inscripción de los/las estudiantes a Mesas Examinadoras Especiales	f	f	\N
486	1	2026-08-12	5	Inscripción de los/las estudiantes a Mesas Examinadoras Especiales	f	f	\N
487	1	2026-08-11	5	Inscripción de los/las estudiantes a Mesas Examinadoras Especiales	f	f	\N
488	1	2026-08-13	5	Inscripción de los/las estudiantes a Mesas Examinadoras Especiales	f	f	\N
489	1	2026-08-24	5	Mesas Examinadoras Especiales. Carga de calificaciones en SIGAE WEB	f	f	\N
490	1	2026-08-28	5	Mesas Examinadoras Especiales. Carga de calificaciones en SIGAE WEB	f	f	\N
491	1	2026-08-27	5	Mesas Examinadoras Especiales. Carga de calificaciones en SIGAE WEB	f	f	\N
492	1	2026-08-26	5	Mesas Examinadoras Especiales. Carga de calificaciones en SIGAE WEB	f	f	\N
493	1	2026-08-25	5	Mesas Examinadoras Especiales. Carga de calificaciones en SIGAE WEB	f	f	\N
617	1	2026-12-08	2	Dia de la concepción de la virgen maria	f	t	\N
502	1	2026-11-04	5	Inscripción de los/las estudiantes a Exámenes Finales 3er. Turno	f	f	\N
507	1	2026-11-09	5	Inscripción de los/las estudiantes a Exámenes Finales 3er. Turno	f	f	\N
511	1	2026-11-12	5	Inscripción de los/las estudiantes a Exámenes Finales 3er. Turno	f	f	\N
518	1	2026-11-25	5	Inscripción de los/las estudiantes ingresantes a Primer Año 2.027	f	f	\N
529	1	2026-11-26	3	Exámenes Finales Tercer Turno (dos llamados)	f	f	\N
531	1	2026-11-25	3	Exámenes Finales Tercer Turno (dos llamados)	f	f	\N
532	1	2026-11-27	3	Exámenes Finales Tercer Turno (dos llamados)	f	f	\N
618	1	2026-12-07	2	Dia de la concepción de la virgen maria	f	t	\N
506	1	2026-11-05	5	Inscripción de los/las estudiantes a Exámenes Finales 3er. Turno	f	f	\N
508	1	2026-11-13	5	Inscripción de los/las estudiantes a Exámenes Finales 3er. Turno	f	f	\N
512	1	2026-11-30	5	Inscripción de los/las estudiantes ingresantes a Primer Año 2.027	f	f	\N
530	1	2026-11-24	3	Exámenes Finales Tercer Turno (dos llamados)	f	f	\N
509	1	2026-11-10	5	Inscripción de los/las estudiantes a Exámenes Finales 3er. Turno	f	f	\N
514	1	2026-11-24	5	Inscripción de los/las estudiantes ingresantes a Primer Año 2.027	f	f	\N
504	1	2026-11-02	5	Inscripción de los/las estudiantes a Exámenes Finales 3er. Turno	f	f	\N
516	1	2026-11-26	5	Inscripción de los/las estudiantes ingresantes a Primer Año 2.027	f	f	\N
503	1	2026-11-03	5	Inscripción de los/las estudiantes a Exámenes Finales 3er. Turno	f	f	\N
505	1	2026-11-06	5	Inscripción de los/las estudiantes a Exámenes Finales 3er. Turno	f	f	\N
510	1	2026-11-11	5	Inscripción de los/las estudiantes a Exámenes Finales 3er. Turno	f	f	\N
513	1	2026-11-27	5	Inscripción de los/las estudiantes ingresantes a Primer Año 2.027	f	f	\N
515	1	2026-11-23	5	Inscripción de los/las estudiantes ingresantes a Primer Año 2.027	f	f	\N
528	1	2026-11-23	3	Exámenes Finales Tercer Turno (dos llamados)	f	f	\N
533	1	2026-11-30	3	Exámenes Finales Tercer Turno (dos llamados)	f	f	\N
566	1	2026-09-21	4	Expo carreras de Nivel Superior.	f	f	\N
567	1	2026-09-23	4	Expo carreras de Nivel Superior.	f	f	\N
568	1	2026-09-25	4	Expo carreras de Nivel Superior.	f	f	\N
569	1	2026-09-22	4	Expo carreras de Nivel Superior.	f	f	\N
570	1	2026-09-28	4	Expo carreras de Nivel Superior.	f	f	\N
571	1	2026-09-24	4	Expo carreras de Nivel Superior.	f	f	\N
572	1	2026-09-29	4	Expo carreras de Nivel Superior.	f	f	\N
573	1	2026-09-30	4	Expo carreras de Nivel Superior.	f	f	\N
576	3	2026-01-01	13		f	f	8
580	1	2026-07-10	6		f	f	\N
581	1	2026-07-09	6		f	f	\N
590	1	2026-07-08	6	Receso Invernal	f	t	\N
591	1	2026-07-06	6	Receso Invernal	f	t	\N
592	1	2026-07-07	6	Receso Invernal	f	t	\N
593	1	2026-07-17	6	Receso Invernal	f	t	\N
594	1	2026-07-16	6	Receso Invernal	f	t	\N
595	1	2026-07-13	6	Receso Invernal	f	t	\N
596	1	2026-07-14	6	Receso Invernal	f	t	\N
597	1	2026-07-15	6	Receso Invernal	f	t	\N
598	1	2026-09-11	2	Dia de la docencia	f	t	\N
600	1	2026-12-03	3	Examenes finales	f	f	\N
601	1	2026-12-08	3	Examenes finales	f	f	\N
602	1	2026-12-02	3	Examenes finales	f	f	\N
603	1	2026-12-01	3	Examenes finales	f	f	\N
604	1	2026-12-04	3	Examenes finales	f	f	\N
605	1	2026-12-07	3	Examenes finales	f	f	\N
606	1	2026-12-15	3	Examenes finales	f	f	\N
607	1	2026-12-09	3	Examenes finales	f	f	\N
608	1	2026-12-11	3	Examenes finales	f	f	\N
609	1	2026-12-10	3	Examenes finales	f	f	\N
610	1	2026-12-16	3	Examenes finales	f	f	\N
611	1	2026-12-14	3	Examenes finales	f	f	\N
612	1	2026-12-22	3	Examenes finales	f	f	\N
613	1	2026-12-18	3	Examenes finales	f	f	\N
614	1	2026-12-17	3	Examenes finales	f	f	\N
615	1	2026-12-21	3	Examenes finales	f	f	\N
\.


--
-- Data for Name: calendarios; Type: TABLE DATA; Schema: public; Owner: horarios_user
--

COPY public.calendarios (id, nombre, descripcion, created_at, departamento_id) FROM stdin;
1	Calendario Institucional	Planificación académica general	2026-03-15 03:51:49.968472	1
2	Calendario Institucional	Planificación académica general	2026-03-31 00:18:26.282284	10
3	Calendario Institucional	Planificación académica general	2026-03-31 12:50:54.60055	8
4	Calendario Institucional	Planificación académica general	2026-03-31 12:51:27.614677	9
\.


--
-- Data for Name: cargo_asignaciones; Type: TABLE DATA; Schema: public; Owner: horarios_user
--

COPY public.cargo_asignaciones (id, cargo_id, docente_id, departamento_id, horas_lunes, horas_martes, horas_miercoles, horas_jueves, horas_viernes, horas_sabado, horas_domingo, total_horas, activo, created_at, updated_at, hora_inicio, hora_fin) FROM stdin;
2	\N	15	10	0	0	0	0	0	0	0	2	1	2026-04-11 14:34:54.50903	2026-04-11 14:34:54.509057	\N	\N
3	\N	1	1	0	0	0	0	0	0	0	1.33	1	2026-04-12 23:58:01.007483	2026-04-12 23:58:01.007486	\N	\N
1	1	1	1	0	3	3	3	3	0	0	12	1	2026-03-16 19:03:19.111701	2026-04-12 23:58:50.863798	\N	\N
\.


--
-- Data for Name: cargo_horarios; Type: TABLE DATA; Schema: public; Owner: horarios_user
--

COPY public.cargo_horarios (id, asignacion_id, dia_semana, hora_inicio, hora_fin, horas, aula_id, comision_id, modulo_id, observaciones) FROM stdin;
27	1	martes	07:30	10:30	3	2	\N	\N	\N
28	1	jueves	07:30	10:30	3	2	\N	\N	\N
29	1	viernes	07:30	10:30	3	2	\N	\N	\N
30	1	miércoles	07:30	10:30	3	2	\N	\N	\N
31	3	lunes	07:45	09:05	1.33	3	\N	\N	\N
\.


--
-- Data for Name: cargos; Type: TABLE DATA; Schema: public; Owner: horarios_user
--

COPY public.cargos (id, nombre, uso_multiple, activo, created_at, updated_at, departamento_id) FROM stdin;
1	Attp - Ayudante de Trabajos Pácticos		1	2026-03-16 19:02:29.796953	2026-03-16 19:02:29.796962	1
\.


--
-- Data for Name: comisiones; Type: TABLE DATA; Schema: public; Owner: horarios_user
--

COPY public.comisiones (id, codigo, materia_id, turno, activo, created_at, updated_at) FROM stdin;
204	1COMU-A	121	noche	1	2026-03-31 12:37:43.858572	2026-03-31 12:37:43.858578
205	1COMU-B	121	noche	1	2026-03-31 12:37:43.858579	2026-03-31 12:37:43.858579
206	1COMU-C	121	noche	1	2026-03-31 12:37:43.85858	2026-03-31 12:37:43.85858
207	1UDI-A	122	noche	1	2026-03-31 12:37:43.877858	2026-03-31 12:37:43.877863
208	1UDI-B	122	noche	1	2026-03-31 12:37:43.877864	2026-03-31 12:37:43.877865
209	1UDI-C	122	noche	1	2026-03-31 12:37:43.877866	2026-03-31 12:37:43.877867
210	1SPU-A	123	noche	1	2026-03-31 12:37:43.895207	2026-03-31 12:37:43.895212
211	1SPU-B	123	noche	1	2026-03-31 12:37:43.895214	2026-03-31 12:37:43.895215
15	C2AM1	148	mañana	1	2026-03-13 11:50:29.499936	2026-03-30 14:43:28.131256
16	C2AM2	148	mañana	1	2026-03-13 11:50:52.837788	2026-03-30 14:43:28.131258
20	C2BM1	148	mañana	1	2026-03-13 11:54:18.007845	2026-03-30 14:43:28.131258
21	C2BM2	148	mañana	1	2026-03-13 11:54:34.098802	2026-03-30 14:43:28.131259
28	C2DM1	148	mañana	1	2026-03-13 11:56:47.351989	2026-03-30 14:43:28.131259
29	C2DM2	148	mañana	1	2026-03-13 11:57:01.490141	2026-03-30 14:43:28.131259
32	C2CM1	148	mañana	1	2026-03-13 11:57:47.014837	2026-03-30 14:43:28.13126
1	C1DM1	146	mañana	1	2026-03-12 19:07:27.322679	2026-03-30 14:43:25.530477
7	C1DM2	146	mañana	1	2026-03-13 11:45:50.972816	2026-03-30 14:43:25.53048
18	C1BM1	146	mañana	1	2026-03-13 11:53:30.159014	2026-03-30 14:43:25.53048
19	C1BM2	146	mañana	1	2026-03-13 11:53:50.847037	2026-03-30 14:43:25.530481
22	C1CM1	146	mañana	1	2026-03-13 11:54:47.990748	2026-03-30 14:43:25.530483
23	C1CM2	146	mañana	1	2026-03-13 11:55:00.684494	2026-03-30 14:43:25.530483
24	C1AM1	146	mañana	1	2026-03-13 11:55:27.498846	2026-03-30 14:43:25.530484
25	C1AM2	146	mañana	1	2026-03-13 11:55:48.549661	2026-03-30 14:43:25.530484
37	C1BT2	146	tarde	1	2026-03-13 12:01:34.008848	2026-03-30 14:43:25.530485
38	C1CT1	146	tarde	1	2026-03-13 12:09:07.987189	2026-03-30 14:43:25.530485
39	C1CT2	146	tarde	1	2026-03-13 12:09:20.795796	2026-03-30 14:43:25.530485
46	C1DT1	146	tarde	1	2026-03-13 12:13:04.024112	2026-03-30 14:43:25.530485
47	C1DT2	146	tarde	1	2026-03-13 12:16:35.799854	2026-03-30 14:43:25.530486
57	C1AT1	146	tarde	1	2026-03-13 12:49:42.741131	2026-03-30 14:43:25.530486
58	C1AT2	146	tarde	1	2026-03-13 12:50:03.005023	2026-03-30 14:43:25.530486
27	C4T4	150	tarde	1	2026-03-13 11:56:28.151623	2026-04-08 00:37:00.841038
30	C4T5	150	tarde	1	2026-03-13 11:57:16.412342	2026-04-08 00:37:06.246574
31	C4T6	150	tarde	1	2026-03-13 11:57:32.517662	2026-04-08 00:37:15.011276
36	C1BT1	146	tarde	1	2026-03-13 12:01:18.331421	2026-03-30 14:43:25.530485
61	C2AT1	148	tarde	1	2026-03-13 12:53:16.086566	2026-03-30 14:43:28.131261
62	C2AT2	148	tarde	1	2026-03-13 12:53:30.528	2026-03-30 14:43:28.131262
68	C2BT1	148	tarde	1	2026-03-13 12:54:58.108135	2026-03-30 14:43:28.131262
69	C2BT2	148	tarde	1	2026-03-13 12:55:35.797841	2026-03-30 14:43:28.131262
40	C3AT1	149	tarde	1	2026-03-13 12:09:48.042524	2026-04-08 00:30:26.99424
41	C3AT2	149	tarde	1	2026-03-13 12:10:04.451019	2026-04-08 00:30:38.626324
44	C3BT1	149	tarde	1	2026-03-13 12:12:34.63092	2026-04-08 00:32:38.219969
45	C3BT2	149	tarde	1	2026-03-13 12:12:49.506817	2026-04-08 00:32:47.260606
51	C3CT1	149	tarde	1	2026-03-13 12:18:59.665208	2026-04-08 00:33:24.733019
52	C3CT2	149	tarde	1	2026-03-13 12:41:24.028427	2026-04-08 00:33:33.813715
48	C3DT1	149	tarde	1	2026-03-13 12:16:54.398157	2026-04-08 00:34:08.887236
49	C3DT2	149	tarde	1	2026-03-13 12:17:19.705758	2026-04-08 00:34:16.282608
17	C4T1	150	tarde	1	2026-03-13 11:53:06.518442	2026-04-08 00:36:48.195481
26	C4T3	150	tarde	1	2026-03-13 11:56:15.206124	2026-04-08 00:36:53.447775
212	1SPU-C	123	noche	1	2026-03-31 12:37:43.895215	2026-03-31 12:37:43.895216
213	1BHUM-A	124	noche	1	2026-03-31 12:37:43.907717	2026-03-31 12:37:43.907726
214	1BHUM-B	124	noche	1	2026-03-31 12:37:43.907727	2026-03-31 12:37:43.907727
215	1BHUM-C	124	noche	1	2026-03-31 12:37:43.907727	2026-03-31 12:37:43.907728
216	1SCS1-A	125	noche	1	2026-03-31 12:37:43.92216	2026-03-31 12:37:43.922169
217	1SCS1-B	125	noche	1	2026-03-31 12:37:43.92217	2026-03-31 12:37:43.922171
218	1SCS1-C	125	noche	1	2026-03-31 12:37:43.922171	2026-03-31 12:37:43.922172
219	1FCE-A	126	noche	1	2026-03-31 12:37:43.9375	2026-03-31 12:37:43.937503
220	1FCE-B	126	noche	1	2026-03-31 12:37:43.937503	2026-03-31 12:37:43.937504
221	1FCE-C	126	noche	1	2026-03-31 12:37:43.937504	2026-03-31 12:37:43.937505
222	1CECF-A	127	noche	1	2026-03-31 12:37:43.952116	2026-03-31 12:37:43.95212
223	1CECF-B	127	noche	1	2026-03-31 12:37:43.952121	2026-03-31 12:37:43.952121
224	1CECF-C	127	noche	1	2026-03-31 12:37:43.952122	2026-03-31 12:37:43.952122
225	1PPR1-A	128	noche	1	2026-03-31 12:37:43.966532	2026-03-31 12:37:43.966536
226	1PPR1-B	128	noche	1	2026-03-31 12:37:43.966536	2026-03-31 12:37:43.966537
227	1PPR1-C	128	noche	1	2026-03-31 12:37:43.966537	2026-03-31 12:37:43.966537
228	2PSCO-A	129	noche	1	2026-03-31 12:37:43.979367	2026-03-31 12:37:43.979372
229	2PSCO-B	129	noche	1	2026-03-31 12:37:43.979373	2026-03-31 12:37:43.979374
230	2UDI2-A	130	noche	1	2026-03-31 12:37:43.991387	2026-03-31 12:37:43.991389
231	2UDI2-B	130	noche	1	2026-03-31 12:37:43.991389	2026-03-31 12:37:43.99139
232	2INSA-A	131	noche	1	2026-03-31 12:37:44.005691	2026-03-31 12:37:44.005699
233	2INSA-B	131	noche	1	2026-03-31 12:37:44.0057	2026-03-31 12:37:44.0057
234	2SCS2-A	132	noche	1	2026-03-31 12:37:44.018827	2026-03-31 12:37:44.01883
235	2SCS2-B	132	noche	1	2026-03-31 12:37:44.018831	2026-03-31 12:37:44.018832
236	2BHUM2-A	133	noche	1	2026-03-31 12:37:44.031643	2026-03-31 12:37:44.031646
237	2BHUM2-B	133	noche	1	2026-03-31 12:37:44.031647	2026-03-31 12:37:44.031648
238	2BMAT-A	134	noche	1	2026-03-31 12:37:44.045757	2026-03-31 12:37:44.045761
239	2BMAT-B	134	noche	1	2026-03-31 12:37:44.045762	2026-03-31 12:37:44.045763
240	2FARE-A	135	noche	1	2026-03-31 12:37:44.057377	2026-03-31 12:37:44.05738
241	2FARE-B	135	noche	1	2026-03-31 12:37:44.05738	2026-03-31 12:37:44.057381
175	1FI1-A	90	noche	1	2026-03-31 00:59:08.282222	2026-03-31 00:59:08.282225
109	1INCOM-A	34	noche	1	2026-03-31 00:43:01.434302	2026-03-31 00:43:01.434306
110	1INCOM-B	34	noche	1	2026-03-31 00:43:01.434306	2026-03-31 00:43:01.434307
111	1SISP-A	35	noche	1	2026-03-31 00:43:01.439794	2026-03-31 00:43:01.439795
112	1SISP-B	35	noche	1	2026-03-31 00:43:01.439796	2026-03-31 00:43:01.439796
113	1ELECG-A	36	noche	1	2026-03-31 00:43:01.443142	2026-03-31 00:43:01.443144
114	1ELECG-B	36	noche	1	2026-03-31 00:43:01.443144	2026-03-31 00:43:01.443144
115	1ELEC1-A	37	noche	1	2026-03-31 00:43:01.446971	2026-03-31 00:43:01.446973
116	1ELEC1-B	37	noche	1	2026-03-31 00:43:01.446973	2026-03-31 00:43:01.446973
117	1TECD1-A	38	noche	1	2026-03-31 00:43:01.452162	2026-03-31 00:43:01.452164
118	1TECD1-B	38	noche	1	2026-03-31 00:43:01.452165	2026-03-31 00:43:01.452165
119	1LABM1-A	39	noche	1	2026-03-31 00:43:01.459565	2026-03-31 00:43:01.459567
120	1LABM1-B	39	noche	1	2026-03-31 00:43:01.459568	2026-03-31 00:43:01.459568
123	1INTFI-A	41	noche	1	2026-03-31 00:43:01.469763	2026-03-31 00:43:01.469765
124	1INTFI-B	41	noche	1	2026-03-31 00:43:01.469766	2026-03-31 00:43:01.469766
125	2DISES-A	42	noche	1	2026-03-31 00:43:01.474318	2026-03-31 00:43:01.47432
126	2DISES-B	42	noche	1	2026-03-31 00:43:01.474321	2026-03-31 00:43:01.474321
127	2MI1-A	43	noche	1	2026-03-31 00:43:01.479147	2026-03-31 00:43:01.479149
128	2MI1-B	43	noche	1	2026-03-31 00:43:01.479149	2026-03-31 00:43:01.479149
129	2ELE1-A	44	noche	1	2026-03-31 00:43:01.48557	2026-03-31 00:43:01.485572
130	2ELE1-B	44	noche	1	2026-03-31 00:43:01.485573	2026-03-31 00:43:01.485573
131	2TED2-A	45	noche	1	2026-03-31 00:43:01.490853	2026-03-31 00:43:01.490855
132	2TED2-B	45	noche	1	2026-03-31 00:43:01.490855	2026-03-31 00:43:01.490856
133	2LABM2-A	46	noche	1	2026-03-31 00:43:01.494367	2026-03-31 00:43:01.494369
134	2LABM2-B	46	noche	1	2026-03-31 00:43:01.494369	2026-03-31 00:43:01.494369
135	2ELEA-A	47	noche	1	2026-03-31 00:43:01.497839	2026-03-31 00:43:01.497841
136	2ELEA-B	47	noche	1	2026-03-31 00:43:01.497842	2026-03-31 00:43:01.497842
139	2ARS-A	49	noche	1	2026-03-31 00:43:01.509111	2026-03-31 00:43:01.509113
140	2ARS-B	49	noche	1	2026-03-31 00:43:01.509114	2026-03-31 00:43:01.509114
141	3TECAC-A	50	noche	1	2026-03-31 00:43:01.51238	2026-03-31 00:43:01.512381
142	3MIC2-A	51	noche	1	2026-03-31 00:43:01.516781	2026-03-31 00:43:01.516783
143	3ADFC-A	52	noche	1	2026-03-31 00:43:01.520906	2026-03-31 00:43:01.520907
144	3LABM3-A	53	noche	1	2026-03-31 00:43:01.52495	2026-03-31 00:43:01.524952
145	3SCOM-A	54	noche	1	2026-03-31 00:43:01.527881	2026-03-31 00:43:01.527883
146	3ELE3-A	55	noche	1	2026-03-31 00:43:01.531006	2026-03-31 00:43:01.531008
147	3EMP-A	56	noche	1	2026-03-31 00:43:01.532701	2026-03-31 00:43:01.532704
176	1QUI1-A	91	noche	1	2026-03-31 00:59:08.286159	2026-03-31 00:59:08.286162
177	1DITE-A	92	noche	1	2026-03-31 00:59:08.288984	2026-03-31 00:59:08.288986
178	1ALG-A	93	noche	1	2026-03-31 00:59:08.291809	2026-03-31 00:59:08.291812
179	1ORL-A	94	noche	1	2026-03-31 00:59:08.296379	2026-03-31 00:59:08.29638
180	1SEG1-A	95	noche	1	2026-03-31 00:59:08.29912	2026-03-31 00:59:08.299123
181	1INC1-A	96	noche	1	2026-03-31 00:59:08.302867	2026-03-31 00:59:08.30287
182	1HIG1-A	97	noche	1	2026-03-31 00:59:08.306198	2026-03-31 00:59:08.306201
33	C2CM2	148	mañana	1	2026-03-13 11:57:59.60538	2026-03-30 14:43:28.13126
9	C3AM1	149	mañana	1	2026-03-13 11:46:59.869433	2026-04-08 00:30:04.846155
10	C3AM2	149	mañana	1	2026-03-13 11:47:20.754878	2026-04-08 00:30:18.703498
11	C3BM1	149	mañana	1	2026-03-13 11:48:34.936484	2026-04-08 00:30:54.404181
12	C3BM2	149	mañana	1	2026-03-13 11:48:48.734603	2026-04-08 00:31:03.485376
13	C3CM1	149	mañana	1	2026-03-13 11:49:05.011508	2026-04-08 00:33:08.387458
14	C3CM2	149	mañana	1	2026-03-13 11:49:38.263231	2026-04-08 00:33:15.152573
34	C3DM1	149	mañana	1	2026-03-13 11:58:13.252403	2026-04-08 00:33:50.607849
35	C3DM2	149	mañana	1	2026-03-13 11:58:26.015824	2026-04-08 00:33:58.029076
183	1ANTF-A	98	noche	1	2026-03-31 00:59:08.309309	2026-03-31 00:59:08.309311
184	1COM1-A	99	noche	1	2026-03-31 00:59:08.312614	2026-03-31 00:59:08.312616
185	2FIS2-A	101	noche	1	2026-03-31 00:59:08.323485	2026-03-31 00:59:08.323488
186	2QUI2-A	102	noche	1	2026-03-31 00:59:08.327556	2026-03-31 00:59:08.327557
187	2AMAT-A	103	noche	1	2026-03-31 00:59:08.330284	2026-03-31 00:59:08.330287
188	2SEG2-A	104	noche	1	2026-03-31 00:59:08.335681	2026-03-31 00:59:08.335685
189	2HIG2-A	105	noche	1	2026-03-31 00:59:08.342163	2026-03-31 00:59:08.342166
190	2TECM-A	106	noche	1	2026-03-31 00:59:08.344883	2026-03-31 00:59:08.344885
191	2INC2-A	107	noche	1	2026-03-31 00:59:08.348229	2026-03-31 00:59:08.348231
192	2FORN-A	108	noche	1	2026-03-31 00:59:08.350423	2026-03-31 00:59:08.350424
193	2COM2-A	109	noche	1	2026-03-31 00:59:08.354841	2026-03-31 00:59:08.354843
194	3SCP-A	111	noche	1	2026-03-31 00:59:08.360907	2026-03-31 00:59:08.360909
195	3LELA-A	112	noche	1	2026-03-31 00:59:08.363996	2026-03-31 00:59:08.363997
196	3SAM-A	113	noche	1	2026-03-31 00:59:08.36645	2026-03-31 00:59:08.366451
197	3PSIL-A	114	noche	1	2026-03-31 00:59:08.370444	2026-03-31 00:59:08.370472
198	3SEG3-A	115	noche	1	2026-03-31 00:59:08.374259	2026-03-31 00:59:08.374261
199	3HIG3-A	116	noche	1	2026-03-31 00:59:08.376875	2026-03-31 00:59:08.376877
200	3ETP-A	117	noche	1	2026-03-31 00:59:08.379115	2026-03-31 00:59:08.379116
201	3COMA-A	118	noche	1	2026-03-31 00:59:08.381572	2026-03-31 00:59:08.381573
202	3ING3-A	119	noche	1	2026-03-31 00:59:08.383874	2026-03-31 00:59:08.383875
203	3PPR-A	120	noche	1	2026-03-31 00:59:08.385655	2026-03-31 00:59:08.38566
242	2CEAAM-A	136	noche	1	2026-03-31 12:37:44.069265	2026-03-31 12:37:44.069269
243	2CEAAM-B	136	noche	1	2026-03-31 12:37:44.06927	2026-03-31 12:37:44.06927
244	2PPR2-A	137	noche	1	2026-03-31 12:37:44.08321	2026-03-31 12:37:44.083213
245	2PPR2-B	137	noche	1	2026-03-31 12:37:44.083214	2026-03-31 12:37:44.083214
246	3ERSO-A	138	noche	1	2026-03-31 12:37:44.096517	2026-03-31 12:37:44.096521
247	3DLLA-A	139	noche	1	2026-03-31 12:37:44.105116	2026-03-31 12:37:44.105126
248	3INGT-A	140	noche	1	2026-03-31 12:37:44.113415	2026-03-31 12:37:44.113419
249	3OGIS-A	141	noche	1	2026-03-31 12:37:44.123361	2026-03-31 12:37:44.123366
250	3INEN-A	142	noche	1	2026-03-31 12:37:44.133248	2026-03-31 12:37:44.133255
251	3CESM-A	143	noche	1	2026-03-31 12:37:44.141031	2026-03-31 12:37:44.141034
252	3CENAD-A	144	noche	1	2026-03-31 12:37:44.15063	2026-03-31 12:37:44.150634
121	1ING1-A	100	noche	1	2026-03-31 00:43:01.464133	2026-04-07 23:47:04.306459
122	1ING1-B	100	noche	1	2026-03-31 00:43:01.464136	2026-04-07 23:47:04.306466
137	2ING2-A	110	noche	1	2026-03-31 00:43:01.504003	2026-04-07 23:47:04.306469
138	2ING2-B	110	noche	1	2026-03-31 00:43:01.504005	2026-04-07 23:47:04.306471
253	3PPR3-A	120	noche	1	2026-03-31 12:37:44.154896	2026-04-07 23:47:04.306473
63	C4M1	150	mañana	1	2026-03-13 12:53:50.771912	2026-04-08 00:35:01.376833
64	C4M2	150	mañana	1	2026-03-13 12:54:06.621357	2026-04-08 00:35:06.989055
65	C4M3	150	mañana	1	2026-03-13 12:54:19.659386	2026-04-08 00:35:15.993899
43	C4M4	150	mañana	1	2026-03-13 12:12:20.008877	2026-04-08 00:35:36.831725
50	C4M6	150	mañana	1	2026-03-13 12:18:42.249691	2026-04-08 00:35:44.219391
66	C4M7	150	mañana	1	2026-03-13 12:54:33.484177	2026-04-08 00:35:54.693797
67	C4M8	150	mañana	1	2026-03-13 12:54:46.050951	2026-04-08 00:36:02.217054
53	C4M9	150	mañana	1	2026-03-13 12:41:42.039968	2026-04-08 00:36:08.462169
54	C4M10	150	mañana	1	2026-03-13 12:41:59.189775	2026-04-08 00:36:30.238607
42	C4M11	150	mañana	1	2026-03-13 12:12:06.168522	2026-04-08 00:36:36.857833
55	C2DT1	148	tarde	1	2026-03-13 12:49:11.035101	2026-03-30 14:43:28.13126
56	C2DT2	148	tarde	1	2026-03-13 12:49:27.636827	2026-03-30 14:43:28.131261
59	C2CT1	148	tarde	1	2026-03-13 12:50:16.629804	2026-03-30 14:43:28.131261
60	C2CT2	148	tarde	1	2026-03-13 12:50:28.914987	2026-03-30 14:43:28.131261
\.


--
-- Data for Name: config_turnos; Type: TABLE DATA; Schema: public; Owner: horarios_user
--

COPY public.config_turnos (id, departamento_id, turno, dia_semana, hora_inicio, secuencia) FROM stdin;
1	1	mañana	lunes	07:45	[{"id": 1, "num": 1, "type": "mod", "duracion": 40}, {"id": 2, "num": 2, "type": "mod", "duracion": 40}, {"dur": 10, "type": "rec"}, {"id": 3, "num": 3, "type": "mod", "duracion": 40}, {"id": 4, "num": 4, "type": "mod", "duracion": 40}, {"dur": 10, "type": "rec"}, {"id": 5, "num": 5, "type": "mod", "duracion": 40}, {"id": 6, "num": 6, "type": "mod", "duracion": 40}, {"dur": 5, "type": "rec"}, {"id": 7, "num": 7, "type": "mod", "duracion": 40}]
2	10	noche	todos	18:35	[{"id": 15, "num": 8, "type": "mod", "duracion": 40}, {"id": 16, "num": 9, "type": "mod", "duracion": 40}, {"id": 17, "num": 1, "type": "mod", "duracion": 40}, {"dur": 5, "type": "rec"}, {"id": 18, "num": 2, "type": "mod", "duracion": 40}, {"dur": 10, "type": "rec"}, {"id": 19, "num": 3, "type": "mod", "duracion": 40}, {"id": 20, "num": 4, "type": "mod", "duracion": 40}, {"dur": 10, "type": "rec"}, {"id": 21, "num": 5, "type": "mod", "duracion": 40}, {"id": 22, "num": 6, "type": "mod", "duracion": 40}]
\.


--
-- Data for Name: departamentos; Type: TABLE DATA; Schema: public; Owner: horarios_user
--

COPY public.departamentos (id, nombre, codigo, descripcion, activo, created_at, updated_at, institucion_id) FROM stdin;
1	Tecnología de la Información y Comunicaciones	TICS	Tecnología de la Información y Comunicaciones	1	2026-03-12 14:24:49.749337	2026-03-12 14:24:49.74934	2
8	TÉCNICO SUPERIOR EN ENFERMERÍA - 756/2011	Enfermería		1	2026-03-30 14:47:26.027291	2026-03-30 14:47:26.027293	1
9	TÉCNICO SUPERIOR EN HIGIENE Y SEGURIDAD EN EL TRABAJO - 3012/2002	Higiene y Seguridad		1	2026-03-30 14:48:12.175015	2026-03-30 14:48:12.175018	1
10	TÉCNICO SUPERIOR EN TÉCNICAS DIGITALES - 2019/1983	Tecnico en Tecnicas Digitales		1	2026-03-30 14:49:09.011866	2026-03-30 14:49:09.011871	1
\.


--
-- Data for Name: departamientos; Type: TABLE DATA; Schema: public; Owner: horarios_user
--

COPY public.departamientos (id, nombre, codigo, descripcion, activo, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: docente_departamento; Type: TABLE DATA; Schema: public; Owner: horarios_user
--

COPY public.docente_departamento (docente_id, departamento_id) FROM stdin;
15	10
16	10
17	9
17	10
\.


--
-- Data for Name: docente_institucion; Type: TABLE DATA; Schema: public; Owner: horarios_user
--

COPY public.docente_institucion (docente_id, institucion_id) FROM stdin;
3	2
4	2
5	2
6	2
7	2
8	2
9	2
10	2
11	2
12	2
13	2
1	2
15	1
16	1
17	1
\.


--
-- Data for Name: docentes; Type: TABLE DATA; Schema: public; Owner: horarios_user
--

COPY public.docentes (id, apellido, nombre, email, telefono, activo, created_at, updated_at, institucion_id) FROM stdin;
3	DUNN	Andrea			1	2026-03-13 00:19:32.029142	2026-03-13 00:19:32.029145	2
4	GAIBAZZI				1	2026-03-13 00:19:50.320896	2026-03-13 00:19:50.3209	2
5	BOZALONGO				1	2026-03-13 00:20:01.494786	2026-03-13 00:20:01.494789	2
6	SALVADOR				1	2026-03-13 00:20:13.327505	2026-03-13 00:20:13.32751	2
7	TABOADA				1	2026-03-13 00:20:30.743417	2026-03-13 00:20:30.743421	2
8	SPEERLI				1	2026-03-13 00:20:41.453331	2026-03-13 00:20:41.453335	2
9	OTTAVIANO				1	2026-03-13 00:20:50.201982	2026-03-13 00:20:50.201986	2
10	ATTARA				1	2026-03-13 00:21:03.193832	2026-03-13 00:21:03.193834	2
11	CRISTALLI				1	2026-03-13 00:21:33.600759	2026-03-13 00:21:33.600762	2
12	AUDISIO				1	2026-03-13 00:21:47.909121	2026-03-13 00:21:47.909126	2
13	LOPEZ				1	2026-03-13 00:22:07.163712	2026-03-13 00:22:07.163716	2
1	BOLIG	Pedro Augusto	pedro.bolig@gmail.com	3415782828	1	2026-03-12 14:23:30.89774	2026-03-13 10:47:58.485873	2
15	Bolig	Pedro	pedro.bolig@gmail.com	3415782828	1	2026-04-10 15:15:03.169446	2026-04-10 15:15:03.169449	\N
16	Baró	German	gbaro@unr.edu.ar	3415 85-6555	1	2026-04-10 15:26:12.601381	2026-04-10 15:26:12.601386	\N
17	Genovesi	Daniela	daniela@genovesi.com.ar	3416 418486	1	2026-04-10 15:28:37.842405	2026-04-10 15:28:37.842409	\N
\.


--
-- Data for Name: instituciones; Type: TABLE DATA; Schema: public; Owner: horarios_user
--

COPY public.instituciones (id, nombre, codigo, descripcion, logo_url, activo, created_at, updated_at) FROM stdin;
1	Instituto Superior de Educación Técnica N° 57	DEFAULT	Institución creada automáticamente para agrupar datos existentes.		1	2026-03-29 16:00:28.932333	2026-03-30 01:44:45.093586
2	Superior de Comercio	SC	Institución principal		1	2026-03-29 23:52:04.42729	2026-03-30 12:10:06.972546
\.


--
-- Data for Name: materias; Type: TABLE DATA; Schema: public; Owner: horarios_user
--

COPY public.materias (id, nombre, codigo, departamento_id, activo, created_at, codigo_interno, carga_horaria_modulos, correlativas, anio) FROM stdin;
121	COMUNICACIÓN	1COMU	8	1	2026-03-31 12:37:43.838134	1COMU	3	[]	1
122	UNIDAD DE DEFINICIÓN INSTITUCIONAL I	1UDI	8	1	2026-03-31 12:37:43.855598	1UDI	3	[]	1
123	SALUD PÚBLICA	1SPU	8	1	2026-03-31 12:37:43.875197	1SPU	3	[]	1
124	BIOLOGÍA HUMANA	1BHUM	8	1	2026-03-31 12:37:43.891502	1BHUM	3	[]	1
125	SUJETO, CULTURA Y SOCIEDAD I	1SCS1	8	1	2026-03-31 12:37:43.906524	1SCS1	3	[]	1
126	FUNDAMENTOS DEL CUIDADO EN ENFERMERÍA	1FCE	8	1	2026-03-31 12:37:43.920318	1FCE	4	[]	1
127	CUIDADOS DE ENFERMERÍA EN LA COMUNIDAD Y EN LA FAMILIA	1CECF	8	1	2026-03-31 12:37:43.935989	1CECF	5	[]	1
128	PRÁCTICA PROFESIONALIZANTE I	1PPR1	8	1	2026-03-31 12:37:43.950395	1PPR1	13	[]	1
47	ELECTRÓNICA ANALÓGICA	2ELEA	10	1	2026-03-31 00:43:01.493703	2ELEA	4	["1ELECG", "1LABM1"]	2
48	INGLÉS II	2ING2	10	1	2026-03-31 00:43:01.497265	2ING2	3	["1ING1"]	2
49	ANAL. REALIDAD SOCIAL	2ARS	10	1	2026-03-31 00:43:01.5032	2ARS	2	[]	2
50	TECNOL. COMPONENTES APLIC. A COMPUTACIÓN	3TECAC	10	1	2026-03-31 00:43:01.508502	3TECAC	4	["2DISES"]	3
51	MICROPROCESADORES II	3MIC2	10	1	2026-03-31 00:43:01.511655	3MIC2	5	["2MI1"]	3
52	ANAL. Y DETECCIÓN DE FALLAS EN COMPUTAD.	3ADFC	10	1	2026-03-31 00:43:01.51547	3ADFC	4	["2ELEA", "2ELE1", "2LABM2", "2MI1", "2TED2"]	3
53	LABORATORIO DE MEDICIONES III	3LABM3	10	1	2026-03-31 00:43:01.520324	3LABM3	4	["2ELE1", "2LABM2", "2TED2"]	3
54	SISTEMAS DE COMUNICACIÓN	3SCOM	10	1	2026-03-31 00:43:01.524344	3SCOM	4	[]	3
55	ELECTRÓNICA III	3ELE3	10	1	2026-03-31 00:43:01.527363	3ELE3	4	["2ELE1", "2LABM2"]	3
56	ÉTICA Y MORAL PROFESIONAL	3EMP	10	1	2026-03-31 00:43:01.530522	3EMP	3	[]	3
129	PROBLEMÁTICAS SOCIO CONTEMPORÁNEAS	2PSCO	8	1	2026-03-31 12:37:43.964887	2PSCO	3	[]	2
130	UNIDAD DE DEFINICIÓN INSTITUCIONAL II	2UDI2	8	1	2026-03-31 12:37:43.97632	2UDI2	3	[]	2
131	INFORMÁTICA EN SALUD	2INSA	8	1	2026-03-31 12:37:43.990441	2INSA	4	[]	2
132	SUJETO, CULTURA Y SOCIEDAD II	2SCS2	8	1	2026-03-31 12:37:44.00348	2SCS2	3	["1SCS1"]	2
133	BIOLOGÍA HUMANA II	2BHUM2	8	1	2026-03-31 12:37:44.017007	2BHUM2	3	["1BHUM"]	2
134	BIOSEGURIDAD Y MEDIO AMBIENTE EN EL TRABAJO	2BMAT	8	1	2026-03-31 12:37:44.030011	2BMAT	4	[]	2
135	FARMACOLOGÍA EN ENFERMERÍA	2FARE	8	1	2026-03-31 12:37:44.041571	2FARE	3	[]	2
136	CUIDADOS DE ENFERMERÍA A LOS ADULTOS Y A LOS ADULTOS MAYORES	2CEAAM	8	1	2026-03-31 12:37:44.056327	2CEAAM	5	["1CECF", "1FCE"]	2
137	PRÁCTICA PROFESIONALIZANTE II	2PPR2	8	1	2026-03-31 12:37:44.067558	2PPR2	13	["1PPR1"]	2
138	ÉTICA Y RESPONSABILIDAD SOCIAL	3ERSO	8	1	2026-03-31 12:37:44.08178	3ERSO	3	[]	3
139	DERECHO Y LEGISLACIÓN LABORAL	3DLLA	8	1	2026-03-31 12:37:44.092426	3DLLA	3	[]	3
140	INGLÉS TÉCNICO	3INGT	8	1	2026-03-31 12:37:44.103876	3INGT	4	[]	3
141	ORGANIZACIÓN Y GESTIÓN EN INSTITUCIONES DE SALUD	3OGIS	8	1	2026-03-31 12:37:44.111288	3OGIS	3	[]	3
34	INTRODUCCIÓN A LA COMPUTACIÓN	1INCOM	10	1	2026-03-31 00:43:01.42608	1INCOM	3	[]	1
35	SISTEMA DE PROGRAMACIÓN	1SISP	10	1	2026-03-31 00:43:01.432104	1SISP	4	[]	1
36	ELECTROTECNIA GENERAL	1ELECG	10	1	2026-03-31 00:43:01.439204	1ELECG	4	[]	1
37	ELECTRÓNICA I	1ELEC1	10	1	2026-03-31 00:43:01.442607	1ELEC1	4	[]	1
38	TÉCNICAS DIGITALES I	1TECD1	10	1	2026-03-31 00:43:01.446278	1TECD1	4	[]	1
39	LABORATORIO DE MEDICIONES I	1LABM1	10	1	2026-03-31 00:43:01.450572	1LABM1	4	[]	1
40	INGLÉS I	1ING1	10	1	2026-03-31 00:43:01.458973	1ING1	3	[]	1
41	INTRODUCCIÓN A LA FILOSOFÍA	1INTFI	10	1	2026-03-31 00:43:01.463405	1INTFI	2	[]	1
42	DISP. ENTRADA/SALIDA	2DISES	10	1	2026-03-31 00:43:01.468944	2DISES	4	["1INCOM"]	2
43	MICROPROCESADORES I	2MI1	10	1	2026-03-31 00:43:01.473637	2MI1	4	["1ELECG", "1LABM1", "1SISP", "1TECD1"]	2
44	ELECTRÓNICA II	2ELE1	10	1	2026-03-31 00:43:01.478504	2ELE1	4	["1ELEC1", "1ELECG", "1LABM1"]	2
45	TÉCNICAS DIGITALES II	2TED2	10	1	2026-03-31 00:43:01.484604	2TED2	4	["1ELECG", "1TECD1"]	2
46	LABORATORIO DE MEDICIONES II	2LABM2	10	1	2026-03-31 00:43:01.490184	2LABM2	4	["1ELEC1", "1LABM1"]	2
142	INVESTIGACIÓN EN ENFERMERÍA	3INEN	8	1	2026-03-31 12:37:44.121852	3INEN	3	[]	3
90	FÍSICA I	1FI1	9	1	2026-03-31 00:59:08.276438	1FI1	3	[]	1
91	QUÍMICA I	1QUI1	9	1	2026-03-31 00:59:08.28129	1QUI1	3	[]	1
92	DIBUJO TÉCNICO	1DITE	9	1	2026-03-31 00:59:08.284957	1DITE	2	[]	1
93	ÁLGEBRA	1ALG	9	1	2026-03-31 00:59:08.288437	1ALG	3	[]	1
94	ORGANIZACIÓN LABORAL	1ORL	9	1	2026-03-31 00:59:08.291005	1ORL	2	[]	1
95	SEGURIDAD I	1SEG1	9	1	2026-03-31 00:59:08.295877	1SEG1	4	[]	1
96	INCENDIO I	1INC1	9	1	2026-03-31 00:59:08.298325	1INC1	4	[]	1
97	HIGIENE I	1HIG1	9	1	2026-03-31 00:59:08.302089	1HIG1	3	[]	1
98	ANTROPOLOGÍA FILOSÓFICA	1ANTF	9	1	2026-03-31 00:59:08.305373	1ANTF	2	[]	1
99	COMPUTACIÓN I	1COM1	9	1	2026-03-31 00:59:08.308816	1COM1	2	[]	1
100	INGLÉS I	1ING1	9	1	2026-03-31 00:59:08.311939	1ING1	2	[]	1
101	FÍSICA II	2FIS2	9	1	2026-03-31 00:59:08.316678	2FIS2	3	["1ALG", "1FI1"]	2
102	QUÍMICA II	2QUI2	9	1	2026-03-31 00:59:08.322661	2QUI2	3	["1QUI1"]	2
103	ANÁLISIS MATEMÁTICO	2AMAT	9	1	2026-03-31 00:59:08.326693	2AMAT	3	["1ALG"]	2
104	SEGURIDAD II	2SEG2	9	1	2026-03-31 00:59:08.329575	2SEG2	4	["1SEG1"]	2
105	HIGIENE II	2HIG2	9	1	2026-03-31 00:59:08.334236	2HIG2	4	["1HIG1"]	2
106	TECNOLOGÍA DE LOS MATERIALES	2TECM	9	1	2026-03-31 00:59:08.341344	2TECM	3	["1FI1", "1QUI1"]	2
107	INCENDIO II	2INC2	9	1	2026-03-31 00:59:08.344421	2INC2	4	["1INC1"]	2
108	FORMACIÓN NACIONAL	2FORN	9	1	2026-03-31 00:59:08.347568	2FORN	2	[]	2
109	COMPUTACIÓN II	2COM2	9	1	2026-03-31 00:59:08.349999	2COM2	2	["1COM1"]	2
110	INGLÉS II	2ING2	9	1	2026-03-31 00:59:08.354271	2ING2	2	["1ING1"]	2
111	SELECCIÓN Y CAPACITACIÓN DE PERSONAL	3SCP	9	1	2026-03-31 00:59:08.357772	3SCP	3	[]	3
112	LEGISLACIÓN LABORAL	3LELA	9	1	2026-03-31 00:59:08.360209	3LELA	3	[]	3
113	SANEAMIENTO AMBIENTAL	3SAM	9	1	2026-03-31 00:59:08.363386	3SAM	4	["2QUI2"]	3
114	PSICOLOGÍA LABORAL	3PSIL	9	1	2026-03-31 00:59:08.365926	3PSIL	3	[]	3
115	SEGURIDAD III	3SEG3	9	1	2026-03-31 00:59:08.369659	3SEG3	4	["2SEG2"]	3
116	HIGIENE III	3HIG3	9	1	2026-03-31 00:59:08.373423	3HIG3	4	["2HIG2"]	3
117	ÉTICA PROFESIONAL	3ETP	9	1	2026-03-31 00:59:08.376457	3ETP	2	[]	3
118	COMPUTACIÓN APLICADA	3COMA	9	1	2026-03-31 00:59:08.378641	3COMA	2	["2COM2"]	3
119	INGLÉS III	3ING3	9	1	2026-03-31 00:59:08.381087	3ING3	2	["2ING2"]	3
120	PRÁCTICA PROFESIONAL	3PPR	9	1	2026-03-31 00:59:08.383415	3PPR	3	["3COMA", "3ETP", "3HIG3", "3ING3", "3LELA", "3PSIL", "3SAM"]	3
143	CUIDADOS DE ENFERMERÍA EN SALUD MENTAL	3CESM	8	1	2026-03-31 12:37:44.131406	3CESM	4	[]	3
144	CUIDADOS DE ENFERMERÍA AL NIÑO Y AL ADOLESCENTE	3CENAD	8	1	2026-03-31 12:37:44.139971	3CENAD	6	["2CEAAM"]	3
145	PRÁCTICA PROFESIONALIZANTE III	3PPR3	8	1	2026-03-31 12:37:44.148832	3PPR3	15	["2PPR2"]	3
146	Informática 1	INFO1	1	1	2026-04-07 00:40:48.375576	INFO1	0	[]	1
148	Informática 2	INFO2	1	1	2026-04-07 00:44:30.668173	INFO2	0	[]	1
149	Informática 3	INFO3	1	1	2026-04-07 00:44:54.627278	INFO3	0	[]	1
150	Informática 4	INFO4	1	1	2026-04-07 00:45:08.43762	INFO4	0	[]	1
\.


--
-- Data for Name: modulos; Type: TABLE DATA; Schema: public; Owner: horarios_user
--

COPY public.modulos (id, nombre, etiqueta, icono) FROM stdin;
1	dashboard	Dashboard	📊
2	editor	Editor de Horarios	📅
3	docentes	Docentes	👥
4	departamentos	Departamentos	🏢
5	materias	Materias	📖
6	aulas	Aulas	🏫
7	comisiones	Comisiones	📋
8	reportes	Reportes	📈
9	cargos	Cargos	💼
10	cargo_asignaciones	Asignación de Cargos	📌
11	calendario	Calendario	🗓️
12	pad	Planificación (PAD)	📝
13	permisos	Gestión de Accesos	🔐
\.


--
-- Data for Name: modulos_horario; Type: TABLE DATA; Schema: public; Owner: horarios_user
--

COPY public.modulos_horario (id, numero, hora_inicio, hora_fin, turno, activo) FROM stdin;
1	1	07:45	08:25	mañana	1
2	2	08:25	09:05	mañana	1
3	3	09:15	09:55	mañana	1
4	4	09:55	10:35	mañana	1
5	5	10:45	11:25	mañana	1
6	6	11:25	12:05	mañana	1
7	7	12:10	12:50	mañana	1
8	1	13:30	14:10	tarde	1
9	2	14:10	14:50	tarde	1
10	3	15:00	15:40	tarde	1
11	4	15:40	16:20	tarde	1
12	5	16:30	17:10	tarde	1
13	6	17:10	17:50	tarde	1
14	7	17:55	18:35	tarde	1
17	1	20:00	20:40	noche	1
18	2	20:40	21:20	noche	1
19	3	21:30	22:10	noche	1
20	4	22:10	22:50	noche	1
21	5	23:00	23:40	noche	1
22	6	23:40	00:20	noche	1
15	8	18:35	19:15	noche	1
16	9	19:15	19:55	noche	1
\.


--
-- Data for Name: notas_adhesivas; Type: TABLE DATA; Schema: public; Owner: horarios_user
--

COPY public.notas_adhesivas (id, calendario_id, texto, color, created_at) FROM stdin;
1	1	hola mundo www.google.com.ar	#ff7eb9	2026-03-15 03:53:54.352566
\.


--
-- Data for Name: permisos; Type: TABLE DATA; Schema: public; Owner: horarios_user
--

COPY public.permisos (id, rol_id, modulo_id, nivel) FROM stdin;
1	1	1	edicion
2	1	2	edicion
3	1	3	edicion
4	1	4	edicion
5	1	5	edicion
6	1	6	edicion
7	1	7	edicion
8	1	8	edicion
9	1	9	edicion
10	1	10	edicion
11	1	11	edicion
12	1	12	edicion
13	1	13	edicion
14	4	1	lectura
15	4	2	edicion
16	4	3	edicion
17	4	4	edicion
18	4	5	edicion
19	4	6	edicion
20	4	7	edicion
21	4	8	edicion
22	4	9	edicion
23	4	10	edicion
24	4	11	edicion
25	4	12	ninguno
26	4	13	ninguno
27	3	1	ninguno
28	3	2	lectura
29	3	3	ninguno
30	3	4	ninguno
31	3	5	ninguno
32	3	6	ninguno
33	3	7	ninguno
34	3	8	ninguno
35	3	9	ninguno
36	3	10	ninguno
37	3	11	ninguno
38	3	12	ninguno
39	3	13	ninguno
40	6	1	edicion
41	6	2	edicion
42	6	3	edicion
43	6	4	edicion
44	6	5	edicion
45	6	6	edicion
46	6	7	edicion
47	6	8	edicion
48	6	9	edicion
49	6	10	edicion
50	6	11	edicion
51	6	12	edicion
52	6	13	edicion
53	8	1	ninguno
54	8	2	lectura
55	8	3	ninguno
56	8	4	ninguno
57	8	5	ninguno
58	8	6	ninguno
59	8	7	ninguno
60	8	8	ninguno
61	8	9	ninguno
62	8	10	ninguno
63	8	11	ninguno
64	8	12	ninguno
65	8	13	ninguno
66	7	1	lectura
67	7	2	lectura
68	7	3	ninguno
69	7	4	lectura
70	7	5	lectura
71	7	6	lectura
72	7	7	lectura
73	7	8	ninguno
74	7	9	ninguno
75	7	10	ninguno
76	7	11	ninguno
77	7	12	ninguno
78	7	13	ninguno
\.


--
-- Data for Name: planificaciones; Type: TABLE DATA; Schema: public; Owner: horarios_user
--

COPY public.planificaciones (id, materia_id, docente_id, comision_id, anio_lectivo, jurisdiccion, instituto, carrera, anio_cursada, modalidad, carga_horaria, marco_curricular, correlatividades, normativa, unidades, fichas, cronograma, evaluacion, bibliografia, practica_profesionalizante, firmas, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: recreos_excluidos; Type: TABLE DATA; Schema: public; Owner: horarios_user
--

COPY public.recreos_excluidos (id, departamento_id, dia_semana, modulo_id_anterior) FROM stdin;
11	1	lunes	2
12	1	lunes	2
13	1	lunes	2
14	1	lunes	2
15	1	lunes	2
16	1	lunes	2
17	1	lunes	2
18	1	lunes	2
19	1	lunes	2
20	1	lunes	2
21	1	lunes	2
22	1	lunes	2
23	1	lunes	2
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: horarios_user
--

COPY public.roles (id, nombre, descripcion, institucion_id) FROM stdin;
1	directivo	Acceso total al sistema	1
2	docente	Acceso a PAD y horarios	1
3	alumno	Acceso a consulta de horarios	1
4	administracion	Gestión administrativa de la institución	1
6	directivo	\N	2
7	docente	\N	2
8	estudiante	\N	2
9	administracion	\N	2
\.


--
-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: horarios_user
--

COPY public.usuarios (id, username, password_hash, rol, activo, created_at, updated_at, institucion_id, rol_id) FROM stdin;
1	admin	$pbkdf2-sha256$29000$O8e49/4fA4DQei9FSCllbA$/CMpygE85f1dUOayrqIuj61mX8CrpZXr1pf3Bm8pQeI	directivo	1	2026-03-12 12:44:23.936002	2026-04-09 12:57:13.663035	2	1
\.


--
-- Name: asignaciones_id_seq; Type: SEQUENCE SET; Schema: public; Owner: horarios_user
--

SELECT pg_catalog.setval('public.asignaciones_id_seq', 175, true);


--
-- Name: aulas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: horarios_user
--

SELECT pg_catalog.setval('public.aulas_id_seq', 15, true);


--
-- Name: calendario_categorias_id_seq; Type: SEQUENCE SET; Schema: public; Owner: horarios_user
--

SELECT pg_catalog.setval('public.calendario_categorias_id_seq', 18, true);


--
-- Name: calendario_eventos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: horarios_user
--

SELECT pg_catalog.setval('public.calendario_eventos_id_seq', 621, true);


--
-- Name: calendarios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: horarios_user
--

SELECT pg_catalog.setval('public.calendarios_id_seq', 4, true);


--
-- Name: cargo_asignaciones_id_seq; Type: SEQUENCE SET; Schema: public; Owner: horarios_user
--

SELECT pg_catalog.setval('public.cargo_asignaciones_id_seq', 3, true);


--
-- Name: cargo_horarios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: horarios_user
--

SELECT pg_catalog.setval('public.cargo_horarios_id_seq', 31, true);


--
-- Name: cargos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: horarios_user
--

SELECT pg_catalog.setval('public.cargos_id_seq', 1, true);


--
-- Name: comisiones_id_seq; Type: SEQUENCE SET; Schema: public; Owner: horarios_user
--

SELECT pg_catalog.setval('public.comisiones_id_seq', 260, true);


--
-- Name: config_turnos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: horarios_user
--

SELECT pg_catalog.setval('public.config_turnos_id_seq', 2, true);


--
-- Name: departamentos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: horarios_user
--

SELECT pg_catalog.setval('public.departamentos_id_seq', 10, true);


--
-- Name: departamientos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: horarios_user
--

SELECT pg_catalog.setval('public.departamientos_id_seq', 1, false);


--
-- Name: docentes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: horarios_user
--

SELECT pg_catalog.setval('public.docentes_id_seq', 17, true);


--
-- Name: instituciones_id_seq; Type: SEQUENCE SET; Schema: public; Owner: horarios_user
--

SELECT pg_catalog.setval('public.instituciones_id_seq', 2, true);


--
-- Name: materias_id_seq; Type: SEQUENCE SET; Schema: public; Owner: horarios_user
--

SELECT pg_catalog.setval('public.materias_id_seq', 150, true);


--
-- Name: modulos_horario_id_seq; Type: SEQUENCE SET; Schema: public; Owner: horarios_user
--

SELECT pg_catalog.setval('public.modulos_horario_id_seq', 22, true);


--
-- Name: modulos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: horarios_user
--

SELECT pg_catalog.setval('public.modulos_id_seq', 13, true);


--
-- Name: notas_adhesivas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: horarios_user
--

SELECT pg_catalog.setval('public.notas_adhesivas_id_seq', 5, true);


--
-- Name: permisos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: horarios_user
--

SELECT pg_catalog.setval('public.permisos_id_seq', 78, true);


--
-- Name: planificaciones_id_seq; Type: SEQUENCE SET; Schema: public; Owner: horarios_user
--

SELECT pg_catalog.setval('public.planificaciones_id_seq', 1, false);


--
-- Name: recreos_excluidos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: horarios_user
--

SELECT pg_catalog.setval('public.recreos_excluidos_id_seq', 23, true);


--
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: horarios_user
--

SELECT pg_catalog.setval('public.roles_id_seq', 9, true);


--
-- Name: usuarios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: horarios_user
--

SELECT pg_catalog.setval('public.usuarios_id_seq', 1, true);


--
-- Name: asignaciones asignaciones_pkey; Type: CONSTRAINT; Schema: public; Owner: horarios_user
--

ALTER TABLE ONLY public.asignaciones
    ADD CONSTRAINT asignaciones_pkey PRIMARY KEY (id);


--
-- Name: aula_departamento aula_departamento_pkey; Type: CONSTRAINT; Schema: public; Owner: horarios_user
--

ALTER TABLE ONLY public.aula_departamento
    ADD CONSTRAINT aula_departamento_pkey PRIMARY KEY (aula_id, departamento_id);


--
-- Name: aulas aulas_pkey; Type: CONSTRAINT; Schema: public; Owner: horarios_user
--

ALTER TABLE ONLY public.aulas
    ADD CONSTRAINT aulas_pkey PRIMARY KEY (id);


--
-- Name: calendario_categorias calendario_categorias_pkey; Type: CONSTRAINT; Schema: public; Owner: horarios_user
--

ALTER TABLE ONLY public.calendario_categorias
    ADD CONSTRAINT calendario_categorias_pkey PRIMARY KEY (id);


--
-- Name: calendario_eventos calendario_eventos_pkey; Type: CONSTRAINT; Schema: public; Owner: horarios_user
--

ALTER TABLE ONLY public.calendario_eventos
    ADD CONSTRAINT calendario_eventos_pkey PRIMARY KEY (id);


--
-- Name: calendarios calendarios_pkey; Type: CONSTRAINT; Schema: public; Owner: horarios_user
--

ALTER TABLE ONLY public.calendarios
    ADD CONSTRAINT calendarios_pkey PRIMARY KEY (id);


--
-- Name: cargo_asignaciones cargo_asignaciones_pkey; Type: CONSTRAINT; Schema: public; Owner: horarios_user
--

ALTER TABLE ONLY public.cargo_asignaciones
    ADD CONSTRAINT cargo_asignaciones_pkey PRIMARY KEY (id);


--
-- Name: cargo_horarios cargo_horarios_pkey; Type: CONSTRAINT; Schema: public; Owner: horarios_user
--

ALTER TABLE ONLY public.cargo_horarios
    ADD CONSTRAINT cargo_horarios_pkey PRIMARY KEY (id);


--
-- Name: cargos cargos_pkey; Type: CONSTRAINT; Schema: public; Owner: horarios_user
--

ALTER TABLE ONLY public.cargos
    ADD CONSTRAINT cargos_pkey PRIMARY KEY (id);


--
-- Name: comisiones comisiones_pkey; Type: CONSTRAINT; Schema: public; Owner: horarios_user
--

ALTER TABLE ONLY public.comisiones
    ADD CONSTRAINT comisiones_pkey PRIMARY KEY (id);


--
-- Name: config_turnos config_turnos_departamento_id_turno_dia_semana_key; Type: CONSTRAINT; Schema: public; Owner: horarios_user
--

ALTER TABLE ONLY public.config_turnos
    ADD CONSTRAINT config_turnos_departamento_id_turno_dia_semana_key UNIQUE (departamento_id, turno, dia_semana);


--
-- Name: config_turnos config_turnos_pkey; Type: CONSTRAINT; Schema: public; Owner: horarios_user
--

ALTER TABLE ONLY public.config_turnos
    ADD CONSTRAINT config_turnos_pkey PRIMARY KEY (id);


--
-- Name: departamentos departamentos_pkey; Type: CONSTRAINT; Schema: public; Owner: horarios_user
--

ALTER TABLE ONLY public.departamentos
    ADD CONSTRAINT departamentos_pkey PRIMARY KEY (id);


--
-- Name: departamientos departamientos_pkey; Type: CONSTRAINT; Schema: public; Owner: horarios_user
--

ALTER TABLE ONLY public.departamientos
    ADD CONSTRAINT departamientos_pkey PRIMARY KEY (id);


--
-- Name: docente_departamento docente_departamento_pkey; Type: CONSTRAINT; Schema: public; Owner: horarios_user
--

ALTER TABLE ONLY public.docente_departamento
    ADD CONSTRAINT docente_departamento_pkey PRIMARY KEY (docente_id, departamento_id);


--
-- Name: docente_institucion docente_institucion_pkey; Type: CONSTRAINT; Schema: public; Owner: horarios_user
--

ALTER TABLE ONLY public.docente_institucion
    ADD CONSTRAINT docente_institucion_pkey PRIMARY KEY (docente_id, institucion_id);


--
-- Name: docentes docentes_pkey; Type: CONSTRAINT; Schema: public; Owner: horarios_user
--

ALTER TABLE ONLY public.docentes
    ADD CONSTRAINT docentes_pkey PRIMARY KEY (id);


--
-- Name: instituciones instituciones_pkey; Type: CONSTRAINT; Schema: public; Owner: horarios_user
--

ALTER TABLE ONLY public.instituciones
    ADD CONSTRAINT instituciones_pkey PRIMARY KEY (id);


--
-- Name: materias materias_pkey; Type: CONSTRAINT; Schema: public; Owner: horarios_user
--

ALTER TABLE ONLY public.materias
    ADD CONSTRAINT materias_pkey PRIMARY KEY (id);


--
-- Name: modulos_horario modulos_horario_pkey; Type: CONSTRAINT; Schema: public; Owner: horarios_user
--

ALTER TABLE ONLY public.modulos_horario
    ADD CONSTRAINT modulos_horario_pkey PRIMARY KEY (id);


--
-- Name: modulos modulos_pkey; Type: CONSTRAINT; Schema: public; Owner: horarios_user
--

ALTER TABLE ONLY public.modulos
    ADD CONSTRAINT modulos_pkey PRIMARY KEY (id);


--
-- Name: notas_adhesivas notas_adhesivas_pkey; Type: CONSTRAINT; Schema: public; Owner: horarios_user
--

ALTER TABLE ONLY public.notas_adhesivas
    ADD CONSTRAINT notas_adhesivas_pkey PRIMARY KEY (id);


--
-- Name: permisos permisos_pkey; Type: CONSTRAINT; Schema: public; Owner: horarios_user
--

ALTER TABLE ONLY public.permisos
    ADD CONSTRAINT permisos_pkey PRIMARY KEY (id);


--
-- Name: planificaciones planificaciones_pkey; Type: CONSTRAINT; Schema: public; Owner: horarios_user
--

ALTER TABLE ONLY public.planificaciones
    ADD CONSTRAINT planificaciones_pkey PRIMARY KEY (id);


--
-- Name: recreos_excluidos recreos_excluidos_pkey; Type: CONSTRAINT; Schema: public; Owner: horarios_user
--

ALTER TABLE ONLY public.recreos_excluidos
    ADD CONSTRAINT recreos_excluidos_pkey PRIMARY KEY (id);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: horarios_user
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: horarios_user
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- Name: ix_asignaciones_id; Type: INDEX; Schema: public; Owner: horarios_user
--

CREATE INDEX ix_asignaciones_id ON public.asignaciones USING btree (id);


--
-- Name: ix_aulas_id; Type: INDEX; Schema: public; Owner: horarios_user
--

CREATE INDEX ix_aulas_id ON public.aulas USING btree (id);


--
-- Name: ix_aulas_nombre; Type: INDEX; Schema: public; Owner: horarios_user
--

CREATE INDEX ix_aulas_nombre ON public.aulas USING btree (nombre);


--
-- Name: ix_calendario_categorias_id; Type: INDEX; Schema: public; Owner: horarios_user
--

CREATE INDEX ix_calendario_categorias_id ON public.calendario_categorias USING btree (id);


--
-- Name: ix_calendario_categorias_nombre; Type: INDEX; Schema: public; Owner: horarios_user
--

CREATE INDEX ix_calendario_categorias_nombre ON public.calendario_categorias USING btree (nombre);


--
-- Name: ix_calendario_eventos_fecha; Type: INDEX; Schema: public; Owner: horarios_user
--

CREATE INDEX ix_calendario_eventos_fecha ON public.calendario_eventos USING btree (fecha);


--
-- Name: ix_calendario_eventos_id; Type: INDEX; Schema: public; Owner: horarios_user
--

CREATE INDEX ix_calendario_eventos_id ON public.calendario_eventos USING btree (id);


--
-- Name: ix_calendarios_id; Type: INDEX; Schema: public; Owner: horarios_user
--

CREATE INDEX ix_calendarios_id ON public.calendarios USING btree (id);


--
-- Name: ix_calendarios_nombre; Type: INDEX; Schema: public; Owner: horarios_user
--

CREATE INDEX ix_calendarios_nombre ON public.calendarios USING btree (nombre);


--
-- Name: ix_cargo_asignaciones_id; Type: INDEX; Schema: public; Owner: horarios_user
--

CREATE INDEX ix_cargo_asignaciones_id ON public.cargo_asignaciones USING btree (id);


--
-- Name: ix_cargo_horarios_id; Type: INDEX; Schema: public; Owner: horarios_user
--

CREATE INDEX ix_cargo_horarios_id ON public.cargo_horarios USING btree (id);


--
-- Name: ix_cargos_id; Type: INDEX; Schema: public; Owner: horarios_user
--

CREATE INDEX ix_cargos_id ON public.cargos USING btree (id);


--
-- Name: ix_cargos_nombre; Type: INDEX; Schema: public; Owner: horarios_user
--

CREATE INDEX ix_cargos_nombre ON public.cargos USING btree (nombre);


--
-- Name: ix_comisiones_codigo; Type: INDEX; Schema: public; Owner: horarios_user
--

CREATE UNIQUE INDEX ix_comisiones_codigo ON public.comisiones USING btree (codigo);


--
-- Name: ix_comisiones_id; Type: INDEX; Schema: public; Owner: horarios_user
--

CREATE INDEX ix_comisiones_id ON public.comisiones USING btree (id);


--
-- Name: ix_departamentos_codigo; Type: INDEX; Schema: public; Owner: horarios_user
--

CREATE UNIQUE INDEX ix_departamentos_codigo ON public.departamentos USING btree (codigo);


--
-- Name: ix_departamentos_id; Type: INDEX; Schema: public; Owner: horarios_user
--

CREATE INDEX ix_departamentos_id ON public.departamentos USING btree (id);


--
-- Name: ix_departamentos_nombre; Type: INDEX; Schema: public; Owner: horarios_user
--

CREATE UNIQUE INDEX ix_departamentos_nombre ON public.departamentos USING btree (nombre);


--
-- Name: ix_departamientos_codigo; Type: INDEX; Schema: public; Owner: horarios_user
--

CREATE UNIQUE INDEX ix_departamientos_codigo ON public.departamientos USING btree (codigo);


--
-- Name: ix_departamientos_id; Type: INDEX; Schema: public; Owner: horarios_user
--

CREATE INDEX ix_departamientos_id ON public.departamientos USING btree (id);


--
-- Name: ix_departamientos_nombre; Type: INDEX; Schema: public; Owner: horarios_user
--

CREATE UNIQUE INDEX ix_departamientos_nombre ON public.departamientos USING btree (nombre);


--
-- Name: ix_docentes_apellido; Type: INDEX; Schema: public; Owner: horarios_user
--

CREATE INDEX ix_docentes_apellido ON public.docentes USING btree (apellido);


--
-- Name: ix_docentes_id; Type: INDEX; Schema: public; Owner: horarios_user
--

CREATE INDEX ix_docentes_id ON public.docentes USING btree (id);


--
-- Name: ix_docentes_nombre; Type: INDEX; Schema: public; Owner: horarios_user
--

CREATE INDEX ix_docentes_nombre ON public.docentes USING btree (nombre);


--
-- Name: ix_instituciones_codigo; Type: INDEX; Schema: public; Owner: horarios_user
--

CREATE UNIQUE INDEX ix_instituciones_codigo ON public.instituciones USING btree (codigo);


--
-- Name: ix_instituciones_id; Type: INDEX; Schema: public; Owner: horarios_user
--

CREATE INDEX ix_instituciones_id ON public.instituciones USING btree (id);


--
-- Name: ix_instituciones_nombre; Type: INDEX; Schema: public; Owner: horarios_user
--

CREATE INDEX ix_instituciones_nombre ON public.instituciones USING btree (nombre);


--
-- Name: ix_materias_codigo; Type: INDEX; Schema: public; Owner: horarios_user
--

CREATE INDEX ix_materias_codigo ON public.materias USING btree (codigo);


--
-- Name: ix_materias_id; Type: INDEX; Schema: public; Owner: horarios_user
--

CREATE INDEX ix_materias_id ON public.materias USING btree (id);


--
-- Name: ix_materias_nombre; Type: INDEX; Schema: public; Owner: horarios_user
--

CREATE INDEX ix_materias_nombre ON public.materias USING btree (nombre);


--
-- Name: ix_modulos_horario_id; Type: INDEX; Schema: public; Owner: horarios_user
--

CREATE INDEX ix_modulos_horario_id ON public.modulos_horario USING btree (id);


--
-- Name: ix_modulos_id; Type: INDEX; Schema: public; Owner: horarios_user
--

CREATE INDEX ix_modulos_id ON public.modulos USING btree (id);


--
-- Name: ix_modulos_nombre; Type: INDEX; Schema: public; Owner: horarios_user
--

CREATE UNIQUE INDEX ix_modulos_nombre ON public.modulos USING btree (nombre);


--
-- Name: ix_notas_adhesivas_id; Type: INDEX; Schema: public; Owner: horarios_user
--

CREATE INDEX ix_notas_adhesivas_id ON public.notas_adhesivas USING btree (id);


--
-- Name: ix_permisos_id; Type: INDEX; Schema: public; Owner: horarios_user
--

CREATE INDEX ix_permisos_id ON public.permisos USING btree (id);


--
-- Name: ix_planificaciones_anio_lectivo; Type: INDEX; Schema: public; Owner: horarios_user
--

CREATE INDEX ix_planificaciones_anio_lectivo ON public.planificaciones USING btree (anio_lectivo);


--
-- Name: ix_planificaciones_id; Type: INDEX; Schema: public; Owner: horarios_user
--

CREATE INDEX ix_planificaciones_id ON public.planificaciones USING btree (id);


--
-- Name: ix_recreos_excluidos_id; Type: INDEX; Schema: public; Owner: horarios_user
--

CREATE INDEX ix_recreos_excluidos_id ON public.recreos_excluidos USING btree (id);


--
-- Name: ix_roles_id; Type: INDEX; Schema: public; Owner: horarios_user
--

CREATE INDEX ix_roles_id ON public.roles USING btree (id);


--
-- Name: ix_usuarios_id; Type: INDEX; Schema: public; Owner: horarios_user
--

CREATE INDEX ix_usuarios_id ON public.usuarios USING btree (id);


--
-- Name: ix_usuarios_username; Type: INDEX; Schema: public; Owner: horarios_user
--

CREATE UNIQUE INDEX ix_usuarios_username ON public.usuarios USING btree (username);


--
-- Name: uix_rol_inst_nombre; Type: INDEX; Schema: public; Owner: horarios_user
--

CREATE UNIQUE INDEX uix_rol_inst_nombre ON public.roles USING btree (institucion_id, nombre);


--
-- Name: asignaciones asignaciones_aula_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: horarios_user
--

ALTER TABLE ONLY public.asignaciones
    ADD CONSTRAINT asignaciones_aula_id_fkey FOREIGN KEY (aula_id) REFERENCES public.aulas(id);


--
-- Name: asignaciones asignaciones_comision_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: horarios_user
--

ALTER TABLE ONLY public.asignaciones
    ADD CONSTRAINT asignaciones_comision_id_fkey FOREIGN KEY (comision_id) REFERENCES public.comisiones(id);


--
-- Name: asignaciones asignaciones_departamento_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: horarios_user
--

ALTER TABLE ONLY public.asignaciones
    ADD CONSTRAINT asignaciones_departamento_id_fkey FOREIGN KEY (departamento_id) REFERENCES public.departamentos(id);


--
-- Name: asignaciones asignaciones_docente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: horarios_user
--

ALTER TABLE ONLY public.asignaciones
    ADD CONSTRAINT asignaciones_docente_id_fkey FOREIGN KEY (docente_id) REFERENCES public.docentes(id);


--
-- Name: asignaciones asignaciones_modulo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: horarios_user
--

ALTER TABLE ONLY public.asignaciones
    ADD CONSTRAINT asignaciones_modulo_id_fkey FOREIGN KEY (modulo_id) REFERENCES public.modulos_horario(id);


--
-- Name: aula_departamento aula_departamento_aula_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: horarios_user
--

ALTER TABLE ONLY public.aula_departamento
    ADD CONSTRAINT aula_departamento_aula_id_fkey FOREIGN KEY (aula_id) REFERENCES public.aulas(id) ON DELETE CASCADE;


--
-- Name: aula_departamento aula_departamento_departamento_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: horarios_user
--

ALTER TABLE ONLY public.aula_departamento
    ADD CONSTRAINT aula_departamento_departamento_id_fkey FOREIGN KEY (departamento_id) REFERENCES public.departamentos(id) ON DELETE CASCADE;


--
-- Name: aulas aulas_departamento_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: horarios_user
--

ALTER TABLE ONLY public.aulas
    ADD CONSTRAINT aulas_departamento_id_fkey FOREIGN KEY (departamento_id) REFERENCES public.departamentos(id);


--
-- Name: aulas aulas_institucion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: horarios_user
--

ALTER TABLE ONLY public.aulas
    ADD CONSTRAINT aulas_institucion_id_fkey FOREIGN KEY (institucion_id) REFERENCES public.instituciones(id) ON DELETE CASCADE;


--
-- Name: calendario_categorias calendario_categorias_calendario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: horarios_user
--

ALTER TABLE ONLY public.calendario_categorias
    ADD CONSTRAINT calendario_categorias_calendario_id_fkey FOREIGN KEY (calendario_id) REFERENCES public.calendarios(id);


--
-- Name: calendario_eventos calendario_eventos_calendario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: horarios_user
--

ALTER TABLE ONLY public.calendario_eventos
    ADD CONSTRAINT calendario_eventos_calendario_id_fkey FOREIGN KEY (calendario_id) REFERENCES public.calendarios(id);


--
-- Name: calendario_eventos calendario_eventos_categoria_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: horarios_user
--

ALTER TABLE ONLY public.calendario_eventos
    ADD CONSTRAINT calendario_eventos_categoria_id_fkey FOREIGN KEY (categoria_id) REFERENCES public.calendario_categorias(id);


--
-- Name: calendario_eventos calendario_eventos_departamento_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: horarios_user
--

ALTER TABLE ONLY public.calendario_eventos
    ADD CONSTRAINT calendario_eventos_departamento_id_fkey FOREIGN KEY (departamento_id) REFERENCES public.departamentos(id) ON DELETE CASCADE;


--
-- Name: calendarios calendarios_departamento_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: horarios_user
--

ALTER TABLE ONLY public.calendarios
    ADD CONSTRAINT calendarios_departamento_id_fkey FOREIGN KEY (departamento_id) REFERENCES public.departamentos(id) ON DELETE CASCADE;


--
-- Name: cargo_asignaciones cargo_asignaciones_cargo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: horarios_user
--

ALTER TABLE ONLY public.cargo_asignaciones
    ADD CONSTRAINT cargo_asignaciones_cargo_id_fkey FOREIGN KEY (cargo_id) REFERENCES public.cargos(id);


--
-- Name: cargo_asignaciones cargo_asignaciones_departamento_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: horarios_user
--

ALTER TABLE ONLY public.cargo_asignaciones
    ADD CONSTRAINT cargo_asignaciones_departamento_id_fkey FOREIGN KEY (departamento_id) REFERENCES public.departamentos(id);


--
-- Name: cargo_asignaciones cargo_asignaciones_docente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: horarios_user
--

ALTER TABLE ONLY public.cargo_asignaciones
    ADD CONSTRAINT cargo_asignaciones_docente_id_fkey FOREIGN KEY (docente_id) REFERENCES public.docentes(id);


--
-- Name: cargo_horarios cargo_horarios_asignacion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: horarios_user
--

ALTER TABLE ONLY public.cargo_horarios
    ADD CONSTRAINT cargo_horarios_asignacion_id_fkey FOREIGN KEY (asignacion_id) REFERENCES public.cargo_asignaciones(id);


--
-- Name: cargo_horarios cargo_horarios_aula_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: horarios_user
--

ALTER TABLE ONLY public.cargo_horarios
    ADD CONSTRAINT cargo_horarios_aula_id_fkey FOREIGN KEY (aula_id) REFERENCES public.aulas(id);


--
-- Name: cargo_horarios cargo_horarios_comision_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: horarios_user
--

ALTER TABLE ONLY public.cargo_horarios
    ADD CONSTRAINT cargo_horarios_comision_id_fkey FOREIGN KEY (comision_id) REFERENCES public.comisiones(id);


--
-- Name: cargo_horarios cargo_horarios_modulo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: horarios_user
--

ALTER TABLE ONLY public.cargo_horarios
    ADD CONSTRAINT cargo_horarios_modulo_id_fkey FOREIGN KEY (modulo_id) REFERENCES public.modulos_horario(id);


--
-- Name: cargos cargos_departamento_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: horarios_user
--

ALTER TABLE ONLY public.cargos
    ADD CONSTRAINT cargos_departamento_id_fkey FOREIGN KEY (departamento_id) REFERENCES public.departamentos(id) ON DELETE CASCADE;


--
-- Name: comisiones comisiones_materia_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: horarios_user
--

ALTER TABLE ONLY public.comisiones
    ADD CONSTRAINT comisiones_materia_id_fkey FOREIGN KEY (materia_id) REFERENCES public.materias(id);


--
-- Name: config_turnos config_turnos_departamento_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: horarios_user
--

ALTER TABLE ONLY public.config_turnos
    ADD CONSTRAINT config_turnos_departamento_id_fkey FOREIGN KEY (departamento_id) REFERENCES public.departamentos(id) ON DELETE CASCADE;


--
-- Name: departamentos departamentos_institucion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: horarios_user
--

ALTER TABLE ONLY public.departamentos
    ADD CONSTRAINT departamentos_institucion_id_fkey FOREIGN KEY (institucion_id) REFERENCES public.instituciones(id) ON DELETE CASCADE;


--
-- Name: docente_departamento docente_departamento_departamento_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: horarios_user
--

ALTER TABLE ONLY public.docente_departamento
    ADD CONSTRAINT docente_departamento_departamento_id_fkey FOREIGN KEY (departamento_id) REFERENCES public.departamentos(id) ON DELETE CASCADE;


--
-- Name: docente_departamento docente_departamento_docente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: horarios_user
--

ALTER TABLE ONLY public.docente_departamento
    ADD CONSTRAINT docente_departamento_docente_id_fkey FOREIGN KEY (docente_id) REFERENCES public.docentes(id) ON DELETE CASCADE;


--
-- Name: docente_institucion docente_institucion_docente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: horarios_user
--

ALTER TABLE ONLY public.docente_institucion
    ADD CONSTRAINT docente_institucion_docente_id_fkey FOREIGN KEY (docente_id) REFERENCES public.docentes(id) ON DELETE CASCADE;


--
-- Name: docente_institucion docente_institucion_institucion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: horarios_user
--

ALTER TABLE ONLY public.docente_institucion
    ADD CONSTRAINT docente_institucion_institucion_id_fkey FOREIGN KEY (institucion_id) REFERENCES public.instituciones(id) ON DELETE CASCADE;


--
-- Name: docentes docentes_institucion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: horarios_user
--

ALTER TABLE ONLY public.docentes
    ADD CONSTRAINT docentes_institucion_id_fkey FOREIGN KEY (institucion_id) REFERENCES public.instituciones(id) ON DELETE CASCADE;


--
-- Name: materias materias_departamento_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: horarios_user
--

ALTER TABLE ONLY public.materias
    ADD CONSTRAINT materias_departamento_id_fkey FOREIGN KEY (departamento_id) REFERENCES public.departamentos(id);


--
-- Name: notas_adhesivas notas_adhesivas_calendario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: horarios_user
--

ALTER TABLE ONLY public.notas_adhesivas
    ADD CONSTRAINT notas_adhesivas_calendario_id_fkey FOREIGN KEY (calendario_id) REFERENCES public.calendarios(id);


--
-- Name: permisos permisos_modulo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: horarios_user
--

ALTER TABLE ONLY public.permisos
    ADD CONSTRAINT permisos_modulo_id_fkey FOREIGN KEY (modulo_id) REFERENCES public.modulos(id) ON DELETE CASCADE;


--
-- Name: permisos permisos_rol_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: horarios_user
--

ALTER TABLE ONLY public.permisos
    ADD CONSTRAINT permisos_rol_id_fkey FOREIGN KEY (rol_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: planificaciones planificaciones_comision_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: horarios_user
--

ALTER TABLE ONLY public.planificaciones
    ADD CONSTRAINT planificaciones_comision_id_fkey FOREIGN KEY (comision_id) REFERENCES public.comisiones(id);


--
-- Name: planificaciones planificaciones_docente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: horarios_user
--

ALTER TABLE ONLY public.planificaciones
    ADD CONSTRAINT planificaciones_docente_id_fkey FOREIGN KEY (docente_id) REFERENCES public.docentes(id);


--
-- Name: planificaciones planificaciones_materia_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: horarios_user
--

ALTER TABLE ONLY public.planificaciones
    ADD CONSTRAINT planificaciones_materia_id_fkey FOREIGN KEY (materia_id) REFERENCES public.materias(id) ON DELETE CASCADE;


--
-- Name: recreos_excluidos recreos_excluidos_departamento_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: horarios_user
--

ALTER TABLE ONLY public.recreos_excluidos
    ADD CONSTRAINT recreos_excluidos_departamento_id_fkey FOREIGN KEY (departamento_id) REFERENCES public.departamentos(id);


--
-- Name: recreos_excluidos recreos_excluidos_modulo_id_anterior_fkey; Type: FK CONSTRAINT; Schema: public; Owner: horarios_user
--

ALTER TABLE ONLY public.recreos_excluidos
    ADD CONSTRAINT recreos_excluidos_modulo_id_anterior_fkey FOREIGN KEY (modulo_id_anterior) REFERENCES public.modulos_horario(id);


--
-- Name: roles roles_institucion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: horarios_user
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_institucion_id_fkey FOREIGN KEY (institucion_id) REFERENCES public.instituciones(id);


--
-- Name: usuarios usuarios_institucion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: horarios_user
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_institucion_id_fkey FOREIGN KEY (institucion_id) REFERENCES public.instituciones(id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict pGrjaEmMC6vMzbX04BbP8DWXlhYhuM5QVx0QZJl4D6avMKkCMPvj1jsbybzV2hN

