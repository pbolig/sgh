// js/modules/dashboard.js
import { Auth } from './auth.js';
import { Departamentos } from './departamentos.js';
import { Docentes } from './docentes.js';
import { Comisiones } from './comisiones.js';

export const Dashboard = {
    timer: null,
    timeRange: { start: 7 * 60, end: 22 * 60 }, // 07:00 a 22:00 (900 minutos totales)
    
    render: async (containerId) => {
        const container = document.getElementById(containerId);
        container.innerHTML = `
            <div id="dashboard-view" class="view">
                <div class="dashboard-header">
                    <!-- Reloj Digital Retro -->
                    <div class="retro-clock-wrapper">
                        <div class="retro-clock" id="retro-clock">
                            <span class="rc-time" id="rc-time">--:--<span class="rc-sec" id="rc-sec">--</span></span>
                            <span class="rc-date" id="rc-date">CARGANDO...</span>
                        </div>
                    </div>
                    
                    <!-- Widget de Clima API Open-Meteo -->
                    <div class="weather-widget" id="weather-widget">
                        <div class="loading-mini">Obteniendo clima...</div>
                    </div>

                    <!-- Panel de Alertas Inteligentes (Smart Alerts) -->
                    <div class="smart-alerts-panel" id="smart-alerts-panel">
                        <!-- Alertas inyectadas aquí por JS -->
                    </div>
                </div>
                <div id="dashboard-timelines" class="dashboard-timelines">
                    <div class="loading">Sincronizando línea de tiempo...</div>
                </div>
            </div>
        `;
        
        // Cargar datos necesarios
        const [deptos, modulos, aulas, docentes, comisiones, allAsignaciones, cargoAsignaciones, cargos, excluidos, calEvents] = await Promise.all([
            Departamentos.list(),
            fetch('/api/modulos').then(r => r.json()),
            fetch('/api/aulas').then(r => r.json()),
            Docentes.list(),
            Comisiones.list(),
            fetch('/api/asignaciones').then(r => r.json()),
            fetch('/api/cargo-asignaciones').then(r => r.json()),
            fetch('/api/cargos').then(r => r.json()),
            fetch('/api/recreos_excluidos').then(r => r.json()),
            fetch('/api/calendarios').then(r => r.json()).then(async cals => {
                if (cals.length > 0) {
                    const res = await fetch(`/api/calendario_eventos?calendario_id=${cals[0].id}`);
                    return res.json();
                }
                return [];
            })
        ]);
        
        // --- DEPARTAMENTO DE DEMOSTRACIÓN ELIMINADO ---


        const totalMinutes = Dashboard.timeRange.end - Dashboard.timeRange.start;

        const getLeftPercent = (timeStr) => {
            const mins = Dashboard.timeToMinutes(timeStr);
            const relative = Math.max(0, Math.min(mins - Dashboard.timeRange.start, totalMinutes));
            return (relative / totalMinutes) * 100;
        };

        const getWidthPercent = (startStr, endStr) => {
            const start = Dashboard.timeToMinutes(startStr);
            const end = Dashboard.timeToMinutes(endStr);
            return ((end - start) / totalMinutes) * 100;
        };

        const fetchWeather = async () => {
            try {
                // Coordenadas de Rosario: Lat -32.9468, Lon -60.6393
                const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=-32.9468&longitude=-60.6393&current=temperature_2m,wind_speed_10m,wind_direction_10m&hourly=precipitation_probability&forecast_hours=1&timezone=America%2FSao_Paulo');
                const data = await res.json();
                if (data.current && data.hourly) {
                    const temp = Math.round(data.current.temperature_2m);
                    const precProb = data.hourly.precipitation_probability[0];
                    // Conversión km/h a nudos (1 km/h = 0.539957 knots)
                    const windKnots = Math.round(data.current.wind_speed_10m * 0.539957);
                    const windDir = data.current.wind_direction_10m;
                    const windArrow = `<span style="display:inline-block; transform: rotate(${windDir}deg); font-weight: bold;">↓</span>`;

                    const ww = document.getElementById('weather-widget');
                    if(ww) {
                        ww.innerHTML = `
                            <div class="ww-header">Rosario, SF</div>
                            <div class="ww-body">
                                <div class="ww-temp">${temp}°C</div>
                                <div class="ww-details">
                                    <span>🌧️ ${precProb}% prob.</span>
                                    <span>💨 ${windKnots} kt ${windArrow}</span>
                                </div>
                            </div>
                        `;
                    }
                }
            } catch (error) {
                console.error("Error fetching weather:", error);
                const ww = document.getElementById('weather-widget');
                if (ww) ww.innerHTML = `<div class="ww-error">Error conexión API</div>`;
            }
        };

        // Solicitar clima inicial y programar refresco cada 15 minutos
        fetchWeather();
        setInterval(fetchWeather, 15 * 60 * 1000);

        const updateUI = () => {
            const now = new Date();
            const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
            const diaNom = diasSemana[now.getDay()];
            const diaActual = diaNom.toLowerCase();
            const currMins = now.getHours() * 60 + now.getMinutes();

            // Refrescar reloj Retro Digital
            const rcTime = document.getElementById('rc-time');
            const rcSec = document.getElementById('rc-sec');
            const rcDate = document.getElementById('rc-date');
            
            if (rcTime) {
                const h = now.getHours().toString().padStart(2, '0');
                const m = now.getMinutes().toString().padStart(2, '0');
                const s = now.getSeconds().toString().padStart(2, '0');
                const day = now.getDate().toString().padStart(2, '0');
                const month = (now.getMonth() + 1).toString().padStart(2, '0');
                
                rcTime.innerHTML = `${h}:${m}<span class="rc-sec" id="rc-sec">:${s}</span>`;
                rcDate.textContent = `${diaNom.toUpperCase()} ${day}/${month}/${now.getFullYear()}`;
                
                // Habilitar salto al calendario
                if (!rcDate.dataset.listener) {
                    rcDate.style.cursor = 'pointer';
                    rcDate.title = 'Abrir Planificación Académica';
                    rcDate.onclick = (e) => {
                        e.stopPropagation();
                        if (window.loadView) window.loadView('calendario');
                    };
                    rcDate.dataset.listener = 'true';
                }
            }

            const grid = document.getElementById('dashboard-timelines');
            if (!grid) return;

            // Escuchar selector de departamento para filtrar
            const deptSelector = document.getElementById('dept-selector');
            const selectedDeptId = deptSelector ? deptSelector.value : '';
            
            if (deptSelector && !deptSelector.dataset.listenerAdded) {
                deptSelector.addEventListener('change', () => {
                    if (grid) grid.removeAttribute('data-rendered');
                });
                deptSelector.dataset.listenerAdded = 'true';
            }

            // Actualizar líneas transversales si el grid ya está renderizado y no cambiaron los datos
            // Por simplicidad, re-renderizamos la grilla una vez, y luego solo actualizamos el cursor
            if (!grid.hasAttribute('data-rendered')) {
                let html = `
                    <div class="global-fixed-cursor" id="global-cursor" style="display: none;">
                        <div class="cursor-time-bubble" id="cursor-time-bubble">--:--</div>
                        <!-- Globo Glassmorphism para Resumen en Tiempo Real -->
                        <div class="glass-balloon" id="glass-balloon">
                            <div class="gb-header">
                                <span class="gb-header-icon">📡</span>
                                <span class="gb-header-title">RADAR EN TIEMPO REAL</span>
                            </div>
                            <div class="gb-content" id="gb-content">
                                <!-- Contenido inyectado dinámicamente -->
                            </div>
                        </div>
                    </div>
                    <div class="timeline-global-scroll" id="timeline-scroll">
                        <div class="timeline-wrapper-inner">
                `;
                
                // Generar regla de tiempo en el encabezado de las timelines
                let timeScaleHtml = '<div class="timeline-scale">';
                for(let h=7; h<=22; h++) {
                    const left = getLeftPercent(`${h}:00`);
                    timeScaleHtml += `<div class="scale-mark" style="left: ${left}%"><span>${h}:00</span></div>`;
                }
                timeScaleHtml += '</div>';
                html += timeScaleHtml;

                const deptosFilt = deptos.filter(d => {
                    if (!selectedDeptId || selectedDeptId === 'todos' || selectedDeptId === '') return true;
                    return d.id.toString() === selectedDeptId;
                });

                deptosFilt.forEach(depto => {
                    const deptoAulas = aulas.filter(a => a.departamento_id === depto.id);
                    if (deptoAulas.length === 0) return;

                    const deptoModulos = modulos.filter(m => {
                        return allAsignaciones.some(as => as.modulo_id === m.id && deptoAulas.some(da => da.id === as.aula_id) && as.dia_semana === diaActual);
                    }).sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));

                    html += `
                        <div class="timeline-card">
                            <h3 class="timeline-depto-title">${depto.nombre}</h3>
                            <div class="timeline-container">
                                    
                                    ${deptoAulas.map(aula => {
                                        let tracksHtml = '';
                                        
                                        // Bloques de clase
                                        const asigsAula = allAsignaciones.filter(as => as.aula_id === aula.id && as.dia_semana === diaActual);
                                        asigsAula.forEach(asig => {
                                            const m = modulos.find(mod => mod.id === asig.modulo_id);
                                            const c = comisiones.find(com => com.id === asig.comision_id);
                                            const d = docentes.find(doc => doc.id === asig.docente_id);
                                            if (m) {
                                                const left = getLeftPercent(m.hora_inicio);
                                                const width = getWidthPercent(m.hora_inicio, m.hora_fin);
                                                tracksHtml += `
                                                    <div class="time-block block-class" style="left: ${left}%; width: ${width}%">
                                                        <div class="tb-head">${c ? c.codigo : ''}</div>
                                                        <div class="tb-body">${d ? d.apellido : ''}</div>
                                                        <div class="tb-time">${m.hora_inicio}-${m.hora_fin}</div>
                                                    </div>
                                                `;
                                            }
                                        });

                                        // Bloques de recreo para este depto
                                        for (let i = 0; i < deptoModulos.length - 1; i++) {
                                            const m = deptoModulos[i];
                                            const nextM = deptoModulos[i+1];
                                            const endMin = Dashboard.timeToMinutes(m.hora_fin);
                                            const startNextMin = Dashboard.timeToMinutes(nextM.hora_inicio);
                                            
                                            if (startNextMin > endMin) {
                                                const isExcluded = excluidos.some(e => e.departamento_id === depto.id && e.dia_semana === diaActual && e.modulo_id_anterior === m.id);
                                                if (!isExcluded) {
                                                    const left = getLeftPercent(m.hora_fin);
                                                    const width = getWidthPercent(m.hora_fin, nextM.hora_inicio);
                                                    tracksHtml += `
                                                        <div class="time-block block-break" style="left: ${left}%; width: ${width}%" title="Recreo"></div>
                                                    `;
                                                }
                                            }
                                        }

                                        return `
                                            <div class="timeline-track">
                                                <div class="track-label">${aula.nombre}</div>
                                                <div class="track-content">
                                                    ${tracksHtml}
                                                </div>
                                            </div>
                                        `;
                                    }).join('')}

                                    <!-- Fila de Personal de Servicio (Cargos) -->
                                    ${(() => {
                                        const cargosHoy = (cargoAsignaciones || []).filter(ca => {
                                            return ca.departamento_id === depto.id && (ca.horarios || []).some(h => h.dia_semana === diaActual);
                                        });

                                        if (cargosHoy.length === 0) return '';

                                        return cargosHoy.map(ca => {
                                            const doc = docentes.find(d => d.id === ca.docente_id);
                                            const cgDef = (cargos || []).find(c => c.id === ca.cargo_id);
                                            const slotsHoy = ca.horarios.filter(h => h.dia_semana === diaActual);
                                            
                                            return `
                                                <div class="timeline-track cargo-track">
                                                    <div class="track-label" style="color: #8b5cf6;">👥 ${doc ? doc.apellido : 'Personal'}</div>
                                                    <div class="track-content">
                                                        ${slotsHoy.map(s => {
                                                            const left = getLeftPercent(s.hora_inicio);
                                                            const width = getWidthPercent(s.hora_inicio, s.hora_fin);
                                                            return `
                                                                <div class="time-block block-cargo" style="left: ${left}%; width: ${width}%">
                                                                    <div class="tb-head">${cgDef ? cgDef.nombre : 'Cargo'}</div>
                                                                    <div class="tb-body">${doc ? `${doc.apellido}, ${doc.nombre}` : ''}</div>
                                                                    <div class="tb-time">${s.hora_inicio}-${s.hora_fin}</div>
                                                                </div>
                                                            `;
                                                        }).join('')}
                                                    </div>
                                                </div>
                                            `;
                                        }).join('');
                                    })()}
                                </div>
                        </div>
                    `;
                });
                html += '</div></div>';
                grid.innerHTML = html;
                grid.setAttribute('data-rendered', 'true');
                
                // Eventos manuales suprimidos: El control lo tiene estrictamente el requestAnimationFrame
                // para garantizar que nunca se detenga el seguimiento en tiempo real.
            }

            // Lógica de Teleprompter: Cursor fijo en el centro, tarjeta se desplaza
            const globalScroll = document.getElementById('timeline-scroll');
            const globalCursor = document.getElementById('global-cursor');
            const cursorBubble = document.getElementById('cursor-time-bubble');

            if (globalScroll && globalCursor) {
                globalCursor.style.display = 'block';
                if (cursorBubble) {
                    const hStr = now.getHours().toString().padStart(2, '0');
                    const mStr = now.getMinutes().toString().padStart(2, '0');
                    cursorBubble.textContent = `${hStr}:${mStr}`;
                }
            }

            // Lógica del Globo Resumen al hacer Hover (Evento Delegado para persistencia tras render)
            if (grid && !grid.dataset.hoverBound) {
                grid.addEventListener('mouseover', (e) => {
                    const bubble = e.target.closest('.cursor-time-bubble');
                    if(bubble) {
                        const balloon = document.getElementById('glass-balloon');
                        const gbContent = document.getElementById('gb-content');
                        if(!balloon || !gbContent) return;
                        
                        balloon.classList.add('active');
                        
                        // Calcular hora actual exacta en minutos
                        const curNow = new Date();
                        const cMins = curNow.getHours() * 60 + curNow.getMinutes();
                        const curDia = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'][curNow.getDay()];
                        
                        let activeHtml = '';
                        
                        // Usar deptosFilt para respetar el desplegable actual
                        const ds = document.getElementById('dept-selector');
                        const selId = ds ? ds.value : '';
                        const deptosScope = deptos.filter(d => {
                            if (!selId || selId === 'todos' || selId === '') return true;
                            return d.id.toString() === selId;
                        });
                        
                        let foundAny = false;
    
                        deptosScope.forEach(dpt => {
                            const aulasDpt = aulas.filter(a => a.departamento_id === dpt.id);
                            
                            aulasDpt.forEach(aul => {
                                // Buscar clase activa
                                const asigs = allAsignaciones.filter(as => as.aula_id === aul.id && as.dia_semana === curDia);
                                let claseActiva = null;
                                asigs.forEach(asig => {
                                    const m = modulos.find(mod => mod.id === asig.modulo_id);
                                    if(m) {
                                        const start = Dashboard.timeToMinutes(m.hora_inicio);
                                        const end = Dashboard.timeToMinutes(m.hora_fin);
                                        if(cMins >= start && cMins <= end) {
                                            claseActiva = { modulo: m, comision: comisiones.find(c => c.id === asig.comision_id), docente: docentes.find(dc => dc.id === asig.docente_id) };
                                        }
                                    }
                                });
                                
                                // Buscar recreo activo (si no hay clase)
                                let recreoActivo = null;
                                if(!claseActiva) {
                                    const modulosDpt = modulos.filter(m => {
                                        return allAsignaciones.some(as => as.modulo_id === m.id && aulasDpt.some(da => da.id === as.aula_id) && as.dia_semana === curDia);
                                    }).sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
                                    
                                    for(let i=0; i<modulosDpt.length-1; i++) {
                                        const m1 = modulosDpt[i];
                                        const m2 = modulosDpt[i+1];
                                        const rStart = Dashboard.timeToMinutes(m1.hora_fin);
                                        const rEnd = Dashboard.timeToMinutes(m2.hora_inicio);
                                        
                                        if(rEnd > rStart && cMins >= rStart && cMins <= rEnd) {
                                            const isExcl = excluidos.some(e => e.departamento_id === dpt.id && e.dia_semana === curDia && e.modulo_id_anterior === m1.id);
                                            if(!isExcl) {
                                                recreoActivo = { inicio: m1.hora_fin, fin: m2.hora_inicio };
                                            }
                                        }
                                    }
                                }
                                
                                if (claseActiva) {
                                    foundAny = true;
                                    const durMin = Dashboard.timeToMinutes(claseActiva.modulo.hora_fin) - Dashboard.timeToMinutes(claseActiva.modulo.hora_inicio);
                                    const hs = Math.round(durMin / 40);
                                    activeHtml += `
                                        <div class="gb-item">
                                            <div class="gb-item-title">${dpt.nombre} - ${aul.nombre}</div>
                                            <div class="gb-item-subtitle">
                                                <span>${claseActiva.comision ? claseActiva.comision.codigo : 'S/C'} | Prof. ${claseActiva.docente ? claseActiva.docente.apellido : 'S/D'}</span>
                                                <span>⏱️ ${claseActiva.modulo.hora_inicio}-${claseActiva.modulo.hora_fin} (${durMin} min / ${hs} HS)</span>
                                            </div>
                                        </div>
                                    `;
                                } else if (recreoActivo) {
                                    foundAny = true;
                                    activeHtml += `
                                        <div class="gb-item recreo">
                                            <div class="gb-item-title">${dpt.nombre} - ${aul.nombre}</div>
                                            <div class="gb-item-subtitle">
                                                <span style="color: #f59e0b; font-weight: bold;">☕ RECREO EN CURSO</span>
                                                <span>⏱️ ${recreoActivo.inicio}-${recreoActivo.fin}</span>
                                            </div>
                                        </div>
                                    `;
                                }
                            });

                            // --- DETECTAR CARGOS ACTIVOS EN ESTE DEPTO ---
                            const cargosDpt = (cargoAsignaciones || []).filter(ca => {
                                if (ca.departamento_id !== dpt.id) return false;
                                return (ca.horarios || []).some(h => {
                                    if (h.dia_semana !== curDia) return false;
                                    const start = Dashboard.timeToMinutes(h.hora_inicio);
                                    const end = Dashboard.timeToMinutes(h.hora_fin);
                                    return cMins >= start && cMins <= end;
                                });
                            });

                            cargosDpt.forEach(ca => {
                                foundAny = true;
                                const doc = docentes.find(d => d.id === ca.docente_id);
                                const cgDef = cargos.find(c => c.id === ca.cargo_id);
                                
                                // Encontrar el slot exacto activo para mostrar el rango horario en el globo
                                const activeSlot = ca.horarios.find(h => {
                                    if (h.dia_semana !== curDia) return false;
                                    const start = Dashboard.timeToMinutes(h.hora_inicio);
                                    const end = Dashboard.timeToMinutes(h.hora_fin);
                                    return cMins >= start && cMins <= end;
                                });

                                activeHtml += `
                                    <div class="gb-item cargo">
                                        <div class="gb-item-title">${dpt.nombre} (P. de Servicio)</div>
                                        <div class="gb-item-subtitle">
                                            <span style="color: #a78bfa; font-weight: bold;">👥 ${doc ? `${doc.apellido}, ${doc.nombre}` : 'Personal'}</span>
                                            <span>💼 ${cgDef ? cgDef.nombre : 'Cargo'} | ⏱️ ${activeSlot ? activeSlot.hora_inicio + '-' + activeSlot.hora_fin : 'En horario'}</span>
                                        </div>
                                    </div>
                                `;
                            });
                        });
                        
                        if (!foundAny) {
                            gbContent.innerHTML = `<div class="gb-empty">No se detecta actividad programada en este momento exacto.</div>`;
                        } else {
                            gbContent.innerHTML = activeHtml;
                        }
                    }
                });
                
                grid.addEventListener('mouseout', (e) => {
                    const bubble = e.target.closest('.cursor-time-bubble');
                    if(bubble) {
                        const balloon = document.getElementById('glass-balloon');
                        if(balloon) balloon.classList.remove('active');
                    }
                });
                
                grid.dataset.hoverBound = 'true';
            }

            // -------------------------------------------------------------
            // GENERADOR DE ALERTAS INTELIGENTES (SMART ALERTS PANEL)
            // -------------------------------------------------------------
            const alertsPanel = document.getElementById('smart-alerts-panel');
            Dashboard.dismissedAlerts = Dashboard.dismissedAlerts || new Set();
            
            if (alertsPanel) {
                if (!Dashboard.alertsListenerAdded) {
                    alertsPanel.addEventListener('click', (e) => {
                        const dismissBtn = e.target.closest('.sa-dismiss');
                        if (dismissBtn) {
                            const alertId = dismissBtn.getAttribute('data-id');
                            if (alertId) {
                                Dashboard.dismissedAlerts.add(alertId);
                                updateUI(); // Re-render immediately to hide the alert
                            }
                        }
                    });
                    Dashboard.alertsListenerAdded = true;
                }

                // --- DETECCIÓN DE ASUETO/FERIADO (BLOQUEANTE) ---
                const todayIso = now.toISOString().split('T')[0];
                const asuetoHoy = calEvents.find(e => e.fecha === todayIso && (e.categoria.nombre.toLowerCase().includes('asueto') || e.categoria.nombre.toLowerCase().includes('feriado')));

                if (asuetoHoy) {
                    alertsPanel.innerHTML = `
                        <div class="sa-alert start-class" style="border-left-color: #ef4444; background: linear-gradient(90deg, rgba(239, 68, 68, 0.2) 0%, rgba(15, 23, 42, 0.8) 100%);">
                            <div class="sa-content">
                                <span class="sa-icon">🚩</span>
                                <div class="sa-text">
                                    <div style="font-weight: 800; font-size: 1.1rem; color: #ef4444;">DÍA NO LECTIVO: ${asuetoHoy.categoria.nombre.toUpperCase()}</div>
                                    <div style="font-size: 0.9rem;">${asuetoHoy.descripcion || 'La institución se encuentra cerrada o sin actividad según el calendario.'}</div>
                                </div>
                            </div>
                        </div>
                    `;
                    return; 
                }

                // --- EVENTOS INFORMATIVOS (NO BLOQUEANTES) ---
                let alertsHtml = '';
                const eventosHoy = calEvents.filter(e => e.fecha === todayIso && !e.categoria.nombre.toLowerCase().includes('asueto') && !e.categoria.nombre.toLowerCase().includes('feriado'));
                
                eventosHoy.forEach(ev => {
                    const isExams = ev.categoria.nombre.toLowerCase().includes('examen');
                    const borderColor = isExams ? '#3b82f6' : '#10b981';
                    const bgColor = isExams ? 'rgba(59, 130, 246, 0.15)' : 'rgba(16, 185, 129, 0.15)';
                    const icon = isExams ? '📑' : '🌟';
                    
                    alertsHtml += `
                        <div class="sa-alert" style="border-left: 4px solid ${borderColor}; background: linear-gradient(90deg, ${bgColor} 0%, rgba(15, 23, 42, 0.7) 100%); border-radius: 8px; margin-bottom: 0.5rem;">
                            <div class="sa-content">
                                <span class="sa-icon">${icon}</span>
                                <div class="sa-text">
                                    <div style="font-weight: 700; color: ${borderColor};">${ev.categoria.nombre.toUpperCase()}</div>
                                    <div style="font-size: 0.8rem;">${ev.descripcion || 'Evento programado para hoy.'}</div>
                                </div>
                            </div>
                        </div>
                    `;
                });
                let currentActiveAlertIds = new Set();
                const curDia = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'][now.getDay()];
                
                const ds = document.getElementById('dept-selector');
                const selId = ds ? ds.value : '';
                const deptosScope = deptos.filter(d => {
                    if (!selId || selId === 'todos' || selId === '') return true;
                    return d.id.toString() === selId;
                });

                deptosScope.forEach(dpt => {
                    const aulasDpt = aulas.filter(a => a.departamento_id === dpt.id);
                    
                    // Alertas a nivel departamento: Recreo inminente
                    const modulosDpt = modulos.filter(m => {
                        return allAsignaciones.some(as => as.modulo_id === m.id && aulasDpt.some(da => da.id === as.aula_id) && as.dia_semana === curDia);
                    }).sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));

                    for(let i=0; i<modulosDpt.length-1; i++) {
                        const m1 = modulosDpt[i];
                        const m2 = modulosDpt[i+1];
                        const rStart = Dashboard.timeToMinutes(m1.hora_fin);
                        const diffBreak = rStart - currMins;
                        
                        if (diffBreak > 0 && diffBreak <= 3) {
                            const isExcl = excluidos.some(e => e.departamento_id === dpt.id && e.dia_semana === curDia && e.modulo_id_anterior === m1.id);
                            if(!isExcl) {
                                const alertId = `break-${dpt.id}-${m1.id}`;
                                currentActiveAlertIds.add(alertId);
                                if (!Dashboard.dismissedAlerts.has(alertId)) {
                                    alertsHtml += `<div class="sa-alert break-soon"><div class="sa-content"><span class="sa-icon">☕</span><span class="sa-text">En breve (${Math.ceil(diffBreak)} min) comienza el recreo en ${dpt.nombre}. Estar atento.</span></div><button class="sa-dismiss" data-id="${alertId}">✕</button></div>`;
                                }
                            }
                        }
                    }

                    aulasDpt.forEach(aul => {
                        const asigs = allAsignaciones.filter(as => as.aula_id === aul.id && as.dia_semana === curDia);
                        let tieneClaseActiva = false;
                        let proximasClases = [];
                        
                        asigs.forEach(asig => {
                            const m = modulos.find(mod => mod.id === asig.modulo_id);
                            if(m) {
                                const start = Dashboard.timeToMinutes(m.hora_inicio);
                                const end = Dashboard.timeToMinutes(m.hora_fin);
                                
                                // ¿Clase activa?
                                // Consideramos un minuto de gracia en end para no reportar "Vacia" parpadeando.
                                if(currMins >= start && currMins < end) {
                                    tieneClaseActiva = true;
                                    const diffEnd = end - currMins;
                                    // 3. Fin de Clase inminente
                                    if(diffEnd > 0 && diffEnd <= 3) {
                                        const docenteInfo = docentes.find(dc => dc.id === asig.docente_id);
                                        const docApe = docenteInfo ? docenteInfo.apellido : 'S/D';
                                        const alertId = `end-${aul.id}-${m.id}`;
                                        currentActiveAlertIds.add(alertId);
                                        if (!Dashboard.dismissedAlerts.has(alertId)) {
                                            alertsHtml += `<div class="sa-alert end-class"><div class="sa-content"><span class="sa-icon">⏳</span><span class="sa-text">Faltan ${Math.ceil(diffEnd)} min para término de clase en <b>${aul.nombre}</b> (Prof. ${docApe}).</span></div><button class="sa-dismiss" data-id="${alertId}">✕</button></div>`;
                                        }
                                    }
                                }
                                
                                // ¿Clase por empezar?
                                const diffStart = start - currMins;
                                if(diffStart > 0 && diffStart <= 3) {
                                    const alertId = `start-${aul.id}-${m.id}`;
                                    currentActiveAlertIds.add(alertId);
                                    if (!Dashboard.dismissedAlerts.has(alertId)) {
                                        alertsHtml += `<div class="sa-alert start-class"><div class="sa-content"><span class="sa-icon">🚪</span><span class="sa-text">En ${Math.ceil(diffStart)} min inicia clase en <b>${aul.nombre}</b>. Alumnos pueden estar esperando.</span></div><button class="sa-dismiss" data-id="${alertId}">✕</button></div>`;
                                    }
                                }
                            }
                        });

                        // 1. Aula Vacía o en Recreo (no tiene clase activa)
                        // Para evitar llenar de alertas eternas, ¿generamos esto? 
                        // El usuario lo pidió: "si en algún departamento hay aulas que no tienen curso asignado ni docente poner en el aviso... revisar que este todo apagado"
                        // Además, si está en recreo también. "no tiene clase activa" abarca ambos: vacío definitivo o recreo temporal.
                        if(!tieneClaseActiva && currMins >= Dashboard.timeRange.start && currMins <= Dashboard.timeRange.end) {
                            const alertId = `empty-${aul.id}`;
                            currentActiveAlertIds.add(alertId);
                            if (!Dashboard.dismissedAlerts.has(alertId)) {
                                alertsHtml += `<div class="sa-alert empty"><div class="sa-content"><span class="sa-icon">⚠️</span><span class="sa-text"><b>${aul.nombre}</b> (${dpt.nombre}): Sin clase activa. Revisar apagada y cerrada.</span></div><button class="sa-dismiss" data-id="${alertId}">✕</button></div>`;
                            }
                        }
                    });
                });
                
                // Limpieza inteligente: si una alerta que fue desactivada ya no está sucediendo en el sistema actual, la olvidamos.
                // Esto permite que mánana, cuando la condición se repita, la alerta vuelva a mostrarse.
                for (const dismissedId of Dashboard.dismissedAlerts) {
                    if (!currentActiveAlertIds.has(dismissedId)) {
                        Dashboard.dismissedAlerts.delete(dismissedId);
                    }
                }
                
                // Evitamos reescribir el DOM si no cambiaron las alertas para preservar animaciones y scroll
                if (alertsPanel.innerHTML !== alertsHtml) {
                    alertsPanel.innerHTML = alertsHtml;
                }
            }
        };

        updateUI();
        if (Dashboard.timer) clearInterval(Dashboard.timer);
        Dashboard.timer = setInterval(updateUI, 1000); 

        // Smooth Scroll Loop de 60 FPS
        if (Dashboard.scrollRaf) cancelAnimationFrame(Dashboard.scrollRaf);
        const smoothScrollLoop = () => {
            if (!Dashboard.isUserScrolling) {
                const globalScroll = document.getElementById('timeline-scroll');
                const trackContent = document.querySelector('.track-content');
                
                if (globalScroll && trackContent) {
                    const now = new Date();
                    const currMinsExact = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60 + now.getMilliseconds() / 60000;
                    
                    let pct = 0;
                    if (currMinsExact <= Dashboard.timeRange.start) {
                        pct = 0;
                    } else if (currMinsExact >= Dashboard.timeRange.end) {
                        pct = 1;
                    } else {
                        pct = ((currMinsExact - Dashboard.timeRange.start) / (Dashboard.timeRange.end - Dashboard.timeRange.start));
                    }
                    
                    const scrollRect = globalScroll.getBoundingClientRect();
                    const trackRect = trackContent.getBoundingClientRect();
                    
                    // Constante Estructural: Offset estático (en pixeles) del contenedor track respecto a la superficie interior completa.
                    // Al agregar 'scrollLeft' anulamos el comportamiento variable ocasionado por nuestro propio deslizamiento en pantalla.
                    const absoluteTrackLeft = trackRect.left - scrollRect.left + globalScroll.scrollLeft;
                    
                    // Distancia intra-pista sobre la que debe ubicarse la aguja:
                    const targetPixelInsideTrack = trackContent.clientWidth * pct;
                    
                    // Cálculo magistral: Distancia perimetral absoluta que requerimos empujar a la izquierda
                    // para que nuestra coordenada de la hora acabe en la mitad geométrica del monitor.
                    const idealScrollLeft = absoluteTrackLeft + targetPixelInsideTrack - (scrollRect.width / 2);
                    
                    const diff = idealScrollLeft - globalScroll.scrollLeft;
                    if (Math.abs(diff) > 0.5) {
                        globalScroll.scrollLeft += diff * 0.15;
                    }
                }
            }
            Dashboard.scrollRaf = requestAnimationFrame(smoothScrollLoop);
        };
        smoothScrollLoop();
    },

    timeToMinutes: (timeStr) => {
        const [h, m] = timeStr.split(':').map(Number);
        return h * 60 + m;
    }
};
