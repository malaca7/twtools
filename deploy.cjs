const path = require('path');
const os = require('os');
const { execSync } = require('child_process');
const ghpages = require('gh-pages');

// Ensure Git is in PATH on Windows
const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
const gitPaths = [
  path.join(localAppData, 'Programs', 'Git', 'cmd'),
  path.join(localAppData, 'Programs', 'Git', 'bin'),
  'C:\\Program Files\\Git\\cmd',
  'C:\\Program Files\\Git\\bin',
  'C:\\Program Files (x86)\\Git\\cmd',
  'C:\\Program Files (x86)\\Git\\bin',
];

for (const p of gitPaths) {
  if (!process.env.PATH.includes(p)) {
    process.env.PATH = `${p};${process.env.PATH}`;
  }
}

// Extract message from CLI arguments or pull the latest git commit message automatically
let message = process.argv[2];
if (!message) {
  try {
    message = execSync('git log -1 --pretty=%B', { encoding: 'utf8' }).trim();
  } catch {
    message = 'deploy: atualizações e melhorias na plataforma';
  }
}

console.log(`🚀 Iniciando deploy para branch gh-pages...`);
console.log(`📝 Título do deploy: "${message}"`);

const fs = require('fs');
const distPath = path.resolve(__dirname, 'dist');

// Garante presença mandatória dos arquivos vitais do GitHub Pages
if (fs.existsSync(distPath)) {
  fs.writeFileSync(path.join(distPath, '.nojekyll'), '');
  const indexPath = path.join(distPath, 'index.html');
  const notFoundPath = path.join(distPath, '404.html');
  if (fs.existsSync(indexPath) && !fs.existsSync(notFoundPath)) {
    fs.copyFileSync(indexPath, notFoundPath);
  }
  const cnamePath = path.join(distPath, 'CNAME');
  if (!fs.existsSync(cnamePath)) {
    fs.writeFileSync(cnamePath, 'twin.malaca.com.br\n');
  }
  // Meta de build com timestamp para forçar commit único na gh-pages e acionar o runner
  fs.writeFileSync(
    path.join(distPath, 'build-meta.json'),
    JSON.stringify({
      deployed_at: new Date().toISOString(),
      timestamp: Date.now(),
      message,
    }, null, 2)
  );
}

// Limpa cache antigo do gh-pages para evitar estado retido
const cachePath = path.resolve(__dirname, 'node_modules/.cache/gh-pages');
if (fs.existsSync(cachePath)) {
  try {
    fs.rmSync(cachePath, { recursive: true, force: true });
  } catch {}
}

ghpages.publish(
  distPath,
  {
    message,
    dotfiles: true,
  },
  (err) => {
    if (err) {
      console.error('❌ Erro no deploy para gh-pages:', err);
      process.exit(1);
    }
    console.log('✅ Deploy para gh-pages concluído com sucesso!');
  }
);
