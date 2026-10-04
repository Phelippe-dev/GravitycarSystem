namespace MotorsXySystem.Domain.Enums;

/// <summary>Colunas do Kanban de oportunidades.</summary>
public enum EstagioLead
{
    Novo = 1,
    EmContato = 2,
    Qualificado = 3,
    Proposta = 4,
    Negociacao = 5,
    Ganho = 6,
    Perdido = 7
}

public enum OrigemLead
{
    Manual = 1,
    FormularioSite = 2,
    LandingPage = 3,
    WhatsApp = 4,
    Instagram = 5,
    Facebook = 6,
    Marketplace = 7, // OLX, Webmotors, Mercado Livre...
    Telefone = 8,
    Presencial = 9,
    Indicacao = 10
}

/// <summary>Natureza da oportunidade: cliente quer comprar, vender (loja compra) ou trocar.</summary>
public enum TipoOportunidade
{
    Compra = 1,
    Venda = 2,
    Troca = 3
}

public enum TipoRecibo
{
    Venda = 1,
    Sinal = 2
}

public enum StatusAssinatura
{
    NaoSolicitada = 0,
    Pendente = 1,
    Assinado = 2,
    Recusado = 3,
    Expirado = 4,
    Erro = 5
}
