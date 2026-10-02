using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using GravityCarSystem.Application.DTOs.Cadastros;

namespace GravityCarSystem.Application.Interfaces;

public interface IFornecedorService
{
    Task<IEnumerable<FornecedorDto>> ListarAtivosAsync();
    Task<FornecedorDto?> ObterPorIdAsync(Guid id);
    Task<FornecedorDto> CriarAsync(FornecedorDto dto);
    Task<FornecedorDto> AtualizarAsync(Guid id, FornecedorDto dto);
    Task InativarAsync(Guid id);
}
