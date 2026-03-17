// js/modules/cargo_asignaciones.js
import { Auth } from './auth.js';
import { Docentes } from './docentes.js';
import { Departamentos } from './departamentos.js';
import { Cargos } from './cargos.js';

export const CargoAsignaciones = {
    list: async () => {
        try {
            const response = await fetch('/api/cargo-asignaciones', {
                headers: { 'Authorization': `Bearer ${Auth.getToken()}` }
            });
            if (!response.ok) throw new Error('Error al obtener asignaciones');
            return await response.json();
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
        const container = document.getElementById(containerId);
        container.innerHTML = '<div class="loading">Cargando asignaciones de cargos...</div>';

        const [asigs, docentes, deptos, cargos] = await Promise.all([
            CargoAsignaciones.list(),
            Docentes.list(),
            Departamentos.list(),
            Cargos.list()
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
                                    <td>${cargo ? cargo.nombre : 'S/C'}</td>
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

        document.getElementById('btn-add-asig').onclick = () => CargoAsignaciones.showForm(null, docentes, deptos, cargos);
        window.editAsig = (id) => CargoAsignaciones.showForm(asigs.find(a => a.id === id), docentes, deptos, cargos);
        window.deleteAsig = async (id) => {
            if (confirm('¿Eliminar esta asignación?')) {
                const res = await CargoAsignaciones.delete(id);
                if (res.success) CargoAsignaciones.render(containerId);
                else alert(res.error);
            }
        };
    },

    showForm: (asig = null, docentes = [], deptos = [], cargos = []) => {
        const isEdit = !!asig;
        const modal = document.createElement('div');
        modal.className = 'modal';
        
        let slots = asig?.horarios ? [...asig.horarios] : [];

        const renderForm = () => {
            modal.innerHTML = `
                <div class="modal-content animated zoomIn" style="max-width: 800px;">
                    <h3>${isEdit ? 'Editar' : 'Nueva'} Asignación de Cargo</h3>
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
                                <select name="cargo_id" required>
                                    <option value="">-- Seleccione --</option>
                                    ${cargos.map(c => `<option value="${c.id}" ${c.id === asig?.cargo_id ? 'selected' : ''}>${c.nombre}</option>`).join('')}
                                </select>
                            </div>
                            <div class="form-group col">
                                <label>Departamento:</label>
                                <select name="departamento_id" required>
                                    <option value="">-- Seleccione --</option>
                                    ${deptos.map(d => `<option value="${d.id}" ${d.id === asig?.departamento_id ? 'selected' : ''}>${d.nombre}</option>`).join('')}
                                </select>
                            </div>
                        </div>

                        <div class="form-section">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
                                <h4 style="margin:0">Horarios y Carga Horaria (Slots)</h4>
                                <button type="button" id="btn-add-slot" class="btn-secondary btn-sm">+ Añadir Horario</button>
                            </div>
                            
                            <table class="data-table slots-table">
                                <thead>
                                    <tr>
                                        <th>Día</th>
                                        <th>Inicio</th>
                                        <th>Fin</th>
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
                                            <td><input type="time" class="slot-inicio" data-idx="${idx}" value="${s.hora_inicio}" required></td>
                                            <td><input type="time" class="slot-fin" data-idx="${idx}" value="${s.hora_fin}" required></td>
                                            <td><input type="number" class="slot-horas" data-idx="${idx}" value="${s.horas}" step="0.5" min="0" style="width:60px" required></td>
                                            <td><button type="button" class="btn-icon btn-delete-slot" data-idx="${idx}">✕</button></td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                            
                            <div class="total-display">
                                <strong>Total Semanal: <span id="total-horas-preview">0</span> hs</strong>
                            </div>
                        </div>

                        <div class="modal-actions">
                            <button type="submit" class="btn-primary">Guardar Asignación</button>
                            <button type="button" class="btn-secondary" id="btn-close-modal">Cancelar</button>
                        </div>
                    </form>
                </div>
            `;
            
            // Re-vincular eventos
            modal.querySelector('#btn-add-slot').onclick = () => {
                slots.push({ dia_semana: 'lunes', hora_inicio: '08:00', hora_fin: '09:00', horas: 1 });
                renderForm();
            };

            modal.querySelectorAll('.btn-delete-slot').forEach(btn => {
                btn.onclick = (e) => {
                    const idx = parseInt(e.target.dataset.idx);
                    slots.splice(idx, 1);
                    renderForm();
                };
            });

            const calculateSlotHours = (inicio, fin) => {
                if (!inicio || !fin) return 0;
                const [h1, m1] = inicio.split(':').map(Number);
                const [h2, m2] = fin.split(':').map(Number);
                const mins = (h2 * 60 + m2) - (h1 * 60 + m1);
                return Math.max(0, parseFloat((mins / 60).toFixed(2)));
            };

            // Sincronizar cambios en los inputs al array 'slots'
            modal.querySelectorAll('.slot-dia, .slot-inicio, .slot-fin, .slot-horas').forEach(input => {
                input.onchange = (e) => {
                    const idx = parseInt(e.target.dataset.idx);
                    const field = e.target.classList.contains('slot-dia') ? 'dia_semana' : 
                                  e.target.classList.contains('slot-inicio') ? 'hora_inicio' :
                                  e.target.classList.contains('slot-fin') ? 'hora_fin' : 'horas';
                    
                    slots[idx][field] = field === 'horas' ? parseFloat(e.target.value) : e.target.value;
                    
                    // Si cambia inicio o fin, recalcular horas automáticamente
                    if (field === 'hora_inicio' || field === 'hora_fin') {
                        const newHours = calculateSlotHours(slots[idx].hora_inicio, slots[idx].hora_fin);
                        slots[idx].horas = newHours;
                        
                        // Actualizar el input de horas en el DOM para feedback visual inmediato
                        const hoursInput = modal.querySelector(`.slot-horas[data-idx="${idx}"]`);
                        if (hoursInput) hoursInput.value = newHours;
                    }

                    calcTotal();
                };
            });

            const calcTotal = () => {
                const total = slots.reduce((acc, s) => acc + (parseFloat(s.horas) || 0), 0);
                const el = modal.querySelector('#total-horas-preview');
                if (el) el.textContent = total;
            };
            calcTotal();

            modal.querySelector('#btn-close-modal').onclick = () => modal.remove();
            
            modal.querySelector('#asig-form').onsubmit = async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const data = Object.fromEntries(formData.entries());
                
                // Limpiar campos de la estructura vieja (evitar basura)
                ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'].forEach(d => delete data[`horas_${d}`]);
                delete data.hora_inicio;
                delete data.hora_fin;

                data.docente_id = parseInt(data.docente_id);
                data.cargo_id = parseInt(data.cargo_id);
                data.departamento_id = parseInt(data.departamento_id);
                data.horarios = slots;
                data.total_horas = slots.reduce((acc, s) => acc + (parseFloat(s.horas) || 0), 0);

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
                .slots-table th { font-size: 0.8em; color: var(--text-dim); }
                .slots-table td { padding: 5px !important; }
                .slots-table input, .slots-table select { padding: 4px; border: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.2); color: white; border-radius: 4px; width: 100%; }
                .slot-badge { background: rgba(139, 92, 246, 0.2); color: #a78bfa; padding: 2px 6px; border-radius: 4px; font-size: 0.75em; border: 1px solid rgba(139, 92, 246, 0.3); margin-right: 4px; margin-bottom: 2px; display: inline-block; }
                .slots-summary { display: flex; flex-wrap: wrap; max-width: 300px; }
            `;
            document.head.appendChild(style);
        }
    }
};
