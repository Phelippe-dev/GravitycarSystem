import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchClientes, fetchVeiculos, realizarVenda } from '../api';
import type { Cliente, Veiculo, VendaDto } from '../api';
import { Car, User, DollarSign, Tag, CheckCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Vendas: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [veiculosDisponiveis, setVeiculosDisponiveis] = useState<Veiculo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form State
  const [clienteId, setClienteId] = useState('');
  const [veiculoId, setVeiculoId] = useState('');
  const [desconto, setDesconto] = useState(0);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setLoading(true);
    const [cli, veic] = await Promise.all([fetchClientes(), fetchVeiculos()]);
    setClientes(cli);
    setVeiculosDisponiveis(veic.filter(v => v.status === 4)); // 4 = Disponível
    setLoading(false);
  };

  const veiculoSelecionado = veiculosDisponiveis.find(v => v.id === veiculoId);
  const valorBruto = veiculoSelecionado?.valorVenda || 0;
  const valorLiquido = valorBruto - desconto;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    
    if (!clienteId || !veiculoId) {
      setErrorMsg('Por favor, selecione um cliente e um veículo.');
      return;
    }
    
    setSaving(true);
    
    // O backend agora pega o usuarioId do Token, mas mandamos vazio por compatibilidade com a tipagem
    const venda: VendaDto = {
      clienteId: clienteId,
      usuarioId: '00000000-0000-0000-0000-000000000000', // Será ignorado pelo backend
      veiculosIds: [veiculoId],
      desconto: Number(desconto)
    };

    try {
      await realizarVenda(venda);
      setSuccessMsg('Venda concluída! Gerando Contas a Receber...');
      setTimeout(() => navigate('/'), 2000);
    } catch (err: any) {
      setErrorMsg(`Erro: ${err.message}`);
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: '32px' }}>Carregando terminal de vendas...</div>;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', padding: '24px' }}>
      <header className="page-header" style={{ marginBottom: '40px' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <DollarSign size={28} color="var(--color-success)" /> Checkout de Veículo
          </h1>
          <p style={{ color: 'var(--color-gray-400)', marginTop: '8px' }}>
            Operador Logado: <strong>{user?.nome}</strong>
          </p>
        </div>
      </header>

      {errorMsg && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--color-danger)', color: 'var(--color-danger)', padding: '16px', borderRadius: '8px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle size={20} />
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--color-success)', color: 'var(--color-success)', padding: '16px', borderRadius: '8px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle size={20} />
          {successMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="pos-layout">
        
        {/* Lado Esquerdo: Seleção */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
              <User size={18} color="var(--color-blue)" /> Dados do Comprador
            </h3>
            
            <div className="form-group">
              <label className="form-label">Selecionar Cliente na Base</label>
              <select className="form-input" value={clienteId} onChange={e => setClienteId(e.target.value)} required style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <option value="">-- Selecione um cliente --</option>
                {clientes.map(c => (
                  <option key={c.id} value={c.id}>{c.nomeRazaoSocial || c.nome} - CPF/CNPJ: {c.cpfCnpj}</option>
                ))}
              </select>
              {clientes.length === 0 && <small style={{color: '#ef4444', marginTop: '8px', display: 'block'}}>Nenhum cliente cadastrado. Cadastre em "Clientes" primeiro.</small>}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
              <Car size={18} color="var(--color-blue)" /> Seleção de Veículo
            </h3>
            
            <div className="form-group">
              <label className="form-label">Veículos Disponíveis no Pátio</label>
              <select className="form-input" value={veiculoId} onChange={e => setVeiculoId(e.target.value)} required style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <option value="">-- Selecione o veículo --</option>
                {veiculosDisponiveis.map(v => (
                  <option key={v.id} value={v.id}>{v.marca} {v.modelo} {v.versao} (Placa: {v.placa}) - R$ {v.valorVenda}</option>
                ))}
              </select>
              {veiculosDisponiveis.length === 0 && <small style={{color: '#eab308', marginTop: '8px', display: 'block'}}>Nenhum veículo disponível no estoque atual.</small>}
            </div>
          </div>

        </div>

        {/* Lado Direito: Resumo Financeiro */}
        <div className="pos-summary-card">
          <h2 style={{ marginBottom: '32px', textAlign: 'center' }}>Resumo da Venda</h2>

          <div className="pos-summary-row">
            <span style={{ color: 'var(--color-gray-400)' }}>Subtotal:</span>
            <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorBruto)}</span>
          </div>

          <div className="pos-summary-row">
            <span style={{ color: 'var(--color-gray-400)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Tag size={16} /> Desconto Aplicado:
            </span>
            <input 
              type="number" 
              style={{ width: '120px', textAlign: 'right', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px', color: 'white', borderRadius: '6px' }} 
              value={desconto} 
              onChange={e => setDesconto(Number(e.target.value))}
              disabled={!veiculoId}
            />
          </div>

          <div className="pos-total">
            <span>Total a Pagar:</span>
            <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorLiquido)}</span>
          </div>

          <div style={{ marginTop: '40px' }}>
            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ 
                width: '100%', 
                padding: '20px', 
                fontSize: '1.2rem', 
                fontWeight: 700,
                background: 'var(--color-success)',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
              }} 
              disabled={saving || !clienteId || !veiculoId}
            >
              {saving ? 'PROCESSANDO...' : 'FINALIZAR VENDA'}
            </button>
            <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.8rem', color: 'var(--color-gray-400)' }}>
              A nota fiscal e o registro em Contas a Receber serão gerados automaticamente.
            </p>
          </div>
        </div>

      </form>
    </div>
  );
};

export default Vendas;
