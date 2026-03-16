// js/modules/materias.js
import { Auth } from './auth.js';
import { Departamentos } from './departamentos.js';

export const Materias = {
    list: async () => {
        try {
            const response = await fetch('/api/materias', {
                headers: {
                    'Authorization': `Bearer ${Auth.getToken()}`
                }
            });
            if (!response.ok) throw new Error('Error al obtener materias');
            return await response.json();
        } catch (error) {
            console.error(error);
            return [];
        }
    },

    save: async (materia) => {
        try {
            const isNew = !materia.id;
            const url = isNew ? '/api/materias' : `/api/materias/${materia.id}`;
            const method = isNew ? 'POST' : 'PUT';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${Auth.getToken()}`
                },
                body: JSON.stringify(materia)
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || 'Error al guardar materia');
            }
            return { success: true, data: await response.json() };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    delete: async (id) => {
        try {
            const response = await fetch(`/api/materias/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${Auth.getToken()}`
                }
            });
            if (!response.ok) throw new Error('Error al eliminar materia');
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    render: async (containerId) => {
        console.log('Rendering Materias in', containerId);
        const container = document.getElementById(containerId);
        let [materias, deptos] = await Promise.all([Materias.list(), Departamentos.list()]);
        
        // Ordenar por nombre
        materias.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
        
        container.innerHTML = `
            <div class="view-header module-header">
                <h2>Gestión de Materias</h2>
                <button id="btn-add-materia" class="btn-primary">+ Nueva Materia</button>
            </div>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Código</th>
                        <th>Nombre</th>
                        <th>Departamento</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${materias.length === 0 ? '<tr><td colspan="4" style="text-align:center">No hay materias registradas</td></tr>' : ''}
                    ${materias.map(m => {
                        const depto = deptos.find(d => d.id === m.departamento_id);
                        return `
                            <tr>
                                <td>${m.codigo}</td>
                                <td>${m.nombre}</td>
                                <td>${depto ? depto.nombre : '-'}</td>
                                <td>
                                    <button class="btn-edit" onclick="window.editMateria(${m.id})">Editar</button>
                                    <button class="btn-delete" onclick="window.deleteMateria(${m.id})">Eliminar</button>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;

        window.addMateria = () => Materias.showForm(null, deptos);
        document.getElementById('btn-add-materia').onclick = window.addMateria;
        
        window.editMateria = (id) => {
            const materia = materias.find(m => m.id === id);
            Materias.showForm(materia, deptos);
        };

        window.deleteMateria = async (id) => {
            if (confirm('¿Está seguro de eliminar esta materia?')) {
                const res = await Materias.delete(id);
                if (res.success) Materias.render(containerId);
                else alert(res.error);
            }
        };
    },

    showForm: (materia = null, deptos = []) => {
        console.log('Showing Materia form', materia);
        const isEdit = !!materia;
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>${isEdit ? 'Editar' : 'Nueva'} Materia</h3>
                <form id="materia-form">
                    <input type="hidden" name="id" value="${materia?.id || ''}">
                    <div class="form-group">
                        <label>Código:</label>
                        <input type="text" name="codigo" value="${materia?.codigo || ''}" required>
                    </div>
                    <div class="form-group">
                        <label>Nombre:</label>
                        <input type="text" name="nombre" value="${materia?.nombre || ''}" required>
                    </div>
                    <div class="form-group">
                        <label>Departamento:</label>
                        <select name="departamento_id" required>
                            <option value="">Seleccione un departamento</option>
                            ${deptos.map(d => `<option value="${d.id}" ${d.id === materia?.departamento_id ? 'selected' : ''}>${d.nombre}</option>`).join('')}
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
        document.getElementById('materia-form').onsubmit = async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());
            data.departamento_id = parseInt(data.departamento_id);
            if (!data.id) delete data.id;
            
            const res = await Materias.save(data);
            if (res.success) {
                modal.remove();
                Materias.render('view-container');
            } else {
                alert(res.error);
            }
        };
    }
};
