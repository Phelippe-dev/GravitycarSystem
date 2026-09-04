using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using GravityCarSystem.Domain.Entities.Acesso;
using GravityCarSystem.Domain.Entities.Cadastros;
using GravityCarSystem.Domain.Entities.Financeiro;
using GravityCarSystem.Domain.Entities.Negocio;
using GravityCarSystem.Domain.Entities.Veiculos;

using GravityCarSystem.Domain.Entities.Auditoria;
using GravityCarSystem.Domain.Entities.Fiscal;

namespace GravityCarSystem.Application.Interfaces;

public interface IAppDbContext
{
    // Acesso
    DbSet<Empresa> Empresas { get; }
    DbSet<Usuario> Usuarios { get; }
    DbSet<Perfil> Perfis { get; }
    DbSet<Permissao> Permissoes { get; }
    DbSet<UsuarioPerfil> UsuarioPerfis { get; }
    DbSet<PerfilPermissao> PerfilPermissoes { get; }

    // Cadastros
    DbSet<Cliente> Clientes { get; }
    DbSet<Fornecedor> Fornecedores { get; }

    // Veiculos
    DbSet<Veiculo> Veiculos { get; }
    DbSet<VeiculoFoto> VeiculoFotos { get; }
    DbSet<VeiculoDocumento> VeiculoDocumentos { get; }
    DbSet<VeiculoCusto> VeiculoCustos { get; }
    DbSet<VeiculoHistorico> VeiculoHistoricos { get; }
    DbSet<VeiculoConsulta> VeiculoConsultas { get; }
    DbSet<Avaliacao> Avaliacoes { get; }
    DbSet<AvaliacaoItem> AvaliacaoItens { get; }

    // Negocio
    DbSet<Compra> Compras { get; }
    DbSet<CompraVeiculo> CompraVeiculos { get; }
    DbSet<Venda> Vendas { get; }
    DbSet<VendaVeiculo> VendaVeiculos { get; }
    DbSet<VendaPagamento> VendaPagamentos { get; }
    DbSet<VendaTroca> VendaTrocas { get; }
    DbSet<Cheque> Cheques { get; }

    // Financeiro
    DbSet<ContaReceber> ContasReceber { get; }
    DbSet<ContaPagar> ContasPagar { get; }
    DbSet<CategoriaFinanceira> CategoriasFinanceiras { get; }
    DbSet<ContaFinanceira> ContasFinanceiras { get; }
    DbSet<MovimentoFinanceiro> MovimentosFinanceiros { get; }

    // Fiscal e Auditoria
    DbSet<NotaFiscal> NotasFiscais { get; }
    DbSet<NotaFiscalItem> NotaFiscalItens { get; }
    DbSet<AuditoriaLog> AuditoriaLogs { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
