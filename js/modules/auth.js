// js/modules/auth.js
export const Auth = {
    login: async (username, password) => {
        console.log('Login attempt:', username);
        // Implementación futura con Turso y bcrypt
        return { success: true, user: { username, rol: 'admin' } };
    },
    logout: () => {
        sessionStorage.clear();
        window.location.reload();
    },
    isLoggedIn: () => {
        return !!sessionStorage.getItem('jwt');
    }
};
