import React, { useEffect, useState } from 'react';
import { fetchCheques, alterarStatusCheque } from '../api';
import type { Cheque } from '../api';
import { CreditCard, Search, ArrowRightCircle, CheckCircle, AlertCircle, Clock } from 'lucide-react';

const Cheques: React.FC = () => {
  const [cheques, setCheques] = useState<Cheque[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setLoading(true);
    const data = await fetchCheques();
    setCheques(data);
    setLoading(false);
  };

  const handleMudarStatus = async (id: string, novoStatus: number) => {
    setUpdating(id);
    try {
        await alterarStatusCheque(id, novoStatus);
        await carregarDados(); // Recarrega para ver a atualização
    } catch (e) {
        console.error('Erro ao atualizar status', e);
    } finally {
        setUpdating(null);
    }
  };

  const getStatusBadge = (status: number) => {
    switch (status) {
        case 0: return <span className="badge badge-warning" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={14}/> Recebido</span>;
        case 1: return <span className="badge badge-warning" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={14}/> Custódia</span>;
        case 2: return <span className="badge badge-blue" style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(96, 165, 250, 0.2)', color: '#60a5fa' }}><ArrowRightCircle size={14}/> Depositado</span>;
        case 3: return <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle size={14}/> Compensado</span>;
        case 4: return <span className="badge badge-danger" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><AlertCircle size={14}/> Devolvido</span>;
        default: return <span className="badge">Desconhecido</span>;
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', padding: '24px' }}>
      <header className="page-header" style={{ marginBottom: '32px' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <CreditCard size={28} color="var(--color-warning)" /> Painel de Cheques
          </h1>
          <p style={{ color: 'var(--color-gray-400)', marginTop: '8px' }}>
            Gerencie o ciclo de vida dos cheques em custódia (Recebido → Depositado → Compensado).
          </p>
        </div>
      </header>

      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div className="search-bar">
              <Search size={18} />
              <input 
                type="text" 
                className="form-input" 
                placeholder="Buscar por cliente ou banco..." 
                style={{ width: '320px' }} 
              />
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
                <span className="badge" style={{ fontSize: '0.9rem', padding: '8px 16px', background: 'rgba(255,255,255,0.05)' }}>
                    Total em Custódia: 
                    <strong style={{ color: 'var(--color-warning)', marginLeft: '8px' }}>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cheques.filter(c => c.status === 0 || c.status === 1).reduce((acc, curr) => acc + curr.valor, 0))}
                    </strong>
                </span>
            </div>
        </div>

        {loading ? (
            <p style={{ color: 'var(--color-gray-400)', textAlign: 'center', padding: '40px' }}>Carregando cheques...</p>
        ) : cheques.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--color-gray-400)' }}>
                <CreditCard size={48} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
                <p>Nenhum cheque registrado no sistema.</p>
            </div>
        ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Data (Bom Para)</th>
                    <th>Cliente</th>
                    <th>Banco / Agência / Conta</th>
                    <th>Valor</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Ações de Baixa</th>
                  </tr>
                </thead>
                <tbody>
                  {cheques.map(cheque => (
                    <tr key={cheque.id}>
                      <td>{new Date(cheque.dataBomPara).toLocaleDateString('pt-BR')}</td>
                      <td>{cheque.clienteNome || 'Cliente não identificado'}</td>
                      <td>
                          {cheque.banco ? `${cheque.banco} / ${cheque.agencia} / ${cheque.conta}` : <span style={{ color: 'var(--color-danger)' }}>Dados Pendentes</span>}
                      </td>
                      <td style={{ fontWeight: 'bold' }}>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cheque.valor)}</td>
                      <td>{getStatusBadge(cheque.status)}</td>
                      <td style={{ textAlign: 'right' }}>
                          {(cheque.status === 0 || cheque.status === 1) && (
                              <button 
                                className="btn btn-secondary" 
                                style={{ padding: '6px 12px', fontSize: '0.8rem', background: 'rgba(96, 165, 250, 0.2)', color: '#60a5fa', border: '1px solid #60a5fa' }}
                                onClick={() => handleMudarStatus(cheque.id, 2)}
                                disabled={updating === cheque.id}
                              >
                                  Marcar Depositado
                              </button>
                          )}
                          {cheque.status === 2 && (
                              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                  <button 
                                    className="btn btn-success" 
                                    style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                                    onClick={() => handleMudarStatus(cheque.id, 3)}
                                    disabled={updating === cheque.id}
                                  >
                                      Compensou
                                  </button>
                                  <button 
                                    className="btn btn-danger" 
                                    style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                                    onClick={() => handleMudarStatus(cheque.id, 4)}
                                    disabled={updating === cheque.id}
                                  >
                                      Devolvido
                                  </button>
                              </div>
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
