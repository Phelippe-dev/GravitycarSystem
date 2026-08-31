import React, { useEffect, useState } from 'react';
import { Search, Calendar, Car, DollarSign } from 'lucide-react';
import { fetchVeiculos, fetchStats } from '../api';
import type { Veiculo, DashboardStats } from '../api';

const Dashboard: React.FC = () => {
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalVeiculos: 0,
    veiculosDisponiveis: 0,
    veiculosVendidos: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await fetchVeiculos();
    const dataWithImages = data.map(v => ({
      ...v,
      imageUrl: v.fotoPrincipal ? `http://localhost:5263${v.fotoPrincipal}` : 'https://images.unsplash.com/photo-1542362567-b07e54358753?q=80&w=600&auto=format&fit=crop'
    }));
    
    setVeiculos(dataWithImages);
    setStats(await fetchStats(data));
    setLoading(false);
  };

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 4: return <span className="badge badge-success">Disponível</span>;
      case 5: return <span className="badge badge-warning">Reservado</span>;
      case 6: return <span className="badge" style={{ background: 'rgba(37,99,235,0.1)', color: '#60a5fa' }}>Vendido</span>;
      default: return <span className="badge">Indefinido</span>;
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      <header className="page-header">
        <h1 className="page-title">Visão Geral</h1>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div className="glass-panel" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Search size={18} color="#9ca3af" />
            <input 
              type="text" 
              placeholder="Buscar veículos..." 
              style={{ background: 'transparent', border: 'none', color: '#fff', outline: 'none' }}
            />
          </div>
          <button className="btn btn-primary" onClick={loadData}>
            Atualizar
          </button>
        </div>
      </header>

      {/* Status Dashboard */}
      <div className="dashboard-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '40px' }}>
        
        <div className="stat-card glass-panel" style={{ position: 'relative', overflow: 'hidden', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: '100px', height: '100px', background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)', transform: 'translate(30%, -30%)' }}></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-card-title" style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-gray-400)' }}>Total de Veículos</span>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Car size={20} color="var(--color-white)" />
            </div>
          </div>
          <span className="stat-card-value" style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-white)' }}>{loading ? '...' : stats.totalVeiculos}</span>
        </div>

        <div className="stat-card glass-panel" style={{ position: 'relative', overflow: 'hidden', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '2px solid var(--color-success)' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: '100px', height: '100px', background: 'radial-gradient(circle, rgba(16, 185, 129,0.15) 0%, transparent 70%)', transform: 'translate(30%, -30%)' }}></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-card-title" style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-gray-400)' }}>Disponíveis no Pátio</span>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(16, 185, 129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Car size={20} color="var(--color-success)" />
            </div>
          </div>
          <span className="stat-card-value" style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-success)' }}>{loading ? '...' : stats.veiculosDisponiveis}</span>
        </div>

        <div className="stat-card glass-panel" style={{ position: 'relative', overflow: 'hidden', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '2px solid var(--color-blue-light)' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: '100px', height: '100px', background: 'radial-gradient(circle, rgba(96, 165, 250,0.15) 0%, transparent 70%)', transform: 'translate(30%, -30%)' }}></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-card-title" style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-gray-400)' }}>Veículos Vendidos</span>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(96, 165, 250,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={20} color="var(--color-blue-light)" />
            </div>
          </div>
          <span className="stat-card-value" style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-blue-light)' }}>{loading ? '...' : stats.veiculosVendidos}</span>
        </div>

      </div>

      {/* Vehicles Grid */}
      <h2 style={{ marginBottom: '24px', fontSize: '1.2rem', fontWeight: 600 }}>Estoque Recente</h2>
      
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
              <div className="vehicle-img" style={{ backgroundImage: `url(${(veiculo as any).imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
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
