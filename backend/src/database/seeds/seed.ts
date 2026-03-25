import bcrypt from 'bcryptjs';
import { pool } from '../../config/database';

async function seed() {
  const client = await pool.connect();

  try {
    const senhaHash = await bcrypt.hash('admin123', 12);

    await client.query(`
      INSERT INTO usuarios (nome, email, senha_hash, perfil)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) DO NOTHING
    `, ['Administrador', 'admin@sistema.gov.br', senhaHash, 'admin']);

    console.log('Seed completed: admin user created');
    console.log('Email: admin@sistema.gov.br');
    console.log('Password: admin123');
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
