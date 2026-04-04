// js/modules/docentes.js
import { Auth } from './auth.js';
import { Instituciones } from './instituciones.js';
import { Departamentos } from './departamentos.js';

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
                    ${docentes.length === 0 ? '<tr><td colspan="6" style="text-align:center">No hay docentes registrados</td></tr>' : ''}
                    ${docentes.map(d => `
                        <tr>
                            <td>${d.apellido}</td>
                            <td>${d.nombre || '-'}</td>
                            <td>
                                ${d.instituciones.map(i => `<span class="badge-inst">${i.nombre}</span>`).join(' ')}
                            </td>
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

    showForm: async (docente = null, currentInstId = null) => {
        console.log('Showing Docente form', docente);
        const isEdit = !!docente;
        const allInstituciones = await Instituciones.list();
        
        // Cargar todos los departamentos de todas las instituciones (para el mapeo)
        // Optimizamos cargando solo los necesarios o todos si no son muchos
        const allDeptos = await Promise.all(allInstituciones.map(i => Departamentos.list(i.id)));
        const deptosByInst = {};
        allInstituciones.forEach((inst, idx) => {
            deptosByInst[inst.id] = allDeptos[idx];
        });

        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content modal-large">
                <div class="modal-header">
                    <h3>${isEdit ? 'Editar' : 'Nuevo'} Docente</h3>
                    <button class="btn-close-x" id="btn-close-modal-x">&times;</button>
                </div>
                <form id="docente-form">
                    <input type="hidden" name="id" value="${docente?.id || ''}">
                    
                    <div class="form-row">
                        <div class="form-group half">
                            <label>Apellido:</label>
                            <input type="text" name="apellido" value="${docente?.apellido || ''}" required>
                        </div>
                        <div class="form-group half">
                            <label>Nombre:</label>
                            <input type="text" name="nombre" value="${docente?.nombre || ''}">
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group half">
                            <label>Email:</label>
                            <input type="email" name="email" value="${docente?.email || ''}">
                        </div>
                        <div class="form-group half">
                            <label>Teléfono:</label>
                            <input type="text" name="telefono" value="${docente?.telefono || ''}">
                        </div>
                    </div>

                    <div class="form-group">
                        <label style="font-weight: bold; margin-bottom: 10px; display: block;">Asignación de Instituciones y Carreras:</label>
                        <div class="m2m-container glass-card">
                            ${allInstituciones.map(inst => `
                                <div class="inst-m2m-block">
                                    <div class="inst-m2m-header">
                                        <input type="checkbox" class="inst-check" id="inst-${inst.id}" value="${inst.id}" 
                                            ${docente?.instituciones?.some(i => i.id === inst.id) ? 'checked' : ''}>
                                        <label for="inst-${inst.id}"><strong>${inst.nombre}</strong></label>
                                    </div>
                                    <div class="dept-m2m-list ${docente?.instituciones?.some(i => i.id === inst.id) ? '' : 'disabled'}">
                                        ${deptosByInst[inst.id].map(dept => `
                                            <div class="dept-check-item">
                                                <input type="checkbox" class="dept-check" name="dept_ids" value="${dept.id}" 
                                                    id="dept-${dept.id}" data-inst="${inst.id}"
                                                    ${docente?.departamentos?.some(d => d.id === dept.id) ? 'checked' : ''}>
                                                <label for="dept-${dept.id}">${dept.nombre}</label>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <div class="modal-actions">
                        <button type="submit" class="btn-primary">Guardar Cambios</button>
                        <button type="button" class="btn-secondary" id="btn-close-modal">Cancelar</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);

        // Lógica para habilitar/deshabilitar departamentos según la institución
        const instChecks = modal.querySelectorAll('.inst-check');
        instChecks.forEach(check => {
            check.onchange = (e) => {
                const deptList = e.target.closest('.inst-m2m-block').querySelector('.dept-m2m-list');
                if (e.target.checked) {
                    deptList.classList.remove('disabled');
                } else {
                    deptList.classList.add('disabled');
                    // Desmarcar departamentos si se desmarca la institución
                    deptList.querySelectorAll('input').forEach(i => i.checked = false);
                }
            };
        });

        const close = () => modal.remove();
        document.getElementById('btn-close-modal').onclick = close;
        document.getElementById('btn-close-modal-x').onclick = close;

        document.getElementById('docente-form').onsubmit = async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());
            
            // Recolectar IDs de la UI M2M
            data.institucion_ids = Array.from(modal.querySelectorAll('.inst-check:checked')).map(i => parseInt(i.value));
            data.departamento_ids = Array.from(modal.querySelectorAll('.dept-check:checked')).map(i => parseInt(i.value));
            
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
