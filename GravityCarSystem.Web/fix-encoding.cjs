const fs = require('fs');
const path = require('path');

const mappings = {
  'ÃƒÂ£': 'ã',
  'ÃƒÂ§': 'ç',
  'ÃƒÂ©': 'é',
  'ÃƒÂ³': 'ó',
  'ÃƒÂ­': 'í',
  'ÃƒÂ¢': 'â',
  'ÃƒÂµ': 'õ',
  'ÃƒÂª': 'ê',
  'ÃƒÂ¡': 'á',
  'ÃƒÂº': 'ú',
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
  'Ã§Ã£': 'çã',
  'Ã§Ãµ': 'çõ',
  'â€¢': '•',
  'ðŸ”µ': '🔵',
  'ðŸŸ¡': '🟡',
  'ðŸŸ¢': '🟢',
  'ðŸ›¡ï¸': '🛡️',
  'ðŸ“‹': '📋'
};

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;
  for (const [bad, good] of Object.entries(mappings)) {
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
