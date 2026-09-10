import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchVenda, getClienteDetalhes, fetchVeiculos, API_BASE_URL } from '../api';
import type { VendaDto, Cliente, Veiculo } from '../api';
import { Printer, ArrowLeft, ShieldCheck, Car, CreditCard, User } from 'lucide-react';
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
            console.error("Erro ao carregar comprovante de venda:", e);
        }
        setLoading(false);
    };

    if (loading) return <div style={{ padding: '32px' }}>Carregando dados do comprovante...</div>;
    if (!venda || !cliente) return <div style={{ padding: '32px' }}>Comprovante de venda não encontrado.</div>;

    const nomeVendedor = empresa?.razaoSocial || empresa?.nomeFantasia || 'GRAVITY CAR AUTOMÓVEIS';
    const cnpjVendedor = empresa?.cnpj || 'Consulte o cadastro da empresa';
    const enderecoVendedor = empresa?.logradouro 
        ? `${empresa.logradouro}, ${empresa.numero || 'S/N'}${empresa.complemento ? ` - ${empresa.complemento}` : ''} - Bairro ${empresa.bairro || ''}, ${empresa.cidade || ''}/${empresa.estado || 'MG'} - CEP: ${empresa.cep || ''}`
        : 'Endereço da Concessionária';

    const enderecoComprador = cliente.endereco 
        ? `${cliente.endereco}, ${cliente.numero || 's/n'}${cliente.complemento ? ` - ${cliente.complemento}` : ''} - ${cliente.bairro || ''}, ${cliente.cidade || ''}/${cliente.estado || 'MG'} - CEP: ${cliente.cep || ''}`
        : 'Endereço constante no cadastro do cliente';

    const chequesRecebidos = (venda.pagamentos || []).filter(p => p.tipoPagamento === 5);
    const outrosPagamentos = (venda.pagamentos || []).filter(p => p.tipoPagamento !== 5);

    const getTipoPagamentoLabel = (tipo: number, p: any) => {
        switch (tipo) {
            case 1:
                return 'Dinheiro em Espécie';
            case 2:
                return 'PIX / Transferência Instantânea';
            case 3:
                return `Cartão de Crédito ${p.parcelas ? `(${p.parcelas}x)` : ''} ${p.bandeira ? `• ${p.bandeira}` : ''}`;
            case 4:
                return `Cartão de Débito ${p.bandeira ? `• ${p.bandeira}` : ''}`;
            case 5:
                return `Cheque ${p.numeroCheque ? `Nº ${p.numeroCheque}` : ''}`;
            case 6:
                return `Financiamento Bancário ${p.bancoFinanciamento ? `(${p.bancoFinanciamento})` : ''} ${p.parcelas ? `• ${p.parcelas} parcelas` : ''}`;
            case 7:
                return 'Boleto Bancário';
            case 8:
                return 'TED / DOC Bancário';
            case 9:
                return 'Veículo na Troca';
            default:
                return 'Outro';
        }
    };

    return (
        <div style={{ maxWidth: '840px', margin: '0 auto', padding: '24px', background: 'var(--color-bg)', minHeight: '100vh' }}>
            {/* Controles de Navegação e Impressão (Ocultos ao imprimir) */}
            <div className="print-hidden" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', background: 'rgba(15, 23, 42, 0.6)', padding: '12px 18px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <button 
                    className="btn" 
                    style={{ background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid rgba(255,255,255,0.1)' }} 
                    onClick={() => navigate('/vendas')}
                >
                    <ArrowLeft size={18} /> Voltar para Vendas
                </button>
                <button 
                    className="btn btn-primary" 
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '10px 20px', fontWeight: 600 }} 
                    onClick={() => window.print()}
                >
                    <Printer size={18} /> Imprimir Comprovante (PDF)
                </button>
            </div>

            {/* Corpo do Comprovante (Formatado profissionalmente para folha A4 em fundo branco) */}
            <div className="printable-area" style={{ background: '#fff', color: '#0f172a', padding: '40px', borderRadius: '8px', boxShadow: '0 4px 14px rgba(0,0,0,0.15)', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                
                {/* Cabeçalho da Concessionária */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0f172a', paddingBottom: '16px', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <img src={logoImg} alt="Gravity Car System" style={{ height: '54px', objectFit: 'contain' }} />
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>{nomeVendedor}</h2>
                            <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: '#475569' }}>CNPJ: {cnpjVendedor}</p>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>{enderecoVendedor}</p>
                            {empresa?.telefone && <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>Tel: {empresa.telefone} {empresa.email ? `• ${empresa.email}` : ''}</p>}
                        </div>
                    </div>
                    <div style={{ textAlign: 'right', background: '#f8fafc', padding: '10px 14px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            COMPROVANTE DE VENDA
                        </div>
                        <div style={{ margin: '3px 0', fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                            Nº {venda.numeroVenda || venda.id?.substring(0, 8).toUpperCase()}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            Emissão: {new Date(venda.dataVenda || new Date()).toLocaleDateString('pt-BR')}
                        </div>
                    </div>
                </div>

                {/* Bloco do Comprador */}
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '14px', marginBottom: '18px' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <User size={15} color="#0284c7" /> Dados do Comprador / Cliente
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', fontSize: '0.85rem' }}>
                        <div>
                            <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>Nome / Razão Social:</span>
                            <strong style={{ color: '#0f172a' }}>{cliente.nomeRazaoSocial || cliente.nome}</strong>
                        </div>
                        <div>
                            <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>CPF / CNPJ:</span>
                            <strong style={{ color: '#0f172a' }}>{cliente.cpfCnpj}</strong>
                        </div>
                        <div>
                            <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>Telefone / Contato:</span>
                            <span style={{ color: '#0f172a' }}>{cliente.celular || cliente.telefone || 'Não informado'}</span>
                        </div>
                    </div>
                    <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed #cbd5e1', fontSize: '0.82rem', color: '#334155' }}>
                        <span style={{ color: '#64748b' }}>Endereço: </span> {enderecoComprador}
                    </div>
                </div>

                {/* Bloco dos Veículos Vendidos */}
                <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Car size={15} color="#0284c7" /> Veículo(s) Comercializado(s)
                    </div>
                    {veiculos.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {veiculos.map(v => (
                                <div key={v.id} style={{ border: '1px solid #cbd5e1', borderRadius: '6px', padding: '12px', background: '#ffffff' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                                        <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>
                                            {v.marca} {v.modelo} {v.versao || ''}
                                        </div>
                                        <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
                                            PLACA: {v.placa || 'N/A'}
                                        </span>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', fontSize: '0.82rem', color: '#334155' }}>
                                        <div><span style={{ color: '#64748b' }}>Ano Fab/Mod:</span> <strong>{v.anoFabricacao}/{v.anoModelo}</strong></div>
                                        <div><span style={{ color: '#64748b' }}>Cor:</span> <strong>{v.cor || 'N/A'}</strong></div>
                                        <div><span style={{ color: '#64748b' }}>Combustível:</span> <strong>{v.combustivel || 'Flex'}</strong></div>
                                        <div><span style={{ color: '#64748b' }}>Câmbio:</span> <strong>{v.cambio || 'Manual'}</strong></div>
                                        <div><span style={{ color: '#64748b' }}>Quilometragem:</span> <strong>{v.quilometragem ? `${v.quilometragem.toLocaleString('pt-BR')} km` : 'Original'}</strong></div>
                                        {v.chassi && <div><span style={{ color: '#64748b' }}>Chassi:</span> <strong>{v.chassi}</strong></div>}
                                        {v.renavam && <div><span style={{ color: '#64748b' }}>Renavam:</span> <strong>{v.renavam}</strong></div>}
                                    </div>
                                    {v.observacoes && (
                                        <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px dashed #e2e8f0', fontSize: '0.78rem', color: '#475569' }}>
                                            <span style={{ fontWeight: 600 }}>Inspeção / Observações: </span>{v.observacoes}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ border: '1px solid #e2e8f0', padding: '10px', borderRadius: '6px', fontSize: '0.85rem', color: '#64748b' }}>
                            Veículo registrado sob ID de venda {venda.id}.
                        </div>
                    )}
                </div>

                {/* Bloco Financeiro e Formas de Pagamento */}
                <div style={{ marginBottom: '22px' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <CreditCard size={15} color="#0284c7" /> Condições Comerciais & Pagamentos
                    </div>
                    
                    {/* Tabela de Resumo de Valores */}
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', marginBottom: '12px', border: '1px solid #e2e8f0' }}>
                        <tbody>
                            <tr style={{ borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
                                <td style={{ padding: '8px 12px', color: '#64748b' }}>Valor Bruto Negociado:</td>
                                <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((venda.valorLiquido || 0) + (venda.desconto || 0))}
                                </td>
                            </tr>
                            {venda.desconto > 0 && (
                                <tr style={{ borderBottom: '1px solid #f1f5f9', color: '#dc2626' }}>
                                    <td style={{ padding: '8px 12px' }}>Desconto Comercial Concedido:</td>
                                    <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>
                                        - {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(venda.desconto)}
                                    </td>
                                </tr>
                            )}
                            <tr style={{ background: '#f0fdf4', borderTop: '2px solid #bbf7d0' }}>
                                <td style={{ padding: '10px 12px', fontWeight: 800, fontSize: '0.95rem', color: '#166534' }}>VALOR LÍQUIDO FINAL:</td>
                                <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800, fontSize: '1.05rem', color: '#166534' }}>
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(venda.valorLiquido || 0)}
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    {/* Detalhamento dos Cheques (Se houver) */}
                    {chequesRecebidos.length > 0 && (
                        <div style={{ marginTop: '14px', marginBottom: '14px' }}>
                            <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#7c3aed', marginBottom: '6px', textTransform: 'uppercase' }}>
                                📑 Cheques Vinculados a esta Venda ({chequesRecebidos.length} Folhas)
                            </div>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', border: '1px solid #e9d5ff' }}>
                                <thead>
                                    <tr style={{ background: '#faf5ff', color: '#6b21a8', textAlign: 'left' }}>
                                        <th style={{ padding: '6px 10px', borderBottom: '1px solid #e9d5ff' }}>Nº Cheque</th>
                                        <th style={{ padding: '6px 10px', borderBottom: '1px solid #e9d5ff' }}>Banco / Agência / Conta</th>
                                        <th style={{ padding: '6px 10px', borderBottom: '1px solid #e9d5ff' }}>Titular / Emitente</th>
                                        <th style={{ padding: '6px 10px', borderBottom: '1px solid #e9d5ff' }}>Bom Para (Venc.)</th>
                                        <th style={{ padding: '6px 10px', borderBottom: '1px solid #e9d5ff', textAlign: 'right' }}>Valor (R$)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {chequesRecebidos.map((chq, idx) => (
                                        <tr key={idx} style={{ borderBottom: '1px solid #f3e8ff' }}>
                                            <td style={{ padding: '6px 10px', fontWeight: 700 }}>{chq.numeroCheque || `CHQ-${idx + 1}`}</td>
                                            <td style={{ padding: '6px 10px', color: '#4b5563' }}>
                                                {chq.banco || 'Banco'} {chq.agencia ? `• Ag: ${chq.agencia}` : ''} {chq.conta ? `• CC: ${chq.conta}` : ''}
                                            </td>
                                            <td style={{ padding: '6px 10px', color: '#4b5563' }}>{chq.emitente || cliente.nomeRazaoSocial || cliente.nome}</td>
                                            <td style={{ padding: '6px 10px', fontWeight: 600, color: '#1e40af' }}>
                                                {chq.dataBomPara ? new Date(chq.dataBomPara).toLocaleDateString('pt-BR') : 'À Vista'}
                                            </td>
                                            <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 700, color: '#16a34a' }}>
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(chq.valor)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Outras Formas de Pagamento e Veículo na Troca */}
                    {(outrosPagamentos.length > 0 || (venda.trocas && venda.trocas.length > 0)) && (
                        <div style={{ marginTop: '10px' }}>
                            <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#0f172a', marginBottom: '6px', textTransform: 'uppercase' }}>
                                Demais Formas Liquidadas & Veículos na Troca
                            </div>
                            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.84rem', color: '#334155', lineHeight: '1.6' }}>
                                {outrosPagamentos.map((p, idx) => (
                                    <li key={idx}>
                                        <strong>{getTipoPagamentoLabel(p.tipoPagamento, p)}:</strong>{' '}
                                        <span style={{ fontWeight: 700, color: '#16a34a' }}>
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.valor)}
                                        </span>
                                        {p.numeroContrato && ` • Contrato: ${p.numeroContrato}`}
                                        {p.numeroAutorizacao && ` • Aut: ${p.numeroAutorizacao}`}
                                    </li>
                                ))}
                                {venda.trocas && venda.trocas.map((t, idx) => (
                                    <li key={`tr-${idx}`}>
                                        <strong>Veículo Recebido como Entrada/Troca:</strong> {t.marca} {t.modelo} {t.anoModelo ? `(${t.anoModelo})` : ''} • Placa: {t.placa || 'Sem placa'} — Avaliado em:{' '}
                                        <span style={{ fontWeight: 700, color: '#16a34a' }}>
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.valorAvaliacao)}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Termo de Vistoria, Entrega e Ciência */}
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '14px', marginBottom: '32px' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <ShieldCheck size={16} color="#16a34a" /> Termo de Recebimento, Vistoria e Responsabilidade
                    </div>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#475569', lineHeight: '1.5', textAlign: 'justify' }}>
                        O <strong>COMPRADOR</strong> declara ter inspecionado e testado o veículo automotor aqui qualificado, aceitando-o no estado de conservação em que se encontra, recebendo neste ato suas respectivas chaves e manual. Fica expressamente ciente de que, a partir da data e horário desta retirada, assume integral responsabilidade civil, administrativa e penal sobre o uso e condução do veículo, respondendo por quaisquer infrações de trânsito, pontuações na CNH e tributos futuros. A transferência oficial de propriedade perante o órgão de trânsito competente (DETRAN) deverá ser formalizada mediante ATPV-e no prazo legal estipulado.
                    </p>
                </div>

                {/* Assinaturas */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginTop: '40px', marginBottom: '24px' }}>
                    <div style={{ textAlign: 'center', borderTop: '1px solid #0f172a', paddingTop: '8px' }}>
                        <strong style={{ fontSize: '0.85rem', color: '#0f172a' }}>{nomeVendedor.toUpperCase()}</strong>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Concessionária / Vendedor Responsável</div>
                    </div>
                    <div style={{ textAlign: 'center', borderTop: '1px solid #0f172a', paddingTop: '8px' }}>
                        <strong style={{ fontSize: '0.85rem', color: '#0f172a' }}>{(cliente.nomeRazaoSocial || cliente.nome).toUpperCase()}</strong>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Comprador / Titular</div>
                    </div>
                </div>

                {/* Nota de Esclarecimento Legal no Rodapé */}
                <div style={{ textAlign: 'center', fontSize: '0.72rem', color: '#64748b', borderTop: '1px solid #e2e8f0', paddingTop: '12px', lineHeight: 1.5 }}>
                    <div style={{ fontWeight: 700, color: '#334155' }}>
                        GRAVITY CAR SYSTEM • COMPROVANTE COMERCIAL DE VENDA & TERMO DE ENTREGA
                    </div>
                    <div style={{ marginTop: '2px', color: '#94a3b8' }}>
                        Comprovante emitido para conferência comercial e quitação das condições acordadas. Não substitui o documento oficial de transferência (ATPV-e) expedido pelo DETRAN nem a Nota Fiscal Eletrônica (NF-e).
                    </div>
                </div>

            </div>

            <style>
                {`
                @media print {
                    body {
                        background: #fff !important;
                        color: #000 !important;
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
                        margin: 0 !important;
                    }
                }
                `}
            </style>
        </div>
    );
};

export default ContratoVenda;
