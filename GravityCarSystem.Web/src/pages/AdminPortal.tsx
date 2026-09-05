import React, { useEffect, useState } from 'react';
import { fetchEmpresas, createEmpresa, toggleStatusEmpresa } from '../api';
import type { Empresa } from '../api';
import { Building2, Search, PlusCircle, CheckCircle, XCircle } from 'lucide-react';

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
                      <td style={{ textAlign: 'right' }}>
                          <button 
                            className={`btn ${empresa.ativa ? 'btn-danger' : 'btn-success'}`} 
                            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                            onClick={() => handleToggleStatus(empresa.id!)}
                          >
                              {empresa.ativa ? 'Bloquear Acesso' : 'Desbloquear'}
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

    </div>
  );
};

export default AdminPortal;
