$DomainPath = "c:\Users\lipeh\OneDrive\Desktop\Gravity Car System\GravityCarSystem.Domain"

# ACESSO
@"
using System;
using System.Collections.Generic;
using GravityCarSystem.Domain.Common;

namespace GravityCarSystem.Domain.Entities.Acesso;

public class Empresa : AuditableEntity
{
    public string RazaoSocial { get; set; } = string.Empty;
    public string NomeFantasia { get; set; } = string.Empty;
    public string Cnpj { get; set; } = string.Empty;
    public string? InscricaoEstadual { get; set; }
    public string? Telefone { get; set; }
    public string? Email { get; set; }
    public string? Cep { get; set; }
    public string? Logradouro { get; set; }
    public string? Numero { get; set; }
    public string? Bairro { get; set; }
    public string? Cidade { get; set; }
    public string? Estado { get; set; }
    public bool Ativa { get; set; } = true;
    
    public virtual ICollection<Usuario> Usuarios { get; set; } = new List<Usuario>();
}
"@ | Out-File "$DomainPath\Entities\Acesso\Empresa.cs"

@"
using System;
using System.Collections.Generic;
using GravityCarSystem.Domain.Common;

namespace GravityCarSystem.Domain.Entities.Acesso;

public class Usuario : TenantEntity
{
    public string Nome { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string SenhaHash { get; set; } = string.Empty;
    public string? Cpf { get; set; }
    public string? Telefone { get; set; }
    public bool Ativo { get; set; } = true;
    public DateTime? UltimoLogin { get; set; }
    
    public virtual Empresa? Empresa { get; set; }
    public virtual ICollection<UsuarioPerfil> Perfis { get; set; } = new List<UsuarioPerfil>();
}
"@ | Out-File "$DomainPath\Entities\Acesso\Usuario.cs"

@"
using System;
using System.Collections.Generic;
using GravityCarSystem.Domain.Common;

namespace GravityCarSystem.Domain.Entities.Acesso;

public class Perfil : Entity
{
    public string Nome { get; set; } = string.Empty;
    public string? Descricao { get; set; }
    
    public virtual ICollection<PerfilPermissao> Permissoes { get; set; } = new List<PerfilPermissao>();
}
"@ | Out-File "$DomainPath\Entities\Acesso\Perfil.cs"

@"
using System;
using GravityCarSystem.Domain.Common;

namespace GravityCarSystem.Domain.Entities.Acesso;

public class Permissao : Entity
{
    public string Nome { get; set; } = string.Empty;
    public string Modulo { get; set; } = string.Empty;
    public string Acao { get; set; } = string.Empty;
}
"@ | Out-File "$DomainPath\Entities\Acesso\Permissao.cs"

@"
using System;

namespace GravityCarSystem.Domain.Entities.Acesso;

public class UsuarioPerfil
{
    public Guid UsuarioId { get; set; }
    public virtual Usuario? Usuario { get; set; }
    
    public Guid PerfilId { get; set; }
    public virtual Perfil? Perfil { get; set; }
}
"@ | Out-File "$DomainPath\Entities\Acesso\UsuarioPerfil.cs"

@"
using System;

namespace GravityCarSystem.Domain.Entities.Acesso;

public class PerfilPermissao
{
    public Guid PerfilId { get; set; }
    public virtual Perfil? Perfil { get; set; }
    
    public Guid PermissaoId { get; set; }
    public virtual Permissao? Permissao { get; set; }
}
"@ | Out-File "$DomainPath\Entities\Acesso\PerfilPermissao.cs"

# CADASTROS
@"
using System;
using GravityCarSystem.Domain.Common;
using GravityCarSystem.Domain.Enums;

namespace GravityCarSystem.Domain.Entities.Cadastros;

public class Cliente : TenantEntity
{
    public TipoPessoa TipoPessoa { get; set; } = TipoPessoa.Fisica;
    public string NomeRazaoSocial { get; set; } = string.Empty;
    public string? CpfCnpj { get; set; }
    public string? RgIe { get; set; }
    public DateTime? DataNascimento { get; set; }
    public string? Telefone { get; set; }
    public string? Celular { get; set; }
    public string? Email { get; set; }
    
    public string? Cep { get; set; }
    public string? Logradouro { get; set; }
    public string? Numero { get; set; }
    public string? Complemento { get; set; }
    public string? Bairro { get; set; }
    public string? Cidade { get; set; }
    public string? Estado { get; set; }
    
    public string? Observacoes { get; set; }
    public bool Ativo { get; set; } = true;
}
"@ | Out-File "$DomainPath\Entities\Cadastros\Cliente.cs"

@"
using System;
using GravityCarSystem.Domain.Common;
using GravityCarSystem.Domain.Enums;

namespace GravityCarSystem.Domain.Entities.Cadastros;

public class Fornecedor : TenantEntity
{
    public TipoPessoa TipoPessoa { get; set; } = TipoPessoa.Juridica;
    public string NomeRazaoSocial { get; set; } = string.Empty;
    public string? CpfCnpj { get; set; }
    public string? RgIe { get; set; }
    public string? Telefone { get; set; }
    public string? Celular { get; set; }
    public string? Email { get; set; }
    
    public string? Cep { get; set; }
    public string? Logradouro { get; set; }
    public string? Numero { get; set; }
    public string? Complemento { get; set; }
    public string? Bairro { get; set; }
    public string? Cidade { get; set; }
    public string? Estado { get; set; }
    
    public string? Observacoes { get; set; }
    public bool Ativo { get; set; } = true;
}
"@ | Out-File "$DomainPath\Entities\Cadastros\Fornecedor.cs"
