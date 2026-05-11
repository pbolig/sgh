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
        const [usuarios, roles, instituciones, pendientes] = await Promise.all([
            Usuarios.list(),
            Permisos.getRoles(instId),
            fetch('/api/instituciones', {
                headers: { 'Authorization': `Bearer ${Auth.getToken()}` }
            }).then(r => r.json()),
            fetch('/api/usuarios/pendientes', {
                headers: { 'Authorization': `Bearer ${Auth.getToken()}` }
            }).then(r => r.json()).catch(() => [])
        ]);

        container.innerHTML = `
            <div class="view-header module-header">
                <h2>Gestión de Usuarios</h2>
                <button id="btn-add-user" class="btn-primary">+ Nuevo Usuario</button>
            </div>
            
            <div style="width: 100%; overflow-x: auto;">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Username</th>
                        <th>Institución</th>
                        <th>Rol</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${usuarios.length === 0 ? '<tr><td colspan="5" style="text-align:center">No hay usuarios registrados</td></tr>' : ''}
                    ${usuarios.map(u => `
                        <tr>
                            <td>${u.username}</td>
                            <td style="font-size: 0.85rem; opacity: 0.8;">${u.institucion_id ? instituciones.find(i => i.id === u.institucion_id)?.nombre : '-'}</td>
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
            </div>

            ${pendientes.length > 0 ? `
            <div class="form-section-divider" style="margin-top: 2rem; color: #f59e0b; border-bottom-color: #f59e0b;">Solicitudes de Acceso Pendientes</div>
            <div style="width: 100%; overflow-x: auto; margin-top: 1rem;">
                <table class="data-table table-alert">
                    <thead>
                        <tr>
                            <th>Nombre Completo</th>
                            <th>Username</th>
                            <th>Email</th>
                            <th>Institución</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${pendientes.map(p => `
                            <tr>
                                <td><b>${p.apellido_registro}, ${p.nombre_registro}</b></td>
                                <td>${p.username}</td>
                                <td>${p.email}</td>
                                <td>${instituciones.find(i => i.id === p.institucion_id)?.nombre || '-'}</td>
                                <td>
                                    <button class="btn-primary" style="background-color: #f59e0b;" onclick="window.approveUser(${p.id})">Aprobar...</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            ` : ''}
        `;

        document.getElementById('btn-add-user').onclick = () => Usuarios.showForm(null, roles, instituciones, instId);

        window.editUser = (id) => {
            const user = usuarios.find(u => u.id === id);
            Usuarios.showForm(user, roles, instituciones, instId);
        };

        window.approveUser = (id) => {
            const user = pendientes.find(p => p.id === id);
            Usuarios.showApprovalForm(user, roles);
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

    showForm: (user = null, roles = [], instituciones = [], currentInstId = null) => {
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
                        <label>Email:</label>
                        <input type="email" name="email" value="${user?.email || ''}" placeholder="correo@ejemplo.com">
                    </div>

                    ${!isEdit ? `
                    <div class="form-section-divider">Datos Personales (Opcional)</div>
                    <div class="form-row">
                        <div class="form-group col">
                            <label>Apellido:</label>
                            <input type="text" name="apellido" placeholder="Apellido">
                        </div>
                        <div class="form-group col">
                            <label>Nombre:</label>
                            <input type="text" name="nombre" placeholder="Nombre">
                        </div>
                    </div>
                    <div class="form-group checkbox-group">
                        <label>
                            <input type="checkbox" name="crear_perfil" checked> 
                            Crear automáticamente perfil de Docente/Trabajador
                        </label>
                    </div>
                    ` : ''}

                    <div class="form-group">
                        <label>Rol Asignado:</label>
                        <select name="rol_id" required>
                            <option value="">Seleccione un rol</option>
                            ${roles.map(r => `<option value="${r.id}" ${user?.rol_id === r.id ? 'selected' : ''}>${r.nombre.toUpperCase()}</option>`).join('')}
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Institución:</label>
                        <select name="institucion_id" required>
                            <option value="">Seleccione una institución</option>
                            ${instituciones.map(inst => `
                                <option value="${inst.id}" ${ (user?.institucion_id || currentInstId) == inst.id ? 'selected' : '' }>
                                    ${inst.nombre}
                                </option>
                            `).join('')}
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
            if (data.institucion_id) data.institucion_id = parseInt(data.institucion_id);
            else if (currentInstId) data.institucion_id = parseInt(currentInstId);
            
            // Si es nuevo, manejar checkbox de perfil
            if (!isEdit) {
                data.crear_perfil = !!formData.get('crear_perfil');
            }

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
    },

    showApprovalForm: (user, roles) => {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content" style="border-top: 5px solid #f59e0b;">
                <h3>Aprobar Solicitud: ${user.nombre_registro} ${user.apellido_registro}</h3>
                <p style="font-size: 0.9rem; margin-bottom: 1.5rem; opacity: 0.8;">Defina los parámetros de acceso para este nuevo usuario.</p>
                
                <form id="approval-form">
                    <div class="form-group">
                        <label>Asignar Rol:</label>
                        <select name="rol_id" required>
                            <option value="">Seleccione un rol</option>
                            ${roles.map(r => `<option value="${r.id}">${r.nombre.toUpperCase()}</option>`).join('')}
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Tipo de Función / Perfil:</label>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 0.5rem;">
                            <label class="radio-card">
                                <input type="radio" name="tipo_perfil" value="docente" checked>
                                <div class="rc-content">
                                    <span class="rc-icon">👨‍🏫</span>
                                    <span class="rc-text">Docente (Horas Cátedra)</span>
                                </div>
                            </label>
                            <label class="radio-card">
                                <input type="radio" name="tipo_perfil" value="cargo">
                                <div class="rc-content">
                                    <span class="rc-icon">💼</span>
                                    <span class="rc-text">Cargo (Horas 60 min)</span>
                                </div>
                            </label>
                        </div>
                    </div>

                    <div class="modal-actions">
                        <button type="submit" class="btn-primary" style="background-color: #f59e0b;">Confirmar Aprobación</button>
                        <button type="button" class="btn-secondary" id="btn-close-approval">Cancelar</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);

        document.getElementById('btn-close-approval').onclick = () => modal.remove();

        document.getElementById('approval-form').onsubmit = async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = {
                rol_id: parseInt(formData.get('rol_id')),
                tipo_perfil: formData.get('tipo_perfil')
            };

            try {
                const response = await fetch(`/api/usuarios/${user.id}/aprobar`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${Auth.getToken()}`
                    },
                    body: JSON.stringify(data)
                });

                if (response.ok) {
                    alert('Usuario aprobado y notificado correctamente.');
                    modal.remove();
                    Usuarios.render('view-container');
                    // Refrescar dashboard si fuera necesario
                } else {
                    const err = await response.json();
                    alert('Error: ' + err.detail);
                }
            } catch (error) {
                alert('Error al procesar la aprobación');
            }
        };
    }
};
