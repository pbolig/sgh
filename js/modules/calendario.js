export const Calendario = {
    currentView: 'annual', // 'annual' o 'monthly'
    selectedMonthIdx: 0,
    calendarioId: null,
    currentYear: new Date().getFullYear(),
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
                    ${this.currentView === 'monthly' ? `<button class="btn-secondary" onclick="Calendario.switchToAnnual()"><i class="fas fa-arrow-left"></i> Volver al Año</button>` : ''}
                    <button class="btn-primary btn-export" onclick="Calendario.exportPDF()"><i class="fas fa-file-pdf"></i> Exportar PDF</button>
                    <div class="year-selector">
                        <button onclick="Calendario.changeYear(-1)">-</button>
                        <span>${this.currentYear}</span>
                        <button onclick="Calendario.changeYear(1)">+</button>
                    </div>
                </div>
            </div>

            <div class="calendario-main-layout">
                <div class="cal-grid-container ${this.currentView === 'monthly' ? 'monthly-mode' : ''}" id="cal-grid-root">
                    ${this.renderGrid()}
                </div>
                
                <div class="cal-sidebar">
                    <div class="glass-card categories-box">
                        <h3>Referencias</h3>
                        <div class="cat-list">
                            ${this.db.categories.map(c => `
                                <div class="cat-item">
                                    <span class="cat-dot" style="background: ${c.color}"></span>
                                    <span class="cat-name">${c.nombre || c.name}</span>
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
                                    <div class="note-content">${n.texto}</div>
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
            const dtxt = e.target.closest('.dtxt');
            if (dtxt) {
                const tooltip = document.getElementById('cal-tooltip');
                if (tooltip) {
                    const desc = dtxt.getAttribute('title');
                    const cat = dtxt.dataset.catName || 'Evento';
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
            const dtxt = e.target.closest('.dtxt');
            if (dtxt) {
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
                        <div class="mname-link" onclick="Calendario.switchToMonthly(${idx})" title="Ver mes detalle">
                            <div class="mname">${name}</div>
                        </div>
                        <div class="dcont-annual">
                            ${this.buildMonthGrid(this.currentYear, idx, false)}
                        </div>
                    </div>
                `;
            });
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
                            if (this.currentView === 'annual') {
                                return `<span class="ddot" style="background: ${e.categoria.color}" title="${e.descripcion || e.categoria.nombre}"></span>`;
                            }
                            const catNameEncoded = e.categoria.nombre.replace(/'/g, "&apos;");
                            return `<span class="dtxt" 
                                          title="${e.descripcion || e.categoria.nombre}" 
                                          data-cat-name="${catNameEncoded}">${e.descripcion || e.categoria.nombre}</span>`;
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
                        descripcion: desc
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

    switchToMonthly(idx) {
        this.currentView = 'monthly';
        this.selectedMonthIdx = idx;
        this.render();
    },

    switchToAnnual() {
        this.currentView = 'annual';
        this.render();
    },

    changeYear(delta) {
        this.currentYear += delta;
        this.render();
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

    async exportPDF() {
        if (typeof html2canvas === 'undefined' || typeof jspdf === 'undefined') {
            alert("Las librerías de PDF no están cargadas.");
            return;
        }

        const btn = document.querySelector('.btn-export');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generando...';
        btn.disabled = true;

        const el = document.getElementById('calendario-container');
        el.classList.add('cal-pdf-mode');
        
        // Esperar renderizado de modo PDF
        await new Promise(resolve => setTimeout(resolve, 300));

        try {
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({ orientation: 'l', unit: 'mm', format: 'a4' });
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();

            // --- HOJA 1: RESUMEN VISUAL ---
            const canvas = await html2canvas(el, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff',
                logging: false,
                windowWidth: el.scrollWidth,
                windowHeight: el.scrollHeight
            });

            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            const canvasRatio = canvas.width / canvas.height;
            let finalWidth = pageWidth;
            let finalHeight = pageWidth / canvasRatio;

            if (finalHeight > pageHeight) {
                finalHeight = pageHeight;
                finalWidth = pageHeight * canvasRatio;
            }

            pdf.addImage(imgData, 'JPEG', 0, 0, finalWidth, finalHeight);

            // --- HOJA 2+: DETALLE (Solo en vista mensual) ---
            if (this.currentView === 'monthly') {
                const eventsThisMonth = [];
                const daysInMonth = new Date(this.currentYear, this.selectedMonthIdx + 1, 0).getDate();
                
                for (let d = 1; d <= daysInMonth; d++) {
                    const key = `${this.currentYear}-${String(this.selectedMonthIdx + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                    if (this.db.events[key]) {
                        this.db.events[key].forEach(ev => {
                            eventsThisMonth.push({ dia: d, cat: ev.categoria.nombre, desc: ev.descripcion || '-' });
                        });
                    }
                }

                if (eventsThisMonth.length > 0) {
                    pdf.addPage('l', 'a4');
                    pdf.setFontSize(18);
                    pdf.setTextColor(40);
                    pdf.text(`Resumen Detallado: ${this.getMonthName(this.selectedMonthIdx)} ${this.currentYear}`, 15, 20);
                    
                    pdf.setFontSize(10);
                    let y = 35;

                    // Cabecera Tabla
                    pdf.setFont("helvetica", "bold");
                    pdf.setFillColor(240, 240, 240);
                    pdf.rect(15, y - 5, 265, 7, 'F');
                    pdf.text("DÍA", 17, y);
                    pdf.text("CATEGORÍA", 35, y);
                    pdf.text("DETALLE COMPLETO DEL EVENTO", 85, y);
                    
                    y += 10;
                    pdf.setFont("helvetica", "normal");

                    eventsThisMonth.forEach(ev => {
                        const splitDesc = pdf.splitTextToSize(ev.desc, 190);
                        const rowHeight = (splitDesc.length * 5) + 4;

                        if (y + rowHeight > pageHeight - 20) {
                            pdf.addPage('l', 'a4');
                            y = 25;
                            // Repetir cabecera si es necesario
                        }

                        // Línea divisoria suave
                        pdf.setDrawColor(220, 220, 220);
                        pdf.line(15, y - 5, 280, y - 5);

                        pdf.text(ev.dia.toString(), 17, y);
                        pdf.text(ev.cat, 35, y);
                        pdf.text(splitDesc, 85, y);

                        y += rowHeight;
                    });
                }
            }

            pdf.save(`Planificacion_${this.getMonthName(this.selectedMonthIdx)}_${this.currentYear}.pdf`);

        } catch (error) {
            console.error("PDF Export Error:", error);
            alert("Error al generar el PDF detallado.");
        } finally {
            el.classList.remove('cal-pdf-mode');
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }
};

window.Calendario = Calendario;
