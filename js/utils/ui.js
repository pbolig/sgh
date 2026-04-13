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
        // Quitar la clase inicial si existe
        document.body.classList.remove('loading-active');
        UI.hideLoader(); // Asegurar que empiece oculto tras el init
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
                UI.loader.classList.add('hidden');
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
    }
};
