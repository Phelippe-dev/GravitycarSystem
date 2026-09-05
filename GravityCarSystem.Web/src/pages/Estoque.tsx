import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchVeiculos } from '../api';
import type { Veiculo } from '../api';

const Estoque: React.FC = () => {
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [busca, setBusca] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    carregarVeiculos();
  }, []);

  const carregarVeiculos = async () => {
    setLoading(true);
    const dados = await fetchVeiculos();
    setVeiculos(dados);
    setLoading(false);
  };

  const getStatusBadge = (status: number) => {
    switch(status) {
      case 1: return <span className="status-badge" style={{background: 'rgba(59,130,246,0.15)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.3)'}}>Em Avaliação</span>;
      case 2: return <span className="status-badge" style={{background: 'rgba(168,85,247,0.15)', color: '#c084fc', border: '1px solid rgba(168,85,247,0.3)'}}>Em Compra</span>;
      case 3: return <span className="status-badge" style={{background: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)'}}>Em Preparação</span>;
      case 4: return <span className="status-badge status-disponivel">Disponível</span>;
      case 5: return <span className="status-badge" style={{background: 'rgba(234,179,8,0.2)', color: '#eab308'}}>Reservado</span>;
      case 6: return <span className="status-badge" style={{background: 'rgba(239,68,68,0.2)', color: '#ef4444'}}>Vendido</span>;
      default: return <span className="status-badge">Indisponível</span>;
    }
  };

  const veiculosFiltrados = veiculos.filter(v => {
    if (filtroStatus === 'disponivel' && v.status !== 4) return false;
    if (filtroStatus === 'preparacao' && v.status !== 3) return false;
    if (filtroStatus === 'avaliacao' && v.status !== 1) return false;
    if (filtroStatus === 'vendido' && v.status !== 6) return false;
    if (busca) {
      const q = busca.toLowerCase();
      const matchText = `${v.marca} ${v.modelo} ${v.versao || ''} ${v.placa || ''}`.toLowerCase();
      return matchText.includes(q);
    }
    return true;
  });

  const countAvaliacao = veiculos.filter(v => v.status === 1).length;
  const countPreparacao = veiculos.filter(v => v.status === 3).length;
  const countDisponivel = veiculos.filter(v => v.status === 4).length;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      <header className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="page-title">Estoque de Veículos</h1>
          <p style={{ color: 'var(--color-gray-400)', marginTop: '4px', fontSize: '0.9rem' }}>
            Gerencie veículos disponíveis, em preparação e avaliações recebidas.
          </p>
        </div>
      </header>

      {/* Barra de Filtros e Busca */}
      <div className="glass-panel" style={{ padding: '16px 20px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button 
            type="button" 
            className={`date-preset-pill ${filtroStatus === 'todos' ? 'active' : ''}`}
            onClick={() => setFiltroStatus('todos')}
          >
            Todos ({veiculos.length})
          </button>
          <button 
            type="button" 
            className={`date-preset-pill ${filtroStatus === 'disponivel' ? 'active' : ''}`}
            onClick={() => setFiltroStatus('disponivel')}
          >
            Disponíveis ({countDisponivel})
          </button>
          <button 
            type="button" 
            className={`date-preset-pill ${filtroStatus === 'avaliacao' ? 'active' : ''}`}
            onClick={() => setFiltroStatus('avaliacao')}
          >
            Em Avaliação ({countAvaliacao})
          </button>
          <button 
            type="button" 
            className={`date-preset-pill ${filtroStatus === 'preparacao' ? 'active' : ''}`}
            onClick={() => setFiltroStatus('preparacao')}
          >
            Em Preparação ({countPreparacao})
          </button>
        </div>

        <div className="search-bar" style={{ width: '280px' }}>
          <input 
            type="text" 
            className="form-input" 
            placeholder="Buscar por marca, modelo, placa..." 
            value={busca} 
            onChange={e => setBusca(e.target.value)} 
            style={{ width: '100%', height: '38px' }}
          />
        </div>
      </div>

      <div className="table-modern-container">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-gray-400)' }}>Carregando estoque...</div>
        ) : (
          <table className="table-modern">
            <thead>
              <tr>
                <th>Veículo</th>
                <th>Ano</th>
                <th>Placa</th>
                <th>Preço Venda / Avaliação</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {veiculosFiltrados.map(v => (
                <tr key={v.id} onClick={() => navigate(`/veiculos/${v.id}`)} style={{ cursor: 'pointer' }}>
                  <td>
                    <strong>{v.marca} {v.modelo}</strong> <br/>
                    <small style={{color: 'var(--color-gray-400)'}}>{v.versao || '-'}</small>
                  </td>
                  <td>{v.anoFabricacao || '-'}/{v.anoModelo || '-'}</td>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontWeight: 600, padding: '2px 6px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
                      {v.placa || '-'}
                    </span>
                  </td>
                  <td>
                    <strong style={{ color: v.valorVenda ? 'var(--color-blue-light)' : 'var(--color-warning)' }}>
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v.valorVenda || v.valorCompra || 0)}
                    </strong>
                  </td>
                  <td>{getStatusBadge(v.status)}</td>
                </tr>
              ))}
              {veiculosFiltrados.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'var(--color-gray-400)' }}>
                    Nenhum veículo encontrado para os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Estoque;
