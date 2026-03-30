/* ── PAD MODULE (Planificación de Asignaturas y Disciplinas) ── */

export const PAD = {
    currentPlan: null,
    db: {
        materias: [],
        docentes: [],
        comisiones: []
    },

    async init() {
        const deptoId = document.getElementById('dept-selector')?.value;
        const instId = document.getElementById('inst-selector')?.value;
        console.log("PAD Module initialized");
        try {
            const [mats, docs, coms] = await Promise.all([
                fetch(`/api/materias${deptoId ? '?departamento_id=' + deptoId : ''}`).then(r => r.json()),
                fetch(`/api/docentes${instId ? '?institucion_id=' + instId : ''}`).then(r => r.json()),
                fetch(`/api/comisiones${deptoId ? '?departamento_id=' + deptoId : ''}`).then(r => r.json())
            ]);
            this.db.materias = mats;
            this.db.docentes = docs;
            this.db.comisiones = coms;
        } catch (e) {
            console.error("Error loading PAD initial data:", e);
        }
    },

    async render(containerId) {
        await this.init();
        const container = document.getElementById(containerId);
        if (!container) return;

        container.classList.add('minimal-padding');
        container.innerHTML = `
            <div class="pad-view">
                <div class="container">
                    <!-- CONTROLES DE CARGA -->
                    <div class="section-card no-print" style="margin-bottom: 20px; padding: 15px; background: #fff;">
                        <div class="grid g-4" style="align-items: end;">
                            <div class="field">
                                <label>Materia</label>
                                <select id="pad-materia-sel">
                                    <option value="">Seleccione Materia</option>
                                    ${this.db.materias.map(m => `<option value="${m.id}">${m.nombre}</option>`).join('')}
                                </select>
                            </div>
                            <div class="field">
                                <label>Año Lectivo</label>
                                <input type="number" id="pad-anio-lectivo" value="${new Date().getFullYear()}">
                            </div>
                            <div class="field">
                                <button class="btn-sky" onclick="PAD.loadPlan()">📂 Cargar Plan</button>
                            </div>
                            <div class="field" style="text-align: right;">
                                <button class="btn-mint" onclick="PAD.loadDummyData()">💡 Cargar Ejemplo</button>
                            </div>
                        </div>
                    </div>

                    <div id="pad-form-container" style="display:none;">
                        <!-- MASTHEAD -->
                        <div class="masthead">
                            <div class="masthead-escudo" id="masthead-siglas">–</div>
                            <div class="masthead-text">
                                <div class="sup-title" id="masthead-jurisdiccion">Ministerio de Educación – Nivel Superior No Universitario</div>
                                <h1 id="masthead-instituto">Planificación Anual de Cátedra</h1>
                                <div class="sub">
                                    <span id="masthead-carrera" style="font-style:italic;opacity:.85;">Carrera no especificada</span>
                                    <span id="masthead-sep1" style="opacity:.5;"> &middot; </span>
                                    <span id="masthead-materia-code" style="font-weight:700; color:rgba(255,255,255,.9); margin-right:5px;"></span>
                                    <span id="masthead-materia">Asignatura no especificada</span><br>
                                    <span id="masthead-anio-cursada" style="opacity:.75;"></span>
                                    <span id="masthead-sep2" style="opacity:.4;"> &middot; </span>
                                    <span id="masthead-modalidad" style="opacity:.75;"></span>
                                </div>
                            </div>
                            <div class="masthead-badge">
                                <div class="badge-label">Año lectivo</div>
                                <div class="badge-val" id="anio-display">–</div>
                            </div>
                        </div>

                        <!-- ══ 1. ENCABEZADO INSTITUCIONAL ═══════════════════ -->
                        <div class="section-card sec-inst">
                            <div class="section-header">
                                <div class="section-icon">🏫</div>
                                <h2>1. Encabezado Institucional</h2>
                                <div class="norm-ref">RAM · Capítulo II, Art. 8 y 9<br>Datos de identificación obligatorios</div>
                            </div>
                            <div class="section-body">
                                <div class="subsection">
                                    <div class="subsection-title">A · Datos del Instituto</div>
                                    <div class="grid g-3">
                                        <div class="field">
                                            <label>Año lectivo <span class="norm">RAM Art. 8 inc. a</span></label>
                                            <input id="anio" type="number" placeholder="2026" />
                                        </div>
                                        <div class="field span-2">
                                            <label>Jurisdicción / Organismo de supervisión</label>
                                            <input id="jurisdiccion" type="text" placeholder="Ministerio de Educación – Provincia de Santa Fe – DES" />
                                        </div>
                                        <div class="field span-2">
                                            <label>Nombre del Instituto</label>
                                            <input id="instituto" type="text" placeholder="Instituto Superior …" />
                                        </div>
                                        <div class="field span-2">
                                            <label>Carrera</label>
                                            <input id="carrera" type="text" placeholder="Tecnicatura / Profesorado en …" />
                                        </div>
                                        <div class="field">
                                            <label>Año / Nivel de cursada</label>
                                            <input id="anio-cursada" type="text" placeholder="1° Año · 2° Cuatrimestre" />
                                        </div>
                                    </div>
                                </div>

                                <div class="subsection">
                                    <div class="subsection-title">B · Datos de la Asignatura</div>
                                    <div class="grid g-3">
                                        <div class="field span-2">
                                            <label>Asignatura / Unidad Curricular</label>
                                            <input id="materia" type="text" readonly style="background-color: var(--neutral-50); cursor: not-allowed;" />
                                        </div>
                                        <div class="field">
                                            <label>Comisión / División</label>
                                            <input id="comision" type="text" placeholder="Comisión A – Turno …" />
                                        </div>
                                        <div class="field span-2">
                                            <label>Docente(s) a cargo</label>
                                            <input id="docente" type="text" placeholder="Apellido, Nombre – DNI · Situación de revista" />
                                        </div>
                                        <div class="field">
                                            <label>Carga horaria anual (hs reloj)</label>
                                            <input id="carga" type="number" placeholder="96" />
                                        </div>
                                    </div>
                                </div>

                                <div class="subsection">
                                    <div class="subsection-title">C · Normativa y Modalidad</div>
                                    <div class="grid g-3">
                                        <div class="field">
                                            <label>Modalidad de cursada <span class="norm">RAM Art. 12</span></label>
                                            <select id="modalidad">
                                                <option value="">— seleccionar —</option>
                                                <option>Presencial</option>
                                                <option>Virtual</option>
                                                <option>Mixta (presencial + virtual)</option>
                                            </select>
                                        </div>
                                        <div class="field span-2">
                                            <label>Referencia normativa RAM aplicable</label>
                                            <input id="ram" type="text" placeholder="Decreto / Res. N° … – Art. … (criterio que aplica)" />
                                        </div>
                                        <div class="field span-2">
                                            <label>Fecha de aprobación institucional / N° de expediente</label>
                                            <input id="aprob" type="text" placeholder="DD/MM/AAAA – Acta N° … – Expte. N° …" />
                                        </div>
                                    </div>
                                </div>

                                <div class="subsection">
                                    <div class="subsection-title">D · Correlatividades y Plan de Estudios</div>
                                    <div class="grid g-3">
                                        <div class="field">
                                            <label>Correlativas para <strong>cursar</strong></label>
                                            <textarea id="correl-cursar" style="min-height:70px;" placeholder="• Materia X (aprobada)..."></textarea>
                                        </div>
                                        <div class="field">
                                            <label>Correlativas para <strong>rendir final</strong></label>
                                            <textarea id="correl-final" style="min-height:70px;" placeholder="• Materia X (examen final aprobado)..."></textarea>
                                        </div>
                                        <div class="field">
                                            <label>Asignaturas co-requisito</label>
                                            <textarea id="correl-simult" style="min-height:70px;" placeholder="• Materia Z (simultánea)..."></textarea>
                                        </div>
                                        <div class="field span-3">
                                            <label>Enlace al Plan de Estudios (URL)</label>
                                            <div style="display:flex; gap:8px; align-items:center;">
                                                <input id="plan-url" type="url" placeholder="https://drive.google.com/…" style="flex:1;" />
                                                <button type="button" class="btn-sky no-print" id="open-plan-url">🔗 Abrir</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- 2. MARCO CURRICULAR -->
                        <div class="section-card sec-curr">
                            <div class="section-header">
                                <div class="section-icon">📐</div>
                                <h2>2. Marco Curricular y Pedagógico</h2>
                            </div>
                            <div class="section-body">
                                <div class="grid g-2">
                                    <div class="field">
                                        <label>Fundamentación y Objetivos Generales</label>
                                        <textarea id="objgen" placeholder="Describir los propósitos formativos de la asignatura..."></textarea>
                                    </div>
                                    <div class="field">
                                        <label>Competencias / Capacidades del perfil</label>
                                        <textarea id="competencias" placeholder="¿Cómo contribuye esta materia al perfil de egreso?..."></textarea>
                                    </div>
                                    <div class="field">
                                        <label>Perfil de los estudiantes</label>
                                        <textarea id="perfil" placeholder="Describir los conocimientos previos requeridos y perfil..."></textarea>
                                    </div>
                                    <div class="field">
                                        <label>Encuadre Metodológico / Estrategias de enseñanza</label>
                                        <textarea id="metodologia" placeholder="¿Cómo se dictarán las clases?..."></textarea>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- 3. PROPUESTA CURRICULAR (TABLA UNIDADES) -->
                        <div class="section-card sec-unit">
                            <div class="section-header">
                                <div class="section-icon">📋</div>
                                <h2>3. Propuesta Curricular Narrativa</h2>
                            </div>
                            <div class="section-body">
                                <table class="data-table" id="tabla-unidades">
                                    <thead>
                                        <tr>
                                            <th style="width:50px;">U.N.</th>
                                            <th style="width:200px;">Título de la Unidad</th>
                                            <th style="width:120px;">Duración</th>
                                            <th>Contenidos principales</th>
                                            <th style="width:180px;">Instancias evaluativas</th>
                                            <th style="width:60px;">%</th>
                                        </tr>
                                    </thead>
                                    <tbody></tbody>
                                </table>
                                <div class="controls-bar no-print">
                                    <button class="btn-sky" id="add-row">+ Agregar Fila</button>
                                    <button class="btn-danger" id="clear-rows">🗑 Limpiar tabla</button>
                                </div>
                            </div>
                        </div>

                        <!-- 4. FICHAS DE UNIDAD -->
                        <div id="sec-fichas" class="section-card sec-ficha" style="margin-top:24px;">
                            <div class="section-header">
                                <div class="section-icon">📄</div>
                                <h2>4. Fichas Didácticas de Unidad Curricular</h2>
                            </div>
                            <div class="section-body">
                                <div id="fichas-container"></div>
                                <div class="controls-bar no-print">
                                    <button class="btn-peach" id="add-ficha">+ Agregar Nueva Ficha de Unidad</button>
                                </div>
                            </div>
                        </div>

                        <!-- 5. EVALUACION -->
                        <div class="section-card sec-eval">
                            <div class="section-header">
                                <div class="section-icon">⭐</div>
                                <h2>5. Régimen de Evaluación y Acreditación</h2>
                            </div>
                            <div class="section-body">
                                <div class="grid g-3">
                                    <div class="field">
                                        <label>Criterios de Evaluación</label>
                                        <textarea id="criterios" style="height:120px;"></textarea>
                                    </div>
                                    <div class="field">
                                        <label>Instrumentos de Evaluación</label>
                                        <textarea id="instrumentos" style="height:120px;"></textarea>
                                    </div>
                                    <div class="field">
                                        <label>Ponderaciones / Condiciones de Acreditación</label>
                                        <textarea id="ponderaciones" style="height:120px;"></textarea>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- 6. CRONOGRAMA -->
                        <div class="section-card sec-crono">
                            <div class="section-header">
                                <div class="section-icon">📅</div>
                                <h2>6. Cronograma Tentativo</h2>
                            </div>
                            <div class="section-body">
                                <table class="data-table" id="cronograma">
                                    <thead>
                                        <tr>
                                            <th style="width:120px;">Fecha / Semana</th>
                                            <th>Tema / Eje Temático</th>
                                            <th style="width:250px;">Actividad de aprendizaje</th>
                                            <th style="width:200px;">Evaluación / Entregas</th>
                                        </tr>
                                    </thead>
                                    <tbody></tbody>
                                </table>
                                <div class="controls-bar no-print">
                                    <button class="btn-sand" id="add-crono">+ Agregar Fila al Cronograma</button>
                                    <button class="btn-danger" id="clear-crono">🗑 Limpiar cronograma</button>
                                </div>
                            </div>
                        </div>

                        <!-- 7. BIBLIOGRAFIA -->
                        <div class="section-card sec-biblio">
                            <div class="section-header">
                                <div class="section-icon">📚</div>
                                <h2>7. Bibliografía</h2>
                            </div>
                            <div class="section-body">
                                <div class="grid g-2">
                                    <div class="field">
                                        <label>Bibliografía Obligatoria</label>
                                        <textarea id="biblio-ob" placeholder="Normas APA recomendadas..."></textarea>
                                    </div>
                                    <div class="field">
                                        <label>Bibliografía Complementaria</label>
                                        <textarea id="biblio-comp"></textarea>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- 8. PRACTICA PROFESIONALIZANTE -->
                        <div class="section-card sec-practica">
                            <div class="section-header">
                                <div class="section-icon">🛠️</div>
                                <h2>8. Práctica Profesionalizante (si corresponde)</h2>
                            </div>
                            <div class="section-body">
                                <div class="field">
                                    <label>Descripción de la Práctica / Proyecto Final</label>
                                    <textarea id="practica-desc" placeholder="Objetivos, actividades y criterios de la práctica profesionalizante..."></textarea>
                                </div>
                            </div>
                        </div>

                        <!-- 9. FIRMAS -->
                        <div class="section-card">
                            <div class="section-body">
                                <div class="grid g-2">
                                    <div class="field">
                                        <label>Docente Responsable</label>
                                        <input id="firma-doc" type="text" />
                                        <div class="firma-line"></div>
                                        <div class="firma-label">Firma del Docente</div>
                                    </div>
                                    <div class="field">
                                        <label>Coordinación de Carrera / Regencia</label>
                                        <input id="firma-coord" type="text" />
                                        <div class="firma-line"></div>
                                        <div class="firma-label">Sello y Firma Institucional</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="fixed-actions no-print">
                            <button class="btn-danger" id="reset-form">Limpiar Formulario</button>
                            <button class="btn-primary" onclick="PAD.savePlan()">💾 Guardar Planificación</button>
                            <button class="btn-secondary" onclick="PAD.exportPDF()">🖨️ Exportar PDF</button>
                        </div>
                    </div>
                </div>
            </div>

            <template id="tpl-ficha">
                <div class="ficha-card" style="margin-top:20px;">
                    <div class="ficha-head">
                        <h4>Unidad N° <span class="unidad-num">X</span></h4>
                        <button type="button" class="btn-danger btn-remove no-print" style="padding:4px 8px; font-size:11px;">✕ Quitar Ficha</button>
                    </div>
                    <div class="ficha-body">
                        <div class="grid g-3" style="margin-bottom:14px;">
                            <div class="field">
                                <label>Unidad N°</label>
                                <input type="text" class="f-unidad" placeholder="1" />
                            </div>
                            <div class="field span-2">
                                <label>Título de la unidad</label>
                                <input type="text" class="f-titulo" />
                            </div>
                            <div class="field span-3">
                                <label>Duración estimada</label>
                                <input type="text" class="f-duracion" />
                            </div>
                        </div>
                        <div class="field" style="margin-bottom:14px;">
                            <label>Objetivos específicos de la unidad</label>
                            <textarea class="f-objetivos" style="min-height:70px;"></textarea>
                        </div>
                        <div class="grid g-2" style="margin-bottom:14px;">
                            <div class="field">
                                <label>Contenidos (Eje conceptual, procedimental y actitudinal)</label>
                                <textarea class="f-contenidos"></textarea>
                            </div>
                            <div class="field">
                                <label>Contenidos mínimos de la unidad</label>
                                <textarea class="f-minimos"></textarea>
                            </div>
                        </div>
                        <div class="grid g-2">
                            <div class="field">
                                <label>Actividades de aprendizaje</label>
                                <textarea class="f-actividades"></textarea>
                            </div>
                            <div class="field">
                                <label>Recursos y materiales</label>
                                <textarea class="f-recursos"></textarea>
                            </div>
                        </div>
                        <!-- ... more fields would go here, simplified for brevity but can be expanded ... -->
                    </div>
                </div>
            </template>
        `;

        this.attachEvents();
        window.PAD = this; // Global access for inline onclicks
    },

    attachEvents() {
        const qs = (s, ctx=document) => ctx.querySelector(s);
        const qsa = (s, ctx=document) => Array.from(ctx.querySelectorAll(s));

        // Masthead live updates
        const updateMasthead = () => {
            const anio = qs('#anio').value;
            const juris = qs('#jurisdiccion').value;
            const inst = qs('#instituto').value;
            const carrera = qs('#carrera').value;
            const materia = qs('#materia').value;
            const anioC = qs('#anio-cursada').value;
            const modal = qs('#modalidad').value;

            qs('#anio-display').textContent = anio || '–';
            qs('#masthead-jurisdiccion').textContent = juris || 'Ministerio de Educación – Nivel Superior No Universitario';
            qs('#masthead-instituto').textContent = inst || 'Planificación Anual de Cátedra';
            qs('#masthead-carrera').textContent = carrera || 'Carrera no especificada';
            qs('#masthead-materia').textContent = materia || 'Asignatura no especificada';
            qs('#masthead-anio-cursada').textContent = anioC || '';
            qs('#masthead-modalidad').textContent = modal || '';
            qs('#masthead-siglas').textContent = inst ? this.initials(inst) : '–';
        };

        ['anio', 'jurisdiccion', 'instituto', 'carrera', 'materia', 'anio-cursada'].forEach(id => {
            qs('#' + id).addEventListener('input', updateMasthead);
        });
        qs('#modalidad').addEventListener('change', updateMasthead);

        // Buttons
        qs('#add-row').onclick = () => this.addRowUnidades();
        qs('#clear-rows').onclick = () => qs('#tabla-unidades tbody').innerHTML = '';
        qs('#add-ficha').onclick = () => this.addFicha();
        qs('#add-crono').onclick = () => this.addRowCronograma();
        qs('#clear-crono').onclick = () => qs('#cronograma tbody').innerHTML = '';
        qs('#reset-form').onclick = () => {
            if(confirm("¿Limpiar todo el formulario?")) {
                document.querySelectorAll('.pad-view input, .pad-view textarea, .pad-view select').forEach(el => el.value = '');
                qs('#tabla-unidades tbody').innerHTML = '';
                qs('#fichas-container').innerHTML = '';
                qs('#cronograma tbody').innerHTML = '';
                updateMasthead();
            }
        };
        qs('#open-plan-url').onclick = () => {
            const url = qs('#plan-url').value;
            if(url) window.open(url, '_blank');
        };

        // Sync Materia Selection
        qs('#pad-materia-sel').onchange = (e) => {
            const id = e.target.value;
            const mat = this.db.materias.find(m => m.id == id);
            if (mat) {
                qs('#materia').value = mat.nombre;
                qs('#masthead-materia').textContent = mat.nombre;
                qs('#masthead-materia-code').textContent = `[${mat.codigo}]`;
            } else {
                qs('#materia').value = '';
                qs('#masthead-materia').textContent = 'Asignatura no especificada';
                qs('#masthead-materia-code').textContent = '';
            }
        };
    },

    initials(name) {
        return name.trim().split(/\s+/).filter(w => w.length > 3).slice(0, 3)
            .map(w => w[0].toUpperCase()).join('') || name.slice(0, 2).toUpperCase() || '?';
    },

    addRowUnidades(data = {}) {
        const tbody = document.querySelector('#tabla-unidades tbody');
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td contenteditable="true" style="text-align:center;">${data.unidad || (tbody.children.length + 1)}</td>
            <td contenteditable="true">${data.titulo || 'Nueva Unidad'}</td>
            <td contenteditable="true">${data.duracion || ''}</td>
            <td contenteditable="true">${data.contenidos || ''}</td>
            <td contenteditable="true">${data.instancias || ''}</td>
            <td contenteditable="true" style="text-align:center;">${data.ponderacion || ''}</td>
        `;
        tbody.appendChild(tr);
    },

    addRowCronograma(data = {}) {
        const tbody = document.querySelector('#cronograma tbody');
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td contenteditable="true">${data.fecha || 'Semana ' + (tbody.children.length + 1)}</td>
            <td contenteditable="true">${data.tema || ''}</td>
            <td contenteditable="true">${data.actividad || ''}</td>
            <td contenteditable="true">${data.evaluacion || ''}</td>
        `;
        tbody.appendChild(tr);
    },

    addFicha(data = {}) {
        const container = document.getElementById('fichas-container');
        const tpl = document.getElementById('tpl-ficha');
        const node = tpl.content.cloneNode(true);
        const card = node.querySelector('.ficha-card');
        
        if (data.unidad) card.querySelector('.f-unidad').value = data.unidad;
        if (data.titulo) card.querySelector('.f-titulo').value = data.titulo;
        if (data.duracion) card.querySelector('.f-duracion').value = data.duracion;
        if (data.objetivos) card.querySelector('.f-objetivos').value = data.objetivos;
        if (data.contenidos) card.querySelector('.f-contenidos').value = data.contenidos;
        if (data.minimos) card.querySelector('.f-minimos').value = data.minimos;
        if (data.actividades) card.querySelector('.f-actividades').value = data.actividades;
        if (data.recursos) card.querySelector('.f-recursos').value = data.recursos;

        card.querySelector('.btn-remove').onclick = () => {
            card.remove();
            this.updateFichaNums();
        };

        container.appendChild(node);
        this.updateFichaNums();
    },

    updateFichaNums() {
        document.querySelectorAll('#fichas-container .unidad-num').forEach((el, idx) => {
            el.textContent = idx + 1;
        });
    },

    async loadPlan() {
        const materiaId = document.getElementById('pad-materia-sel').value;
        const anio = document.getElementById('pad-anio-lectivo').value;
        if (!materiaId || !anio) return alert("Seleccione materia y año");

        try {
            const res = await fetch(`/api/planificaciones?materia_id=${materiaId}&anio_lectivo=${anio}`).then(r => r.json());
            if (res && res.length > 0) {
                this.fillForm(res[0]);
                document.getElementById('pad-form-container').style.display = 'block';
            } else {
                if (confirm("No se encontró planificación. ¿Desea crear una nueva?")) {
                    this.currentPlan = null;
                    document.getElementById('pad-form-container').style.display = 'block';
                    // Auto-fill some basics
                    const mat = this.db.materias.find(m => m.id == materiaId);
                    document.getElementById('materia').value = mat.nombre;
                    document.getElementById('anio').value = anio;
                    
                    // Auto-fill institution data
                    const instSelector = document.getElementById('inst-selector');
                    const deptSelector = document.getElementById('dept-selector');
                    if (instSelector) {
                        const instOption = instSelector.options[instSelector.selectedIndex];
                        if (instOption) {
                            document.getElementById('instituto').value = instOption.text;
                        }
                    }
                    if (deptSelector) {
                        const deptOption = deptSelector.options[deptSelector.selectedIndex];
                        if (deptOption) {
                            document.getElementById('carrera').value = deptOption.text;
                        }
                    }

                    // Auto-fill docente from session if possible
                    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
                    if (user.rol === 'docente' || user.rol === 'admin') {
                         document.getElementById('docente').value = user.username;
                         document.getElementById('firma-doc').value = user.username;
                    }

                    document.getElementById('anio').dispatchEvent(new Event('input'));
                }
            }
        } catch (e) {
            console.error(e);
        }
    },

    fillForm(plan) {
        this.currentPlan = plan;
        const qs = (s) => document.getElementById(s);
        
        qs('anio').value = plan.anio_lectivo || '';
        qs('jurisdiccion').value = plan.jurisdiccion || '';
        qs('instituto').value = plan.instituto || '';
        qs('carrera').value = plan.carrera || '';
        qs('anio-cursada').value = plan.anio_cursada || '';
        qs('materia').value = plan.materia || '';
        qs('modalidad').value = plan.modalidad || '';
        qs('carga').value = plan.carga_horaria || '';

        // Marco Curricular (JSON Parse)
        try {
            const mc = JSON.parse(plan.marco_curricular || '{}');
            qs('objgen').value = mc.objgen || '';
            qs('competencias').value = mc.competencias || '';
            qs('perfil').value = mc.perfil || '';
            qs('metodologia').value = mc.metodologia || '';
        } catch(e){}

        // Normativa
        try {
            const n = JSON.parse(plan.normativa || '{}');
            qs('ram').value = n.ram || '';
            qs('aprob').value = n.aprob || '';
        } catch(e){}

        // Correlatividades
        try {
            const c = JSON.parse(plan.correlatividades || '{}');
            qs('correl-cursar').value = c.cursar || '';
            qs('correl-final').value = c.final || '';
            qs('correl-simult').value = c.simult || '';
            qs('plan-url').value = c.plan_url || '';
        } catch(e){}

        // Unidades
        document.querySelector('#tabla-unidades tbody').innerHTML = '';
        try {
            const units = JSON.parse(plan.unidades || '[]');
            units.forEach(u => this.addRowUnidades(u));
        } catch(e){}

        // Fichas
        document.getElementById('fichas-container').innerHTML = '';
        try {
            const fichas = JSON.parse(plan.fichas || '[]');
            fichas.forEach(f => this.addFicha(f));
        } catch(e){}

        // Cronograma
        document.querySelector('#cronograma tbody').innerHTML = '';
        try {
            const crono = JSON.parse(plan.cronograma || '[]');
            crono.forEach(c => this.addRowCronograma(c));
        } catch(e){}

        // Biblio
        try {
            const b = JSON.parse(plan.bibliografia || '{}');
            qs('biblio-ob').value = b.ob || '';
            qs('biblio-comp').value = b.comp || '';
        } catch(e){}

        // Firmas
        try {
            const f = JSON.parse(plan.firmas || '{}');
            qs('firma-doc').value = f.docente || '';
            qs('firma-coord').value = f.coord || '';
        } catch(e){}

        // Practica Profesionalizante
        try {
            const pp = JSON.parse(plan.practica_profesionalizante || '{}');
            qs('practica-desc').value = pp.descripcion || '';
        } catch(e){}

        // Evaluacion
        try {
            const ev = JSON.parse(plan.evaluacion || '{}');
            qs('criterios').value = ev.criterios || '';
            qs('instrumentos').value = ev.instrumentos || '';
            qs('ponderaciones').value = ev.ponderaciones || '';
        } catch(e){}

        // Sync top selector and codes
        const topSel = document.getElementById('pad-materia-sel');
        if (topSel && plan.materia_id) {
            topSel.value = plan.materia_id;
            const mat = this.db.materias.find(m => m.id == plan.materia_id);
            if (mat) {
                const codeEl = document.getElementById('masthead-materia-code');
                if (codeEl) codeEl.textContent = `[${mat.codigo}]`;
            }
        }

        document.getElementById('anio').dispatchEvent(new Event('input'));
    },

    async savePlan() {
        const materiaId = document.getElementById('pad-materia-sel').value;
        const anio = document.getElementById('pad-anio-lectivo').value;
        if (!materiaId || !anio) return alert("Materia y año requeridos");

        const planData = {
            materia_id: parseInt(materiaId),
            anio_lectivo: parseInt(anio),
            jurisdiccion: document.getElementById('jurisdiccion').value,
            instituto: document.getElementById('instituto').value,
            carrera: document.getElementById('carrera').value,
            anio_cursada: document.getElementById('anio-cursada').value,
            modalidad: document.getElementById('modalidad').value,
            carga_horaria: parseFloat(document.getElementById('carga').value) || 0,
            
            marco_curricular: JSON.stringify({
                objgen: document.getElementById('objgen').value,
                competencias: document.getElementById('competencias').value,
                perfil: document.getElementById('perfil').value,
                metodologia: document.getElementById('metodologia').value
            }),
            normativa: JSON.stringify({
                ram: document.getElementById('ram').value,
                aprob: document.getElementById('aprob').value
            }),
            correlatividades: JSON.stringify({
                cursar: document.getElementById('correl-cursar').value,
                final: document.getElementById('correl-final').value,
                simult: document.getElementById('correl-simult').value,
                plan_url: document.getElementById('plan-url').value
            }),
            unidades: JSON.stringify(Array.from(document.querySelectorAll('#tabla-unidades tbody tr')).map(tr => ({
                unidad: tr.cells[0].textContent,
                titulo: tr.cells[1].textContent,
                duracion: tr.cells[2].textContent,
                contenidos: tr.cells[3].textContent,
                instancias: tr.cells[4].textContent,
                ponderacion: tr.cells[5].textContent
            }))),
            fichas: JSON.stringify(Array.from(document.querySelectorAll('#fichas-container .ficha-card')).map(card => ({
                unidad: card.querySelector('.f-unidad').value,
                titulo: card.querySelector('.f-titulo').value,
                duracion: card.querySelector('.f-duracion').value,
                objetivos: card.querySelector('.f-objetivos').value,
                contenidos: card.querySelector('.f-contenidos').value,
                minimos: card.querySelector('.f-minimos').value,
                actividades: card.querySelector('.f-actividades').value,
                recursos: card.querySelector('.f-recursos').value
            }))),
            cronograma: JSON.stringify(Array.from(document.querySelectorAll('#cronograma tbody tr')).map(tr => ({
                fecha: tr.cells[0].textContent,
                tema: tr.cells[1].textContent,
                actividad: tr.cells[2].textContent,
                evaluacion: tr.cells[3].textContent
            }))),
            evaluacion: JSON.stringify({
                criterios: document.getElementById('criterios').value,
                instrumentos: document.getElementById('instrumentos').value,
                ponderaciones: document.getElementById('ponderaciones').value
            }),
            bibliografia: JSON.stringify({
                ob: document.getElementById('biblio-ob').value,
                comp: document.getElementById('biblio-comp').value
            }),
            firmas: JSON.stringify({
                docente: document.getElementById('firma-doc').value,
                coord: document.getElementById('firma-coord').value
            }),
            practica_profesionalizante: JSON.stringify({
                descripcion: document.getElementById('practica-desc').value
            })
        };

        try {
            const method = this.currentPlan ? 'PUT' : 'POST';
            const url = this.currentPlan ? `/api/planificaciones/${this.currentPlan.id}` : '/api/planificaciones';
            
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(planData)
            }).then(r => r.json());
            
            if (res.id) {
                this.currentPlan = res;
                alert("✅ Planificación guardada correctamente");
            }
        } catch (e) {
            console.error(e);
            alert("❌ Error al guardar");
        }
    },

    loadDummyData() {
        if (!confirm("Se cargarán datos de ejemplo. Perderás los cambios no guardados. ¿Continuar?")) return;
        
        document.getElementById('pad-form-container').style.display = 'block';
        
        const dummy = {
            anio_lectivo: 2026,
            jurisdiccion: 'Ministerio de Educación – Provincia de Santa Fe – DES',
            instituto: 'Instituto Superior de Formación Docente y Técnica Nº 18 "Dr. Antenor Tello"',
            carrera: 'Tecnicatura Superior en Programación (Res. Prov. N° 2457/2019)',
            materia: 'Programación I – Lenguajes y Paradigmas',
            anio_cursada: '1° Año – 2° Cuatrimestre',
            modalidad: 'Mixta (presencial + virtual)',
            carga_horaria: 96,
            marco_curricular: JSON.stringify({
                objgen: '• Comprender los fundamentos del pensamiento computacional.\n• Implementar soluciones en lenguajes de alto nivel.',
                competencias: 'Competencia 3 – Diseño e implementación de soluciones informáticas.',
                perfil: 'Esta asignatura aporta al perfil del Técnico Superior en Programación.',
                metodologia: 'Enfoque constructivista con resolución de problemas reales.'
            }),
            normativa: JSON.stringify({
                ram: 'Decreto N° 4199/2015 – Art. 28 · Art. 32 (Asistencia 75%)',
                aprob: 'Aprobada CD el 14/03/2026 – Acta N° 02/2026'
            }),
            correlatividades: JSON.stringify({
                cursar: '• Matemática I (regular)',
                final: '• Matemática I (aprobada)',
                simult: '• Laboratorio I',
                plan_url: 'https://ejemplo.com/plan.pdf'
            }),
            unidades: JSON.stringify([{
                unidad: '1', titulo: 'Pensamiento Computacional', duracion: '4 sem', 
                contenidos: 'Algoritmos, diagramas', instancias: 'Parcial 1', ponderacion: '30'
            }]),
            fichas: JSON.stringify([{
                unidad: '1', titulo: 'Pensamiento Computacional', duracion: '4 sem',
                objetivos: 'Identificar componentes', contenidos: 'Variables, constantes',
                minimos: 'Sintaxis básica', actividades: 'Prácticas en PC', recursos: 'IDE'
            }]),
            cronograma: JSON.stringify([{
                fecha: 'Semana 1', tema: 'Introducción', actividad: 'Teoría', evaluacion: 'Diagnóstico'
            }]),
            bibliografia: JSON.stringify({ ob: 'Deitel - Java', comp: 'MDN Web Docs' }),
            practica_profesionalizante: JSON.stringify({ descripcion: 'Proyecto Final: Desarrollar una API REST con FastAPI y PostgreSQL.' }),
            evaluacion: JSON.stringify({ criterios: 'Asistencia 75%', instrumentos: 'Parciales', ponderaciones: 'Examen 60%' }),
            firmas: JSON.stringify({ docente: 'García, Juan', coord: 'Perez, Maria' })
        };
        
        this.fillForm(dummy);
        this.currentPlan = null; // Re-init currentPlan so it saves as new if not previously loaded
    },

    async exportPDF() {
        const { jsPDF } = window.jspdf;
        const container = document.querySelector('.pad-view .container');
        const form = document.getElementById('pad-form-container');
        
        if (!form || form.style.display === 'none') {
            return alert("No hay una planificación cargada para exportar.");
        }

        const btn = document.querySelector('.btn-secondary');
        const originalText = btn.innerHTML;
        btn.innerHTML = '⌛ Generando...';
        btn.disabled = true;

        try {
            // Ocultar elementos no deseados
            const noPrint = document.querySelectorAll('.no-print, .fixed-actions');
            noPrint.forEach(el => el.style.display = 'none');

            // Capturar el contenido
            const canvas = await html2canvas(form, {
                scale: 2,
                useCORS: true,
                logging: false,
                windowWidth: 1200
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            // Manejo de múltiples páginas si es necesario
            let heightLeft = pdfHeight;
            let position = 0;
            const pageHeight = pdf.internal.pageSize.getHeight();

            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
            heightLeft -= pageHeight;

            while (heightLeft >= 0) {
                position = heightLeft - pdfHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
                heightLeft -= pageHeight;
            }

            const filename = `PAD_${document.getElementById('materia').value || 'Planificacion'}_${document.getElementById('anio').value}.pdf`;
            pdf.save(filename);

            // Restaurar visibilidad
            noPrint.forEach(el => el.style.display = '');
        } catch (e) {
            console.error("Error generating PDF:", e);
            alert("Error al generar el PDF. Puedes intentar usar la función de impresión del navegador (Ctrl+P).");
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }
};
