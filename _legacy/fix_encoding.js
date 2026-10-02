const fs = require('fs');
const path = require('path');

const srcDir = 'c:\\Users\\lipeh\\OneDrive\\Desktop\\Gravity Car System\\GravityCarSystem.Web\\src';

const replacements = {
  'Ã£': 'ã',
  'Ã¡': 'á',
  'Ã©': 'é',
  'Ã³': 'ó',
  'Ã­': 'í',
  'Ã§': 'ç',
  'Ãµ': 'õ',
  'Ãª': 'ê',
  'Ã¢': 'â',
  'AÃ§Ãµes': 'Ações',
  'NÃ£o': 'Não',
  'CrÃ©ditos': 'Créditos',
  'NÂº': 'Nº',
  'Ã‡Ã•ES': 'ÇÕES',
  'Ã‡ÃƒO': 'ÇÃO',
  'Ã‰': 'É',
  'Ã\x81': 'Á',
  'ÃƒÆ’Ã¢â‚¬Â¡ÃƒÆ’Ã¢â‚¬Â¢ES': 'ÇÕES',
  'ÃƒÆ’Ã¢â‚¬Â¡ÃƒÆ’Ã¢â€šÂ¬O': 'ÇÃO',
  'ÃƒÆ’Ã‚Â¡': 'á',
  'ÃƒÆ’Ã‚Â©': 'é',
  'ÃƒÆ’Ã‚Â­': 'í',
  'ÃƒÆ’Ã‚Â³': 'ó',
  'ÃƒÆ’Ã‚Âº': 'ú',
  'ÃƒÆ’Ã‚Â§': 'ç',
  'ÃƒÆ’Ã‚Â£': 'ã',
  'ÃƒÆ’Ã‚Âµ': 'õ',
  'ÃƒÆ’Ã¢â‚¬Å“': 'Ó',
  'ÃƒÆ’Ã¢â‚¬Â°': 'É',
  'ÃƒÂ¢Ã¢â‚¬Â \¢â€šÂ¬': '—'
};

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let originalContent = content;
            for (const [bad, good] of Object.entries(replacements)) {
                content = content.split(bad).join(good);
            }
            if (content !== originalContent) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log('Fixed:', fullPath);
            }
        }
    }
}

processDir(srcDir);
console.log('Done');
