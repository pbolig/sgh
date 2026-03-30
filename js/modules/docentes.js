// js/modules/docentes.js
import { Auth } from './auth.js';

export const Docentes = {
    list: async (institucionId = null) => {
        try {
            let url = '/api/docentes';
            if (institucionId) url += `?institucion_id=${institucionId}`;
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${Auth.getToken()}`
                }
            });
            if (!response.ok) throw new Error('Error al obtener docentes');
            return await response.json();
        } catch (error) {
            console.error(error);
            return [];
        }
    },

    save: async (docente) => {
        try {
            const isNew = !docente.id;
            const url = isNew ? '/api/docentes' : `/api/docentes/${docente.id}`;
            const method = isNew ? 'POST' : 'PUT';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${Auth.getToken()}`
                },
                body: JSON.stringify(docente)
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || 'Error al guardar docente');
            }
            return { success: true, data: await response.json() };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    delete: async (id) => {
        try {
            const response = await fetch(`/api/docentes/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${Auth.getToken()}`
                }
            });
            if (!response.ok) throw new Error('Error al eliminar docente');
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    render: async (containerId) => {
        const instId = document.getElementById('inst-selector')?.value;
        const container = document.getElementById(containerId);
        let docentes = await Docentes.list(instId);
        
        // Ordenar por apellido
        docentes.sort((a, b) => (a.apellido || '').localeCompare(b.apellido || ''));
        console.log('Docentes ordenados:', docentes.map(d => d.apellido));
        
        container.innerHTML = `
            <div class="view-header module-header">
                <h2>Gestión de Docentes</h2>
                <button id="btn-add-docente" class="btn-primary">+ Nuevo Docente</button>
            </div>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Apellido</th>
                        <th>Nombre</th>
                        <th>Email</th>
                        <th>Teléfono</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${docentes.length === 0 ? '<tr><td colspan="5" style="text-align:center">No hay docentes registrados</td></tr>' : ''}
                    ${docentes.map(d => `
                        <tr>
                            <td>${d.apellido}</td>
                            <td>${d.nombre || '-'}</td>
                            <td>${d.email || '-'}</td>
                            <td>${d.telefono || '-'}</td>
                            <td>
                                <button class="btn-edit" onclick="window.editDocente(${d.id})">Editar</button>
                                <button class="btn-delete" onclick="window.deleteDocente(${d.id})">Eliminar</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        // Usar window para asegurar que los eventos se disparen
        window.addDocente = () => Docentes.showForm(null, instId);
        document.getElementById('btn-add-docente').onclick = window.addDocente;
        
        window.editDocente = (id) => {
            const docente = docentes.find(d => d.id === id);
            Docentes.showForm(docente, instId);
        };

        window.deleteDocente = async (id) => {
            if (confirm('¿Está seguro de eliminar este docente?')) {
                const res = await Docentes.delete(id);
                if (res.success) Docentes.render(containerId);
                else alert(res.error);
            }
        };
    },

    showForm: (docente = null, instId = null) => {
        console.log('Showing Docente form', docente);
        const isEdit = !!docente;
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>${isEdit ? 'Editar' : 'Nuevo'} Docente</h3>
                <form id="docente-form">
                    <input type="hidden" name="id" value="${docente?.id || ''}">
                    <input type="hidden" name="institucion_id" value="${docente?.institucion_id || instId || ''}">
                    <div class="form-group">
                        <label>Apellido:</label>
                        <input type="text" name="apellido" value="${docente?.apellido || ''}" required>
                    </div>
                    <div class="form-group">
                        <label>Nombre:</label>
                        <input type="text" name="nombre" value="${docente?.nombre || ''}">
                    </div>
                    <div class="form-group">
                        <label>Email:</label>
                        <input type="email" name="email" value="${docente?.email || ''}">
                    </div>
                    <div class="form-group">
                        <label>Teléfono:</label>
                        <input type="text" name="telefono" value="${docente?.telefono || ''}">
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
        document.getElementById('docente-form').onsubmit = async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());
            if (!data.id) delete data.id;
            
            const res = await Docentes.save(data);
            if (res.success) {
                modal.remove();
                Docentes.render('view-container');
            } else {
                alert(res.error);
            }
        };
    }
};
