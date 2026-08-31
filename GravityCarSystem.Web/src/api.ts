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
}

export interface Cliente {
    id: string;
    nome: string;
    nomeRazaoSocial?: string;
    cpfCnpj: string;
    email?: string;
    telefone?: string;
}

export interface VendaDto {
    clienteId: string;
    usuarioId: string;
    veiculosIds: string[];
    desconto: number;
    observacoes?: string;
}

export interface DashboardStats {
    totalVeiculos: number;
    veiculosDisponiveis: number;
    veiculosVendidos: number;
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
    return {
        totalVeiculos: veiculos.length,
        veiculosDisponiveis: veiculos.filter(v => v.status === 4).length, // 4 = Disponivel
        veiculosVendidos: veiculos.filter(v => v.status === 6).length,    // 6 = Vendido
    };
};

// -- Clientes --
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
export const realizarVenda = async (venda: VendaDto): Promise<any> => {
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
