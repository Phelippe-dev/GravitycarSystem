import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchVeiculos } from '../api';
import type { Veiculo } from '../api';
import { Car, Bike, Truck } from 'lucide-react';

const Estoque: React.FC = () => {
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [filtroTipo, setFiltroTipo] = useState<number>(0); // 0 = todos, 1 = carro, 2 = moto, 7 = utilitário
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

  const getTipoBadge = (v: Veiculo) => {
    if (v.tipoVeiculo === 2 || v.tipoVeiculo === 3) {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(192, 38, 211, 0.15)', color: '#f472b6', border: '1px solid rgba(192, 38, 211, 0.3)', fontWeight: 600 }}>
          <Bike size={12} />
          <span>MOTO {v.cilindrada ? `· ${v.cilindrada}cc` : ''}</span>
        </span>
      );
    }
    if (v.tipoVeiculo === 7 || v.tipoVeiculo === 6) {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)', fontWeight: 600 }}>
          <Truck size={12} />
          <span>UTILITÁRIO</span>
        </span>
      );
    }
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(37, 99, 235, 0.12)', color: '#93c5fd', border: '1px solid rgba(37, 99, 235, 0.25)', fontWeight: 600 }}>
        <Car size={12} />
        <span>CARRO</span>
      </span>
    );
  };

  const veiculosFiltrados = veiculos.filter(v => {
    if (filtroStatus === 'disponivel' && v.status !== 4) return false;
    if (filtroStatus === 'preparacao' && v.status !== 3) return false;
    if (filtroStatus === 'avaliacao' && v.status !== 1) return false;
    if (filtroStatus === 'vendido' && v.status !== 6) return false;
    
    if (filtroTipo === 1 && (v.tipoVeiculo && v.tipoVeiculo !== 1)) return false;
    if (filtroTipo === 2 && (v.tipoVeiculo !== 2 && v.tipoVeiculo !== 3)) return false;
    if (filtroTipo === 7 && (v.tipoVeiculo !== 7 && v.tipoVeiculo !== 6)) return false;

    if (busca) {
      const q = busca.toLowerCase();
      const matchText = `${v.marca} ${v.modelo} ${v.versao || ''} ${v.placa || ''}`.toLowerCase();
      return matchText.includes(q);
    }
    return true;
  });

  const countCarros = veiculos.filter(v => !v.tipoVeiculo || v.tipoVeiculo === 1).length;
  const countMotos = veiculos.filter(v => v.tipoVeiculo === 2 || v.tipoVeiculo === 3).length;
  const countUtilitarios = veiculos.filter(v => v.tipoVeiculo === 7 || v.tipoVeiculo === 6).length;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      <header className="page-header" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Estoque Multimarcas</h1>
          <p style={{ color: 'var(--color-gray-400)', marginTop: '4px', fontSize: '0.9rem' }}>
            Catálogo completo de Carros, Motos e Utilitários com controle em tempo real.
          </p>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={() => navigate('/cadastro/veiculos')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <span>+ Cadastrar Veículo</span>
        </button>
      </header>

      {/* ABAS MULTIMARCAS */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
        <button 
          type="button"
          className={`date-preset-pill ${filtroTipo === 0 ? 'active' : ''}`}
          onClick={() => setFiltroTipo(0)}
          style={{ padding: '8px 18px', fontSize: '0.88rem' }}
        >
          Todos ({veiculos.length})
        </button>
        <button 
          type="button"
          className={`date-preset-pill ${filtroTipo === 1 ? 'active' : ''}`}
          onClick={() => setFiltroTipo(1)}
          style={{ padding: '8px 18px', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Car size={16} /> Carros ({countCarros})
        </button>
        <button 
          type="button"
          className={`date-preset-pill ${filtroTipo === 2 ? 'active' : ''}`}
          onClick={() => setFiltroTipo(2)}
          style={{ padding: '8px 18px', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Bike size={16} /> Motos ({countMotos})
        </button>
        <button 
          type="button"
          className={`date-preset-pill ${filtroTipo === 7 ? 'active' : ''}`}
          onClick={() => setFiltroTipo(7)}
          style={{ padding: '8px 18px', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Truck size={16} /> Utilitários ({countUtilitarios})
        </button>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="glass-panel" style={{ padding: '16px 20px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button 
            type="button" 
            className={`date-preset-pill ${filtroStatus === 'todos' ? 'active' : ''}`}
            onClick={() => setFiltroStatus('todos')}
          >
            Todos os Status
          </button>
          <button 
            type="button" 
            className={`date-preset-pill ${filtroStatus === 'disponivel' ? 'active' : ''}`}
            onClick={() => setFiltroStatus('disponivel')}
          >
            Disponíveis ({veiculos.filter(v => v.status === 4).length})
          </button>
          <button 
            type="button" 
            className={`date-preset-pill ${filtroStatus === 'avaliacao' ? 'active' : ''}`}
            onClick={() => setFiltroStatus('avaliacao')}
          >
            Em Avaliação ({veiculos.filter(v => v.status === 1).length})
          </button>
          <button 
            type="button" 
            className={`date-preset-pill ${filtroStatus === 'preparacao' ? 'active' : ''}`}
            onClick={() => setFiltroStatus('preparacao')}
          >
            Em Preparação ({veiculos.filter(v => v.status === 3).length})
          </button>
          <button 
            type="button" 
            className={`date-preset-pill ${filtroStatus === 'vendido' ? 'active' : ''}`}
            onClick={() => setFiltroStatus('vendido')}
          >
            Vendidos ({veiculos.filter(v => v.status === 6).length})
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
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-gray-400)' }}>Carregando catálogo de veículos...</div>
        ) : (
          <table className="table-modern">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Veículo</th>
                <th>Ano</th>
                <th>Placa</th>
                <th>Preço Venda / Tabela</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {veiculosFiltrados.map(v => (
                <tr key={v.id} onClick={() => navigate(`/veiculos/${v.id}`)} style={{ cursor: 'pointer' }}>
                  <td>{getTipoBadge(v)}</td>
                  <td>
                    <strong>{v.marca} {v.modelo}</strong> 
                    {v.consignado && <span style={{ marginLeft: '8px', padding: '2px 6px', fontSize: '0.65rem', background: 'rgba(139, 92, 246, 0.2)', color: '#a78bfa', borderRadius: '4px', border: '1px solid #8b5cf6' }}>CONSIGNADO</span>}
                    <br/>
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
                    {v.valorFipe ? (
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                        FIPE: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v.valorFipe)}
                      </div>
                    ) : null}
                  </td>
                  <td>{getStatusBadge(v.status)}</td>
                </tr>
              ))}
              {veiculosFiltrados.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--color-gray-400)' }}>
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
