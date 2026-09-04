import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getClienteDetalhes } from '../api';
import type { ClienteDetalhes } from '../api';
import { ArrowLeft, DollarSign, Car } from 'lucide-react';

const ClienteDetalhesPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [cliente, setCliente] = useState<ClienteDetalhes | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadCliente(id);
    }
  }, [id]);

  const loadCliente = async (clienteId: string) => {
    setLoading(true);
    try {
      const data = await getClienteDetalhes(clienteId);
      setCliente(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  if (loading) return <div style={{ padding: '40px', color: '#9ca3af' }}>Carregando perfil do cliente...</div>;
  if (!cliente) return <div style={{ padding: '40px', color: '#ef4444' }}>Cliente não encontrado.</div>;

  const getStatusVenda = (status: number) => {
      if(status === 2) return "Concluída";
      if(status === 3) return "Cancelada";
      return "Em Andamento";
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
      <header className="page-header" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button className="btn btn-outline" onClick={() => navigate('/clientes')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}>
            <ArrowLeft size={18} /> Voltar
          </button>
          <h1 className="page-title">Perfil do Cliente</h1>
        </div>
      </header>

      <div className="glass-panel" style={{ padding: '32px', marginBottom: '24px', display: 'flex', gap: '24px', alignItems: 'center' }}>
        <div className="avatar-cell" style={{ gap: '16px' }}>
            <div className="avatar-sm" style={{ width: '80px', height: '80px', fontSize: '2rem', borderRadius: '20px' }}>
                {(cliente.nome || cliente.nomeRazaoSocial || 'C').charAt(0).toUpperCase()}
            </div>
            <div>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 700, margin: '0 0 8px 0' }}>{cliente.nome || cliente.nomeRazaoSocial}</h2>
                <div style={{ color: 'var(--color-gray-400)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span>CPF/CNPJ: {cliente.cpfCnpj}</span>
                    <span>Contato: {cliente.telefone || cliente.celular || cliente.email || 'Nenhum contato registrado'}</span>
                </div>
            </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
                <DollarSign color="var(--color-success)" /> Histórico de Compras (Vendas)
            </h3>
            {cliente.vendasRealizadas.length === 0 ? (
                <p style={{ color: 'var(--color-gray-400)' }}>Nenhuma compra realizada por este cliente.</p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {cliente.vendasRealizadas.map(v => (
                        <div key={v.id || Math.random().toString()} style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <strong>Venda {v.numeroVenda || `#${v.id?.substring(0,8) || 'N/A'}`}</strong>
                                <span className={`badge ${v.status === 2 ? 'badge-success' : 'badge-warning'}`}>{getStatusVenda(v.status || 0)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-gray-400)', fontSize: '0.9rem' }}>
                                <span>{new Date(v.dataVenda || new Date()).toLocaleDateString()}</span>
                                <span style={{ color: 'var(--color-white)', fontWeight: 600 }}>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v.valorLiquido || 0)}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
          </div>

          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
                <Car color="var(--color-blue-light)" /> Veículos de Troca
            </h3>
            {cliente.veiculosNaTroca.length === 0 ? (
                <p style={{ color: 'var(--color-gray-400)' }}>Nenhum veículo recebido em troca.</p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {cliente.veiculosNaTroca.map((t, idx) => (
                        <div key={idx} style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <strong>{t.marca} {t.modelo}</strong>
                                <span>{t.placa}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-gray-400)', fontSize: '0.9rem' }}>
                                <span>{t.anoFabricacao}/{t.anoModelo}</span>
                                <span style={{ color: 'var(--color-danger)' }}>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.valorAvaliacao)}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
          </div>

      </div>
    </div>
  );
};

export default ClienteDetalhesPage;
