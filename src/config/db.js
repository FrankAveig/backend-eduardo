const mysql = require('mysql2/promise');
require('dotenv').config();

// Crear un pool de conexiones
const pool = mysql.createPool({
  host: process.env.DB_HOST || '162.241.62.48 ',
  user: process.env.DB_USER || 'fpaviega',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Función para probar la conexión
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Conexión exitosa a la base de datos MySQL');
   
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Error de conexión a la base de datos:', error);
    return false;
  }
};

module.exports = { pool, testConnection }; 