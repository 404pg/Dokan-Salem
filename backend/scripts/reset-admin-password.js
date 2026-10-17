import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import readline from 'node:readline';

import sql from 'mssql/msnodesqlv8.js';

const backendDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
try {
  process.loadEnvFile(path.join(backendDirectory, '.env'));
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
  throw new Error('backend/.env was not found.');
}

if (!process.stdin.isTTY || !process.stdout.isTTY) {
  throw new Error('Run this script in an interactive PowerShell or Command Prompt window.');
}

readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);
process.stdin.resume();

function readHidden(prompt) {
  return new Promise((resolve, reject) => {
    let value = '';
    process.stdout.write(prompt);

    const onKeypress = (character, key = {}) => {
      if (key.ctrl && key.name === 'c') {
        process.stdin.off('keypress', onKeypress);
        process.stdout.write('\n');
        reject(new Error('Password reset cancelled.'));
        return;
      }
      if (key.name === 'return' || key.name === 'enter') {
        process.stdin.off('keypress', onKeypress);
        process.stdout.write('\n');
        resolve(value);
        return;
      }
      if (key.name === 'backspace') {
        if (value.length) {
          value = Array.from(value).slice(0, -1).join('');
          process.stdout.write('\b \b');
        }
        return;
      }
      if (character && !key.ctrl && !key.meta && !/[\u0000-\u001f\u007f]/.test(character)) {
        value += character;
        process.stdout.write('*');
      }
    };

    process.stdin.on('keypress', onKeypress);
  });
}

let pool;
try {
  const email = (await readHidden('Administrator email: ')).trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    throw new Error('Enter a valid administrator email.');
  }

  const newPassword = await readHidden('New password (12-256 characters): ');
  if (newPassword.length < 12 || newPassword.length > 256) {
    throw new Error('The password must be between 12 and 256 characters.');
  }
  const confirmation = await readHidden('Confirm new password: ');
  if (newPassword !== confirmation) {
    throw new Error('The passwords do not match.');
  }

  pool = await sql.connect({
    server: process.env.SQL_SERVER || 'localhost',
    database: process.env.SQL_DATABASE || 'DokanSaleem',
    driver: process.env.SQL_DRIVER || 'ODBC Driver 17 for SQL Server',
    options: {
      trustedConnection: true,
      trustServerCertificate: true,
      instanceName: process.env.SQL_INSTANCE || 'SQLEXPRESS',
    },
    connectionTimeout: 15000,
    requestTimeout: 30000,
  });

  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(newPassword, salt, 64);
  const result = await pool.request()
    .input('email', sql.NVarChar(254), email)
    .input('hash', sql.VarBinary(64), hash)
    .input('salt', sql.VarBinary(32), salt)
    .query(`UPDATE dbo.app_users
      SET password_hash = @hash, password_salt = @salt
      WHERE email = @email AND role = N'admin'`);

  if (result.rowsAffected[0] !== 1) {
    throw new Error('No administrator with that email was found, or the update did not affect exactly one account.');
  }
  process.stdout.write('Administrator password reset successfully. Sign in using the new password.\n');
} finally {
  if (pool) await pool.close();
  process.stdin.setRawMode(false);
  process.stdin.pause();
}
