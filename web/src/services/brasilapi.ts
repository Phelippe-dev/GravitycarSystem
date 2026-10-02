// =====================================================================
// Servico centralizado para APIs gratuitas externas
// - ViaCEP: consulta de endereco por CEP
// - BrasilAPI CNPJ: dados de empresa por CNPJ
// - Parallelum / BrasilAPI FIPE: precos de veiculos
// =====================================================================

// ---- ViaCEP ----

export interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  erro?: boolean;
}

export async function buscarCep(cep: string): Promise<ViaCepResponse | null> {
  const cepLimpo = cep.replace(/\D/g, '');
  if (cepLimpo.length !== 8) return null;
  try {
    const resp = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
    if (!resp.ok) return null;
    const data: ViaCepResponse = await resp.json();
    if (data.erro) return null;
    return data;
  } catch {
    return null;
  }
}

// ---- BrasilAPI CNPJ ----

export interface BrasilApiCnpjResponse {
  cnpj: string;
  razao_social: string;
  nome_fantasia?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  municipio?: string;
  uf?: string;
  cep?: string;
  ddd_telefone_1?: string;
  email?: string;
  situacao_cadastral?: string;
  descricao_situacao_cadastral?: string;
}

export async function buscarCnpj(cnpj: string): Promise<BrasilApiCnpjResponse | null> {
  const cnpjLimpo = cnpj.replace(/\D/g, '');
  if (cnpjLimpo.length !== 14) return null;
  try {
    const resp = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`);
    if (!resp.ok) return null;
    return await resp.json();
  } catch {
    return null;
  }
}

// ---- Parallelum FIPE API ----

export interface FipeMarca {
  nome: string;
  codigo: string;
  valor?: string;
}

export interface FipeModelo {
  nome: string;
  codigo: number | string;
  valor?: number | string;
}

export interface FipePreco {
  Valor?: string;
  valor?: string;
  Marca?: string;
  marca?: string;
  Modelo?: string;
  modelo?: string;
  AnoModelo?: number;
  anoModelo?: number;
  Combustivel?: string;
  combustivel?: string;
  CodigoFipe?: string;
  codigoFipe?: string;
  MesReferencia?: string;
  mesReferencia?: string;
  TipoVeiculo?: number;
  tipoVeiculo?: number;
  SiglaCombustivel?: string;
  siglaCombustivel?: string;
  DataConsulta?: string;
  dataConsulta?: string;
}

export async function buscarMarcasFipe(tipo: 1 | 2 | 3 = 1): Promise<FipeMarca[]> {
  try {
    const t = tipo === 1 ? 'carros' : tipo === 2 ? 'motos' : 'caminhoes';
    const resp = await fetch(`https://parallelum.com.br/fipe/api/v1/${t}/marcas`);
    if (!resp.ok) return [];
    const list: any[] = await resp.json();
    return list.map(item => ({ nome: item.nome, codigo: item.codigo, valor: item.codigo }));
  } catch {
    return [];
  }
}

export async function buscarModelosFipe(tipo: 1 | 2 | 3 = 1, codigoMarca: string): Promise<FipeModelo[]> {
  try {
    const t = tipo === 1 ? 'carros' : tipo === 2 ? 'motos' : 'caminhoes';
    const resp = await fetch(`https://parallelum.com.br/fipe/api/v1/${t}/marcas/${codigoMarca}/modelos`);
    if (!resp.ok) return [];
    const data = await resp.json();
    const modelos: any[] = data.modelos || [];
    return modelos.map(item => ({ nome: item.nome, codigo: item.codigo, valor: item.codigo }));
  } catch {
    return [];
  }
}

export async function buscarAnosFipe(tipo: 1 | 2 | 3 = 1, codigoMarca: string, codigoModelo: string): Promise<{ nome: string; codigo: string; valor: string }[]> {
  try {
    const t = tipo === 1 ? 'carros' : tipo === 2 ? 'motos' : 'caminhoes';
    const resp = await fetch(`https://parallelum.com.br/fipe/api/v1/${t}/marcas/${codigoMarca}/modelos/${codigoModelo}/anos`);
    if (!resp.ok) return [];
    const anos: any[] = await resp.json();
    return anos.map(item => ({ nome: item.nome, codigo: item.codigo, valor: item.codigo }));
  } catch {
    return [];
  }
}

export async function buscarPrecoFipeCompleto(tipo: 1 | 2 | 3 = 1, codigoMarca: string, codigoModelo: string, codigoAno: string): Promise<FipePreco | null> {
  try {
    const t = tipo === 1 ? 'carros' : tipo === 2 ? 'motos' : 'caminhoes';
    const resp = await fetch(`https://parallelum.com.br/fipe/api/v1/${t}/marcas/${codigoMarca}/modelos/${codigoModelo}/anos/${codigoAno}`);
    if (!resp.ok) return null;
    const res = await resp.json();
    return {
      Valor: res.Valor,
      valor: res.Valor || res.valor,
      Marca: res.Marca,
      Modelo: res.Modelo,
      AnoModelo: res.AnoModelo,
      Combustivel: res.Combustivel,
      CodigoFipe: res.CodigoFipe,
      MesReferencia: res.MesReferencia,
      mesReferencia: res.MesReferencia || res.mesReferencia,
      TipoVeiculo: res.TipoVeiculo,
      SiglaCombustivel: res.SiglaCombustivel,
      DataConsulta: res.DataConsulta
    };
  } catch {
    return null;
  }
}


export function fipeValorParaNumero(valorStr: string): number {
  if (!valorStr) return 0;
  return parseFloat(
    valorStr.replace('R$', '').replace(/\s/g, '').replace(/\./g, '').replace(',', '.')
  ) || 0;
}

