import React, { useEffect, useState } from 'react';
import { fetchEmpresas, createEmpresa, toggleStatusEmpresa, adicionarCreditosEmpresa } from '../api';
import type { Empresa } from '../api';
import { Building2, Search, PlusCircle, CheckCircle, XCircle, Coins } from 'lucide-react';

const AdminPortal: React.FC = () => {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [novaEmpresa, setNovaEmpresa] = useState<Partial<Empresa>>({
    razaoSocial: '',
    nomeFantasia: '',
    cnpj: '',
    email: ''
  });

  // Saldo
  const [showCreditosModal, setShowCreditosModal] = useState(false);
  const [empresaSelecionada, setEmpresaSelecionada] = useState<Empresa | null>(null);
  const [qtdCreditos, setQtdCreditos] = useState<number>(10);
  const [valorPago, setValorPago] = useState<number>(0);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setLoading(true);
    const data = await fetchEmpresas();
    setEmpresas(data);
    setLoading(false);
  };

  const handleToggleStatus = async (id: string) => {
    try {
        await toggleStatusEmpresa(id);
        await carregarDados();
    } catch (e) {
        console.error("Erro ao alterar status", e);
    }
  };

  const handleSalvar = async () => {
    try {
        await createEmpresa(novaEmpresa);
        setShowModal(false);
        setNovaEmpresa({ razaoSocial: '', nomeFantasia: '', cnpj: '', email: '' });
        await carregarDados();
    } catch (e) {
        console.error("Erro ao criar empresa", e);
    }
  };

  const handleAdicionarCreditos = async () => {
    if (!empresaSelecionada) return;
    try {
        await adicionarCreditosEmpresa(empresaSelecionada.id!, qtdCreditos, valorPago);
        setShowCreditosModal(false);
        setQtdCreditos(10);
        setValorPago(0);
        await carregarDados();
        alert('Créditos adicionados com sucesso!');
    } catch (e) {
        console.error("Erro ao adicionar créditos", e);
        alert('Erro ao adicionar créditos. Verifique se o usuário tem permissão SuperAdmin.');
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', padding: '24px' }}>
      <header className="page-header" style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Building2 size={28} color="var(--color-blue-light)" /> Portal GravityCarAdmin
          </h1>
          <p style={{ color: 'var(--color-gray-400)', marginTop: '8px' }}>
            Gestão Multi-Tenant das Concessionárias Clientes (Software House)
          </p>
        </div>
        <div>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                <PlusCircle size={20} />
                Novo Tenant
            </button>
        </div>
      </header>

      <div className="dashboard-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '32px' }}>
        <div className="stat-card glass-panel" style={{ padding: '20px' }}>
          <span className="stat-card-title">Tenants Cadastrados</span>
          <span className="stat-card-value" style={{ fontSize: '2rem', color: 'var(--color-blue-light)' }}>{empresas.length}</span>
        </div>
        <div className="stat-card glass-panel" style={{ padding: '20px' }}>
          <span className="stat-card-title">Tenants Ativos</span>
          <span className="stat-card-value" style={{ fontSize: '2rem', color: 'var(--color-success)' }}>{empresas.filter(e => e.ativa).length}</span>
        </div>
        <div className="stat-card glass-panel" style={{ padding: '20px' }}>
          <span className="stat-card-title">Tenants Bloqueados</span>
          <span className="stat-card-value" style={{ fontSize: '2rem', color: 'var(--color-danger)' }}>{empresas.filter(e => !e.ativa).length}</span>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div className="search-bar">
              <Search size={18} />
              <input 
                type="text" 
                className="form-input" 
                placeholder="Buscar por loja ou CNPJ..." 
                style={{ width: '320px' }} 
              />
            </div>
        </div>

        {loading ? (
            <p style={{ color: 'var(--color-gray-400)', textAlign: 'center', padding: '40px' }}>Carregando tenants...</p>
        ) : empresas.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--color-gray-400)' }}>
                <Building2 size={48} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
                <p>Nenhuma concessionária cliente registrada no banco de dados.</p>
            </div>
        ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Loja (Nome Fantasia)</th>
                    <th>Razão Social</th>
                    <th>CNPJ</th>
                    <th>Data Entrada</th>
                    <th>Status Assinatura</th>
                    <th>Saldo</th>
                    <th style={{ textAlign: 'right' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {empresas.map(empresa => (
                    <tr key={empresa.id}>
                      <td style={{ fontWeight: 'bold' }}>{empresa.nomeFantasia}</td>
                      <td>{empresa.razaoSocial}</td>
                      <td>{empresa.cnpj}</td>
                      <td>{new Date(empresa.criadoEm).toLocaleDateString('pt-BR')}</td>
                      <td>
                          {empresa.ativa 
                            ? <span className="badge badge-success"><CheckCircle size={14}/> Ativo</span> 
                            : <span className="badge badge-danger"><XCircle size={14}/> Bloqueado</span>}
                      </td>
                      <td style={{ fontWeight: 'bold', color: 'var(--color-blue-light)' }}>
                        {empresa.saldoConsultas ?? 0}
                      </td>
                      <td style={{ textAlign: 'right', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button 
                            className="btn btn-outline" 
                            style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                            onClick={() => {
                              setEmpresaSelecionada(empresa);
                              setShowCreditosModal(true);
                            }}
                          >
                              <Coins size={14} /> Recarregar
                          </button>
                          <button 
                            className={`btn ${empresa.ativa ? 'btn-danger' : 'btn-success'}`} 
                            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                            onClick={() => handleToggleStatus(empresa.id!)}
                          >
                              {empresa.ativa ? 'Bloquear' : 'Desbloquear'}
                          </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: '600px' }}>
            <h2 style={{ marginBottom: '20px' }}>Cadastrar Nova Concessionária (Tenant)</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Razão Social</label>
                  <input type="text" className="form-input" value={novaEmpresa.razaoSocial} onChange={e => setNovaEmpresa({...novaEmpresa, razaoSocial: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Nome Fantasia</label>
                  <input type="text" className="form-input" value={novaEmpresa.nomeFantasia} onChange={e => setNovaEmpresa({...novaEmpresa, nomeFantasia: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>CNPJ</label>
                  <input type="text" className="form-input" value={novaEmpresa.cnpj} onChange={e => setNovaEmpresa({...novaEmpresa, cnpj: e.target.value})} />
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>E-mail (Para Primeiro Acesso do Dono)</label>
                  <input type="email" className="form-input" value={novaEmpresa.email} onChange={e => setNovaEmpresa({...novaEmpresa, email: e.target.value})} />
                </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSalvar}>
                Criar Workspace
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Créditos */}
      {showCreditosModal && empresaSelecionada && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: '400px' }}>
            <h2 style={{ marginBottom: '8px' }}>Adicionar Créditos</h2>
            <p style={{ color: 'var(--color-gray-400)', fontSize: '0.9rem', marginBottom: '20px' }}>
              Loja: <strong>{empresaSelecionada.nomeFantasia}</strong>
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                <div className="form-group">
                  <label>Quantidade de Consultas (FIPE/DETRAN)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={qtdCreditos} 
                    onChange={e => setQtdCreditos(Number(e.target.value))} 
                    min="1"
                  />
                </div>
                <div className="form-group">
                  <label>Valor Pago R$ (Opcional, p/ histórico)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={valorPago} 
                    onChange={e => setValorPago(Number(e.target.value))} 
                    min="0"
                  />
                </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button className="btn btn-secondary" onClick={() => setShowCreditosModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleAdicionarCreditos}>
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminPortal;
