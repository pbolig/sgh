// js/modules/cargo_asignaciones.js
import { Auth } from './auth.js';
import { Docentes } from './docentes.js';
import { Departamentos } from './departamentos.js';
import { Cargos } from './cargos.js';
import { Comisiones } from './comisiones.js';
import { Modulos } from './modulos.js';

export const CargoAsignaciones = {
    list: async (deptoId = null) => {
        try {
            let url = '/api/cargo-asignaciones';
            // Nota: Backend necesita soportar filtro por depto_id si se requiere aquí.
            // Por ahora asigs suelen filtrarse en el render.
            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${Auth.getToken()}` }
            });
            if (!response.ok) throw new Error('Error al obtener asignaciones');
            let data = await response.json();
            if (deptoId) data = data.filter(a => a.departamento_id == deptoId);
            return data;
        } catch (error) {
            console.error(error);
            return [];
        }
    },

    save: async (asig) => {
        try {
            const isNew = !asig.id;
            const url = isNew ? '/api/cargo-asignaciones' : `/api/cargo-asignaciones/${asig.id}`;
            const method = isNew ? 'POST' : 'PUT';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${Auth.getToken()}`
                },
                body: JSON.stringify(asig)
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || 'Error al guardar asignación');
            }
            return { success: true, data: await response.json() };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    delete: async (id) => {
        try {
            const response = await fetch(`/api/cargo-asignaciones/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${Auth.getToken()}` }
            });
            if (!response.ok) throw new Error('Error al eliminar asignación');
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    render: async (containerId) => {
        const instId = document.getElementById('inst-selector')?.value;
        const deptoId = document.getElementById('dept-selector')?.value;
        const container = document.getElementById(containerId);
        container.innerHTML = '<div class="loading">Cargando asignaciones de cargos...</div>';

        const [asigs, docentes, deptos, cargos] = await Promise.all([
            CargoAsignaciones.list(deptoId),
            Docentes.list(instId),
            Departamentos.list(instId),
            Cargos.list(deptoId)
        ]);
        
        container.innerHTML = `
            <div class="view-header module-header">
                <h2>Asignación de Cargos a Personal</h2>
                <button id="btn-add-asig" class="btn-primary">+ Nueva Asignación</button>
            </div>
            <div class="table-container animated fadeIn">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Docente</th>
                            <th>Cargo</th>
                            <th>Departamento</th>
                            <th>Horarios Asignados</th>
                            <th>Total</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${asigs.length === 0 ? '<tr><td colspan="6" style="text-align:center">No hay asignaciones registradas</td></tr>' : ''}
                        ${asigs.map(a => {
                            const docente = docentes.find(d => d.id === a.docente_id);
                            const cargo = cargos.find(c => c.id === a.cargo_id);
                            const depto = deptos.find(d => d.id === a.departamento_id);
                            
                            // Agrupar horarios por día para visualización compacta
                            const slots = (a.horarios || []).map(h => {
                                const diaCorto = h.dia_semana.substring(0,3).charAt(0).toUpperCase() + h.dia_semana.substring(1,3);
                                return `${diaCorto} ${h.hora_inicio}-${h.hora_fin}`;
                            });

                            return `
                                <tr>
                                    <td><b>${docente ? `${docente.apellido}, ${docente.nombre}` : 'S/D'}</b></td>
                                    <td>${cargo ? cargo.nombre : '<i style="color:var(--text-dim)">Horas Cátedra / Módulos</i>'}</td>
                                    <td>${depto ? depto.nombre : '-'}</td>
                                    <td>
                                        <div class="slots-summary">
                                            ${slots.map(s => `<span class="slot-badge">${s}</span>`).join('')}
                                            ${slots.length === 0 ? '<small style="color:var(--text-dim)">Sin horarios definidos</small>' : ''}
                                        </div>
                                    </td>
                                    <td><span class="badge-time">${a.total_horas} hs</span></td>
                                    <td>
                                        <button class="btn-edit" onclick="window.editAsig(${a.id})">Editar</button>
                                        <button class="btn-delete" onclick="window.deleteAsig(${a.id})">Eliminar</button>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;

        document.getElementById('btn-add-asig').onclick = () => CargoAsignaciones.showForm(null, docentes, deptos, cargos, deptoId);
        window.editAsig = (id) => CargoAsignaciones.showForm(asigs.find(a => a.id === id), docentes, deptos, cargos, deptoId);
        window.deleteAsig = async (id) => {
            if (confirm('¿Eliminar esta asignación?')) {
                const res = await CargoAsignaciones.delete(id);
                if (res.success) CargoAsignaciones.render(containerId);
                else alert(res.error);
            }
        };
    },

    showForm: async (asig = null, docentes = [], deptos = [], cargos = [], deptoId = null, preFill = null) => {
        const isEdit = !!asig;
        
        // Cargar aulas y comisiones del departamento para el selector
        const authHeader = { 'Authorization': `Bearer ${Auth.getToken()}` };
        const dId = asig?.departamento_id || deptoId;
        const [aulasRes, comisiones] = await Promise.all([
            Auth.handleResponse(await fetch(`/api/aulas?departamento_id=${dId}`, { headers: authHeader })),
            Comisiones.list(dId)
        ]);
        const aulas = (aulasRes && aulasRes.ok) ? await aulasRes.json() : [];

        const modal = document.createElement('div');
        modal.className = 'modal';
        
        let slots = asig?.horarios ? asig.horarios.map(s => ({
            ...s,
            tipo: s.horas % 1 === 0 && (s.horas * 60) % 40 !== 0 ? 'cargo' : 'cátedra', 
            cantidad: s.horas % 1 === 0 && (s.horas * 60) % 40 !== 0 ? s.horas : (s.horas * 60 / 40)
        })) : [];

        // Si se pasa información para pre-llenar y es un nuevo registro
        if (preFill && !isEdit) {
            slots.push({
                dia_semana: preFill.dia || 'lunes',
                tipo: 'cátedra',
                cantidad: 1,
                hora_inicio: preFill.hora_inicio || '08:00',
                hora_fin: preFill.hora_fin || '08:40',
                horas: 0.67,
                aula_id: preFill.aulaId,
                comision_id: preFill.comisionId,
                modulo_id: preFill.moduloId
            });
        }

        const renderForm = () => {
            modal.innerHTML = `
                <div class="modal-content animated zoomIn" style="max-width: 900px;">
                    <div class="modal-header">
                        <h3>${isEdit ? 'Editar' : 'Nueva'} Asignación de Cargos / Horas</h3>
                        <button class="btn-close-x" id="btn-close-modal-x">&times;</button>
                    </div>
                    <form id="asig-form">
                        <input type="hidden" name="id" value="${asig?.id || ''}">
                        
                        <div class="form-row">
                            <div class="form-group col">
                                <label>Docente / Persona:</label>
                                <select name="docente_id" required>
                                    <option value="">-- Seleccione --</option>
                                    ${docentes.sort((a,b) => a.apellido.localeCompare(b.apellido)).map(d => 
                                        `<option value="${d.id}" ${d.id === asig?.docente_id ? 'selected' : ''}>${d.apellido}, ${d.nombre}</option>`
                                    ).join('')}
                                </select>
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group col">
                                <label>Cargo (Definición):</label>
                                <select name="cargo_id">
                                    <option value="">-- Sin Cargo (Solo Horas Cátedra) --</option>
                                    ${cargos.map(c => `<option value="${c.id}" ${c.id === asig?.cargo_id ? 'selected' : ''}>${c.nombre}</option>`).join('')}
                                </select>
                            </div>
                            <div class="form-group col">
                                <label>Departamento:</label>
                                <select name="departamento_id" required>
                                    <option value="">-- Seleccione --</option>
                                    ${deptos.map(d => `<option value="${d.id}" ${d.id == (asig?.departamento_id || deptoId) ? 'selected' : ''}>${d.nombre}</option>`).join('')}
                                </select>
                            </div>
                        </div>

                        <div class="form-section glass-card" style="padding: 1.5rem; margin-top: 1rem;">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
                                <h4 style="margin:0; color: var(--primary);">Horarios y Carga Horaria</h4>
                                <button type="button" id="btn-add-slot" class="btn-primary btn-sm">+ Añadir Horario</button>
                            </div>
                            
                            <table class="data-table slots-table">
                                <thead>
                                    <tr>
                                        <th>Día</th>
                                        <th>Tipo</th>
                                        <th>Cant.</th>
                                        <th>Inicio</th>
                                        <th>Fin (Auto)</th>
                                        <th>Aula</th>
                                        <th>Comisión (Opcional)</th>
                                        <th>Hs (60m)</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody id="slots-body">
                                    ${slots.map((s, idx) => `
                                        <tr>
                                            <td>
                                                <select class="slot-dia" data-idx="${idx}" required>
                                                    ${['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'].map(d => 
                                                        `<option value="${d}" ${s.dia_semana === d ? 'selected' : ''}>${d.charAt(0).toUpperCase() + d.slice(1)}</option>`
                                                    ).join('')}
                                                </select>
                                            </td>
                                            <td>
                                                <select class="slot-tipo" data-idx="${idx}">
                                                    <option value="cátedra" ${s.tipo === 'cátedra' || !s.tipo ? 'selected' : ''}>Cátedra (40m)</option>
                                                    <option value="cargo" ${s.tipo === 'cargo' ? 'selected' : ''}>Reloj (60m)</option>
                                                </select>
                                            </td>
                                            <td><input type="number" class="slot-cant" data-idx="${idx}" value="${s.cantidad || 1}" min="1" step="1" style="width:45px"></td>
                                            <td><input type="time" class="slot-inicio" data-idx="${idx}" value="${s.hora_inicio || '08:00'}" required></td>
                                            <td><input type="time" class="slot-fin" data-idx="${idx}" value="${s.hora_fin}" readonly style="opacity: 0.7; background: rgba(255,255,255,0.05); width:65px"></td>
                                            <td>
                                                <select class="slot-aula" data-idx="${idx}" style="width: 100px;">
                                                    <option value="">-- Aula --</option>
                                                    ${aulas.map(a => `<option value="${a.id}" ${s.aula_id === a.id ? 'selected' : ''}>${a.nombre}</option>`).join('')}
                                                </select>
                                            </td>
                                            <td>
                                                <select class="slot-comision" data-idx="${idx}">
                                                    <option value="">Ninguna (Libre)</option>
                                                    ${comisiones.map(c => `<option value="${c.id}" ${s.comision_id === c.id ? 'selected' : ''}>${c.codigo} - ${c.materia?.nombre || ''}</option>`).join('')}
                                                </select>
                                            </td>
                                            <td><input type="number" class="slot-horas" data-idx="${idx}" value="${s.horas}" readonly style="width:55px; opacity: 0.7; background: rgba(255,255,255,0.05)"></td>
                                            <td><button type="button" class="btn-icon btn-delete-slot" data-idx="${idx}">✕</button></td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                            
                            <div class="total-display" style="text-align: right; margin-top: 1rem; font-size: 1.1rem;">
                                <strong>Total Semanal: <span id="total-horas-preview" style="color: var(--primary);">0</span> hs reloj</strong>
                            </div>
                        </div>

                        <div class="modal-actions">
                            <button type="submit" class="btn-primary">Guardar Asignación</button>
                            <button type="button" class="btn-secondary" id="btn-close-modal">Cancelar</button>
                        </div>
                    </form>
                </div>
            `;
            
            const calculateEndTime = (inicio, tipo, cantidad) => {
                if (!inicio || !cantidad) return '';
                const [h, m] = inicio.split(':').map(Number);
                const unitMins = tipo === 'cátedra' ? 40 : 60;
                const totalMins = h * 60 + m + (cantidad * unitMins);
                const endH = Math.floor(totalMins / 60) % 24;
                const endM = totalMins % 60;
                return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
            };

            const calculateRelojHours = (tipo, cantidad) => {
                if (!cantidad) return 0;
                const unitMins = tipo === 'cátedra' ? 40 : 60;
                return parseFloat((cantidad * unitMins / 60).toFixed(2));
            };

            const updateSlotCalculations = (idx) => {
                const s = slots[idx];
                s.hora_fin = calculateEndTime(s.hora_inicio, s.tipo, s.cantidad);
                s.horas = calculateRelojHours(s.tipo, s.cantidad);
                
                // Actualizar UI
                const finInput = modal.querySelector(`.slot-fin[data-idx="${idx}"]`);
                const horasInput = modal.querySelector(`.slot-horas[data-idx="${idx}"]`);
                if (finInput) finInput.value = s.hora_fin;
                if (horasInput) horasInput.value = s.horas;
                calcTotal();
            };

            const calcTotal = () => {
                const total = slots.reduce((acc, s) => acc + (parseFloat(s.horas) || 0), 0);
                const el = modal.querySelector('#total-horas-preview');
                if (el) el.textContent = total;
            };

            // Re-vincular eventos
            modal.querySelector('#btn-add-slot').onclick = () => {
                slots.push({ dia_semana: 'lunes', tipo: 'cátedra', cantidad: 1, hora_inicio: '08:00', hora_fin: '08:40', horas: 0.67 });
                renderForm();
            };

            modal.querySelectorAll('.btn-delete-slot').forEach(btn => {
                btn.onclick = (e) => {
                    const idx = parseInt(e.currentTarget.dataset.idx);
                    slots.splice(idx, 1);
                    renderForm();
                };
            });

            // Sincronizar cambios en los inputs al array 'slots'
            modal.querySelectorAll('.slot-dia, .slot-tipo, .slot-cant, .slot-inicio').forEach(input => {
                input.onchange = (e) => {
                    const idx = parseInt(e.target.dataset.idx);
                    const val = e.target.value;
                    
                    if (e.target.classList.contains('slot-dia')) slots[idx].dia_semana = val;
                    if (e.target.classList.contains('slot-tipo')) slots[idx].tipo = val;
                    if (e.target.classList.contains('slot-cant')) slots[idx].cantidad = parseInt(val);
                    if (e.target.classList.contains('slot-inicio')) slots[idx].hora_inicio = val;
                    
                    updateSlotCalculations(idx);
                };
                
                // Forzar calculo inicial para campos precargados
                const idx = parseInt(input.dataset.idx);
                if (idx !== undefined && !slots[idx].hora_fin) updateSlotCalculations(idx);
            });

            calcTotal();

            const close = () => modal.remove();
            modal.querySelector('#btn-close-modal').onclick = close;
            modal.querySelector('#btn-close-modal-x').onclick = close;
            
            modal.querySelector('#asig-form').onsubmit = async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const data = Object.fromEntries(formData.entries());
                
                data.docente_id = data.docente_id ? parseInt(data.docente_id) : null;
                data.cargo_id = data.cargo_id ? parseInt(data.cargo_id) : null;
                data.departamento_id = parseInt(data.departamento_id);
                const finalSlots = slots.map((s, idx) => {
                    const row = document.querySelector(`.slot-dia[data-idx="${idx}"]`).closest('tr');
                    const aulaId = row.querySelector('.slot-aula').value;
                    const comId = row.querySelector('.slot-comision').value;
                    const sData = slots[idx]; // rcuperar modulo_id si venía de preFill
                    return {
                        dia_semana: row.querySelector('.slot-dia').value,
                        hora_inicio: row.querySelector('.slot-inicio').value,
                        hora_fin: row.querySelector('.slot-fin').value,
                        horas: parseFloat(row.querySelector('.slot-horas').value),
                        aula_id: aulaId ? parseInt(aulaId) : null,
                        comision_id: comId ? parseInt(comId) : null,
                        modulo_id: sData.modulo_id || null
                    };
                });
                data.horarios = finalSlots;
                data.total_horas = data.horarios.reduce((acc, h) => acc + h.horas, 0);

                if (!data.id) delete data.id;
                const res = await CargoAsignaciones.save(data);
                if (res.success) { 
                    modal.remove(); 
                    CargoAsignaciones.render('view-container'); 
                } else alert(res.error);
            };
        };

        renderForm();
        document.body.appendChild(modal);

        // Estilos extra para los slots
        if (!document.getElementById('slots-styles')) {
            const style = document.createElement('style');
            style.id = 'slots-styles';
            style.textContent = `
                .slots-table th { font-size: 0.75rem; color: var(--text-dim); padding: 0.5rem !important; }
                .slots-table td { padding: 4px !important; }
                .slots-table input, .slots-table select { 
                    padding: 6px; 
                    border: 1px solid rgba(255,255,255,0.1); 
                    background: rgba(0,0,0,0.2); 
                    color: white; 
                    border-radius: 6px; 
                    width: 100%;
                    font-size: 0.85rem;
                }
                .slot-badge { background: rgba(139, 92, 246, 0.2); color: #a78bfa; padding: 2px 6px; border-radius: 4px; font-size: 0.75em; border: 1px solid rgba(139, 92, 246, 0.3); margin-right: 4px; margin-bottom: 2px; display: inline-block; }
                .slots-summary { display: flex; flex-wrap: wrap; max-width: 400px; }
            `;
            document.head.appendChild(style);
        }
    }
};
