const fs = require('fs');
const path = require('path');

const mappings = {
  'Ã£': 'ã',
  'Ã§': 'ç',
  'Ã©': 'é',
  'Ã³': 'ó',
  'Ã­': 'í',
  'Ã¢': 'â',
  'Ãµ': 'õ',
  'Ãª': 'ê',
  'Ã¡': 'á',
  'Ãº': 'ú',
  'Ã‰': 'É',
  'Ã‡': 'Ç',
  'Ã•': 'Õ',
  'Ãƒ': 'Ã',
  'Ã‚': 'Â',
  'Ã“': 'Ó',
  'Ã': 'Í',
  'Ã ': 'à',
  'Ãs': 'às',
  'Ã§Ã£': 'çã',
  'Ã§Ãµ': 'çõ',
  'Ã§Ã£o': 'ção',
  'Ã§Ãµes': 'ções',
  'â€¢': '•',
  'ðŸ”µ': '🔵',
  'ðŸŸ¡': '🟡',
  'ðŸŸ¢': '🟢',
  'ðŸ›¡ï¸': '🛡️',
  'ðŸ“‹': '📋',
  'caracterÃsticas': 'características',
  'veÃculo': 'veículo',
  'pÃ¡tio': 'pátio'
};

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;
  
  // Apply larger patterns first to avoid partial matches replacing incorrectly
  const keys = Object.keys(mappings).sort((a, b) => b.length - a.length);
  
  for (const bad of keys) {
    const good = mappings[bad];
    content = content.split(bad).join(good);
  }
  
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed:', filePath);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      fixFile(fullPath);
    }
  }
}

walkDir(path.join(__dirname, 'src'));
console.log('Done');
