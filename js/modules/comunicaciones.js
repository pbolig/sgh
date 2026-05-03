// js/modules/comunicaciones.js
import { Auth } from './auth.js';

export const Comunicaciones = {
    conversaciones: [],
    conversacionSeleccionada: null,

    render: async (containerId) => {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="comms-container glass">
                <div class="comms-sidebar">
                    <div class="comms-header">
                        <h2 style="margin-bottom:1rem; text-align: center;">Centro de Mensajes</h2>
                        <div class="comms-header-actions" style="display:flex; gap:10px; flex-direction: column; align-items: center;">
                            <div style="display:flex; gap:10px; justify-content: center; width: 100%;">
                                <button id="btnConfigSis" class="btn-sec-glow flex-grow-1" style="flex-basis: 50%; max-width: 140px;" title="Configuraciones de Sistema">
                                    Ajustes
                                </button>
                                ${Auth.getUser().rol === 'admin' ? `
                                    <button id="btnSyncDocentes" class="btn-sec-glow flex-grow-1" style="flex-basis: 50%; max-width: 140px;" title="Sincronizar accesos">
                                        Cuentas
                                    </button>
                                ` : ''}
                            </div>
                            <div style="display:flex; gap:10px; justify-content: center; width: 100%;">
                                <button id="btnNewComu" class="btn-primary-glow flex-grow-1" style="flex-basis: 50%; max-width: 140px;"> + Nuevo </button>
                                ${Auth.getUser().rol === 'admin' ? `
                                    <button id="btnPurgeComu" class="btn-danger-outline p-2 flex-grow-1" style="flex-basis: 50%; max-width: 140px;" title="Purgar Mensajes Antiguos">
                                        Purga
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                    <div class="comms-tabs">
                        <button class="tab-btn active" data-tipo="ticket">Tickets</button>
                        <button class="tab-btn" data-tipo="anuncio">Anuncios</button>
                        ${Auth.getUser().rol === 'admin' ? '<button class="tab-btn" data-tipo="logs" style="border-left: 1px solid rgba(255,255,255,0.1);">Auditoría</button>' : ''}
                    </div>
                    <div id="commsFilters" class="comms-filters p-3 mb-2" style="display: flex; flex-direction: column; background: rgba(255,255,255,0.02); border-radius: 8px; border: 1px solid rgba(255,255,255,0.05); margin: 0 10px;">
                        <div style="margin-bottom: 5px;">
                            <label class="small text-muted mb-1" style="display:block;">Búsqueda Inteligente</label>
                            <input type="text" id="commsSmartSearch" class="form-control" style="width: 100%; background: rgba(0,0,0,0.5); color: white; border-color: rgba(255,255,255,0.2); padding: 10px 15px; font-size: 0.9rem; border-radius: 6px;" placeholder="🔍 Buscar asunto o persona...">
                        </div>
                        <details>
                            <summary class="small text-info mb-2" style="cursor:pointer; padding-top: 5px; outline: none; font-weight:600;"><i class="fas fa-filter"></i> Mostrar/Ocultar Filtros de Estado</summary>
                            <div style="display: flex; flex-direction: column; gap: 8px;">
                                <span class="badge badge-todos filter-badge active" data-state="todos" style="cursor:pointer; padding: 10px; font-size: 0.9rem; text-align: center;">Todos</span>
                                <span class="badge badge-abierto filter-badge" data-state="abierto" style="cursor:pointer; padding: 10px; font-size: 0.9rem; text-align: center;">Abiertos</span>
                                <span class="badge badge-en_proceso filter-badge" data-state="en_proceso" style="cursor:pointer; padding: 10px; font-size: 0.9rem; text-align: center;">En Proceso</span>
                                <span class="badge badge-resuelto filter-badge" data-state="resuelto" style="cursor:pointer; padding: 10px; font-size: 0.9rem; text-align: center;">Resueltos</span>
                                <span class="badge badge-cerrado filter-badge" data-state="cerrado" style="cursor:pointer; padding: 10px; font-size: 0.9rem; text-align: center;">Cerrados</span>
                            </div>
                        </details>
                    </div>
                </div>

                <!-- Columna 2: Resultados y Lista -->
                <div class="comms-list-column">
                    <div class="comms-list-header text-muted small text-uppercase">
                        Resultados Globales
                    </div>
                    <div id="conversacionesList" class="comms-list">
                        <div class="loader-pills"></div>
                    </div>
                </div>
                <div id="commsChat" class="comms-chat-area">
                    <div class="chat-placeholder">
                        <i class="fas fa-comments"></i>
                        <p>Selecciona una conversación para leer</p>
                    </div>
                </div>
            </div>

            <!-- Modal Purga (Native) -->
            <div id="modalPurga" class="modal-overlay" style="display:none; z-index:9999;">
                <div class="modal-content glass" style="max-width:500px; border: 1px solid rgba(255,0,0,0.3)">
                    <div class="modal-header border-bottom border-danger pb-2 mb-3">
                        <h4 class="m-0 text-danger" style="font-size:1.2rem"><i class="fas fa-exclamation-triangle"></i> Purgar Sistema</h4>
                        <button type="button" class="btn-close" onclick="document.getElementById('modalPurga').style.display='none'">×</button>
                    </div>
                    <div class="modal-body text-white">
                        <p class="small text-muted">Se generará un archivo de respaldo TXT/JSON y se <strong>eliminarán permanentemente</strong> de la base de datos todos los mensajes anteriores a la fecha seleccionada.</p>
                        <div class="form-group mb-3 text-start">
                            <label class="small text-info mb-1">Eliminar todo lo anterior a:</label>
                            <input type="date" id="fechaPurga" class="form-control mb-3">
                        </div>
                        <button id="btnConfirmPurga" class="btn-danger w-100">Purgar y Descargar Backup</button>
                    </div>
                </div>
            </div>
        `;

        Comunicaciones.initEventListeners();
        await Comunicaciones.loadConversaciones('ticket');
        if (Auth.getUser().rol === 'admin') {
            Comunicaciones.checkDocentesSync();
        }
    },

    initEventListeners: () => {
        // Tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                if (e.target.dataset.tipo === 'logs') {
                    Comunicaciones.loadLogs();
                } else {
                    await Comunicaciones.loadConversaciones(e.target.dataset.tipo);
                }
            });
        });

        // Eventos filtros multiseleccion
        document.querySelectorAll('.filter-badge').forEach(badge => {
            badge.addEventListener('click', (e) => {
                const clickedState = e.target.dataset.state;
                if (clickedState === 'todos') {
                    document.querySelectorAll('.filter-badge').forEach(b => b.classList.remove('active'));
                    e.target.classList.add('active');
                } else {
                    document.querySelector('.filter-badge[data-state="todos"]').classList.remove('active');
                    e.target.classList.toggle('active');
                    
                    // Si se desmarcaron todos los específicos, vuelve a "Todos"
                    const allActives = document.querySelectorAll('.filter-badge.active');
                    if (allActives.length === 0) {
                        document.querySelector('.filter-badge[data-state="todos"]').classList.add('active');
                    }
                }
                Comunicaciones.aplicarFiltrosLocal();
            });
        });

        // Evento Búsqueda Inteligente
        const smartSearch = document.getElementById('commsSmartSearch');
        if(smartSearch) {
            smartSearch.addEventListener('input', () => {
                Comunicaciones.aplicarFiltrosLocal();
            });
        }

        // Evento Purga
        const btnPurga = document.getElementById('btnPurgeComu');
        if (btnPurga) {
            btnPurga.addEventListener('click', () => {
                document.getElementById('modalPurga').style.display = 'flex';
            });
            document.getElementById('btnConfirmPurga').addEventListener('click', Comunicaciones.ejecutarPurga);
        }

        // Nueva Comunicación
        document.getElementById('btnNewComu')?.addEventListener('click', () => {
            Comunicaciones.renderNewForm();
        });

        // Sincronización de Docentes
        document.getElementById('btnSyncDocentes')?.addEventListener('click', async () => {
            if(!confirm('¿Desea crear automáticamente las cuentas de usuario para docentes sin cuenta (basado en su email)?')) return;
            try {
                const res = await fetch('/api/docentes/sync-users', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${Auth.getToken()}` }
                });
                const data = await res.json();
                Comunicaciones.showToast(`Sincronización: Creados ${data.created}, Vinculados ${data.linked}`, 'success');
                Comunicaciones.checkDocentesSync();
            } catch(e) { Comunicaciones.showToast('Error en la sincronización.', 'error'); }
        });

        // Configuración
        document.getElementById('btnConfigSis')?.addEventListener('click', () => {
            Comunicaciones.openConfigModal();
        });
    },

    checkDocentesSync: async () => {
        try {
            const res = await fetch('/api/docentes/pendientes-sync', {
                headers: { 'Authorization': `Bearer ${Auth.getToken()}` }
            });
            const data = await res.json();
            const badgeTxt = document.getElementById('syncBadgeTxt');
            const btn = document.getElementById('btnSyncDocentes');
            if(badgeTxt && btn) {
                if(data.pendientes > 0) {
                    badgeTxt.textContent = `(${data.pendientes})`;
                    btn.classList.add('pulse-warning');
                } else {
                    badgeTxt.textContent = '';
                    btn.classList.remove('pulse-warning');
                }
            }
        } catch(e) { console.warn("Error check sync docentes", e); }
    },

    aplicarFiltrosLocal: () => {
        const activeBadges = Array.from(document.querySelectorAll('.filter-badge.active')).map(b => b.dataset.state);
        const isTodos = activeBadges.includes('todos');
        
        const searchTerm = (document.getElementById('commsSmartSearch')?.value || '').toLowerCase().trim();

        document.querySelectorAll('.comms-item').forEach(item => {
            const estado = item.dataset.estado;
            const comuData = Comunicaciones.conversaciones.find(c => c.id == item.dataset.id);
            
            // Text Match
            let matchText = true;
            if (searchTerm && comuData) {
                const asun = (comuData.asunto || '').toLowerCase();
                const msg = (comuData.mensajes?.[0]?.texto || '').toLowerCase();
                
                let dest = "";
                if (comuData.destinatario) dest = `${comuData.destinatario.nombre} ${comuData.destinatario.apellido}`.toLowerCase();
                else if (comuData.destinatario_docente) dest = `${comuData.destinatario_docente.nombre} ${comuData.destinatario_docente.apellido}`.toLowerCase();
                else dest = "anuncio grupal";
                
                matchText = asun.includes(searchTerm) || msg.includes(searchTerm) || dest.includes(searchTerm);
            }

            // State Match
            const matchState = isTodos || activeBadges.includes(estado);
            
            if (matchState && matchText) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    },

    loadConversaciones: async (tipo = 'ticket') => {
        const listContainer = document.getElementById('conversacionesList');
        const filtersContainer = document.getElementById('commsFilters');
        if(filtersContainer) filtersContainer.style.display = tipo === 'logs' ? 'none' : 'flex';

        try {
            const response = await fetch(`/api/comunicaciones?tipo=${tipo}`, {
                headers: { 'Authorization': `Bearer ${Auth.getToken()}` }
            });
            const data = await response.json();
            Comunicaciones.conversaciones = data;

            if (data.length === 0) {
                listContainer.innerHTML = `<p class="empty-msg">No hay ${tipo}s todavía</p>`;
                return;
            }

            listContainer.innerHTML = data.map(c => {
                const dateObj = new Date(c.updated_at);
                const fechaStr = dateObj.toLocaleDateString();
                const horaStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                
                let destinatarioStr = "N/A";
                if (c.destinatario) destinatarioStr = `${c.destinatario.nombre || ''} ${c.destinatario.apellido || ''} (${c.destinatario.rol})`;
                else if (c.destinatario_docente) destinatarioStr = `${c.destinatario_docente.nombre} ${c.destinatario_docente.apellido} (Docente)`;
                else destinatarioStr = "Anuncio Grupal";

                return `
                <div class="comms-item ${Comunicaciones.conversacionSeleccionada?.id === c.id ? 'active' : ''}" data-id="${c.id}" data-estado="${c.estado}">
                    <div class="comms-item-header">
                        <span class="badge-${c.estado}">${c.estado}</span>
                        <span class="time">${fechaStr} ${horaStr}</span>
                    </div>
                    <p class="subject fw-bold" style="margin-bottom:0px">${c.asunto}</p>
                    <p class="small text-info mb-1" style="font-size:0.7em"><i class="fas fa-user"></i> Destinatario: ${destinatarioStr}</p>
                    <p class="preview">${c.mensajes[0]?.texto.substring(0, 40) || ''}...</p>
                </div>
                `;
            }).join('');

            // Click events
            listContainer.querySelectorAll('.comms-item').forEach(item => {
                item.addEventListener('click', () => Comunicaciones.selectConversacion(parseInt(item.dataset.id)));
            });
            
            Comunicaciones.aplicarFiltrosLocal();

        } catch (error) {
            console.error('Error loading communications:', error);
            listContainer.innerHTML = '<p class="error-msg">Error al cargar</p>';
        }
    },

    loadLogs: async () => {
        const listContainer = document.getElementById('conversacionesList');
        const chatArea = document.getElementById('commsChat');
        listContainer.innerHTML = '<div class="loader-pills"></div>';
        try {
            const res = await fetch('/api/comunicaciones/logs', { headers: { 'Authorization': `Bearer ${Auth.getToken()}` } });
            const data = await res.json();
            
            listContainer.innerHTML = `<p class="empty-msg text-info p-2" style="font-size:0.8rem">Seleccione un log para ver sus detalles</p>`;
            chatArea.innerHTML = `
                <div class="p-3" style="color:white; overflow-y:auto; height:100%;">
                    <h3><i class="fas fa-clipboard-list text-info"></i> Auditoría de Envíos</h3 >
                    <table class="table table-dark table-hover mt-3" style="font-size:0.85rem">
                        <thead>
                            <tr>
                                <th>Fecha</th><th>Asunto</th><th>Email SMTP</th><th>WhatsApp</th>
                            </tr>
                        </thead>
                        <tbody id="logsTbody">
                            ${data.length === 0 ? '<tr><td colspan="4" class="text-center text-muted">No hay registros</td></tr>' : ''}
                        </tbody>
                    </table>
                </div>
            `;
            if (data.length > 0) {
                const tbody = document.getElementById('logsTbody');
                tbody.innerHTML = data.map(l => {
                    const st = l.estado_notificacion || {};
                    const mailBadge = st.email === 'enviado' ? 'badge-success' : (st.email === 'fallo' ? 'badge-danger' : 'badge-secondary');
                    const waBadge = st.whatsapp === 'enviado' ? 'badge-success' : (st.whatsapp === 'fallo' ? 'badge-danger' : 'badge-secondary');
                    return `
                        <tr>
                            <td>${new Date(l.created_at).toLocaleString()}</td>
                            <td title="${st.razon || '-'}">${l.asunto}</td>
                            <td><span class="badge ${mailBadge}">${st.email || 'N/A'}</span></td>
                            <td><span class="badge ${waBadge}">${st.whatsapp || 'N/A'}</span></td>
                        </tr>
                    `;
                }).join('');
            }
        } catch (e) {
            listContainer.innerHTML = '<p class="text-danger">Error cargando logs.</p>';
        }
    },

    ejecutarPurga: async () => {
        const dateInput = document.getElementById('fechaPurga').value;
        if (!dateInput) return alert("Seleccione una fecha");
        const btn = document.getElementById('btnConfirmPurga');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Purgando...';
        
        try {
            const res = await fetch('/api/comunicaciones/purge', {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${Auth.getToken()}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ fecha_tope: dateInput })
            });
            const data = await res.json();
            
            if (res.ok) {
                if (data.backup && data.backup.length > 0) {
                    // Descargar Backup
                    const blob = new Blob([JSON.stringify(data.backup, null, 2)], { type: 'application/json' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.style.display = 'none';
                    a.href = url;
                    a.download = `SGH_Comms_Backup_${dateInput}.json`;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                }
                alert(data.message);
                Comunicaciones.loadConversaciones();
                document.getElementById('modalPurga').style.display = 'none';
            } else {
                alert("Error al purgar: " + data.detail);
            }
        } catch (e) {
            alert("Excepción: " + e.message);
        } finally {
            btn.disabled = false;
            btn.innerHTML = 'Purgar y Descargar Backup';
        }
    },

    selectConversacion: async (id) => {
        const chatArea = document.getElementById('commsChat');
        const comu = Comunicaciones.conversaciones.find(c => c.id === id);
        Comunicaciones.conversacionSeleccionada = comu;

        // Actualizar visual de la lista
        document.querySelectorAll('.comms-item').forEach(i => i.classList.remove('active'));
        document.querySelector(`.comms-item[data-id="${id}"]`)?.classList.add('active');

        renderChat(comu);

        async function renderChat(c) {
            const user = Auth.getUser();
            chatArea.innerHTML = `
                <div class="chat-header">
                    <div class="chat-info">
                        <h3>${c.asunto}</h3>
                        <span class="status-tag tag-${c.estado}">${c.estado}</span>
                    </div>
                    <div class="chat-actions">
                        ${user.rol !== 'estudiante' ? `<button id="btnToggleEstado" class="btn-sec">${c.estado === 'abierto' ? 'Atender' : 'Cerrar'}</button>` : ''}
                        <button id="btnWhatsApp" class="btn-wa"><i class="fab fa-whatsapp"></i></button>
                    </div>
                </div>
                <div id="messagesList" class="messages-list">
                    ${c.mensajes.map(m => `
                        <div class="msg-bubble ${m.usuario_id === user.id ? 'msg-sent' : 'msg-received'}">
                            <div class="msg-meta">${m.usuario?.username || 'Sistema'} • ${new Date(m.created_at).toLocaleTimeString()}</div>
                            <div class="msg-content">${m.texto}</div>
                        </div>
                    `).join('')}
                </div>
                <div class="chat-footer">
                    <textarea id="replyText" placeholder="Escribe una respuesta..."></textarea>
                    <button id="btnSendReply" class="btn-send"><i class="fas fa-paper-plane"></i></button>
                </div>
            `;

            // Auto scroll to bottom
            const list = document.getElementById('messagesList');
            list.scrollTop = list.scrollHeight;

            // Events
            document.getElementById('btnSendReply').onclick = () => Comunicaciones.sendReply();
            
            document.getElementById('btnWhatsApp').onclick = async () => {
                const userComu = c.remitente;
                let phone = "";
                
                // Intentar buscar el teléfono del usuario (remitente)
                if (userComu.rol === "estudiante" || userComu.rol === "docente") {
                    const endpoint = userComu.rol === "estudiante" ? `/api/estudiantes?usuario_id=${userComu.id}` : `/api/docentes?usuario_id=${userComu.id}`;
                    try {
                        const res = await fetch(endpoint, { headers: { 'Authorization': `Bearer ${Auth.getToken()}` } });
                        const persons = await res.json();
                        if (persons && persons.length > 0) phone = persons[0].telefono;
                    } catch(e) { console.error("Error fetching phone", e); }
                }

                if (!phone) {
                    phone = prompt("No se encontró el teléfono. Ingrese el número (ej: 549...):", "");
                }

                if (phone) {
                    const cleanPhone = phone.replace(/\D/g, '');
                    const text = `*Consulta Académica SGH - Ticket #${c.id}*\nAsunto: ${c.asunto}\n\nHola ${userComu.username}, te contactamos desde Secretaría...`;
                    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
                    
                    // Log de seguimiento en el chat
                    await Comunicaciones.logAction(c.id, `📱 Contacto iniciado por WhatsApp al número ${phone}`);
                }
            };

            if (document.getElementById('btnToggleEstado')) {
                document.getElementById('btnToggleEstado').onclick = () => Comunicaciones.toggleEstado(c);
            }
        }
    },

    sendReply: async () => {
        const text = document.getElementById('replyText').value;
        if (!text.trim()) return;

        const id = Comunicaciones.conversacionSeleccionada.id;
        try {
            const response = await fetch(`/api/comunicaciones/${id}/mensajes`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${Auth.getToken()}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ texto: text })
            });

            if (response.ok) {
                // Recargar para ver el nuevo mensaje (simplificado)
                const fullResponse = await fetch(`/api/comunicaciones/${id}`, {
                    headers: { 'Authorization': `Bearer ${Auth.getToken()}` }
                });
                const updatedComu = await fullResponse.json();
                Comunicaciones.selectConversacion(id);
            }
        } catch (error) {
            console.error('Error pulse reply:', error);
        }
    },

    toggleEstado: async (c) => {
        let nuevoEstado = c.estado === 'abierto' ? 'en_proceso' : 'cerrado';
        if (c.estado === 'en_proceso') nuevoEstado = 'resuelto';
        if (c.estado === 'resuelto') nuevoEstado = 'cerrado';

        try {
            await fetch(`/api/comunicaciones/${c.id}/estado?estado=${nuevoEstado}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${Auth.getToken()}` }
            });
            await Comunicaciones.loadConversaciones(c.tipo);
            Comunicaciones.selectConversacion(c.id);
        } catch(e) {
            console.error(e);
        }
    },

    renderNewForm: () => {
        const chatArea = document.getElementById('commsChat');
        const user = Auth.getUser();
        
        chatArea.innerHTML = `
            <div class="new-comu-form glass p-4">
                <h3>Nueva Comunicación</h3>
                <div class="form-group mb-3">
                    <label>Tipo</label>
                    <select id="newTipo" class="form-control">
                        <option value="ticket">Ticket / Consulta Individual</option>
                        ${user.rol !== 'estudiante' ? '<option value="anuncio">Anuncio / Comunicado Masivo</option>' : ''}
                    </select>
                </div>
                
                <!-- Buscador de Destinatario -->
                <div id="recipientArea" class="form-group mb-3 ${user.rol === 'estudiante' ? 'd-none' : ''}">
                    <label id="recipientLabel">Para (Docente, Alumno o ATTP)</label>
                    <div class="search-box-container">
                        <input type="text" id="recipientSearch" class="form-control" placeholder="Búsqueda rápida por nombre...">
                        <div id="searchSuggestions" class="search-suggestions-container" style="display:none;"></div>
                        <input type="hidden" id="selectedDestinatarioId" value="">
                        <input type="hidden" id="selectedDestinatarioDocenteId" value="">
                        <div id="selectedBadge" class="selected-person-badge mt-2" style="display:none;"></div>
                    </div>
                </div>

                <div class="form-group mb-3">
                    <label>Asunto</label>
                    <input type="text" id="newAsunto" class="form-control" placeholder="Título corto">
                </div>
                <div class="form-group mb-3">
                    <label>Mensaje</label>
                    <textarea id="newMsg" class="form-control" rows="5" placeholder="Escribe aquí tu mensaje..."></textarea>
                </div>
                <!-- Filtros para Anuncio -->
                <div id="filterArea" style="display:none;" class="p-3 bg-dark-soft rounded mb-3 border-left-glow">
                    <p class="small text-muted font-weight-bold"><i class="fas fa-filter"></i> Segmentación del Anuncio:</p>
                    <div class="row g-2">
                        <div class="col-md-6">
                            <label class="small">Carrera / Depto</label>
                            <select id="filterUnidad" class="form-control form-control-sm"></select>
                        </div>
                        <div class="col-md-6">
                            <label class="small">Año</label>
                            <select id="filterAnio" class="form-control form-control-sm">
                                <option value="">Todos</option>
                                <option value="1">1ero</option><option value="2">2do</option><option value="3">3ero</option>
                                <option value="4">4to</option><option value="5">5to</option><option value="6">6to</option>
                            </select>
                        </div>
                        <div class="col-md-12 mt-2">
                            <label class="small">Materia (Opcional)</label>
                            <select id="filterMateria" class="form-control form-control-sm"></select>
                        </div>
                    </div>
                </div>
                    <button id="btnSaveNew" class="btn-primary-glow"> <i class="fas fa-paper-plane"></i> Enviar Mensaje</button>
                    <button id="btnCancel" class="btn-sec-glow">✕ Cancelar</button>
                </div>
            </div>
        `;

        document.getElementById('newTipo').onchange = (e) => {
            const isAnuncio = e.target.value === 'anuncio';
            document.getElementById('filterArea').style.display = isAnuncio ? 'block' : 'none';
            document.getElementById('recipientArea').style.display = user.rol === 'estudiante' ? 'none' : 'block';
            if (document.getElementById('recipientLabel')) {
                document.getElementById('recipientLabel').innerText = isAnuncio 
                    ? "Target Nominal Opcional (Seleccionar uno anulará el envío masivo)" 
                    : "Para (Docente, Alumno o ATTP)";
            }
        };

        // Lógica de Búsqueda de Destinatarios
        const searchInput = document.getElementById('recipientSearch');
        const suggestionsBox = document.getElementById('searchSuggestions');
        let searchTimeout;

        if (searchInput) {
            searchInput.oninput = (e) => {
                clearTimeout(searchTimeout);
                const q = e.target.value;
                if (q.length < 2) { suggestionsBox.style.display = 'none'; return; }

                searchTimeout = setTimeout(async () => {
                    const instId = document.getElementById('inst-selector')?.value;
                    const res = await fetch(`/api/usuarios/buscar?q=${encodeURIComponent(q)}&institucion_id=${instId || ''}`, {
                        headers: { 'Authorization': `Bearer ${Auth.getToken()}` }
                    });
                    const users = await res.json();
                    
                    if (users.length > 0) {
                        suggestionsBox.innerHTML = users.map(u => {
                            const sinCuenta = !u.id && u.docente_id;
                            const badge = sinCuenta
                                ? `<span style="font-size:0.7rem;background:rgba(245,158,11,0.2);color:#f59e0b;padding:1px 5px;border-radius:4px;">sin cuenta</span>`
                                : `<span class="badge-${u.rol} small">${u.rol}</span>`;
                            return `
                            <div class="suggestion-item p-2 border-bottom"
                                 data-id="${u.id || ''}"
                                 data-docente-id="${u.docente_id || ''}"
                                 data-name="${u.apellido || ''}, ${u.nombre || ''}"
                                 data-rol="${u.rol}">
                                <strong>${u.apellido || ''}, ${u.nombre || ''}</strong> ${badge}<br>
                                <small class="text-muted">${u.info_extra || ''}</small>
                            </div>`;
                        }).join('');
                        suggestionsBox.style.display = 'block';

                        suggestionsBox.querySelectorAll('.suggestion-item').forEach(item => {
                            item.onclick = () => {
                                // Guardar ambos ids: usuario_id y docente_id
                                document.getElementById('selectedDestinatarioId').value = item.dataset.id || '';
                                document.getElementById('selectedDestinatarioDocenteId').value = item.dataset.docenteId || '';
                                const badge = document.getElementById('selectedBadge');
                                const sinCuenta = !item.dataset.id && item.dataset.docenteId;
                                badge.innerHTML = `<i class="fas fa-user-check"></i> Destinatario: <strong>${item.dataset.name}</strong> (${item.dataset.rol})${sinCuenta ? ' <span style="color:#f59e0b;font-size:0.75rem;">\u26a0\ufe0f sin cuenta de usuario</span>' : ''} <i class="fas fa-times-circle close-badge"></i>`;
                                badge.style.display = 'block';
                                searchInput.value = '';
                                suggestionsBox.style.display = 'none';

                                badge.querySelector('.close-badge').onclick = () => {
                                    document.getElementById('selectedDestinatarioId').value = '';
                                    document.getElementById('selectedDestinatarioDocenteId').value = '';
                                    badge.style.display = 'none';
                                };
                            };
                        });
                    } else {
                        suggestionsBox.style.display = 'none';
                    }
                }, 400);
            };
        }

        document.getElementById('btnCancel').onclick = () => {
            chatArea.innerHTML = '<div class="chat-placeholder"><i class="fas fa-comments"></i><p>Selecciona una conversación para leer</p></div>';
        };

            document.getElementById('btnSaveNew').onclick = async () => {
                 const tipo = document.getElementById('newTipo').value;
                 const asunto = document.getElementById('newAsunto').value;
                 const msg = document.getElementById('newMsg').value;
                 
                 if(!asunto || !msg) {
                     alert('Por favor, completa todos los campos.');
                     return;
                 }

                const uIdRaw = document.getElementById('filterUnidad')?.value;
                const [uType, uId] = uIdRaw && uIdRaw.includes(':') ? uIdRaw.split(':') : [null, null];

                const usuarioId = document.getElementById('selectedDestinatarioId').value || null;
                const docenteId = document.getElementById('selectedDestinatarioDocenteId').value || null;
                const hasNominal = usuarioId || docenteId;

                const data = {
                    tipo: tipo,
                    asunto: asunto,
                    mensaje_inicial: msg,
                    prioridad: 'normal',
                    destinatario_id: usuarioId ? parseInt(usuarioId) : null,
                    destinatario_docente_id: !usuarioId && docenteId ? parseInt(docenteId) : null,
                    filtro_audiencia: (tipo === 'anuncio' && !hasNominal) ? {
                        carrera_id: uType === 'carrera' ? uId : null,
                        departamento_id: uType === 'depto' ? uId : null,
                        anio: document.getElementById('filterAnio').value || null,
                        materia_id: document.getElementById('filterMateria').value || null
                    } : null
                };
                
                try {
                    const response = await fetch('/api/comunicaciones', {
                        method: 'POST',
                        headers: { 
                            'Authorization': `Bearer ${Auth.getToken()}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(data)
                    });
                    if(response.ok) {
                        const nuevaComu = await response.json();
                        let msgToast = '✅ Mensaje interno guardado.';
                        const estadoNotif = nuevaComu.estado_notificacion || {};
                        if(tipo === 'ticket') {
                            if(estadoNotif.email === 'enviado') msgToast = '✅ Mensaje interno y Email enviados.';
                            else if(estadoNotif.email === 'fallo') msgToast = `✅ Msj guardado. ❌ Email: ${estadoNotif.razon || 'Error'}`;
                            else msgToast = `✅ Msj guardado. ⚠️ No se envió email: ${estadoNotif.razon || 'Sin config'}`;
                        }
                        
                        Comunicaciones.showToast(msgToast, estadoNotif.email === 'fallo' ? 'warning' : 'success');
                        Comunicaciones.loadConversaciones(tipo);
                        chatArea.innerHTML = '<div class="chat-placeholder"><i class="fas fa-check-circle" style="color:var(--success)"></i><p>Mensaje originado. Selecciona una conversación.</p></div>';
                    } else {
                        const errData = await response.json().catch(() => ({}));
                        Comunicaciones.showToast('❌ ' + (errData.detail || 'Error al enviar'), 'error');
                    }
                } catch(e) { console.error(e); }
            };

            // Cargar selectores para el anuncio
            Comunicaciones.loadFilterData();
        },

    loadFilterData: async () => {
        const selUnidad = document.getElementById('filterUnidad');
        const selMateria = document.getElementById('filterMateria');
        if (!selUnidad) return;

        try {
            const instId = document.getElementById('inst-selector')?.value;
            // Usar el módulo de departamentos para obtener la lista unificada
            const response = await fetch(`/api/departamentos?institucion_id=${instId}`, {
                headers: { 'Authorization': `Bearer ${Auth.getToken()}` }
            });
            const deptos = await response.json();
            
            // También necesitaríamos carreras... para simplificar usaremos el mismo patrón que el Dashboard
            // Nota: Aquí asumo que existe un endpoint o método centralizado para obtener unidades unificadas
            selUnidad.innerHTML = '<option value="">Toda la Institución</option>';
            deptos.forEach(d => {
                selUnidad.innerHTML += `<option value="depto:${d.id}">🏛️ ${d.nombre}</option>`;
            });

            selUnidad.onchange = async () => {
                const uIdRaw = selUnidad.value;
                if (!uIdRaw) { selMateria.innerHTML = ''; return; }
                const [type, id] = uIdRaw.split(':');
                const param = type === 'depto' ? `departamento_id=${id}` : `carrera_id=${id}`;
                const mRes = await fetch(`/api/materias?${param}`, {
                    headers: { 'Authorization': `Bearer ${Auth.getToken()}` }
                });
                const mats = await mRes.json();
                selMateria.innerHTML = '<option value="">Todas las materias</option>' + 
                    mats.map(m => `<option value="${m.id}">${m.nombre}</option>`).join('');
            };

        } catch(e) { console.error(e); }
    },

    logAction: async (comuId, texto) => {
        try {
            await fetch(`/api/comunicaciones/${comuId}/mensajes`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${Auth.getToken()}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ texto: `[SISTEMA]: ${texto}` })
            });
            // Recargar vista si es la actual
            if (Comunicaciones.conversacionSeleccionada?.id === comuId) {
                Comunicaciones.selectConversacion(comuId);
            }
        } catch(e) { console.error(e); }
    },
    openConfigModal: async () => {
        // Fetch current configs
        let configs = [];
        try {
            const res = await fetch('/api/configuraciones', { headers: { 'Authorization': `Bearer ${Auth.getToken()}` } });
            if (res.ok) configs = await res.json();
        } catch (e) { console.error('Error config', e); }

        let html = `
            <div id="configSisModal" class="modal-overlay" style="display:flex;">
                <div class="modal-content glass" style="max-width:600px;">
                    <div class="modal-header border-bottom border-secondary pb-2 mb-3">
                        <h3 class="m-0"><i class="fas fa-cogs text-warning"></i> Configuraciones de Sistema (Email/WA)</h3>
                        <button class="btn-close" onclick="document.getElementById('configSisModal').remove()">×</button>
                    </div>
                    <div class="modal-body">
                        <p class="text-muted small">Carga el JSON con las credenciales correspondientes. El sistema detecta el <code>APP_ENV</code> activo y usará la configuración habilitada para ese entorno y servicio.
                        <i class="fas fa-info-circle text-info" title='Ejemplo de config SMTP: {"server":"smtp.gmail.com", "port":587, "user":"remitente@edu.com", "pass":"apppassword"}'></i>
                        </p>
                        
                        <form id="formConfigSis">
                            <div class="row g-2 mb-3">
                                <div class="col-md-6">
                                    <label class="small">Entorno (test/prod)</label>
                                    <input type="text" id="confEntorno" class="form-control" required placeholder="ej: prod">
                                </div>
                                <div class="col-md-6">
                                    <label class="small">Servicio</label>
                                    <select id="confServicio" class="form-control" required>
                                        <option value="email_smtp">Email SMTP</option>
                                        <option value="whatsapp_api">WhatsApp API</option>
                                    </select>
                                </div>
                            </div>
                            <!-- Email Destination explicitly for testing -->
                            <div class="form-group mb-3 text-start">
                                <label class="small text-info"><i class="fas fa-vial"></i> Correo destino para hacer la Prueba:</label>
                                <input type="email" id="confEmailPrueba" class="form-control form-control-sm" placeholder="Opcional: tu_correo@ejemplo.com">
                            </div>
                            <div class="form-group mb-3">
                                <label class="small">Configuración (Formato JSON) <i class="fas fa-question-circle" title='Use comillas dobles en las claves.'></i></label>
                                <textarea id="confJson" class="form-control" rows="5" style="font-family:monospace;" required></textarea>
                            </div>
                            <div class="d-flex gap-2">
                                <button type="button" id="btnTestConfig" class="btn-sec-glow btn-sm flex-grow-1"><i class="fas fa-paper-plane"></i> Enviar Prueba</button>
                                <button type="submit" class="btn-primary-glow btn-sm flex-grow-1"><i class="fas fa-save"></i> Guardar Configuración</button>
                            </div>
                        </form>

                        <hr class="border-secondary mt-4 mb-3">
                        <h5 class="small text-warning">Configuraciones Guardadas</h5>
                        <ul class="list-group bg-transparent">
                            ${configs.map(c => `
                                <li class="list-group-item bg-dark-soft border-secondary d-flex justify-content-between align-items-start mb-2" style="border-radius:6px;">
                                    <div>
                                        <strong>[${c.entorno.toUpperCase()}] ${c.servicio}</strong> 
                                        <span class="badge ${c.activo ? 'badge-success' : 'badge-danger'} small">${c.activo ? 'Activa' : 'Inactiva'}</span>
                                        <pre class="m-0 mt-1 text-muted" style="font-size:0.7rem; background:rgba(0,0,0,0.3); padding:5px; border-radius:4px;">${JSON.stringify(c.config)}</pre>
                                    </div>
                                    <button class="btn-delete-mini ms-2" onclick="window.deleteConfigSis(${c.id})"><i class="fas fa-trash"></i></button>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);

        window.deleteConfigSis = async (id) => {
            if(!confirm('¿Eliminar configuración?')) return;
            try {
                await fetch(`/api/configuraciones/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${Auth.getToken()}` }
                });
                document.getElementById('configSisModal').remove();
                Comunicaciones.openConfigModal();
            }catch(e){}
        };

        const templates = {
            email_smtp: '{\n  "server": "smtp.gmail.com",\n  "port": 587,\n  "user": "tu_correo@gmail.com",\n  "pass": "tu_app_password",\n  "from_email": "tu_correo@gmail.com"\n}',
            whatsapp_api: '{\n  "api_url": "https://api.tuproveedor.com/send",\n  "token": "tu_token_aqui",\n  "phone_id": "tu_phone_id_aqui"\n}'
        };

        const cmbServicio = document.getElementById('confServicio');
        const txtJson = document.getElementById('confJson');
        
        // Auto cargar template al cambiar
        cmbServicio.onchange = () => {
            if(!txtJson.value || txtJson.value === templates.email_smtp || txtJson.value === templates.whatsapp_api) {
                txtJson.value = templates[cmbServicio.value];
            }
        };
        // Inicializar value
        if(!txtJson.value) txtJson.value = templates.email_smtp;

        // Botoón de Test
        document.getElementById('btnTestConfig').onclick = async () => {
            try {
                const j = JSON.parse(txtJson.value);
                const btn = document.getElementById('btnTestConfig');
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Probando...';
                
                const destinoMail = document.getElementById('confEmailPrueba').value;

                const res = await fetch('/api/configuraciones/test', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${Auth.getToken()}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        servicio: cmbServicio.value, 
                        config: j,
                        destinatario_prueba: destinoMail || null
                    })
                });
                
                btn.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar Prueba';
                if(res.ok) {
                    Comunicaciones.showToast('✅ Prueba enviada exitosamente', 'success');
                } else {
                    const err = await res.json();
                    alert('Falló el envío de prueba:\\n' + (err.detail || 'Revise sus credenciales.'));
                }
            } catch(e) {
                alert('JSON inválido o error de red: ' + e.message);
            }
        };

        document.getElementById('formConfigSis').onsubmit = async (e) => {
            e.preventDefault();
            let jsonParsed = {};
            try {
                jsonParsed = JSON.parse(document.getElementById('confJson').value);
            } catch(error) {
                alert('El formato JSON es inválido. Por favor, corrígelo e intenta de nuevo.');
                return;
            }

            const data = {
                entorno: document.getElementById('confEntorno').value.toLowerCase(),
                servicio: document.getElementById('confServicio').value,
                config: jsonParsed,
                activo: true
            };

            try {
                const res = await fetch('/api/configuraciones', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${Auth.getToken()}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                if(res.ok) {
                    Comunicaciones.showToast('Configuración guardada', 'success');
                    document.getElementById('configSisModal').remove();
                    Comunicaciones.openConfigModal();
                } else {
                    alert('Error al guardar.');
                }
            } catch(error) {}
        };
    },

    showToast: (message, type = 'success') => {
        // Eliminar toast previo si existe
        document.getElementById('sgh-toast')?.remove();

        const toast = document.createElement('div');
        toast.id = 'sgh-toast';
        toast.style.cssText = `
            position: fixed;
            bottom: 2rem;
            right: 2rem;
            z-index: 9999;
            background: ${type === 'success' ? 'rgba(16,185,129,0.95)' : 'rgba(239,68,68,0.95)'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 0.75rem;
            font-weight: 600;
            font-size: 0.9rem;
            box-shadow: 0 8px 25px rgba(0,0,0,0.4);
            backdrop-filter: blur(10px);
            display: flex;
            align-items: center;
            gap: 0.5rem;
            animation: toastSlideIn 0.3s ease;
            max-width: 380px;
        `;
        toast.innerHTML = message;
        document.body.appendChild(toast);

        // Auto-dismiss después de 3.5 segundos
        setTimeout(() => {
            toast.style.animation = 'toastSlideOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    }
};
