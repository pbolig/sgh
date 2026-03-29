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
                    <div class="header-row top-row">
                        <div class="cal-title-box">
                            ${this.currentView === 'annual' 
                                ? '<h1 class="premium-title">Planificación Anual</h1>' 
                                : `
                                    <div class="month-selector-wrapper">
                                        <select class="select-month-premium" onchange="Calendario.switchToMonthly(this.value)">
                                            ${["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"].map((m, i) => `
                                                <option value="${i}" ${i === this.selectedMonthIdx ? 'selected' : ''}>${m}</option>
                                            `).join('')}
                                        </select>
                                    </div>
                                `
                            }
                            <span class="cal-year-badge">${this.currentYear}</span>
                        </div>
                        
                        <div class="search-group-wrapper">
                            <div class="search-input-wrapper">
                                <i class="fas fa-search search-icon"></i>
                                <input type="text" id="cal-search-input" placeholder="Buscar eventos, categorías..." oninput="Calendario.handleSearch(this.value)" value="${this.lastSearch || ''}">
                                <button class="btn-clear-search ${this.lastSearch ? '' : 'hidden'}" onclick="Calendario.clearSearch()">×</button>
                                <div id="cal-search-results" class="search-results-balloon hidden"></div>
                            </div>
                            <button class="btn-sync-holidays" onclick="Calendario.syncHolidays()" title="Cargar automáticamente feriados nacionales y locales 2026">
                                <i class="fas fa-flag"></i> Feriados Argentina
                            </button>
                        </div>
                    </div>

                    <div class="header-row bottom-row">
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
                        
                        <div class="header-actions-right">
                            <button class="btn-primary btn-export" onclick="Calendario.showExportOptions()">
                                <i class="fas fa-file-pdf"></i> Exportar PDF
                            </button>
                            <div class="year-selector">
                                <button onclick="Calendario.changeYear(-1)">-</button>
                                <span>${this.currentYear}</span>
                                <button onclick="Calendario.changeYear(1)">+</button>
                            </div>
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
                    <h2 class="premium-title">Asignar Categoría</h2>
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
                    <div class="modal-private-row">
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
        if (window._calTooltipInitialized) return;
        window._calTooltipInitialized = true;

        document.body.addEventListener('mouseover', (e) => {
            const cell = e.target.closest('.dcell');
            if (!cell || !cell.dataset.events) return;
            
            const tooltip = document.getElementById('cal-tooltip');
            if (!tooltip) return;

            try {
                const eventsData = JSON.parse(cell.dataset.events);
                if (eventsData.length === 0) return;

                const dateStr = cell.dataset.dateLabel || "";
                let html = `<div class="tooltip-header">
                                <span>${dateStr}</span>
                                <span>${eventsData.length} ${eventsData.length === 1 ? 'Evento' : 'Eventos'}</span>
                            </div>`;
                
                eventsData.forEach(ev => {
                    html += `
                        <div class="event-item">
                            <div class="event-color" style="background: ${ev.color}"></div>
                            <div class="event-info">
                                <div class="event-cat">${ev.cat}</div>
                                <div class="event-desc">${ev.desc}</div>
                                ${ev.private ? '<div class="event-privacy">🔒 Privado</div>' : ''}
                            </div>
                        </div>
                    `;
                });

                tooltip.innerHTML = html;
                tooltip.classList.add('active');
            } catch (err) { }
        });

        document.body.addEventListener('mouseout', (e) => {
            const cell = e.target.closest('.dcell');
            if (cell) {
                const tooltip = document.getElementById('cal-tooltip');
                if (tooltip) tooltip.classList.remove('active');
            }
        });

        document.body.addEventListener('mousemove', (e) => {
            const tooltip = document.getElementById('cal-tooltip');
            if (tooltip && tooltip.classList.contains('active')) {
                const rect = tooltip.getBoundingClientRect();
                let x = e.clientX + 15;
                let y = e.clientY + 15;

                if (x + rect.width > window.innerWidth) x = e.clientX - rect.width - 15;
                if (y + rect.height > window.innerHeight) y = e.clientY - rect.height - 15;

                tooltip.style.left = x + 'px';
                tooltip.style.top = y + 'px';
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

    buildMonthGrid(year, mi, interactive, isDocente = false) {
        let html = '';
        const tot = new Date(year, mi + 1, 0).getDate();
        const isAnnual = this.currentView === 'annual';
        
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
            if (dow < 1 || dow > 5) continue;

            const dateKey = `${year}-${String(mi+1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const isToday = dateKey === todayStr;
            const evts = this.db.events[dateKey] || [];
            
            let style = '';
            const dayEvents = [];

            if (evts.length > 0) {
                const colors = evts.map(e => e.categoria.color);
                if (colors.length === 1) {
                    style = `background: ${colors[0]}44; border-left: 3px solid ${colors[0]};`;
                } else {
                    const pct = 100 / colors.length;
                    const stops = colors.map((c, i) => `${c}44 ${i * pct}%, ${c}44 ${(i + 1) * pct}%`).join(', ');
                    style = `background: linear-gradient(to bottom, ${stops}); border-left: 3px solid ${colors[0]};`;
                }

                evts.forEach(e => {
                    dayEvents.push({
                        cat: e.categoria.nombre,
                        desc: e.descripcion || 'Sin descripción',
                        color: e.categoria.color,
                        private: e.es_privado
                    });
                });
            }

            const cellId = `${year}-${mi}-${d}`;
            const isSelected = this.isInRange(cellId);
            const dateLabel = `${d} de ${this.getMonthName(mi)} de ${year}`;
            
            // Carga horaria predictiva
            const diasNom = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
            const diaNombre = diasNom[dow].toLowerCase();
            const classCount = this.db.workload[diaNombre] || 0;
            const workloadBadge = interactive && classCount > 0 ? `<div class="workload-badge" title="Carga horaria: ${classCount} HS (módulos de 40 min)">${classCount} HS</div>` : '';

            const eventsAttr = dayEvents.length > 0 ? `data-events='${JSON.stringify(dayEvents).replace(/'/g, "&apos;")}'` : "";

            let dotsHtml = '';
            const showBadge = (isDocente || isAnnual) && evts.length > 0;
            const docenteBadge = showBadge ? `<span class="docente-evt-badge" title="${evts.length} eventos">${evts.length}</span>` : '';

            if (!isDocente && !isAnnual) {
                dotsHtml = evts.map(e => {
                    const privateClass = e.es_privado ? 'is-private' : '';
                    return `<span class="dtxt ${privateClass}">${(e.es_privado ? '🔒 ' : '') + (e.descripcion || e.categoria.nombre)}</span>`;
                }).join('');
            }

            html += `
                <div class="dcell ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}" 
                     style="${style}"
                     data-date-label="${dateLabel}"
                     ${eventsAttr}
                     onclick="Calendario.handleCellClick(event, '${cellId}')">
                    <span class="dnum">${d}</span>
                    ${workloadBadge}
                    <div class="dstack">
                        ${dotsHtml}${docenteBadge}
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
        this.selectedMonthIdx = parseInt(idx);
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

    normalizeText(text) {
        if (!text) return "";
        return text.toString().toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
    },

    handleSearch(query) {
        this.lastSearch = query;
        const q = this.normalizeText(query).trim();
        const resultsBox = document.getElementById('cal-search-results');
        
        // Mostrar/ocultar botón de borrar
        const clearBtn = document.querySelector('.btn-clear-search');
        if (clearBtn) {
            if (q.length > 0) {
                clearBtn.classList.remove('hidden');
            } else {
                clearBtn.classList.add('hidden');
            }
        }

        if (q.length < 2) {
            if (resultsBox) resultsBox.classList.add('hidden');
            document.querySelectorAll('.dcell').forEach(c => c.classList.remove('search-highlight'));
            return;
        }

        const matches = [];
        const cells = document.querySelectorAll('.dcell');

        cells.forEach(cell => {
            cell.classList.remove('search-highlight');
            
            const eventsData = cell.dataset.events;
            const dateLabel = cell.dataset.dateLabel || "";
            const dayNum = cell.querySelector('.dnum')?.innerText || "";
            const cellDate = cell.dataset.dateId || cell.onclick?.toString().match(/'(\d+-\d+-\d+)'/)?.[1]; 
            // Nota: En handleCellClick usamos id como 'YYYY-M-D', pero en dataset no está. 
            // Vamos a mejorar buildMonthGrid para que incluya data-date-id

            let match = false;
            let matchTitle = "";
            let matchCat = "";
            let matchColor = "";

            // Búsqueda en fecha/número
            if (this.normalizeText(dateLabel).includes(q) || dayNum === q) {
                match = true;
                matchTitle = dateLabel;
            }
            
            // Búsqueda en eventos
            if (eventsData) {
                try {
                    const evts = JSON.parse(eventsData);
                    const foundEvt = evts.find(e => this.normalizeText(e.cat).includes(q) || this.normalizeText(e.desc).includes(q));
                    if (foundEvt) {
                        match = true;
                        if (!matchTitle) matchTitle = foundEvt.desc || foundEvt.cat;
                        matchCat = foundEvt.cat;
                        matchColor = foundEvt.color;
                    }
                } catch(e) {}
            }

            if (match) {
                cell.classList.add('search-highlight');
                // Extraer año, mes, día para el globo
                // cell.dataset.dateLabel es algo como "29 de Marzo de 2026"
                // Vamos a usar una forma más robusta si es posible, o parsear dateLabel
                const parts = dateLabel.split(' de ');
                if (parts.length === 3) {
                    matches.push({
                        day: parts[0],
                        month: parts[1],
                        year: parts[2],
                        title: matchTitle,
                        cat: matchCat,
                        color: matchColor,
                        cellId: cell.onclick?.toString().match(/'([^']+)'/)?.[1]
                    });
                }
            }
        });

        if (resultsBox) {
            if (matches.length > 0) {
                resultsBox.innerHTML = matches.map(m => `
                    <div class="search-result-item" onclick="Calendario.scrollToMatch('${m.cellId}', '${m.month}')">
                        <div class="res-date-box">
                            <span class="res-year">${m.year}</span>
                            <span class="res-month">${m.month.substring(0,3)}</span>
                            <span class="res-day">${m.day}</span>
                        </div>
                        <div class="res-info">
                            <span class="res-title">${m.title}</span>
                            ${m.cat ? `<span class="res-cat"><span class="res-dot" style="background: ${m.color}"></span> ${m.cat}</span>` : ''}
                        </div>
                    </div>
                `).join('');
                resultsBox.classList.remove('hidden');
            } else {
                resultsBox.classList.add('hidden');
            }
        }
    },

    scrollToMatch(cellId, monthName) {
        if (!cellId) return;
        
        // 1. Ocultar globo
        const resultsBox = document.getElementById('cal-search-results');
        if (resultsBox) resultsBox.classList.add('hidden');

        // 2. Si estamos en vista mensual y el mes es distinto, cambiar de mes
        if (this.currentView === 'monthly') {
            const MN = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
            const monthIdx = MN.indexOf(monthName);
            if (monthIdx !== -1 && monthIdx !== this.selectedMonthIdx) {
                this.switchToMonthly(monthIdx);
                // Re-ejecutar búsqueda para que el highlight se vea en el nuevo mes
                setTimeout(() => this.handleSearch(this.lastSearch), 100);
                return;
            }
        }

        // 3. Buscar la celda y hacer scroll
        // En vista anual, buscamos el contenedor del mes (.mcard)
        const cell = Array.from(document.querySelectorAll('.dcell')).find(c => c.onclick?.toString().includes(cellId));
        if (cell) {
            const mcard = cell.closest('.mcard');
            if (mcard) {
                mcard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // Efecto de pulso en la celda
                cell.classList.add('search-focus');
                setTimeout(() => cell.classList.remove('search-focus'), 2000);
            } else {
                cell.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    },

    clearSearch() {
        this.lastSearch = '';
        const input = document.getElementById('cal-search-input');
        if (input) input.value = '';
        const resultsBox = document.getElementById('cal-search-results');
        if (resultsBox) resultsBox.classList.add('hidden');
        this.handleSearch('');
    },

    async syncHolidays() {
        const year = this.currentYear;
        const btn = document.querySelector('.btn-sync-holidays');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sincronizando...';
        }
        
        try {
            // 1. Obtener feriados nacionales
            const response = await fetch(`https://api.argentinadatos.com/v1/feriados/${year}`);
            if (!response.ok) throw new Error("API Feriados no disponible");
            const data = await response.json();
            
            // 2. Asegurar categoría "Feriado"
            let catFeriado = this.db.categories.find(c => (c.nombre || c.name || "").toLowerCase().includes('feriado'));
            
            if (!catFeriado) {
                const newCat = await fetch(`/api/calendario_categorias`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nombre: 'Feriado', color: '#ef4444' })
                }).then(r => r.json());
                this.db.categories.push(newCat);
                catFeriado = newCat;
            }

            // 3. Preparar lista total
            const allHolidays = data.map(f => ({
                fecha: f.fecha,
                desc: f.nombre
            }));

            // Agregar locales estratégicos (Santa Fe / Rosario)
            allHolidays.push(
                { fecha: `${year}-11-15`, desc: 'Fundación de Santa Fe (Provincial)' },
                { fecha: `${year}-10-07`, desc: 'Día de la Virgen del Rosario (Local Rosario)' }
            );

            // 4. Guardar en DB (Solo si no existen)
            let nuevos = 0;
            const promises = allHolidays.map(h => {
                const dayEvts = this.db.events[h.fecha] || [];
                const exist = dayEvts.some(e => e.descripcion === h.desc);
                
                if (!exist) {
                    nuevos++;
                    return fetch(`/api/calendario_eventos`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            calendario_id: this.calendarioId,
                            fecha: h.fecha,
                            categoria_id: catFeriado.id,
                            descripcion: h.desc,
                            es_privado: false
                        })
                    });
                }
            }).filter(p => p);

            if (promises.length > 0) {
                await Promise.all(promises);
                alert(`¡Sincronización completa! Se agregaron ${nuevos} feriados.`);
                await this.loadData();
                this.render();
            } else {
                alert("Los feriados ya estaban cargados.");
            }

        } catch (error) {
            console.error("Error sincronizando feriados:", error);
            alert("Error: No se pudieron cargar los feriados.");
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-flag"></i> Feriados Argentina';
            }
        }
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
                    const filteredEvts = evs.filter(e => !e.es_privado || this.includePrivate);
                    if (filteredEvts.length > 0) {
                        // Si hay varios eventos el mismo día, los listamos por separado o juntos?
                        // Los listaremos por separado para que el docente tenga el detalle.
                        filteredEvts.forEach(e => {
                            monthEvents.push({ day: d, desc: e.descripcion || e.categoria.nombre });
                        });
                    }
                }

                // --- AGRUPAR EVENTOS CONSECUTIVOS (Ej: 9 al 13) ---
                const groupedEvents = [];
                if (monthEvents.length > 0) {
                    let currentGroup = { 
                        startDay: monthEvents[0].day, 
                        endDay: monthEvents[0].day, 
                        desc: monthEvents[0].desc 
                    };
                    
                    for (let i = 1; i < monthEvents.length; i++) {
                        const evt = monthEvents[i];
                        // Si es la misma descripción y es el día siguiente, extendemos el grupo.
                        // Nota: Si el mismo día hay 2 eventos iguales (raro), se maneja igual.
                        if (evt.desc === currentGroup.desc && (evt.day === currentGroup.endDay || evt.day === currentGroup.endDay + 1)) {
                            currentGroup.endDay = evt.day;
                        } else {
                            groupedEvents.push(currentGroup);
                            currentGroup = { startDay: evt.day, endDay: evt.day, desc: evt.desc };
                        }
                    }
                    groupedEvents.push(currentGroup);
                }

                let refsHtml = '';
                groupedEvents.forEach(evt => {
                    const dateLabel = evt.startDay === evt.endDay ? `${evt.startDay}:` : `${evt.startDay} al ${evt.endDay}:`;
                    refsHtml += `
                        <div class="ref-line">
                            <span class="ref-date">${dateLabel}</span>
                            <span class="ref-desc">${evt.desc}</span>
                        </div>
                    `;
                });

                // Si no hay muchos eventos (o se agruparon), ponemos renglones vacíos para notas manuales.
                if (groupedEvents.length < 10) {
                    for (let i = groupedEvents.length; i < 11; i++) {
                         refsHtml += `<div class="ref-line"></div>`;
                    }
                }

                pageHtml += `
                    <div class="docente-row">
                        <div class="docente-month-col">
                            <div class="mname">${monthName}</div>
                            <div class="dcont-annual">
                                ${this.buildMonthGrid(this.currentYear, monthIdx, false, true)}
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
        if (typeof html2canvas === 'undefined' || (typeof jspdf === 'undefined' && typeof window.jspdf === 'undefined')) {
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
        
        if (!captureTarget) {
            alert("No se encontró el elemento a exportar.");
            btn.innerHTML = originalText;
            btn.disabled = false;
            return;
        }

        document.body.classList.add('cal-pdf-mode');
        document.body.style.backgroundColor = 'white';
        await new Promise(resolve => setTimeout(resolve, 600));

        try {
            const jsPDFConstructor = window.jspdf ? window.jspdf.jsPDF : jspdf.jsPDF;
            // Modo Docente y Anual siempre Vertical (p), Mensual Apaisado (l)
            const orientation = (isAnnual || isDocente) ? 'p' : 'l';
            const pdf = new jsPDFConstructor({ orientation, unit: 'mm', format: 'a4' });
            
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const margin = 10;
            const printableWidth = pageWidth - (margin * 2);
            const printableHeight = pageHeight - (margin * 2);

            // --- HOJA 1: RESUMEN VISUAL ---
            let canvas = null;
            if (!isDocente) {
                canvas = await html2canvas(captureTarget, {
                    scale: 2,
                    useCORS: true,
                    backgroundColor: '#ffffff',
                    logging: false,
                    onclone: (clonedDoc) => {
                        clonedDoc.body.style.background = 'white';
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
        }

        if (!isDocente && canvas) {
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
            } else if (isDocente) {
                // MODO DOCENTE: Múltiples páginas
                const pages = document.querySelectorAll('.docente-page');
                if (pages.length === 0) throw new Error("No se encontraron páginas del Modo Docente");

                for (let i = 0; i < pages.length; i++) {
                    if (i > 0) pdf.addPage('a4', 'p');
                    
                    const pageCanvas = await html2canvas(pages[i], {
                        scale: 2, 
                        useCORS: true,
                        backgroundColor: '#ffffff',
                        logging: false,
                        onclone: (clonedDoc) => {
                            clonedDoc.body.style.background = 'white';
                        },
                        width: pages[i].offsetWidth,
                        height: pages[i].offsetHeight
                    });
                    
                    const imgData = pageCanvas.toDataURL('image/jpeg', 0.95);
                    // Como el CSS ya tiene los márgenes de 10mm, pegamos a la página completa (210x297)
                    pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight);
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

            if (finalEventRows.length > 0 && !isDocente) {
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
                pdf.text("CATEGORÍA", margin + 62, y);
                pdf.text("DETALLE DEL EVENTO", margin + 107, y);
                
                y += 10;
                pdf.setFont("helvetica", "normal");

                const detailWidth = printableWidth - 109;

                finalEventRows.forEach(ev => {
                    // Dividir texto por ancho, pero también forzar ruptura si hay palabras muy largas
                    let rawDesc = ev.desc || "-";
                    let splitDesc = pdf.splitTextToSize(rawDesc, detailWidth);
                    
                    // Verificación extra: si alguna línea sigue siendo más ancha que la celda (ocurre con hilos sin espacios)
                    // jsPDF splitTextToSize a veces falla con hilos infinitos. Forzamos un wrap manual si es necesario.
                    let processedLines = [];
                    splitDesc.forEach(line => {
                        if (pdf.getTextWidth(line) > detailWidth) {
                             // Ruptura ruda por caracteres
                             let charsPerLine = Math.floor(detailWidth / (pdf.getTextWidth('A') / 'A'.length)) - 2; 
                             for (let i = 0; i < line.length; i += charsPerLine) {
                                 processedLines.push(line.substring(i, i + charsPerLine));
                             }
                        } else {
                            processedLines.push(line);
                        }
                    });

                    const rowHeight = (processedLines.length * 5) + 4;

                    if (y + rowHeight > pageHeight - margin - 5) {
                        pdf.addPage(orientation, 'a4');
                        y = margin + 15;
                        
                        pdf.setFont("helvetica", "bold");
                        pdf.setFillColor(240, 240, 240);
                        pdf.rect(margin, y - 5, printableWidth, 7, 'F');
                        pdf.text("FECHA", margin + 2, y);
                        pdf.text("CATEGORÍA", margin + 62, y);
                        pdf.text("DETALLE DEL EVENTO", margin + 107, y);
                        y += 10;
                        pdf.setFont("helvetica", "normal");
                    }

                    pdf.setDrawColor(220, 220, 220);
                    pdf.line(margin, y - 5, pageWidth - margin, y - 5);

                    pdf.text(ev.label, margin + 2, y);
                    pdf.text(ev.cat, margin + 62, y);
                    pdf.text(processedLines, margin + 107, y);

                    y += rowHeight;
                });
            }

            let fileName = isAnnual ? `Planificacion_${this.currentYear}.pdf` : `Planificacion_${this.getMonthName(this.selectedMonthIdx)}_${this.currentYear}.pdf`;
            if (isDocente) fileName = `calen_docente_${this.currentYear}.pdf`;
            pdf.save(fileName);

        } catch (error) {
            console.error("PDF Export Error:", error);
            alert("Error al generar el PDF. Verifica que html2canvas y jsPDF estén cargados.");
        } finally {
            document.body.classList.remove('cal-pdf-mode');
            document.body.style.backgroundColor = '';
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
