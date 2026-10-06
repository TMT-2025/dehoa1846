import { spawn } from 'child_process';
import path from 'path';

console.log('\x1b[36m%s\x1b[0m', '=====================================================');
console.log('\x1b[32m%s\x1b[0m', '  🚀 ĐANG KHỞI ĐỘNG HỆ THỐNG FULLSTACK HÓA HỌC THPT 2018');
console.log('\x1b[36m%s\x1b[0m', '=====================================================');

// 1. Start Backend Server
const backend = spawn('node', ['server/index.js'], {
  stdio: 'inherit',
  shell: true,
  env: process.env
});

backend.on('error', (err) => {
  console.error('\x1b[31m%s\x1b[0m', 'Lỗi Backend:', err);
});

// 2. Start Vite Frontend
const frontend = spawn('npx', ['vite', '--host'], {
  stdio: 'inherit',
  shell: true,
  env: process.env
});

frontend.on('error', (err) => {
  console.error('\x1b[31m%s\x1b[0m', 'Lỗi Frontend Vite:', err);
});

const cleanup = () => {
  console.log('\nĐang dừng hệ thống...');
  backend.kill();
  frontend.kill();
  process.exit();
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
