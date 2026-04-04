// js/modules/materias.js
import { Auth } from './auth.js';
import { Departamentos } from './departamentos.js';
import { Instituciones } from './instituciones.js';

export const Materias = {
    list: async (deptoId = null) => {
        try {
            let url = '/api/materias';
            if (deptoId) url += `?departamento_id=${deptoId}`;
            const response = await fetch(url, {
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
        const deptoId = document.getElementById('dept-selector')?.value;
        const instId = document.getElementById('inst-selector')?.value;
        const container = document.getElementById(containerId);
        
        let [materias, deptos, instituciones] = await Promise.all([
            Materias.list(deptoId), 
            Departamentos.list(instId),
            Instituciones.list()
        ]);

        const currentInst = instituciones.find(i => i.id == instId);
        const currentDepto = deptos.find(d => d.id == deptoId);
        
        // Ordenar por Año (1°, 2°, 3°...) y luego Nombre Alfabéticamente
        materias.sort((a, b) => {
            const anioA = a.anio || 1;
            const anioB = b.anio || 1;
            if (anioA !== anioB) return anioA - anioB;
            return (a.nombre || '').localeCompare(b.nombre || '');
        });

        // Mapeo rápido de código a nombre para las correlativas
        const codeToName = {};
        materias.forEach(m => codeToName[m.codigo] = m.nombre);
        
        container.innerHTML = `
            <div class="print-header">
                <h1>Reporte de Plan de Estudios</h1>
                <h2>${currentInst ? currentInst.nombre : 'S/I'}</h2>
                <p><b>Carrera:</b> ${currentDepto ? currentDepto.nombre : 'S/D'}</p>
                <p class="print-meta">Fecha de emisión: ${new Date().toLocaleDateString()}</p>
            </div>

            <div class="view-header module-header">
                <h2>Gestión de Materias</h2>
                <div class="header-actions">
                    <button id="btn-print-materias" class="btn-secondary" style="margin-right: 10px;">
                        <i class="fas fa-print"></i> Imprimir / PDF
                    </button>
                    <button id="btn-add-materia" class="btn-primary">+ Nueva Materia</button>
                </div>
            </div>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Año</th>
                        <th>Código</th>
                        <th>Nombre</th>
                        <th>Carga (Mod)</th>
                        <th>Correlatividades</th>
                        <th class="no-print">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${materias.length === 0 ? '<tr><td colspan="6" style="text-align:center">No hay materias registradas</td></tr>' : ''}
                    ${materias.map(m => {
                        const correlativasActuales = m.correlativas ? JSON.parse(m.correlativas) : [];
                        const correlativasNombres = correlativasActuales.map(code => codeToName[code] || code).join(', ');
                        
                        return `
                            <tr>
                                <td><b>${m.anio || 1}°</b></td>
                                <td><code>${m.codigo}</code></td>
                                <td>${m.nombre}</td>
                                <td>${m.carga_horaria_modulos || 0} hs</td>
                                <td style="font-size: 0.85rem; color: var(--text-dim);">
                                    ${correlativasNombres || '<span style="opacity:0.3">-</span>'}
                                </td>
                                <td class="no-print">
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
        
        document.getElementById('btn-print-materias').onclick = () => {
            window.print();
        };
        
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

    showForm: async (materia = null, deptos = []) => {
        console.log('Showing Materia form', materia);
        const isEdit = !!materia;
        
        // Cargar todas las materias del departamento para elegir correlativas
        const todasLasMaterias = await Materias.list(materia?.departamento_id || (deptos.length > 0 ? deptos[0].id : null));
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content modal-large">
                <div class="modal-header">
                    <h3>${isEdit ? 'Editar' : 'Nueva'} Materia</h3>
                    <button class="btn-close-x" id="btn-close-modal-x">&times;</button>
                </div>
                <form id="materia-form">
                    <input type="hidden" name="id" value="${materia?.id || ''}">
                    
                    <div class="form-row">
                        <div class="form-group half">
                            <label>Código:</label>
                            <input type="text" name="codigo" value="${materia?.codigo || ''}" required placeholder="Ej: 3ELE3">
                            <input type="hidden" name="codigo_interno" value="${materia?.codigo || ''}">
                        </div>
                        <div class="form-group half">
                            <label>Año / Nivel:</label>
                            <input type="number" name="anio" value="${materia?.anio || 1}" min="1" max="10" required>
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Nombre de la Materia:</label>
                        <input type="text" name="nombre" value="${materia?.nombre || ''}" required>
                    </div>

                    <div class="form-row">
                        <div class="form-group half">
                            <label>Departamento / Carrera:</label>
                            <select name="departamento_id" required>
                                <option value="">Seleccione...</option>
                                ${deptos.map(d => `<option value="${d.id}" ${d.id === materia?.departamento_id ? 'selected' : ''}>${d.nombre}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group half">
                            <label>Carga Horaria (módulos 40 min):</label>
                            <input type="number" name="carga_horaria_modulos" value="${materia?.carga_horaria_modulos || 0}" min="0">
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Materias Correlativas:</label>
                        <div class="correlativas-list">
                            ${todasLasMaterias.filter(m => m.id !== materia?.id).map(m => {
                                const correlativasActuales = materia?.correlativas ? JSON.parse(materia.correlativas) : [];
                                const isChecked = correlativasActuales.includes(m.codigo);
                                return `
                                    <div class="dept-check-item" style="display: flex !important; align-items: center !important; gap: 10px !important; justify-content: flex-start !important; width: 100% !important; padding: 5px 0 !important;">
                                        <input type="checkbox" class="correlativa-check" value="${m.codigo}" 
                                            id="corr-${m.id}" ${isChecked ? 'checked' : ''} style="margin: 0 !important; width: 18px !important; height: 18px !important; flex-shrink: 0 !important;">
                                        <label for="corr-${m.id}" style="margin: 0 !important; cursor: pointer !important; font-size: 0.9rem !important;">${m.nombre} (${m.codigo})</label>
                                    </div>
                                `;
                            }).join('') || '<p style="font-size: 0.8rem; opacity: 0.6;">No hay otras materias en este departamento para seleccionar como correlativas.</p>'}
                        </div>
                    </div>

                    <div class="modal-actions">
                        <button type="submit" class="btn-primary">Guardar Materia</button>
                        <button type="button" class="btn-secondary" id="btn-close-modal">Cancelar</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);

        const close = () => modal.remove();
        document.getElementById('btn-close-modal').onclick = close;
        document.getElementById('btn-close-modal-x').onclick = close;

        document.getElementById('materia-form').onsubmit = async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());
            data.departamento_id = parseInt(data.departamento_id);
            data.anio = parseInt(data.anio || 1);
            data.carga_horaria_modulos = parseInt(data.carga_horaria_modulos || 0);
            
            // Garantizar que codigo_interno sea igual a codigo si el usuario quiere un solo campo
            data.codigo_interno = data.codigo;
            
            // Recolectar códigos internos de correlativas
            const selCorrs = Array.from(modal.querySelectorAll('.correlativa-check:checked')).map(c => c.value);
            data.correlativas = JSON.stringify(selCorrs);

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
