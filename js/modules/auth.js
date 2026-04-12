// js/modules/auth.js
export const Auth = {
    login: async (username, password) => {
        try {
            const params = new URLSearchParams();
            params.append('username', username);
            params.append('password', password);

            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: params
            });

            if (!response.ok) {
                let errorMessage = 'Error de autenticación';
                try {
                    const errorData = await response.json();
                    if (errorData.detail) {
                        errorMessage = Array.isArray(errorData.detail) 
                            ? errorData.detail.map(e => e.msg).join(', ') 
                            : errorData.detail;
                    }
                } catch (e) {
                    errorMessage = `Error del servidor (${response.status}): El backend no respondió con JSON válido.`;
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();
            
            // Guardar token y datos de usuario
            sessionStorage.setItem('jwt', data.access_token);
            sessionStorage.setItem('user', JSON.stringify(data.user));

            // Fetch initial permissions
            try {
                const permsResponse = await fetch('/api/mis-permisos', {
                    headers: { 'Authorization': `Bearer ${data.access_token}` }
                });
                if (permsResponse.ok) {
                    const perms = await permsResponse.json();
                    sessionStorage.setItem('permisos', JSON.stringify(perms));
                } else {
                    sessionStorage.setItem('permisos', '[]');
                }
            } catch (e) {
                console.error('Error fetching permissions:', e);
            }
            
            return { success: true, user: data.user };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: error.message };
        }
    },
    logout: () => {
        sessionStorage.clear();
        window.location.reload();
    },
    isLoggedIn: () => {
        return !!sessionStorage.getItem('jwt');
    },
    getUser: () => {
        const userStr = sessionStorage.getItem('user');
        if (!userStr || userStr === 'undefined') return null;
        try {
            return JSON.parse(userStr);
        } catch (e) {
            console.error('Error parsing user from session:', e);
            return null;
        }
    },
    getToken: () => {
        const token = sessionStorage.getItem('jwt');
        if (!token) console.warn('DEBUG AUTH: getToken() retornó null');
        return token;
    },
    // Método para centralizar el manejo de errores de respuesta
    handleResponse: async (response) => {
        if (response.status === 401) {
            console.error('DEBUG AUTH: Recibido 401 (Unauthorized). Forzando cierre de sesión.');
            Auth.logout();
            window.location.reload(); // Recargar para volver al login
            return null;
        }
        return response;
    },
    getPermissions: () => {
        const permsStr = sessionStorage.getItem('permisos');
        if (!permsStr) return [];
        try {
            return JSON.parse(permsStr);
        } catch (e) {
            return [];
        }
    },
    hasPermission: (modulo, nivelRequerido = 'lectura') => {
        const perms = Auth.getPermissions();
        const p = perms.find(perm => perm.modulo?.nombre === modulo);
        if (!p) return false;
        
        const niveles = { 'ninguno': 0, 'lectura': 1, 'edicion': 2 };
        return niveles[p.nivel] >= niveles[nivelRequerido];
    }
};
