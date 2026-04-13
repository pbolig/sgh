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
            const batchCalls = [
                Auth.handleResponse(await fetch('/api/modulos', { headers: authHeader })).then(r => r ? r.json() : []),
                Auth.handleResponse(await fetch(`/api/aulas?departamento_id=${deptoId}`, { headers: authHeader })).then(r => r ? r.json() : []),
                Docentes.list(),
                Comisiones.list(deptoId),
                Auth.handleResponse(await fetch(`/api/asignaciones?departamento_id=${deptoId}`, { headers: authHeader })).then(r => r ? r.json() : []),
                Departamentos.list(),
                Auth.handleResponse(await fetch(`/api/recreos_excluidos?departamento_id=${deptoId}`, { headers: authHeader })).then(r => r ? r.json() : []),
                Auth.handleResponse(await fetch(`/api/cargo-asignaciones?departamento_id=${deptoId}`, { headers: authHeader })).then(r => r ? r.json() : []),
                Materias.list(deptoId),
                Cargos.list(),
                Auth.handleResponse(await fetch(`/api/config-turnos/${deptoId}/${dia}/${turno}`, { headers: authHeader })).then(r => r ? r.json() : null)
            ];
            const results = await Promise.all(batchCalls);

            const [
                modulosBatch, aulasBatch, docentes, comisiones, asignacionesBatch,
                deptos, excluidosBatch, cargosAsigBatch, materias, cargosDef, configTurno
            ] = results;

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
                                    <span class="dept-title">${deptos.find(d => d.id == deptoId)?.nombre.toUpperCase()}</span>
                                </div>
                            </th>
                        </tr>
                        ${isAllDays ? `
                            <tr class="header-days">
                                <th rowspan="2" class="time-cell">Módulo / Hora</th>
                                ${daysToRender.map((d, i) => `<th colspan="${filteredAulas.length}" class="${i > 0 ? 'day-divider' : ''}">${d.toUpperCase()}</th>`).join('')}
                            </tr>
                            <tr class="header-aulas">
                                ${daysToRender.map((d, dIdx) => filteredAulas.map((a, aIdx) => `<th class="${dIdx > 0 && aIdx === 0 ? 'day-divider' : ''}">${a.nombre}</th>`).join('')).join('')}
                            </tr>
                        ` : `
                            <tr>
                                <th class="time-cell">Módulo / Hora</th>
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
                    const breakExcl = (day) => excluidos.some(e => e.modulo_id_anterior === timeline[idx - 1]?.id && e.dia_semana === day);

                    if (isAllDays) {
                        return `
                                        <tr class="break-row draggable-row" draggable="true" ondragstart="window.onDragTimeline(${idx})" ondragover="event.preventDefault()" ondrop="window.onDropTimeline(${idx})">
                                            <td class="time-cell break-label">≡ RECREO</td>
                                            ${daysToRender.map((d, dIdx) => {
                            const isExcluded = breakExcl(d);
                            return `
                                                    <td colspan="${filteredAulas.length}" 
                                                        class="${isExcluded ? 'break-excluded' : ''} ${dIdx > 0 ? 'day-divider' : ''}"
                                                        onclick="window.toggleRecreo(${deptoId}, '${d}', ${timeline[idx - 1]?.id || 'null'})"
                                                        title="Arrastre para reubicar. Click para ocultar.">
                                                        <div class="break-content" style="${isExcluded ? 'opacity: 0.1;' : ''}">
                                                            <span class="break-duration">${diff} min</span>
                                                            <span class="break-time">${step.hora_inicio} - ${step.hora_fin}</span>
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
                                                class="${isExcluded ? 'break-excluded' : ''}"
                                                onclick="window.toggleRecreo(${deptoId}, '${dia}', ${timeline[idx - 1]?.id || 'null'})">
                                                <div class="break-content" style="${isExcluded ? 'opacity: 0.1' : ''}">
                                                    <span class="break-label">≡ RECREO</span>
                                                    <span class="break-duration">${diff} min</span>
                                                    <span class="break-time">${step.hora_inicio} - ${step.hora_fin}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    `;
                    }
                }

                // RENDER MODULO
                const m = step.modulo;
                if (!m) return '';

                let rows = `
                                <tr class="draggable-row" draggable="true" ondragstart="window.onDragTimeline(${idx})" ondragover="event.preventDefault()" ondrop="window.onDropTimeline(${idx})">
                                    <td class="time-cell">
                                        <div class="mod-num">≡ ${m.numero}° Módulo</div>
                                        <div class="mod-time">${step.hora_inicio} - ${step.hora_fin}</div>
                                    </td>
                                    ${daysToRender.map((d, dIdx) => filteredAulas.map((a, aIdx) => {
                    // Buscar asignación de clase normal
                    const asig = asignaciones.find(as =>
                        as.aula_id === a.id &&
                        as.modulo_id === m.id &&
                        Editor.normalize(as.dia_semana) === Editor.normalize(d)
                    );

                    // Buscar horas cátedra / cargos para esta celda
                    const cargosEnCelda = cargosAsig.filter(ca => {
                        // Validación de seguridad: el día debe tener horas > 0 en la asignación principal
                        const diaCto = d.toLowerCase().replace('í', 'i').replace('á', 'a').replace('é', 'e').replace('ó', 'o').replace('ú', 'u');
                        const horasDia = ca[`horas_${diaCto}`] || 0;
                        if (horasDia === 0) return false;

                        return ca.horarios.some(h =>
                            Editor.normalize(h.dia_semana) === Editor.normalize(d) &&
                            (
                                (a.isVirtual && h.aula_id === null) ||
                                (!a.isVirtual && h.aula_id === a.id)
                            ) &&
                            // Solapamiento de tiempo dinámico
                            (step.hora_inicio < h.hora_fin && h.hora_inicio < step.hora_fin)
                        );
                    });

                    return `
                                            <td class="grid-cell ${dIdx > 0 && aIdx === 0 ? 'day-divider' : ''}" 
                                                onclick="${a.isVirtual ? '' : `window.editCellUnified(${deptoId}, ${a.id}, ${m.id}, '${d}')`}"
                                                data-aula="${a.id}" data-modulo="${m.id}" data-dia="${d}">
                                                ${asig ? Editor.renderAsig(asig, docentes, comisiones, step, d, cargosAsig, a.id) : ''}
                                                ${cargosEnCelda.map(ca => Editor.renderCargoBlock(ca, docentes, step, d, a.isVirtual)).join('')}
                                                ${!asig && cargosEnCelda.length === 0 ? '<div class="empty-cell">+</div>' : ''}
                                            </td>
                                        `;
                }).join('')).join('')}
                                </tr>
                            `;
                return rows;
            }).join('')}
                    </tbody>
                </table>
            `;
            gridContainer.innerHTML = html;

            window.editCell = (deptoId, aulaId, moduloId, dia) => {
                const asig = asignaciones.find(as =>
                    as.aula_id === aulaId &&
                    as.modulo_id === moduloId &&
                    Editor.normalize(as.dia_semana) === Editor.normalize(dia)
                );
                const modulo = filteredModulos.find(m => m.id === moduloId);
                Editor.showCellForm(deptoId, aulaId, moduloId, dia, asig, docentes, comisiones, materias, turno, cargosAsig, modulo);
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

            window.toggleRecreo = async (deptoId, dia, moduloIdAnterior) => {
                try {
                    const response = await Auth.handleResponse(await fetch('/api/recreos_excluidos', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${Auth.getToken()}`
                        },
                        body: JSON.stringify({
                            departamento_id: deptoId,
                            dia_semana: dia,
                            modulo_id_anterior: moduloIdAnterior
                        })
                    }));
                    if (response && response.ok) {
                        Editor.loadGrid(deptoId, dia === 'todos' ? 'todos' : dia, turno);
                    }
                } catch (error) {
                    console.error('Error al alternar recreo:', error);
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

        if (!secuencia) {
            // Generar secuencia por defecto basada en los huecos existentes
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

        // Calcular timeline real sumando duraciones
        let currentTime = Editor.timeToMinutes(horaInicio);
        return secuencia.map((item, idx) => {
            const step = { ...item, idx };
            step.hora_inicio = Editor.minutesToTime(currentTime);
            if (item.type === 'mod') {
                const m = filteredModulos.find(mod => mod.id === item.id);
                step.modulo = m;
                step.duracion = 40; // Módulos de 40m
                step.hora_fin = Editor.minutesToTime(currentTime + 40);
                currentTime += 40;
            } else {
                step.hora_fin = Editor.minutesToTime(currentTime + item.dur);
                currentTime += item.dur;
            }
            return step;
        });
    },

    minutesToTime: (totalMinutes) => {
        const h = Math.floor(totalMinutes / 60) % 24;
        const m = totalMinutes % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    },

    timeToMinutes: (timeStr) => {
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

    editCellUnified: async (deptoId, aulaId, moduloId, dia) => {
        // Redirigir a vista de cargos para asegurar que el contexto sea el correcto
        // document.querySelector('[data-view="cargos"]').click();

        // Obtener datos necesarios para abrir el formulario de cargos
        const [docentes, deptos, cargos, modulos] = await Promise.all([
            Docentes.list(null, deptoId),
            Departamentos.list(),
            Cargos.list(),
            Modulos.list()
        ]);

        const mod = modulos.find(m => m.id === moduloId);

        // Abrir el formulario directamente con pre-llenado
        CargoAsignaciones.showForm(null, docentes, deptos, cargos, deptoId, {
            dia: dia,
            aulaId: aulaId,
            moduloId: moduloId,
            hora_inicio: mod?.hora_inicio,
            hora_fin: mod?.hora_fin
        });
    },

    showCellForm: (deptoId, aulaId, moduloId, dia, asig, docentes, comisiones, materias, turno, cargosAsig = [], currentModulo = null) => {
        const modal = document.createElement('div');
        modal.className = 'modal';

        // Obtener la comisión seleccionada actualmente (si existe) para saber su año
        const currentCom = asig ? comisiones.find(c => c.id === asig.comision_id) : null;
        const currentMat = currentCom ? materias.find(m => m.id === currentCom.materia_id) : null;
        const initialAnio = currentMat ? currentMat.anio : "";

        modal.innerHTML = `
            <div class="modal-content">
                <h3>Asignación: ${dia} - Módulo ${moduloId}</h3>
                <form id="asig-form">
                    <input type="hidden" name="departamento_id" value="${deptoId}">
                    <input type="hidden" name="aula_id" value="${aulaId}">
                    <input type="hidden" name="modulo_id" value="${moduloId}">
                    <input type="hidden" name="dia_semana" value="${dia}">
                    
                    <div class="form-row" style="display: flex; gap: 10px;">
                        <div class="form-group" style="flex: 1;">
                            <label>Filtrar por Año:</label>
                            <select id="filter-anio-modal">
                                <option value="">-- Todos --</option>
                                <option value="1" ${initialAnio == 1 ? 'selected' : ''}>1° Año</option>
                                <option value="2" ${initialAnio == 2 ? 'selected' : ''}>2° Año</option>
                                <option value="3" ${initialAnio == 3 ? 'selected' : ''}>3° Año</option>
                                <option value="4" ${initialAnio == 4 ? 'selected' : ''}>4° Año</option>
                                <option value="5" ${initialAnio == 5 ? 'selected' : ''}>5° Año</option>
                            </select>
                        </div>
                        <div class="form-group" style="flex: 2;">
                            <label>Comisión:</label>
                            <select name="comision_id" id="comision-selector-modal">
                                <option value="">Ninguna</option>
                                <!-- Se poblará dinámicamente -->
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>Docente:</label>
                        <select name="docente_id" id="docente-selector-modal">
                            <option value="">Ninguno</option>
                            ${docentes
                .sort((a, b) => (a.apellido || '').localeCompare(b.apellido || ''))
                .map(d => {
                    const conflict = Editor.checkCargoConflict(d.id, currentModulo, dia, cargosAsig);
                    return `<option value="${d.id}" ${asig?.docente_id === d.id ? 'selected' : ''} 
                                        style="${conflict ? 'color: #f59e0b' : ''}">
                                        ${d.apellido}, ${d.nombre} ${conflict ? '⚠️ (Horas Cátedra)' : ''}
                                    </option>`;
                }).join('')}
                        </select>
                        <div id="cargo-warning-msg" class="warning-msg" style="display:none; color: #f59e0b; font-size: 0.85rem; margin-top: 5px;">
                            ⚠️ El docente tiene horas cátedra asignadas en este horario.
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>Observaciones:</label>
                        <textarea name="observaciones">${asig?.observaciones || ''}</textarea>
                    </div>

                    <div class="modal-actions" style="margin-top: 20px; border-top: 1px solid var(--border); padding-top: 20px; display: flex; flex-direction: column; gap: 10px;">
                        <div style="display: flex; gap: 10px;">
                            <button type="submit" class="btn-primary" style="flex: 2;">Guardar Asignación de Clase</button>
                            <button type="button" class="btn-secondary" id="btn-close-modal" style="flex: 1;">Cancelar</button>
                        </div>
                        <button type="button" id="btn-manage-as-cargo" class="btn-edit" style="width: 100%; justify-content: center; background: rgba(var(--secondary-rgb), 0.1); border: 1px solid var(--secondary); color: var(--secondary); display: flex; align-items: center; gap: 8px;">
                            📅 Gestionar como Cargo / Horas Cátedra
                        </button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);

        const selAnio = document.getElementById('filter-anio-modal');
        const selCom = document.getElementById('comision-selector-modal');

        const updateComisiones = () => {
            const anio = selAnio.value;
            const filteredComs = comisiones.filter(c => {
                if (!anio) return true;
                const mat = materias.find(m => m.id === c.materia_id);
                return mat && mat.anio == anio;
            });

            selCom.innerHTML = '<option value="">Ninguna</option>' +
                filteredComs
                    .sort((a, b) => (a.codigo || '').localeCompare(b.codigo || '', undefined, { numeric: true, sensitivity: 'base' }))
                    .map(c => {
                        const mat = materias.find(m => m.id === c.materia_id);
                        return `<option value="${c.id}" ${asig?.comision_id === c.id ? 'selected' : ''}>${c.codigo} - ${mat ? mat.nombre : ''}</option>`;
                    }).join('');
        };

        selAnio.onchange = updateComisiones;
        updateComisiones(); // Carga inicial

        const selDoc = document.getElementById('docente-selector-modal');
        const warnMsg = document.getElementById('cargo-warning-msg');

        const updateDocenteWarning = () => {
            const docenteId = parseInt(selDoc.value);
            const conflict = Editor.checkCargoConflict(docenteId, currentModulo, dia, cargosAsig);
            warnMsg.style.display = conflict ? 'block' : 'none';
        };
        selDoc.onchange = updateDocenteWarning;
        updateDocenteWarning();

        document.getElementById('btn-close-modal').onclick = () => modal.remove();

        // Acceso directo a Gestión de Cargos
        document.getElementById('btn-manage-as-cargo').onclick = async () => {
            const docenteId = parseInt(selDoc.value);
            modal.remove();

            // Buscar si ya existe una asignación para este docente en este departamento
            const asigs = await CargoAsignaciones.list(deptoId);
            const existingAsig = docenteId ? asigs.find(a => a.docente_id === docenteId) : null;

            // Abrir el formulario de Cargos
            CargoAsignaciones.showForm(existingAsig, docentes, [], [], deptoId);
        };

        document.getElementById('asig-form').onsubmit = async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());

            // Convertir IDs a números o null
            data.departamento_id = parseInt(data.departamento_id);
            data.aula_id = parseInt(data.aula_id);
            data.modulo_id = parseInt(data.modulo_id);
            data.comision_id = data.comision_id ? parseInt(data.comision_id) : null;
            data.docente_id = data.docente_id ? parseInt(data.docente_id) : null;

            try {
                const response = await Auth.handleResponse(await fetch('/api/asignaciones', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${Auth.getToken()}`
                    },
                    body: JSON.stringify(data)
                }));

                if (response && response.ok) {
                    modal.remove();
                    // Obtener turno actual desde la función global o estado local si fuera necesario, 
                    // pero aquí lo más simple es simplemente refrescar con los mismos parámetros
                    Editor.loadGrid(deptoId, dia, turno);
                } else if (response) {
                    const err = await response.json();
                    alert(err.detail || 'Error al guardar asignación');
                }
            } catch (error) {
                console.error('Error al guardar asignación:', error);
                alert('No se pudo establecer conexión con el servidor o hubo un error interno.');
            }
        };
    }
};
