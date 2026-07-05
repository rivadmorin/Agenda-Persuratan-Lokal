const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgres://postgres:postgres@localhost:5432/app' });
pool.query('SELECT 1').then(() => console.log('connected')).catch(console.error).finally(() => pool.end());
