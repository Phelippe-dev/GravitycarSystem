import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchStats, fetchVeiculos, fetchCheques, API_BASE_URL } from '../api';
import type { DashboardStats, Veiculo, Cheque } from '../api';
import { BarChart, Car, DollarSign, Calendar, TrendingUp, Wallet, CheckCircle2, ArrowUpRight } from 'lucide-react';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [loading, setLoading] = useState(true);
  const [estoqueParado, setEstoqueParado] = useState(0);
  const [chequeBreakdown, setChequeBreakdown] = useState({
    custodia: 0,
    depositados: 0,
    contasReceber: 0,
  });

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setLoading(true);
    const [data, cheques] = await Promise.all([
      fetchVeiculos(),
      fetchCheques().catch(() => [] as Cheque[])
    ]);
    const statsData = await fetchStats(data);

    // Estoque parado: veiculos disponiveis com mais de 60 dias (base na data de cadastro)
    const hoje = new Date();
    const parados = data.filter(v => {
      if (v.status !== 4) return false; // so disponiveis
      const dataCad = v.dataCadastro ? new Date(v.dataCadastro) : null;
      if (!dataCad) return false;
      const diffDias = (hoje.getTime() - dataCad.getTime()) / (1000 * 60 * 60 * 24);
      return diffDias > 60;
    }).length;
    setEstoqueParado(parados);

    // Breakdown de cheques
    const custodia = cheques.filter(c => c.status === 1).reduce((acc, c) => acc + (c.valor || 0), 0);
    const depositados = cheques.filter(c => c.status === 2).reduce((acc, c) => acc + (c.valor || 0), 0);
    const contasReceber = (statsData.totalContasReceber || 0) - custodia - depositados;
    setChequeBreakdown({ custodia, depositados, contasReceber: Math.max(0, contasReceber) });

    setStats(statsData);
    setVeiculos(data.slice(0, 4));
    setLoading(false);
  };

  const getVehicleImageUrl = (veiculo: Veiculo) => {
    const foto = veiculo.fotoPrincipal || (veiculo as any).imageUrl;
    if (foto) {
      if (foto.startsWith('http')) return foto;
      return `${API_BASE_URL.replace('/api', '')}${foto.startsWith('/') ? '' : '/'}${foto}`;
    }

    const mod = (veiculo.modelo || '').toLowerCase();
    const mar = (veiculo.marca || '').toLowerCase();

    if (mod.includes('corolla') || mar.includes('toyota')) {
      return 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800&auto=format&fit=crop&q=80';
    }
    if (mod.includes('civic') || mar.includes('honda')) {
      return 'https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?w=800&auto=format&fit=crop&q=80';
    }
    if (mod.includes('compass') || mar.includes('jeep')) {
      return 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=800&auto=format&fit=crop&q=80';
    }
    if (mod.includes('nivus') || mar.includes('volkswagen') || mar.includes('vw')) {
      return 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800&auto=format&fit=crop&q=80';
    }
    if (mod.includes('q3') || mar.includes('audi')) {
      return 'https://images.unsplash.com/photo-1541348263662-e0c86437db7b?w=800&auto=format&fit=crop&q=80';
    }
    return 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format&fit=crop&q=80';
  };

  const getStatusBadge = (status: number) => {
    if (status === 0) return <span className="badge badge-success">Disponível</span>;
    if (status === 1) return <span className="badge badge-warning">Vendido</span>;
    if (status === 2) return <span className="badge badge-danger">Manutenção</span>;
    return <span className="badge" style={{ background: '#374151' }}>{status}</span>;
  };

  // Dados integrados para fluxo de caixa em tempo real
  const chartData = [
    { name: 'Vendas (Faturado)', valor: stats?.totalVendasValor || 0, color: '#10b981' },
    { name: 'Entradas no Caixa', valor: stats?.totalEntradasRecebidas || 0, color: '#3b82f6' },
    { name: 'A Receber Futuro', valor: stats?.totalContasReceber || 0, color: '#a855f7' },
    { name: 'Contas a Pagar', valor: stats?.totalContasPagar || 0, color: '#f59e0b' },
    { name: 'Saldo Operacional', valor: stats?.saldoOperacional || 0, color: '#06b6d4' },
  ];

  const pieData = [
    { name: 'Disponíveis', value: stats?.veiculosDisponiveis || 0, color: 'var(--color-success)' },
    { name: 'Vendidos', value: stats?.veiculosVendidos || 0, color: 'var(--color-blue-light)' },
  ];

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', width: '100%', padding: '24px' }}>
      <header className="page-header" style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <BarChart size={28} color="var(--color-blue-light)" />
            Dashboard
          </h1>
          <p style={{ color: 'var(--color-gray-400)', marginTop: '8px' }}>
            Visão Geral da Concessionária &amp; Fluxo de Caixa em Tempo Real
          </p>
        </div>
        <div>
          <button className="btn btn-primary" onClick={carregarDados} disabled={loading}>
            Atualizar
          </button>
        </div>
      </header>

      {/* Indicadores Operacionais / Estoque */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '20px' }}>
        
        <div className="stat-card glass-panel" style={{ position: 'relative', overflow: 'hidden', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: '80px', height: '80px', background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)', transform: 'translate(30%, -30%)' }}></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-card-title" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-gray-400)' }}>Total de Veículos</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Car size={18} color="var(--color-white)" />
            </div>
          </div>
          <span className="stat-card-value" style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-white)' }}>{loading ? '...' : stats?.totalVeiculos}</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-gray-400)' }}>Cadastrados no sistema</span>
        </div>

        <div className="stat-card glass-panel" style={{ position: 'relative', overflow: 'hidden', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '2px solid var(--color-success)' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: '80px', height: '80px', background: 'radial-gradient(circle, rgba(16, 185, 129,0.15) 0%, transparent 70%)', transform: 'translate(30%, -30%)' }}></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-card-title" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-gray-400)' }}>Pátio Disponível</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(16, 185, 129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Car size={18} color="var(--color-success)" />
            </div>
          </div>
          <span className="stat-card-value" style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-success)' }}>{loading ? '...' : stats?.veiculosDisponiveis}</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-success)' }}>Prontos para venda</span>
        </div>

        <div className="stat-card glass-panel" style={{ position: 'relative', overflow: 'hidden', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '2px solid var(--color-blue-light)' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: '80px', height: '80px', background: 'radial-gradient(circle, rgba(96, 165, 250,0.15) 0%, transparent 70%)', transform: 'translate(30%, -30%)' }}></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-card-title" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-gray-400)' }}>Veículos Vendidos</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(96, 165, 250,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={18} color="var(--color-blue-light)" />
            </div>
          </div>
          <span className="stat-card-value" style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-blue-light)' }}>{loading ? '...' : stats?.veiculosVendidos}</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-blue-light)' }}>Contratos finalizados</span>
        </div>

      </div>

      {/* Indicadores Financeiros / Fluxo de Caixa */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '24px' }}>

        <div className="stat-card glass-panel" style={{ position: 'relative', overflow: 'hidden', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '2px solid #10b981', background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.05) 0%, rgba(255,255,255,0.02) 100%)' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: '80px', height: '80px', background: 'radial-gradient(circle, rgba(16, 185, 129,0.2) 0%, transparent 70%)', transform: 'translate(30%, -30%)' }}></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-card-title" style={{ fontSize: '0.85rem', fontWeight: 600, color: '#10b981' }}>Faturamento em Vendas</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(16, 185, 129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={18} color="#10b981" />
            </div>
          </div>
          <span className="stat-card-value" style={{ fontSize: '1.65rem', fontWeight: 800, color: '#10b981' }}>
            {loading ? '...' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats?.totalVendasValor || 0)}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-gray-400)' }}>Receita bruta faturada</span>
        </div>

        <div className="stat-card glass-panel" style={{ position: 'relative', overflow: 'hidden', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '2px solid #3b82f6', background: 'linear-gradient(180deg, rgba(59, 130, 246, 0.05) 0%, rgba(255,255,255,0.02) 100%)' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: '80px', height: '80px', background: 'radial-gradient(circle, rgba(59, 130, 246,0.2) 0%, transparent 70%)', transform: 'translate(30%, -30%)' }}></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-card-title" style={{ fontSize: '0.85rem', fontWeight: 600, color: '#60a5fa' }}>Entradas no Caixa</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(59, 130, 246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wallet size={18} color="#60a5fa" />
            </div>
          </div>
          <span className="stat-card-value" style={{ fontSize: '1.65rem', fontWeight: 800, color: '#60a5fa' }}>
            {loading ? '...' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats?.totalEntradasRecebidas || 0)}
          </span>
          <span style={{ fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <CheckCircle2 size={12} /> Liquidado em caixa
          </span>
        </div>

        <div className="stat-card glass-panel" style={{ position: 'relative', overflow: 'hidden', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '2px solid #06b6d4', background: 'linear-gradient(180deg, rgba(6, 182, 212, 0.05) 0%, rgba(255,255,255,0.02) 100%)' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: '80px', height: '80px', background: 'radial-gradient(circle, rgba(6, 182, 212,0.2) 0%, transparent 70%)', transform: 'translate(30%, -30%)' }}></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-card-title" style={{ fontSize: '0.85rem', fontWeight: 600, color: '#22d3ee' }}>Saldo Operacional</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(6, 182, 212,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowUpRight size={18} color="#22d3ee" />
            </div>
          </div>
          <span className="stat-card-value" style={{ fontSize: '1.65rem', fontWeight: 800, color: '#22d3ee' }}>
            {loading ? '...' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats?.saldoOperacional || 0)}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-gray-400)' }}>Entradas - Despesas</span>
        </div>

      </div>

      {/* Sub-faixa financeira (Previsões & Pendências) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px' }}>
        <div className="glass-panel" style={{ padding: '16px 20px', borderLeft: '3px solid #a855f7', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-gray-400)' }}>A Receber (Cheques &amp; Parcelas)</span>
            <button className="btn" style={{ fontSize: '0.75rem', padding: '4px 10px', background: 'rgba(168,85,247,0.15)', color: '#c084fc' }} onClick={() => navigate('/financeiro/cheques')}>
              Ver Cheques
            </button>
          </div>
          <strong style={{ fontSize: '1.3rem', color: '#c084fc' }}>
            {loading ? '...' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats?.totalContasReceber || 0)}
          </strong>
          {/* Breakdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', borderTop: '1px solid rgba(168,85,247,0.2)', paddingTop: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
              <span style={{ color: '#94a3b8' }}>🔵 Em Custódia</span>
              <span style={{ color: '#c084fc', fontWeight: 600 }}>
                {loading ? '...' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(chequeBreakdown.custodia)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
              <span style={{ color: '#94a3b8' }}>🟡 Depositados (aguard. comp.)</span>
              <span style={{ color: '#fbbf24', fontWeight: 600 }}>
                {loading ? '...' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(chequeBreakdown.depositados)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
              <span style={{ color: '#94a3b8' }}>🟢 Contas a Receber</span>
              <span style={{ color: '#34d399', fontWeight: 600 }}>
                {loading ? '...' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(chequeBreakdown.contasReceber)}
              </span>
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: '3px solid var(--color-warning)' }}>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-gray-400)', display: 'block' }}>Contas a Pagar (Despesas &amp; Compras)</span>
            <strong style={{ fontSize: '1.3rem', color: 'var(--color-warning)' }}>
              {loading ? '...' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats?.totalContasPagar || 0)}
            </strong>
          </div>
          <button className="btn" style={{ fontSize: '0.8rem', padding: '6px 12px', background: 'rgba(234, 179, 8, 0.15)', color: 'var(--color-warning)' }} onClick={() => navigate('/relatorios')}>
            Ver Relatórios
          </button>
        </div>
      </div>
      
      {/* Alerta Estoque Parado Manifesto */}
      {estoqueParado > 0 && (
        <div style={{ background: 'rgba(234, 179, 8, 0.1)', border: '1px solid var(--color-warning)', padding: '16px', borderRadius: '8px', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: 'var(--color-warning)', color: '#000', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>!</div>
          <div>
            <h4 style={{ color: 'var(--color-warning)', margin: 0, fontSize: '1.1rem' }}>Atenção: Estoque Parado</h4>
            <p style={{ margin: 0, color: 'var(--color-gray-400)' }}>Você possui <strong>{estoqueParado} veículos</strong> há mais de 60 dias no estoque. Considere realizar promoções ou revisar o anúncio.</p>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '40px' }}>
        {/* Cashflow Chart */}
        <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>Fluxo de Caixa &amp; Vendas</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-gray-400)', margin: '4px 0 0 0' }}>
                  Acompanhamento sincronizado das vendas, entradas em caixa e saldo operacional
                </p>
              </div>
              <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem' }}>
                <CheckCircle2 size={12} /> 100% Sincronizado
              </span>
            </div>

            <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="name" stroke="#9ca3af" tick={{ fontSize: 11 }} />
                        <YAxis stroke="#9ca3af" tickFormatter={(value) => `R$ ${(value / 1000)}k`} />
                        <Tooltip 
                            formatter={(value: any) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
                            contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '8px' }}
                        />
                        <Bar dataKey="valor" radius={[6, 6, 0, 0]}>
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Bar>
                    </RechartsBarChart>
                </ResponsiveContainer>
            </div>

            {/* Resumo do Fluxo em Tempo Real */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              {chartData.map((item, idx) => (
                <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 12px', borderRadius: '8px', borderLeft: `3px solid ${item.color}` }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-gray-400)', display: 'block' }}>{item.name}</span>
                  <strong style={{ fontSize: '0.95rem', color: item.color }}>
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valor)}
                  </strong>
                </div>
              ))}
            </div>
        </div>

        {/* Stock Status Chart */}
        <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '24px' }}>Status do Estoque</h3>
            <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '8px' }}
                        />
                        <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>

      {/* Vehicles Grid */}
      <h2 style={{ marginBottom: '24px', fontSize: '1.2rem', fontWeight: 600 }}>Destaques do Estoque</h2>
      
      {loading ? (
        <p style={{ color: '#9ca3af' }}>Carregando dados...</p>
      ) : veiculos.length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
          Nenhum veículo cadastrado. A base de dados está vazia.
        </div>
      ) : (
        <div className="vehicle-grid">
          {veiculos.map(veiculo => {
            const imgUrl = getVehicleImageUrl(veiculo);
            return (
              <div 
                key={veiculo.id} 
                className="vehicle-card glass-panel"
                style={{ cursor: 'pointer', overflow: 'hidden', transition: 'transform 0.2s, box-shadow 0.2s' }}
                onClick={() => navigate(`/veiculos/${veiculo.id}`)}
              >
                <div 
                  className="vehicle-img" 
                  style={{ 
                    backgroundImage: `url("${imgUrl}")`, 
                    backgroundSize: 'cover', 
                    backgroundPosition: 'center',
                    minHeight: '190px',
                    position: 'relative'
                  }}
                >
                  <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
                    {getStatusBadge(veiculo.status)}
                  </div>
                </div>
                <div className="vehicle-content" style={{ padding: '16px' }}>
                  <h3 className="vehicle-title" style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>
                    {veiculo.marca} {veiculo.modelo}
                  </h3>
                  
                  <div className="vehicle-price" style={{ margin: '8px 0', fontSize: '1.3rem', color: '#38bdf8', fontWeight: 800 }}>
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(veiculo.valorVenda || 0)}
                  </div>
                  
                  <div className="vehicle-info" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--color-gray-400)', fontSize: '0.85rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={14} /> {veiculo.anoFabricacao}/{veiculo.anoModelo}
                    </span>
                    <span style={{ fontFamily: 'monospace', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }}>
                      {veiculo.placa || 'Sem placa'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
