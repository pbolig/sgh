// js/utils/ui.js
/**
 * Módulo para gestionar la interfaz global
 * Incluye el cargador Glassmorphism y la intercepción de peticiones.
 */

export const UI = {
    loader: null,
    loadingCount: 0,

    init: () => {
        UI.loader = document.getElementById('global-loader');
        UI.setupFetchInterceptor();
        
        // Reset robusto del estado inicial
        UI.loadingCount = 0;
        document.body.classList.remove('loading-active');
        if (UI.loader) UI.loader.classList.add('hidden');
    },

    showLoader: (text = 'Sincronizando con el servidor...') => {
        UI.loadingCount++;
        if (UI.loader) {
            const textEl = UI.loader.querySelector('.loader-text');
            if (textEl) textEl.textContent = text;
            UI.loader.classList.remove('hidden');
        }
    },

    hideLoader: () => {
        UI.loadingCount--;
        if (UI.loadingCount <= 0) {
            UI.loadingCount = 0;
            if (UI.loader) {
                // Pequeño delay para evitar parpadeos y asegurar la transición
                setTimeout(() => {
                    if (UI.loadingCount === 0) UI.loader.classList.add('hidden');
                }, 100);
            }
        }
    },

    /**
     * Sobrescribe window.fetch para capturar todas las peticiones automágicamente
     */
    setupFetchInterceptor: () => {
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            // No mostrar el loader para el timer de inactividad o logs silenciosos si los hubiera
            const isSilent = args[0] && typeof args[0] === 'string' && args[0].includes('silent=true');
            
            if (!isSilent) UI.showLoader();
            
            try {
                const response = await originalFetch(...args);
                return response;
            } catch (error) {
                console.error('Fetch error intercepted:', error);
                throw error;
            } finally {
                if (!isSilent) UI.hideLoader();
            }
        };
    },

    /**
     * Genera e imprime una planilla de firmas profesional
     */
    printSignatureSheet: (titulo, subtitulo, items) => {
        const printWindow = window.open('', '_blank');
        
        // Estilos base para impresión
        const styles = `
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; color: #000; background: #fff; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 10px; }
            .header h1 { margin: 0; font-size: 20pt; text-transform: uppercase; }
            .header h2 { margin: 5px 0 0; font-size: 14pt; color: #333; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #000; padding: 8px; text-align: left; font-size: 10pt; }
            th { background-color: #f2f2f2; font-weight: bold; text-transform: uppercase; }
            .col-horario { width: 15%; }
            .col-docente { width: 25%; }
            .col-materia { width: 25%; }
            .col-aula { width: 10%; }
            .col-firma { width: 25%; }
            .col-obs { width: 15%; }
            .footer { margin-top: 40px; font-size: 9pt; text-align: right; font-style: italic; }
            @media print {
                @page { margin: 1cm; }
                body { padding: 0; }
                .no-print { display: none; }
            }
        `;

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Planilla de Firmas - ${titulo}</title>
                <style>${styles}</style>
            </head>
            <body>
                <div class="header">
                    <h1>${titulo}</h1>
                    <h2>Registro de Firmas: ${subtitulo}</h2>
                </div>
                
                <table>
                    <thead>
                        <tr>
                            <th class="col-horario">Horario</th>
                            <th class="col-docente">Docente</th>
                            <th class="col-materia">Materia / Cargo</th>
                            <th class="col-aula">Aula</th>
                            <th class="col-firma">Firma</th>
                            <th class="col-obs">Observaciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${items.length === 0 ? '<tr><td colspan="6" style="text-align:center">No hay actividades programadas para este día</td></tr>' : 
                            items.map(i => `
                                <tr>
                                    <td>${i.horario}</td>
                                    <td><strong>${i.docente}</strong></td>
                                    <td>${i.detalle}</td>
                                    <td>${i.aula}</td>
                                    <td></td>
                                    <td></td>
                                </tr>
                            `).join('')
                        }
                    </tbody>
                </table>
                
                <div class="footer">
                    Generado automáticamente por el Sistema de Gestión Horaria el ${new Date().toLocaleString()}
                </div>

                <script>
                    window.onload = function() {
                        window.print();
                        // Opcional: window.close();
                    };
                </script>
            </body>
            </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
    },

    /**
     * Genera e imprime una planilla semanal matricial (Horizontal)
     */
    printWeeklyMatrixSheet: (titulo, subtitulo, rows, headers) => {
        const printWindow = window.open('', '_blank');
        const styles = `
            @page { size: landscape; margin: 1cm; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 10px; color: #000; background: #fff; }
            .header { text-align: center; margin-bottom: 15px; border-bottom: 2px solid #000; padding-bottom: 5px; }
            .header h1 { margin: 0; font-size: 16pt; text-transform: uppercase; }
            .header h2 { margin: 5px 0; font-size: 12pt; color: #333; }
            table { width: 100%; border-collapse: collapse; table-layout: fixed; }
            th, td { border: 1px solid #000; padding: 5px; font-size: 8pt; vertical-align: top; overflow: hidden; word-wrap: break-word; }
            th { background-color: #f2f2f2; font-weight: bold; text-transform: uppercase; }
            .col-materia { width: 20%; font-weight: bold; background: #fafafa; }
            .day-col { width: 16%; }
            .cell-content { min-height: 40px; display: flex; flex-direction: column; justify-content: space-between; }
            .teacher-name { font-weight: bold; margin-bottom: 3px; font-size: 7.5pt; line-height: 1.1; }
            .sign-line { border-top: 0.5pt dashed #999; margin-top: auto; padding-top: 2px; font-size: 6pt; color: #666; text-align: center; }
            .footer { margin-top: 10px; font-size: 7pt; text-align: right; font-style: italic; }
            @media print {
                body { padding: 0; }
            }
        `;

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Planilla Semanal - ${titulo}</title>
                <style>${styles}</style>
            </head>
            <body>
                <div class="header">
                    <h1>${titulo}</h1>
                    <h2>Planilla de Firmas Semanal: ${subtitulo}</h2>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th class="col-materia">Materia / Comisión</th>
                            ${headers.map(h => `<th class="day-col">${h}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${rows.map(r => `
                            <tr>
                                <td class="col-materia">${r.materia}</td>
                                ${r.days.map(d => `
                                    <td class="day-col">
                                        ${d ? `
                                            <div class="cell-content">
                                                <div class="teacher-name">${d.docente}</div>
                                                <div class="sign-line">Firma: ..............................</div>
                                            </div>
                                        ` : ''}
                                    </td>
                                `).join('')}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <div class="footer">Generado el ${new Date().toLocaleString()}</div>
                <script>window.onload = () => { window.print(); };</script>
            </body>
            </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
    },

    /**
     * Genera e imprime una planilla semanal por columnas (Máximo ahorro de papel)
     */
    printWeeklyColumnSheet: (titulo, subtitulo, daysData) => {
        const printWindow = window.open('', '_blank');
        const styles = `
            @page { size: portrait; margin: 0.7cm; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 5px; color: #000; background: #fff; line-height: 1.1; }
            .header { text-align: center; margin-bottom: 8px; border-bottom: 1.5px solid #000; padding-bottom: 3px; }
            .header h1 { margin: 0; font-size: 12pt; text-transform: uppercase; }
            .header h2 { margin: 2px 0; font-size: 9pt; color: #333; }
            .columns-wrapper { display: flex; gap: 5px; align-items: stretch; }
            .day-column { flex: 1; border: 0.5pt solid #000; display: flex; flex-direction: column; min-width: 0; }
            .day-header { background-color: #f2f2f2; text-align: center; font-weight: bold; padding: 3px; border-bottom: 0.5pt solid #000; text-transform: uppercase; font-size: 8pt; }
            .class-item { padding: 3px; border-bottom: 0.2pt solid #eee; display: flex; flex-direction: column; gap: 1px; }
            .class-time { font-size: 6.5pt; font-weight: bold; color: #444; }
            .class-title { font-size: 7pt; font-weight: bold; color: #000; line-height: 1; word-wrap: break-word; }
            .class-teacher { font-size: 6.5pt; font-style: italic; color: #333; }
            .sign-area { margin-top: 3px; border-top: 0.3pt dashed #999; padding-top: 1px; font-size: 5.5pt; color: #777; text-align: center; min-height: 18px; }
            .empty-day { padding: 10px 2px; text-align: center; font-style: italic; color: #999; font-size: 7pt; }
            .footer { margin-top: 5px; font-size: 6pt; text-align: right; font-style: italic; }
            @media print {
                body { padding: 0; }
            }
        `;

        const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Planilla Semanal - ${titulo}</title>
                <style>${styles}</style>
            </head>
            <body>
                <div class="header">
                    <h1>${titulo}</h1>
                    <h2>Registro de Firmas Semanal: ${subtitulo}</h2>
                </div>
                <div class="columns-wrapper">
                    ${days.map((dayName, idx) => `
                        <div class="day-column">
                            <div class="day-header">${dayName}</div>
                            <div class="classes-list">
                                ${(daysData[idx] || []).length === 0 ? 
                                    '<div class="empty-day">Sin actividad</div>' : 
                                    daysData[idx].map(item => `
                                        <div class="class-item">
                                            <div class="class-time">${item.horario} | ${item.aula}</div>
                                            <div class="class-title">${item.detalle}</div>
                                            <div class="class-teacher">${item.docente}</div>
                                            <div class="sign-area">Firma: ..............................</div>
                                        </div>
                                    `).join('')
                                }
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="footer">Generado el ${new Date().toLocaleString()}</div>
                <script>window.onload = () => { window.print(); };</script>
            </body>
            </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
    }
};
