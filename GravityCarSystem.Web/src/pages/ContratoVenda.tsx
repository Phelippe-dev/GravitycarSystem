import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchVenda, getClienteDetalhes, fetchVeiculos, API_BASE_URL } from '../api';
import type { VendaDto, Cliente, Veiculo } from '../api';
import { Printer, ArrowLeft } from 'lucide-react';
import logoImg from '../assets/logo.png';

interface EmpresaDados {
    razaoSocial?: string;
    nomeFantasia?: string;
    cnpj?: string;
    inscricaoEstadual?: string;
    telefone?: string;
    email?: string;
    logradouro?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
    cep?: string;
}

const ContratoVenda: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [venda, setVenda] = useState<VendaDto | null>(null);
    const [cliente, setCliente] = useState<Cliente | null>(null);
    const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
    const [empresa, setEmpresa] = useState<EmpresaDados | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        carregarDados();
    }, [id]);

    const carregarDados = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const token = localStorage.getItem('@GravityCar:token');
            const [vendaData, todosVeiculos, empresaResp] = await Promise.all([
                fetchVenda(id),
                fetchVeiculos(),
                fetch(`${API_BASE_URL}/empresa/minha`, {
                    headers: { 'Authorization': token ? `Bearer ${token}` : '' }
                }).then(r => r.ok ? r.json() : null).catch(() => null)
            ]);

            setVenda(vendaData);
            setEmpresa(empresaResp);

            if (vendaData && vendaData.veiculosIds) {
                const veics = todosVeiculos.filter(v => vendaData.veiculosIds.includes(v.id));
                setVeiculos(veics);
            }
            
            if (vendaData && vendaData.clienteId) {
                const clienteData = await getClienteDetalhes(vendaData.clienteId);
                setCliente(clienteData);
            }
        } catch (e) {
            console.error("Erro ao carregar contrato:", e);
        }
        setLoading(false);
    };

    if (loading) return <div style={{ padding: '32px' }}>Carregando dados do contrato...</div>;
    if (!venda || !cliente) return <div style={{ padding: '32px' }}>Contrato não encontrado.</div>;

    const nomeVendedor = empresa?.razaoSocial || empresa?.nomeFantasia || 'GRAVITY CAR SYSTEM';
    const cnpjVendedor = empresa?.cnpj || 'Consulte o cadastro da empresa';
    const enderecoVendedor = empresa?.logradouro 
        ? `${empresa.logradouro}, ${empresa.numero || 'S/N'}${empresa.complemento ? ` - ${empresa.complemento}` : ''} - Bairro ${empresa.bairro || ''}, ${empresa.cidade || ''}/${empresa.estado || 'MG'} - CEP: ${empresa.cep || ''}`
        : 'Endereço da Concessionária';

    const enderecoComprador = cliente.endereco 
        ? `${cliente.endereco}, ${cliente.numero || 's/n'}${cliente.complemento ? ` - ${cliente.complemento}` : ''} - ${cliente.bairro || ''}, ${cliente.cidade || ''}/${cliente.estado || 'MG'} - CEP: ${cliente.cep || ''}`
        : 'Endereço constante no cadastro oficial';

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px', background: 'var(--color-bg)', minHeight: '100vh' }}>
            {/* Controles de Impressão (Ocultos ao imprimir) */}
            <div className="print-hidden" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                <button className="btn" style={{ background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => navigate('/vendas')}>
                    <ArrowLeft size={18} /> Voltar para Vendas
                </button>
                <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => window.print()}>
                    <Printer size={18} /> Imprimir Comprovante de Venda (PDF)
                </button>
            </div>

            {/* Corpo do Contrato (Formatado para folha A4 em fundo branco) */}
            <div className="printable-area" style={{ background: '#fff', color: '#000', padding: '40px', borderRadius: '8px', boxShadow: '0 4px 14px rgba(0,0,0,0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #000', paddingBottom: '16px', marginBottom: '24px' }}>
                    <img src={logoImg} alt="Gravity Car System" style={{ height: '60px' }} />
                    <div style={{ textAlign: 'right' }}>
                        <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800 }}>COMPROVANTE DE VENDA & CONTRATO COMERCIAL</h2>
                        <p style={{ margin: '4px 0 0 0', color: '#555' }}>Venda Nº: {venda.numeroVenda || venda.id?.split('-')[0]}</p>
                        <p style={{ margin: 0, color: '#555' }}>Data: {new Date(venda.dataVenda || new Date()).toLocaleDateString('pt-BR')}</p>
                    </div>
                </div>

                <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ borderBottom: '1px solid #ccc', paddingBottom: '4px', marginBottom: '12px', fontSize: '1.1rem' }}>1. IDENTIFICAÇÃO DAS PARTES</h3>
                    <p style={{ marginBottom: '8px', lineHeight: '1.5' }}>
                        <strong>VENDEDOR:</strong> <strong>{nomeVendedor.toUpperCase()}</strong>, pessoa jurídica de direito privado, inscrita no CNPJ sob nº <strong>{cnpjVendedor}</strong>, com sede em {enderecoVendedor}, telefone: {empresa?.telefone || 'Não informado'}.
                    </p>
                    <p style={{ marginBottom: '8px', lineHeight: '1.5' }}>
                        <strong>COMPRADOR:</strong> <strong>{(cliente.nomeRazaoSocial || cliente.nome).toUpperCase()}</strong>, portador(a) do CPF/CNPJ nº <strong>{cliente.cpfCnpj}</strong>, residente e domiciliado(a) em {enderecoComprador}, telefone de contato: {cliente.celular || cliente.telefone || 'Não informado'}, e-mail: {cliente.email || 'Não informado'}.
                    </p>
                </div>

                <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ borderBottom: '1px solid #ccc', paddingBottom: '4px', marginBottom: '12px', fontSize: '1.1rem' }}>2. OBJETO DO CONTRATO</h3>
                    <p>O VENDEDOR vende e transfere ao COMPRADOR o(s) seguinte(s) veículo(s) automotor(es):</p>
                    
                    {veiculos.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
                            {veiculos.map(v => (
                                <div key={v.id} style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px', background: '#f8fafc' }}>
                                    <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#0f172a', marginBottom: '6px' }}>
                                        {v.marca} {v.modelo} {v.versao || ''}
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', fontSize: '0.88rem', color: '#334155' }}>
                                        <span><strong>Placa:</strong> {v.placa || 'N/A'}</span>
                                        <span><strong>Ano Fab/Mod:</strong> {v.anoFabricacao}/{v.anoModelo}</span>
                                        <span><strong>Cor:</strong> {v.cor || 'N/A'}</span>
                                        <span><strong>Combustível:</strong> {v.combustivel || 'Flex'}</span>
                                        <span><strong>Câmbio:</strong> {v.cambio || 'Manual'}</span>
                                        <span><strong>KM:</strong> {v.quilometragem ? `${v.quilometragem.toLocaleString('pt-BR')} km` : 'Original'}</span>
                                        {v.chassi && <span><strong>Chassi:</strong> {v.chassi}</span>}
                                        {v.renavam && <span><strong>Renavam:</strong> {v.renavam}</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <ul style={{ listStyleType: 'none', padding: 0 }}>
                            {venda.veiculosIds.map(vid => (
                                <li key={vid} style={{ marginBottom: '8px' }}>
                                    - Veículo registrado sob ID: {vid} (conforme laudo e certificado de registro).
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ borderBottom: '1px solid #ccc', paddingBottom: '4px', marginBottom: '12px', fontSize: '1.1rem' }}>3. CONDIÇÕES FINANCEIRAS</h3>
                    <p>O preço certo e ajustado para a presente venda é de <strong>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(venda.valorLiquido || 0)}</strong>, liquidado da seguinte forma:</p>
                    <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
                        {venda.pagamentos.map((p, idx) => (
                            <li key={idx} style={{ marginBottom: '4px' }}>
                                {p.tipoPagamento === 1 ? 'Pagamento à Vista / TED / PIX' : 
                                 p.tipoPagamento === 2 ? 'Cartão' :
                                 p.tipoPagamento === 3 ? 'Cheque' :
                                 `Financiamento Bancário (${p.bancoFinanciamento || 'Instituição Financeira'}) - ${p.parcelas}x parcelas`}: <strong>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.valor)}</strong>
                            </li>
                        ))}
                        {venda.trocas && venda.trocas.length > 0 && venda.trocas.map((t, idx) => (
                            <li key={`t-${idx}`} style={{ marginBottom: '4px' }}>
                                Veículo entregue como parte do pagamento: <strong>{t.marca} {t.modelo} (Placa {t.placa})</strong> — Avaliação: <strong>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.valorAvaliacao)}</strong>
                            </li>
                        ))}
                    </ul>
                    {venda.desconto > 0 && (
                        <p style={{ marginTop: '8px' }}>Desconto comercial concedido: <strong>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(venda.desconto)}</strong></p>
                    )}
                </div>

                <div style={{ marginBottom: '40px' }}>
                    <h3 style={{ borderBottom: '1px solid #ccc', paddingBottom: '4px', marginBottom: '12px', fontSize: '1.1rem' }}>4. DISPOSIÇÕES GERAIS E TRANSFERÊNCIA</h3>
                    <p style={{ textAlign: 'justify', lineHeight: '1.5', fontSize: '0.92rem' }}>
                        O COMPRADOR declara ter vistoriado o veículo e aceito no estado de conservação em que se encontra. A responsabilidade civil, criminal, débitos tributários, multas e infrações cometidas a partir da data e hora da entrega do veículo correrão exclusivamente por conta do COMPRADOR. A transferência de propriedade junto ao DETRAN deverá ser efetivada no prazo legal de até 30 (trinta) dias.
                    </p>
                </div>

                <div style={{ marginTop: '60px', display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ width: '45%', textAlign: 'center', borderTop: '1px solid #000', paddingTop: '8px' }}>
                        <strong>{nomeVendedor.toUpperCase()}</strong><br/>
                        <span style={{ fontSize: '0.85rem', color: '#555' }}>VENDEDOR</span>
                    </div>
                    <div style={{ width: '45%', textAlign: 'center', borderTop: '1px solid #000', paddingTop: '8px' }}>
                        <strong>{(cliente.nomeRazaoSocial || cliente.nome).toUpperCase()}</strong><br/>
                        <span style={{ fontSize: '0.85rem', color: '#555' }}>COMPRADOR</span>
                    </div>
                </div>

                <div style={{ marginTop: '36px', textAlign: 'center', fontSize: '0.72rem', color: '#64748b', borderTop: '1px solid #e2e8f0', paddingTop: '12px', lineHeight: 1.5 }}>
                  <div><strong>GRAVITY CAR SYSTEM • COMPROVANTE COMERCIAL DE VENDA</strong></div>
                  <div style={{ marginTop: '4px', color: '#94a3b8' }}>
                    Comprovante comercial emitido para registro e controle da transação entre as partes. Não substitui o documento oficial de transferência (ATPV-e) emitido pelo órgão de trânsito nem a Nota Fiscal Eletrônica (NF-e).
                  </div>
                </div>

            </div>

            <style>
                {`
                @media print {
                    body {
                        background: #fff;
                        color: #000;
                    }
                    .print-hidden {
                        display: none !important;
                    }
                    .app-container .sidebar {
                        display: none !important;
                    }
                    .main-content {
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    .printable-area {
                        box-shadow: none !important;
                        padding: 0 !important;
                    }
                }
                `}
            </style>
        </div>
    );
};

export default ContratoVenda;

