import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchVeiculos } from '../api';
import type { Veiculo } from '../api';

const Estoque: React.FC = () => {
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
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
      case 4: return <span className="status-badge status-disponivel">Disponível</span>;
      case 5: return <span className="status-badge" style={{background: 'rgba(234,179,8,0.2)', color: '#eab308'}}>Reservado</span>;
      case 6: return <span className="status-badge" style={{background: 'rgba(239,68,68,0.2)', color: '#ef4444'}}>Vendido</span>;
      default: return <span className="status-badge">Indisponível</span>;
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      <header className="page-header">
        <h1 className="page-title">Estoque de Veículos</h1>
      </header>

      <div className="table-modern-container">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-gray-400)' }}>Carregando veículos...</div>
        ) : (
          <table className="table-modern">
            <thead>
              <tr>
                <th>Veículo</th>
                <th>Ano</th>
                <th>Placa</th>
                <th>Preço</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {veiculos.map(v => (
                <tr key={v.id} onClick={() => navigate(`/veiculos/${v.id}`)} style={{ cursor: 'pointer' }}>
                  <td>
                    <strong>{v.marca} {v.modelo}</strong> <br/>
                    <small style={{color: 'var(--color-gray-400)'}}>{v.versao}</small>
                  </td>
                  <td>{v.anoFabricacao}/{v.anoModelo}</td>
                  <td>{v.placa || '-'}</td>
                  <td>
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v.valorVenda || 0)}
                  </td>
                  <td>{getStatusBadge(v.status)}</td>
                </tr>
              ))}
              {veiculos.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'var(--color-gray-400)' }}>Nenhum veículo cadastrado.</td>
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
