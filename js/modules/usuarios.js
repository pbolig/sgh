// js/modules/usuarios.js
import { Auth } from './auth.js';
import { Permisos } from './permisos.js';

export const Usuarios = {
    list: async () => {
        try {
            const response = await Auth.handleResponse(await fetch('/api/usuarios', {
                headers: { 'Authorization': `Bearer ${Auth.getToken()}` }
            }));
            if (!response || !response.ok) return [];
            return await response.json();
        } catch (error) {
            console.error(error);
            return [];
        }
    },

    save: async (user) => {
        try {
            const isNew = !user.id;
            const url = isNew ? '/api/usuarios' : `/api/usuarios/${user.id}`;
            const method = isNew ? 'POST' : 'PUT';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${Auth.getToken()}`
                },
                body: JSON.stringify(user)
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || 'Error al guardar usuario');
            }
            return { success: true, data: await response.json() };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    delete: async (id) => {
        try {
            const response = await fetch(`/api/usuarios/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${Auth.getToken()}` }
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || 'Error al eliminar usuario');
            }
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    render: async (containerId) => {
        const container = document.getElementById(containerId);
        container.innerHTML = '<div class="loading">Cargando usuarios...</div>';

        const instId = document.getElementById('inst-selector')?.value;
        const [usuarios, roles] = await Promise.all([
            Usuarios.list(),
            Permisos.getRoles(instId)
        ]);

        container.innerHTML = `
            <div class="view-header module-header">
                <h2>Gestión de Usuarios</h2>
                <button id="btn-add-user" class="btn-primary">+ Nuevo Usuario</button>
            </div>
            
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Username</th>
                        <th>Rol</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${usuarios.length === 0 ? '<tr><td colspan="4" style="text-align:center">No hay usuarios registrados</td></tr>' : ''}
                    ${usuarios.map(u => `
                        <tr>
                            <td>${u.username}</td>
                            <td><span class="badge badge-rol">${(u.rol_obj?.nombre || u.rol || 'Sin Rol').toUpperCase()}</span></td>
                            <td>
                                <span class="badge ${u.activo ? 'badge-success' : 'badge-error'}">
                                    ${u.activo ? 'Activo' : 'Inactivo'}
                                </span>
                            </td>
                            <td>
                                <button class="btn-edit" onclick="window.editUser(${u.id})">Editar</button>
                                <button class="btn-delete" onclick="window.deleteUser(${u.id})">Eliminar</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        document.getElementById('btn-add-user').onclick = () => Usuarios.showForm(null, roles);

        window.editUser = (id) => {
            const user = usuarios.find(u => u.id === id);
            Usuarios.showForm(user, roles);
        };

        window.deleteUser = async (id) => {
            if (confirm('¿Realmente desea eliminar este usuario?')) {
                const res = await Usuarios.delete(id);
                if (res.success) {
                    Usuarios.render(containerId);
                } else {
                    alert(res.error);
                }
            }
        };
    },

    showForm: (user = null, roles = []) => {
        const isEdit = !!user;
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>${isEdit ? 'Editar' : 'Nuevo'} Usuario</h3>
                <form id="user-form">
                    <input type="hidden" name="id" value="${user?.id || ''}">
                    
                    <div class="form-group">
                        <label>Nombre de Usuario:</label>
                        <input type="text" name="username" value="${user?.username || ''}" required ${isEdit ? 'readonly' : ''}>
                    </div>

                    <div class="form-group">
                        <label>${isEdit ? 'Nueva ' : ''}Contraseña:</label>
                        <input type="password" name="password" ${isEdit ? '' : 'required'} placeholder="${isEdit ? 'Dejar en blanco para no cambiar' : ''}">
                    </div>

                    <div class="form-group">
                        <label>Rol Asignado:</label>
                        <select name="rol_id" required>
                            <option value="">Seleccione un rol</option>
                            ${roles.map(r => `<option value="${r.id}" ${user?.rol_id === r.id ? 'selected' : ''}>${r.nombre.toUpperCase()}</option>`).join('')}
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Estado:</label>
                        <select name="activo" required>
                            <option value="1" ${user?.activo !== 0 ? 'selected' : ''}>Activo</option>
                            <option value="0" ${user?.activo === 0 ? 'selected' : ''}>Inactivo</option>
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
        
        document.getElementById('user-form').onsubmit = async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());
            
            // Ajustar tipos
            data.activo = parseInt(data.activo);
            if (data.rol_id) data.rol_id = parseInt(data.rol_id);
            if (!data.id) delete data.id;
            if (isEdit && !data.password) delete data.password;

            const res = await Usuarios.save(data);
            if (res.success) {
                modal.remove();
                Usuarios.render('view-container');
            } else {
                alert(res.error);
            }
        };
    }
};
