// generate-passwords.js — ejecutar una sola vez
// Nota: Requiere bcryptjs instalado: npm install bcryptjs
const bcrypt = require('bcryptjs');

async function main() {
    const adminHash = await bcrypt.hash('Admin2026!', 10);
    const invitadoHash = await bcrypt.hash('Invitado2026!', 10);
    
    console.log('Admin hash:', adminHash);
    console.log('Invitado hash:', invitadoHash);
    
    console.log('\nSQL para ejecutar en Turso:');
    console.log(`UPDATE usuarios SET password_hash = '${adminHash}' WHERE username = 'admin';`);
    console.log(`UPDATE usuarios SET password_hash = '${invitadoHash}' WHERE username = 'invitado';`);
}
main().catch(console.error);
