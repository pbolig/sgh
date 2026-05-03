// js/modules/editor.js
import { Auth } from './auth.js';
import { Departamentos } from './departamentos.js';
import { Docentes } from './docentes.js';
import { Materias } from './materias.js';
import { Comisiones } from './comisiones.js';
import { Cargos } from './cargos.js';
import { CargoAsignaciones } from './cargo_asignaciones.js';
import { Modulos } from './modulos.js';

export const Editor = {
    timeToMinutes: (time) => {
        const [h, m] = time.split(':').map(Number);
        return h * 60 + m;
    },
    minutesToTime: (totalMinutes) => {
        const h = Math.floor(totalMinutes / 60);
        const m = totalMinutes % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    },
    render: async (containerId) => {
        console.log('Rendering Editor in', containerId);
        const container = document.getElementById(containerId);
        const deptos = await Departamentos.list();

        container.innerHTML = `
            <div class="view">
                <div id="grid-container" class="grid-scroll">
                    <div class="loading">Seleccione un departamento para ver la grilla</div>
                </div>
            </div>
        `;

        const globalDeptoSelect = document.getElementById('dept-selector');

        // El estado del día y turno se manejará dentro de loadGrid o via cierres
        let currentDia = 'todos';
        let currentTurno = 'mañana';

        const updateGrid = () => {
            const deptoId = globalDeptoSelect.value;
            const container = document.getElementById('grid-container');
            if (!container) return;
            
            if (deptoId) Editor.loadGrid(deptoId, currentDia, currentTurno);
            else container.innerHTML = '<div class="loading">Seleccione un departamento en la barra superior</div>';
        };

        // Escuchar cambios en el selector global
        globalDeptoSelect.addEventListener('change', updateGrid);

        // Definir una función global para que los selectores inyectados puedan actualizar
        window.editCellUnified = Editor.editCellUnified;

        window.updateEditorFilters = (dia, turno) => {
            currentDia = dia;
            currentTurno = turno;
            updateGrid();
        };

        if (globalDeptoSelect.value) updateGrid();
    },

    loadGrid: async (deptoId, dia, turno) => {
        const gridContainer = document.getElementById('grid-container');
        if (!gridContainer) return;
        gridContainer.innerHTML = '<div class="loading">Cargando grilla...</div>';

        try {
            const authHeader = { 'Authorization': `Bearer ${Auth.getToken()}` };
            
            // Parsear ID unificado (depto:X o carrera:X)
            const [uType, uIdRaw] = deptoId.includes(':') ? deptoId.split(':') : ['depto', deptoId];
            const paramName = uType === 'carrera' ? 'carrera_id' : 'departamento_id';
            const uId = parseInt(uIdRaw);            console.log(`DEBUG: Editor.loadGrid Starting parallel batch calls for ${deptoId} (${dia}, ${turno})`);
            const startTime = Date.now();
            const logCall = (name, p) => p.then(res => { 
                console.log(`DEBUG: [${name}] loaded in ${Date.now() - startTime}ms`); 
                return res; 
            }).catch(err => {
                console.error(`DEBUG: [${name}] FAILED:`, err);
                return null;
            });

            const batchCalls = [
                logCall('modulos', fetch('/api/modulos', { headers: authHeader }).then(r => Auth.handleResponse(r)).then(r => r ? r.json() : [])),
                logCall('aulas', fetch(`/api/aulas?${paramName}=${uId}`, { headers: authHeader }).then(r => Auth.handleResponse(r)).then(r => r ? r.json() : [])),
                logCall('docentes', Docentes.list(null, uType === 'depto' ? uId : null)),
                logCall('comisiones', Comisiones.list(uType === 'depto' ? uId : null, null, uType === 'carrera' ? uId : null)),
                logCall('asignaciones', fetch(`/api/asignaciones?${paramName}=${uId}`, { headers: authHeader }).then(r => Auth.handleResponse(r)).then(r => r ? r.json() : [])),
                logCall('departamentos', Departamentos.list()),
                logCall('recreos_excluidos', fetch(`/api/recreos_excluidos?${paramName}=${uId}`, { headers: authHeader }).then(r => Auth.handleResponse(r)).then(r => r ? r.json() : [])),
                logCall('cargo-asignaciones', fetch(`/api/cargo-asignaciones?${paramName}=${uId}`, { headers: authHeader }).then(r => Auth.handleResponse(r)).then(r => r ? r.json() : [])),
                logCall('materias', Materias.list(uType === 'depto' ? uId : null, null, uType === 'carrera' ? uId : null)),
                logCall('cargos', Cargos.list()),
                logCall('config-turnos', fetch(`/api/config-turnos?${paramName}=${uId}&dia=${dia}&turno=${encodeURIComponent(turno)}`, { headers: authHeader }).then(r => Auth.handleResponse(r)).then(r => r ? r.json() : null))
            ];
            const results = await Promise.all(batchCalls);
            console.log(`DEBUG: Editor.loadGrid All parallel data ready in ${Date.now() - startTime}ms`);
            
            // Guardar para reutilizar en formularios rápidos
            const [
                modulosBatch, aulasBatch, docentes, comisiones, asignacionesBatch,
                deptos, excluidosBatch, cargosAsigBatch, materias, cargosDef, configTurno
            ] = results;
            window._last_editor_data = { docentes, deptos, cargos: cargosDef };

            // Robustness: Ensure we have arrays even on failure
            const modulos = Array.isArray(modulosBatch) ? modulosBatch : [];
            const aulas = Array.isArray(aulasBatch) ? aulasBatch : [];
            const asignaciones = Array.isArray(asignacionesBatch) ? asignacionesBatch : [];
            const excluidos = Array.isArray(excluidosBatch) ? excluidosBatch : [];
            const cargosAsig = Array.isArray(cargosAsigBatch) ? cargosAsigBatch : [];

            // Filtrado resiliente por turno
            const normalizedTurno = Editor.normalize(turno);
            const filteredModulos = modulos.filter(m => Editor.normalize(m.turno) === normalizedTurno)
                .sort((a, b) => (a.hora_inicio || '').localeCompare(b.hora_inicio || ''));

            // CONSTRUIR TIMELINE DINÁMICO
            const timeline = Editor.buildTimeline(configTurno, filteredModulos);
            const filteredAulas = [...aulas];
            if (cargosAsig.some(ca => ca.horarios.some(h => h.aula_id === null))) {
                filteredAulas.unshift({ id: 'virtual', nombre: '(Sin Aula / Cargos)', isVirtual: true });
            }

            if (filteredAulas.length === 0) {
                gridContainer.innerHTML = '<div class="error-message">Este departamento no tiene aulas registradas.</div>';
                return;
            }

            const isAllDays = dia === 'todos';
            const daysToRender = isAllDays ? ['lunes', 'martes', 'miércoles', 'jueves', 'viernes'] : [dia];

            let html = `
                <table class="grid-table ${isAllDays ? 'grid-weekly' : ''}">
                    <thead>
                        <tr>
                            <th colspan="${isAllDays ? (daysToRender.length * filteredAulas.length) + 1 : filteredAulas.length + 1}" class="grid-main-header">
                                <div class="grid-header-content">
                                    <div class="grid-controls">
                                        <select onchange="window.updateEditorFilters(this.value, '${turno}')" class="select-mini">
                                            <option value="todos" ${dia === 'todos' ? 'selected' : ''}>Todos los días</option>
                                            <option value="lunes" ${dia === 'lunes' ? 'selected' : ''}>Lunes</option>
                                            <option value="martes" ${dia === 'martes' ? 'selected' : ''}>Martes</option>
                                            <option value="miércoles" ${dia === 'miércoles' ? 'selected' : ''}>Miércoles</option>
                                            <option value="jueves" ${dia === 'jueves' ? 'selected' : ''}>Jueves</option>
                                            <option value="viernes" ${dia === 'viernes' ? 'selected' : ''}>Viernes</option>
                                        </select>
                                        <select onchange="window.updateEditorFilters('${dia}', this.value)" class="select-mini">
                                            <option value="mañana" ${turno === 'mañana' ? 'selected' : ''}>Mañana</option>
                                            <option value="tarde" ${turno === 'tarde' ? 'selected' : ''}>Tarde</option>
                                            <option value="noche" ${turno === 'noche' ? 'selected' : ''}>Noche</option>
                                        </select>
                                    </div>
                                    <span class="dept-title">${deptos.find(d => d.u_id == deptoId)?.nombre.toUpperCase() || 'UNIDAD ACADÉMICA'}</span>
                                </div>
                            </th>
                        </tr>
                        ${isAllDays ? `
                            <tr class="header-days">
                                <th rowspan="2" class="time-cell" ondblclick="window.showTimelineConfigModal()">Módulo / Hora</th>
                                ${daysToRender.map((d, i) => `<th colspan="${filteredAulas.length}" class="${i > 0 ? 'day-divider' : ''}">${d.toUpperCase()}</th>`).join('')}
                            </tr>
                            <tr class="header-aulas">
                                ${daysToRender.map((d, dIdx) => filteredAulas.map((a, aIdx) => `<th class="${dIdx > 0 && aIdx === 0 ? 'day-divider' : ''}">${a.nombre}</th>`).join('')).join('')}
                            </tr>
                        ` : `
                            <tr>
                                <th class="time-cell" ondblclick="window.showTimelineConfigModal()">Módulo / Hora</th>
                                ${filteredAulas.map(a => `<th>${a.nombre}</th>`).join('')}
                            </tr>
                        `}
                    </thead>
                    <tbody>
                        ${timeline.map((step, idx) => {
                if (step.type === 'rec') {
                    // RENDER RECREO
                    const diff = step.dur;
                    const totalCols = isAllDays ? (daysToRender.length * filteredAulas.length) + 1 : filteredAulas.length + 1;
                    const breakExcl = (day) => {
                        const normDay = Editor.normalize(day);
                        return excluidos.some(e => 
                            e.modulo_id_anterior === timeline[idx - 1]?.id && 
                            Editor.normalize(e.dia_semana) === normDay
                        );
                    };

                    if (isAllDays) {
                        return `
                                        <tr class="break-row draggable-row" draggable="true" ondragstart="window.onDragTimeline(${idx})" ondragover="event.preventDefault()" ondrop="window.onDropTimeline(${idx})">
                                            <td class="time-cell break-label" ondblclick="window.showTimelineConfigModal()">≡ RECREO</td>
                                            ${daysToRender.map((d, dIdx) => {
                            const isExcluded = breakExcl(d);
                            return `
                                                    <td colspan="${filteredAulas.length}" 
                                                        class="${isExcluded ? 'break-excluded' : ''} ${dIdx > 0 ? 'day-divider' : ''}"
                                                        title="Arrastre para reubicar. Click para editar/re-activar.">
                                                        <div class="break-content" style="display: flex; justify-content: space-between; align-items: center; width: 100%; opacity: ${isExcluded ? '0.3' : '1'};">
                                                            <div style="cursor: pointer; flex: 1; text-align: center;" onclick="window.editRecreo(${idx}, '${d}')">
                                                                <span class="break-duration">${diff} min</span>
                                                                <span class="break-time">${step.hora_inicio} - ${step.hora_fin} ${isExcluded ? '<b>(OCULTO)</b>' : ''}</span>
                                                            </div>
                                                            <div style="display: flex; gap: 5px;">
                                                                <button class="btn-edit-mini" onclick="window.editRecreo(${idx}, '${d}')" title="Editar duración">✏️</button>
                                                                <button class="btn-delete-mini" onclick="window.toggleRecreo('${deptoId}', '${d}', ${timeline[idx - 1]?.id || 'null'})" title="${isExcluded ? 'Mostrar' : 'Ocultar'}">
                                                                    ${isExcluded ? '👁️' : '🚫'}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </td>
                                                `;
                        }).join('')}
                                        </tr>
                                    `;
                    } else {
                        const isExcluded = breakExcl(dia);
                        return `
                                        <tr class="break-row draggable-row" draggable="true" ondragstart="window.onDragTimeline(${idx})" ondragover="event.preventDefault()" ondrop="window.onDropTimeline(${idx})">
                                            <td colspan="${totalCols}" 
                                                class="${isExcluded ? 'break-excluded' : ''}">
                                                <div class="break-content" style="display: flex; justify-content: space-between; align-items: center; opacity: ${isExcluded ? '0.3' : '1'}">
                                                    <div style="cursor: pointer; flex: 1;" onclick="window.editRecreo(${idx}, '${dia}')">
                                                        <span class="break-label">≡ RECREO</span>
                                                        <span class="break-duration">${diff} min</span>
                                                        <span class="break-time">${step.hora_inicio} - ${step.hora_fin} ${isExcluded ? '<b>(OCULTO EN ESTE DÍA)</b>' : ''}</span>
                                                    </div>
                                                    <div style="display: flex; gap: 8px;">
                                                        <button class="btn-edit-mini" onclick="window.editRecreo(${idx}, '${dia}')" title="Editar duración">✏️ Editar Duración</button>
                                                        <button class="btn-delete-mini" style="padding: 2px 8px;" onclick="window.toggleRecreo('${deptoId}', '${dia}', ${timeline[idx - 1]?.id || 'null'})">
                                                            ${isExcluded ? 'Re-activar Recreo' : 'Deshabilitar Recreo'}
                                                        </button>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    `;
                    }
                }

                // RENDER MODULO O PREP
                const isPrep = step.type === 'prep';
                const m = step.modulo;
                
                if (!m && !isPrep) return '';

                return `
                    <tr class="draggable-row ${isPrep ? 'prep-row' : ''}" ${!isPrep ? `draggable="true" ondragstart="window.onDragTimeline(${idx})" ondragover="event.preventDefault()" ondrop="window.onDropTimeline(${idx})"` : ''}>
                        <td class="time-cell" ${!isPrep ? 'ondblclick="window.showTimelineConfigModal()"' : ''}>
                            <div class="mod-num">${isPrep ? '🏁 APERTURA' : `≡ ${m.numero}° Módulo`}</div>
                            <div class="mod-time">${step.hora_inicio} - ${step.hora_fin}</div>
                        </td>
                        ${daysToRender.map((d, dIdx) => filteredAulas.map((a, aIdx) => {
                            // Buscar asignación de clase normal (solo si no es prep)
                            const asig = !isPrep ? asignaciones.find(as =>
                                as.aula_id === a.id &&
                                as.modulo_id === m.id &&
                                Editor.normalize(as.dia_semana) === Editor.normalize(d)
                            ) : null;

                            // Buscar horas cátedra / cargos para esta celda
                            const cargosEnCelda = cargosAsig.filter(ca => {
                                return ca.horarios.some(h =>
                                    Editor.normalize(h.dia_semana) === Editor.normalize(d) &&
                                    ( (a.isVirtual && h.aula_id === null) || (!a.isVirtual && h.aula_id === a.id) ) &&
                                    (step.hora_inicio < h.hora_fin && h.hora_inicio < step.hora_fin)
                                );
                            });

                            return `
                                <td class="grid-cell ${dIdx > 0 && aIdx === 0 ? 'day-divider' : ''} ${isPrep ? 'prep-cell' : ''}" 
                                    onclick="${a.isVirtual ? '' : `window.editCellUnified('${deptoId}', ${a.id}, ${isPrep ? 'null' : m.id}, '${d}', '${step.hora_inicio}', '${step.hora_fin}')`}"
                                    data-aula="${a.id}" data-modulo="${isPrep ? '' : m.id}" data-dia="${d}">
                                    ${asig ? Editor.renderAsig(asig, docentes, comisiones, step, d, cargosAsig, a.id) : ''}
                                    ${cargosEnCelda.map(ca => Editor.renderCargoBlock(ca, docentes, step, d, a.isVirtual)).join('')}
                                    ${!asig && cargosEnCelda.length === 0 ? '<div class="empty-cell">+</div>' : ''}
                                </td>
                            `;
                        }).join('')).join('')}
                    </tr>
                `;
            }).join('')}
                    </tbody>
                </table>
            `;
            gridContainer.innerHTML = html;

            window.showTimelineConfigModal = () => {
                Editor.showTimelineConfigModal(deptoId, dia, turno, configTurno, filteredModulos);
            };

            window.editCargoAula = (asigId) => {
                const asig = cargosAsig.find(a => a.id === asigId);
                if (asig) {
                    CargoAsignaciones.showForm(asig, docentes, deptos, cargosDef, deptoId);
                }
            };

            let draggedIdx = null;
            window.onDragTimeline = (idx) => {
                draggedIdx = idx;
                event.dataTransfer.effectAllowed = 'move';
            };

            window.onDropTimeline = async (dropIdx) => {
                event.preventDefault();
                if (draggedIdx === null || draggedIdx === dropIdx) return;

                const newSequence = [...timeline.map(s => {
                    const { idx, hora_inicio, hora_fin, modulo, ...rest } = s;
                    return rest;
                })];

                const [movedItem] = newSequence.splice(draggedIdx, 1);
                newSequence.splice(dropIdx, 0, movedItem);

                try {
                    const response = await Auth.handleResponse(await fetch('/api/config-turnos', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${Auth.getToken()}`
                        },
                        body: JSON.stringify({
                            departamento_id: deptoId,
                            dia_semana: dia,
                            turno: turno,
                            hora_inicio: timeline[0].hora_inicio,
                            secuencia: newSequence
                        })
                    }));
                    if (response) {
                        Editor.loadGrid(deptoId, dia, turno);
                    }
                } catch (error) {
                    console.error('Error al guardar secuencia:', error);
                }
            };

            window.toggleRecreo = async (deptoId, cellDia, moduloIdAnterior) => {
                const cleanDay = cellDia.trim().toLowerCase();
                
                try {
                    const response = await Auth.handleResponse(await fetch('/api/recreos_excluidos_toggle', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${Auth.getToken()}`
                        },
                        body: JSON.stringify({
                            departamento_id: deptoId,
                            dia_semana: cleanDay,
                            modulo_id_anterior: moduloIdAnterior
                        })
                    }));
                    if (response) {
                        Editor.loadGrid(deptoId, dia, turno);
                    }
                } catch (error) {
                    console.error('Error al alternar recreo:', error);
                }
            };

            window.editRecreo = async (idx, currentDia) => {
                const step = timeline[idx];
                const newDur = prompt(`Duración del recreo en minutos (actual: ${step.dur}):`, step.dur);
                
                if (newDur !== null && !isNaN(newDur)) {
                    const applyAll = confirm("¿Desea aplicar este cambio de duración a TODOS los días de la semana para este turno?");
                    
                    const cleanSequence = timeline.map(s => {
                        const item = { ...s };
                        delete item.idx;
                        delete item.hora_inicio;
                        delete item.hora_fin;
                        delete item.modulo;
                        delete item.duracion;
                        return item;
                    });

                    cleanSequence[idx].dur = parseInt(newDur);

                    try {
                        await fetch('/api/config-turnos', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${Auth.getToken()}`
                            },
                            body: JSON.stringify({
                                departamento_id: deptoId.includes('depto:') ? parseInt(deptoId.split(':')[1]) : (deptoId.includes('carrera:') ? null : parseInt(deptoId)),
                                carrera_id: deptoId.includes('carrera:') ? parseInt(deptoId.split(':')[1]) : null,
                                dia_semana: currentDia,
                                turno: turno,
                                hora_inicio: timeline[0].hora_inicio,
                                secuencia: cleanSequence,
                                aplicar_a_toda_la_semana: applyAll
                            })
                        });
                        
                        const isCurrentlyExcluded = excluidos.some(e => e.modulo_id_anterior === timeline[idx - 1]?.id && e.dia_semana === currentDia);
                        if (isCurrentlyExcluded) {
                            await fetch('/api/recreos_excluidos_toggle', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${Auth.getToken()}`
                                },
                                body: JSON.stringify({
                                    departamento_id: deptoId,
                                    dia_semana: currentDia,
                                    modulo_id_anterior: timeline[idx - 1]?.id
                                })
                            });
                        }
                        Editor.loadGrid(deptoId, dia, turno);
                    } catch (error) {
                        console.error('Error al guardar duración de recreo:', error);
                    }
                }
            };

        } catch (error) {
            console.error(error);
            gridContainer.innerHTML = '<div class="error-message">Error al cargar la grilla</div>';
        }
    },

    buildTimeline: (config, filteredModulos) => {
        let secuencia = config?.secuencia;
        let horaInicio = config?.hora_inicio || (filteredModulos.length > 0 ? filteredModulos[0].hora_inicio : "08:00");
        let desfase = config?.desfase || 0;

        if (!secuencia) {
            secuencia = [];
            filteredModulos.forEach((m, idx) => {
                secuencia.push({ type: 'mod', id: m.id, num: m.numero });
                const nextM = filteredModulos[idx + 1];
                if (nextM) {
                    const gap = Editor.timeToMinutes(nextM.hora_inicio) - Editor.timeToMinutes(m.hora_fin);
                    if (gap > 0) secuencia.push({ type: 'rec', dur: gap });
                }
            });
        }

        let currentTime = Editor.timeToMinutes(horaInicio);
        const finalTimeline = [];

        // Inyectar fila de apertura si hay desfase
        if (desfase > 0) {
            finalTimeline.push({
                type: 'prep',
                hora_inicio: Editor.minutesToTime(currentTime),
                hora_fin: Editor.minutesToTime(currentTime + desfase),
                dur: desfase,
                label: 'APERTURA / DESFASE'
            });
            currentTime += desfase;
        }

        secuencia.forEach((item, idx) => {
            const step = { ...item, idx };
            step.hora_inicio = Editor.minutesToTime(currentTime);
            if (item.type === 'mod') {
                const m = filteredModulos.find(mod => mod.id === item.id);
                step.modulo = m;
                step.duracion = 40;
                step.hora_fin = Editor.minutesToTime(currentTime + 40);
                currentTime += 40;
            } else {
                step.hora_fin = Editor.minutesToTime(currentTime + item.dur);
                currentTime += item.dur;
            }
            finalTimeline.push(step);
        });

        return finalTimeline;
    },

    showTimelineConfigModal: async (deptoId, currentDia, turno, config, allModulos) => {
        let secuencia = config?.secuencia ? JSON.parse(JSON.stringify(config.secuencia)) : 
                        allModulos.map(m => ({ type: 'mod', id: m.id, num: m.numero }));
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'timeline-editor-modal';

        const calculateFirstModStart = () => {
            const startVal = document.getElementById('tl-start-time')?.value || config?.hora_inicio || "07:30";
            const offsetVal = parseInt(document.getElementById('tl-offset')?.value) || 0;
            const startMins = Editor.timeToMinutes(startVal);
            return Editor.minutesToTime(startMins + offsetVal);
        };

        const renderSteps = () => {
            const startVal = document.getElementById('tl-start-time')?.value || config?.hora_inicio || "07:30";
            const firstModVal = document.getElementById('tl-first-mod')?.value || Editor.minutesToTime(Editor.timeToMinutes(config?.hora_inicio || "07:30") + (config?.desfase || 0));
            
            let currentTime = Editor.timeToMinutes(firstModVal);

            return secuencia.map((item, i) => {
                const dur = item.type === 'mod' ? 40 : (item.dur || 10);
                const start = Editor.minutesToTime(currentTime);
                currentTime += dur;
                const end = Editor.minutesToTime(currentTime);
                
                return `
                    <div class="timeline-item type-${item.type}">
                        <div class="timeline-item-actions">
                            <button class="btn-move" onclick="window.moveTimelineStep(${i}, -1)" ${i === 0 ? 'disabled' : ''}>▲</button>
                            <button class="btn-move" onclick="window.moveTimelineStep(${i}, 1)" ${i === secuencia.length - 1 ? 'disabled' : ''}>▼</button>
                        </div>
                        <div class="step-num">${i + 1}</div>
                        <div class="step-info">
                            <div class="step-title">
                                ${item.type === 'mod' ? `
                                    <select class="select-mod-num" onchange="window.updateModNum(${i}, this.value)">
                                        ${[1,2,3,4,5,6,7,8,9,10].map(n => `<option value="${n}" ${item.num == n ? 'selected' : ''}>${n}° Módulo</option>`).join('')}
                                    </select> 
                                    <span style="font-size: 0.8em; color: var(--text-dim);">(40 min)</span>
                                ` : 'RECREO'}
                            </div>
                            <div class="step-time">${start} - ${end}</div>
                        </div>
                        ${item.type === 'rec' ? `<div class="dur-input-group"><input type="number" value="${dur}" oninput="window.updateStepDur(${i}, this.value)"> <span>min</span></div>` : ''}
                        <button class="btn-danger-mini" onclick="window.removeStep(${i})">×</button>
                    </div>
                `;
            }).join('') + `
                <div class="timeline-summary">
                    <span>El turno finaliza a las</span>
                    <div class="end-time">${Editor.minutesToTime(currentTime)}</div>
                </div>
            `;
        };

        const updateView = () => {
            const list = document.getElementById('timeline-list-container');
            if (list) list.innerHTML = renderSteps();
            // No longer updating the first-mod-indicator as text since it's an input now.
        };

        window.updateStepDur = (idx, val) => {
            secuencia[idx].dur = parseInt(val) || 0;
            updateView();
        };

        window.removeStep = (idx) => {
            secuencia.splice(idx, 1);
            updateView();
        };

        window.moveTimelineStep = (idx, direction) => {
            const newIdx = idx + direction;
            if (newIdx < 0 || newIdx >= secuencia.length) return;
            const item = secuencia.splice(idx, 1)[0];
            secuencia.splice(newIdx, 0, item);
            updateView();
        };

        window.updateModNum = (idx, newNum) => {
            const num = parseInt(newNum);
            const m = allModulos.find(mod => mod.numero === num) || { id: null, numero: num };
            secuencia[idx].id = m.id;
            secuencia[idx].num = m.numero;
            updateView();
        };

        window.addTimelineMod = (atStart = false) => {
            const modCount = secuencia.filter(s => s.type === 'mod').length;
            const nextNum = modCount + 1;
            const m = allModulos.find(mod => mod.numero === nextNum) || { id: null, numero: nextNum };
            const item = { type: 'mod', id: m.id, num: m.numero };
            if (atStart) secuencia.unshift(item); else secuencia.push(item);
            updateView();
        };

        window.addTimelineRec = (atStart = false) => {
            const item = { type: 'rec', dur: 15 };
            if (atStart) secuencia.unshift(item); else secuencia.push(item);
            updateView();
        };

        modal.innerHTML = `
            <div class="modal-content timeline-config-modal">
                <h3>🛠️ Configuración de Cronograma</h3>
                <div class="form-row config-header-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; background: rgba(255,255,255,0.03); padding: 15px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); margin-bottom: 20px;">
                    <div class="form-group">
                        <label>🚪 Apertura Establecimiento:</label>
                        <input type="time" id="tl-start-time" value="${config?.hora_inicio || "07:30"}" oninput="window.updateTimelinePreview()">
                    </div>
                    <div class="form-group highlight-box" style="background: rgba(var(--primary-rgb), 0.1); padding: 8px 12px; border-radius: 8px; border: 1px dashed var(--primary); display: flex; flex-direction: column; justify-content: center; align-items: center;">
                        <label>📅 Inicio 1° Módulo:</label>
                        <input type="time" id="tl-first-mod" value="${Editor.minutesToTime(Editor.timeToMinutes(config?.hora_inicio || "07:30") + (config?.desfase || 0))}" oninput="window.updateTimelinePreview()" style="font-size: 1.2rem; font-weight: bold; width: 100%; text-align: center; background: transparent; border: 1px solid rgba(255,255,255,0.2); color: #818cf8; border-radius: 8px; padding: 0.5rem; cursor: pointer;">
                    </div>
                </div>

                <div id="timeline-list-container" class="timeline-list">
                    ${renderSteps()}
                </div>

                <div class="timeline-actions-row">
                    <button class="btn-primary" onclick="window.addTimelineMod(true)">+ Módulo Inicio</button>
                    <button class="btn-secondary" onclick="window.addTimelineRec(true)">+ Recreo Inicio</button>
                    <button class="btn-primary" onclick="window.addTimelineMod(false)">+ Módulo Final</button>
                    <button class="btn-secondary" onclick="window.addTimelineRec(false)">+ Recreo Final</button>
                </div>

                <div class="modal-actions">
                    <button id="btn-save-timeline" class="btn-primary" style="flex: 2;">Guardar para toda la semana</button>
                    <button onclick="document.getElementById('timeline-editor-modal').remove()" class="btn-secondary">Cancelar</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        window.updateTimelinePreview = () => updateView();

        document.getElementById('btn-save-timeline').onclick = async () => {
            const hInicio = document.getElementById('tl-start-time').value;
            const hFirstMod = document.getElementById('tl-first-mod').value;
            let dsf = Editor.timeToMinutes(hFirstMod) - Editor.timeToMinutes(hInicio);
            if (dsf < 0) dsf = 0; // Prevenir negativo por error de usuario
            console.log("DEBUG: Saving Timeline Config:", { hInicio, dsf, deptoId, currentDia, turno });

            try {
                const response = await Auth.handleResponse(await fetch('/api/config-turnos', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${Auth.getToken()}` },
                    body: JSON.stringify({
                        departamento_id: deptoId.includes('depto:') ? parseInt(deptoId.split(':')[1]) : (deptoId.includes('carrera:') ? null : parseInt(deptoId)),
                        carrera_id: deptoId.includes('carrera:') ? parseInt(deptoId.split(':')[1]) : null,
                        dia_semana: currentDia,
                        turno: turno,
                        hora_inicio: hInicio,
                        desfase: dsf,
                        secuencia: secuencia,
                        aplicar_a_toda_la_semana: true
                    })
                }));
                if (response) {
                    modal.remove();
                    Editor.loadGrid(deptoId, currentDia, turno);
                }
            } catch (error) {
                console.error('Error al guardar cronograma:', error);
                alert('Error al salvar el cronograma.');
            }
        };
    },

    minutesToTime: (totalMinutes) => {
        const h = Math.floor(totalMinutes / 60) % 24;
        const m = totalMinutes % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    },

    timeToMinutes: (timeStr) => {
        if (!timeStr) return 480; // 08:00 default
        const [h, m] = timeStr.split(':').map(Number);
        return h * 60 + m;
    },

    normalize: (str) => {
        if (!str) return '';
        return str.toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "") // Quitar acentos
            .replace(/[^a-z0-9]/g, "");     // Quitar todo lo que no sea letra o número
    },

    checkCargoConflict: (docenteId, modulo, dia, cargosAsig, currentAulaId = null) => {
        if (!docenteId || !modulo || !dia || !cargosAsig) return null;
        const asig = cargosAsig.find(ca => ca.docente_id === docenteId);
        if (!asig || !asig.horarios) return null;

        return asig.horarios.find(h => {
            if (Editor.normalize(h.dia_semana) !== Editor.normalize(dia)) return false;
            // Solo es conflicto si es en un aula distinta (o virtual) que la actual
            if (currentAulaId && h.aula_id === currentAulaId) return false;
            return modulo.hora_inicio < h.hora_fin && h.hora_inicio < modulo.hora_fin;
        });
    },

    renderAsig: (asig, docentes, comisiones, modulo = null, dia = null, cargosAsig = [], aulaId = null) => {
        const doc = docentes.find(d => d.id === asig.docente_id);
        const com = comisiones.find(c => c.id === asig.comision_id);
        const mat = com?.materia;

        // El aviso ⚠️ ahora es más específico si hay solapamiento con cargos
        const conflict = modulo && dia ? Editor.checkCargoConflict(doc?.id, modulo, dia, cargosAsig, aulaId) : null;
        
        const reem = asig.reemplazo_activo;
        const titularStyle = reem ? 'opacity: 0.5; text-decoration: line-through; font-size: 0.8rem;' : '';

        return `
            <div class="asig-block" style="border-left: 4px solid var(--primary); ${reem ? 'background: rgba(0,0,0,0.05);' : ''}">
                <div class="asig-materia">${mat ? mat.nombre : 'S/M'}</div>
                <div class="asig-docente" style="${titularStyle}">
                    ${doc ? `${doc.apellido}, ${doc.nombre}` : 'S/D'}
                    ${conflict ? `<span title="Conflicto con Horas Cátedra / Cargo" class="pulse-warning">⚠️</span>` : ''}
                </div>
                ${reem ? `
                    <div class="asig-reemplazo" style="color: var(--secondary); font-weight: bold; font-size: 0.85rem; display: flex; align-items: center; gap: 4px;">
                        <span title="Reemplazo Activo">🔄</span> ${reem.reemplazante_nombre}
                    </div>
                ` : ''}
                <div class="asig-comision">${com ? com.codigo : ''} ${com?.anio ? `(${com.anio}°)` : ''}</div>
            </div>
        `;
    },

    renderCargoBlock: (cargoAsig, docentes, modulo, dia, isVirtual) => {
        const doc = docentes.find(d => d.id === cargoAsig.docente_id);
        const hor = cargoAsig.horarios.find(h =>
            Editor.normalize(h.dia_semana) === Editor.normalize(dia) &&
            (modulo.hora_inicio < h.hora_fin && h.hora_inicio < modulo.hora_fin)
        );

        const com = hor?.comision;
        const mat = com?.materia;
        
        const reem = cargoAsig.reemplazo_activo;
        const titularStyle = reem ? 'opacity: 0.5; text-decoration: line-through; font-size: 0.75rem;' : '';

        return `
            <div class="cargo-block ${isVirtual ? 'cargo-virtual' : ''}" 
                 onclick="event.stopPropagation(); window.editCargoAula(${cargoAsig.id})"
                 style="background: ${reem ? 'rgba(0,0,0,0.05)' : 'rgba(var(--secondary-rgb), 0.1)'}; border-left: 4px solid var(--secondary); margin-top: 2px; padding: 4px; border-radius: 4px; font-size: 0.8rem; cursor: pointer;">
                <div style="font-weight: 600; color: var(--secondary); display: flex; justify-content: space-between;">
                    <span>${mat ? mat.nombre : 'CARGO / H.C.'}</span>
                    ${isVirtual ? '<span title="Falta asignar aula" class="pulse-warning">⚠️</span>' : ''}
                </div>
                <div class="asig-docente" style="${titularStyle}">${doc ? `${doc.apellido}, ${doc.nombre}` : 'S/D'}</div>
                ${reem ? `
                    <div style="color: var(--primary); font-weight: bold; font-size: 0.75rem; margin: 2px 0;">
                        🔄 ${reem.reemplazante?.apellido}, ${reem.reemplazante?.nombre}
                    </div>
                ` : ''}
                <div style="font-size: 0.7rem; opacity: 0.7; display: flex; justify-content: space-between;">
                    <span>${cargoAsig.cargo?.nombre || 'Horas Cátedra'}</span>
                    <span>${com ? `<b>${com.codigo}</b>` : ''}</span>
                </div>
            </div>
        `;
    },

    editCellUnified: async (deptoId, aulaId, moduloId, dia, hInicio = null, hFin = null) => {
        console.log("DEBUG: editCellUnified called:", { deptoId, aulaId, moduloId, dia, hInicio, hFin });
        
        let { docentes, deptos, cargos } = window._last_editor_data || {};
        
        if (!docentes) {
            const results = await Promise.all([
                Docentes.list(null, deptoId),
                Departamentos.list(),
                Cargos.list(deptoId)
            ]);
            docentes = results[0];
            deptos = results[1];
            cargos = results[2];
        }

        CargoAsignaciones.showForm(null, docentes, deptos, cargos, deptoId, {
            dia: dia,
            aulaId: aulaId,
            moduloId: moduloId,
            hora_inicio: hInicio,
            hora_fin: hFin
        }, () => {
            const controls = document.querySelectorAll('.grid-controls select');
            const selectedDia = controls[0] ? controls[0].value : dia;
            const selectedTurno = controls[1] ? controls[1].value : 'mañana';
            Editor.loadGrid(deptoId, selectedDia, selectedTurno);
        });
    }
};
