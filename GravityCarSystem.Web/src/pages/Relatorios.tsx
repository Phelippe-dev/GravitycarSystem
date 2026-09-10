import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchRentabilidade, fetchResumoFinanceiro } from '../api';
import type { RentabilidadeVeiculoDto, ResumoFinanceiroDto } from '../api';
import { 
  BarChart2, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  FileSpreadsheet,
  Printer,
  X,
  User,
  FileText
} from 'lucide-react';
import logoImg from '../assets/logo.png';

const Relatorios: React.FC = () => {
  const navigate = useNavigate();
  const [rentabilidade, setRentabilidade] = useState<RentabilidadeVeiculoDto[]>([]);
  const [resumo, setResumo] = useState<ResumoFinanceiroDto | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [dataInicio, setDataInicio] = useState<string>('');
  const [dataFim, setDataFim] = useState<string>('');
  const [presetAtivo, setPresetAtivo] = useState<string>('');
  const [showModalPdf, setShowModalPdf] = useState(false);

  const getFormaPagamentoBadge = (fp?: string) => {
    const text = fp || 'À Vista';
    if (text.includes('Cheque')) {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.3)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.78rem', fontWeight: 600 }}>
          📑 {text}
        </span>
      );
    }
    if (text.includes('PIX') || text.includes('Pix')) {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.78rem', fontWeight: 600 }}>
          ⚡ {text}
        </span>
      );
    }
    if (text.includes('Financiamento')) {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.78rem', fontWeight: 600 }}>
          🏦 {text}
        </span>
      );
    }
    if (text.includes('Cartão')) {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc', border: '1px solid rgba(99, 102, 241, 0.3)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.78rem', fontWeight: 600 }}>
          💳 {text}
        </span>
      );
    }
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.78rem', color: '#e2e8f0' }}>
        💰 {text}
      </span>
    );
  };

  useEffect(() => {
    carregarRelatorios();
  }, []);

  const carregarRelatorios = async (inicio = dataInicio, fim = dataFim) => {
    setLoading(true);
    try {
        const reqInicio = inicio ? new Date(inicio).toISOString() : undefined;
        const reqFim = fim ? new Date(fim).toISOString() : undefined;
        
        const [rentData, resData] = await Promise.all([
            fetchRentabilidade(reqInicio, reqFim),
            fetchResumoFinanceiro(reqInicio, reqFim)
        ]);
        
        setRentabilidade(rentData);
        setResumo(resData);
    } catch (e) {
        console.error(e);
    }
    setLoading(false);
  };

  const handleFiltrar = (e: React.FormEvent) => {
      e.preventDefault();
      carregarRelatorios();
  };

  const aplicarPeriodo = (tipo: 'hoje' | '7dias' | 'mes' | '30dias' | 'ano' | 'todos') => {
    setPresetAtivo(tipo);
    const hoje = new Date();
    const formatarData = (d: Date) => d.toISOString().split('T')[0];

    let ini = '';
    let fim = '';

    if (tipo === 'hoje') {
      ini = formatarData(hoje);
      fim = formatarData(hoje);
    } else if (tipo === '7dias') {
      const pass = new Date();
      pass.setDate(hoje.getDate() - 7);
      ini = formatarData(pass);
      fim = formatarData(hoje);
    } else if (tipo === 'mes') {
      const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      ini = formatarData(primeiroDia);
      fim = formatarData(hoje);
    } else if (tipo === '30dias') {
      const pass = new Date();
      pass.setDate(hoje.getDate() - 30);
      ini = formatarData(pass);
      fim = formatarData(hoje);
    } else if (tipo === 'ano') {
      const primeiroDiaAno = new Date(hoje.getFullYear(), 0, 1);
      ini = formatarData(primeiroDiaAno);
      fim = formatarData(hoje);
    }

    setDataInicio(ini);
    setDataFim(fim);
    carregarRelatorios(ini, fim);
  };

  // Exportação para Excel (CSV compatível com Excel BR via UTF-8 com BOM e ponto-e-vírgula)
  const exportarExcel = () => {
    if (rentabilidade.length === 0) {
      alert('Não há registros no relatório para exportar no período selecionado.');
      return;
    }

    const headers = [
      'Veículo',
      'Data Venda',
      'Cliente',
      'Vendedor',
      'Forma de Pagamento',
      'Valor Venda (R$)',
      'Custo Total (R$)',
      'Margem Líquida (R$)',
      'Margem (%)'
    ];

    const rows = rentabilidade.map(r => {
      const custoTotal = r.valorCompra + r.totalCustosAdicionais + r.descontoNaVenda;
      const dataFormatada = r.dataVenda ? new Date(r.dataVenda).toLocaleDateString('pt-BR') : '-';
      return [
        `"${(r.veiculoDescricao || '').replace(/"/g, '""')}"`,
        `"${dataFormatada}"`,
        `"${(r.clienteNome || 'Cliente Não Informado').replace(/"/g, '""')}"`,
        `"${(r.vendedorNome || 'Vendedor Padrão').replace(/"/g, '""')}"`,
        `"${(r.formaPagamento || 'À Vista').replace(/"/g, '""')}"`,
        `"${r.valorVenda.toFixed(2).replace('.', ',')}"`,
        `"${custoTotal.toFixed(2).replace('.', ',')}"`,
        `"${r.margemLucroLiquido.toFixed(2).replace('.', ',')}"`,
        `"${r.percentualMargem.toFixed(2).replace('.', ',')}%"`
      ].join(';');
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio-vendas-gravitycar-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const totalVendasPeriodo = rentabilidade.reduce((acc, curr) => acc + curr.valorVenda, 0);
  const totalCustosPeriodo = rentabilidade.reduce((acc, curr) => acc + (curr.valorCompra + curr.totalCustosAdicionais + curr.descontoNaVenda), 0);
  const totalMargemPeriodo = rentabilidade.reduce((acc, curr) => acc + curr.margemLucroLiquido, 0);
  const percMargemPeriodo = totalVendasPeriodo > 0 ? (totalMargemPeriodo / totalVendasPeriodo) * 100 : 0;

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', width: '100%', padding: '24px' }}>
      <header className="page-header print-hidden" style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: 0 }}>
            <BarChart2 size={28} color="var(--color-blue-light)" /> Relatórios Analíticos
          </h1>
          <p style={{ color: 'var(--color-gray-400)', fontSize: '0.9rem', marginTop: '4px', marginBottom: 0 }}>
            Visão consolidada de vendas, margem por veículo, vendedores e formas de pagamento
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button 
            type="button"
            className="btn"
            onClick={exportarExcel}
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '8px', 
              background: 'rgba(16, 185, 129, 0.12)', 
              color: '#34d399', 
              border: '1px solid rgba(16, 185, 129, 0.3)', 
              padding: '9px 16px', 
              fontWeight: 600, 
              fontSize: '0.88rem',
              cursor: 'pointer'
            }}
            title="Exportar planilha analítica para Excel (.csv)"
          >
            <FileSpreadsheet size={18} /> Exportar Excel
          </button>
          <button 
            type="button"
            className="btn btn-primary"
            onClick={() => setShowModalPdf(true)}
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '8px', 
              background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)', 
              padding: '9px 18px', 
              fontWeight: 600, 
              fontSize: '0.88rem', 
              boxShadow: '0 4px 14px rgba(37,99,235,0.3)',
              cursor: 'pointer'
            }}
            title="Visualizar e Imprimir Relatório Oficial em PDF"
          >
            <Printer size={18} /> Exportar PDF
          </button>
        </div>
      </header>

      {/* Filtros */}
      <div className="glass-panel print-hidden" style={{ padding: '24px', marginBottom: '32px' }}>
          {/* Fluid Date Presets */}
          <div className="date-presets-wrapper">
              <span style={{ fontSize: '0.85rem', color: 'var(--color-gray-400)', marginRight: '4px' }}>Período Rápido:</span>
              <button type="button" className={`date-preset-pill ${presetAtivo === 'hoje' ? 'active' : ''}`} onClick={() => aplicarPeriodo('hoje')}>Hoje</button>
              <button type="button" className={`date-preset-pill ${presetAtivo === '7dias' ? 'active' : ''}`} onClick={() => aplicarPeriodo('7dias')}>Últimos 7 dias</button>
              <button type="button" className={`date-preset-pill ${presetAtivo === 'mes' ? 'active' : ''}`} onClick={() => aplicarPeriodo('mes')}>Este Mês</button>
              <button type="button" className={`date-preset-pill ${presetAtivo === '30dias' ? 'active' : ''}`} onClick={() => aplicarPeriodo('30dias')}>Últimos 30 dias</button>
              <button type="button" className={`date-preset-pill ${presetAtivo === 'ano' ? 'active' : ''}`} onClick={() => aplicarPeriodo('ano')}>Ano Atual</button>
              <button type="button" className={`date-preset-pill ${presetAtivo === 'todos' ? 'active' : ''}`} onClick={() => aplicarPeriodo('todos')}>Todos</button>
          </div>

          <form onSubmit={handleFiltrar} style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div className="form-group" style={{ flex: 1, minWidth: '180px', marginBottom: 0 }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Calendar size={16}/> Data Inicial</label>
                  <input type="date" className="form-input" value={dataInicio} onChange={e => { setDataInicio(e.target.value); setPresetAtivo(''); }} />
              </div>
              <div className="form-group" style={{ flex: 1, minWidth: '180px', marginBottom: 0 }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Calendar size={16}/> Data Final</label>
                  <input type="date" className="form-input" value={dataFim} onChange={e => { setDataFim(e.target.value); setPresetAtivo(''); }} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ height: '42px', padding: '0 24px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>Aplicar Filtros</button>
          </form>
      </div>

      {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--color-gray-400)', padding: '40px' }}>Processando relatórios analíticos...</div>
      ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              
              {/* Resumo Financeiro */}
              {resumo && (
                  <div className="print-hidden">
                      <h2 style={{ marginBottom: '16px', fontSize: '1.2rem' }}>Resumo de Fluxo (Entradas x Saídas)</h2>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                          <div className="stat-card glass-panel" style={{ padding: '20px', borderTop: '2px solid var(--color-success)' }}>
                              <div style={{ color: 'var(--color-gray-400)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                                  <TrendingUp size={18} color="var(--color-success)"/> Total de Entradas (Vendas)
                              </div>
                              <div style={{ fontSize: '1.7rem', fontWeight: 700, color: 'var(--color-success)' }}>
                                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(resumo.totalEntradasVendas)}
                              </div>
                          </div>
                          <div className="stat-card glass-panel" style={{ padding: '20px', borderTop: '2px solid var(--color-danger)' }}>
                              <div style={{ color: 'var(--color-gray-400)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                                  <TrendingDown size={18} color="var(--color-danger)"/> Saídas (Compras Veículos)
                              </div>
                              <div style={{ fontSize: '1.7rem', fontWeight: 700, color: 'var(--color-danger)' }}>
                                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(resumo.totalSaidasComprasVeiculos)}
                              </div>
                          </div>
                          <div className="stat-card glass-panel" style={{ padding: '20px', borderTop: '2px solid var(--color-warning)' }}>
                              <div style={{ color: 'var(--color-gray-400)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                                  <TrendingDown size={18} color="var(--color-warning)"/> Saídas (Despesas Operacionais)
                              </div>
                              <div style={{ fontSize: '1.7rem', fontWeight: 700, color: 'var(--color-warning)' }}>
                                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(resumo.totalSaidasContasPagar)}
                              </div>
                          </div>
                          <div className="stat-card glass-panel" style={{ padding: '20px', borderTop: '2px solid var(--color-blue-light)' }}>
                              <div style={{ color: 'var(--color-gray-400)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                                  <DollarSign size={18} color="var(--color-blue-light)"/> Saldo Líquido
                              </div>
                              <div style={{ fontSize: '1.7rem', fontWeight: 700, color: 'var(--color-blue-light)' }}>
                                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(resumo.saldoLiquido)}
                              </div>
                          </div>
                      </div>
                  </div>
              )}

              {/* Rentabilidade de Veículos */}
              <div className="print-hidden">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                      <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Rentabilidade por Veículo (DRE Analítico)</h2>
                      <span style={{ fontSize: '0.85rem', color: 'var(--color-gray-400)' }}>
                          Total de Vendas: <strong style={{ color: '#fff' }}>{rentabilidade.length}</strong>
                      </span>
                  </div>

                  <div className="table-modern-container">
                      <table className="table-modern">
                          <thead>
                              <tr>
                                  <th>Veículo</th>
                                  <th>Data</th>
                                  <th>Cliente</th>
                                  <th>Vendedor</th>
                                  <th>Forma Pagto</th>
                                  <th style={{ textAlign: 'right' }}>Vlr. Venda</th>
                                  <th style={{ textAlign: 'right' }}>Custo Total</th>
                                  <th style={{ textAlign: 'right' }}>Margem Líquida</th>
                                  <th style={{ textAlign: 'right' }}>Margem %</th>
                                  <th style={{ textAlign: 'center' }}>Comprovante</th>
                              </tr>
                          </thead>
                          <tbody>
                              {rentabilidade.length === 0 && (
                                  <tr>
                                      <td colSpan={10} style={{ textAlign: 'center', padding: '32px', color: 'var(--color-gray-400)' }}>
                                          Nenhum dado encontrado para o período selecionado.
                                      </td>
                                  </tr>
                              )}
                              {rentabilidade.map(r => {
                                  const custoTotal = r.valorCompra + r.totalCustosAdicionais + r.descontoNaVenda;
                                  return (
                                      <tr key={r.veiculoId}>
                                          <td>
                                              <strong style={{ color: '#fff' }}>{r.veiculoDescricao}</strong>
                                          </td>
                                          <td style={{ whiteSpace: 'nowrap' }}>
                                              {r.dataVenda ? new Date(r.dataVenda).toLocaleDateString('pt-BR') : '-'}
                                          </td>
                                          <td style={{ color: '#cbd5e1' }}>
                                              {r.clienteNome || 'Cliente Não Informado'}
                                          </td>
                                          <td>
                                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#93c5fd' }}>
                                                  <User size={13} /> {r.vendedorNome || 'Vendedor Padrão'}
                                              </span>
                                          </td>
                                          <td>
                                              {getFormaPagamentoBadge(r.formaPagamento)}
                                          </td>
                                          <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--color-success)' }}>
                                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(r.valorVenda)}
                                          </td>
                                          <td style={{ textAlign: 'right', color: 'var(--color-danger)' }}>
                                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(custoTotal)}
                                          </td>
                                          <td style={{ textAlign: 'right', fontWeight: 'bold', color: r.margemLucroLiquido >= 0 ? 'var(--color-blue-light)' : 'var(--color-danger)' }}>
                                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(r.margemLucroLiquido)}
                                          </td>
                                          <td style={{ textAlign: 'right' }}>
                                              <span className={`badge ${r.percentualMargem >= 10 ? 'badge-success' : 'badge-warning'}`}>
                                                  {r.percentualMargem.toFixed(2)}%
                                              </span>
                                          </td>
                                          <td style={{ textAlign: 'center' }}>
                                              {r.vendaId ? (
                                                  <button
                                                      type="button"
                                                      className="btn"
                                                      onClick={() => navigate(`/contrato/${r.vendaId}`)}
                                                      style={{
                                                          display: 'inline-flex',
                                                          alignItems: 'center',
                                                          gap: '6px',
                                                          padding: '4px 10px',
                                                          fontSize: '0.78rem',
                                                          background: 'rgba(56, 189, 248, 0.12)',
                                                          color: '#38bdf8',
                                                          border: '1px solid rgba(56, 189, 248, 0.25)',
                                                          borderRadius: '6px',
                                                          cursor: 'pointer',
                                                          fontWeight: 600
                                                      }}
                                                      title="Emitir 2ª Via do Comprovante de Venda Oficial"
                                                  >
                                                      <FileText size={13} /> 2ª Via
                                                  </button>
                                              ) : (
                                                  <span style={{ fontSize: '0.75rem', color: 'var(--color-gray-400)' }}>-</span>
                                              )}
                                          </td>
                                      </tr>
                                  );
                              })}
                          </tbody>
                      </table>
                  </div>
              </div>
          </div>
      )}

      {/* Modal / Visualização de Impressão e PDF do Relatório Analítico */}
      {showModalPdf && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          {/* Barra superior de ações */}
          <div className="print-hidden" style={{
            maxWidth: '960px',
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
            background: 'rgba(15, 23, 42, 0.95)',
            padding: '12px 20px',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Printer size={20} color="#38bdf8" />
              <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Visualização para Impressão & Exportação PDF</span>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={() => window.print()}
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 18px', fontSize: '0.9rem', background: '#2563eb' }}
              >
                <Printer size={16} /> Imprimir / Salvar como PDF
              </button>
              <button 
                onClick={() => setShowModalPdf(false)}
                className="btn"
                style={{ padding: '8px 14px', fontSize: '0.9rem', background: 'rgba(255,255,255,0.1)' }}
              >
                <X size={16} /> Fechar
              </button>
            </div>
          </div>

          {/* Documento A4 Estilizado para Impressão/PDF */}
          <div style={{
            maxWidth: '960px',
            width: '100%',
            maxHeight: '85vh',
            overflowY: 'auto',
            background: '#ffffff',
            color: '#1e293b',
            padding: '40px',
            borderRadius: '8px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)',
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }} className="dossie-printable">
            {/* Cabeçalho do Relatório */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #0284c7', paddingBottom: '16px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img src={logoImg} alt="Gravity Car System" style={{ height: '44px', objectFit: 'contain' }} />
                <div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>GRAVITY CAR SYSTEM</div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Relatório Gerencial de Rentabilidade & DRE Analítico</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0284c7' }}>RELATÓRIO FINANCEIRO</div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                  Período: {dataInicio ? new Date(dataInicio).toLocaleDateString('pt-BR') : 'Início'} até {dataFim ? new Date(dataFim).toLocaleDateString('pt-BR') : 'Hoje'}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                  Emissão: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>

            {/* Resumo Consolidado no Relatório */}
            {resumo && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>ENTRADAS (VENDAS)</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#16a34a', marginTop: '2px' }}>
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(resumo.totalEntradasVendas)}
                  </div>
                </div>
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>COMPRAS DE VEÍCULOS</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#dc2626', marginTop: '2px' }}>
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(resumo.totalSaidasComprasVeiculos)}
                  </div>
                </div>
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>DESPESAS OPERACIONAIS</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#d97706', marginTop: '2px' }}>
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(resumo.totalSaidasContasPagar)}
                  </div>
                </div>
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>SALDO OPERACIONAL</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0284c7', marginTop: '2px' }}>
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(resumo.saldoLiquido)}
                  </div>
                </div>
              </div>
            )}

            {/* Tabela de Vendas e Rentabilidade no PDF */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a', marginBottom: '10px' }}>
                Detalhamento de Vendas & Rentabilidade ({rentabilidade.length} veículos comercializados)
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.76rem', border: '1px solid #e2e8f0' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', textAlign: 'left', color: '#475569' }}>
                    <th style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>Veículo</th>
                    <th style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>Data</th>
                    <th style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>Cliente</th>
                    <th style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>Vendedor</th>
                    <th style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>Forma Pagto</th>
                    <th style={{ padding: '8px', borderBottom: '1px solid #e2e8f0', textAlign: 'right' }}>Vlr. Venda</th>
                    <th style={{ padding: '8px', borderBottom: '1px solid #e2e8f0', textAlign: 'right' }}>Custo Total</th>
                    <th style={{ padding: '8px', borderBottom: '1px solid #e2e8f0', textAlign: 'right' }}>Margem Líq.</th>
                    <th style={{ padding: '8px', borderBottom: '1px solid #e2e8f0', textAlign: 'right' }}>Margem %</th>
                  </tr>
                </thead>
                <tbody>
                  {rentabilidade.map(r => {
                    const custoTotal = r.valorCompra + r.totalCustosAdicionais + r.descontoNaVenda;
                    return (
                      <tr key={r.veiculoId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '7px 8px', fontWeight: 600 }}>{r.veiculoDescricao}</td>
                        <td style={{ padding: '7px 8px', color: '#64748b' }}>{r.dataVenda ? new Date(r.dataVenda).toLocaleDateString('pt-BR') : '-'}</td>
                        <td style={{ padding: '7px 8px' }}>{r.clienteNome || 'Cliente Não Informado'}</td>
                        <td style={{ padding: '7px 8px', color: '#0369a1' }}>{r.vendedorNome || 'Vendedor Padrão'}</td>
                        <td style={{ padding: '7px 8px' }}>
                          <span style={{ fontWeight: 600, color: (r.formaPagamento || '').includes('Cheque') ? '#7c3aed' : (r.formaPagamento || '').includes('PIX') ? '#0284c7' : '#334155' }}>
                            {r.formaPagamento || 'À Vista'}
                          </span>
                        </td>
                        <td style={{ padding: '7px 8px', textAlign: 'right', fontWeight: 600, color: '#16a34a' }}>
                          R$ {r.valorVenda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '7px 8px', textAlign: 'right', color: '#dc2626' }}>
                          R$ {custoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '7px 8px', textAlign: 'right', fontWeight: 700, color: r.margemLucroLiquido >= 0 ? '#0284c7' : '#dc2626' }}>
                          R$ {r.margemLucroLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '7px 8px', textAlign: 'right', fontWeight: 600 }}>
                          {r.percentualMargem.toFixed(2)}%
                        </td>
                      </tr>
                    );
                  })}
                  {rentabilidade.length === 0 && (
                    <tr>
                      <td colSpan={9} style={{ padding: '16px', textAlign: 'center', color: '#94a3b8' }}>Nenhuma venda registrada no período selecionado.</td>
                    </tr>
                  )}
                  {rentabilidade.length > 0 && (
                    <tr style={{ background: '#f8fafc', fontWeight: 800, borderTop: '2px solid #cbd5e1' }}>
                      <td colSpan={5} style={{ padding: '10px 8px' }}>TOTAIS DO PERÍODO:</td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', color: '#16a34a' }}>
                        R$ {totalVendasPeriodo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', color: '#dc2626' }}>
                        R$ {totalCustosPeriodo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', color: '#0284c7' }}>
                        R$ {totalMargemPeriodo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                        {percMargemPeriodo.toFixed(2)}%
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Assinaturas / Controle Administrativo */}
            <div style={{ marginTop: '36px', paddingTop: '16px', borderTop: '1px dashed #cbd5e1' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', textAlign: 'center' }}>
                <div>
                  <div style={{ borderTop: '1px solid #0f172a', margin: '24px auto 6px auto', width: '75%' }}></div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700 }}>Gerência Financeira / Comercial</div>
                  <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Gravity Car System</div>
                </div>
                <div>
                  <div style={{ borderTop: '1px solid #0f172a', margin: '24px auto 6px auto', width: '75%' }}></div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700 }}>Diretoria da Concessionária</div>
                  <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Conferência e Fechamento</div>
                </div>
              </div>
            </div>

            {/* Rodapé Comercial */}
            <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.68rem', color: '#94a3b8', borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
              Documento gerado eletronicamente pelo Gravity Car System • Relatório de Auditoria e Rentabilidade Comercial
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Relatorios;
