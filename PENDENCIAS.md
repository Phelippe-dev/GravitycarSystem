# 📋 Pendências — Gravity Car System

> **Última atualização:** 21/09/2026  
> Levantamento completo de pendências, bugs, dívidas técnicas e melhorias pendentes.

---

## 🔴 URGENTE (Bloqueia produção)

### ✅ [CONCLUÍDO] 1. Correção de Isolamento de Tenants
- O sistema está permitindo que tenants puxem dados de outras concessionárias.
- **Causa raiz identificada:** O [`FakeCurrentTenantService`](file:///c:/Users/lipeh/OneDrive/Desktop/Gravity%20Car%20System/GravityCarSystem.Infrastructure/Services/FakeCurrentTenantService.cs) retorna um GUID hardcoded (`11111111-...`). Se estiver registrado na DI em vez do [`CurrentTenantService`](file:///c:/Users/lipeh/OneDrive/Desktop/Gravity%20Car%20System/GravityCarSystem.Infrastructure/Services/CurrentTenantService.cs), **todos os usuários veem os mesmos dados**.
- **Causa raiz secundária:** O [`CurrentTenantService.GetEmpresaId()`](file:///c:/Users/lipeh/OneDrive/Desktop/Gravity%20Car%20System/GravityCarSystem.Infrastructure/Services/CurrentTenantService.cs#L17-L27) tem um fallback para `00000000-0000-0000-0000-000000000001` quando a claim `EmpresaId` não é encontrada. Isso pode vazar dados se o JWT estiver malformado.
- **Ação:** Remover o fallback hardcoded — retornar `null` e bloquear a request se não houver tenant identificado. Garantir que o `FakeCurrentTenantService` só é registrado em ambiente de desenvolvimento/migrations.

### ✅ [CONCLUÍDO] 2. Encoding Corrompido no AuthController
- O arquivo [`AuthController.cs`](file:///c:/Users/lipeh/OneDrive/Desktop/Gravity%20Car%20System/GravityCarSystem.API/Controllers/AuthController.cs) tem **todas as strings com acentos corrompidas** (encoding UTF-8 lido como Latin-1).
- Exemplos: `"E-mail ou senha invÃ¡lidos"` deveria ser `"E-mail ou senha inválidos"`, `"UsuÃ¡rio inativo"` deveria ser `"Usuário inativo"`.
- **Impacto:** Mensagens de erro ilegíveis para o usuário final.
- **Ação:** Reescrever todas as strings de retorno com encoding correto (são ~17 ocorrências no arquivo).

### ✅ [CONCLUÍDO] 3. Token de Reset de Senha Exposto na Resposta HTTP
- Em [`AuthController.cs` L149](file:///c:/Users/lipeh/OneDrive/Desktop/Gravity%20Car%20System/GravityCarSystem.API/Controllers/AuthController.cs#L149): `return Ok(new { ..., token_dev = token })` — o token de recuperação de senha é retornado na resposta da API.
- O próprio comentário no código diz: _"EM PRODUÇÃO: NUNCA RETORNE O TOKEN NA RESPOSTA HTTP!"_.
- **Ação:** Remover o campo `token_dev` e implementar envio real de e-mail (ver item 10).

---

## 🟠 ALTA PRIORIDADE (Segurança e integridade de dados)

### 4. `IgnoreQueryFilters()` Usado em Excesso
- Há **25+ chamadas** de `.IgnoreQueryFilters()` espalhadas pelos controllers e services.
- Em vários locais (ex: [`FuncionariosController`](file:///c:/Users/lipeh/OneDrive/Desktop/Gravity%20Car%20System/GravityCarSystem.API/Controllers/FuncionariosController.cs#L61), [`VendaService`](file:///c:/Users/lipeh/OneDrive/Desktop/Gravity%20Car%20System/GravityCarSystem.Application/Services/Negocio/VendaService.cs#L66)), o `IgnoreQueryFilters` é usado com um filtro manual `.Where(u => u.EmpresaId == empresaId)`, mas em outros locais **não há filtro de tenant** (ex: fallback de usuário ativo).
- **Risco:** Vazamento de dados entre tenants.
- **Ação:** Auditar cada uso — manter apenas em Auth/Login (onde é necessário) e substituir por queries com filtro explícito nos demais.

### ✅ [CONCLUÍDO] 5. `GetEmpresaId()` Duplicado com Fallback Hardcoded
- O método `GetEmpresaId()` é duplicado em [`FuncionariosController`](file:///c:/Users/lipeh/OneDrive/Desktop/Gravity%20Car%20System/GravityCarSystem.API/Controllers/FuncionariosController.cs#L43-L48) e [`EmpresaConfigController`](file:///c:/Users/lipeh/OneDrive/Desktop/Gravity%20Car%20System/GravityCarSystem.API/Controllers/EmpresaConfigController.cs#L49-L54), ambos com fallback para GUID hardcoded.
- **Ação:** Centralizar em um `BaseController` ou usar apenas o `ICurrentTenantService`. Eliminar fallbacks hardcoded.

### ✅ [CONCLUÍDO] 6. StressTestController Acessível em Produção
- O [`StressTestController`](file:///c:/Users/lipeh/OneDrive/Desktop/Gravity%20Car%20System/GravityCarSystem.API/Controllers/StressTestController.cs) tem endpoints `POST /api/stresstest/seed` (insere 5000 veículos + 10000 contas) e `POST /api/stresstest/clear` (executa `DELETE FROM` direto em tabelas sem filtro de tenant).
- O `clear` **deleta dados de TODOS os tenants** (`DELETE FROM ContasPagar`, etc.).
- **Ação:** Remover o controller em produção ou proteger com `[Authorize(Roles = "SuperAdmin")]` + flag de ambiente.

### 7. Secret JWT Hardcoded
- Em [`JwtTokenService.cs` L24](file:///c:/Users/lipeh/OneDrive/Desktop/Gravity%20Car%20System/GravityCarSystem.Infrastructure/Services/JwtTokenService.cs#L24): chave secreta fallback hardcoded no código.
- **Ação:** Obrigar configuração via `appsettings` ou variável de ambiente. Falhar com exceção se não configurado.

---

## 🟡 MÉDIA PRIORIDADE (Funcionalidades incompletas)

### 8. Integração SENATRAN / RENAVE / ATPV-e são Mocks
- O [`SenatranMockService`](file:///c:/Users/lipeh/OneDrive/Desktop/Gravity%20Car%20System/GravityCarSystem.Application/Services/Integracoes/SenatranMockService.cs) retorna dados fake para:
  - `RegistrarEntradaRenaveAsync` — apenas `Task.Delay(200)` + `return true`
  - `GerarAtpveSaidaAsync` — retorna número fake `ATPV-PENDENTE-...`
- O [`ApiBrasilService`](file:///c:/Users/lipeh/OneDrive/Desktop/Gravity%20Car%20System/GravityCarSystem.Application/Services/Integracoes/ApiBrasilService.cs) está implementado mas usa endpoint genérico (`/veiculos/dados`) — confirmar se o contrato da APIBrasil é esse.
- **Ação:** Definir se vai usar APIBrasil em produção ou apenas base local. Configurar token real no `appsettings`.

### ✅ [CONCLUÍDO] 9. Envio de E-mail Não Implementado
- [`AuthController.cs` L144](file:///c:/Users/lipeh/OneDrive/Desktop/Gravity%20Car%20System/GravityCarSystem.API/Controllers/AuthController.cs#L144): `// TODO: Simulação de envio de E-mail` — recuperação de senha imprime no console.
- **Ação:** Implementar serviço de e-mail (SendGrid, SMTP, etc.) e criar interface `IEmailService`.

### 10. Relatórios — Faltam Endpoints
- O [`RelatoriosController`](file:///c:/Users/lipeh/OneDrive/Desktop/Gravity%20Car%20System/GravityCarSystem.API/Controllers/RelatoriosController.cs) tem apenas 2 endpoints: `rentabilidade` e `resumo-financeiro`.
- O frontend ([`Relatorios.tsx`](file:///c:/Users/lipeh/OneDrive/Desktop/Gravity%20Car%20System/GravityCarSystem.Web/src/pages/Relatorios.tsx) — 38KB) possivelmente espera mais relatórios.
- **Ação:** Revisar o frontend e adicionar endpoints faltantes (ex: estoque parado, comissões por vendedor, fluxo de caixa mensal).

### 11. Projeto Desktop (WPF) é um Placeholder
- O [`GravityCarSystem.Desktop`](file:///c:/Users/lipeh/OneDrive/Desktop/Gravity%20Car%20System/GravityCarSystem.Desktop/) tem apenas o `MainWindow.xaml` padrão do template — nenhuma funcionalidade implementada.
- **Ação:** Decidir se o Desktop será desenvolvido ou removido da solution.

### 12. Projeto Integrations é um Placeholder
- O [`GravityCarSystem.Integrations`](file:///c:/Users/lipeh/OneDrive/Desktop/Gravity%20Car%20System/GravityCarSystem.Integrations/) contém apenas uma `Class1.cs` vazia.
- **Ação:** Migrar os services de integração (APIBrasil, SenatranMock) para cá, ou remover o projeto.

### ✅ [CONCLUÍDO] 13. `EmpresaConfigController` Usa Reflection para Acessar Propriedades
- Em [`EmpresaConfigController.cs` L64-L68](file:///c:/Users/lipeh/OneDrive/Desktop/Gravity%20Car%20System/GravityCarSystem.API/Controllers/EmpresaConfigController.cs#L64-L68) e [L134-L136](file:///c:/Users/lipeh/OneDrive/Desktop/Gravity%20Car%20System/GravityCarSystem.API/Controllers/EmpresaConfigController.cs#L134-L136): usa `GetType().GetProperty()` para ler/escrever campos da Empresa.
- Provavelmente resultado de campos adicionados à entidade que não foram mapeados diretamente.
- **Ação:** Refatorar para acessar propriedades diretamente. Verificar se a entidade `Empresa` tem todos os campos.

---

## 🔵 BAIXA PRIORIDADE (Qualidade e manutenibilidade)

### ✅ [CONCLUÍDO] 14. DTOs Definidos Dentro dos Controllers
- [`CriarFuncionarioDto` e `AtualizarFuncionarioDto`](file:///c:/Users/lipeh/OneDrive/Desktop/Gravity%20Car%20System/GravityCarSystem.API/Controllers/FuncionariosController.cs#L14-L28) estão definidos no arquivo do controller.
- [`EmpresaConfigDto`, `TrocaSenhaDto`, `AdicionarCreditosDto`](file:///c:/Users/lipeh/OneDrive/Desktop/Gravity%20Car%20System/GravityCarSystem.API/Controllers/EmpresaConfigController.cs#L14-L35) idem.
- [`LoginRequest`, `LoginResponse`](file:///c:/Users/lipeh/OneDrive/Desktop/Gravity%20Car%20System/GravityCarSystem.API/Controllers/AuthController.cs) — aparentemente em DTOs separados já, mas `ForgotPasswordRequest` e `ResetPasswordRequest` estão inline.
- **Ação:** Mover todos os DTOs para a pasta `Application/DTOs`.

### ✅ [CONCLUÍDO] 15. `ChangePasswordController` Dentro do Arquivo `EmpresaConfigController.cs`
- O [`ChangePasswordController`](file:///c:/Users/lipeh/OneDrive/Desktop/Gravity%20Car%20System/GravityCarSystem.API/Controllers/EmpresaConfigController.cs#L158-L187) está definido no mesmo arquivo do `EmpresaConfigController`.
- **Ação:** Mover para um arquivo próprio ou integrar ao `AuthController`.

### 16. Arquivos de Fix/Hack no Frontend
- Existem múltiplos scripts de correção no [`GravityCarSystem.Web`](file:///c:/Users/lipeh/OneDrive/Desktop/Gravity%20Car%20System/GravityCarSystem.Web/): `ultimate-fix.cjs`, `final-fix.cjs`, `fix-backend.cjs`, `fix-encoding.cjs`, `fix-encoding-2.cjs`, `hard-replace.cjs`, `clean-code.cjs`, `test-decode.cjs`.
- **Ação:** Verificar se ainda são necessários e remover. Integrar qualquer correção válida no build normal.

### 17. `Class1.cs` Placeholder em Infrastructure e Integrations
- Arquivos [`Class1.cs`](file:///c:/Users/lipeh/OneDrive/Desktop/Gravity%20Car%20System/GravityCarSystem.Infrastructure/Class1.cs) vazios em ambos os projetos.
- **Ação:** Remover.

### 18. Testes Unitários Mínimos
- O projeto [`GravityCarSystem.Tests`](file:///c:/Users/lipeh/OneDrive/Desktop/Gravity%20Car%20System/GravityCarSystem.Tests/) tem apenas 1 arquivo de testes (`UnitTest1.cs`).
- **Ação:** Criar testes para os fluxos críticos — VendaService, isolamento de tenant, AuthController, cálculo de rentabilidade.

### 19. Frontend Monolítico
- [`App.tsx`](file:///c:/Users/lipeh/OneDrive/Desktop/Gravity%20Car%20System/GravityCarSystem.Web/src/App.tsx) com 22KB, [`api.ts`](file:///c:/Users/lipeh/OneDrive/Desktop/Gravity%20Car%20System/GravityCarSystem.Web/src/api.ts) com 30KB, [`Vendas.tsx`](file:///c:/Users/lipeh/OneDrive/Desktop/Gravity%20Car%20System/GravityCarSystem.Web/src/pages/Vendas.tsx) com 81KB, [`VeiculoDetalhes.tsx`](file:///c:/Users/lipeh/OneDrive/Desktop/Gravity%20Car%20System/GravityCarSystem.Web/src/pages/VeiculoDetalhes.tsx) com 65KB.
- **Ação:** Componentizar as páginas maiores, extrair hooks customizados, e modularizar `api.ts`.

### 20. Storage Local de Arquivos
- O [`LocalFileStorageService`](file:///c:/Users/lipeh/OneDrive/Desktop/Gravity%20Car%20System/GravityCarSystem.Infrastructure/Services/LocalFileStorageService.cs) salva uploads em `wwwroot/uploads/`.
- **Ação:** Migrar para cloud storage (Azure Blob, AWS S3, etc.) antes de produção. Uploads locais são perdidos em deploys.

---

### ✅ [CONCLUÍDO] 21. VendaService Ignora Completamente o Tenant do Usuário Logado
- O [`VendaService.RealizarVendaAsync()`](file:///c:/Users/lipeh/OneDrive/Desktop/Gravity%20Car%20System/GravityCarSystem.Application/Services/Negocio/VendaService.cs#L62) tem `var defaultTenantId = Guid.Parse("00000000-...-000000000001")` hardcoded e usa esse ID em **todas as entidades criadas** (Venda, Cheque, ContaReceber, ContaPagar, ContaFinanceira, CategoriaFinanceira, MovimentoFinanceiro, veículos de troca).
- **Não injeta `ICurrentTenantService`**, ao contrário do `ChequeService` e `AvaliacaoService` que o fazem.
- São **12 ocorrências** de `defaultTenantId` no arquivo. Tudo vinculado ao tenant errado.
- **Impacto:** Vendas de qualquer concessionária ficam associadas ao tenant "000...001".
- **Ação:** Injetar `ICurrentTenantService` e usar o tenant real do usuário logado.

### ✅ [CONCLUÍDO] 22. Encoding Corrompido no Frontend (api.ts, AdminPortal.tsx, VeiculoDetalhes.tsx)
- O mesmo problema de encoding do `AuthController` se repete em vários arquivos do frontend:
- [`api.ts`](file:///c:/Users/lipeh/OneDrive/Desktop/Gravity%20Car%20System/GravityCarSystem.Web/src/api.ts) — ~40 comentários e strings com acentos corrompidos (ex: `"veÃƒÆ'Ã‚Â­culos"`, `"RELATÃƒÆ'Ã¢â‚¬Å"RIOS"`)
- [`AdminPortal.tsx`](file:///c:/Users/lipeh/OneDrive/Desktop/Gravity%20Car%20System/GravityCarSystem.Web/src/pages/AdminPortal.tsx) — textos de UI ilegíveis (ex: `"GestÃ£o Multi-Tenant"`)
- [`VeiculoDetalhes.tsx`](file:///c:/Users/lipeh/OneDrive/Desktop/Gravity%20Car%20System/GravityCarSystem.Web/src/pages/VeiculoDetalhes.tsx) — labels corrompidos
- Encoding também corrompido no backend em: [`ChequeService.cs` L155](file:///c:/Users/lipeh/OneDrive/Desktop/Gravity%20Car%20System/GravityCarSystem.Application/Services/Negocio/ChequeService.cs#L155) (`"NÂº"`), [`SenatranMockService.cs`](file:///c:/Users/lipeh/OneDrive/Desktop/Gravity%20Car%20System/GravityCarSystem.Application/Services/Integracoes/SenatranMockService.cs) (`"NíO ENCONTRADO"`).
- **Ação:** Corrigir encoding de todos os arquivos afetados. Remover os scripts `fix-encoding*.cjs` depois.

### ✅ [CONCLUÍDO] 23. Entidade `Empresa` Faltam Campos que o Controller Tenta Usar via Reflection
- O [`EmpresaConfigController`](file:///c:/Users/lipeh/OneDrive/Desktop/Gravity%20Car%20System/GravityCarSystem.API/Controllers/EmpresaConfigController.cs) tenta ler/escrever propriedades via reflection que **não existem** na entidade [`Empresa`](file:///c:/Users/lipeh/OneDrive/Desktop/Gravity%20Car%20System/GravityCarSystem.Domain/Entities/Acesso/Empresa.cs):
  - `InscricaoMunicipal`, `Site`, `Complemento`, `RegimeTributario`, `ResponsavelTecnico`
- Resultado: essas propriedades são silenciosamente ignoradas — o usuário preenche no formulário mas os dados **nunca são salvos**.
- **Ação:** Adicionar as propriedades faltantes à entidade `Empresa` e criar migration. Depois refatorar o controller para acesso direto.

### ✅ [CONCLUÍDO] 24. Falta Controller/Service para Fornecedores
- A entidade `Fornecedor` existe no Domain e está mapeada no `AppDbContext`, mas **não existe** um `FornecedoresController` nem um `FornecedorService`.
- O frontend pode não ter tela para isso ainda, mas o backend deveria expor o CRUD.
- **Ação:** Criar `IFornecedorService`, `FornecedorService` e `FornecedoresController`.

### 25. `ChequeService` / `AvaliacaoService` Aplicam Filtro de Tenant Duplo
- Esses services fazem `query.Where(c => c.EmpresaId == empresaId)` manualmente, mas o `AppDbContext` já aplica `HasQueryFilter` automático por tenant.
- Resultado: filtro duplo (não é um bug funcional, mas é redundante e pode causar confusão).
- **Ação:** Remover o filtro manual nos services que já são cobertos pelo query filter global, ou documentar que o filtro é intencional para segurança em profundidade.

### ✅ [CONCLUÍDO] 26. Senha do Banco Exposta no `docker-compose.yml`
- Em [`docker-compose.yml` L26](file:///c:/Users/lipeh/OneDrive/Desktop/Gravity%20Car%20System/docker-compose.yml#L26): `POSTGRES_PASSWORD: ${DB_PASSWORD:-Gravity@2024!Seguro}` — senha default hardcoded.
- **Ação:** Remover a senha default e exigir variável de ambiente. Adicionar `.env.example` como referência.

---

## 📌 Resumo Rápido

| Prioridade | Qtd | Área Principal |
|---|---|---|
| 🔴 Urgente | 4 | Segurança / Tenant / Encoding |
| 🟠 Alta | 5 | Segurança / Query Filters / JWT / VendaService |
| 🟡 Média | 8 | Integrações / Features / Campos faltantes |
| 🔵 Baixa | 9 | Qualidade / Organização / Testes |
| **Total** | **26** | |
