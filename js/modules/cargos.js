// js/modules/cargos.js
import { Auth } from './auth.js';

export const Cargos = {
    list: async (deptoId = null) => {
        try {
            let url = '/api/cargos';
            if (deptoId) url += `?departamento_id=${deptoId}`;
            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${Auth.getToken()}` }
            });
            if (!response.ok) throw new Error('Error al obtener cargos');
            return await response.json();
        } catch (error) {
            console.error(error);
            return [];
        }
    },

    save: async (cargo) => {
        try {
            const isNew = !cargo.id;
            const url = isNew ? '/api/cargos' : `/api/cargos/${cargo.id}`;
            const method = isNew ? 'POST' : 'PUT';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${Auth.getToken()}`
                },
                body: JSON.stringify(cargo)
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || 'Error al guardar cargo');
            }
            return { success: true, data: await response.json() };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    delete: async (id) => {
        try {
            const response = await fetch(`/api/cargos/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${Auth.getToken()}` }
            });
            if (!response.ok) throw new Error('Error al eliminar cargo');
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    render: async (containerId) => {
        const deptoId = document.getElementById('dept-selector')?.value;
        const container = document.getElementById(containerId);
        container.innerHTML = '<div class="loading">Cargando definiciones de cargos...</div>';

        let cargos = await Cargos.list(deptoId);
        cargos.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
        
        container.innerHTML = `
            <div class="view-header module-header">
                <h2>Gestión de Cargos (Definiciones)</h2>
                <button id="btn-add-cargo-def" class="btn-primary">+ Nuevo Cargo</button>
            </div>
            <div class="table-container animated fadeIn">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nombre del Cargo</th>
                            <th>Uso Múltiple / Observaciones</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${cargos.length === 0 ? '<tr><td colspan="4" style="text-align:center">No hay cargos definidos</td></tr>' : ''}
                        ${cargos.map(c => `
                            <tr>
                                <td>${c.id}</td>
                                <td><b>${c.nombre}</b></td>
                                <td>${c.uso_multiple || '<span style="color:var(--text-dim)">-</span>'}</td>
                                <td>
                                    <button class="btn-edit" onclick="window.editCargoDef(${c.id})">Editar</button>
                                    <button class="btn-delete" onclick="window.deleteCargoDef(${c.id})">Eliminar</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        document.getElementById('btn-add-cargo-def').onclick = () => Cargos.showForm(null, deptoId);
        window.editCargoDef = (id) => Cargos.showForm(cargos.find(c => c.id === id), deptoId);
        window.deleteCargoDef = async (id) => {
            if (confirm('¿Eliminar esta definición? (Afectará a las asignaciones existentes)')) {
                const res = await Cargos.delete(id);
                if (res.success) Cargos.render(containerId);
                else alert(res.error);
            }
        };
    },

    showForm: (cargo = null) => {
        const isEdit = !!cargo;
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content animated zoomIn">
                <h3>${isEdit ? 'Editar' : 'Nueva'} Definición de Cargo</h3>
                <form id="cargo-def-form">
                    <input type="hidden" name="id" value="${cargo?.id || ''}">
                    <input type="hidden" name="departamento_id" value="${cargo?.departamento_id || deptoId || ''}">
                    <div class="form-group">
                        <label>Nombre del Cargo:</label>
                        <input type="text" name="nombre" value="${cargo?.nombre || ''}" required>
                    </div>
                    <div class="form-group">
                        <label>Uso Múltiple / Observaciones:</label>
                        <textarea name="uso_multiple" placeholder="Ej: Reservado para personal de laboratorio...">${cargo?.uso_multiple || ''}</textarea>
                    </div>
                    <div class="modal-actions">
                        <button type="submit" class="btn-primary">Guardar Definición</button>
                        <button type="button" class="btn-secondary" id="btn-close-modal">Cancelar</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
        document.getElementById('btn-close-modal').onclick = () => modal.remove();
        document.getElementById('cargo-def-form').onsubmit = async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());
            if (!data.id) delete data.id;
            const res = await Cargos.save(data);
            if (res.success) { modal.remove(); Cargos.render('view-container'); }
            else alert(res.error);
        };
    }
};
