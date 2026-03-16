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
        return sessionStorage.getItem('jwt');
    }
};
