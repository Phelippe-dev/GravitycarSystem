import React, { useEffect, useState } from 'react';
import { fetchEmpresas, createEmpresa, updateEmpresa, deleteEmpresa, toggleStatusEmpresa, adicionarCreditosEmpresa, impersonateEmpresa } from '../api';
import type { Empresa } from '../api';
import { Building2, Building, Search, Plus, PlusCircle, CheckCircle, XCircle, Coins, Edit, Trash2, LogIn } from 'lucide-react';

const AdminPortal: React.FC = () => {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // Create / Edit state
  const [novaEmpresa, setNovaEmpresa] = useState<Partial<Empresa> & { senhaAdmin?: string }>({
    razaoSocial: '',
    nomeFantasia: '',
    cnpj: '',
    email: '',
    senhaAdmin: ''
  });
  const [editingId, setEditingId] = useState<string | null>(null);

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

  const handleDeletar = async (id: string) => {
    if (window.confirm('Tem certeza que deseja deletar este tenant? Esta aÃ§Ã£o Ã© irreversÃ­vel.')) {
        try {
            await deleteEmpresa(id);
            await carregarDados();
        } catch (e) {
            console.error("Erro ao deletar empresa", e);
            alert("NÃ£o foi possÃ­vel deletar o tenant. Ele pode possuir registros dependentes.");
        }
    }
  };

  const handleImpersonate = async (id: string) => {
    try {
        const result = await impersonateEmpresa(id);
        localStorage.setItem('token', result.token);
        localStorage.setItem('userName', result.nome);
        window.location.href = '/dashboard';
    } catch (e) {
        console.error("Erro ao entrar na loja", e);
        alert("Erro ao tentar entrar na loja.");
    }
  };

  const abrirEdicao = (empresa: Empresa) => {
      setEditingId(empresa.id!);
      setNovaEmpresa({
          razaoSocial: empresa.razaoSocial,
          nomeFantasia: empresa.nomeFantasia,
          cnpj: empresa.cnpj,
          email: empresa.email
      });
      setShowModal(true);
  };

  const abrirCriacao = () => {
      setEditingId(null);
      setNovaEmpresa({ razaoSocial: '', nomeFantasia: '', cnpj: '', email: '', senhaAdmin: '' });
      setShowModal(true);
  };

  const handleSalvar = async () => {
    try {
        if (editingId) {
            await updateEmpresa(editingId, novaEmpresa);
        } else {
            await createEmpresa(novaEmpresa);
        }
        setShowModal(false);
        setEditingId(null);
        setNovaEmpresa({ razaoSocial: '', nomeFantasia: '', cnpj: '', email: '', senhaAdmin: '' });
        await carregarDados();
    } catch (e: any) {
        console.error("Erro ao salvar empresa", e);
        alert("Erro ao salvar: " + e.message);
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
        alert('CrÃ©ditos adicionados com sucesso!');
    } catch (e) {
        console.error("Erro ao adicionar crÃ©ditos", e);
        alert('Erro ao adicionar crÃ©ditos. Verifique se o usuÃ¡rio tem permissÃ£o SuperAdmin.');
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
            GestÃ£o Multi-Tenant das ConcessionÃ¡rias Clientes (Software House)
          </p>
        </div>
        <div>
            <button className="btn btn-primary" onClick={abrirCriacao}>
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
                <p>Nenhuma concessionÃ¡ria cliente registrada no banco de dados.</p>
            </div>
        ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Loja (Nome Fantasia)</th>
                    <th>RazÃ£o Social</th>
                    <th>CNPJ</th>
                    <th>Data Entrada</th>
                    <th>Status Assinatura</th>
                    <th>Saldo</th>
                    <th style={{ textAlign: 'right' }}>AÃ§Ãµes</th>
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
                      <td style={{ textAlign: 'right', display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                          <button 
                            className="btn btn-outline" 
                            style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                            onClick={() => handleImpersonate(empresa.id!)}
                            title="Entrar na loja como Admin"
                          >
                              <LogIn size={14} /> Entrar
                          </button>
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
                            title={empresa.ativa ? 'Bloquear' : 'Desbloquear'}
                          >
                              {empresa.ativa ? <XCircle size={14} /> : <CheckCircle size={14} />}
                          </button>
                          <button 
                            className="btn btn-outline" 
                            style={{ padding: '6px 12px', fontSize: '0.8rem', color: 'var(--color-blue-light)' }}
                            onClick={() => abrirEdicao(empresa)}
                            title="Editar"
                          >
                              <Edit size={14} />
                          </button>
                          <button 
                            className="btn btn-outline" 
                            style={{ padding: '6px 12px', fontSize: '0.8rem', color: 'var(--color-danger)' }}
                            onClick={() => handleDeletar(empresa.id!)}
                            title="Remover"
                          >
                              <Trash2 size={14} />
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
          <div className="modal-content glass-panel" style={{ maxWidth: '650px', padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                <Building size={24} style={{ color: 'var(--color-primary)' }} />
                <h2 style={{ margin: 0, fontSize: '1.4rem' }}>{editingId ? 'Editar ConcessionÃ¡ria' : 'Cadastrar Nova ConcessionÃ¡ria'}</h2>
              </div>
              <p style={{ margin: 0, color: 'var(--color-gray-400)', fontSize: '0.9rem' }}>
                {editingId ? 'Altere os dados da concessionÃ¡ria abaixo.' : 'Preencha os dados abaixo para provisionar um novo ambiente isolado.'}
              </p>
            </div>
            
            <div style={{ padding: '32px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px' }}>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">RazÃ£o Social *</label>
                    <input type="text" className="form-input" placeholder="Ex: Gravity Motors Concessionaria LTDA" value={novaEmpresa.razaoSocial} onChange={e => setNovaEmpresa({...novaEmpresa, razaoSocial: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Nome Fantasia</label>
                    <input type="text" className="form-input" placeholder="Ex: Gravity Motors" value={novaEmpresa.nomeFantasia} onChange={e => setNovaEmpresa({...novaEmpresa, nomeFantasia: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">CNPJ *</label>
                    <input type="text" className="form-input" placeholder="00.000.000/0001-00" value={novaEmpresa.cnpj} onChange={e => setNovaEmpresa({...novaEmpresa, cnpj: e.target.value})} />
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">E-mail {editingId ? '' : '(Para Primeiro Acesso do Dono)'} *</label>
                    <input type="email" className="form-input" placeholder="contato@empresa.com.br" value={novaEmpresa.email} onChange={e => setNovaEmpresa({...novaEmpresa, email: e.target.value})} />
                  </div>
                  {!editingId && (
                      <div className="form-group" style={{ gridColumn: 'span 2' }}>
                        <label className="form-label">Senha Inicial do Dono *</label>
                        <input type="password" className="form-input" placeholder="MÃ­nimo 6 caracteres" value={novaEmpresa.senhaAdmin} onChange={e => setNovaEmpresa({...novaEmpresa, senhaAdmin: e.target.value})} />
                      </div>
                  )}
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button className="btn btn-secondary" onClick={() => setShowModal(false)} style={{ padding: '10px 20px' }}>Cancelar</button>
                <button className="btn btn-primary" onClick={handleSalvar} style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Plus size={18} /> {editingId ? 'Salvar AlteraÃ§Ãµes' : 'Criar Workspace'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de CrÃ©ditos */}
      {showCreditosModal && empresaSelecionada && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: '400px' }}>
            <h2 style={{ marginBottom: '8px' }}>Adicionar CrÃ©ditos</h2>
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
                  <label>Valor Pago R$ (Opcional, p/ histÃ³rico)</label>
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
