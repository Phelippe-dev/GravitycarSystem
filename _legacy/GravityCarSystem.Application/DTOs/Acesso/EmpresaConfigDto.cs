using System;

namespace GravityCarSystem.Application.DTOs.Acesso;

public record EmpresaConfigDto(
    string RazaoSocial,
    string NomeFantasia,
    string Cnpj,
    string InscricaoEstadual,
    string InscricaoMunicipal,
    string Telefone,
    string Email,
    string Site,
    string Logradouro,
    string Numero,
    string Complemento,
    string Bairro,
    string Cidade,
    string Estado,
    string Cep,
    string RegimeTributario,
    string ResponsavelTecnico
);
