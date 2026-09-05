import React, { useEffect, useState } from 'react';
import { fetchRentabilidade, fetchResumoFinanceiro } from '../api';
import type { RentabilidadeVeiculoDto, ResumoFinanceiroDto } from '../api';
import { BarChart2, DollarSign, TrendingUp, TrendingDown, Calendar } from 'lucide-react';

const Relatorios: React.FC = () => {
  const [rentabilidade, setRentabilidade] = useState<RentabilidadeVeiculoDto[]>([]);
  const [resumo, setResumo] = useState<ResumoFinanceiroDto | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [dataInicio, setDataInicio] = useState<string>('');
  const [dataFim, setDataFim] = useState<string>('');

  const [presetAtivo, setPresetAtivo] = useState<string>('');

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

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', padding: '24px' }}>
      <header className="page-header" style={{ marginBottom: '32px' }}>
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <BarChart2 size={28} color="var(--color-blue-light)" /> Relatórios Analíticos
        </h1>
      </header>

      {/* Filtros */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '32px' }}>
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

          <form onSubmit={handleFiltrar} style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Calendar size={16}/> Data Inicial</label>
                  <input type="date" className="form-input" value={dataInicio} onChange={e => { setDataInicio(e.target.value); setPresetAtivo(''); }} />
              </div>
              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Calendar size={16}/> Data Final</label>
                  <input type="date" className="form-input" value={dataFim} onChange={e => { setDataFim(e.target.value); setPresetAtivo(''); }} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ height: '42px', padding: '0 24px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>Aplicar Filtros</button>
          </form>
      </div>

      {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--color-gray-400)', padding: '40px' }}>Processando relatórios...</div>
      ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              
              {/* Resumo Financeiro */}
              {resumo && (
                  <div>
                      <h2 style={{ marginBottom: '16px', fontSize: '1.2rem' }}>Resumo de Fluxo (Entradas x Saídas)</h2>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
                          <div className="stat-card glass-panel" style={{ padding: '24px', borderTop: '2px solid var(--color-success)' }}>
                              <div style={{ color: 'var(--color-gray-400)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <TrendingUp size={18} color="var(--color-success)"/> Total de Entradas (Vendas)
                              </div>
                              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--color-success)' }}>
                                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(resumo.totalEntradasVendas)}
                              </div>
                          </div>
                          <div className="stat-card glass-panel" style={{ padding: '24px', borderTop: '2px solid var(--color-danger)' }}>
                              <div style={{ color: 'var(--color-gray-400)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <TrendingDown size={18} color="var(--color-danger)"/> Saídas (Compras de Veículos)
                              </div>
                              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--color-danger)' }}>
                                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(resumo.totalSaidasComprasVeiculos)}
                              </div>
                          </div>
                          <div className="stat-card glass-panel" style={{ padding: '24px', borderTop: '2px solid var(--color-warning)' }}>
                              <div style={{ color: 'var(--color-gray-400)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <TrendingDown size={18} color="var(--color-warning)"/> Saídas (Outras Despesas)
                              </div>
                              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--color-warning)' }}>
                                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(resumo.totalSaidasContasPagar)}
                              </div>
                          </div>
                          <div className="stat-card glass-panel" style={{ padding: '24px', borderTop: '2px solid var(--color-blue-light)' }}>
                              <div style={{ color: 'var(--color-gray-400)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <DollarSign size={18} color="var(--color-blue-light)"/> Saldo Líquido
                              </div>
                              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--color-blue-light)' }}>
                                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(resumo.saldoLiquido)}
                              </div>
                          </div>
                      </div>
                  </div>
              )}

              {/* Rentabilidade de Veículos */}
              <div>
                  <h2 style={{ marginBottom: '16px', fontSize: '1.2rem' }}>Rentabilidade por Veículo (DRE)</h2>
                  <div className="table-modern-container">
                      <table className="table-modern">
                          <thead>
                              <tr>
                                  <th>Veículo</th>
                                  <th>Data Venda</th>
                                  <th style={{ textAlign: 'right' }}>Vlr. Venda</th>
                                  <th style={{ textAlign: 'right' }}>Custo Total</th>
                                  <th style={{ textAlign: 'right' }}>Margem Líquida</th>
                                  <th style={{ textAlign: 'right' }}>Margem %</th>
                              </tr>
                          </thead>
                          <tbody>
                              {rentabilidade.length === 0 && (
                                  <tr>
                                      <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--color-gray-400)' }}>
                                          Nenhum dado encontrado para o período selecionado.
                                      </td>
                                  </tr>
                              )}
                              {rentabilidade.map(r => {
                                  const custoTotal = r.valorCompra + r.totalCustosAdicionais + r.descontoNaVenda;
                                  return (
                                      <tr key={r.veiculoId}>
                                          <td><strong>{r.veiculoDescricao}</strong></td>
                                          <td>{r.dataVenda ? new Date(r.dataVenda).toLocaleDateString() : '-'}</td>
                                          <td style={{ textAlign: 'right', color: 'var(--color-success)' }}>
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
                                      </tr>
                                  );
                              })}
                          </tbody>
                      </table>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Relatorios;
