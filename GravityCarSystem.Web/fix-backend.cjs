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
  'â€”': '—',
  'Ã©': 'é',
  'Ã': 'í', // Sometimes Ã is followed by invisible chars, wait
  'TributaÃ§Ã£o': 'Tributação',
  'Venda nÃ£o encontrada.': 'Venda não encontrada.',
  'VeÃculo': 'Veículo',
  'veÃculo': 'veículo',
  'VeÃ­culo': 'Veículo',
  'veÃ­culo': 'veículo',
  'cÃ¡lculo': 'cálculo',
  'CÃ¡lculo': 'Cálculo',
  'DÃ­gito': 'Dígito',
  'MÃ³dulo': 'Módulo',
  'PadrÃ£o': 'Padrão',
  'NÃ£o': 'Não',
  'nÃ£o': 'não',
  'jÃ¡': 'já',
  'estÃ¡': 'está',
  'EstÃ¡': 'Está',
  'JÃ¡': 'Já',
  'ObrigatÃ³ria': 'Obrigatória',
  'obrigatÃ³ria': 'obrigatória',
  'obrigatÃ³rio': 'obrigatório',
  'DisponÃ­vel': 'Disponível',
  'ManutenÃ§Ã£o': 'Manutenção',
  'PreparaÃ§Ã£o': 'Preparação',
  'ServiÃ§os': 'Serviços',
  'PeÃ§as': 'Peças',
  'padrÃ£o': 'padrão',
  'IntegraÃ§Ã£o': 'Integração',
  'LanÃ§a': 'Lança',
  'custÃ³dia': 'custódia',
  'LÃquido': 'Líquido',
  'DiferenÃ§a': 'Diferença',
  'ValorLÃquido': 'ValorLíquido',
  'VeÃculos': 'Veículos',
  'veÃculos': 'veículos'
};

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalUtf8 = content;
  
  for (let [bad, good] of Object.entries(map)) {
      content = content.split(bad).join(good);
  }
  
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
    } else if (fullPath.endsWith('.cs')) {
      fixFile(fullPath);
    }
  }
}

walkDir(path.join(__dirname, '..', 'GravityCarSystem.Application'));
walkDir(path.join(__dirname, '..', 'GravityCarSystem.Domain'));
walkDir(path.join(__dirname, '..', 'GravityCarSystem.Infrastructure'));
walkDir(path.join(__dirname, '..', 'GravityCarSystem.API'));

console.log('Backend fixed.');
