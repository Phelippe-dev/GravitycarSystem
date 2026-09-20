const fs = require('fs');
const path = require('path');

const fixMap = {
  // Fix double encoded UTF-8 strings
  'TÃ‰CNICA': 'TÉCNICA',
  'TÃ©cnica': 'Técnica',
  'InspeÃ§Ã£o': 'Inspeção',
  'CONDIÃ‡ÃƒO': 'CONDIÇÃO',
  'MECÃ‚NICA': 'MECÂNICA',
  'DOCUMENTAÃ‡ÃƒO': 'DOCUMENTAÇÃO',
  'ESPECIFICAÃ‡Ã•ES': 'ESPECIFICAÇÕES',
  'pÃ¡tio': 'pátio',
  'apresentaÃ§Ã£o': 'apresentação',
  'especificaÃ§Ã£o': 'especificação',
  'caracterÃsticas': 'características',
  'veÃculo': 'veículo',
  'VeÃculo': 'Veículo',
  'VEÃ\x8dCULO': 'VEÍCULO',
  'Ãs': 'às',
  'â€¢': '•',
  'Ã§Ã£o': 'ção',
  'Ã§Ãµes': 'ções',
  'Ã¡': 'á',
  'Ã¢': 'â',
  'Ã£': 'ã',
  'Ã©': 'é',
  'Ãª': 'ê',
  'Ã­': 'í',
  'Ã³': 'ó',
  'Ãµ': 'õ',
  'Ãº': 'ú',
  'Ã§': 'ç',
  'Ã‰': 'É',
  'Ã‡': 'Ç',
  'Ã•': 'Õ',
  'Ãƒ': 'Ã',
  'Ã‚': 'Â',
  'Ã“': 'Ó',
  'Ã ': 'Í',
  'DisponÃ\xadvel': 'Disponível',
  'ManutenÃ§Ã£o': 'Manutenção',

  // Remove Emojis
  'ðŸ”µ': '',
  'ðŸŸ¡': '',
  'ðŸŸ¢': '',
  'ðŸ›¡ï¸': '',
  'ðŸ“‹': '',
  '🚗': '',
  '🚘': '',
  '🛡️': '',
  '📋': '',
  '🔵': '',
  '🟡': '',
  '🟢': '',
  '👑': '',
  '🏢': '',
  '📊': '',
  '💼': '',
  '✅': '',
  '💰': '',
  '💵': '',
  '📈': '',
  '⚙️': '',
  '⚠️': '',
  'ℹ️': '',
  '❌': '',
  '🔒': '',
  '📝': '',
  '🏦': '',
  '💳': '',
  '💲': '',
  '🔑': ''
};

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;
  
  for (const [bad, good] of Object.entries(fixMap)) {
    content = content.split(bad).join(good);
  }
  
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed:', filePath);
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

walkDir(path.join(__dirname, '..')); // Root
console.log('Encoding and emojis fixed globally.');
