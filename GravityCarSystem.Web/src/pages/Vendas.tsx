import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchClientes, fetchVeiculos, fetchAvaliacoes, realizarVenda, emitirNotaFiscalVenda } from '../api';
import type { Cliente, Veiculo, Avaliacao, VendaDto, VendaPagamentoDto, VendaTrocaDto } from '../api';
import { Car, User, DollarSign, Tag, CheckCircle, AlertTriangle, CreditCard, PlusCircle, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Vendas: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [veiculosDisponiveis, setVeiculosDisponiveis] = useState<Veiculo[]>([]);
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form State
  const [clienteId, setClienteId] = useState('');
  const [veiculoId, setVeiculoId] = useState('');
  const [desconto, setDesconto] = useState<number>(0);
  const [emitirNfe, setEmitirNfe] = useState(false);

  // Vendas 2.0 - Pagamentos Dinâmicos
  const [pagamentos, setPagamentos] = useState<VendaPagamentoDto[]>([]);
  const [novoPagamentoTipo, setNovoPagamentoTipo] = useState(1);
  const [novoPagamentoValor, setNovoPagamentoValor] = useState('');

  // Vendas 2.0 - Trocas Dinâmicas
  const [trocas, setTrocas] = useState<VendaTrocaDto[]>([]);
  const [novaTroca, setNovaTroca] = useState({
      marca: '', modelo: '', placa: '', valorAvaliacao: ''
  });

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setLoading(true);
    const [cli, veic, aval] = await Promise.all([fetchClientes(), fetchVeiculos(), fetchAvaliacoes()]);
    setClientes(cli);
    setVeiculosDisponiveis(veic.filter(v => v.status === 4)); // 4 = Disponível
    setAvaliacoes(aval);
    setLoading(false);
  };

  const handleSelecionarAvaliacao = (avaliacaoId: string) => {
    if (!avaliacaoId) return;
    const aval = avaliacoes.find(a => a.id === avaliacaoId);
    if (aval) {
      setNovaTroca({
        marca: aval.marca || '',
        modelo: aval.modelo || '',
        placa: aval.placa || '',
        valorAvaliacao: String(aval.valorAprovado || aval.valorAvaliacao || '')
      });
    }
  };

  const veiculoSelecionado = veiculosDisponiveis.find(v => v.id === veiculoId);
  const valorBruto = veiculoSelecionado?.valorVenda || 0;
  const valorLiquido = valorBruto - desconto;

  const totalTrocas = trocas.reduce((acc, curr) => acc + curr.valorAvaliacao, 0);
  const totalPagamentos = pagamentos.reduce((acc, curr) => acc + curr.valor, 0);
  const totalGeral = totalTrocas + totalPagamentos;
  
  const diferenca = valorLiquido - totalGeral;
  const fechamentoValido = veiculoId && clienteId && (valorLiquido > 0) && (Math.abs(diferenca) < 0.01);

  const addPagamento = () => {
      const val = Number(novoPagamentoValor);
      if (val > 0) {
          setPagamentos([...pagamentos, { tipoPagamento: novoPagamentoTipo, valor: val }]);
          setNovoPagamentoValor('');
      }
  };

  const removePagamento = (index: number) => {
      const copy = [...pagamentos];
      copy.splice(index, 1);
      setPagamentos(copy);
  };

  const addTroca = () => {
      const val = Number(novaTroca.valorAvaliacao);
      if (val > 0 && novaTroca.marca && novaTroca.modelo && novaTroca.placa) {
          setTrocas([...trocas, {
              marca: novaTroca.marca,
              modelo: novaTroca.modelo,
              versao: '',
              anoFabricacao: 2015,
              anoModelo: 2015,
              placa: novaTroca.placa,
              valorAvaliacao: val
          }]);
          setNovaTroca({ marca: '', modelo: '', placa: '', valorAvaliacao: '' });
      }
  };

  const removeTroca = (index: number) => {
      const copy = [...trocas];
      copy.splice(index, 1);
      setTrocas(copy);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    
    if (!fechamentoValido) {
      setErrorMsg('O total de pagamentos e trocas não confere com o valor da venda.');
      return;
    }
    
    setSaving(true);
    
    const venda: VendaDto = {
      clienteId: clienteId,
      usuarioId: '00000000-0000-0000-0000-000000000000', 
      veiculosIds: [veiculoId],
      desconto: Number(desconto),
      pagamentos: pagamentos,
      trocas: trocas
    };

    try {
      const vendaCriada = await realizarVenda(venda);
      
      if (emitirNfe && vendaCriada.id) {
          setSuccessMsg('Venda concluída! Emitindo NF-e...');
          await emitirNotaFiscalVenda(vendaCriada.id);
      }

      setSuccessMsg('Venda finalizada com sucesso! Redirecionando para o Contrato...');
      setTimeout(() => {
          if (vendaCriada.id) {
              navigate(`/contrato/${vendaCriada.id}`);
          } else {
              navigate('/');
          }
      }, 1500);
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
            <DollarSign size={28} color="var(--color-success)" /> Terminal de Vendas 2.0
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

      <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '24px' }}>
        
        {/* Lado Esquerdo: Seleção */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
              <User size={18} color="var(--color-blue)" /> 1. Dados do Comprador
            </h3>
            
            <div className="form-group">
              <label className="form-label">Selecionar Cliente na Base</label>
              <select className="form-input" value={clienteId} onChange={e => setClienteId(e.target.value)} required>
                <option value="">-- Selecione um cliente --</option>
                {clientes.map(c => (
                  <option key={c.id} value={c.id}>{c.nomeRazaoSocial || c.nome} - CPF/CNPJ: {c.cpfCnpj}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
              <Car size={18} color="var(--color-blue)" /> 2. Seleção de Veículo
            </h3>
            
            <div className="form-group">
              <label className="form-label">Selecionar Veículo do Estoque</label>
              <select className="form-input" value={veiculoId} onChange={e => setVeiculoId(e.target.value)} required>
                <option value="">-- Selecione um veículo disponível --</option>
                {veiculosDisponiveis.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.marca} {v.modelo} {v.anoFabricacao}/{v.anoModelo} - {v.placa} ({new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v.valorVenda || 0)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
              <CreditCard size={18} color="var(--color-warning)" /> 3. Fechamento e Pagamentos
            </h3>
            
            {/* Veículo na Troca */}
            <div style={{ marginBottom: '24px', padding: '18px', background: 'rgba(0,0,0,0.2)', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                    <h4 style={{ fontSize: '14px', color: 'var(--color-gray-200)', fontWeight: 600 }}>Adicionar Veículo na Troca</h4>
                    {avaliacoes.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-gray-400)' }}>Puxar de Avaliação:</span>
                        <select 
                          className="form-input" 
                          style={{ height: '34px', fontSize: '0.8rem', padding: '4px 32px 4px 10px', width: '220px' }}
                          onChange={e => handleSelecionarAvaliacao(e.target.value)}
                          defaultValue=""
                        >
                          <option value="">-- Selecionar Avaliação --</option>
                          {avaliacoes.map(a => (
                            <option key={a.id} value={a.id}>
                              {a.marca} {a.modelo} {a.placa ? `(${a.placa})` : ''} - R$ {(a.valorAprovado || a.valorAvaliacao || 0).toLocaleString('pt-BR')}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 1fr 1.2fr 44px', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
                    <input className="form-input" style={{ height: '42px' }} placeholder="Marca" value={novaTroca.marca} onChange={e => setNovaTroca({...novaTroca, marca: e.target.value})} />
                    <input className="form-input" style={{ height: '42px' }} placeholder="Modelo" value={novaTroca.modelo} onChange={e => setNovaTroca({...novaTroca, modelo: e.target.value})} />
                    <input className="form-input" style={{ height: '42px' }} placeholder="Placa" value={novaTroca.placa} onChange={e => setNovaTroca({...novaTroca, placa: e.target.value})} />
                    <input className="form-input" style={{ height: '42px' }} type="number" placeholder="Valor (R$)" value={novaTroca.valorAvaliacao} onChange={e => setNovaTroca({...novaTroca, valorAvaliacao: e.target.value})} />
                    <button type="button" className="btn btn-primary" onClick={addTroca} style={{ height: '42px', width: '44px', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }} title="Adicionar Troca">
                      <PlusCircle size={20}/>
                    </button>
                </div>
                {trocas.map((t, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px', marginBottom: '6px' }}>
                        <span>🚗 <strong>{t.marca} {t.modelo}</strong> <span style={{ fontFamily: 'monospace', color: 'var(--color-gray-400)', marginLeft: '6px' }}>({t.placa})</span></span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <strong style={{ color: 'var(--color-warning)' }}>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.valorAvaliacao)}</strong>
                            <button type="button" onClick={() => removeTroca(idx)} style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', display: 'flex' }}><Trash2 size={16}/></button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Outros Pagamentos */}
            <div style={{ padding: '18px', background: 'rgba(0,0,0,0.2)', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
                <h4 style={{ marginBottom: '14px', fontSize: '14px', color: 'var(--color-gray-200)', fontWeight: 600 }}>Adicionar Pagamento</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 44px', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
                    <select className="form-input" style={{ height: '42px' }} value={novoPagamentoTipo} onChange={e => setNovoPagamentoTipo(Number(e.target.value))}>
                        <option value={1}>Dinheiro / Pix</option>
                        <option value={2}>Financiamento</option>
                        <option value={3}>Cheque</option>
                        <option value={4}>Cartão</option>
                    </select>
                    <input className="form-input" style={{ height: '42px' }} type="number" placeholder="Valor (R$)" value={novoPagamentoValor} onChange={e => setNovoPagamentoValor(e.target.value)} />
                    <button type="button" className="btn btn-primary" onClick={addPagamento} style={{ height: '42px', width: '44px', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }} title="Adicionar Pagamento">
                      <PlusCircle size={20}/>
                    </button>
                </div>
                {pagamentos.map((p, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px', marginBottom: '6px' }}>
                        <span>💰 {p.tipoPagamento === 1 ? 'PIX / Dinheiro' : p.tipoPagamento === 2 ? 'Financiamento' : p.tipoPagamento === 3 ? 'Cheque' : 'Cartão'}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <strong style={{ color: 'var(--color-success)' }}>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.valor)}</strong>
                            <button type="button" onClick={() => removePagamento(idx)} style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', display: 'flex' }}><Trash2 size={16}/></button>
                        </div>
                    </div>
                ))}
            </div>

          </div>

        </div>

        {/* Lado Direito: Resumo */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="glass-panel" style={{ padding: '24px', position: 'sticky', top: '24px' }}>
            <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
              <Tag size={18} color="var(--color-success)" /> Resumo da Venda
            </h3>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ color: 'var(--color-gray-400)' }}>Veículo (Bruto):</span>
              <strong>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorBruto)}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'center' }}>
              <span style={{ color: 'var(--color-gray-400)' }}>Desconto (-):</span>
              <input 
                type="number" 
                className="form-input" 
                style={{ width: '120px', padding: '4px 8px', textAlign: 'right' }} 
                value={desconto} 
                onChange={e => setDesconto(Number(e.target.value) || 0)} 
                min="0"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', paddingTop: '16px', borderTop: '1px dashed rgba(255,255,255,0.2)' }}>
              <span style={{ fontSize: '1.1rem' }}>Total da Venda:</span>
              <strong style={{ fontSize: '1.2rem', color: 'var(--color-white)' }}>
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorLiquido)}
              </strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: 'var(--color-warning)' }}>Total Trocas (-):</span>
              <strong style={{ color: 'var(--color-warning)' }}>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalTrocas)}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span style={{ color: 'var(--color-success)' }}>Total Pagamentos (-):</span>
              <strong style={{ color: 'var(--color-success)' }}>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPagamentos)}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', background: diferenca === 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)', borderRadius: '8px', border: `1px solid ${diferenca === 0 ? 'var(--color-success)' : 'var(--color-danger)'}` }}>
              <span>Diferença:</span>
              <strong style={{ color: diferenca === 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(diferenca)}
              </strong>
            </div>
            {diferenca !== 0 && (
                <p style={{ color: 'var(--color-danger)', fontSize: '0.8rem', marginTop: '8px', textAlign: 'center' }}>
                    O total pago deve ser exatamente igual ao valor da venda.
                </p>
            )}

            <div className="form-group" style={{ marginTop: '24px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="checkbox" checked={emitirNfe} onChange={e => setEmitirNfe(e.target.checked)} />
                Emitir NF-e de Saída Automaticamente
              </label>
            </div>

            <button 
                type="submit" 
                className="btn btn-success" 
                style={{ width: '100%', marginTop: '24px', padding: '16px', fontSize: '1.1rem', opacity: fechamentoValido ? 1 : 0.5 }}
                disabled={!fechamentoValido || saving}
            >
              {saving ? 'Processando...' : 'Concluir Venda'}
            </button>
          </div>

        </div>

      </form>
    </div>
  );
};

export default Vendas;
