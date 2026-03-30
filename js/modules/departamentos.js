// js/modules/departamentos.js
import { Auth } from './auth.js';

export const Departamentos = {
    list: async (institucionId = null) => {
        try {
            let url = '/api/departamentos';
            if (institucionId) url += `?institucion_id=${institucionId}`;
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${Auth.getToken()}`
                }
            });
            if (!response.ok) throw new Error('Error al obtener departamentos');
            return await response.json();
        } catch (error) {
            console.error(error);
            return [];
        }
    },

    listAulas: async (deptoId) => {
        try {
            const response = await fetch(`/api/aulas`, {
                headers: {
                    'Authorization': `Bearer ${Auth.getToken()}`
                }
            });
            if (!response.ok) throw new Error('Error al obtener aulas');
            const allAulas = await response.json();
            return allAulas.filter(a => a.departamento_id == deptoId);
        } catch (error) {
            console.error(error);
            return [];
        }
    },

    saveAula: async (aula) => {
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

            if (!response.ok) throw new Error('Error al guardar aula');
            return { success: true, data: await response.json() };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    deleteAula: async (id) => {
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

    save: async (departamento) => {
        try {
            const isNew = !departamento.id;
            const url = isNew ? '/api/departamentos' : `/api/departamentos/${departamento.id}`;
            const method = isNew ? 'POST' : 'PUT';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${Auth.getToken()}`
                },
                body: JSON.stringify(departamento)
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || 'Error al guardar departamento');
            }
            return { success: true, data: await response.json() };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    delete: async (id) => {
        try {
            const response = await fetch(`/api/departamentos/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${Auth.getToken()}`
                }
            });
            if (!response.ok) throw new Error('Error al eliminar departamento');
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    render: async (containerId) => {
        const instId = document.getElementById('inst-selector')?.value;
        const container = document.getElementById(containerId);
        const deptos = await Departamentos.list(instId);
        
        container.innerHTML = `
            <div class="view-header module-header">
                <h2>Gestión de Departamentos</h2>
                <button id="btn-add-depto" class="btn-primary">+ Nuevo Departamento</button>
            </div>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Código</th>
                        <th>Nombre</th>
                        <th>Descripción</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${deptos.length === 0 ? '<tr><td colspan="4" style="text-align:center">No hay departamentos registrados</td></tr>' : ''}
                    ${deptos.map(d => `
                        <tr>
                            <td>${d.codigo}</td>
                            <td>${d.nombre}</td>
                            <td>${d.descripcion || '-'}</td>
                            <td>
                                <button class="btn-primary" onclick="window.manageAulas(${d.id}, '${d.nombre}')">Aulas</button>
                                <button class="btn-edit" onclick="window.editDepto(${d.id})">Editar</button>
                                <button class="btn-delete" onclick="window.deleteDepto(${d.id})">Eliminar</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        window.addDepto = () => Departamentos.showForm(null, instId);
        document.getElementById('btn-add-depto').onclick = window.addDepto;
        
        window.editDepto = (id) => {
            const depto = deptos.find(d => d.id === id);
            Departamentos.showForm(depto, instId);
        };

        window.deleteDepto = async (id) => {
            const warningMsg = `¡ATENCIÓN! Está por eliminar este departamento.\n\n` +
                               `Esta acción es irreversible e INCLUYE EL BORRADO EN CASCADA de:\n` +
                               `• Todas las Materias vinculadas\n` +
                               `• Todas las Aulas vinculadas\n` +
                               `• Todas las Asignaciones de clases\n` +
                               `• Todos los Cargos y Horarios del personal en este depto\n\n` +
                               `¿Realmente desea eliminar TODO lo anterior?`;

            if (confirm(warningMsg)) {
                const res = await Departamentos.delete(id);
                if (res.success) {
                    Departamentos.render(containerId);
                    window.dispatchEvent(new CustomEvent('data-changed', { detail: { type: 'departamentos' } }));
                }
                else alert(res.error);
            }
        };

        window.manageAulas = async (id, nombre) => {
            Departamentos.showAulasModal(id, nombre);
        };
    },

    showAulasModal: async (deptoId, deptoNombre) => {
        const aulas = await Departamentos.listAulas(deptoId);
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'aulas-modal';
        
        const renderTable = (data) => `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Nombre / Aula</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.length === 0 ? '<tr><td colspan="2">No hay aulas</td></tr>' : ''}
                    ${data.map(a => `
                        <tr>
                            <td>${a.nombre}</td>
                            <td>
                                <button onclick="window.deleteAula(${a.id})">Eliminar</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px;">
                <div class="view-header">
                    <h3>Aulas - ${deptoNombre}</h3>
                </div>
                <div id="aulas-list">
                    ${renderTable(aulas)}
                </div>
                <hr>
                <h4>Nueva Aula</h4>
                <form id="aula-form" style="display:flex; gap:10px; margin-top:10px;">
                    <input type="text" name="nombre" placeholder="Nombre (ej: Aula 101)" required style="flex:1">
                    <button type="submit" class="btn-primary">Agregar</button>
                </form>
                <div class="modal-actions">
                    <button type="button" class="btn-secondary" id="btn-close-aulas">Cerrar</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        document.getElementById('btn-close-aulas').onclick = () => modal.remove();
        
        window.deleteAula = async (id) => {
            if (confirm('¿Eliminar aula?')) {
                const res = await Departamentos.deleteAula(id);
                if (res.success) {
                    const newAulas = await Departamentos.listAulas(deptoId);
                    document.getElementById('aulas-list').innerHTML = renderTable(newAulas);
                }
            }
        };

        document.getElementById('aula-form').onsubmit = async (e) => {
            e.preventDefault();
            const nombre = e.target.nombre.value;
            const res = await Departamentos.saveAula({ departamento_id: deptoId, nombre: nombre });
            if (res.success) {
                e.target.reset();
                const newAulas = await Departamentos.listAulas(deptoId);
                document.getElementById('aulas-list').innerHTML = renderTable(newAulas);
            }
        };
    },

    showForm: (depto = null, instId = null) => {
        console.log('Showing Departamento form', depto);
        const isEdit = !!depto;
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>${isEdit ? 'Editar' : 'Nuevo'} Departamento</h3>
                <form id="depto-form">
                    <input type="hidden" name="id" value="${depto?.id || ''}">
                    <input type="hidden" name="institucion_id" value="${depto?.institucion_id || instId || ''}">
                    <div class="form-group">
                        <label>Código:</label>
                        <input type="text" name="codigo" value="${depto?.codigo || ''}" required>
                    </div>
                    <div class="form-group">
                        <label>Nombre:</label>
                        <input type="text" name="nombre" value="${depto?.nombre || ''}" required>
                    </div>
                    <div class="form-group">
                        <label>Descripción:</label>
                        <textarea name="descripcion">${depto?.descripcion || ''}</textarea>
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
        document.getElementById('depto-form').onsubmit = async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());
            if (!data.id) delete data.id;
            
            const res = await Departamentos.save(data);
            if (res.success) {
                modal.remove();
                Departamentos.render('view-container');
                // Disparar evento para que app.js actualice el selector global
                window.dispatchEvent(new CustomEvent('data-changed', { detail: { type: 'departamentos' } }));
            } else {
                alert(res.error);
            }
        };
    }
};
