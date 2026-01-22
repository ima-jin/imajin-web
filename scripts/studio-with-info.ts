import { exec } from 'child_process';

console.log('\n🚀 Starting Drizzle Studio...\n');
console.log('📊 Database:', process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] || 'unknown');
console.log('🌐 Opening in browser...\n');

// Start Drizzle Studio
const studio = exec('npx drizzle-kit studio');

studio.stdout?.on('data', (data) => {
  console.log(data.toString());
});

studio.stderr?.on('data', (data) => {
  console.error(data.toString());
});

studio.on('close', (code) => {
  console.log(`\n✅ Drizzle Studio closed with code ${code}`);
  process.exit(code || 0);
});
