// app.js - Lógica principal
import { Auth } from './js/modules/auth.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log('App inicializada');
    
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const user = document.getElementById('username').value;
            const pass = document.getElementById('password').value;
            
            const result = await Auth.login(user, pass);
            if (result.success) {
                document.getElementById('login-screen').classList.add('hidden');
                document.getElementById('main-screen').classList.remove('hidden');
                document.getElementById('user-display').textContent = result.user.username;
            } else {
                document.getElementById('login-error').classList.remove('hidden');
            }
        });
    }

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => Auth.logout());
    }
});
