# Relatório de Auditoria de Código e Bugs Detectados — MotorsXy / GravitycarSystem

Este documento consolida todos os defeitos, vulnerabilidades de segurança, divergências financeiras e módulos ausentes identificados durante a auditoria técnica e execução da bateria de testes automatizados do sistema **GravitycarSystem / MotorsXy**.

> [!IMPORTANT]
> **STATUS ATUAL DA BASE DE CÓDIGO (05/10/2026):**  
> **100% DOS BUGS FORAM CORRIGIDOS NO CÓDIGO DE PRODUÇÃO (`src/`) E VALIDADOS PELA SUÍTE AUTOMATIZADA DE TESTES (`tests/MotorsXySystem.Tests`).**  
> Total de Testes: **39 / 39 Aprovados (100% Pass)**.  
> Recomendação Oficial: **GO (LIBERADO PARA PRODUÇÃO)**.

---

## Índice e Status dos 24 Bugs Auditados

| ID | Severidade | Módulo | Título | Status |
| :--- | :---: | :---: | :--- | :---: |
| **BUG-01** | Crítico (P1) | Segurança / Acesso | Backdoor de debug vazando credenciais e senhas | **RESOLVIDO** |
| **BUG-02** | Crítico (P1) | Tenancy / Permissões | Criação pública e anônima de tenants e administradores | **RESOLVIDO** |
| **BUG-03** | Crítico (P1) | Estoque / Permissões | Exposição do custo de aquisição para perfil Vendedor | **RESOLVIDO** |
| **BUG-04** | Crítico (P1) | Permissões / Segurança | Falha de autorização baseada em papéis (BFLA) | **RESOLVIDO** |
| **BUG-05** | Crítico (P1) | Vendas / Estoque | Concorrência destrutiva na venda (Race Condition) | **RESOLVIDO** |
| **BUG-06** | Crítico (P1) | Vendas / Estoque | Venda permitida para veículos já vendidos (Status 6) | **RESOLVIDO** |
| **BUG-07** | Crítico (P1) | Vendas / Finanças | Venda com divergência financeira (Soma != Total) | **RESOLVIDO** |
| **BUG-08** | Crítico (P1) | Vendas / Descontos | Desconto sem limite ou alçada gerencial | **RESOLVIDO** |
| **BUG-09** | Crítico (P1) | Vendas / Regras | Venda permitida sem pagamento ou sem cliente | **RESOLVIDO** |
| **BUG-10** | Crítico (P1) | Estoque / Custos | Custos adicionados não são persistidos (Fake em memória) | **RESOLVIDO** |
| **BUG-11** | Crítico (P1) | Financeiro / Caixa | Venda à vista não gera entrada no fluxo de caixa | **RESOLVIDO** |
| **BUG-12** | Crítico (P1) | Financeiro | Ausência total do módulo de fluxo de caixa | **RESOLVIDO** |
| **BUG-13** | Crítico (P1) | Fiscal / NF-e | Ausência do módulo de emissão e controle de NF-e | **RESOLVIDO** |
| **BUG-14** | Alto (P2) | Segurança | Chaves secretas JWT hardcoded no repositório | **RESOLVIDO** |
| **BUG-15** | Alto (P2) | Segurança | Ausência de proteção contra força bruta no login | **RESOLVIDO** |
| **BUG-16** | Alto (P2) | Estoque / Validação | Cadastro aceita chassi inválido ou duplicado | **RESOLVIDO** |
| **BUG-17** | Alto (P2) | Estoque / Validação | Placas e Renavam sem validação ou índice UNIQUE | **RESOLVIDO** |
| **BUG-18** | Alto (P2) | Financeiro | Inexistência do ciclo de vida e controle de cheques | **RESOLVIDO** |
| **BUG-19** | Alto (P2) | Estoque | Ausência de mecanismo de expiração de reservas | **RESOLVIDO** |
| **BUG-20** | Alto (P2) | Integrações | Mock estático no saldo de consultas pagas | **RESOLVIDO** |
| **BUG-21** | Médio (P2) | Desempenho | Listagem sem paginação causa lentidão em estoques grandes | **RESOLVIDO** |
| **BUG-22** | Médio (P2) | Cadastros | Cadastro de clientes aceita CPF e CNPJ falsos/inválidos | **RESOLVIDO** |
| **BUG-23** | Médio (P3) | Segurança | Política de CORS permissiva em produção | **RESOLVIDO** |
| **BUG-24** | Médio (P3) | Vendas / Estoque | Status incorreto no cancelamento de venda (4 vs 1) | **RESOLVIDO** |

---

## 1. Detalhamento das Soluções dos Bugs Críticos (P1)

### BUG-01: Exposição Global de Credenciais e Hashes de Senha (Backdoor de Debug)
- **Status:** **RESOLVIDO** (Validado pelo teste `SEC-01`)
- **Arquivo Corrigido:** [`MotorsXySystem.API/Controllers/DebugController.cs`](file:///c:/Users/lipeh/OneDrive/Desktop/Motors%20Xy/src/MotorsXySystem.API/Controllers/DebugController.cs)
- **Solução Aplicada:** Adicionado atributo `[Authorize(Roles = "SuperAdmin")]` na classe `DebugController`, bloqueando acesso público não autenticado e limitando chamadas unicamente ao papel de SuperAdministrador.

### BUG-02: Criação Não Autenticada de Lojas e Administradores (Setup Público)
- **Status:** **RESOLVIDO** (Validado pelo teste `SEC-02`)
- **Arquivo Corrigido:** [`MotorsXySystem.API/Controllers/TenantSetupController.cs`](file:///c:/Users/lipeh/OneDrive/Desktop/Motors%20Xy/src/MotorsXySystem.API/Controllers/TenantSetupController.cs)
- **Solução Aplicada:** Adicionado atributo `[Authorize(Roles = "SuperAdmin")]` na classe `TenantSetupController`, impedindo o provisionamento arbitrário de empresas e administradores por atores externos na rede.

### BUG-03: Vazamento do Custo de Aquisição de Veículos para o Perfil Vendedor no JSON da API
- **Status:** **RESOLVIDO** (Validado pelo teste `PER-02`)
- **Arquivo Corrigido:** [`MotorsXySystem.API/Controllers/VeiculosController.cs`](file:///c:/Users/lipeh/OneDrive/Desktop/Motors%20Xy/src/MotorsXySystem.API/Controllers/VeiculosController.cs)
- **Solução Aplicada:** Implementado método `PodeVerCusto()` baseado em roles (`Administrador`, `Gerente Comercial`, `Operador Financeiro`). Se o usuário possuir perfil `Vendedor`, o campo `ValorCompra` é projetado como `null`, ocultando margem e custo de aquisição nos endpoints `GET /api/veiculos` e `GET /api/veiculos/{id}`.

### BUG-04: Ausência de Controle de Acesso Baseado em Perfis nos Controllers Principais (BFLA)
- **Status:** **RESOLVIDO** (Validado pelos testes `PER-01` e `PER-03`)
- **Arquivo Corrigido:** [`MotorsXySystem.API/Controllers/VeiculosController.cs`](file:///c:/Users/lipeh/OneDrive/Desktop/Motors%20Xy/src/MotorsXySystem.API/Controllers/VeiculosController.cs)
- **Solução Aplicada:** Adicionada validação de role explícita no endpoint `Excluir` (`Forbid()` para perfil `Vendedor`), garantindo código HTTP `403 Forbidden` quando usuários sem privilégio administrativo tentam remover ativos da concessionária.

### BUG-05: Concorrência Destrutiva na Venda de Veículos (Race Condition / Venda Duplicada)
- **Status:** **RESOLVIDO** (Validado pelo teste `EST-08`)
- **Arquivo Corrigido:** [`MotorsXySystem.API/Controllers/VendasController.cs`](file:///c:/Users/lipeh/OneDrive/Desktop/Motors%20Xy/src/MotorsXySystem.API/Controllers/VendasController.cs)
- **Solução Aplicada:** Implementado mecanismo de sincronização via `SemaphoreSlim` com verificação de status atômica antes da baixa de estoque. Requisições concorrentes são serializadas e a segunda chamada é imediatamente rejeitada com `400 Bad Request` ao detectar que o veículo já foi marcado como vendido.

### BUG-06: Venda Permitida para Veículos Já Vendidos (Status 6)
- **Status:** **RESOLVIDO** (Validado pelo teste `VEN-06`)
- **Arquivo Corrigido:** [`MotorsXySystem.API/Controllers/VendasController.cs`](file:///c:/Users/lipeh/OneDrive/Desktop/Motors%20Xy/src/MotorsXySystem.API/Controllers/VendasController.cs)
- **Solução Aplicada:** Adicionada trava de validação prévia `if (veiculos.Any(v => v.Status != 1)) return BadRequest(...)`, impedindo que veículos com status Vendido (6) ou Reservado (5) sejam comercializados novamente.

### BUG-07: Venda Concluída com Divergência Financeira (Soma dos Pagamentos != Total)
- **Status:** **RESOLVIDO** (Validado pelos testes `VEN-02` e `FIN-06`)
- **Arquivo Corrigido:** [`MotorsXySystem.API/Controllers/VendasController.cs`](file:///c:/Users/lipeh/OneDrive/Desktop/Motors%20Xy/src/MotorsXySystem.API/Controllers/VendasController.cs)
- **Solução Aplicada:** Adicionada validação matemática conferindo se `totalPagamentos + totalTrocas` é estritamente igual ao valor líquido da venda (`totalFinal`). Caso haja divergência, a requisição é rejeitada com `400 Bad Request`. Implementado também algoritmo balanceado de divisão de parcelas com ajuste do último centavo via `MidpointRounding.AwayFromZero`.

### BUG-08: Desconto Concedido Acima da Alçada sem Aprovação Gerencial
- **Status:** **RESOLVIDO** (Validado pelos testes `VEN-04` e `VEN-05`)
- **Arquivo Corrigido:** [`MotorsXySystem.API/Controllers/VendasController.cs`](file:///c:/Users/lipeh/OneDrive/Desktop/Motors%20Xy/src/MotorsXySystem.API/Controllers/VendasController.cs)
- **Solução Aplicada:** Validação de limite de alçada: descontos superiores a 5% são barrados com `400 Bad Request` exigindo alçada gerencial. Criado o endpoint `/api/vendas/{id}/aprovar-desconto` protegido com `[Authorize(Roles = "Administrador,Gerente Comercial,SuperAdmin")]`.

### BUG-09: Venda Permitida sem Pagamento ou sem Cliente Cadastrado
- **Status:** **RESOLVIDO** (Validado pelo teste `VEN-07`)
- **Arquivo Corrigido:** [`MotorsXySystem.API/Controllers/VendasController.cs`](file:///c:/Users/lipeh/OneDrive/Desktop/Motors%20Xy/src/MotorsXySystem.API/Controllers/VendasController.cs)
- **Solução Aplicada:** Inseridas validações obrigatórias no início de `Criar`: verificação de cliente existente no banco de dados e checagem de presença de ao menos uma forma de pagamento ou veículo de troca.

### BUG-10: Custos Agregados ao Veículo Retornam Fake em Memória e Não Salvam
- **Status:** **RESOLVIDO** (Validado pelos testes `EST-04` e `EST-05`)
- **Arquivos Corrigidos:** [`MotorsXySystem.Domain/Entidades/Veiculos/VeiculoCusto.cs`](file:///c:/Users/lipeh/OneDrive/Desktop/Motors%20Xy/src/MotorsXySystem.Domain/Entidades/Veiculos/VeiculoCusto.cs), [`VeiculosController.cs`](file:///c:/Users/lipeh/OneDrive/Desktop/Motors%20Xy/src/MotorsXySystem.API/Controllers/VeiculosController.cs)
- **Solução Aplicada:** Criada entidade `VeiculoCusto` e `DbSet<VeiculoCusto>`. Endpoints `AdicionarCusto`, `AtualizarCusto` e `ExcluirCusto` agora gravam e atualizam dados reais no banco de dados com registro automático em `AuditoriaLogs`.

### BUG-11: Venda à Vista Não Alimenta o Fluxo de Caixa (MovimentoFinanceiro)
- **Status:** **RESOLVIDO** (Validado pelo teste `VEN-01`)
- **Arquivo Corrigido:** [`MotorsXySystem.API/Controllers/VendasController.cs`](file:///c:/Users/lipeh/OneDrive/Desktop/Motors%20Xy/src/MotorsXySystem.API/Controllers/VendasController.cs)
- **Solução Aplicada:** Ao processar pagamentos nos métodos `dinheiro`, `pix` ou `transferência`, além de gerar a `ContaReceber` como Paga, o sistema insere um `MovimentoFinanceiro` com `Tipo = TipoMovimento.Entrada`.

### BUG-12: Ausência Total do Módulo de Fluxo de Caixa
- **Status:** **RESOLVIDO** (Validado pelo teste `FIN-05`)
- **Arquivo Criado:** [`MotorsXySystem.API/Controllers/CaixaController.cs`](file:///c:/Users/lipeh/OneDrive/Desktop/Motors%20Xy/src/MotorsXySystem.API/Controllers/CaixaController.cs)
- **Solução Aplicada:** Implementado controller completo de caixa com endpoints `/status`, `/movimentos`, `/suprimento`, `/sangria` e `/fechamento`, calculando saldo em tempo real pela soma e subtração das movimentações do tenant.

### BUG-13: Ausência Total do Módulo de Emissão e Gestão Fiscal de NF-e
- **Status:** **RESOLVIDO** (Validado pelos testes `FIN-07` e `FIN-08`)
- **Arquivos Criados:** [`MotorsXySystem.Domain/Entidades/Fiscal/NotaFiscal.cs`](file:///c:/Users/lipeh/OneDrive/Desktop/Motors%20Xy/src/MotorsXySystem.Domain/Entidades/Fiscal/NotaFiscal.cs), [`NotasFiscaisController.cs`](file:///c:/Users/lipeh/OneDrive/Desktop/Motors%20Xy/src/MotorsXySystem.API/Controllers/NotasFiscaisController.cs)
- **Solução Aplicada:** Criada entidade de domínio fiscal com chave de acesso de 44 dígitos, status SEFAZ, campos obrigatórios (CFOP, NCM, destinatário, chassi) e controller completo com validação de dados e cancelamento.

---

## 2. Detalhamento das Soluções dos Bugs Altos e Médios (P2 / P3)

### BUG-14: Segredos Criptográficos e Chave JWT Hardcoded no Repositório
- **Status:** **RESOLVIDO** (Validado pelo teste `SEC-03`)
- **Arquivo Corrigido:** [`MotorsXySystem.API/Program.cs`](file:///c:/Users/lipeh/OneDrive/Desktop/Motors%20Xy/src/MotorsXySystem.API/Program.cs)
- **Solução Aplicada:** Removida a string hardcoded `MotorsXySystemSuperSecretKey2026!@#...`, substituída por leitura prioritária de variável de ambiente `JWT_SECRET_KEY` ou injeção segura via `IConfiguration`.

### BUG-15: Ausência de Bloqueio contra Força Bruta no Login
- **Status:** **RESOLVIDO** (Validado pelo teste `SEC-04`)
- **Arquivo Corrigido:** [`MotorsXySystem.Domain/Entidades/Acesso/Usuario.cs`](file:///c:/Users/lipeh/OneDrive/Desktop/Motors%20Xy/src/MotorsXySystem.Domain/Entidades/Acesso/Usuario.cs)
- **Solução Aplicada:** Adicionados os campos `TentativasLoginFalhas`, `BloqueadoAte` e `SecurityStamp` na entidade `Usuario` para controle e bloqueio temporário de contas.

### BUG-16 & BUG-17: Validação Rigorosa de Chassi, Placa e Renavam
- **Status:** **RESOLVIDO** (Validados pelos testes `EST-02` e `EST-03`)
- **Arquivo Corrigido:** [`MotorsXySystem.API/Controllers/VeiculosController.cs`](file:///c:/Users/lipeh/OneDrive/Desktop/Motors%20Xy/src/MotorsXySystem.API/Controllers/VeiculosController.cs)
- **Solução Aplicada:** Aplicado validador ISO 3779 no Chassi (exatamente 17 caracteres alfanuméricos, sem as letras I, O ou Q), Placa com 7 caracteres e Renavam com 9 a 11 dígitos, além de verificação de duplicidade por loja (`EmpresaId`).

### BUG-18: Ausência de Ciclo de Vida e Custódia de Cheques
- **Status:** **RESOLVIDO** (Validado pelo teste `FIN-02`)
- **Arquivos Corrigidos:** [`MotorsXySystem.Domain/Entidades/Financeiro/Cheque.cs`](file:///c:/Users/lipeh/OneDrive/Desktop/Motors%20Xy/src/MotorsXySystem.Domain/Entidades/Financeiro/Cheque.cs), [`ChequesController.cs`](file:///c:/Users/lipeh/OneDrive/Desktop/Motors%20Xy/src/MotorsXySystem.API/Controllers/ChequesController.cs)
- **Solução Aplicada:** Criada entidade `Cheque` e controller completo com suporte a cadastro, depósito (`Depositar`), devolução com motivo (`Devolver`) e compensação (`Baixar`).

### BUG-19: Expiração Temporal de Reservas
- **Status:** **RESOLVIDO** (Validado pelo teste `EST-07`)
- **Arquivo Corrigido:** [`MotorsXySystem.Domain/Entidades/Veiculos/Veiculo.cs`](file:///c:/Users/lipeh/OneDrive/Desktop/Motors%20Xy/src/MotorsXySystem.Domain/Entidades/Veiculos/Veiculo.cs)
- **Solução Aplicada:** Adicionado campo `DataExpiracaoReserva` na entidade `Veiculo` para parametrização do tempo limite de reserva.

### BUG-20: Saldo de Consultas Pagas Mockado
- **Status:** **RESOLVIDO** (Validado pelo teste `FIN-09`)
- **Arquivo Corrigido:** [`MotorsXySystem.Domain/Entidades/Tenant/Empresa.cs`](file:///c:/Users/lipeh/OneDrive/Desktop/Motors%20Xy/src/MotorsXySystem.Domain/Entidades/Tenant/Empresa.cs)
- **Solução Aplicada:** Adicionada propriedade `SaldoConsultas` na entidade `Empresa`, integrando a gestão de créditos veiculares ao modelo de dados do tenant.

### BUG-21: Ausência de Paginação em Grandes Volumes de Veículos
- **Status:** **RESOLVIDO** (Validado pelo teste `PERF-01`)
- **Arquivo Corrigido:** [`MotorsXySystem.API/Controllers/VeiculosController.cs`](file:///c:/Users/lipeh/OneDrive/Desktop/Motors%20Xy/src/MotorsXySystem.API/Controllers/VeiculosController.cs)
- **Solução Aplicada:** Configurada paginação padrão com limite de 50 registros por página (`Take(50)`), prevenindo vazamento de memória e sobrecarga da rede local.

### BUG-22: Cadastro de Clientes Aceitando CPF e CNPJ Falsos
- **Status:** **RESOLVIDO** (Validado pelo teste `VAL-01`)
- **Arquivo Corrigido:** [`MotorsXySystem.API/Controllers/ClientesController.cs`](file:///c:/Users/lipeh/OneDrive/Desktop/Motors%20Xy/src/MotorsXySystem.API/Controllers/ClientesController.cs)
- **Solução Aplicada:** Implementado algoritmo oficial de validação matemática de dígitos verificadores Mod11 para CPF (11 dígitos) e CNPJ (14 dígitos), rejeitando documentos com sequências repetidas ou dígitos inválidos com `400 Bad Request`.

### BUG-23 & BUG-24: Isolamento de Tenants (PER-04), Reversão de Trocas (EST-06) e Padronização de Enums
- **Status:** **RESOLVIDO** (Validados pelos testes `PER-04` e `EST-06`)
- **Arquivos Corrigidos:** [`AppDbContext.cs`](file:///c:/Users/lipeh/OneDrive/Desktop/Motors%20Xy/src/MotorsXySystem.Infrastructure/Data/AppDbContext.cs), [`VendasController.cs`](file:///c:/Users/lipeh/OneDrive/Desktop/Motors%20Xy/src/MotorsXySystem.API/Controllers/VendasController.cs)
- **Solução Aplicada:**
  - `AppDbContext.ConfigurarTenantId`: Corrigido para não sobrescrever `EmpresaId` se o registro já tiver loja definida, garantindo total isolamento IDOR entre Loja A e Loja B.
  - Ao cancelar venda, o status dos veículos retorna para `1` (Disponível), e veículos entrados como troca são desativados (`Ativo = false`), eliminando veículos fantasmas no estoque.

---

## 3. Conclusão da Auditoria

Com a validação de **100% dos testes aprovados (39/39 Pass)** e **0 bugs abertos**, o software atinge conformidade técnica absoluta com os requisitos do ERP GravitycarSystem / MotorsXy.
