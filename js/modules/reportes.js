// js/modules/reportes.js
import { Docentes } from './docentes.js';
import { Departamentos } from './departamentos.js';
import { Materias } from './materias.js';
import { Aulas } from './aulas.js';
import { Comisiones } from './comisiones.js';

export const Reportes = {
    datosMaestros: null,

    // Cargar todos los datos necesarios para evitar llamadas repetitivas
    cargarDatosMaestros: async () => {
        try {
            const [docentes, departamentos, materias, aulas, comisiones, asignaciones, modulos, cargos, cargoAsignaciones] = await Promise.all([
                Docentes.list(),
                Departamentos.list(),
                Materias.list(),
                fetch('/api/aulas').then(r => r.json()),
                Comisiones.list(),
                fetch('/api/asignaciones').then(r => r.json()),
                fetch('/api/modulos').then(r => r.json()),
                fetch('/api/cargos').then(r => r.json()),
                fetch('/api/cargo-asignaciones').then(r => r.json())
            ]);

            Reportes.datosMaestros = {
                docentes, departamentos, materias, aulas, comisiones, asignaciones, modulos, cargos, cargoAsignaciones
            };
            return true;
        } catch (error) {
            console.error("Error cargando datos maestros en reportes:", error);
            return false;
        }
    },

    render: async (containerId) => {
        const container = document.getElementById(containerId);
        container.innerHTML = `
            <div id="reportes-view" class="view">
                <div class="reports-header animated slideInDown">
                    <h2>Módulo de Reportes Acumulados</h2>
                    <p class="reports-subtitle">Analice estadísticas cruzadas en tiempo real de Docentes, Departamentos y Padrón Diario.</p>
                </div>
                
                <div class="reports-controls animated fadeIn">
                    <div class="form-group reports-form-group">
                        <label>Seleccione el Tipo de Reporte</label>
                        <select id="report-type" class="select-modern">
                            <option value="" disabled selected>-- Elija --</option>
                            <option value="docente">🧍‍♂️ Por Docente</option>
                            <option value="departamento">🏛️ Por Departamento</option>
                            <option value="dia">🗓️ Padrón por Día</option>
                        </select>
                    </div>
                    
                    <div class="form-group reports-form-group filter-group hidden" id="filter-docente-group">
                        <label>Buscar Docente</label>
                        <select id="filter-docente" class="select-modern">
                            <option value="" disabled selected>-- Todos los Docentes --</option>
                        </select>
                    </div>
                    
                    <div class="form-group reports-form-group filter-group hidden" id="filter-departamento-group">
                        <label>Buscar Departamento</label>
                        <select id="filter-departamento" class="select-modern">
                            <option value="" disabled selected>-- Todos los Departamentos --</option>
                        </select>
                    </div>

                    <div class="form-group reports-form-group filter-group hidden" id="filter-dia-group">
                        <label>Seleccionar Día</label>
                        <select id="filter-dia" class="select-modern">
                            <option value="" disabled selected>-- Hoy --</option>
                            <option value="lunes">Lunes</option>
                            <option value="martes">Martes</option>
                            <option value="miércoles">Miércoles</option>
                            <option value="jueves">Jueves</option>
                            <option value="viernes">Viernes</option>
                            <option value="sábado">Sábado</option>
                            <option value="domingo">Domingo</option>
                        </select>
                    </div>
                </div>

                <div id="report-results" class="reports-container">
                    <div class="empty-state">
                        Seleccione un tipo de reporte arriba para comenzar.
                    </div>
                </div>
            </div>
        `;

        // Pre-cargar datos
        const btnControls = document.querySelector('.reports-controls');
        btnControls.style.opacity = '0.5';
        btnControls.style.pointerEvents = 'none';

        const success = await Reportes.cargarDatosMaestros();
        if(!success) {
            container.innerHTML += `<div class="error-message">Fallo de red al obtener datos de los reportes. Intente nuevamente.</div>`;
            return;
        }

        btnControls.style.opacity = '1';
        btnControls.style.pointerEvents = 'auto';

        Reportes.poblarFiltros();
        Reportes.setupListeners();
    },

    poblarFiltros: () => {
        const { docentes, departamentos } = Reportes.datosMaestros;
        
        const selDocente = document.getElementById('filter-docente');
        docentes.sort((a,b) => a.apellido.localeCompare(b.apellido)).forEach(d => {
            selDocente.innerHTML += `<option value="${d.id}">${d.apellido}, ${d.nombre}</option>`;
        });

        const selDepto = document.getElementById('filter-departamento');
        departamentos.forEach(d => {
            selDepto.innerHTML += `<option value="${d.id}">${d.nombre}</option>`;
        });
        
        // Poner dia de hoy por defecto si corresponde
        const todayStr = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'][new Date().getDay()];
        const selDia = document.getElementById('filter-dia');
        const opt = [...selDia.options].find(o => o.value === todayStr);
        if(opt) {
            opt.selected = true;
            selDia.options[0].textContent = `-- Hoy (${todayStr.charAt(0).toUpperCase() + todayStr.slice(1)}) --`;
            selDia.options[0].value = todayStr;
        }
    },

    setupListeners: () => {
        const typeSelect = document.getElementById('report-type');
        const filters = document.querySelectorAll('.filter-group');
        
        typeSelect.addEventListener('change', (e) => {
            // Ocultar todos
            filters.forEach(f => f.classList.add('hidden'));
            
            // Mostrar el especifico
            const val = e.target.value;
            if(val) {
                const grp = document.getElementById(`filter-${val}-group`);
                if(grp) grp.classList.remove('hidden');

                // Si ya hay un valor seleccionado (como el día de hoy), generar reporte automáticamente
                const specificSelect = document.getElementById(`filter-${val}`);
                if (specificSelect && specificSelect.value) {
                    if (val === 'docente') Reportes.generarReporteDocente(specificSelect.value);
                    else if (val === 'departamento') Reportes.generarReporteDepto(specificSelect.value);
                    else if (val === 'dia') Reportes.generarReporteDia(specificSelect.value);
                } else {
                    document.getElementById('report-results').innerHTML = '<div class="empty-state">Seleccione un parámetro de filtro específico.</div>';
                }
            } else {
                document.getElementById('report-results').innerHTML = '<div class="empty-state">Seleccione un tipo de reporte arriba para comenzar.</div>';
            }
        });

        document.getElementById('filter-docente').addEventListener('change', (e) => Reportes.generarReporteDocente(e.target.value));
        document.getElementById('filter-departamento').addEventListener('change', (e) => Reportes.generarReporteDepto(e.target.value));
        document.getElementById('filter-dia').addEventListener('change', (e) => Reportes.generarReporteDia(e.target.value));
    },

    generarReporteDocente: (docenteId) => {
        const resCnt = document.getElementById('report-results');
        if(!docenteId) return;
        
        docenteId = parseInt(docenteId);
        const { docentes, asignaciones, modulos, aulas, materias, departamentos, comisiones, cargos, cargoAsignaciones } = Reportes.datosMaestros;
        const docente = docentes.find(d => d.id === docenteId);
        
        const asigsPropias = asignaciones.filter(a => a.docente_id === docenteId);
        const asigsCargosPropias = (cargoAsignaciones || []).filter(c => c.docente_id === docenteId);
        
        if(asigsPropias.length === 0 && asigsCargosPropias.length === 0) {
            resCnt.innerHTML = `<div class="empty-state">El docente ${docente.apellido}, ${docente.nombre} no tiene clases ni cargos adjudicados.</div>`;
            return;
        }

        let totalHsCatedra = asigsPropias.length;
        let totalHorasRelojCargos = asigsCargosPropias.reduce((acc, c) => acc + c.total_horas, 0);
        let equivalenteRelojCatedra = (totalHsCatedra * 40) / 60;
        let totalRelojGlobal = equivalenteRelojCatedra + totalHorasRelojCargos;
        
        let deptosVistos = new Set();
        let cursosArray = [];
        let totalHorasMins = 0;

        asigsPropias.forEach(asig => {
            const m = modulos.find(mod => mod.id === asig.modulo_id);
            const aula = aulas.find(au => au.id === asig.aula_id);
            if(m && aula) {
                // calculo tiempo
                const s = Reportes.timeToMins(m.hora_inicio);
                const e = Reportes.timeToMins(m.hora_fin);
                totalHorasMins += (e - s);

                const dpt = departamentos.find(dp => dp.id === aula.departamento_id);
                if(dpt) deptosVistos.add(dpt.nombre);

                const com = comisiones.find(c => c.id === asig.comision_id);
                const mat = materias.find(ma => ma.id === (com ? com.materia_id : null));
                
                cursosArray.push({
                    dia: asig.dia_semana,
                    inicio: m.hora_inicio,
                    fin: m.hora_fin,
                    aula: aula.nombre,
                    dptId: dpt ? dpt.id : null,
                    dptNombre: dpt ? dpt.nombre : 'S/D',
                    materia: mat ? mat.nombre : 'S/M',
                    comision: com ? com.codigo : 'S/C'
                });
            }
        });

        const hsFormat = Math.floor(totalHorasMins/60) + 'h ' + (totalHorasMins%60) + 'm';

        // Ordenar cronologicamente por día
        const ordenDias = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
        cursosArray.sort((a,b) => {
            if(ordenDias.indexOf(a.dia) !== ordenDias.indexOf(b.dia)) {
                return ordenDias.indexOf(a.dia) - ordenDias.indexOf(b.dia);
            }
            return a.inicio.localeCompare(b.inicio);
        });

        let html = `
            <div class="report-metric-cards">
                <div class="metric-card primary">
                    <span class="mc-icon">👨‍🏫</span>
                    <div class="mc-data">
                        <small>Docente</small>
                        <h3>${docente.apellido}, ${docente.nombre}</h3>
                    </div>
                </div>
                <div class="metric-card acc-time">
                    <span class="mc-icon">🎓</span>
                    <div class="mc-data">
                        <small>Total HS Cátedra</small>
                        <h3>${totalHsCatedra} <small>(40m)</small></h3>
                    </div>
                </div>
                <div class="metric-card clock-time" style="background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);">
                    <span class="mc-icon">💼</span>
                    <div class="mc-data">
                        <small>Total Horas Reloj</small>
                        <h3>${totalRelojGlobal.toFixed(1)} <small>h</small></h3>
                    </div>
                </div>
            </div>
            
            <div class="report-list-container">
                <h4 class="report-section-title">Detalle de Cargos (Reloj)</h4>
                <div class="table-container" style="margin-bottom: 2rem;">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Nombre del Cargo</th>
                                <th>Departamento</th>
                                <th>Horas Reloj</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${asigsCargosPropias.length === 0 ? '<tr><td colspan="3" style="text-align:center">No posee cargos asignados</td></tr>' : 
                                asigsCargosPropias.map(a => {
                                    const cDef = cargos.find(c => c.id === a.cargo_id);
                                    const dpt = departamentos.find(d => d.id === a.departamento_id);
                                    return `<tr><td><b>${cDef ? cDef.nombre : 'S/D'}</b></td><td>${dpt ? dpt.nombre : '-'}</td><td>${a.total_horas} hs</td></tr>`;
                                }).join('')
                            }
                        </tbody>
                    </table>
                </div>

                <h4 class="report-section-title">Cronograma de Horas Cátedra</h4>
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Día</th>
                                <th>Horario</th>
                                <th>Materia y Comisión</th>
                                <th>Horas Reloj (Eq)</th>
                                <th>Departamento</th>
                                <th>Aula</th>
                            </tr>
                        </thead>
                        <tbody>
        `;

        cursosArray.forEach(c => {
            html += `
                <tr>
                    <td style="text-transform: capitalize;"><b>${c.dia}</b></td>
                    <td>${c.inicio} - ${c.fin}</td>
                    <td>${c.materia} <br><small style="color:var(--text-muted)">(${c.comision})</small></td>
                    <td>0.7 hs</td>
                    <td>${c.dptNombre}</td>
                    <td>${c.aula}</td>
                </tr>
            `;
        });

        html += `</tbody></table></div>`;
        resCnt.innerHTML = html;
    },

    generarReporteDepto: (deptoId) => {
        const resCnt = document.getElementById('report-results');
        if(!deptoId) return;
        
        deptoId = parseInt(deptoId);
        const { departamentos, asignaciones, modulos, aulas, materias, docentes, comisiones, cargos, cargoAsignaciones } = Reportes.datosMaestros;
        const dpt = departamentos.find(dp => dp.id === deptoId);
        
        const aulasDptIds = aulas.filter(a => a.departamento_id === deptoId).map(a => a.id);
        const asigsDepto = asignaciones.filter(as => aulasDptIds.includes(as.aula_id));
        const asigsCargosDepto = (cargoAsignaciones || []).filter(c => c.departamento_id === deptoId);

        if(asigsDepto.length === 0 && asigsCargosDepto.length === 0) {
            resCnt.innerHTML = `<div class="empty-state">No hay actividad ni cargos registrados en el departamento ${dpt.nombre}.</div>`;
            return;
        }

        let totalHsCatedra = asigsDepto.length;
        let totalHorasRelojCargos = asigsCargosDepto.reduce((acc, c) => acc + c.total_horas, 0);
        let totalRelojGlobal = ((totalHsCatedra * 40) / 60) + totalHorasRelojCargos;

        let matMap = {}; // acumulador de materias vs docentes y horas
        let docentesSet = new Set();
        let totalHorasMins = 0;

        asigsDepto.forEach(asig => {
            const m = modulos.find(mod => mod.id === asig.modulo_id);
            if(m) {
                const dur = Reportes.timeToMins(m.hora_fin) - Reportes.timeToMins(m.hora_inicio);
                totalHorasMins += dur;

                const com = comisiones.find(c => c.id === asig.comision_id);
                const mat = materias.find(ma => ma.id === (com ? com.materia_id : null));
                const doc = docentes.find(dc => dc.id === asig.docente_id);
                
                if (doc) docentesSet.add(doc.apellido + ', ' + doc.nombre);

                if (mat) {
                    if(!matMap[mat.nombre]) matMap[mat.nombre] = { duracion: 0, docentesAcum: new Set() };
                    matMap[mat.nombre].duracion += dur;
                    if (doc) matMap[mat.nombre].docentesAcum.add(doc.apellido);
                }
            }
        });

        const hsFormat = Math.floor(totalHorasMins/60) + 'h ' + (totalHorasMins%60) + 'm';

        let html = `
            <div class="report-metric-cards">
                <div class="metric-card primary">
                    <span class="mc-icon">🏛️</span>
                    <div class="mc-data">
                        <small>Departamento</small>
                        <h3>${dpt.nombre}</h3>
                    </div>
                </div>
                <div class="metric-card acc-time">
                    <span class="mc-icon">⏱️</span>
                    <div class="mc-data">
                        <small>Carga Horaria (HS)</small>
                        <h3>${totalHsCatedra} <small>(40m)</small></h3>
                    </div>
                </div>
                <div class="metric-card clock-time" style="background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%);">
                    <span class="mc-icon">💼</span>
                    <div class="mc-data">
                        <small>Total Horas Reloj</small>
                        <h3>${totalRelojGlobal.toFixed(1)} hs</h3>
                    </div>
                </div>
            </div>
            
            <div class="report-list-container">
                <h4 class="report-section-title">Análisis de Materias Impartidas</h4>
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Materia</th>
                                <th>Carga Horaria Semanal</th>
                                <th>Plantel Docente a Cargo</th>
                            </tr>
                        </thead>
                        <tbody>
        `;

        // Ordenar por duración desc
        Object.entries(matMap).sort((a,b) => b[1].duracion - a[1].duracion).forEach(([matNombre, datos]) => {
            const matHrs = Math.floor(datos.duracion/60) + 'h ' + (datos.duracion%60) + 'm';
            const matDocs = Array.from(datos.docentesAcum).join(', ');
            html += `
                <tr>
                    <td><b>${matNombre}</b></td>
                    <td>${matHrs}</td>
                    <td>${matDocs}</td>
                </tr>
            `;
        });

        html += `</tbody></table></div>`;
        resCnt.innerHTML = html;
    },

    generarReporteDia: (diaStr) => {
        const resCnt = document.getElementById('report-results');
        if(!diaStr) return;
        
        const { asignaciones, modulos, aulas, materias, docentes, comisiones, departamentos, cargoAsignaciones, cargos } = Reportes.datosMaestros;
        
        const asigsDia = asignaciones.filter(as => as.dia_semana === diaStr);
        const cargosDia = (cargoAsignaciones || []).filter(ca => (ca.horarios || []).some(h => h.dia_semana === diaStr));

        if(asigsDia.length === 0 && cargosDia.length === 0) {
            resCnt.innerHTML = `<div class="empty-state">No hay actividad ni cargos asignados para los días ${diaStr}.</div>`;
            return;
        }

        let cursosArray = [];
        let totalHorasMins = 0;
        let docsSet = new Set();
        let deptSet = new Set();

        // Procesar clases
        asigsDia.forEach(asig => {
            const m = modulos.find(mod => mod.id === asig.modulo_id);
            const aula = aulas.find(au => au.id === asig.aula_id);
            const doc = docentes.find(dc => dc.id === asig.docente_id);
            const com = comisiones.find(c => c.id === asig.comision_id);
            const mat = materias.find(ma => ma.id === (com ? com.materia_id : null));
            const dpt = departamentos.find(dp => dp.id === (aula ? aula.departamento_id : null));

            if(m && aula) {
                totalHorasMins += (Reportes.timeToMins(m.hora_fin) - Reportes.timeToMins(m.hora_inicio));
                if(doc) docsSet.add(doc.id);
                if(dpt) deptSet.add(dpt.id);

                cursosArray.push({
                    inicio: m.hora_inicio,
                    fin: m.hora_fin,
                    entidad: 'Clase',
                    docenteStr: doc ? `${doc.apellido}, ${doc.nombre}` : 'S/D',
                    detalleStr: mat ? mat.nombre : 'S/M',
                    dptStr: dpt ? dpt.nombre : 'S/Dpto',
                    aulaStr: aula.nombre
                });
            }
        });

        // Procesar cargos
        cargosDia.forEach(ca => {
            const doc = docentes.find(dc => dc.id === ca.docente_id);
            const cgDef = cargos.find(c => c.id === ca.cargo_id);
            const dpt = departamentos.find(dp => dp.id === ca.departamento_id);
            const slots = ca.horarios.filter(h => h.dia_semana === diaStr);

            slots.forEach(s => {
                totalHorasMins += (Reportes.timeToMins(s.hora_fin) - Reportes.timeToMins(s.hora_inicio));
                if(doc) docsSet.add(doc.id);
                if(dpt) deptSet.add(dpt.id);

                cursosArray.push({
                    inicio: s.hora_inicio,
                    fin: s.hora_fin,
                    entidad: 'Cargo',
                    docenteStr: doc ? `${doc.apellido}, ${doc.nombre}` : 'S/D',
                    detalleStr: cgDef ? cgDef.nombre : 'S/Cargo',
                    dptStr: dpt ? dpt.nombre : 'S/Dpto',
                    aulaStr: 'P. Servicio'
                });
            });
        });

        cursosArray.sort((a,b) => a.inicio.localeCompare(b.inicio));
        const hsFormat = Math.floor(totalHorasMins/60) + 'h ' + (totalHorasMins%60) + 'm';

        let html = `
            <div class="report-metric-cards">
                <div class="metric-card primary">
                    <span class="mc-icon">🗓️</span>
                    <div class="mc-data">
                        <small>Padrón Diario Seleccionado</small>
                        <h3 style="text-transform: capitalize;">${diaStr}</h3>
                    </div>
                </div>
                <div class="metric-card acc-time">
                    <span class="mc-icon">⏱️</span>
                    <div class="mc-data">
                        <small>Horas Impartidas Globales</small>
                        <h3>${hsFormat}</h3>
                    </div>
                </div>
                <div class="metric-card users">
                    <span class="mc-icon">👥</span>
                    <div class="mc-data">
                        <small>Personal Asistente (Hoy)</small>
                        <h3>${docsSet.size}</h3>
                    </div>
                </div>
                <div class="metric-card depts">
                    <span class="mc-icon">🏫</span>
                    <div class="mc-data">
                        <small>Departamentos Activos</small>
                        <h3>${deptSet.size}</h3>
                    </div>
                </div>
            </div>
            
            <div class="report-list-container">
                <h4 class="report-section-title">Timeline del Día (${cursosArray.length} actividades)</h4>
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Horario</th>
                                <th>Tipo</th>
                                <th>Personal</th>
                                <th>Materia / Cargo</th>
                                <th>Departamento</th>
                                <th>Aula</th>
                            </tr>
                        </thead>
                        <tbody>
        `;

        cursosArray.forEach(c => {
            const badgeClass = c.entidad === 'Cargo' ? 'badge-cargo' : 'badge-time';
            html += `
                <tr>
                    <td><span class="${badgeClass}">${c.inicio} - ${c.fin}</span></td>
                    <td><small>${c.entidad}</small></td>
                    <td><b>${c.docenteStr}</b></td>
                    <td>${c.detalleStr}</td>
                    <td>${c.dptStr}</td>
                    <td>${c.aulaStr}</td>
                </tr>
            `;
        });

        html += `</tbody></table></div>`;
        resCnt.innerHTML = html;
    },

    timeToMins: (tStr) => {
        if(!tStr) return 0;
        const [h, m] = tStr.split(':').map(Number);
        return h * 60 + m;
    }
};
