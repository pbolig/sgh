// js/modules/reemplazos.js
import { Auth } from './auth.js';
import { Docentes } from './docentes.js';

export const Reemplazos = {
    getMotivos: async () => {
        try {
            const response = await fetch('/api/motivos-licencia', {
                headers: { 'Authorization': `Bearer ${Auth.getToken()}` }
            });
            if (!response.ok) throw new Error('Error al obtener motivos de licencia');
            return await response.json();
        } catch (error) {
            console.error(error);
            return [];
        }
    },

    saveMotivo: async (nombre) => {
        try {
            const response = await fetch('/api/motivos-licencia', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${Auth.getToken()}`
                },
                body: JSON.stringify({ nombre })
            });
            return await response.json();
        } catch (error) {
            console.error(error);
            return { error: error.message };
        }
    },

    deleteMotivo: async (id) => {
        try {
            const response = await fetch(`/api/motivos-licencia/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${Auth.getToken()}` }
            });
            return response.ok;
        } catch (error) {
            console.error(error);
            return false;
        }
    },

    getLicencias: async (docenteId = null) => {
        try {
            let url = '/api/licencias';
            if (docenteId) url += `?docente_id=${docenteId}`;
            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${Auth.getToken()}` }
            });
            return await response.json();
        } catch (error) {
            console.error(error);
            return [];
        }
    },

    saveLicencia: async (licencia) => {
        try {
            const response = await fetch('/api/licencias', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${Auth.getToken()}`
                },
                body: JSON.stringify(licencia)
            });
            return await response.json();
        } catch (error) {
            console.error(error);
            return { error: error.message };
        }
    },

    deleteLicencia: async (id) => {
        try {
            const response = await fetch(`/api/licencias/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${Auth.getToken()}` }
            });
            return response.ok;
        } catch (error) {
            console.error(error);
            return false;
        }
    },

    saveReemplazo: async (reemplazo) => {
        try {
            const response = await fetch('/api/reemplazos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${Auth.getToken()}`
                },
                body: JSON.stringify(reemplazo)
            });
            return await response.json();
        } catch (error) {
            console.error(error);
            return { error: error.message };
        }
    },

    deleteReemplazo: async (id) => {
        try {
            const response = await fetch(`/api/reemplazos/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${Auth.getToken()}` }
            });
            return response.ok;
        } catch (error) {
            console.error(error);
            return false;
        }
    },

    getDocenteAsignaciones: async (docenteId) => {
        try {
            const response = await fetch(`/api/asignaciones?docente_id=${docenteId}`, {
                headers: { 'Authorization': `Bearer ${Auth.getToken()}` }
            });
            return await response.json();
        } catch (error) {
            console.error(error);
            return [];
        }
    },

    getDocenteCargos: async (docenteId) => {
        try {
            const response = await fetch(`/api/cargo-asignaciones?docente_id=${docenteId}`, {
                headers: { 'Authorization': `Bearer ${Auth.getToken()}` }
            });
            return await response.json();
        } catch (error) {
            console.error(error);
            return [];
        }
    },

    showLicenciasManager: async (docente) => {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'flex'; // Asegurar visibilidad
        console.log('Iniciando showLicenciasManager para:', docente.apellido);
        
        const updateContent = async () => {
            const [licencias, motivos, asignaciones, cargos] = await Promise.all([
                Reemplazos.getLicencias(docente.id),
                Reemplazos.getMotivos(),
                Reemplazos.getDocenteAsignaciones(docente.id),
                Reemplazos.getDocenteCargos(docente.id)
            ]);
            
            modal.innerHTML = `
                <div class="modal-content modal-large">
                    <div class="modal-header">
                        <h3>Licencias y Reemplazos: ${docente.apellido}, ${docente.nombre}</h3>
                        <button class="btn-close-x" onclick="this.closest('.modal').remove()">&times;</button>
                    </div>
                    
                    <div class="licencias-container" style="display: flex; gap: 20px; flex-direction: column;">
                        <button id="btn-new-licencia" class="btn-primary" style="align-self: flex-start;">+ Registrar Nueva Licencia</button>
                        
                        <div class="licencias-list">
                            ${licencias.length === 0 ? '<p style="text-align: center; opacity: 0.6; padding: 20px;">No tiene licencias registradas.</p>' : ''}
                            ${licencias.map(lic => {
                                // Mapear cobertura
                                const coveredAsigIds = lic.reemplazos.map(r => r.asignacion_id).filter(id => id !== null);
                                const coveredCargoIds = lic.reemplazos.map(r => r.cargo_asignacion_id).filter(id => id !== null);

                                return `
                                <div class="glass-card licencia-card" style="margin-bottom: 25px; padding: 15px; border-left: 5px solid var(--primary);">
                                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                                        <div>
                                            <strong style="font-size: 1.1rem; color: var(--primary);">${lic.motivo?.nombre || 'S/M'}</strong>
                                            <div style="font-size: 0.9rem; opacity: 0.8;">${lic.fecha_inicio} al ${lic.fecha_fin}</div>
                                            <p style="margin: 10px 0; font-style: italic; font-size: 0.85rem;">"${lic.observaciones || 'Sin observaciones'}"</p>
                                        </div>
                                        <button class="btn-delete" onclick="window.confirmDeleteLicencia(${lic.id})">Eliminar</button>
                                    </div>

                                    <div class="cobertura-resumen" style="margin: 15px 0; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 8px;">
                                        <h4 style="margin: 0 0 10px 0; font-size: 0.9rem; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 5px;">Estado de Cobertura de Materias</h4>
                                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                                            ${asignaciones.length === 0 && cargos.length === 0 ? '<p style="font-size: 0.8rem; opacity: 0.5;">No se encontraron asignaciones activas para este docente.</p>' : ''}
                                            ${asignaciones.map(a => {
                                                const isCovered = coveredAsigIds.includes(a.id);
                                                return `
                                                    <div style="font-size: 0.8rem; display: flex; align-items: center; gap: 5px;">
                                                        ${isCovered ? '<span title="Cubierto">✅</span>' : '<span title="Pendiente">⚠️</span>'}
                                                        <span style="opacity: ${isCovered ? '1' : '0.6'}">${a.materia?.nombre || 'S/D'} (${a.comision?.nombre || 'S/C'})</span>
                                                    </div>
                                                `;
                                            }).join('')}
                                            ${cargos.map(c => {
                                                const isCovered = coveredCargoIds.includes(c.id);
                                                return `
                                                    <div style="font-size: 0.8rem; display: flex; align-items: center; gap: 5px;">
                                                        ${isCovered ? '<span title="Cubierto">✅</span>' : '<span title="Pendiente">⚠️</span>'}
                                                        <span style="opacity: ${isCovered ? '1' : '0.6'}">💼 ${c.cargo?.nombre || 'Cargo'}</span>
                                                    </div>
                                                `;
                                            }).join('')}
                                        </div>
                                    </div>
                                    
                                    <div class="reemplazos-section" style="margin-top: 15px; background: rgba(0,0,0,0.1); padding: 10px; border-radius: 8px;">
                                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                            <h4 style="margin: 0; font-size: 0.85rem; text-transform: uppercase; opacity: 0.7;">Reemplazantes Asignados</h4>
                                            <button class="btn-edit" style="font-size: 0.75rem" onclick="window.addReemplazante(${lic.id}, '${lic.fecha_inicio}', '${lic.fecha_fin}')">+ Asignar por Materia</button>
                                        </div>
                                        <div class="reemplazos-list">
                                            ${lic.reemplazos.length === 0 ? '<p style="font-size: 0.8rem; opacity: 0.7;">No hay profesionales asignados para esta licencia.</p>' : ''}
                                            ${lic.reemplazos.map(r => `
                                                <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.1); padding: 5px 10px; border-radius: 4px; margin-bottom: 5px; font-size: 0.85rem;">
                                                    <div>
                                                        <strong>👤 ${r.reemplazante ? `${r.reemplazante.apellido}, ${r.reemplazante.nombre}` : 'S/D'}</strong>
                                                        <span style="font-size: 0.75rem; opacity: 0.7; margin-left: 10px;">
                                                            → ${r.asignacion_id ? 'Materia' : r.cargo_asignacion_id ? 'Cargo' : 'General'}
                                                        </span>
                                                    </div>
                                                    <button class="btn-delete-mini" style="padding: 2px 6px; font-size: 0.7rem;" onclick="window.deleteReemplazo(${r.id})">×</button>
                                                </div>
                                            `).join('')}
                                        </div>
                                    </div>
                                </div>
                            `;}).join('')}
                        </div>
                    </div>
                </div>
            `;
            
            
            const btnNew = modal.querySelector('#btn-new-licencia');
            if (btnNew) {
                console.log('Vinculando evento click a btn-new-licencia');
                btnNew.onclick = (e) => {
                    e.preventDefault();
                    console.log('Click detectado en Registrar Nueva Licencia');
                    Reemplazos.showLicenciaForm(docente, motivos, updateContent);
                };
            } else {
                console.warn('No se encontró el botón #btn-new-licencia en el modal');
            }
            
            window.confirmDeleteLicencia = async (id) => {
                if (confirm('¿Eliminar esta licencia y todos sus reemplazos asociados?')) {
                    if (await Reemplazos.deleteLicencia(id)) updateContent();
                }
            };
            
            window.addReemplazante = async (licId, start, end) => {
                Reemplazos.showReemplazoForm(licId, start, end, docente.id, updateContent);
            };
            
            window.deleteReemplazo = async (id) => {
                if (confirm('¿Eliminar este reemplazo?')) {
                    if (await Reemplazos.deleteReemplazo(id)) updateContent();
                }
            };
        };
        
        await updateContent();
        document.body.appendChild(modal);
    },

    showLicenciaForm: async (docente, motivos, onComplete) => {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'modal-licencia-form';
        modal.style.display = 'flex'; 
        modal.style.zIndex = "9999"; // Valor muy alto para asegurar que esté arriba
        console.log('Preparando formulario de licencia para:', docente.apellido);
        const renderForm = () => {
            try {
                modal.innerHTML = `
                    <div class="modal-content">
                        <h3>Registrar Licencia para ${docente.apellido}</h3>
                        <form id="licencia-form">
                            <input type="hidden" name="docente_id" value="${docente.id}">
                            
                            <div class="form-group">
                                <label>Motivo:</label>
                                <div style="display: flex; gap: 5px;">
                                    <select name="motivo_id" id="motivo-selector" required style="flex: 1;">
                                        <option value="">-- Seleccione --</option>
                                        ${motivos.map(m => `<option value="${m.id}">${m.nombre}</option>`).join('')}
                                    </select>
                                    <button type="button" id="btn-manage-motivos" class="btn-edit" title="Gestionar Motivos">+</button>
                                </div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group half">
                                    <label>Desde:</label>
                                    <input type="date" name="fecha_inicio" required>
                                </div>
                                <div class="form-group half">
                                    <label>Hasta:</label>
                                    <input type="date" name="fecha_fin" required>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label>Observaciones (Máx 200 car.):</label>
                                <textarea name="observaciones" maxlength="200" rows="3"></textarea>
                            </div>
                            
                            <div class="modal-actions">
                                <button type="submit" class="btn-primary">Guardar Licencia</button>
                                <button type="button" class="btn-secondary" onclick="this.closest('.modal').remove()">Cancelar</button>
                            </div>
                        </form>
                    </div>
                `;
                
                const btnM = modal.querySelector('#btn-manage-motivos');
                if (btnM) {
                    btnM.onclick = () => {
                        const nombre = prompt('Ingrese el nombre del nuevo motivo de licencia:');
                        if (nombre) {
                            Reemplazos.saveMotivo(nombre).then(async () => {
                                const newMotivos = await Reemplazos.getMotivos();
                                motivos = newMotivos;
                                renderForm();
                            });
                        }
                    };
                }

                const form = modal.querySelector('#licencia-form');
                if (form) {
                    form.onsubmit = async (e) => {
                        e.preventDefault();
                        const formData = new FormData(e.target);
                        const data = Object.fromEntries(formData.entries());
                        const res = await Reemplazos.saveLicencia(data);
                        if (!res.error) {
                            modal.remove();
                            onComplete();
                        } else alert(res.error);
                    };
                }
            } catch (err) {
                console.error("Error en renderForm:", err);
            }
        };
        
        renderForm();
        document.body.appendChild(modal);
        console.log('Formulario de licencia insertado en el DOM con z-index 9999');
    },

    showReemplazoForm: async (licId, start, end, docenteId, onComplete) => {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'flex';
        modal.style.zIndex = "10000"; 
        console.log('Abriendo formulario de reemplazo agrupado y validado...');
        
        const [docentes, asignaciones, cargos, licencias] = await Promise.all([
            Docentes.list(),
            Reemplazos.getDocenteAsignaciones(docenteId),
            Reemplazos.getDocenteCargos(docenteId),
            Reemplazos.getLicencias(docenteId)
        ]);

        const currentLic = licencias.find(l => l.id === licId);
        const coveredAsigIds = currentLic ? currentLic.reemplazos.map(r => r.asignacion_id).filter(id => id !== null) : [];
        const coveredCargoIds = currentLic ? currentLic.reemplazos.map(r => r.cargo_asignacion_id).filter(id => id !== null) : [];

        // Agrupar asignaciones (horas cátedra) por materia y comisión
        const asigGroups = {};
        asignaciones.forEach(a => {
            const key = `${a.comision_id}`; // Agrupar por comisión (que ya trae su materia)
            if (!asigGroups[key]) {
                asigGroups[key] = {
                    materia: a.comision?.materia?.nombre || 'S/D',
                    comision: a.comision?.nombre || 'S/C',
                    ids: [],
                    horarios: [],
                    allCovered: true
                };
            }
            asigGroups[key].ids.push(a.id);
            asigGroups[key].horarios.push(`${a.dia_semana} (${a.modulo?.hora_inicio || ''})`);
            if (!coveredAsigIds.includes(a.id)) {
                asigGroups[key].allCovered = false;
            }
        });
        
        modal.innerHTML = `
            <div class="modal-content modal-large" style="max-width: 550px;">
                <div class="modal-header">
                    <h3>Asignar Reemplazante</h3>
                    <button class="btn-close-x" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <form id="reemplazo-form">
                    <input type="hidden" name="licencia_id" value="${licId}">
                    <input type="hidden" name="fecha_inicio" value="${start}">
                    <input type="hidden" name="fecha_fin" value="${end}">
                    
                    <div class="form-group">
                        <label>Materia o Cargo a cubrir:</label>
                        <select id="item-reemplazo-group" required style="width: 100%; padding: 10px; border-radius: 8px;">
                            <option value="">-- Seleccione una opción --</option>
                            <optgroup label="Materias (Abarca todos sus horarios)">
                                ${Object.keys(asigGroups).map(key => {
                                    const g = asigGroups[key];
                                    const disabled = g.allCovered ? 'disabled' : '';
                                    const labelCovered = g.allCovered ? ' [YA CUBIERTO]' : '';
                                    return `<option value="group_${key}" data-ids="${g.ids.join(',')}" ${disabled} style="${g.allCovered ? 'color: #666; font-style: italic;' : ''}">
                                        📚 ${g.materia} - ${g.comision} ${labelCovered}
                                    </option>`;
                                }).join('')}
                            </optgroup>
                            <optgroup label="Cargos">
                                ${cargos.map(c => {
                                    const isCovered = coveredCargoIds.includes(c.id);
                                    return `
                                        <option value="cargo_${c.id}" ${isCovered ? 'disabled' : ''} style="${isCovered ? 'color: #666; font-style: italic;' : ''}">
                                            💼 ${c.cargo?.nombre || 'S/D'} (${c.total_horas}hs) ${isCovered ? '[YA CUBIERTO]' : ''}
                                        </option>
                                    `;
                                }).join('')}
                            </optgroup>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Docente Reemplazante:</label>
                        <div style="display: flex; gap: 5px;">
                            <select name="reemplazante_id" required style="flex: 1;">
                                <option value="">-- Seleccione --</option>
                                ${docentes.sort((a,b)=>(a.apellido||'').localeCompare(b.apellido||'')).map(d => `
                                    <option value="${d.id}">${d.apellido}, ${d.nombre} ${d.es_temporal ? '[TEMP]' : ''}</option>
                                `).join('')}
                            </select>
                            <button type="button" id="btn-quick-add-docente" class="btn-edit" title="Alta Rápida Temporal">👤+</button>
                        </div>
                    </div>
                    
                    <div class="modal-actions">
                        <button type="submit" class="btn-primary" style="flex: 1;">Confirmar Asignación Completa</button>
                        <button type="button" class="btn-secondary" onclick="this.closest('.modal').remove()">Cancelar</button>
                    </div>
                </form>
            </div>
        `;
        
        modal.querySelector('#btn-quick-add-docente').onclick = () => {
            const apellido = prompt('Apellido del profesional:');
            const nombre = prompt('Nombre del profesional:');
            if (apellido && nombre) {
                Docentes.save({ apellido, nombre, es_temporal: true, situacion_revista: 'Suplente' }).then(async (res) => {
                    if (res && res.success) {
                        modal.remove();
                        Reemplazos.showReemplazoForm(licId, start, end, docenteId, onComplete);
                    }
                });
            }
        };

        modal.querySelector('#reemplazo-form').onsubmit = async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const baseData = Object.fromEntries(formData.entries());
            const selection = modal.querySelector('#item-reemplazo-group');
            const selectedOpt = selection.selectedOptions[0];
            const val = selection.value;

            try {
                if (val.startsWith('group_')) {
                    // Guardado masivo por materia
                    const idsToReplace = selectedOpt.dataset.ids.split(',');
                    const promises = idsToReplace.map(id => Reemplazos.saveReemplazo({
                        ...baseData,
                        asignacion_id: parseInt(id)
                    }));
                    await Promise.all(promises);
                } else if (val.startsWith('cargo_')) {
                    // Guardado de cargo
                    await Reemplazos.saveReemplazo({
                        ...baseData,
                        cargo_asignacion_id: parseInt(val.replace('cargo_', ''))
                    });
                }
                
                modal.remove();
                onComplete();
            } catch (err) {
                console.error(err);
                alert('Ocurrió un error al procesar la asignación masiva.');
            }
        };
        
        document.body.appendChild(modal);
    }
};
