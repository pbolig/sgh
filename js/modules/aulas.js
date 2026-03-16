// js/modules/aulas.js
import { Auth } from './auth.js';
import { Departamentos } from './departamentos.js';

export const Aulas = {
    list: async () => {
        try {
            const response = await fetch('/api/aulas', {
                headers: {
                    'Authorization': `Bearer ${Auth.getToken()}`
                }
            });
            if (!response.ok) throw new Error('Error al obtener aulas');
            return await response.json();
        } catch (error) {
            console.error(error);
            return [];
        }
    },

    save: async (aula) => {
        try {
            const isNew = !aula.id;
            const url = isNew ? '/api/aulas' : `/api/aulas/${aula.id}`;
            const method = isNew ? 'POST' : 'PUT';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${Auth.getToken()}`
                },
                body: JSON.stringify(aula)
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || 'Error al guardar aula');
            }
            return { success: true, data: await response.json() };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    delete: async (id) => {
        try {
            const response = await fetch(`/api/aulas/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${Auth.getToken()}`
                }
            });
            if (!response.ok) throw new Error('Error al eliminar aula');
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    render: async (containerId) => {
        console.log('Rendering Aulas in', containerId);
        const container = document.getElementById(containerId);
        let [aulas, deptos] = await Promise.all([Aulas.list(), Departamentos.list()]);
        
        // Ordenar por nombre alfanumérico
        aulas.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || '', undefined, { numeric: true, sensitivity: 'base' }));
        
        container.innerHTML = `
            <div class="view-header module-header">
                <h2>Gestión de Aulas</h2>
                <button id="btn-add-aula" class="btn-primary">+ Nueva Aula</button>
            </div>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Nombre</th>
                        <th>Departamento</th>
                        <th>Capacidad</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${aulas.length === 0 ? '<tr><td colspan="4" style="text-align:center">No hay aulas registradas</td></tr>' : ''}
                    ${aulas.map(a => {
                        const depto = deptos.find(d => d.id === a.departamento_id);
                        return `
                            <tr>
                                <td>${a.nombre}</td>
                                <td>${depto ? depto.nombre : '-'}</td>
                                <td>${a.capacidad || '-'}</td>
                                <td>
                                    <button class="btn-edit" onclick="window.editAula(${a.id})">Editar</button>
                                    <button class="btn-delete" onclick="window.deleteAula(${a.id})">Eliminar</button>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;

        window.addAula = () => Aulas.showForm(null, deptos);
        document.getElementById('btn-add-aula').onclick = window.addAula;
        
        window.editAula = (id) => {
            const aula = aulas.find(a => a.id === id);
            Aulas.showForm(aula, deptos);
        };

        window.deleteAula = async (id) => {
            if (confirm('¿Está seguro de eliminar esta aula?')) {
                const res = await Aulas.delete(id);
                if (res.success) Aulas.render(containerId);
                else alert(res.error);
            }
        };
    },

    showForm: (aula = null, deptos = []) => {
        const isEdit = !!aula;
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>${isEdit ? 'Editar' : 'Nueva'} Aula</h3>
                <form id="aula-form">
                    <input type="hidden" name="id" value="${aula?.id || ''}">
                    <div class="form-group">
                        <label>Nombre:</label>
                        <input type="text" name="nombre" value="${aula?.nombre || ''}" placeholder="Ej: AULA 1" required>
                    </div>
                    <div class="form-group">
                        <label>Departamento:</label>
                        <select name="departamento_id" required>
                            <option value="">Seleccione un departamento</option>
                            ${deptos.map(d => `<option value="${d.id}" ${d.id === aula?.departamento_id ? 'selected' : ''}>${d.nombre}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Capacidad:</label>
                        <input type="number" name="capacidad" value="${aula?.capacidad || ''}" placeholder="Ej: 30">
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
        document.getElementById('aula-form').onsubmit = async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());
            data.departamento_id = parseInt(data.departamento_id);
            if (data.capacidad) data.capacidad = parseInt(data.capacidad);
            else delete data.capacidad;
            
            if (!data.id) delete data.id;
            
            const res = await Aulas.save(data);
            if (res.success) {
                modal.remove();
                Aulas.render('view-container');
            } else {
                alert(res.error);
            }
        };
    }
};
