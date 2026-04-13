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

    showLicenciasManager: async (docente) => {
        const modal = document.createElement('div');
        modal.className = 'modal';
        
        const updateContent = async () => {
            const licencias = await Reemplazos.getLicencias(docente.id);
            const motivos = await Reemplazos.getMotivos();
            
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
                            ${licencias.map(lic => `
                                <div class="glass-card licencia-card" style="margin-bottom: 15px; padding: 15px; border-left: 5px solid var(--primary);">
                                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                                        <div>
                                            <strong style="font-size: 1.1rem; color: var(--primary);">${lic.motivo?.nombre || 'S/M'}</strong>
                                            <div style="font-size: 0.9rem; opacity: 0.8;">${lic.fecha_inicio} al ${lic.fecha_fin}</div>
                                            <p style="margin: 10px 0; font-style: italic; font-size: 0.85rem;">"${lic.observaciones || 'Sin observaciones'}"</p>
                                        </div>
                                        <button class="btn-delete" onclick="window.confirmDeleteLicencia(${lic.id})">Eliminar</button>
                                    </div>
                                    
                                    <div class="reemplazos-section" style="margin-top: 15px; background: rgba(0,0,0,0.05); padding: 10px; border-radius: 8px;">
                                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                            <h4 style="margin: 0; font-size: 0.95rem;">Docentes Reemplazantes</h4>
                                            <button class="btn-edit" style="font-size: 0.75rem" onclick="window.addReemplazante(${lic.id}, '${lic.fecha_inicio}', '${lic.fecha_fin}')">+ Asignar</button>
                                        </div>
                                        <div class="reemplazos-list">
                                            ${lic.reemplazos.length === 0 ? '<p style="font-size: 0.8rem; opacity: 0.7;">Sin reemplazos asignados.</p>' : ''}
                                            ${lic.reemplazos.map(r => `
                                                <div style="display: flex; justify-content: space-between; align-items: center; background: white; padding: 5px 10px; border-radius: 4px; margin-bottom: 5px; font-size: 0.85rem;">
                                                    <span>👤 ${r.reemplazante ? `${r.reemplazante.apellido}, ${r.reemplazante.nombre}` : 'S/D'}</span>
                                                    <button class="btn-delete-mini" style="padding: 2px 6px; font-size: 0.7rem;" onclick="window.deleteReemplazo(${r.id})">×</button>
                                                </div>
                                            `).join('')}
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;
            
            modal.querySelector('#btn-new-licencia').onclick = () => Reemplazos.showLicenciaForm(docente, motivos, updateContent);
            
            window.confirmDeleteLicencia = async (id) => {
                if (confirm('¿Eliminar esta licencia y todos sus reemplazos asociados?')) {
                    if (await Reemplazos.deleteLicencia(id)) updateContent();
                }
            };
            
            window.addReemplazante = async (licId, start, end) => {
                Reemplazos.showReemplazoForm(licId, start, end, updateContent);
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
        modal.style.zIndex = "1001";
        
        const renderForm = () => {
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
            
            modal.querySelector('#btn-manage-motivos').onclick = () => {
                const nombre = prompt('Ingrese el nombre del nuevo motivo de licencia:');
                if (nombre) {
                    Reemplazos.saveMotivo(nombre).then(async () => {
                        const newMotivos = await Reemplazos.getMotivos();
                        motivos = newMotivos;
                        renderForm();
                    });
                }
            };

            modal.querySelector('#licencia-form').onsubmit = async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const data = Object.fromEntries(formData.entries());
                const res = await Reemplazos.saveLicencia(data);
                if (!res.error) {
                    modal.remove();
                    onComplete();
                } else alert(res.error);
            };
        };
        
        renderForm();
        document.body.appendChild(modal);
    },

    showReemplazoForm: async (licId, start, end, onComplete) => {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.zIndex = "1002";
        
        const docentes = await Docentes.list();
        
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Asignar Reemplazante</h3>
                <form id="reemplazo-form">
                    <input type="hidden" name="licencia_id" value="${licId}">
                    <input type="hidden" name="fecha_inicio" value="${start}">
                    <input type="hidden" name="fecha_fin" value="${end}">
                    
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
                        <p style="font-size: 0.75rem; color: #f59e0b; margin-top: 5px;">
                            Nota: Se activarán las alertas si el reemplazante tiene horarios superpuestos.
                        </p>
                    </div>
                    
                    <div class="modal-actions">
                        <button type="submit" class="btn-primary">Asignar</button>
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
                        Reemplazos.showReemplazoForm(licId, start, end, onComplete);
                    }
                });
            }
        };

        modal.querySelector('#reemplazo-form').onsubmit = async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());
            const res = await Reemplazos.saveReemplazo(data);
            if (!res.error) {
                modal.remove();
                onComplete();
            } else alert(res.error);
        };
        
        document.body.appendChild(modal);
    }
};
