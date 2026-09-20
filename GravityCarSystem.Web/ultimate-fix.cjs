const fs = require('fs');
const path = require('path');

const map = {
  'Ãª': 'ê',
  'Ã¡': 'á',
  'Ã£': 'ã',
  'Ã§': 'ç',
  'Ã³': 'ó',
  'Ã­': 'í',
  'Ãµ': 'õ',
  'Ã‰': 'É',
  'Ã‡': 'Ç',
  'Ãs': 'às',
  'Ã¢': 'â',
  'Ãº': 'ú',
  'â€¢': '•',
  'â€”': '—'
};

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'latin1'); // Read as bytes!
  let original = content;
  
  // If the file actually contains double-encoded utf8, we can decode it:
  // But wait! If we read it as latin1, it is a string of bytes.
  // Actually, we can just replace the literal byte strings!
  // 'Ãª' is C3 AA in latin1.
  
  // Actually, let's just use utf8 read/write since Vite reads it as utf-8.
  content = fs.readFileSync(filePath, 'utf8');
  let originalUtf8 = content;
  
  for (let [bad, good] of Object.entries(map)) {
      content = content.split(bad).join(good);
  }
  
  // Special words
  content = content.split('NÃ­vel').join('Nível');
  content = content.split('VocÃª').join('Você');
  content = content.split('ConcessionÃ¡ria').join('Concessionária');
  content = content.split('GestÃ£o').join('Gestão');
  content = content.split('funcionÃ¡rios').join('funcionários');
  content = content.split('RelatÃ³rios').join('Relatórios');
  content = content.split('configuraÃ§Ãµes').join('configurações');
  content = content.split('mÃn').join('mín');
  content = content.split('ApresentaÃ§Ã£o').join('Apresentação');
  content = content.split('especificaÃ§Ã£o').join('especificação');
  
  if (content !== originalUtf8) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Fixed', filePath);
  }
}

function walkDir(dir) {
  if (dir.includes('node_modules') || dir.includes('bin') || dir.includes('obj') || dir.includes('.git')) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.cs')) {
      fixFile(fullPath);
    }
  }
}

walkDir(path.join(__dirname, '..'));
