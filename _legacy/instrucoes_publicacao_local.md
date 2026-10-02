# Instruções Finais de Implantação Local

## 1. Banco de Dados (PostgreSQL)

O sistema agora está configurado para utilizar PostgreSQL no arquivo `appsettings.json`.

**Passo a passo para gerar o banco de dados localmente:**
1. Instale o PostgreSQL (versão 14+ recomendada).
2. Abra o terminal (PowerShell) na pasta da API (`c:\Users\lipeh\OneDrive\Desktop\Gravity Car System\GravityCarSystem.API`).
3. Como nós trocamos o provedor de banco de dados (de SQLite para Npgsql), é preciso apagar as migrações antigas e gerar uma nova (pois o código gerado no C# para SQLite é diferente do Postgres).
   Execute os seguintes comandos no terminal:
   ```powershell
   # Remover a pasta de migrations atual (pois era do SQLite)
   Remove-Item -Recurse -Force ..\GravityCarSystem.Infrastructure\Migrations\

   # Criar a nova migração oficial para o Postgres
   dotnet ef migrations add InitialPostgres -p ..\GravityCarSystem.Infrastructure -s .\GravityCarSystem.API.csproj

   # Aplicar no banco de dados (criará o DB gravitycarsystem)
   dotnet ef database update
   ```

## 2. Configurando o Backup no Google Drive

Foi criado um script automático na pasta `scripts/backup_postgres_gdrive.ps1`.
Para que ele funcione:
1. Instale o programa **Rclone** (https://rclone.org/).
2. No terminal, digite `rclone config`.
3. Escolha `n` (New remote) e chame de `gdrive`. Selecione o provedor `Google Drive` (número 18 ou semelhante dependendo da versão) e siga o fluxo que vai abrir uma janela no navegador para você autorizar a conta Google.
4. Descomente a linha `# rclone copy ...` no nosso script `backup_postgres_gdrive.ps1`.
5. Agende o script no "Agendador de Tarefas do Windows" para rodar todos os dias às 23:00.

## 3. Publicação (Deploy) no IIS (Web Local)

### 3.1. API (.NET Backend)
1. No terminal, na pasta `GravityCarSystem.API`, execute:
   ```powershell
   dotnet publish -c Release -o C:\Publish\GravityAPI
   ```
2. No IIS Manager (digite "Gerenciador do IIS" no Iniciar do Windows):
   - Clique em "Adicionar Site".
   - Nome: `GravityAPI`
   - Caminho Físico: `C:\Publish\GravityAPI`
   - Porta: `5000` (Certifique-se que não haja conflito)
   - *Atenção:* O Pool de Aplicativos do IIS deve estar como "Sem Código Gerenciado" (No Managed Code) já que usamos o Kestrel por trás (via AspNetCoreModuleV2).

### 3.2. Web (Frontend React)
1. Certifique-se de que o computador servidor possui um IP Estático (ex: `192.168.0.100`).
2. Abra o arquivo `GravityCarSystem.Web\.env.production` e coloque o IP correto.
3. No terminal, na pasta `GravityCarSystem.Web`, execute:
   ```powershell
   npm run build
   ```
4. A pasta `dist` será gerada com o sistema finalizado, e ela já conta com o arquivo `web.config` (necessário para que as rotas do React funcionem ao recarregar a página).
5. No IIS Manager:
   - Adicione um novo Site.
   - Nome: `GravityWeb`
   - Caminho Físico: `C:\...\GravityCarSystem.Web\dist`
   - Porta: `80` (A porta padrão web).

### 3.3. Firewall
Vá até "Firewall do Windows com Segurança Avançada", clique em "Regras de Entrada" e crie regras permitindo acesso nas portas `80` (Web) e `5000` (API).

Pronto! Ao conectar qualquer celular ou PC na mesma rede e acessar o IP `http://192.168.0.100`, o Gravity Car System funcionará perfeitamente.

## 4. Varredura de Segurança e Testes (Para o Pendrive)
Antes de entregar o sistema no pendrive para o cliente final, siga este checklist de segurança e testes:

**Segurança:**
1. **JWT Secret:** No arquivo ppsettings.json de produção, troque a chave JwtSettings:Secret para uma string aleatória de no mínimo 32 caracteres. NUNCA deixe a chave padrão.
2. **Senha Padrão:** Peça ao dono da loja (o primeiro usuário SuperAdmin criado) para trocar a senha "123456" ou "260517" logo no primeiro login.
3. **Isolamento de Tenants:** O sistema garante que cada lojista veja apenas seus próprios veículos, vendas e funcionários graças ao filtro global EmpresaId no Entity Framework. O único usuário com acesso à área "Admin Portal" para ver e gerenciar todos os Tenants é o **SuperAdmin** (dmin@gravitycar.com).

**Testes de Validação Funcional (Realizados e Aprovados):**
- [x] **Cadastro de Tenant:** Criar um Tenant e verificar se a API retorna 200 OK. Se houver erros de campo, o sistema agora exibe um lert() no navegador com a mensagem exata (ex: "E-mail já existe" ou "CNPJ inválido").
- [x] **Hierarquia de Permissões (Roles):** Criar Tenants é restrito EXCLUSIVAMENTE ao papel SuperAdmin. Usuários do tipo Admin de outras lojas não conseguem acessar o endpoint /api/admin/empresas (receberão 403 Forbidden).
- [x] **Deleção de Funcionários:** Funcionários agora são deletados limpando primeiramente seus Perfis em cascata (evitando erro de Foreign Key 500 que ocorria anteriormente).
- [x] **Impersonation:** O botão "Entrar" no Admin Portal gera um novo Token herdando os privilégios dentro do banco de dados do Tenant destino, permitindo que a Software House preste suporte sem precisar da senha do cliente.
