// js/modules/aulas.js
import { Auth } from './auth.js';
import { Departamentos } from './departamentos.js';

export const Aulas = {
    list: async (institucionId = null, departamentoId = null) => {
        try {
            let url = '/api/aulas';
            const params = new URLSearchParams();
            if (institucionId) params.append('institucion_id', institucionId);
            if (departamentoId) params.append('departamento_id', departamentoId);
            if (params.toString()) url += '?' + params.toString();

            const response = await fetch(url, {
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
        
        const selectedInstId = localStorage.getItem('selected-inst-id');
        const selectedDeptId = localStorage.getItem('selected-dept-id');

        let [aulas, deptos] = await Promise.all([
            Aulas.list(selectedInstId, selectedDeptId), 
            Departamentos.list(selectedInstId)
        ]);
        
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
                        <th>Departamento / Carrera</th>
                        <th>Capacidad</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${aulas.length === 0 ? '<tr><td colspan="4" style="text-align:center">No hay aulas registradas</td></tr>' : ''}
                    ${aulas.map(a => {
                        const dNames = a.departamentos?.map(d => d.nombre).join(', ') || '-';
                        return `
                            <tr>
                                <td>${a.nombre}</td>
                                <td><small>${dNames}</small></td>
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
        const selectedInstId = localStorage.getItem('selected-inst-id');
        const modal = document.createElement('div');
        modal.className = 'modal';

        // Si es edición, podemos tener departamentos de otras instituciones si se cambió el filtro,
        // pero el requerimiento dice que las aulas no se comparten entre instituciones.
        // Así que usamos la institución del aula o la seleccionada.
        const instId = isEdit ? aula.institucion_id : selectedInstId;

        // Marcados
        const selectedDeptIds = isEdit ? (aula.departamentos?.map(d => d.id) || []) : [];

        modal.innerHTML = `
            <div class="modal-content">
                <h3>${isEdit ? 'Editar' : 'Nueva'} Aula</h3>
                <form id="aula-form">
                    <input type="hidden" name="id" value="${aula?.id || ''}">
                    <input type="hidden" name="institucion_id" value="${instId || ''}">
                    
                    <div class="form-group">
                        <label>Nombre:</label>
                        <input type="text" name="nombre" value="${aula?.nombre || ''}" placeholder="Ej: AULA 1" required>
                    </div>

                    <div class="form-group">
                        <label>Departamentos / Carreras:</label>
                        <div class="checkbox-group" style="max-height: 200px; overflow-y: auto; border: 1px solid #333; padding: 10px; border-radius: 4px;">
                            ${deptos.map(d => `
                                <div class="checkbox-item">
                                    <input type="checkbox" name="departamento_ids" value="${d.id}" id="dept-${d.id}" ${selectedDeptIds.includes(d.id) ? 'checked' : ''}>
                                    <label for="dept-${d.id}">${d.nombre}</label>
                                </div>
                            `).join('')}
                            ${deptos.length === 0 ? '<p style="color: #888; font-size: 0.9em;">No hay departamentos en esta institución</p>' : ''}
                        </div>
                        <small style="color: #888;">Seleccione una o más carreras que utilizarán esta aula.</small>
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
            const data = {
                id: formData.get('id'),
                institucion_id: parseInt(formData.get('institucion_id')),
                nombre: formData.get('nombre'),
                capacidad: formData.get('capacidad') ? parseInt(formData.get('capacidad')) : null,
                departamento_ids: Array.from(formData.getAll('departamento_ids')).map(id => parseInt(id))
            };
            
            if (!data.id) delete data.id;
            if (!data.institucion_id) {
                alert("Error: No hay una institución seleccionada.");
                return;
            }
            
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
