// js/modules/permisos.js
import { Auth } from './auth.js';

export const Permisos = {
    getRoles: async (institucionId = null) => {
        try {
            let url = '/api/roles';
            if (institucionId) url += `?institucion_id=${institucionId}`;
            const response = await Auth.handleResponse(await fetch(url, {
                headers: { 'Authorization': `Bearer ${Auth.getToken()}` }
            }));
            if (!response || !response.ok) return [];
            return await response.json();
        } catch (error) {
            console.error(error);
            return [];
        }
    },

    getModulos: async () => {
        try {
            const response = await Auth.handleResponse(await fetch('/api/modulos', {
                headers: { 'Authorization': `Bearer ${Auth.getToken()}` }
            }));
            if (!response || !response.ok) return [];
            return await response.json();
        } catch (error) {
            console.error(error);
            return [];
        }
    },

    getPermisos: async (rolId = null) => {
        try {
            let url = '/api/permisos';
            if (rolId) url += `?rol_id=${rolId}`;
            const response = await Auth.handleResponse(await fetch(url, {
                headers: { 'Authorization': `Bearer ${Auth.getToken()}` }
            }));
            if (!response || !response.ok) return [];
            return await response.json();
        } catch (error) {
            console.error(error);
            return [];
        }
    },

    savePermisos: async (permisos) => {
        try {
            const response = await fetch('/api/permisos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${Auth.getToken()}`
                },
                body: JSON.stringify(permisos)
            });
            return await response.json();
        } catch (error) {
            console.error(error);
            return { error: error.message };
        }
    },

    saveRol: async (rol) => {
        try {
            const response = await fetch('/api/roles', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${Auth.getToken()}`
                },
                body: JSON.stringify(rol)
            });
            return await response.json();
        } catch (error) {
            console.error(error);
            return { error: error.message };
        }
    },

    render: async (containerId) => {
        const container = document.getElementById(containerId);
        container.innerHTML = '<div class="loading">Cargando gestión de accesos...</div>';

        const instId = document.getElementById('inst-selector')?.value;
        const [roles, modulos] = await Promise.all([
            Permisos.getRoles(instId),
            Permisos.getModulos()
        ]);

        container.innerHTML = `
            <div class="view-header module-header">
                <h2>Gestión de Accesos y Roles</h2>
                <div class="header-actions">
                    <button id="btn-add-rol" class="btn-primary">+ Nuevo Rol</button>
                    <button id="btn-save-matrix" class="btn-success">Guardar Cambios</button>
                </div>
            </div>
            
            <div class="rbac-container">
                <div class="rol-selector-wrapper">
                    <label>Seleccionar Rol para configurar:</label>
                    <select id="rol-matrix-selector">
                        ${roles.map(r => `<option value="${r.id}">${r.nombre.toUpperCase()}</option>`).join('')}
                    </select>
                </div>

                <div class="matrix-wrapper" id="matrix-content">
                    <!-- Se carga dinámicamente al cambiar el rol -->
                </div>
            </div>
        `;

        const selector = document.getElementById('rol-matrix-selector');
        
        const loadMatrix = async () => {
            const rolId = parseInt(selector.value);
            const currentPermisos = await Permisos.getPermisos(rolId);
            const matrixContent = document.getElementById('matrix-content');
            
            matrixContent.innerHTML = `
                <table class="data-table matrix-table">
                    <thead>
                        <tr>
                            <th>Módulo</th>
                            <th>Acceso Cerrado</th>
                            <th>Solo Lectura</th>
                            <th>Edición / Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${modulos.map(m => {
                            const p = currentPermisos.find(cp => cp.modulo_id === m.id);
                            const nivel = p ? p.nivel : 'ninguno';
                            return `
                                <tr data-modulo-id="${m.id}">
                                    <td>
                                        <div class="mod-info">
                                            <span class="mod-icon">${m.icono || '📦'}</span>
                                            <span class="mod-label">${m.etiqueta}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <input type="radio" name="perm-${m.id}" value="ninguno" ${nivel === 'ninguno' ? 'checked' : ''}>
                                    </td>
                                    <td>
                                        <input type="radio" name="perm-${m.id}" value="lectura" ${nivel === 'lectura' ? 'checked' : ''}>
                                    </td>
                                    <td>
                                        <input type="radio" name="perm-${m.id}" value="edicion" ${nivel === 'edicion' ? 'checked' : ''}>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            `;
        };

        selector.onchange = loadMatrix;
        await loadMatrix();

        document.getElementById('btn-add-rol').onclick = () => {
            const nombre = prompt('Nombre del nuevo rol (ej: auditor):');
            if (nombre) {
                const instId = document.getElementById('inst-selector')?.value;
                if (!instId) {
                    alert('Debe tener una institución seleccionada');
                    return;
                }
                Permisos.saveRol({ 
                    nombre: nombre.toLowerCase(),
                    institucion_id: parseInt(instId)
                }).then(() => Permisos.render(containerId));
            }
        };

        document.getElementById('btn-save-matrix').onclick = async () => {
            const rolId = parseInt(selector.value);
            const rows = document.querySelectorAll('#matrix-content tr[data-modulo-id]');
            const newPermisos = [];

            rows.forEach(row => {
                const moduloId = parseInt(row.dataset.moduloId);
                const nivel = row.querySelector('input[type="radio"]:checked').value;
                newPermisos.push({ rol_id: rolId, modulo_id: moduloId, nivel: nivel });
            });

            const res = await Permisos.savePermisos(newPermisos);
            if (res.error) alert('Error al guardar: ' + res.error);
            else alert('Permisos actualizados correctamente');
        };
    }
};
