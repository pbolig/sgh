// app.js - Lógica principal
import { Auth } from './js/modules/auth.js?v=2.6.18';
import { Departamentos } from './js/modules/departamentos.js?v=2.6.18';
import { Docentes } from './js/modules/docentes.js?v=2.6.18';
import { Materias } from './js/modules/materias.js?v=2.6.18';
import { Aulas } from './js/modules/aulas.js?v=2.6.18';
import { Comisiones } from './js/modules/comisiones.js?v=2.6.18';
import { Editor } from './js/modules/editor.js?v=2.6.18';
import { Dashboard } from './js/modules/dashboard.js?v=2.6.18';
import { Reportes } from './js/modules/reportes.js?v=2.6.18';
import { Cargos } from './js/modules/cargos.js?v=2.6.18';
import { CargoAsignaciones } from './js/modules/cargo_asignaciones.js?v=2.6.18';
import { Calendario } from './js/modules/calendario.js?v=2.6.18';
import { PAD } from './js/modules/pad.js?v=2.6.18';
import { Instituciones } from './js/modules/instituciones.js?v=2.6.18';
import { Permisos } from './js/modules/permisos.js?v=2.6.18';
import { Usuarios } from './js/modules/usuarios.js?v=2.6.18';
import { Comunicaciones } from './js/modules/comunicaciones.js?v=2.6.18';
import { UI } from './js/utils/ui.js?v=2.6.18';

document.addEventListener('DOMContentLoaded', () => {
    // Inicializar UI y Interceptor Global
    UI.init();
    
    // Inicializar temporizador de inactividad
    Auth.setupInactivityTimer();
    
    // Verificar si ya está logueado y validar sesión
    if (Auth.isLoggedIn()) {
        Auth.init().then(valid => {
            if (valid) {
                showMainScreen();
            } else {
                Auth.logout();
            }
        }).catch(() => {
            Auth.logout();
        });
    }

    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const user = document.getElementById('username').value;
            const pass = document.getElementById('password').value;
            
            const result = await Auth.login(user, pass);
            if (result.success) {
                showMainScreen();
            } else {
                const errorEl = document.getElementById('login-error');
                errorEl.textContent = result.error || 'Credenciales inválidas';
                errorEl.classList.remove('hidden');
            }
        });
    }

    function showMainScreen() {
        const user = Auth.getUser();
        if (!user) {
            console.warn('Session found but user data is missing. Logging out.');
            Auth.logout();
            return;
        }
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('main-screen').classList.remove('hidden');
        document.getElementById('user-display').textContent = user.username;
        
        // Mostrar link de instituciones solo si es admin
        const navInst = document.getElementById('nav-instituciones');
        if (navInst && (user.rol === 'admin' || user.rol === 'directivo')) {
            navInst.classList.remove('hidden');
        }

        // Mostrar link de permisos solo si es admin o directivo
        const navPerms = document.getElementById('nav-permisos');
        if (navPerms && (user.rol === 'admin' || user.rol === 'directivo')) {
            navPerms.classList.remove('hidden');
        }

        // Mostrar link de usuarios solo si es admin o directivo
        const navUsers = document.getElementById('nav-usuarios');
        if (navUsers && (user.rol === 'admin' || user.rol === 'directivo')) {
            navUsers.classList.remove('hidden');
        }

        // Filtrado dinámico del sidebar basado en permisos
        filterSidebar(user);

        initHeaderToggle();
        initSidebar();
        
        // Cargar selectores y luego inicializar navegación para que el dashboard
        // encuentre una institución seleccionada al arrancar
        populateInstSelector().then(() => {
            initNavigation();
        });

        // Escuchar cambios en los datos de otros módulos
        window.addEventListener('data-changed', (e) => {
            if (e.detail.type === 'departamentos') {
                populateDeptSelector(document.getElementById('inst-selector').value);
            }
            if (e.detail.type === 'instituciones') {
                populateInstSelector();
            }
        });
    }

    function initSidebar() {
        const sidebar = document.getElementById('sidebar');
        const toggleBtn = document.getElementById('sidebar-toggle');
        
        // Cargar estado previo
        if (localStorage.getItem('sidebar-collapsed') === 'true') {
            sidebar.classList.add('collapsed');
        }

        if (toggleBtn) {
            toggleBtn.onclick = () => {
                sidebar.classList.toggle('collapsed');
                // En móvil usamos una clase distinta para el overlay
                if (window.innerWidth <= 768) {
                    sidebar.classList.toggle('mobile-open');
                }
                localStorage.setItem('sidebar-collapsed', sidebar.classList.contains('collapsed'));
            };
        }

        const mobileBtn = document.getElementById('mobile-menu-btn');
        if (mobileBtn) {
            mobileBtn.onclick = () => {
                sidebar.classList.toggle('mobile-open');
            };
        }
    }

    function initHeaderToggle() {
        const topBar = document.getElementById('top-bar');
        const toggleBtn = document.getElementById('header-toggle');
        
        if (localStorage.getItem('header-collapsed') === 'true') {
            topBar.classList.add('collapsed');
        }

        if (toggleBtn) {
            toggleBtn.onclick = () => {
                topBar.classList.toggle('collapsed');
                localStorage.setItem('header-collapsed', topBar.classList.contains('collapsed'));
            };
        }
    }

    async function populateInstSelector() {
        const selector = document.getElementById('inst-selector');
        if (!selector) return;
        
        const list = await Instituciones.list();
        selector.innerHTML = '<option value="">Seleccione Institución</option>' + 
            list.map(i => `<option value="${i.id}">${i.nombre}</option>`).join('');
            
        // Restaurar selección previa o seleccionar la primera
        const saved = localStorage.getItem('selected-inst-id');
        if (saved && list.find(i => i.id == saved)) {
            selector.value = saved;
        } else if (list.length > 0) {
            selector.value = list[0].id;
            localStorage.setItem('selected-inst-id', list[0].id);
        }

        // Guardar turnos de la institución actual
        const currentInst = list.find(i => i.id == selector.value);
        if (currentInst) {
            localStorage.setItem('active-shifts', currentInst.turnos_activos || "mañana,tarde,noche");
        }

        // Si solo hay una institución y es nueva selección, avisar al dashboard
        if (list.length === 1 && !saved) {
            localStorage.setItem('selected-inst-id', list[0].id);
        }

        selector.onchange = (e) => {
            const instId = e.target.value;
            localStorage.setItem('selected-inst-id', instId);
            
            const inst = list.find(i => i.id == instId);
            if (inst) {
                localStorage.setItem('active-shifts', inst.turnos_activos || "mañana,tarde,noche");
            }

            populateDeptSelector(instId);
            
            // Refrescar vista actual para aplicar el filtro de institución
            const activeLi = document.querySelector('#main-nav li.active a');
            if (activeLi) {
                loadView(activeLi.getAttribute('data-route'));
            }
        };

        // Cargar departamentos para la institución seleccionada
        populateDeptSelector(selector.value);
    }

    async function populateDeptSelector(instId) {
        const selector = document.getElementById('dept-selector');
        if (!selector) return;

        if (!instId) {
            selector.innerHTML = '<option value="">Todos los Departamentos / Carreras</option>';
            return;
        }
        
        const deptos = await Departamentos.list(instId);
        selector.innerHTML = '<option value="">🏛️/🎓 Todos los Deptos / Carreras</option>' + 
            deptos.map(d => `<option value="${d.u_id}">${d.icono} ${d.nombre}</option>`).join('');
            
        // Restaurar selección previa o seleccionar la primera si solo hay una
        const saved = localStorage.getItem('selected-dept-id');
        if (saved && deptos.find(d => d.u_id == saved)) {
            selector.value = saved;
        } else if (deptos.length === 1) {
            selector.value = deptos[0].u_id;
            localStorage.setItem('selected-dept-id', deptos[0].u_id);
        }

        selector.onchange = (e) => {
            localStorage.setItem('selected-dept-id', e.target.value);
            // Refrescar vista actual
            const activeLi = document.querySelector('#main-nav li.active a');
            if (activeLi) {
                loadView(activeLi.getAttribute('data-route'));
            }
        };
    }

    function filterSidebar(user) {
        if (user.rol === 'admin' || user.rol === 'directivo') return; // Acceso total

        const perms = Auth.getPermissions();
        console.log('Filtrando menú para:', user.username, perms);

        const navLinks = document.querySelectorAll('#main-nav a[data-route]');
        navLinks.forEach(link => {
            const route = link.getAttribute('data-route');
            if (route === 'dashboard') return; // Siempre visible

            const p = perms.find(perm => perm.modulo?.nombre === route);
            if (!p || p.nivel === 'ninguno') {
                link.parentElement.classList.add('hidden');
            } else {
                link.parentElement.classList.remove('hidden');
            }
        });
    }

    function initNavigation() {
        const navLinks = document.querySelectorAll('#main-nav a');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                // Usar currentTarget para asegurar que obtenemos el <a> aunque se clickee en el <span> o emoji
                const route = e.currentTarget.getAttribute('data-route');
                if (route) {
                    loadView(route);
                    // Actualizar estado activo
                    navLinks.forEach(l => l.parentElement.classList.remove('active'));
                    link.parentElement.classList.add('active');

                    // En móvil, cerrar el sidebar tras clickear
                    if (window.innerWidth <= 768) {
                        const sidebar = document.getElementById('sidebar');
                        sidebar.classList.remove('mobile-open');
                    }
                }
            });
        });
        
        // Cargar vista inicial
        loadView('dashboard');
    }

    // Hacer loadView accesible globalmente
    window.loadView = loadView;

    async function loadView(route) {
        if (!route) return;
        const content = document.getElementById('view-container');
        const title = document.getElementById('page-title');
        
        // Limpiar contenedor y Reset de clases de padding
        content.innerHTML = '<div class="loading">Cargando...</div>';
        content.classList.remove('minimal-padding');
        
        if (route === 'editor') {
            title.textContent = 'Editor de Horarios';
            content.classList.add('minimal-padding');
        } else if (route === 'departamentos') {
            title.textContent = 'Departamentos / Carreras';
        } else if (route === 'permisos') {
            title.textContent = 'Gestión de Accesos';
        } else if (route === 'usuarios') {
            title.textContent = 'Gestión de Usuarios';
        } else {
            title.textContent = route.charAt(0).toUpperCase() + route.slice(1);
        }

        // --- PROTECCIÓN DE RUTA Y MODO LECTURA ---
        content.classList.remove('read-only-mode');
        
        const user = Auth.getUser();
        if (user.rol !== 'admin' && user.rol !== 'directivo') {
            const perms = Auth.getPermissions();
            const p = perms.find(perm => perm.modulo?.nombre === route);
            
            if (route !== 'dashboard' && (!p || p.nivel === 'ninguno')) {
                content.innerHTML = '<div class="error-message">Acceso denegado: No tiene permisos para ver este módulo.</div>';
                return;
            }

            if (p && p.nivel === 'lectura') {
                content.classList.add('read-only-mode');
                // Inyectamos un mensaje sutil
                const roMsg = document.createElement('div');
                roMsg.className = 'info-banner';
                roMsg.innerHTML = 'ℹ️ Modo Solo Lectura: No tiene permisos para realizar modificaciones.';
                content.prepend(roMsg);
            }
        }

        switch(route) {
            case 'departamentos':
                await Departamentos.render('view-container');
                break;
            case 'docentes':
                await Docentes.render('view-container');
                break;
            case 'materias':
                await Materias.render('view-container');
                break;
            case 'aulas':
                await Aulas.render('view-container');
                break;
            case 'comisiones':
                await Comisiones.render('view-container');
                break;
            case 'instituciones':
                await Instituciones.render('view-container');
                break;
            case 'editor':
                await Editor.render('view-container');
                break;
            case 'dashboard':
                await Dashboard.render('view-container');
                break;
            case 'reportes':
                await Reportes.render('view-container');
                break;
            case 'calendario':
                await Calendario.init();
                await Calendario.render();
                break;
            case 'pad':
                await PAD.init();
                await PAD.render('view-container');
                break;
            case 'cargos':
                await Cargos.render('view-container');
                break;
            case 'cargo-asignaciones':
                await CargoAsignaciones.render('view-container');
                break;
            case 'permisos':
                await Permisos.render('view-container');
                break;
            case 'usuarios':
                await Usuarios.render('view-container');
                break;
            case 'comunicaciones':
                await Comunicaciones.render('view-container');
                break;
            default:
                // Limpiar timers de dashboard si cambiamos a otra vista
                if (Dashboard.timer) {
                    clearInterval(Dashboard.timer);
                    Dashboard.timer = null;
                }
                content.innerHTML = `<h3>Sección ${route} bajo construcción</h3>`;
                break;
        }
    }

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => Auth.logout());
    }

    const printBtn = document.getElementById('print-btn');
    if (printBtn) {
        printBtn.addEventListener('click', () => window.print());
    }
});
