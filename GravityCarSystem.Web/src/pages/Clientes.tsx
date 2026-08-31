import React, { useEffect, useState } from 'react';
import { fetchClientes, adicionarCliente } from '../api';
import type { Cliente } from '../api';

const Clientes: React.FC = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState<Partial<Cliente>>({
    nome: '', cpfCnpj: '', email: '', telefone: ''
  });

  useEffect(() => {
    carregarClientes();
  }, []);

  const carregarClientes = async () => {
    setLoading(true);
    const dados = await fetchClientes();
    setClientes(dados);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adicionarCliente(formData);
      setShowForm(false);
      setFormData({ nome: '', cpfCnpj: '', email: '', telefone: '' });
      carregarClientes();
    } catch (err) {
      alert("Erro ao salvar cliente.");
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
      <header className="page-header">
        <h1 className="page-title">Gestão de Clientes</h1>
        {!showForm && (
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Novo Cliente</button>
        )}
      </header>

      {showForm ? (
        <div className="glass-panel" style={{ padding: '32px', marginBottom: '24px' }}>
          <h2>Cadastrar Novo Cliente</h2>
          <form onSubmit={handleSubmit} style={{ marginTop: '24px' }}>
            <div className="form-group">
              <label className="form-label">Nome Completo</label>
              <input type="text" className="form-input" required value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">CPF/CNPJ</label>
                <input type="text" className="form-input" required value={formData.cpfCnpj} onChange={e => setFormData({...formData, cpfCnpj: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Telefone</label>
                <input type="text" className="form-input" value={formData.telefone} onChange={e => setFormData({...formData, telefone: e.target.value})} />
              </div>
            </div>
            <div className="form-group" style={{ marginTop: '16px' }}>
              <button type="button" className="btn" onClick={() => setShowForm(false)} style={{ marginRight: '16px' }}>Cancelar</button>
              <button type="submit" className="btn btn-primary">Salvar</button>
            </div>
          </form>
        </div>
      ) : (
        <div className="table-modern-container">
          {loading ? <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-gray-400)' }}>Carregando clientes...</div> : (
            <table className="table-modern">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Documento (CPF/CNPJ)</th>
                  <th>Contato</th>
                </tr>
              </thead>
              <tbody>
                {clientes.map(c => {
                  const initial = (c.nome || c.nomeRazaoSocial || 'C').charAt(0).toUpperCase();
                  const name = c.nome || c.nomeRazaoSocial || '-';
                  return (
                    <tr key={c.id}>
                      <td>
                        <div className="avatar-cell">
                          <div className="avatar-sm">{initial}</div>
                          <strong>{name}</strong>
                        </div>
                      </td>
                      <td>{c.cpfCnpj || '-'}</td>
                      <td>{c.telefone || c.email || '-'}</td>
                    </tr>
                  );
                })}
                {clientes.length === 0 && (
                  <tr>
                    <td colSpan={3} style={{ padding: '40px', textAlign: 'center', color: 'var(--color-gray-400)' }}>Nenhum cliente cadastrado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default Clientes;
