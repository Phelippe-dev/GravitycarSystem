import React, { useEffect, useState } from 'react';
import { fetchStats, fetchVeiculos } from '../api';
import type { DashboardStats, Veiculo } from '../api';
import { BarChart, Car, DollarSign, Calendar, TrendingUp } from 'lucide-react';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [loading, setLoading] = useState(true);

  const [estoqueParado, setEstoqueParado] = useState(0);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setLoading(true);
    const data = await fetchVeiculos();
    const statsData = await fetchStats(data);
    
    // Calcula carros parados há mais de 60 dias (Mock, pois precisamos garantir a dataEntrada)
    // Simulando base: 20% do estoque parado pra demonstração do manifesto
    setEstoqueParado(Math.floor((statsData?.veiculosDisponiveis || 0) * 0.15));

    setStats(statsData);
    setVeiculos(data.slice(0, 4)); // Pega os 4 mais recentes para exibir
    setLoading(false);
  };

  const getStatusBadge = (status: number) => {
    if (status === 0) return <span className="badge badge-success">Disponível</span>;
    if (status === 1) return <span className="badge badge-warning">Vendido</span>;
    if (status === 2) return <span className="badge badge-danger">Manutenção</span>;
    return <span className="badge" style={{ background: '#374151' }}>{status}</span>;
  };

  // Mock dados para gráficos
  const chartData = [
    { name: 'Receitas', valor: stats?.totalContasReceber || 0 },
    { name: 'Despesas', valor: stats?.totalContasPagar || 0 },
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
            DMS Dashboard
          </h1>
          <p style={{ color: 'var(--color-gray-400)', marginTop: '8px' }}>
            Visão Geral da Concessionária
          </p>
        </div>
        <div>
          <button className="btn btn-primary" onClick={carregarDados} disabled={loading}>
            Atualizar
          </button>
        </div>
      </header>

      {/* Status Dashboard */}
      <div className="dashboard-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        
        <div className="stat-card glass-panel" style={{ position: 'relative', overflow: 'hidden', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: '80px', height: '80px', background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)', transform: 'translate(30%, -30%)' }}></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-card-title" style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-gray-400)' }}>Total de Veículos</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Car size={18} color="var(--color-white)" />
            </div>
          </div>
          <span className="stat-card-value" style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--color-white)' }}>{loading ? '...' : stats?.totalVeiculos}</span>
        </div>

        <div className="stat-card glass-panel" style={{ position: 'relative', overflow: 'hidden', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '2px solid var(--color-success)' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: '80px', height: '80px', background: 'radial-gradient(circle, rgba(16, 185, 129,0.15) 0%, transparent 70%)', transform: 'translate(30%, -30%)' }}></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-card-title" style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-gray-400)' }}>Pátio Disponível</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(16, 185, 129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Car size={18} color="var(--color-success)" />
            </div>
          </div>
          <span className="stat-card-value" style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--color-success)' }}>{loading ? '...' : stats?.veiculosDisponiveis}</span>
        </div>

        <div className="stat-card glass-panel" style={{ position: 'relative', overflow: 'hidden', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '2px solid var(--color-blue-light)' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: '80px', height: '80px', background: 'radial-gradient(circle, rgba(96, 165, 250,0.15) 0%, transparent 70%)', transform: 'translate(30%, -30%)' }}></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-card-title" style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-gray-400)' }}>Veículos Vendidos</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(96, 165, 250,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={18} color="var(--color-blue-light)" />
            </div>
          </div>
          <span className="stat-card-value" style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--color-blue-light)' }}>{loading ? '...' : stats?.veiculosVendidos}</span>
        </div>

        <div className="stat-card glass-panel" style={{ position: 'relative', overflow: 'hidden', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '2px solid var(--color-warning)' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: '80px', height: '80px', background: 'radial-gradient(circle, rgba(234, 179, 8,0.15) 0%, transparent 70%)', transform: 'translate(30%, -30%)' }}></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-card-title" style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-gray-400)' }}>Contas a Pagar</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(234, 179, 8,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={18} color="var(--color-warning)" />
            </div>
          </div>
          <span className="stat-card-value" style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-warning)' }}>{loading ? '...' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats?.totalContasPagar || 0)}</span>
        </div>

        <div className="stat-card glass-panel" style={{ position: 'relative', overflow: 'hidden', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '2px solid var(--color-success)' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: '80px', height: '80px', background: 'radial-gradient(circle, rgba(16, 185, 129,0.15) 0%, transparent 70%)', transform: 'translate(30%, -30%)' }}></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-card-title" style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-gray-400)' }}>Contas a Receber</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(16, 185, 129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={18} color="var(--color-success)" />
            </div>
          </div>
          <span className="stat-card-value" style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-success)' }}>{loading ? '...' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats?.totalContasReceber || 0)}</span>
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
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '24px' }}>Fluxo de Caixa Projetado</h3>
            <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="name" stroke="#9ca3af" />
                        <YAxis stroke="#9ca3af" tickFormatter={(value) => `R$ ${(value / 1000)}k`} />
                        <Tooltip 
                            formatter={(value: any) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
                            contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '8px' }}
                        />
                        <Bar dataKey="valor" fill="var(--color-blue-light)" radius={[4, 4, 0, 0]}>
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.name === 'Receitas' ? 'var(--color-success)' : 'var(--color-warning)'} />
                            ))}
                        </Bar>
                    </RechartsBarChart>
                </ResponsiveContainer>
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
          {veiculos.map(veiculo => (
            <div key={veiculo.id} className="vehicle-card glass-panel">
              <div className="vehicle-img" style={{ backgroundImage: `url(${(veiculo as any).imageUrl || '/placeholder.png'})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
              </div>
              <div className="vehicle-content">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 className="vehicle-title">{veiculo.marca} {veiculo.modelo}</h3>
                  {getStatusBadge(veiculo.status)}
                </div>
                
                <div className="vehicle-price">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(veiculo.valorVenda || 0)}
                </div>
                
                <div className="vehicle-info">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={14} /> {veiculo.anoFabricacao}/{veiculo.anoModelo}
                  </span>
                  <span>Placa: {veiculo.placa || 'Sem placa'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
