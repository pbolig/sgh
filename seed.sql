-- Módulos turno mañana (según el Excel actual)
INSERT INTO modulos_horario (numero, hora_inicio, hora_fin, turno) VALUES
(1, '07:45', '08:25', 'mañana'),
(2, '08:25', '09:05', 'mañana'),
(3, '09:15', '09:55', 'mañana'),
(4, '09:55', '10:35', 'mañana'),
(5, '10:45', '11:25', 'mañana'),
(6, '12:05', '12:10', 'mañana'),
(7, '12:10', '12:50', 'mañana');

-- Módulos turno tarde (según el Excel actual)
INSERT INTO modulos_horario (numero, hora_inicio, hora_fin, turno) VALUES
(1, '13:30', '14:10', 'tarde'),
(2, '14:10', '14:50', 'tarde'),
(3, '15:00', '15:40', 'tarde'),
(4, '15:40', '16:20', 'tarde'),
(5, '16:30', '17:10', 'tarde'),
(6, '17:10', '17:50', 'tarde'),
(7, '17:55', '18:35', 'tarde'),
(8, '18:35', '19:15', 'tarde'),
(9, '19:15', '19:55', 'tarde');

-- Departamento inicial: TIC
INSERT INTO departamentos (nombre, codigo) VALUES ('TIC', 'TIC');

-- Aulas del departamento TIC
INSERT INTO aulas (departamento_id, nombre) VALUES
(1, 'AULA 1'), (1, 'AULA 2'), (1, 'AULA 3');

-- Docentes del departamento TIC (extraídos del Excel)
INSERT INTO docentes (apellido) VALUES
('SALVADOR'), ('DUNN'), ('ATTARA'), ('BOLIG'), ('GAIBAZZI'),
('BOZALONGO'), ('TABOADA'), ('SPEERLI'), ('OTTAVIANO'),
('CRISTALLI'), ('AUDISIO'), ('LOPEZ');

-- Usuario admin por defecto
INSERT INTO usuarios (username, password_hash, rol) VALUES
('admin', 'PENDIENTE_HASH', 'admin');

-- Usuario invitado por defecto
INSERT INTO usuarios (username, password_hash, rol) VALUES
('invitado', 'PENDIENTE_HASH', 'invitado');
