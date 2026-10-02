import React, { useEffect, useState, useMemo } from 'react';
import { fetchCheques, alterarStatusCheque } from '../api';
import type { Cheque } from '../api';
import { 
  CreditCard, Search, ArrowRightCircle, CheckCircle, AlertCircle, 
  Clock, AlertTriangle, Calendar, RotateCcw, CheckCircle2
} from 'lucide-react';

const Cheques: React.FC = () => {
  const [cheques, setCheques] = useState<Cheque[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [termoBusca, setTermoBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'custodia' | 'urgentes' | 'depositados' | 'compensados' | 'devolvidos'>('todos');

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const data = await fetchCheques();
      setCheques(data);
    } catch (err) {
      console.error('Erro ao buscar cheques', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMudarStatus = async (id: string, novoStatus: number) => {
    setUpdating(id);
    try {
      await alterarStatusCheque(id, novoStatus);
      await carregarDados();
    } catch (e) {
      console.error('Erro ao atualizar status', e);
    } finally {
      setUpdating(null);
    }
  };

  const hoje = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Cálculo de métricas financeiras
  const metricas = useMemo(() => {
    const emCustodia = cheques.filter(c => c.status === 0 || c.status === 1);
    const totalCustodia = emCustodia.reduce((acc, c) => acc + c.valor, 0);

    const proximos7Dias = emCustodia.filter(c => {
      if (!c.dataBomPara) return false;
      const dataVenc = new Date(c.dataBomPara);
      dataVenc.setHours(0, 0, 0, 0);
      const diffMs = dataVenc.getTime() - hoje.getTime();
      const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      return diffDias <= 7; // Vencidos ou a vencer em 7 dias
    });
    const totalProximos7Dias = proximos7Dias.reduce((acc, c) => acc + c.valor, 0);

    const depositados = cheques.filter(c => c.status === 2);
    const totalDepositados = depositados.reduce((acc, c) => acc + c.valor, 0);

    const compensados = cheques.filter(c => c.status === 3);
    const totalCompensados = compensados.reduce((acc, c) => acc + c.valor, 0);

    const devolvidos = cheques.filter(c => c.status === 4);
    const totalDevolvidos = devolvidos.reduce((acc, c) => acc + c.valor, 0);

    return {
      emCustodiaQtd: emCustodia.length,
      totalCustodia,
      proximos7DiasQtd: proximos7Dias.length,
      totalProximos7Dias,
      depositadosQtd: depositados.length,
      totalDepositados,
      compensadosQtd: compensados.length,
      totalCompensados,
      devolvidosQtd: devolvidos.length,
      totalDevolvidos
    };
  }, [cheques, hoje]);

  // Cheques filtrados por busca e por aba
  const chequesFiltrados = useMemo(() => {
    return cheques.filter(c => {
      // Filtro de busca textual
      if (termoBusca.trim()) {
        const t = termoBusca.toLowerCase();
        const matchCliente = c.clienteNome?.toLowerCase().includes(t);
        const matchEmitente = c.emitente?.toLowerCase().includes(t);
        const matchBanco = c.banco?.toLowerCase().includes(t);
        const matchNumero = c.numeroCheque?.toLowerCase().includes(t);
        const matchAgencia = c.agencia?.toLowerCase().includes(t);
        const matchConta = c.conta?.toLowerCase().includes(t);
        if (!matchCliente && !matchEmitente && !matchBanco && !matchNumero && !matchAgencia && !matchConta) {
          return false;
        }
      }

      // Filtro por categoria / status
      if (filtroStatus === 'custodia') {
        return c.status === 0 || c.status === 1;
      }
      if (filtroStatus === 'urgentes') {
        if (c.status !== 0 && c.status !== 1) return false;
        if (!c.dataBomPara) return false;
        const dataVenc = new Date(c.dataBomPara);
        dataVenc.setHours(0, 0, 0, 0);
        const diffMs = dataVenc.getTime() - hoje.getTime();
        const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        return diffDias <= 7;
      }
      if (filtroStatus === 'depositados') {
        return c.status === 2;
      }
      if (filtroStatus === 'compensados') {
        return c.status === 3;
      }
      if (filtroStatus === 'devolvidos') {
        return c.status === 4;
      }

      return true; // 'todos'
    });
  }, [cheques, termoBusca, filtroStatus, hoje]);

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 0:
      case 1:
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600, background: 'rgba(234, 179, 8, 0.15)', color: '#facc15', border: '1px solid rgba(234, 179, 8, 0.3)' }}>
            <Clock size={13}/> Em Custódia
          </span>
        );
      case 2:
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600, background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
            <ArrowRightCircle size={13}/> Depositado
          </span>
        );
      case 3:
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600, background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            <CheckCircle size={13}/> Compensado
          </span>
        );
      case 4:
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600, background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            <AlertCircle size={13}/> Devolvido
          </span>
        );
      default:
        return <span className="badge">Desconhecido</span>;
    }
  };

  const getVencimentoBadge = (dataBomParaStr: string, status: number) => {
    if (!dataBomParaStr) return null;
    const dataVenc = new Date(dataBomParaStr);
    dataVenc.setHours(0, 0, 0, 0);
    const diffMs = dataVenc.getTime() - hoje.getTime();
    const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (status === 3) {
      return (
        <span style={{ fontSize: '0.72rem', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
          Liquidado
        </span>
      );
    }

    if (status === 2) {
      return (
        <span style={{ fontSize: '0.72rem', color: '#60a5fa', background: 'rgba(59, 130, 246, 0.1)', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
          Aguardando
        </span>
      );
    }

    if (status === 4) {
      return (
        <span style={{ fontSize: '0.72rem', color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          Devolvido
        </span>
      );
    }

    // Status 0 ou 1 (Custódia)
    if (diffDias < 0) {
      return (
        <span style={{ fontSize: '0.72rem', color: '#f87171', background: 'rgba(239, 68, 68, 0.15)', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(239, 68, 68, 0.3)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
          <AlertTriangle size={11} /> Vencido ({Math.abs(diffDias)}d)
        </span>
      );
    }
    if (diffDias === 0) {
      return (
        <span style={{ fontSize: '0.72rem', color: '#fbbf24', background: 'rgba(245, 158, 11, 0.2)', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(245, 158, 11, 0.4)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
          🔔 Vence Hoje!
        </span>
      );
    }
    if (diffDias <= 7) {
      return (
        <span style={{ fontSize: '0.72rem', color: '#38bdf8', background: 'rgba(56, 189, 248, 0.15)', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(56, 189, 248, 0.3)', fontWeight: 500 }}>
          Em {diffDias} dias
        </span>
      );
    }
    return (
      <span style={{ fontSize: '0.72rem', color: 'var(--color-gray-400)', background: 'rgba(255, 255, 255, 0.04)', padding: '2px 6px', borderRadius: '4px' }}>
        Em {diffDias} dias
      </span>
    );
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', width: '100%', padding: '24px' }}>
      {/* Cabeçalho */}
      <header className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <CreditCard size={28} color="var(--color-warning)" /> Controle Financeiro de Cheques
          </h1>
          <p style={{ color: 'var(--color-gray-400)', marginTop: '6px', fontSize: '0.92rem' }}>
            Custódia de pré-datados, alertas de depósito bancário, controle de compensação e gestão de devoluções.
          </p>
        </div>
      </header>

      {/* KPI Cards Financeiros */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        {/* Total em Custódia */}
        <div className="glass-panel" style={{ padding: '16px 18px', borderLeft: '4px solid #facc15' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-gray-400)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Em Custódia</span>
            <span style={{ fontSize: '0.75rem', background: 'rgba(234, 179, 8, 0.15)', color: '#facc15', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
              {metricas.emCustodiaQtd} folhas
            </span>
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#fef08a' }}>
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metricas.totalCustodia)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-400)', marginTop: '4px' }}>
            Aguardando data para depósito
          </div>
        </div>

        {/* Alerta de Depósito (Próximos 7 Dias) */}
        <div className="glass-panel" style={{ padding: '16px 18px', borderLeft: '4px solid #f97316', background: metricas.proximos7DiasQtd > 0 ? 'rgba(249, 115, 22, 0.05)' : undefined }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: '#fdba74', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <AlertTriangle size={14} /> Depositar em até 7d
            </span>
            <span style={{ fontSize: '0.75rem', background: 'rgba(249, 115, 22, 0.2)', color: '#fb923c', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
              {metricas.proximos7DiasQtd} folhas
            </span>
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#fed7aa' }}>
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metricas.totalProximos7Dias)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#fdba74', marginTop: '4px' }}>
            {metricas.proximos7DiasQtd > 0 ? 'Exigem ação do financeiro!' : 'Nenhum cheque para esta semana'}
          </div>
        </div>

        {/* Depositados */}
        <div className="glass-panel" style={{ padding: '16px 18px', borderLeft: '4px solid #3b82f6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-gray-400)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Depositados</span>
            <span style={{ fontSize: '0.75rem', background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
              {metricas.depositadosQtd} folhas
            </span>
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#93c5fd' }}>
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metricas.totalDepositados)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-400)', marginTop: '4px' }}>
            Em processo de compensação
          </div>
        </div>

        {/* Total Compensado */}
        <div className="glass-panel" style={{ padding: '16px 18px', borderLeft: '4px solid #10b981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-gray-400)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Compensados</span>
            <span style={{ fontSize: '0.75rem', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
              {metricas.compensadosQtd} folhas
            </span>
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#6ee7b7' }}>
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metricas.totalCompensados)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-400)', marginTop: '4px' }}>
            Valores liquidados em conta
          </div>
        </div>

        {/* Devolvidos */}
        <div className="glass-panel" style={{ padding: '16px 18px', borderLeft: '4px solid #ef4444' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-gray-400)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Devolvidos</span>
            <span style={{ fontSize: '0.75rem', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
              {metricas.devolvidosQtd} folhas
            </span>
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#fca5a5' }}>
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metricas.totalDevolvidos)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-400)', marginTop: '4px' }}>
            Inadimplência ou reapresentação
          </div>
        </div>
      </div>

      {/* Painel Principal com Filtros e Tabela */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        {/* Barra de Filtros e Busca */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '14px' }}>
            {/* Campo de Busca Funcional */}
            <div className="search-bar" style={{ flex: '1', minWidth: '280px', maxWidth: '460px' }}>
              <Search size={18} color="var(--color-gray-400)" />
              <input 
                type="text" 
                className="form-input" 
                placeholder="Buscar por cliente, titular, banco, nº cheque..." 
                value={termoBusca}
                onChange={e => setTermoBusca(e.target.value)}
                style={{ width: '100%', border: 'none', background: 'transparent' }} 
              />
              {termoBusca && (
                <button
                  type="button"
                  onClick={() => setTermoBusca('')}
                  style={{ background: 'none', border: 'none', color: 'var(--color-gray-400)', cursor: 'pointer', fontSize: '0.75rem', padding: '2px 6px' }}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Total Filtrado */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--color-gray-400)' }}>
                Exibindo <strong>{chequesFiltrados.length}</strong> de {cheques.length} cheques
              </span>
            </div>
          </div>

          {/* Abas de Navegação Rápida */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '12px' }}>
            {[
              { id: 'todos', label: 'Todos os Cheques', count: cheques.length },
              { id: 'custodia', label: 'Em Custódia', count: metricas.emCustodiaQtd, highlight: '#facc15' },
              { id: 'urgentes', label: '🔔 A Vencer (7 dias)', count: metricas.proximos7DiasQtd, highlight: '#f97316' },
              { id: 'depositados', label: 'Depositados', count: metricas.depositadosQtd, highlight: '#60a5fa' },
              { id: 'compensados', label: 'Compensados', count: metricas.compensadosQtd, highlight: '#34d399' },
              { id: 'devolvidos', label: 'Devolvidos', count: metricas.devolvidosQtd, highlight: '#f87171' }
            ].map(tab => {
              const active = filtroStatus === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFiltroStatus(tab.id as any)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    fontWeight: active ? 600 : 400,
                    border: active ? '1px solid var(--color-primary)' : '1px solid rgba(255, 255, 255, 0.06)',
                    background: active ? 'rgba(59, 130, 246, 0.18)' : 'rgba(255, 255, 255, 0.03)',
                    color: active ? '#93c5fd' : 'var(--color-gray-300)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>{tab.label}</span>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      padding: '1px 6px',
                      borderRadius: '10px',
                      background: active ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.25)',
                      color: tab.highlight && tab.count > 0 ? tab.highlight : 'var(--color-gray-300)'
                    }}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tabela de Cheques */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--color-gray-400)' }}>
            <div className="spinner" style={{ margin: '0 auto 16px' }} />
            <p>Carregando carteira de cheques...</p>
          </div>
        ) : chequesFiltrados.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--color-gray-400)' }}>
            <CreditCard size={48} style={{ opacity: 0.25, margin: '0 auto 16px' }} />
            <h4 style={{ color: 'var(--color-gray-200)', marginBottom: '6px' }}>Nenhum cheque encontrado</h4>
            <p style={{ fontSize: '0.85rem' }}>
              {termoBusca ? 'Tente ajustar os termos da sua pesquisa ou mude a aba de filtro.' : 'Não há cheques registrados para o filtro selecionado.'}
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ minWidth: '160px' }}>Nº Cheque & Banco</th>
                  <th style={{ minWidth: '170px' }}>Bom Para (Vencimento)</th>
                  <th style={{ minWidth: '200px' }}>Cliente / Emitente</th>
                  <th style={{ minWidth: '120px' }}>Valor</th>
                  <th style={{ minWidth: '130px' }}>Status</th>
                  <th style={{ minWidth: '200px', textAlign: 'right' }}>Ações de Baixa</th>
                </tr>
              </thead>
              <tbody>
                {chequesFiltrados.map(cheque => (
                  <tr key={cheque.id} style={{ transition: 'background 0.15s' }}>
                    {/* Nº Cheque & Banco */}
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '0.9rem' }}>📑</span>
                          <strong style={{ fontSize: '0.9rem', color: 'var(--color-white)', fontFamily: 'monospace' }}>
                            {cheque.numeroCheque || 'S/N'}
                          </strong>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--color-gray-400)' }}>
                          {cheque.banco || 'Banco Não Informado'}
                          {(cheque.agencia || cheque.conta) && (
                            <span> • Ag: {cheque.agencia || '-'} / CC: {cheque.conta || '-'}</span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Bom Para (Vencimento) */}
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Calendar size={13} color="var(--color-gray-400)" />
                          <strong style={{ fontSize: '0.88rem' }}>
                            {cheque.dataBomPara ? new Date(cheque.dataBomPara).toLocaleDateString('pt-BR') : 'À Vista'}
                          </strong>
                        </div>
                        <div>
                          {getVencimentoBadge(cheque.dataBomPara, cheque.status)}
                        </div>
                      </div>
                    </td>

                    {/* Cliente / Emitente */}
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <strong style={{ fontSize: '0.86rem', color: 'var(--color-gray-200)' }}>
                          {cheque.clienteNome || 'Cliente não identificado'}
                        </strong>
                        {cheque.emitente && cheque.emitente !== cheque.clienteNome && (
                          <span style={{ fontSize: '0.76rem', color: 'var(--color-gray-400)' }}>
                            Emitente: {cheque.emitente}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Valor */}
                    <td>
                      <strong style={{ fontSize: '0.98rem', color: '#38bdf8' }}>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cheque.valor)}
                      </strong>
                    </td>

                    {/* Status Badge */}
                    <td>
                      {getStatusBadge(cheque.status)}
                    </td>

                    {/* Ações Financeiras */}
                    <td style={{ textAlign: 'right' }}>
                      {/* Em Custódia (0 ou 1): Botão Depositar */}
                      {(cheque.status === 0 || cheque.status === 1) && (
                        <button 
                          className="btn btn-secondary" 
                          style={{
                            padding: '6px 12px',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            background: 'rgba(59, 130, 246, 0.15)',
                            color: '#60a5fa',
                            border: '1px solid rgba(59, 130, 246, 0.4)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}
                          onClick={() => handleMudarStatus(cheque.id, 2)}
                          disabled={updating === cheque.id}
                        >
                          <ArrowRightCircle size={13} />
                          {updating === cheque.id ? 'Atualizando...' : 'Depositar'}
                        </button>
                      )}

                      {/* Depositado (2): Compensou ou Devolvido */}
                      {cheque.status === 2 && (
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button 
                            className="btn btn-success" 
                            style={{ padding: '6px 10px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            onClick={() => handleMudarStatus(cheque.id, 3)}
                            disabled={updating === cheque.id}
                            title="Confirmar Liquidação Bancária"
                          >
                            <CheckCircle2 size={13} />
                            {updating === cheque.id ? '...' : 'Compensou'}
                          </button>
                          <button 
                            className="btn btn-danger" 
                            style={{ padding: '6px 10px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            onClick={() => handleMudarStatus(cheque.id, 4)}
                            disabled={updating === cheque.id}
                            title="Registrar Cheque Devolvido"
                          >
                            <AlertCircle size={13} />
                            {updating === cheque.id ? '...' : 'Devolvido'}
                          </button>
                        </div>
                      )}

                      {/* Devolvido (4): Possibilidade de Reapresentar Cheque */}
                      {cheque.status === 4 && (
                        <button 
                          className="btn btn-secondary" 
                          style={{
                            padding: '6px 12px',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            background: 'rgba(234, 179, 8, 0.15)',
                            color: '#facc15',
                            border: '1px solid rgba(234, 179, 8, 0.4)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}
                          onClick={() => handleMudarStatus(cheque.id, 2)}
                          disabled={updating === cheque.id}
                          title="Reapresentar ao banco para compensação"
                        >
                          <RotateCcw size={13} />
                          {updating === cheque.id ? '...' : 'Reapresentar Cheque'}
                        </button>
                      )}

                      {/* Compensado (3): Já liquidado */}
                      {cheque.status === 3 && (
                        <span style={{ fontSize: '0.78rem', color: 'var(--color-success)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle2 size={14} /> Liquidado
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cheques;
