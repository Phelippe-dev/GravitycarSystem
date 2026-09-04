import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchVenda, getClienteDetalhes } from '../api';
import type { VendaDto, Cliente } from '../api';
import { Printer, ArrowLeft } from 'lucide-react';
import logoImg from '../assets/logo.png';

const ContratoVenda: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [venda, setVenda] = useState<VendaDto | null>(null);
    const [cliente, setCliente] = useState<Cliente | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        carregarDados();
    }, [id]);

    const carregarDados = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const vendaData = await fetchVenda(id);
            setVenda(vendaData);
            
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

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px', background: 'var(--color-bg)', minHeight: '100vh' }}>
            {/* Controles de Impressão (Ocultos ao imprimir) */}
            <div className="print-hidden" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                <button className="btn" style={{ background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => navigate('/vendas')}>
                    <ArrowLeft size={18} /> Voltar para Vendas
                </button>
                <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => window.print()}>
                    <Printer size={18} /> Imprimir Contrato
                </button>
            </div>

            {/* Corpo do Contrato (Formatado para folha A4 em fundo branco) */}
            <div className="printable-area" style={{ background: '#fff', color: '#000', padding: '40px', borderRadius: '8px', boxShadow: '0 4px 14px rgba(0,0,0,0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #000', paddingBottom: '16px', marginBottom: '24px' }}>
                    <img src={logoImg} alt="Gravity Car System" style={{ height: '60px' }} />
                    <div style={{ textAlign: 'right' }}>
                        <h2 style={{ margin: 0, fontSize: '1.4rem' }}>CONTRATO DE COMPRA E VENDA DE VEÍCULO</h2>
                        <p style={{ margin: '4px 0 0 0', color: '#555' }}>Venda Nº: {venda.numeroVenda || venda.id?.split('-')[0]}</p>
                        <p style={{ margin: 0, color: '#555' }}>Data: {new Date(venda.dataVenda || new Date()).toLocaleDateString('pt-BR')}</p>
                    </div>
                </div>

                <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ borderBottom: '1px solid #ccc', paddingBottom: '4px', marginBottom: '12px', fontSize: '1.1rem' }}>1. IDENTIFICAÇÃO DAS PARTES</h3>
                    <p><strong>VENDEDOR:</strong> GRAVITY CAR SYSTEM AUTO LTDA, pessoa jurídica de direito privado, inscrita no CNPJ sob nº 12.345.678/0001-90, com sede nesta capital.</p>
                    <p><strong>COMPRADOR:</strong> {cliente.nomeRazaoSocial || cliente.nome}, portador(a) do CPF/CNPJ nº {cliente.cpfCnpj}, residente e domiciliado(a) no endereço constante em nosso banco de dados, com telefone de contato: {cliente.celular || cliente.telefone || 'Não informado'}.</p>
                </div>

                <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ borderBottom: '1px solid #ccc', paddingBottom: '4px', marginBottom: '12px', fontSize: '1.1rem' }}>2. OBJETO DO CONTRATO</h3>
                    <p>O VENDEDOR vende e entrega ao COMPRADOR o(s) seguinte(s) veículo(s) automotor(es):</p>
                    <ul style={{ listStyleType: 'none', padding: 0 }}>
                        {venda.veiculosIds.map(vid => (
                            <li key={vid} style={{ marginBottom: '8px' }}>
                                - Veículo (ID: {vid}) - As características detalhadas encontram-se no laudo de vistoria anexo e certificado de registro.
                            </li>
                        ))}
                    </ul>
                </div>

                <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ borderBottom: '1px solid #ccc', paddingBottom: '4px', marginBottom: '12px', fontSize: '1.1rem' }}>3. CONDIÇÕES FINANCEIRAS</h3>
                    <p>O preço certo e ajustado para a presente venda é de <strong>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(venda.valorLiquido || 0)}</strong>, que será pago da seguinte forma:</p>
                    <ul style={{ paddingLeft: '20px' }}>
                        {venda.pagamentos.map((p, idx) => (
                            <li key={idx} style={{ marginBottom: '4px' }}>
                                {p.tipoPagamento === 1 ? 'Pagamento à Vista' : `Financiamento (${p.bancoFinanciamento || 'Banco Parceiro'}) - ${p.parcelas} parcelas`}: <strong>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.valor)}</strong>
                            </li>
                        ))}
                        {venda.trocas && venda.trocas.length > 0 && venda.trocas.map((t, idx) => (
                            <li key={`t-${idx}`} style={{ marginBottom: '4px' }}>
                                Veículo na Troca ({t.marca} {t.modelo} {t.placa}): Abatimento de <strong>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.valorAvaliacao)}</strong>
                            </li>
                        ))}
                    </ul>
                    {venda.desconto > 0 && (
                        <p style={{ marginTop: '8px' }}>Desconto concedido: <strong>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(venda.desconto)}</strong></p>
                    )}
                </div>

                <div style={{ marginBottom: '40px' }}>
                    <h3 style={{ borderBottom: '1px solid #ccc', paddingBottom: '4px', marginBottom: '12px', fontSize: '1.1rem' }}>4. DISPOSIÇÕES GERAIS</h3>
                    <p style={{ textAlign: 'justify' }}>O veículo é entregue nas condições em que se encontra, tendo sido previamente vistoriado e testado pelo COMPRADOR. A transferência de propriedade deverá ser efetivada no prazo de 30 dias contados desta data, ficando o COMPRADOR responsável por todas as despesas, multas e tributos incidentes após a entrega das chaves.</p>
                </div>

                <div style={{ marginTop: '60px', display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ width: '45%', textAlign: 'center', borderTop: '1px solid #000', paddingTop: '8px' }}>
                        <strong>VENDEDOR</strong><br/>
                        Gravity Car System
                    </div>
                    <div style={{ width: '45%', textAlign: 'center', borderTop: '1px solid #000', paddingTop: '8px' }}>
                        <strong>COMPRADOR</strong><br/>
                        {cliente.nome}
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
