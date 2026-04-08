// js/modules/comisiones.js
import { Auth } from './auth.js';
import { Materias } from './materias.js';

export const Comisiones = {
    list: async (deptoId = null, anio = null, instId = null) => {
        try {
            let url = '/api/comisiones';
            const params = new URLSearchParams();
            if (deptoId) params.append('departamento_id', deptoId);
            if (anio) params.append('anio', anio);
            if (instId) params.append('institucion_id', instId);
            if (params.toString()) url += '?' + params.toString();
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${Auth.getToken()}`
                }
            });
            if (!response.ok) throw new Error('Error al obtener comisiones');
            return await response.json();
        } catch (error) {
            console.error(error);
            return [];
        }
    },

    save: async (comision) => {
        try {
            const isNew = !comision.id;
            const url = isNew ? '/api/comisiones' : `/api/comisiones/${comision.id}`;
            const method = isNew ? 'POST' : 'PUT';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${Auth.getToken()}`
                },
                body: JSON.stringify(comision)
            });

            if (!response.ok) {
                const err = await response.json();
                const msg = err.detail || 'Error al guardar comisión';
                alert(msg);
                throw new Error(msg);
            }
            return { success: true, data: await response.json() };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    delete: async (id) => {
        try {
            const response = await fetch(`/api/comisiones/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${Auth.getToken()}`
                }
            });
            if (!response.ok) throw new Error('Error al eliminar comisión');
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    render: async (containerId) => {
        const deptoId = document.getElementById('dept-selector')?.value;
        const instId = document.getElementById('inst-selector')?.value;
        const container = document.getElementById(containerId);
        let [comisiones, materias] = await Promise.all([
            Comisiones.list(deptoId, null, instId), 
            Materias.list(deptoId, instId)
        ]);
        
        // Ordenar por código (de forma alfanumérica robusta)
        comisiones.sort((a, b) => (a.codigo || '').localeCompare(b.codigo || '', undefined, { numeric: true, sensitivity: 'base' }));
        
        container.innerHTML = `
            <div class="view-header module-header">
                <h2>Gestión de Comisiones</h2>
                <button id="btn-add-comision" class="btn-primary">+ Nueva Comisión</button>
            </div>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Código</th>
                        <th>Materia</th>
                        <th>Turno</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${comisiones.length === 0 ? '<tr><td colspan="4" style="text-align:center">No hay comisiones registradas</td></tr>' : ''}
                    ${comisiones.map(c => {
                        const materia = materias.find(m => m.id === c.materia_id);
                        return `
                            <tr>
                                <td>${c.codigo}</td>
                                <td>${materia ? materia.nombre : '-'}</td>
                                <td>${c.turno}</td>
                                <td>
                                    <button class="btn-edit" onclick="window.editComision(${c.id})">Editar</button>
                                    <button class="btn-delete" onclick="window.deleteComision(${c.id})">Eliminar</button>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;

        window.addComision = () => Comisiones.showForm(null, materias);
        document.getElementById('btn-add-comision').onclick = window.addComision;
        
        window.editComision = (id) => {
            const comision = comisiones.find(c => c.id === id);
            Comisiones.showForm(comision, materias);
        };

        window.deleteComision = async (id) => {
            if (confirm('¿Está seguro de eliminar esta comisión?')) {
                const res = await Comisiones.delete(id);
                if (res.success) Comisiones.render(containerId);
                else alert(res.error);
            }
        };
    },

    showForm: (comision = null, materias = []) => {
        const isEdit = !!comision;
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>${isEdit ? 'Editar' : 'Nueva'} Comisión</h3>
                <form id="comision-form">
                    <input type="hidden" name="id" value="${comision?.id || ''}">
                    <div class="form-group">
                        <label>Código:</label>
                        <input type="text" name="codigo" value="${comision?.codigo || ''}" placeholder="Ej: C1DM1" required>
                    </div>
                    <div class="form-group">
                        <label>Materia:</label>
                        <select name="materia_id" required>
                            <option value="">Seleccione una materia</option>
                            ${materias.map(m => `<option value="${m.id}" ${m.id === comision?.materia_id ? 'selected' : ''}>${m.nombre}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Turno:</label>
                        <select name="turno" required>
                            <option value="mañana" ${comision?.turno === 'mañana' ? 'selected' : ''}>Mañana</option>
                            <option value="tarde" ${comision?.turno === 'tarde' ? 'selected' : ''}>Tarde</option>
                            <option value="noche" ${comision?.turno === 'noche' ? 'selected' : ''}>Noche</option>
                        </select>
                    </div>
                    <div class="modal-actions">
                        <button type="submit" class="btn-primary">Guardar</button>
                        <button type="button" class="btn-secondary" id="btn-close-modal">Cancelar</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);

        document.getElementById('btn-close-modal').onclick = () => modal.remove();
        document.getElementById('comision-form').onsubmit = async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());
            data.materia_id = parseInt(data.materia_id);
            if (!data.id) delete data.id;
            
            const res = await Comisiones.save(data);
            if (res.success) {
                modal.remove();
                Comisiones.render('view-container');
            } else {
                alert(res.error);
            }
        };
    }
};
