// js/modules/docentes.js
import { Auth } from './auth.js';
import { Instituciones } from './instituciones.js';
import { Departamentos } from './departamentos.js';
import { Reemplazos } from './reemplazos.js';

export const Docentes = {
    list: async (institucionId = null, deptoId = null, carreraId = null) => {
        try {
            let url = '/api/docentes';
            const params = new URLSearchParams();
            if (institucionId && institucionId !== 'null' && institucionId !== 'undefined') params.append('institucion_id', institucionId);
            if (deptoId && deptoId !== 'null' && deptoId !== 'undefined') params.append('departamento_id', deptoId);
            if (carreraId && carreraId !== 'null' && carreraId !== 'undefined') params.append('carrera_id', carreraId);
            
            if (params.toString()) url += '?' + params.toString();

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
            <div class="table-responsive" style="overflow-x: auto; width: 100%;">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Apellido</th>
                        <th>Nombre</th>
                        <th style="min-width: 200px;">Asignación</th>
                        <th>Email</th>
                        <th>Teléfono</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${docentes.length === 0 ? '<tr><td colspan="6" style="text-align:center">No hay docentes registrados</td></tr>' : ''}
                    ${docentes.map(d => `
                        <tr>
                            <td><strong>${d.apellido}</strong></td>
                            <td>${d.nombre || '-'}</td>
                            <td>
                                <div class="asig-cell">
                                    ${d.instituciones.map(i => `<span class="badge-inst" title="Institución">🏛️ ${i.nombre}</span>`).join('')}
                                    ${d.departamentos.map(dept => `<span class="badge-dept" title="Departamento">📋 ${dept.nombre}</span>`).join('')}
                                    ${d.carreras ? d.carreras.map(c => `<span class="badge-dept" title="Carrera" style="background:rgba(100,100,255,0.15);color:#a5b4fc;border-color:rgba(100,100,255,0.3);">🎓 ${c.nombre}</span>`).join('') : ''}
                                </div>
                            </td>
                            <td>${d.email || '-'}</td>
                            <td>${d.telefono || '-'}</td>
                            <td>
                                <div class="actions-cell">
                                    <button class="btn-edit" onclick="window.manageLicencias(${d.id})">Licencias</button>
                                    <button class="btn-edit" onclick="window.editDocente(${d.id})">Editar</button>
                                    <button class="btn-delete" onclick="window.deleteDocente(${d.id})">Eliminar</button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            </div>

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

        window.manageLicencias = (id) => {
            const docente = docentes.find(d => d.id === id);
            Reemplazos.showLicenciasManager(docente);
        };
    },

    showForm: async (docente = null, currentInstId = null) => {
        console.log('Showing Docente form', docente);
        const isEdit = !!docente;
        const allInstituciones = await Instituciones.list();
        const allUnidades = await Departamentos.list();
        
        const unidByInst = {};
        allInstituciones.forEach(inst => unidByInst[inst.id] = []);
        allUnidades.forEach(u => {
            if (unidByInst[u.institucion_id]) unidByInst[u.institucion_id].push(u);
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
                            <label>Situación de Revista:</label>
                            <select name="situacion_revista">
                                <option value="interino" ${docente?.situacion_revista === 'interino' ? 'selected' : ''}>Interino</option>
                                <option value="titular" ${docente?.situacion_revista === 'titular' ? 'selected' : ''}>Titular</option>
                                <option value="suplente" ${docente?.situacion_revista === 'suplente' ? 'selected' : ''}>Suplente</option>
                            </select>
                        </div>
                        <div class="form-group half">
                            <label>Tipo de Profesional:</label>
                            <select name="es_temporal">
                                <option value="false" ${docente?.es_temporal === false ? 'selected' : ''}>Estable / Planta</option>
                                <option value="true" ${docente?.es_temporal === true ? 'selected' : ''}>Temporal / Externo</option>
                            </select>
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
                                        ${unidByInst[inst.id].map(u => `
                                            <div class="dept-check-item">
                                                <input type="checkbox" class="unit-check" data-tipo="${u.tipo}" value="${u.id}" 
                                                    id="unit-${u.tipo}-${u.id}" data-inst="${inst.id}"
                                                    ${(u.tipo === 'depto' && docente?.departamentos?.some(d => d.id === u.id)) || 
                                                      (u.tipo === 'carrera' && docente?.carreras?.some(c => c.id === u.id)) ? 'checked' : ''}>
                                                <label for="unit-${u.tipo}-${u.id}">${u.icono} ${u.nombre}</label>
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

        const form = document.getElementById('docente-form');
        form.onsubmit = async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            
            // Recolectar M2M manualmente
            data.institucion_ids = Array.from(modal.querySelectorAll('.inst-check:checked')).map(c => parseInt(c.value));
            data.departamento_ids = Array.from(modal.querySelectorAll('.unit-check[data-tipo="depto"]:checked')).map(c => parseInt(c.value));
            data.carrera_ids = Array.from(modal.querySelectorAll('.unit-check[data-tipo="carrera"]:checked')).map(c => parseInt(c.value));
            data.es_temporal = data.es_temporal === 'true';
            
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
