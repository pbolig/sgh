export const Instituciones = {
    async list() {
        try {
            const res = await fetch('/api/instituciones');
            return await res.json();
        } catch (error) {
            console.error('Error listando instituciones:', error);
            return [];
        }
    },

    async save(inst) {
        const method = inst.id ? 'PUT' : 'POST';
        const url = inst.id ? `/api/instituciones/${inst.id}` : '/api/instituciones';
        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(inst)
            });
            return await res.json();
        } catch (error) {
            console.error('Error guardando institución:', error);
            return { error };
        }
    },

    async delete(id) {
        try {
            await fetch(`/api/instituciones/${id}`, { method: 'DELETE' });
            return { success: True };
        } catch (error) {
            return { error };
        }
    },

    async render(containerId) {
        const container = document.getElementById(containerId);
        container.innerHTML = '<div class="loading">Cargando instituciones...</div>';

        const list = await this.list();
        
        container.innerHTML = `
            <div class="glass-card main-card">
                <div class="card-header">
                    <h2 class="premium-title">Gestión de Instituciones</h2>
                    <button class="btn-primary" id="btn-add-inst">Nueva Institución</button>
                </div>
                
                <div class="table-container modern-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Código</th>
                                <th>Jurisdicción</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${list.map(i => `
                                <tr>
                                    <td><strong>${i.nombre}</strong></td>
                                    <td><span class="badge-code">${i.siglas || i.codigo}</span></td>
                                    <td>${i.jurisdiccion || '-'}</td>
                                    <td>
                                        <button class="btn-icon-small btn-edit" data-id="${i.id}">✎</button>
                                        <button class="btn-icon-small btn-del" data-id="${i.id}">×</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Modal -->
            <div id="inst-modal" class="modal-overlay">
                <div class="modal-content glass-card">
                    <h2 id="inst-modal-title" class="premium-title">Institución</h2>
                    <form id="inst-form">
                        <input type="hidden" id="inst-id">
                        <div class="form-group">
                            <label>Nombre de la Institución</label>
                            <input type="text" id="inst-nombre" required placeholder="Ej: Universidad Nacional">
                        </div>
                        <div class="form-group">
                            <label>Código / Sigla</label>
                            <input type="text" id="inst-codigo" required placeholder="Ej: UNAL">
                        </div>
                        <div class="form-group">
                            <label>Jurisdicción</label>
                            <input type="text" id="inst-jurisdiccion" placeholder="Ej: Ministerio de Educación">
                        </div>
                        <div class="form-group">
                            <label>Logo URL (Opcional)</label>
                            <input type="text" id="inst-logo" placeholder="https://...">
                        </div>
                        <div class="form-group">
                            <label>Descripción</label>
                            <textarea id="inst-desc" rows="3"></textarea>
                        </div>
                        <div class="modal-actions">
                            <button type="button" class="btn-secondary" id="btn-cancel-inst">Cancelar</button>
                            <button type="submit" class="btn-primary">Guardar</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        this.initEvents(list);
    },

    initEvents(list) {
        const modal = document.getElementById('inst-modal');
        const form = document.getElementById('inst-form');
        
        document.getElementById('btn-add-inst').onclick = () => {
            form.reset();
            document.getElementById('inst-id').value = '';
            document.getElementById('inst-modal-title').textContent = 'Nueva Institución';
            modal.classList.add('active');
        };

        document.getElementById('btn-cancel-inst').onclick = () => modal.classList.remove('active');

        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.onclick = () => {
                const inst = list.find(i => i.id == btn.dataset.id);
                if (inst) {
                    document.getElementById('inst-id').value = inst.id;
                    document.getElementById('inst-nombre').value = inst.nombre;
                    document.getElementById('inst-codigo').value = inst.siglas || inst.codigo || '';
                    document.getElementById('inst-jurisdiccion').value = inst.jurisdiccion || '';
                    document.getElementById('inst-logo').value = inst.logo_url || '';
                    document.getElementById('inst-desc').value = inst.descripcion || '';
                    document.getElementById('inst-modal-title').textContent = 'Editar Institución';
                    modal.classList.add('active');
                }
            };
        });

        document.querySelectorAll('.btn-del').forEach(btn => {
            btn.onclick = async () => {
                if (confirm('¿Está seguro de eliminar esta institución? Esto podría afectar a los departamentos asociados.')) {
                    await this.delete(btn.dataset.id);
                    this.render('view-container');
                }
            };
        });

        form.onsubmit = async (e) => {
            e.preventDefault();
            const instData = {
                id: document.getElementById('inst-id').value,
                nombre: document.getElementById('inst-nombre').value,
                siglas: document.getElementById('inst-codigo').value,
                jurisdiccion: document.getElementById('inst-jurisdiccion').value,
                logo_url: document.getElementById('inst-logo').value,
                descripcion: document.getElementById('inst-desc').value
            };
            await this.save(instData);
            modal.classList.remove('active');
            this.render('view-container');
            // Notificar cambio global
            window.dispatchEvent(new CustomEvent('data-changed', { detail: { type: 'instituciones' } }));
        };
    }
};
