/**
 * Script para generar hashes de contraseñas usando bcrypt
 * 
 * Uso:
 * 1. Asegúrate de tener Node.js instalado
 * 2. Instala bcrypt: npm install bcrypt
 * 3. Ejecuta: node generate_password_hash.js tuContraseña
 * 
 * Si no proporcionas una contraseña como argumento, se te pedirá ingresarla.
 */

const bcrypt = require('bcrypt');
const readline = require('readline');

// Configuración (mismo factor de costo usado en la API)
const saltRounds = 10;

// Función para generar un hash de contraseña
async function generateHash(password) {
  try {
    const hash = await bcrypt.hash(password, saltRounds);
    
    console.log('\n=== Resultado ===');
    console.log('Contraseña original:', password);
    console.log('Hash bcrypt:', hash);
    console.log('\nPara usar en SQL:');
    console.log(`INSERT INTO usuarios (nombre_completo, correo, contrasenia, rol_id) 
VALUES ('Nombre Usuario', 'correo@ejemplo.com', '${hash}', 1);`);
    
    // Verificar el hash (esto es solo para demostración)
    const match = await bcrypt.compare(password, hash);
    console.log('\nVerificación de hash:', match ? 'Correcta ✓' : 'Incorrecta ✗');
  } catch (error) {
    console.error('Error al generar el hash:', error.message);
  }
}

generateHash('Admin123#');

// Obtener la contraseña desde los argumentos de línea de comandos o pedirla
async function main() {
  let password = process.argv[2]; // Tomar la contraseña desde los argumentos

  if (!password) {
    // Si no hay argumento, pedir la contraseña por consola
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    password = await new Promise(resolve => {
      rl.question('Ingresa la contraseña para hashear: ', (answer) => {
        rl.close();
        resolve(answer);
      });
    });
  }

  if (!password || password.trim() === '') {
    console.error('Error: Debes proporcionar una contraseña.');
    process.exit(1);
  }

  await generateHash(password);
}

// Ejecutar el script
main(); 