export const API_BASE_URL = 'http://localhost:5263/api';

export interface Veiculo {
    id: string;
    marca: string;
    modelo: string;
    versao: string;
    anoFabricacao: number;
    anoModelo: number;
    valorVenda: number;
    status: number;
    placa?: string;
    observacoes?: string;
    cor?: string;
    combustivel?: string;
    cambio?: string;
    quilometragem?: number;
    valorCompra?: number;
    renavam?: string;
    chassi?: string;
    fotoPrincipal?: string;
    dataEntrada?: string;
}

export interface Cliente {
    id: string;
    nome: string;
    nomeRazaoSocial?: string;
    cpfCnpj: string;
    email?: string;
    telefone?: string;
    celular?: string;
}

export interface VendaPagamentoDto {
    tipoPagamento: number;
    valor: number;
    bancoFinanciamento?: string;
    parcelas?: number;
    valorParcela?: number;
    taxaJuros?: number;
}

export interface VendaTrocaDto {
    marca: string;
    modelo: string;
    versao: string;
    anoFabricacao: number;
    anoModelo: number;
    placa: string;
    valorAvaliacao: number;
}

export interface Cheque {
    id: string;
    clienteId: string;
    clienteNome?: string;
    banco?: string;
    agencia?: string;
    conta?: string;
    numeroCheque?: string;
    valor: number;
    dataEmissao: string;
    dataBomPara: string;
    status: number; // 0=Recebido, 1=Custodia, 2=Depositado, 3=Compensado, 4=Devolvido
    dataDeposito?: string;
    dataCompensacao?: string;
    observacao?: string;
}

export const fetchCheques = async (): Promise<Cheque[]> => {
    const response = await fetch(`${API_BASE_URL}/cheques`, { headers: getHeaders() });
    return response.json();
};

export const alterarStatusCheque = async (id: string, novoStatus: number): Promise<Cheque> => {
    const response = await fetch(`${API_BASE_URL}/cheques/${id}/status`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ status: novoStatus })
    });
    return response.json();
};

export interface VendaDto {
    id?: string;
    numeroVenda?: string;
    status?: number;
    dataVenda?: string;
    valorLiquido?: number;
    clienteId: string;
    usuarioId: string;
    veiculosIds: string[];
    desconto: number;
    observacoes?: string;
    pagamentos: VendaPagamentoDto[];
    trocas: VendaTrocaDto[];
}

export interface DashboardStats {
    totalVeiculos: number;
    veiculosDisponiveis: number;
    veiculosVendidos: number;
    totalContasPagar: number;
    totalContasReceber: number;
}

// -- Helper para injetar o Token JWT --
const getHeaders = () => {
    const token = localStorage.getItem('@GravityCar:token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};

// -- Veículos --
export const fetchVeiculos = async (): Promise<Veiculo[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/veiculos`, {
            headers: getHeaders()
        });
        if (!response.ok) throw new Error('Erro ao buscar veículos');
        return await response.json();
    } catch (error) {
        console.error(error);
        return [];
    }
};

export const adicionarVeiculo = async (veiculo: Partial<Veiculo>): Promise<Veiculo> => {
    const response = await fetch(`${API_BASE_URL}/veiculos`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(veiculo)
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Erro ao adicionar veículo');
    }

    return await response.json();
};

export const fetchStats = async (veiculos: Veiculo[]): Promise<DashboardStats> => {
    let totalContasPagar = 0;
    let totalContasReceber = 0;
    
    try {
        const contasPagar = await fetchContasPagar();
        totalContasPagar = contasPagar.reduce((acc, curr) => acc + curr.saldo, 0);
        
        const contasReceber = await fetchContasReceber();
        totalContasReceber = contasReceber.reduce((acc, curr) => acc + curr.saldo, 0);
    } catch (e) {
        console.error("Erro ao carregar dados financeiros no fetchStats", e);
    }

    return {
        totalVeiculos: veiculos.length,
        veiculosDisponiveis: veiculos.filter(v => v.status === 4).length, // 4 = Disponivel
        veiculosVendidos: veiculos.filter(v => v.status === 6).length,    // 6 = Vendido
        totalContasPagar,
        totalContasReceber
    };
};

// -- Clientes --
export interface ClienteDetalhes extends Cliente {
    vendasRealizadas: VendaDto[];
    veiculosNaTroca: VendaTrocaDto[];
}

export const fetchClientes = async (): Promise<Cliente[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/clientes`, {
            headers: getHeaders()
        });
        if (!response.ok) throw new Error('Erro ao buscar clientes');
        return await response.json();
    } catch (error) {
        console.error(error);
        return [];
    }
};

export const getClienteDetalhes = async (id: string): Promise<ClienteDetalhes> => {
    const response = await fetch(`${API_BASE_URL}/clientes/${id}/detalhes`, { headers: getHeaders() });
    return response.json();
};

export const adicionarCliente = async (cliente: Partial<Cliente>): Promise<Cliente> => {
    const response = await fetch(`${API_BASE_URL}/clientes`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(cliente)
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Erro ao adicionar cliente');
    }

    return await response.json();
};

// -- Vendas --
export const realizarVenda = async (venda: VendaDto): Promise<VendaDto> => {
    const response = await fetch(`${API_BASE_URL}/vendas`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(venda)
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Erro ao realizar venda');
    }

    return await response.json();
};

export const fetchVenda = async (id: string): Promise<VendaDto | null> => {
    try {
        const response = await fetch(`${API_BASE_URL}/vendas/${id}`, { headers: getHeaders() });
        if (!response.ok) throw new Error('Erro ao buscar venda');
        return await response.json();
    } catch {
        return null;
    }
};

// --- FASE 2: DETALHES, FOTOS, DOCUMENTOS, CUSTOS ---

export interface VeiculoFoto {
    id: string;
    url: string;
    isPrincipal: boolean;
}

export interface VeiculoDocumento {
    id: string;
    nomeArquivo: string;
    url: string;
    tipoDocumento?: string;
}

export interface VeiculoCusto {
    id?: string;
    descricao: string;
    valor: number;
    dataCusto: string;
}

export interface VeiculoHistorico {
    id: string;
    statusAnterior: number;
    statusNovo: number;
    observacao?: string;
    dataAlteracao: string;
}

export interface VeiculoDetalhes extends Veiculo {
    fotos: VeiculoFoto[];
    documentos: VeiculoDocumento[];
    custos: VeiculoCusto[];
    historico: VeiculoHistorico[];
}

export const getVeiculoDetalhes = async (id: string): Promise<VeiculoDetalhes> => {
    const response = await fetch(`${API_BASE_URL}/veiculos/${id}/detalhes`, { headers: getHeaders() });
    return response.json();
};

export const uploadFotoVeiculo = async (id: string, file: File, isPrincipal: boolean = false): Promise<VeiculoFoto> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('isPrincipal', String(isPrincipal));

    const token = localStorage.getItem('@GravityCar:token');
    const response = await fetch(`${API_BASE_URL}/veiculos/${id}/fotos`, {
        method: 'POST',
        headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            // Não defina Content-Type, o navegador define multipart/form-data com o boundary
        },
        body: formData
    });

    if (!response.ok) {
        throw new Error('Falha no upload da foto');
    }

    return response.json();
};

export const uploadDocumentoVeiculo = async (id: string, file: File, tipo: string = 'Outro'): Promise<VeiculoDocumento> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('tipo', tipo);

    const token = localStorage.getItem('@GravityCar:token');
    const response = await fetch(`${API_BASE_URL}/veiculos/${id}/documentos`, {
        method: 'POST',
        headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: formData
    });

    if (!response.ok) {
        throw new Error('Falha no upload do documento');
    }

    return response.json();
};

export const adicionarCustoVeiculo = async (id: string, custo: VeiculoCusto): Promise<VeiculoCusto> => {
    const response = await fetch(`${API_BASE_URL}/veiculos/${id}/custos`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(custo),
    });
    return response.json();
};

// --- FASE 3: FINANCEIRO E DASHBOARDS ---

export interface ContaPagarDto {
    id: string;
    fornecedorNome: string;
    categoriaNome: string;
    descricao: string;
    valorOriginal: number;
    valorPago: number;
    saldo: number;
    dataVencimento: string;
    status: number;
}

export interface ContaReceberDto {
    id: string;
    clienteNome: string;
    descricao: string;
    valorOriginal: number;
    valorPago: number;
    saldo: number;
    dataVencimento: string;
    status: number;
}

export const fetchContasPagar = async (): Promise<ContaPagarDto[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/contaspagar`, { headers: getHeaders() });
        if (!response.ok) throw new Error('Erro ao buscar contas a pagar');
        return await response.json();
    } catch { return []; }
};

export const fetchContasReceber = async (): Promise<ContaReceberDto[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/contasreceber`, { headers: getHeaders() });
        if (!response.ok) throw new Error('Erro ao buscar contas a receber');
        return await response.json();
    } catch { return []; }
};

// --- FASE 4: RELATÓRIOS ---

export interface RentabilidadeVeiculoDto {
    veiculoId: string;
    veiculoDescricao: string;
    valorCompra: number;
    valorVenda: number;
    totalCustosAdicionais: number;
    descontoNaVenda: number;
    margemLucroLiquido: number;
    percentualMargem: number;
    dataVenda?: string;
}

export interface ResumoFinanceiroDto {
    totalEntradasVendas: number;
    totalSaidasContasPagar: number;
    totalSaidasComprasVeiculos: number;
    saldoLiquido: number;
}

export const fetchRentabilidade = async (dataInicio?: string, dataFim?: string): Promise<RentabilidadeVeiculoDto[]> => {
    try {
        let url = `${API_BASE_URL}/relatorios/rentabilidade`;
        const params = new URLSearchParams();
        if (dataInicio) params.append('dataInicio', dataInicio);
        if (dataFim) params.append('dataFim', dataFim);
        if (params.toString()) url += `?${params.toString()}`;

        const response = await fetch(url, { headers: getHeaders() });
        if (!response.ok) throw new Error('Erro ao buscar relatório de rentabilidade');
        return await response.json();
    } catch { return []; }
};

export const fetchResumoFinanceiro = async (dataInicio?: string, dataFim?: string): Promise<ResumoFinanceiroDto | null> => {
    try {
        let url = `${API_BASE_URL}/relatorios/resumo-financeiro`;
        const params = new URLSearchParams();
        if (dataInicio) params.append('dataInicio', dataInicio);
        if (dataFim) params.append('dataFim', dataFim);
        if (params.toString()) url += `?${params.toString()}`;

        const response = await fetch(url, { headers: getHeaders() });
        if (!response.ok) throw new Error('Erro ao buscar resumo financeiro');
        return await response.json();
    } catch { return null; }
};

// --- FASE 4: FISCAL ---

export interface NotaFiscalDto {
    id: string;
    chaveAcesso: string;
    numero?: string;
    serie?: string;
    tipo: number; // 0: Entrada, 1: Saída
    dataEmissao: string;
    emitenteCnpj?: string;
    emitenteNome?: string;
    destinatarioCnpj?: string;
    destinatarioNome?: string;
    valorTotal: number;
    naturezaOperacao?: string;
    cfop?: string;
    valorIcms: number;
    valorPis: number;
    valorCofins: number;
    status: number;
}

export const fetchNotasFiscais = async (
    dataInicio?: string, 
    dataFim?: string, 
    tipo?: string, 
    status?: string, 
    busca?: string
): Promise<NotaFiscalDto[]> => {
    try {
        let url = `${API_BASE_URL}/notasfiscais`;
        const params = new URLSearchParams();
        if (dataInicio) params.append('DataInicio', dataInicio);
        if (dataFim) params.append('DataFim', dataFim);
        if (tipo) params.append('Tipo', tipo);
        if (status) params.append('Status', status);
        if (busca) params.append('Busca', busca);
        
        if (params.toString()) url += `?${params.toString()}`;

        const response = await fetch(url, { headers: getHeaders() });
        if (!response.ok) throw new Error('Erro ao buscar notas fiscais');
        return await response.json();
    } catch { return []; }
};

export const emitirNotaFiscalVenda = async (vendaId: string): Promise<NotaFiscalDto | null> => {
    try {
        const response = await fetch(`${API_BASE_URL}/notasfiscais/emitir/venda`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ vendaId, naturezaOperacao: 'Venda de Veículo' })
        });
        if (!response.ok) throw new Error('Erro ao emitir NF');
        return await response.json();
    } catch (e) {
        console.error(e);
        return null;
    }
};

export const emitirNotaFiscalEntrada = async (veiculoId: string, clienteId: string, valorCompra: number): Promise<NotaFiscalDto | null> => {
    try {
        const response = await fetch(`${API_BASE_URL}/notasfiscais/emitir/entrada`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ veiculoId, clienteId, valorCompra, naturezaOperacao: 'Entrada Trade-In / Compra' })
        });
        if (!response.ok) throw new Error('Erro ao emitir NF Entrada');
        return await response.json();
    } catch (e) {
        console.error(e);
        return null;
    }
};

// --- FASE 5: INTEGRAÇÕES SENATRAN / RENAVE ---
export interface SenatranVeiculoResultDto {
    placa: string;
    renavam: string;
    marcaModelo: string;
    anoFabricacao: number;
    anoModelo: number;
    possuiRestricaoRouboFurto: boolean;
    possuiRestricaoJudicial: boolean;
    possuiAlienacaoFiduciaria: boolean;
    totalDebitosPendentes: number;
    statusRenave: string;
    dataConsulta: string;
}

export const consultarSenatran = async (placa: string, renavam: string = ''): Promise<SenatranVeiculoResultDto | null> => {
    try {
        const response = await fetch(`${API_BASE_URL}/senatran/consulta?placa=${placa}&renavam=${renavam}`, { headers: getHeaders() });
        if (!response.ok) throw new Error('Erro na consulta ao SENATRAN');
        return await response.json();
    } catch (e) {
        console.error(e);
        return null;
    }
};

export const registrarEntradaRenave = async (veiculoId: string): Promise<boolean> => {
    try {
        const response = await fetch(`${API_BASE_URL}/senatran/renave/entrada/${veiculoId}`, { 
            method: 'POST', 
            headers: getHeaders() 
        });
        return response.ok;
    } catch {
        return false;
    }
};
// ================= ADMIN PORTAL ==================

export interface Empresa {
    id?: string;
    razaoSocial: string;
    nomeFantasia: string;
    cnpj: string;
    inscricaoEstadual?: string;
    telefone?: string;
    email?: string;
    cidade?: string;
    estado?: string;
    ativa: boolean;
    criadoEm: string;
}

export const fetchEmpresas = async (): Promise<Empresa[]> => {
    const response = await fetch(`${API_BASE_URL}/admin/empresas`, { headers: getHeaders() });
    return response.json();
};

export const createEmpresa = async (empresa: Partial<Empresa>): Promise<Empresa> => {
    const response = await fetch(`${API_BASE_URL}/admin/empresas`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(empresa)
    });
    return response.json();
};

export const toggleStatusEmpresa = async (id: string): Promise<{ ativa: boolean }> => {
    const response = await fetch(`${API_BASE_URL}/admin/empresas/${id}/toggle-status`, {
        method: 'PATCH',
        headers: getHeaders()
    });
    return response.json();
};

// ================= AVALIAÇÕES ==================
export interface Avaliacao {
    id: string;
    clienteId: string;
    veiculoId?: string;
    marca?: string;
    modelo?: string;
    versao?: string;
    placa?: string;
    anoFabricacao?: number;
    anoModelo?: number;
    valorMercado?: number;
    valorAvaliacao?: number;
    valorAprovado?: number;
    status: number;
    dataAvaliacao?: string;
}

export const fetchAvaliacoes = async (): Promise<Avaliacao[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/avaliacoes`, { headers: getHeaders() });
        if (!response.ok) return [];
        return await response.json();
    } catch (e) {
        console.error(e);
        return [];
    }
};
