export const Calendario = {
    currentView: 'annual', // 'annual', 'monthly', 'docente'
    selectedMonthIdx: 0,
    calendarioId: null,
    currentYear: new Date().getFullYear(),
    includePrivate: true, // Para el renderizado local (aunque el user pidió para PDF, conviene tenerlo aquí)
    db: {
        categories: [],
        events: {}, // key: YYYY-MM-DD, value: array de eventos
        notes: [],
        workload: {} // key: dia_semana (lunes, etc), value: count
    },
    selStart: null,
    selEnd: null,

    async init() {
        // Cargar calendarios y seleccionar el primero
        try {
            const cals = await fetch(`/api/calendarios`).then(r => r.json());
            if (cals && cals.length > 0) {
                this.calendarioId = cals[0].id;
                await this.loadData();
            }
        } catch (error) {
            console.error("Error inicializando calendario:", error);
        }
    },

    async loadData() {
        if (!this.calendarioId) return;
        try {
            const [cats, evts, notes, asigs] = await Promise.all([
                fetch(`/api/calendario_categorias?calendario_id=${this.calendarioId}`).then(r => r.json()),
                fetch(`/api/calendario_eventos?calendario_id=${this.calendarioId}`).then(r => r.json()),
                fetch(`/api/notas_adhesivas?calendario_id=${this.calendarioId}`).then(r => r.json()),
                fetch(`/api/asignaciones`).then(r => r.json())
            ]);

            this.db.categories = cats;
            this.db.notes = notes;
            
            // Procesar Workload (conteo de clases por día de la semana)
            this.db.workload = {};
            const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
            asigs.forEach(as => {
                const dia = as.dia_semana || 'lunes';
                this.db.workload[dia] = (this.db.workload[dia] || 0) + 1;
            });

            this.db.events = {};
            evts.forEach(e => {
                if (!this.db.events[e.fecha]) this.db.events[e.fecha] = [];
                this.db.events[e.fecha].push(e);
            });
        } catch (error) {
            console.error("Error cargando datos del calendario:", error);
        }
    },

    async render() {
        const container = document.getElementById('view-container');
        if (!container) return;

        await this.loadData();

        container.innerHTML = `
            <div id="calendario-container">
                <div id="cal-tooltip" class="cal-tooltip"></div>
                <div class="calendario-header glass-card">
                <div class="cal-title-box">
                    <h1 class="premium-title">${this.currentView === 'annual' ? 'Planificación Anual' : 'Mes: ' + this.getMonthName(this.selectedMonthIdx)}</h1>
                    <span class="cal-year-badge">${this.currentYear}</span>
                </div>
                <div class="cal-actions">
                    <div class="view-selector-segmented">
                        <label class="segmented-item">
                            <input type="radio" name="cal-view" value="annual" ${this.currentView === 'annual' ? 'checked' : ''} onchange="Calendario.switchView('annual')">
                            <span>Anual</span>
                        </label>
                        <label class="segmented-item">
                            <input type="radio" name="cal-view" value="monthly" ${this.currentView === 'monthly' ? 'checked' : ''} onchange="Calendario.switchView('monthly')">
                            <span>Mensual</span>
                        </label>
                        <label class="segmented-item">
                            <input type="radio" name="cal-view" value="docente" ${this.currentView === 'docente' ? 'checked' : ''} onchange="Calendario.switchView('docente')">
                            <span>Modo Docente</span>
                        </label>
                    </div>
                    
                    <button class="btn-primary btn-export" onclick="Calendario.showExportOptions()"><i class="fas fa-file-pdf"></i> Exportar PDF</button>
                    <div class="year-selector">
                        <button onclick="Calendario.changeYear(-1)">-</button>
                        <span>${this.currentYear}</span>
                        <button onclick="Calendario.changeYear(1)">+</button>
                    </div>
                </div>
            </div>

            <div class="calendario-main-layout">
                <div class="cal-grid-container ${this.currentView === 'monthly' ? 'monthly-mode' : ''} ${this.currentView === 'docente' ? 'docente-mode' : ''}" id="cal-grid-root">
                    ${this.renderGrid()}
                </div>
                
                <div class="cal-sidebar">
                    <div class="glass-card categories-box">
                        <div class="cork-header">
                            <h3>Referencias</h3>
                            <button class="btn-icon-add" onclick="Calendario.showCategoryForm()">+</button>
                        </div>
                        <div class="cat-list">
                            ${this.db.categories.map(c => `
                                <div class="cat-item">
                                    <span class="cat-dot" style="background: ${c.color}"></span>
                                    <span class="cat-name">${c.nombre || c.name}</span>
                                    <div class="cat-actions">
                                        <button class="btn-icon-small" onclick="Calendario.showCategoryForm(${JSON.stringify(c).replace(/"/g, '&quot;')})">✎</button>
                                        <button class="btn-icon-small btn-del" onclick="Calendario.deleteCategory(${c.id})">×</button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                        <div class="workload-legend">
                            <span class="workload-badge"># HS</span>
                            <small>Horas Académicas (módulos de 40 min)</small>
                        </div>
                    </div>
                    
                    <div class="glass-card cork-board">
                        <div class="cork-header">
                            <h3><i class="fas fa-thumbtack"></i> Zona Pinche</h3>
                            <button class="btn-icon-add" onclick="Calendario.promptAddNote()">+</button>
                        </div>
                        <div class="sticky-notes-container">
                            ${this.db.notes.map(n => `
                                <div class="sticky-note" style="background: ${n.color || '#feff9c'}">
                                    <button class="note-del" onclick="Calendario.removeNote(${n.id})">×</button>
                                    <div class="note-content">${this.linkify(n.texto)}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>

            <div id="cal-modal-overlay" class="modal-overlay" onclick="Calendario.closeModal()">
                <div class="cal-modal glass-card" onclick="event.stopPropagation()">
                    <h3>Asignar Categoría</h3>
                    <div class="modal-cat-grid">
                        ${this.db.categories.map(c => `
                            <button class="modal-cat-btn" onclick="Calendario.applyEvent(${c.id})" style="border-left: 5px solid ${c.color}">
                                ${c.nombre}
                            </button>
                        `).join('')}
                    </div>
                    <div class="modal-desc-box">
                        <label>Descripción (opcional):</label>
                        <textarea id="cal-event-desc" placeholder="Ej: Feriado Nacional, Exámenes finales..."></textarea>
                    </div>
                    <div class="modal-desc-box checkbox-row">
                        <input type="checkbox" id="cal-event-private">
                        <label for="cal-event-private">Evento Privado (Solo personal)</label>
                    </div>
                    <div class="modal-actions">
                         <button class="btn-danger" id="btn-clear-range" onclick="Calendario.clearRange()">Limpiar Rango</button>
                         <button class="btn-secondary" onclick="Calendario.closeModal()">Cancelar</button>
                    </div>
                </div>
            </div>
        `;

        this.initTooltipEvents();
    },

    initTooltipEvents() {
        const container = document.getElementById('calendario-container');
        if (!container) return;

        container.addEventListener('mouseover', (e) => {
            const target = e.target.closest('.dtxt, .ddot');
            if (target) {
                const tooltip = document.getElementById('cal-tooltip');
                if (tooltip) {
                    const desc = target.getAttribute('title');
                    const cat = target.dataset.catName || 'Evento';
                    tooltip.innerHTML = `<h4>${cat}</h4><div>${desc}</div>`;
                    tooltip.classList.add('active');
                }
            }
        });

        container.addEventListener('mousemove', (e) => {
            const tooltip = document.getElementById('cal-tooltip');
            if (tooltip && tooltip.classList.contains('active')) {
                const x = e.clientX + 15;
                const y = e.clientY + 15;
                tooltip.style.left = x + 'px';
                tooltip.style.top = y + 'px';
            }
        });

        container.addEventListener('mouseout', (e) => {
            const target = e.target.closest('.dtxt, .ddot');
            if (target) {
                const tooltip = document.getElementById('cal-tooltip');
                if (tooltip) tooltip.classList.remove('active');
            }
        });
    },

    renderGrid() {
        const MN = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
        const DLABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'];
        let html = '';

        if (this.currentView === 'annual') {
                MN.forEach((name, idx) => {
                    html += `
                        <div class="mcard glass-card">
                            <div class="mname">${name}</div>
                            <div class="dcont-annual">
                                ${DLABELS.map(d => `<div class="dlbl">${d[0]}</div>`).join('')}
                                ${this.buildMonthGrid(this.currentYear, idx, false)}
                            </div>
                        </div>
                    `;
                });
        } else if (this.currentView === 'docente') {
            html = this.renderModoDocente();
        } else {
            html = `
                <div class="mcard glass-card single-month">
                    <div class="dcont-monthly">
                        <div class="month-header-grid">
                             ${DLABELS.map(d => `<div class="dlbl">${d}</div>`).join('')}
                        </div>
                        <div class="month-days-grid">
                            ${this.buildMonthGrid(this.currentYear, this.selectedMonthIdx, true)}
                        </div>
                    </div>
                </div>
            `;
        }
        return html;
    },

    buildMonthGrid(year, mi, interactive) {
        let html = '';
        const tot = new Date(year, mi + 1, 0).getDate();
        
        // Calcular primer día (buscamos el primer Lun-Vie)
        let firstCol = 0;
        const firstDayOfMonth = new Date(year, mi, 1).getDay(); // 0=Dom, 1=Lun...
        if (firstDayOfMonth >= 1 && firstDayOfMonth <= 5) {
            firstCol = firstDayOfMonth - 1;
        } else if (firstDayOfMonth === 0) { // Dom -> Lun es 0 espacios? No, Lun es col 0. 
            firstCol = 0; // Si el 1 es Dom, el Lunes es el 2. 
        } else if (firstDayOfMonth === 6) { // Sab -> Lun es col 0.
             firstCol = 0;
        }

        // Ajuste real: ¿Cuantos huecos antes del primer lunes-viernes del mes?
        // En el proyecto original:
        /*
        let firstCol = 0;
        for (let d = 1; d <= 7; d++) {
            const wd = new Date(year, mi, d).getDay();
            if (wd >= 1 && wd <= 5) { firstCol = wd - 1; break; }
        }
        */
        // Seguiremos esa lógica:
        let fCol = 0;
        for (let d = 1; d <= 7; d++) {
            const wd = new Date(year, mi, d).getDay();
            if (wd >= 1 && wd <= 5) { fCol = wd - 1; break; }
        }

        for (let i = 0; i < fCol; i++) {
            html += `<div class="dcell empty"></div>`;
        }

        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

        for (let d = 1; d <= tot; d++) {
            const date = new Date(year, mi, d);
            const dow = date.getDay();
            if (dow < 1 || dow > 5) continue; // Saliendo Sab/Dom

            const dateKey = `${year}-${String(mi+1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const isToday = dateKey === todayStr;
            const evts = this.db.events[dateKey] || [];
            
            let style = '';
            if (evts.length > 0) {
                const colors = evts.map(e => e.categoria.color);
                if (colors.length === 1) {
                    style = `background: ${colors[0]}44; border-left: 3px solid ${colors[0]};`;
                } else {
                    const pct = 100 / colors.length;
                    const stops = colors.map((c, i) => `${c}44 ${i * pct}%, ${c}44 ${(i + 1) * pct}%`).join(', ');
                    style = `background: linear-gradient(to bottom, ${stops}); border-left: 3px solid ${colors[0]};`;
                }
            }

            const cellId = `${year}-${mi}-${d}`;
            const isSelected = this.isInRange(cellId);
            
            // Carga horaria predictiva
            const diasNom = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
            const diaNombre = diasNom[dow].toLowerCase();
            const classCount = this.db.workload[diaNombre] || 0;
            const workloadBadge = interactive && classCount > 0 ? `<div class="workload-badge" title="Carga horaria: ${classCount} HS (módulos de 40 min)">${classCount} HS</div>` : '';

            html += `
                <div class="dcell ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}" 
                     style="${style}"
                     onclick="Calendario.handleCellClick(event, '${cellId}')">
                    <span class="dnum">${d}</span>
                    ${workloadBadge}
                    <div class="dstack">
                        ${evts.map(e => {
                            const isPrivate = e.es_privado;
                            const isHidden = isPrivate && !this.includePrivate;
                            if (isHidden) return '';

                            const catNameEncoded = e.categoria.nombre.replace(/'/g, "&apos;");
                            const privateClass = isPrivate ? 'is-private' : '';
                            
                            if (this.currentView === 'annual' || this.currentView === 'docente') {
                                return `<span class="ddot ${privateClass}" 
                                              style="background: ${e.categoria.color}" 
                                              title="${(isPrivate ? '[PRIVADO] ' : '') + (e.descripcion || e.categoria.nombre)}"
                                              data-cat-name="${catNameEncoded}"></span>`;
                            }
                            return `<span class="dtxt ${privateClass}" 
                                          title="${(isPrivate ? '[PRIVADO] ' : '') + (e.descripcion || e.categoria.nombre)}" 
                                          data-cat-name="${catNameEncoded}">${(isPrivate ? '🔒 ' : '') + (e.descripcion || e.categoria.nombre)}</span>`;
                        }).join('')}
                    </div>
                </div>
            `;
        }
        return html;
    },

    isInRange(id) {
        if (!this.selStart) return false;
        if (!this.selEnd) return this.selStart === id;

        const [y, m, d] = id.split('-').map(Number);
        const [ys, ms, ds] = this.selStart.split('-').map(Number);
        const [ye, me, de] = this.selEnd.split('-').map(Number);

        const current = new Date(y, m, d).getTime();
        const start = new Date(ys, ms, ds).getTime();
        const end = new Date(ye, me, de).getTime();

        const min = Math.min(start, end);
        const max = Math.max(start, end);

        return current >= min && current <= max;
    },

    handleCellClick(e, id) {
        // En vista anual el clic ahora inicia la selección de rango en lugar de saltar al mes
        if (e.shiftKey && this.selStart) {
            this.selEnd = id; // Changed from this.selStart = id; to this.selEnd = id;
            this.render();
        } else if (!this.selStart) { // Changed from !this.selEnd
            this.selStart = id;
            this.render();
        } else if (!this.selEnd) {
            this.selEnd = id;
            this.openModal(e);
        } else {
            this.selStart = id;
            this.selEnd = null;
            this.render();
        }
    },

    openModal(e) {
        const modal = document.getElementById('cal-modal-overlay');
        modal.classList.add('active');
        // Posicionar cerca del click si se quisiera, pero centrado está bien para SPA
    },

    closeModal() {
        this.selStart = null;
        this.selEnd = null;
        document.getElementById('cal-modal-overlay').classList.remove('active');
        this.render();
    },

    async applyEvent(catId) {
        const desc = document.getElementById('cal-event-desc').value;
        const isPrivate = document.getElementById('cal-event-private').checked;
        const dates = this.getDateRange(this.selStart, this.selEnd);
        
        try {
            const promises = dates.map(fecha => {
                return fetch(`/api/calendario_eventos`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        calendario_id: this.calendarioId,
                        fecha: fecha,
                        categoria_id: catId,
                        descripcion: desc,
                        es_privado: isPrivate
                    })
                });
            });
            await Promise.all(promises);
            this.closeModal();
        } catch (error) {
            console.error("Error aplicando eventos:", error);
        }
    },

    async clearRange() {
        const dates = this.getDateRange(this.selStart, this.selEnd);
        try {
            // Recolectar IDs de eventos en esas fechas
            let eventIds = [];
            dates.forEach(fecha => {
                const evs = this.db.events[fecha] || [];
                evs.forEach(e => eventIds.push(e.id));
            });

            const promises = eventIds.map(id => {
                return fetch(`/api/calendario_eventos/${id}`, { method: 'DELETE' });
            });
            await Promise.all(promises);
            this.closeModal();
        } catch (error) {
            console.error("Error limpiando rango:", error);
        }
    },

    getDateRange(startId, endId) {
        const parse = id => {
            const [y, m, d] = id.split('-').map(Number);
            return new Date(y, m, d);
        };
        const d1 = parse(startId);
        const d2 = parse(endId || startId);
        const start = d1 < d2 ? d1 : d2;
        const end = d1 < d2 ? d2 : d1;

        const dates = [];
        let curr = new Date(start);
        while (curr <= end) {
            const dow = curr.getDay();
            if (dow >= 1 && dow <= 5) {
                dates.push(`${curr.getFullYear()}-${String(curr.getMonth() + 1).padStart(2, '0')}-${String(curr.getDate()).padStart(2, '0')}`);
            }
            curr.setDate(curr.getDate() + 1);
        }
        return dates;
    },

    getMonthName(idx) {
        return ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"][idx];
    },

    switchView(view) {
        this.currentView = view;
        this.render();
    },

    switchToMonthly(idx) {
        this.currentView = 'monthly';
        this.selectedMonthIdx = idx;
        const radio = document.querySelector(`input[name="cal-view"][value="monthly"]`);
        if (radio) radio.checked = true;
        this.render();
    },

    switchToAnnual() {
        this.currentView = 'annual';
        const radio = document.querySelector(`input[name="cal-view"][value="annual"]`);
        if (radio) radio.checked = true;
        this.render();
    },

    changeYear(delta) {
        this.currentYear += delta;
        this.render();
    },

    renderModoDocente() {
        const MN = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
        const pages = [];
        
        for (let p = 0; p < 4; p++) {
            let pageHtml = `<div class="docente-page glass-card">`;
            for (let m = 0; m < 3; m++) {
                const monthIdx = (p * 3) + m;
                const monthName = MN[monthIdx];
                
                // Obtener eventos del mes para las referencias
                const monthEvents = [];
                const daysInMonth = new Date(this.currentYear, monthIdx + 1, 0).getDate();
                for (let d = 1; d <= daysInMonth; d++) {
                    const key = `${this.currentYear}-${String(monthIdx + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                    const evs = this.db.events[key] || [];
                    evs.forEach(e => {
                        if (!e.es_privado || this.includePrivate) {
                            monthEvents.push({ day: d, desc: e.descripcion || e.categoria.nombre });
                        }
                    });
                }

                // Generar renglones: tantos como ocupe el mes (aprox 6 semanas -> 6 renglones base o más)
                // Usaremos un número fijo de renglones para que quede prolijo, por ejemplo 8.
                const numLines = 8;
                let refsHtml = '';
                for (let i = 0; i < numLines; i++) {
                    const evt = monthEvents[i];
                    refsHtml += `
                        <div class="ref-line">
                            ${evt ? `<span class="ref-date">${evt.day}:</span> ${evt.desc}` : ''}
                        </div>
                    `;
                }

                pageHtml += `
                    <div class="docente-row">
                        <div class="docente-month-col">
                            <div class="mname">${monthName}</div>
                            <div class="dcont-annual">
                                ${this.buildMonthGrid(this.currentYear, monthIdx, false)}
                            </div>
                        </div>
                        <div class="docente-refs-col">
                            ${refsHtml}
                        </div>
                    </div>
                `;
            }
            pageHtml += `</div>`;
            pages.push(pageHtml);
        }
        return `
            <div id="docente-view-container">
                ${pages.join('<div class="page-break-docente" style="margin-top: 2rem;"></div>')}
            </div>
        `;
    },

    async promptAddNote() {
        const text = prompt("¿Qué quieres pinchar en el pizarrón?");
        if (!text) return;
        const colors = ['#feff9c', '#ff7eb9', '#7afcff', '#ccff00', '#ffccd5'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        
        await fetch(`/api/notas_adhesivas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                calendario_id: this.calendarioId,
                texto: text,
                color: randomColor
            })
        });
        this.render();
    },

    async removeNote(id) {
        if (!confirm("¿Deseas quitar esta nota?")) return;
        await fetch(`/api/notas_adhesivas/${id}`, { method: 'DELETE' });
        this.render();
    },

    showExportOptions() {
        const modal = document.getElementById('cal-modal-overlay');
        const modalContent = modal.querySelector('.cal-modal');
        
        const originalContent = modalContent.innerHTML;
        modalContent.innerHTML = `
            <h3>Opciones de Exportación</h3>
            <div class="modal-desc-box">
                <label>Incluir eventos:</label>
                <div style="display: flex; flex-direction: column; gap: 0.5rem; margin-top: 0.5rem;">
                    <label style="font-weight: normal; cursor: pointer;">
                        <input type="checkbox" id="export-public" checked> Institucionales (Públicos)
                    </label>
                    <label style="font-weight: normal; cursor: pointer;">
                        <input type="checkbox" id="export-private" checked> Personales (Privados)
                    </label>
                </div>
            </div>
            <div class="modal-actions">
                 <button class="btn-primary" onclick="Calendario.runExport()">Exportar PDF</button>
                 <button class="btn-secondary" onclick="Calendario.closeModal()">Cancelar</button>
            </div>
        `;
        
        modal.classList.add('active');
        
        const originalClose = this.closeModal.bind(this);
        this.closeModal = () => {
             modalContent.innerHTML = originalContent;
             this.closeModal = originalClose;
             originalClose();
        };
    },

    async runExport() {
        const incPublic = document.getElementById('export-public').checked;
        const incPrivate = document.getElementById('export-private').checked;
        
        if (!incPublic && !incPrivate) {
            alert("Selecciona al menos un tipo de evento para exportar.");
            return;
        }

        this.includePrivate = incPrivate;
        // La lógica de exportación necesita saber qué incluir.
        // Podríamos pasar estos filtros a exportPDF.
        this.closeModal();
        await this.exportPDF(incPublic, incPrivate);
    },

    async exportPDF(incPublic = true, incPrivate = true) {
        if (typeof html2canvas === 'undefined' || typeof jspdf === 'undefined') {
            alert("Las librerías de PDF no están cargadas.");
            return;
        }

        const btn = document.querySelector('.btn-export');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generando...';
        btn.disabled = true;

        const el = document.getElementById('calendario-container');
        const isAnnual = this.currentView === 'annual';
        const isDocente = this.currentView === 'docente';
        let captureTarget = isAnnual ? el : el.querySelector('.single-month');
        if (isDocente) captureTarget = document.getElementById('docente-view-container');
        
        el.classList.add('cal-pdf-mode');
        await new Promise(resolve => setTimeout(resolve, 400));

        try {
            const { jsPDF } = window.jspdf;
            const orientation = isAnnual ? 'p' : 'l';
            const pdf = new jsPDF({ orientation: orientation, unit: 'mm', format: 'a4' });
            
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const margin = 10; // 1cm margin
            const printableWidth = pageWidth - (margin * 2);
            const printableHeight = pageHeight - (margin * 2);

            // --- HOJA 1: RESUMEN VISUAL ---
            const canvas = await html2canvas(captureTarget, {
                scale: 2.5,
                useCORS: true,
                backgroundColor: '#ffffff',
                logging: false,
                onclone: (clonedDoc) => {
                    const container = clonedDoc.getElementById('calendario-container');
                    const sidebar = clonedDoc.querySelector('.cal-sidebar');
                    const yearSelector = clonedDoc.querySelector('.year-selector');
                    const exportBtn = clonedDoc.querySelector('.btn-export');
                    
                    // Ocultar elementos globales para evitar interferencias
                    if (sidebar) sidebar.style.display = 'none';
                    if (yearSelector) yearSelector.style.display = 'none';
                    if (exportBtn) exportBtn.style.display = 'none';

                    if (container) {
                        if (isDocente) {
                            // Ajustes para exportación de Modo Docente (múltiples páginas)
                            const docenteContainer = clonedDoc.getElementById('docente-view-container');
                            if (docenteContainer) {
                                docenteContainer.style.width = '210mm'; // A4 width
                                docenteContainer.style.background = 'white';
                                clonedDoc.querySelectorAll('.docente-page').forEach(page => {
                                    page.style.width = '210mm';
                                    page.style.height = '297mm';
                                    page.style.boxShadow = 'none';
                                    page.style.margin = '0';
                                    page.style.padding = '15mm';
                                    page.style.border = 'none';
                                });
                            }
                        } else if (isAnnual) {
                            // --- AJUSTES VISTA ANUAL (VERTICAL) ---
                            const mainLayout = clonedDoc.querySelector('.calendario-main-layout');
                            const grid = clonedDoc.getElementById('calendario-grid');
                            
                            if (mainLayout) {
                                mainLayout.style.display = 'block'; 
                                mainLayout.style.width = '950px';
                            }
                            
                            if (grid) {
                                grid.style.display = 'grid';
                                grid.style.gridTemplateColumns = 'repeat(3, 1fr)';
                                grid.style.gap = '10px';
                                grid.style.width = '950px';
                            }

                            clonedDoc.querySelectorAll('.mcard').forEach(mc => {
                                mc.style.padding = '10px';
                                mc.style.border = '1px solid #eee';
                            });
                            
                            container.style.width = '1000px';
                            container.style.height = 'auto';
                        } else {
                            // --- AJUSTES VISTA MENSUAL (APAISADA) ---
                            // COLAPSAR EL LAYOUT DE 2 COLUMNAS A 1
                            const mainLayout = clonedDoc.querySelector('.calendario-main-layout');
                            if (mainLayout) {
                                mainLayout.style.display = 'block'; // Elimina 'grid' y la columna de 320px
                                mainLayout.style.width = '100%';
                            }

                            const target = clonedDoc.querySelector('.single-month');
                            if (target) {
                                // Forzamos dimensiones que coincidan exactamente con el ratio A4 Landscape (~1.45)
                                // Si el ancho es 1500px, el alto ideal es ~1030px para llenar la hoja
                                target.style.width = '1500px'; 
                                target.style.height = '1030px'; 
                                target.style.maxWidth = 'none';
                                target.style.margin = '0';
                                target.style.padding = '30px';
                                target.style.display = 'flex';
                                target.style.flexDirection = 'column';
                                target.style.background = 'white';
                                
                                const dcont = target.querySelector('.dcont-monthly');
                                if (dcont) {
                                    dcont.style.width = '100%';
                                    dcont.style.flex = '1';
                                    dcont.style.display = 'flex';
                                    dcont.style.flexDirection = 'column';
                                    dcont.style.gap = '15px';
                                }

                                const headerGrid = target.querySelector('.month-header-grid');
                                const daysGrid = target.querySelector('.month-days-grid');
                                if (headerGrid) {
                                    headerGrid.style.width = '100%';
                                    headerGrid.style.display = 'grid';
                                    headerGrid.style.gridTemplateColumns = 'repeat(5, 1fr)';
                                }
                                if (daysGrid) {
                                    daysGrid.style.width = '100%';
                                    daysGrid.style.display = 'grid';
                                    daysGrid.style.gridTemplateColumns = 'repeat(5, 1fr)';
                                    // Forzamos a que las filas se estiren para cubrir el alto disponible
                                    daysGrid.style.gridAutoRows = '1fr'; 
                                    daysGrid.style.flex = '1';
                                }

                                // Estirar celdas individuales para asegurar llenado vertical
                                clonedDoc.querySelectorAll('.month-days-grid .dcell').forEach(dc => {
                                    dc.style.height = '100%';
                                    dc.style.minHeight = '0';
                                });
                            }
                            container.style.width = '1550px';
                            container.style.height = '1100px'; // Ajuste final para ratio A4
                        }
                        container.style.background = 'white';
                        container.style.boxShadow = 'none';
                        container.style.padding = '10px';
                    }
                }
            });

            if (!isDocente) {
                const imgData = canvas.toDataURL('image/jpeg', 0.95);
                const canvasRatio = canvas.width / canvas.height;
                
                let finalWidth = printableWidth;
                let finalHeight = printableWidth / canvasRatio;

                if (finalHeight > printableHeight) {
                    finalHeight = printableHeight;
                    finalWidth = printableHeight * canvasRatio;
                }

                const xOffset = margin + (printableWidth - finalWidth) / 2;
                const yOffset = margin + (printableHeight - finalHeight) / 2;

                pdf.addImage(imgData, 'JPEG', xOffset, yOffset, finalWidth, finalHeight);
            } else {
                // MODO DOCENTE: Múltiples páginas
                // Capturamos cada página por separado (o usamos el canvas grande y lo troceamos)
                // Es mejor capturar cada .docente-page individualmente para mejor calidad
                const pages = el.querySelectorAll('.docente-page');
                for (let i = 0; i < pages.length; i++) {
                    if (i > 0) pdf.addPage('p', 'a4');
                    
                    const pageCanvas = await html2canvas(pages[i], {
                        scale: 2.5,
                        useCORS: true,
                        backgroundColor: '#ffffff',
                        logging: false
                    });
                    
                    const imgData = pageCanvas.toDataURL('image/jpeg', 0.95);
                    pdf.addImage(imgData, 'JPEG', margin, margin, printableWidth, printableHeight);
                }
            }

            const rawEvents = [];
            const targetMonths = (isAnnual || isDocente) ? [...Array(12).keys()] : [this.selectedMonthIdx];
            
            targetMonths.forEach(m => {
                const days = new Date(this.currentYear, m + 1, 0).getDate();
                for (let d = 1; d <= days; d++) {
                    const key = `${this.currentYear}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                    if (this.db.events[key]) {
                        this.db.events[key].forEach(ev => {
                            const isEvPrivate = ev.es_privado;
                            if ((isEvPrivate && incPrivate) || (!isEvPrivate && incPublic)) {
                                rawEvents.push({
                                    date: new Date(this.currentYear, m, d),
                                    cat: ev.categoria.nombre,
                                    desc: ev.descripcion || '-'
                                });
                            }
                        });
                    }
                }
            });

            // Agrupar por (Categoría + Descripción) y colapsar fechas consecutivas
            const chronologicalEvents = [];
            const processed = new Map(); // Key: cat|desc -> lastRange

            rawEvents.forEach(curr => {
                const key = `${curr.cat}|${curr.desc}`;
                const last = processed.get(key);
                
                const isConsecutive = (d1, d2) => {
                    const next = new Date(d1);
                    next.setDate(next.getDate() + 1);
                    return next.toDateString() === d2.toDateString();
                };

                if (last && isConsecutive(last.endDate, curr.date)) {
                    last.endDate = curr.date;
                } else {
                    const newRange = { startDate: curr.date, endDate: curr.date, cat: curr.cat, desc: curr.desc };
                    chronologicalEvents.push(newRange);
                    processed.set(key, newRange);
                }
            });

            // Ordenar rangos de nuevo por fecha de inicio (importante ya que el push por cat desordena el flujo temporal)
            chronologicalEvents.sort((a, b) => a.startDate - b.startDate);

            // Mapear a formato de tabla
            const finalEventRows = chronologicalEvents.map(range => {
                let label = "";
                const s = range.startDate;
                const e = range.endDate;
                
                if (s.getTime() === e.getTime()) {
                    label = `${s.getDate()} ${this.getMonthName(s.getMonth())}`;
                } else if (s.getMonth() === e.getMonth()) {
                    label = `Del ${s.getDate()} al ${e.getDate()} ${this.getMonthName(s.getMonth())}`;
                } else {
                    label = `Del ${s.getDate()} ${this.getMonthName(s.getMonth())} al ${e.getDate()} ${this.getMonthName(e.getMonth())}`;
                }

                return { label, cat: range.cat, desc: range.desc };
            });

            if (finalEventRows.length > 0) {
                pdf.addPage(orientation, 'a4');
                pdf.setFontSize(16);
                pdf.setTextColor(40);
                const titleText = isAnnual ? `Planificación Anual ${this.currentYear}` : `Detalle: ${this.getMonthName(this.selectedMonthIdx)} ${this.currentYear}`;
                pdf.text(titleText, margin, margin + 10);
                
                pdf.setFontSize(10);
                let y = margin + 25;

                // Cabecera Tabla
                pdf.setFont("helvetica", "bold");
                pdf.setFillColor(240, 240, 240);
                pdf.rect(margin, y - 5, printableWidth, 7, 'F');
                pdf.text("FECHA", margin + 2, y);
                pdf.text("CATEGORÍA", margin + 68, y);
                pdf.text("DETALLE DEL EVENTO", margin + 118, y);
                
                y += 10;
                pdf.setFont("helvetica", "normal");

                finalEventRows.forEach(ev => {
                    const splitDesc = pdf.splitTextToSize(ev.desc, printableWidth - 122);
                    const rowHeight = (splitDesc.length * 5) + 4;

                    if (y + rowHeight > pageHeight - margin - 5) {
                        pdf.addPage(orientation, 'a4');
                        y = margin + 15;
                        
                        // Repetir cabecera en nueva página
                        pdf.setFont("helvetica", "bold");
                        pdf.setFillColor(240, 240, 240);
                        pdf.rect(margin, y - 5, printableWidth, 7, 'F');
                        pdf.text("FECHA", margin + 2, y);
                        pdf.text("CATEGORÍA", margin + 68, y);
                        pdf.text("DETALLE DEL EVENTO", margin + 118, y);
                        y += 10;
                        pdf.setFont("helvetica", "normal");
                    }

                    pdf.setDrawColor(220, 220, 220);
                    pdf.line(margin, y - 5, pageWidth - margin, y - 5);

                    pdf.text(ev.label, margin + 2, y);
                    pdf.text(ev.cat, margin + 68, y);
                    pdf.text(splitDesc, margin + 118, y);

                    y += rowHeight;
                });
            }

            const fileName = isAnnual ? `Planificacion_${this.currentYear}.pdf` : `Planificacion_${this.getMonthName(this.selectedMonthIdx)}_${this.currentYear}.pdf`;
            pdf.save(fileName);

        } catch (error) {
            console.error("PDF Export Error:", error);
            alert("Error al generar el PDF. Verifica que html2canvas y jsPDF estén cargados.");
        } finally {
            el.classList.remove('cal-pdf-mode');
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    },

    async showCategoryForm(cat = null) {
        const title = cat ? 'Editar Categoría' : 'Nueva Categoría';
        const nameValue = cat ? cat.nombre : '';
        const colorValue = cat ? cat.color : '#6366f1';
        
        const modal = document.getElementById('cal-modal-overlay');
        const modalContent = modal.querySelector('.cal-modal');
        
        const originalContent = modalContent.innerHTML;
        modalContent.innerHTML = `
            <h3>${title}</h3>
            <div class="modal-desc-box">
                <label>Nombre:</label>
                <input type="text" id="cat-name-input" value="${nameValue}" placeholder="Ej: Feriado, Exámenes...">
            </div>
            <div class="modal-desc-box">
                <label>Color:</label>
                <input type="color" id="cat-color-input" value="${colorValue}" style="height: 40px; cursor: pointer">
            </div>
            <div class="modal-actions">
                 <button class="btn-primary" onclick="Calendario.saveCategory(${cat ? cat.id : 'null'})">Guardar</button>
                 <button class="btn-secondary" onclick="Calendario.closeModal()">Cancelar</button>
            </div>
        `;
        
        modal.classList.add('active');
        
        const originalClose = this.closeModal.bind(this);
        this.closeModal = () => {
             modalContent.innerHTML = originalContent;
             this.closeModal = originalClose;
             originalClose();
        };
    },

    async saveCategory(id = null) {
        const nombre = document.getElementById('cat-name-input').value;
        const color = document.getElementById('cat-color-input').value;
        if (!nombre) return alert("El nombre es requerido");

        const method = id ? 'PUT' : 'POST';
        const url = id ? `/api/calendario_categorias/${id}` : `/api/calendario_categorias`;
        
        try {
            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    calendario_id: this.calendarioId,
                    nombre,
                    color
                })
            }).then(r => r.json());
            
            if (res.id || res.message) {
                this.closeModal();
                this.render();
            } else {
                alert("Error al guardar categoría");
            }
        } catch (e) {
            console.error(e);
            alert("Error de conexión");
        }
    },

    async deleteCategory(id) {
        if (!confirm("¿Seguro que deseas eliminar esta categoría? Solo se podrá eliminar si no tiene eventos asociados.")) return;
        try {
            const res = await fetch(`/api/calendario_categorias/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (res.ok) {
                this.render();
            } else {
                alert(data.detail || "Error al eliminar");
            }
        } catch (e) {
            console.error(e);
            alert("Error de conexión");
        }
    },

    linkify(text) {
        if (!text) return "";
        // Detectar URLs con protocolo (http://, https://, etc)
        const protocolPattern = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
        // Detectar URLs que empiezan con www.
        const wwwPattern = /(^|[^\/])(www\.[\S]+(\b|$))/gim;

        let result = text.replace(protocolPattern, (url) => {
            return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
        });
        
        result = result.replace(wwwPattern, (match, p1, p2) => {
            const url = p2;
            return `${p1}<a href="http://${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
        });

        return result;
    }
};

window.Calendario = Calendario;
