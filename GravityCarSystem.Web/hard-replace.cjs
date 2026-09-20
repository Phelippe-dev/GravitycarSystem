const fs = require('fs');

const path = 'src/App.tsx';
let content = fs.readFileSync(path, 'utf8');

const replacements = [
  ['Dono da ConcessionÃ¡ria', 'Dono da Concessionária'],
  ['Super Administrador (VocÃª)', 'Super Administrador (Você)'],
  ['GestÃ£o completa da loja + cadastro de funcionÃ¡rios', 'Gestão completa da loja + cadastro de funcionários'],
  ['Vendas, Financeiro, RelatÃ³rios e Fiscal â€” sem configuraÃ§Ãµes', 'Vendas, Financeiro, Relatórios e Fiscal — sem configurações'],
  ['Dono da ConcessionÃ¡ria', 'Dono da Concessionária'], // 2nd instance
  ['As senhas nÃ£o coincidem ou estÃ£o vazias.', 'As senhas não coincidem ou estão vazias.'],
  ['Erro de conexÃ£o. Tente novamente.', 'Erro de conexão. Tente novamente.'],
  ['Vendedor nÃ£o vÃª saldo', 'Vendedor não vê saldo'],
  ['Helpers de permissÃ£o', 'Helpers de permissão'],
  ['Novo VeÃculo', 'Novo Veículo'],
  ['AvaliaÃ§Ã£o', 'Avaliação'],
  ['RelatÃ³rios', 'Relatórios'],
  ['ConfiguraÃ§Ãµes', 'Configurações'],
  ['FuncionÃ¡rios', 'Funcionários'],
  ['credenciais e nÃvel de acesso operacional', 'credenciais e nível de acesso operacional'],
  ['CartÃ£o do usuÃ¡rio', 'Cartão do usuário'],
  ['ConcessionÃ¡ria Matriz', 'Concessionária Matriz'],
  ['â”€â”€â”€ SeleÃ§Ã£o de Papel (4 nÃ­veis) â”€â”€â”€', '─── Seleção de Papel (4 níveis) ───'],
  ['Alternar NÃ­vel de Acesso (SimulaÃ§Ã£o Operacional)', 'Alternar Nível de Acesso (Simulação Operacional)'],
  ['mÃn.', 'mín.'],
  ['mÃnima', 'mínima']
];

for (let [bad, good] of replacements) {
    content = content.split(bad).join(good);
}

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed App.tsx');

// Also fix ContratoVenda.tsx
let contratoPath = 'src/pages/ContratoVenda.tsx';
if (fs.existsSync(contratoPath)) {
    let cContent = fs.readFileSync(contratoPath, 'utf8');
    cContent = cContent.split('NÂº Cheque').join('Nº Cheque');
    cContent = cContent.split('AgÃªncia').join('Agência');
    cContent = cContent.split('â€¢ Ag:').join('• Ag:');
    cContent = cContent.split('â€¢ CC:').join('• CC:');
    cContent = cContent.split('Ã€ Vista').join('À Vista');
    cContent = cContent.split('VeÃ­culo na Troca').join('Veículo na Troca');
    cContent = cContent.split('â€¢ Emitente:').join('• Emitente:');
    cContent = cContent.split('VeÃculo').join('Veículo');
    fs.writeFileSync(contratoPath, cContent, 'utf8');
    console.log('Fixed ContratoVenda.tsx');
}

