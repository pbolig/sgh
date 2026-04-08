// js/modules/editor.js
import { Auth } from './auth.js';
import { Departamentos } from './departamentos.js';
import { Docentes } from './docentes.js';
import { Materias } from './materias.js';
import { Comisiones } from './comisiones.js';

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
            if (deptoId) Editor.loadGrid(deptoId, currentDia, currentTurno);
            else document.getElementById('grid-container').innerHTML = '<div class="loading">Seleccione un departamento en la barra superior</div>';
        };

        // Escuchar cambios en el selector global
        globalDeptoSelect.addEventListener('change', updateGrid);

        // Definir una función global para que los selectores inyectados puedan actualizar
        window.updateEditorFilters = (dia, turno) => {
            currentDia = dia;
            currentTurno = turno;
            updateGrid();
        };

        if (globalDeptoSelect.value) updateGrid();
    },

    loadGrid: async (deptoId, dia, turno) => {
        const gridContainer = document.getElementById('grid-container');
        gridContainer.innerHTML = '<div class="loading">Cargando grilla...</div>';

        try {
            const [modulos, aulas, docentes, comisiones, asignaciones, deptos, excluidos, materias] = await Promise.all([
                fetch('/api/modulos').then(r => r.json()),
                fetch(`/api/aulas?departamento_id=${deptoId}`).then(r => r.json()),
                Docentes.list(),
                Comisiones.list(deptoId),
                fetch(`/api/asignaciones?departamento_id=${deptoId}`).then(r => r.json()),
                Departamentos.list(),
                fetch(`/api/recreos_excluidos?departamento_id=${deptoId}`).then(r => r.json()),
                Materias.list(deptoId)
            ]);

            const filteredModulos = modulos.filter(m => m.turno === turno)
                .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
            const filteredAulas = aulas; 

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
                        ${filteredModulos.map((m, idx) => {
                            let rows = `
                                <tr>
                                    <td class="time-cell">
                                        <div class="mod-num">${m.numero}° Módulo</div>
                                        <div class="mod-time">${m.hora_inicio} - ${m.hora_fin}</div>
                                    </td>
                                    ${daysToRender.map((d, dIdx) => filteredAulas.map((a, aIdx) => {
                                        const asig = asignaciones.find(as => 
                                            as.aula_id === a.id && 
                                            as.modulo_id === m.id && 
                                            as.dia_semana === d
                                        );
                                        
                                        return `
                                            <td class="grid-cell ${dIdx > 0 && aIdx === 0 ? 'day-divider' : ''}" 
                                                onclick="window.editCell(${deptoId}, ${a.id}, ${m.id}, '${d}')"
                                                data-aula="${a.id}" data-modulo="${m.id}" data-dia="${d}">
                                                ${asig ? Editor.renderAsig(asig, docentes, comisiones) : '<div class="empty-cell">+</div>'}
                                            </td>
                                        `;
                                    }).join('')).join('')}
                                </tr>
                            `;

                            // Verificar si hay un recreo después de este módulo
                            const nextM = filteredModulos[idx + 1];
                            if (nextM) {
                                const endMin = Editor.timeToMinutes(m.hora_fin);
                                const startNextMin = Editor.timeToMinutes(nextM.hora_inicio);
                                if (startNextMin > endMin) {
                                    const diff = startNextMin - endMin;
                                    const totalCols = isAllDays ? (daysToRender.length * filteredAulas.length) + 1 : filteredAulas.length + 1;
                                    
                                    // Verificar exclusiones por día para este recreo
                                    const breakExcl = (day) => excluidos.some(e => e.modulo_id_anterior === m.id && e.dia_semana === day);

                                    if (isAllDays) {
                                        rows += `
                                            <tr class="break-row">
                                                <td class="time-cell break-label">RECREO</td>
                                                ${daysToRender.map((d, dIdx) => {
                                                    const isExcluded = breakExcl(d);
                                                    return `
                                                        <td colspan="${filteredAulas.length}" 
                                                            class="${isExcluded ? 'break-excluded' : ''} ${dIdx > 0 ? 'day-divider' : ''}"
                                                            onclick="window.toggleRecreo(${deptoId}, '${d}', ${m.id})"
                                                            title="${isExcluded ? 'Recreo oculto (Click para activar)' : 'Recreo normal (Click para ocultar)'}">
                                                            <div class="break-content" style="${isExcluded ? 'opacity: 0.1;' : ''}">
                                                                <span class="break-duration">${diff} min</span>
                                                                <span class="break-time">${m.hora_fin} - ${nextM.hora_inicio}</span>
                                                            </div>
                                                        </td>
                                                    `;
                                                }).join('')}
                                            </tr>
                                        `;
                                    } else {
                                        const isExcluded = breakExcl(dia);
                                        rows += `
                                            <tr class="break-row">
                                                <td colspan="${totalCols}" 
                                                    class="${isExcluded ? 'break-excluded' : ''}"
                                                    onclick="window.toggleRecreo(${deptoId}, '${dia}', ${m.id})">
                                                    <div class="break-content" style="${isExcluded ? 'opacity: 0.1' : ''}">
                                                        <span class="break-label">RECREO</span>
                                                        <span class="break-duration">${diff} min</span>
                                                        <span class="break-time">${m.hora_fin} - ${nextM.hora_inicio}</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        `;
                                    }
                                }
                            }
                            return rows;
                        }).join('')}
                    </tbody>
                </table>
            `;
            gridContainer.innerHTML = html;

            window.editCell = (deptoId, aulaId, moduloId, dia) => {
                const asig = asignaciones.find(as => as.aula_id === aulaId && as.modulo_id === moduloId && as.dia_semana === dia);
                Editor.showCellForm(deptoId, aulaId, moduloId, dia, asig, docentes, comisiones, materias, turno);
            };

            window.toggleRecreo = async (deptoId, dia, moduloIdAnterior) => {
                try {
                    const response = await fetch('/api/recreos_excluidos', {
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
                    });
                    if (response.ok) {
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

    timeToMinutes: (timeStr) => {
        const [h, m] = timeStr.split(':').map(Number);
        return h * 60 + m;
    },

    renderAsig: (asig, docentes, comisiones) => {
        const doc = docentes.find(d => d.id === asig.docente_id);
        const com = comisiones.find(c => c.id === asig.comision_id);
        return `
            <div class="asig-item">
                <div class="asig-comision">${com ? com.codigo : ''}</div>
                <div class="asig-docente">${doc ? doc.apellido : ''}</div>
            </div>
        `;
    },

    showCellForm: (deptoId, aulaId, moduloId, dia, asig, docentes, comisiones, materias, turno) => {
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
                        <select name="docente_id">
                            <option value="">Ninguno</option>
                            ${docentes
                                .sort((a, b) => (a.apellido || '').localeCompare(b.apellido || ''))
                                .map(d => `<option value="${d.id}" ${asig?.docente_id === d.id ? 'selected' : ''}>${d.apellido}, ${d.nombre}</option>`).join('')}
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>Observaciones:</label>
                        <textarea name="observaciones">${asig?.observaciones || ''}</textarea>
                    </div>

                    <div class="modal-actions">
                        <button type="submit" class="btn-primary">Guardar</button>
                        <button type="button" class="btn-secondary" id="btn-close-modal">Cancelar</button>
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

        document.getElementById('btn-close-modal').onclick = () => modal.remove();
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
                const response = await fetch('/api/asignaciones', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${Auth.getToken()}`
                    },
                    body: JSON.stringify(data)
                });

                if (response.ok) {
                    modal.remove();
                    // Obtener turno actual desde la función global o estado local si fuera necesario, 
                    // pero aquí lo más simple es simplemente refrescar con los mismos parámetros
                    Editor.loadGrid(deptoId, dia, turno);
                } else {
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
