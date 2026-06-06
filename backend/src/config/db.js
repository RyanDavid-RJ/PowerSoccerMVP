const mysql = require('mysql2/promise');

// Criando um "Pool" de conexões. É melhor que uma conexão única pois 
// gerencia múltiplas requisições simultâneas sem derrubar o servidor.
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 12360,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: {
        rejectUnauthorized: false // Necessário para a conexão segura (SSL) obrigatória do Aiven
    }
});

// Teste de conexão automático ao iniciar
pool.getConnection()
    .then(conn => {
        console.log('✅ Conexão blindada com o banco de dados Aiven estabelecida!');
        conn.release(); // Libera a conexão de volta para o pool
    })
    .catch(err => {
        console.error('❌ Erro fatal ao conectar no banco de dados:', err);
    });

module.exports = pool;