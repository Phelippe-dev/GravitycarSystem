import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchClientes, fetchVeiculos, fetchAvaliacoes, realizarVenda, emitirNotaFiscalVenda } from '../api';
import type { Cliente, Veiculo, Avaliacao, VendaDto, VendaPagamentoDto, VendaTrocaDto } from '../api';
import { Car, User, DollarSign, Tag, CheckCircle, AlertTriangle, CreditCard, PlusCircle, Trash2, Layers } from 'lucide-react';
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

  // Pagamentos Dinâmicos
  const [pagamentos, setPagamentos] = useState<VendaPagamentoDto[]>([]);
  const [novoPagamentoTipo, setNovoPagamentoTipo] = useState(2); // 2 = PIX padrão
  const [novoPagamentoValor, setNovoPagamentoValor] = useState('');

  // Estados específicos para Financiamento
  const [financBanco, setFinancBanco] = useState('Banco Bradesco (237)');
  const [financModalidade, setFinancModalidade] = useState('CDC');
  const [financParcelas, setFinancParcelas] = useState(36);
  const [financTaxaJuros, setFinancTaxaJuros] = useState('');
  const [financNumContrato, setFinancNumContrato] = useState('');
  const [financEntrada, setFinancEntrada] = useState('');

  // Estados específicos para Cartão
  const [cartaoBandeira, setCartaoBandeira] = useState('Visa');
  const [cartaoTipo, setCartaoTipo] = useState<'credito' | 'debito'>('credito');
  const [cartaoParcelas, setCartaoParcelas] = useState(1);
  const [cartaoNumAutorizacao, setCartaoNumAutorizacao] = useState('');
  const [cartaoTaxaAdm, setCartaoTaxaAdm] = useState('');
  const [cartaoMaquina, setCartaoMaquina] = useState('PagSeguro');

  // Estados específicos para Cheque
  const [modoCheque, setModoCheque] = useState<'unico' | 'multiplo'>('unico');
  const [chequeBanco, setChequeBanco] = useState('Banco Itaú (341)');
  const [chequeAgencia, setChequeAgencia] = useState('');
  const [chequeConta, setChequeConta] = useState('');
  const [chequeNumero, setChequeNumero] = useState('');
  const [chequeBomPara, setChequeBomPara] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [chequeEmitente, setChequeEmitente] = useState('');

  // Múltiplos Cheques (Parcelamento)
  const [multiQtd, setMultiQtd] = useState(3);
  const [multiValorTotal, setMultiValorTotal] = useState('');
  const [multiBanco, setMultiBanco] = useState('Banco Itaú (341)');
  const [multiAgencia, setMultiAgencia] = useState('');
  const [multiConta, setMultiConta] = useState('');
  const [multiNumeroInicial, setMultiNumeroInicial] = useState('001001');
  const [multiPrimeiroVenc, setMultiPrimeiroVenc] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [multiIntervaloDias, setMultiIntervaloDias] = useState(30);
  const [multiEmitente, setMultiEmitente] = useState('');

  // Trocas Dinâmicas
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

  const addChequeUnico = () => {
    const val = Number(novoPagamentoValor);
    if (val <= 0) return;
    const cliNome = clientes.find(c => c.id === clienteId)?.nomeRazaoSocial || clientes.find(c => c.id === clienteId)?.nome || 'Cliente';

    setPagamentos([
      ...pagamentos,
      {
        tipoPagamento: 5,
        valor: val,
        banco: chequeBanco,
        agencia: chequeAgencia,
        conta: chequeConta,
        numeroCheque: chequeNumero || `CHQ-${Math.floor(100000 + Math.random() * 900000)}`,
        dataBomPara: chequeBomPara ? new Date(`${chequeBomPara}T12:00:00Z`).toISOString() : new Date().toISOString(),
        emitente: chequeEmitente || cliNome
      }
    ]);
    setNovoPagamentoValor('');
    setChequeNumero('');
    setChequeEmitente('');
  };

  const addMultiplosCheques = () => {
    const total = Number(multiValorTotal);
    const qtd = Number(multiQtd);
    if (total <= 0 || qtd <= 0) return;

    const valorParcela = Math.round((total / qtd) * 100) / 100;
    const diffCentavos = Math.round((total - (valorParcela * qtd)) * 100) / 100;

    const baseNum = parseInt(multiNumeroInicial.replace(/\D/g, '') || '1001', 10);
    const novosCheques: VendaPagamentoDto[] = [];
    const baseDate = new Date(`${multiPrimeiroVenc}T12:00:00Z`);
    const cliNome = clientes.find(c => c.id === clienteId)?.nomeRazaoSocial || clientes.find(c => c.id === clienteId)?.nome || 'Cliente';

    for (let i = 0; i < qtd; i++) {
      const dataParcela = new Date(baseDate);
      dataParcela.setDate(baseDate.getDate() + (i * multiIntervaloDias));

      const valAtual = (i === qtd - 1) ? valorParcela + diffCentavos : valorParcela;
      const numChequeStr = String(baseNum + i).padStart(multiNumeroInicial.length > 4 ? multiNumeroInicial.length : 6, '0');

      novosCheques.push({
        tipoPagamento: 5,
        valor: valAtual,
        banco: multiBanco,
        agencia: multiAgencia,
        conta: multiConta,
        numeroCheque: numChequeStr,
        dataBomPara: dataParcela.toISOString(),
        emitente: multiEmitente || cliNome
      });
    }

    setPagamentos([...pagamentos, ...novosCheques]);
    setMultiValorTotal('');
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
      usuarioId: user?.id || '11111111-1111-1111-1111-111111111111', 
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
      let msg = err.message || 'Erro ao realizar venda';
      try {
        const parsed = JSON.parse(msg);
        if (parsed.erro) msg = parsed.erro;
        else if (parsed.message) msg = parsed.message;
      } catch {}
      setErrorMsg(`Erro: ${msg}`);
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: '32px' }}>Carregando terminal de vendas...</div>;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', padding: '24px' }}>
      <header className="page-header" style={{ marginBottom: '40px' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <DollarSign size={28} color="var(--color-success)" /> Terminal de Vendas
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
            <div style={{ padding: '20px', background: 'rgba(0,0,0,0.25)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <h4 style={{ margin: 0, fontSize: '15px', color: 'var(--color-gray-100)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CreditCard size={18} color="var(--color-primary)" /> Adicionar Forma de Pagamento
                    </h4>
                    {diferenca > 0 && (
                        <span style={{ fontSize: '0.78rem', color: 'var(--color-warning)', background: 'rgba(234, 179, 8, 0.1)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(234, 179, 8, 0.2)' }}>
                            Faltando: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(diferenca)}
                        </span>
                    )}
                </div>

                <div style={{ marginBottom: '14px' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--color-gray-400)', display: 'block', marginBottom: '6px' }}>Tipo de Pagamento</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
                        {[
                            { id: 2, label: '⚡ PIX' },
                            { id: 1, label: '💵 Dinheiro' },
                            { id: 5, label: '📑 Cheque(s)' },
                            { id: 6, label: '🏦 Financiamento' },
                            { id: 4, label: '💳 Cartão' }
                        ].map(t => (
                            <button
                                key={t.id}
                                type="button"
                                onClick={() => setNovoPagamentoTipo(t.id)}
                                style={{
                                    padding: '8px 4px',
                                    fontSize: '0.8rem',
                                    fontWeight: novoPagamentoTipo === t.id ? 600 : 400,
                                    borderRadius: '6px',
                                    border: novoPagamentoTipo === t.id ? '1px solid var(--color-primary)' : '1px solid rgba(255,255,255,0.08)',
                                    background: novoPagamentoTipo === t.id ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255,255,255,0.03)',
                                    color: novoPagamentoTipo === t.id ? '#60a5fa' : 'var(--color-gray-300)',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s',
                                    whiteSpace: 'nowrap',
                                    textAlign: 'center'
                                }}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 💰 PIX ou Dinheiro em Espécie: campo simples */}
                {(novoPagamentoTipo === 1 || novoPagamentoTipo === 2) && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 44px', gap: '8px', alignItems: 'center', marginBottom: '16px' }}>
                        <input
                            className="form-input"
                            style={{ height: '42px' }}
                            type="number"
                            placeholder={novoPagamentoTipo === 2 ? 'Valor recebido via PIX (R$)' : 'Valor em Dinheiro espécie (R$)'}
                            value={novoPagamentoValor}
                            onChange={e => setNovoPagamentoValor(e.target.value)}
                        />
                        {diferenca > 0 && (
                            <button
                                type="button"
                                onClick={() => setNovoPagamentoValor(String(Math.max(0, diferenca)))}
                                style={{ height: '42px', padding: '0 10px', fontSize: '0.78rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'var(--color-gray-200)', borderRadius: '8px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                            >
                                Usar Restante
                            </button>
                        )}
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={addPagamento}
                            style={{ height: '42px', width: '44px', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}
                            title="Adicionar Pagamento"
                        >
                            <PlusCircle size={20}/>
                        </button>
                    </div>
                )}

                {/* 💳 CARTÃO — Painel Detalhado */}
                {novoPagamentoTipo === 4 && (
                    <div style={{ background: 'rgba(99, 102, 241, 0.06)', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', paddingBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                            <span style={{ fontSize: '1.1rem' }}>💳</span>
                            <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#a5b4fc' }}>Dados do Cartão</span>
                        </div>

                        {/* Crédito / Débito */}
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                            {(['credito', 'debito'] as const).map(tipo => (
                                <button
                                    key={tipo}
                                    type="button"
                                    onClick={() => { setCartaoTipo(tipo); if (tipo === 'debito') setCartaoParcelas(1); }}
                                    style={{
                                        flex: 1, padding: '8px', fontSize: '0.85rem', fontWeight: cartaoTipo === tipo ? 700 : 400,
                                        borderRadius: '8px', cursor: 'pointer', transition: 'all 0.15s',
                                        border: cartaoTipo === tipo ? '2px solid #818cf8' : '1px solid rgba(255,255,255,0.1)',
                                        background: cartaoTipo === tipo ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.03)',
                                        color: cartaoTipo === tipo ? '#c7d2fe' : 'var(--color-gray-400)',
                                    }}
                                >
                                    {tipo === 'credito' ? '💳 Crédito' : '🏧 Débito'}
                                </button>
                            ))}
                        </div>

                        {/* Bandeira + Máquina */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                            <div>
                                <label style={{ fontSize: '0.75rem', color: 'var(--color-gray-400)', display: 'block', marginBottom: '4px' }}>Bandeira do Cartão*</label>
                                <select className="form-input" style={{ height: '38px', fontSize: '0.85rem', background: 'var(--glass-bg)', color: 'var(--color-gray-100)' }} value={cartaoBandeira} onChange={e => setCartaoBandeira(e.target.value)}>
                                    <option value="Visa">Visa</option>
                                    <option value="Mastercard">Mastercard</option>
                                    <option value="Elo">Elo</option>
                                    <option value="American Express">American Express</option>
                                    <option value="Hipercard">Hipercard</option>
                                    <option value="Cabal">Cabal</option>
                                    <option value="Diners">Diners Club</option>
                                    <option value="Discover">Discover</option>
                                    <option value="PIX Maquininha">PIX Maquininha</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.75rem', color: 'var(--color-gray-400)', display: 'block', marginBottom: '4px' }}>Maquininha / Operadora</label>
                                <select className="form-input" style={{ height: '38px', fontSize: '0.85rem', background: 'var(--glass-bg)', color: 'var(--color-gray-100)' }} value={cartaoMaquina} onChange={e => setCartaoMaquina(e.target.value)}>
                                    <option value="PagSeguro">PagSeguro</option>
                                    <option value="Cielo">Cielo</option>
                                    <option value="Rede">Rede (Itaú)</option>
                                    <option value="Stone">Stone</option>
                                    <option value="Getnet">Getnet (Santander)</option>
                                    <option value="Mercado Pago">Mercado Pago</option>
                                    <option value="InfinitePay">InfinitePay</option>
                                    <option value="SumUp">SumUp</option>
                                    <option value="Ton">Ton</option>
                                    <option value="Vero">Vero</option>
                                    <option value="Outra">Outra</option>
                                </select>
                            </div>
                        </div>

                        {/* Parcelas (só crédito) + Taxa Adm */}
                        <div style={{ display: 'grid', gridTemplateColumns: cartaoTipo === 'credito' ? '1fr 1fr' : '1fr', gap: '10px', marginBottom: '10px' }}>
                            {cartaoTipo === 'credito' && (
                                <div>
                                    <label style={{ fontSize: '0.75rem', color: 'var(--color-gray-400)', display: 'block', marginBottom: '4px' }}>Parcelas no Crédito</label>
                                    <select className="form-input" style={{ height: '38px', fontSize: '0.85rem', background: 'var(--glass-bg)', color: 'var(--color-gray-100)' }} value={cartaoParcelas} onChange={e => setCartaoParcelas(Number(e.target.value))}>
                                        <option value={1}>1x (à vista no crédito)</option>
                                        {[2,3,4,5,6,7,8,9,10,11,12].map(p => (
                                            <option key={p} value={p}>{p}x</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <div>
                                <label style={{ fontSize: '0.75rem', color: 'var(--color-gray-400)', display: 'block', marginBottom: '4px' }}>Taxa Administrativa (%)</label>
                                <input className="form-input" style={{ height: '38px', fontSize: '0.85rem' }} type="number" step="0.01" placeholder="Ex: 2.5" value={cartaoTaxaAdm} onChange={e => setCartaoTaxaAdm(e.target.value)} />
                            </div>
                        </div>

                        {/* Valor + Nº Autorização */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                            <div>
                                <label style={{ fontSize: '0.75rem', color: 'var(--color-gray-400)', display: 'block', marginBottom: '4px' }}>Valor (R$)*</label>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    <input className="form-input" style={{ height: '38px', fontSize: '0.85rem' }} type="number" placeholder="Ex: 30000" value={novoPagamentoValor} onChange={e => setNovoPagamentoValor(e.target.value)} />
                                    {diferenca > 0 && (
                                        <button type="button" onClick={() => setNovoPagamentoValor(String(Math.max(0, diferenca)))}
                                            style={{ height: '38px', padding: '0 8px', fontSize: '0.72rem', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', color: '#a5b4fc', borderRadius: '6px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                            Restante
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.75rem', color: 'var(--color-gray-400)', display: 'block', marginBottom: '4px' }}>Nº de Autorização / NSU</label>
                                <input className="form-input" style={{ height: '38px', fontSize: '0.85rem' }} type="text" placeholder="Ex: 123456" value={cartaoNumAutorizacao} onChange={e => setCartaoNumAutorizacao(e.target.value)} />
                            </div>
                        </div>

                        {/* Preview */}
                        {novoPagamentoValor && (
                            <div style={{ padding: '8px 12px', background: 'rgba(99,102,241,0.1)', border: '1px dashed rgba(99,102,241,0.35)', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <span style={{ fontSize: '0.8rem', color: 'var(--color-gray-300)' }}>
                                    {cartaoBandeira} • {cartaoMaquina} • {cartaoTipo === 'credito' ? `${cartaoParcelas}x crédito` : 'Débito'}
                                    {cartaoTaxaAdm && ` • Taxa ${cartaoTaxaAdm}%`}
                                </span>
                                <strong style={{ color: '#a5b4fc', fontSize: '0.9rem' }}>
                                    {cartaoTipo === 'credito' && cartaoParcelas > 1
                                        ? `${cartaoParcelas}x de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(novoPagamentoValor) / cartaoParcelas)}`
                                        : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(novoPagamentoValor))
                                    }
                                </strong>
                            </div>
                        )}

                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => {
                                const val = Number(novoPagamentoValor);
                                if (val <= 0) return;
                                setPagamentos([...pagamentos, {
                                    tipoPagamento: cartaoTipo === 'credito' ? 3 : 4,
                                    valor: val,
                                    bandeira: cartaoBandeira,
                                    tipoCartao: cartaoTipo,
                                    maquininha: cartaoMaquina,
                                    parcelas: cartaoTipo === 'credito' ? cartaoParcelas : 1,
                                    taxaAdm: cartaoTaxaAdm ? Number(cartaoTaxaAdm) : undefined,
                                    numeroAutorizacao: cartaoNumAutorizacao || undefined,
                                }]);
                                setNovoPagamentoValor('');
                                setCartaoNumAutorizacao('');
                            }}
                            style={{ width: '100%', height: '38px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'rgba(99,102,241,0.8)' }}
                        >
                            <PlusCircle size={16} /> Registrar Pagamento no Cartão
                        </button>
                    </div>
                )}


                {/* 🏦 FINANCIAMENTO — Painel Detalhado */}
                {novoPagamentoTipo === 6 && (
                    <div style={{ background: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', paddingBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                            <span style={{ fontSize: '1.1rem' }}>🏦</span>
                            <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#34d399' }}>Dados do Financiamento</span>
                        </div>

                        {/* Linha 1: Banco + Modalidade */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                            <div>
                                <label style={{ fontSize: '0.75rem', color: 'var(--color-gray-400)', display: 'block', marginBottom: '4px' }}>Banco / Financeira*</label>
                                <select className="form-input" style={{ height: '38px', fontSize: '0.85rem' }} value={financBanco} onChange={e => setFinancBanco(e.target.value)}>
                                    <optgroup label="Bancos Tradicionais">
                                        <option value="Banco Bradesco (237)">Banco Bradesco (237)</option>
                                        <option value="Banco Itaú (341)">Banco Itaú / Itaú Unibanco (341)</option>
                                        <option value="Banco do Brasil (001)">Banco do Brasil (001)</option>
                                        <option value="Santander (033)">Santander (033)</option>
                                        <option value="Caixa Econômica (104)">Caixa Econômica Federal (104)</option>
                                    </optgroup>
                                    <optgroup label="Financeiras de Veículos">
                                        <option value="BV Financeira (655)">BV Financeira / BV Bank (655)</option>
                                        <option value="Banco Pan (623)">Banco Pan (623)</option>
                                        <option value="Banco Votorantim (655)">Banco Votorantim (655)</option>
                                        <option value="Santander Financiamentos">Santander Financiamentos</option>
                                        <option value="Bradesco Financiamentos">Bradesco Financiamentos</option>
                                        <option value="Itaú Financiamentos">Itaú Financiamentos</option>
                                        <option value="Creditas">Creditas</option>
                                        <option value="Omni Banco (613)">Omni Banco (613)</option>
                                        <option value="Banco Safra (422)">Banco Safra (422)</option>
                                    </optgroup>
                                    <optgroup label="Cooperativas">
                                        <option value="Sicredi (748)">Sicredi (748)</option>
                                        <option value="Sicoob (756)">Sicoob (756)</option>
                                        <option value="Cresol (133)">Cresol (133)</option>
                                    </optgroup>
                                    <option value="Outro">Outra Instituição</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.75rem', color: 'var(--color-gray-400)', display: 'block', marginBottom: '4px' }}>Modalidade de Crédito*</label>
                                <select className="form-input" style={{ height: '38px', fontSize: '0.85rem' }} value={financModalidade} onChange={e => setFinancModalidade(e.target.value)}>
                                    <option value="CDC">CDC — Crédito Direto ao Consumidor</option>
                                    <option value="Leasing">Leasing (Arrendamento Mercantil)</option>
                                    <option value="Consórcio">Consórcio</option>
                                    <option value="PF">PF — Pessoa Física (Crédito Pessoal)</option>
                                    <option value="FINAME">FINAME / BNDES</option>
                                </select>
                            </div>
                        </div>

                        {/* Linha 2: Parcelas + Taxa de Juros + Valor Entrada */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                            <div>
                                <label style={{ fontSize: '0.75rem', color: 'var(--color-gray-400)', display: 'block', marginBottom: '4px' }}>Nº de Parcelas*</label>
                                <select className="form-input" style={{ height: '38px', fontSize: '0.85rem' }} value={financParcelas} onChange={e => setFinancParcelas(Number(e.target.value))}>
                                    {[6, 12, 18, 24, 30, 36, 42, 48, 60, 72].map(p => (
                                        <option key={p} value={p}>{p}x meses</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.75rem', color: 'var(--color-gray-400)', display: 'block', marginBottom: '4px' }}>Taxa de Juros (% a.m.)</label>
                                <input className="form-input" style={{ height: '38px', fontSize: '0.85rem' }} type="number" step="0.01" placeholder="Ex: 1.49" value={financTaxaJuros} onChange={e => setFinancTaxaJuros(e.target.value)} />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.75rem', color: 'var(--color-gray-400)', display: 'block', marginBottom: '4px' }}>Valor de Entrada (R$)</label>
                                <input className="form-input" style={{ height: '38px', fontSize: '0.85rem' }} type="number" placeholder="Ex: 15000" value={financEntrada} onChange={e => setFinancEntrada(e.target.value)} />
                            </div>
                        </div>

                        {/* Linha 3: Valor Financiado + Nº Contrato */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                            <div>
                                <label style={{ fontSize: '0.75rem', color: 'var(--color-gray-400)', display: 'block', marginBottom: '4px' }}>Valor Financiado (R$)*</label>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    <input
                                        className="form-input"
                                        style={{ height: '38px', fontSize: '0.85rem' }}
                                        type="number"
                                        placeholder="Ex: 60000"
                                        value={novoPagamentoValor}
                                        onChange={e => setNovoPagamentoValor(e.target.value)}
                                    />
                                    {diferenca > 0 && (
                                        <button type="button" onClick={() => setNovoPagamentoValor(String(Math.max(0, diferenca)))}
                                            style={{ height: '38px', padding: '0 8px', fontSize: '0.72rem', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399', borderRadius: '6px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                            Restante
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.75rem', color: 'var(--color-gray-400)', display: 'block', marginBottom: '4px' }}>Nº do Contrato / Proposta</label>
                                <input className="form-input" style={{ height: '38px', fontSize: '0.85rem' }} type="text" placeholder="Ex: FIN-2024-00123" value={financNumContrato} onChange={e => setFinancNumContrato(e.target.value)} />
                            </div>
                        </div>

                        {/* Preview parcela estimada */}
                        {novoPagamentoValor && financParcelas && (
                            <div style={{ padding: '8px 12px', background: 'rgba(16,185,129,0.1)', border: '1px dashed rgba(16,185,129,0.3)', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <span style={{ fontSize: '0.8rem', color: 'var(--color-gray-300)' }}>
                                    {financBanco} • {financModalidade} • {financParcelas}x
                                    {financTaxaJuros && ` • ${financTaxaJuros}% a.m.`}
                                </span>
                                <strong style={{ color: '#34d399', fontSize: '0.9rem' }}>
                                    ≈ {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(novoPagamentoValor) / financParcelas)}/mês
                                </strong>
                            </div>
                        )}

                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => {
                                const val = Number(novoPagamentoValor);
                                if (val <= 0) return;
                                setPagamentos([...pagamentos, {
                                    tipoPagamento: 6,
                                    valor: val,
                                    bancoFinanciamento: financBanco,
                                    modalidadeFinanciamento: financModalidade,
                                    parcelas: financParcelas,
                                    taxaJuros: financTaxaJuros ? Number(financTaxaJuros) : undefined,
                                    valorEntrada: financEntrada ? Number(financEntrada) : undefined,
                                    numeroContrato: financNumContrato || undefined,
                                }]);
                                setNovoPagamentoValor('');
                                setFinancNumContrato('');
                            }}
                            style={{ width: '100%', height: '38px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                        >
                            <PlusCircle size={16} /> Registrar Financiamento
                        </button>
                    </div>
                )}


                {/* Se for Cheque: Opção Único ou Múltiplos Cheques (Parcelamento) */}
                {novoPagamentoTipo === 5 && (
                    <div style={{ background: 'rgba(30, 41, 59, 0.5)', border: '1px solid rgba(59, 130, 246, 0.25)', borderRadius: '10px', padding: '14px', marginBottom: '16px' }}>
                        {/* Seletor de Modo do Cheque */}
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                            <button
                                type="button"
                                onClick={() => setModoCheque('unico')}
                                style={{
                                    flex: 1,
                                    padding: '8px',
                                    fontSize: '0.82rem',
                                    fontWeight: modoCheque === 'unico' ? 600 : 400,
                                    borderRadius: '6px',
                                    border: modoCheque === 'unico' ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.08)',
                                    background: modoCheque === 'unico' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                                    color: modoCheque === 'unico' ? '#38bdf8' : 'var(--color-gray-400)',
                                    cursor: 'pointer'
                                }}
                            >
                                📄 Cheque Avulso (1 Folha)
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setModoCheque('multiplo');
                                    if (!multiValorTotal && diferenca > 0) setMultiValorTotal(String(diferenca));
                                }}
                                style={{
                                    flex: 1,
                                    padding: '8px',
                                    fontSize: '0.82rem',
                                    fontWeight: modoCheque === 'multiplo' ? 600 : 400,
                                    borderRadius: '6px',
                                    border: modoCheque === 'multiplo' ? '1px solid #a855f7' : '1px solid rgba(255,255,255,0.08)',
                                    background: modoCheque === 'multiplo' ? 'rgba(168, 85, 247, 0.15)' : 'transparent',
                                    color: modoCheque === 'multiplo' ? '#c084fc' : 'var(--color-gray-400)',
                                    cursor: 'pointer'
                                }}
                            >
                                📚 Vários Cheques (Parcelamento em Lote)
                            </button>
                        </div>

                        {/* Cheque Avulso */}
                        {modoCheque === 'unico' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px' }}>
                                    <div>
                                        <label style={{ fontSize: '0.75rem', color: 'var(--color-gray-400)', display: 'block', marginBottom: '4px' }}>Valor do Cheque (R$)*</label>
                                        <input
                                            className="form-input"
                                            style={{ height: '38px' }}
                                            type="number"
                                            placeholder="Ex: 15000"
                                            value={novoPagamentoValor}
                                            onChange={e => setNovoPagamentoValor(e.target.value)}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                        {diferenca > 0 && (
                                            <button
                                                type="button"
                                                onClick={() => setNovoPagamentoValor(String(Math.max(0, diferenca)))}
                                                style={{ height: '38px', padding: '0 10px', fontSize: '0.75rem', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'var(--color-gray-200)', borderRadius: '6px', cursor: 'pointer' }}
                                            >
                                                Usar Restante
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '8px' }}>
                                    <div>
                                        <label style={{ fontSize: '0.75rem', color: 'var(--color-gray-400)', display: 'block', marginBottom: '4px' }}>Banco</label>
                                        <select
                                            className="form-input"
                                            style={{ height: '38px', fontSize: '0.85rem' }}
                                            value={chequeBanco}
                                            onChange={e => setChequeBanco(e.target.value)}
                                        >
                                            <option value="Banco Itaú (341)">Banco Itaú (341)</option>
                                            <option value="Banco Bradesco (237)">Banco Bradesco (237)</option>
                                            <option value="Banco do Brasil (001)">Banco do Brasil (001)</option>
                                            <option value="Santander (033)">Santander (033)</option>
                                            <option value="Caixa Econômica (104)">Caixa Econômica (104)</option>
                                            <option value="Sicredi (748)">Sicredi (748)</option>
                                            <option value="Sicoob (756)">Sicoob (756)</option>
                                            <option value="Banco Safra (422)">Banco Safra (422)</option>
                                            <option value="Outro Banco">Outro Banco</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.75rem', color: 'var(--color-gray-400)', display: 'block', marginBottom: '4px' }}>Bom Para (Vencimento)*</label>
                                        <input
                                            className="form-input"
                                            style={{ height: '38px', fontSize: '0.85rem' }}
                                            type="date"
                                            value={chequeBomPara}
                                            onChange={e => setChequeBomPara(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                                    <div>
                                        <label style={{ fontSize: '0.75rem', color: 'var(--color-gray-400)', display: 'block', marginBottom: '4px' }}>Nº Cheque</label>
                                        <input
                                            className="form-input"
                                            style={{ height: '38px', fontSize: '0.85rem' }}
                                            type="text"
                                            placeholder="Ex: 004128"
                                            value={chequeNumero}
                                            onChange={e => setChequeNumero(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.75rem', color: 'var(--color-gray-400)', display: 'block', marginBottom: '4px' }}>Agência</label>
                                        <input
                                            className="form-input"
                                            style={{ height: '38px', fontSize: '0.85rem' }}
                                            type="text"
                                            placeholder="Ex: 1234"
                                            value={chequeAgencia}
                                            onChange={e => setChequeAgencia(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.75rem', color: 'var(--color-gray-400)', display: 'block', marginBottom: '4px' }}>Conta Corrente</label>
                                        <input
                                            className="form-input"
                                            style={{ height: '38px', fontSize: '0.85rem' }}
                                            type="text"
                                            placeholder="Ex: 56789-0"
                                            value={chequeConta}
                                            onChange={e => setChequeConta(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label style={{ fontSize: '0.75rem', color: 'var(--color-gray-400)', display: 'block', marginBottom: '4px' }}>Titular / Emitente</label>
                                    <input
                                        className="form-input"
                                        style={{ height: '38px', fontSize: '0.85rem' }}
                                        type="text"
                                        placeholder="Nome do Emitente do Cheque (ou vazio p/ cliente)"
                                        value={chequeEmitente}
                                        onChange={e => setChequeEmitente(e.target.value)}
                                    />
                                </div>

                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={addChequeUnico}
                                    style={{ width: '100%', marginTop: '4px', height: '38px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                >
                                    <PlusCircle size={16} /> Adicionar Cheque
                                </button>
                            </div>
                        )}

                        {/* Múltiplos Cheques (Parcelamento) */}
                        {modoCheque === 'multiplo' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <div style={{ padding: '8px 12px', background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.25)', borderRadius: '6px', fontSize: '0.8rem', color: '#e9d5ff' }}>
                                    ✨ <strong>Parcelamento Automático:</strong> Os cheques serão gerados com numeração sequencial e datas pré-datadas calculadas automaticamente.
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                    <div>
                                        <label style={{ fontSize: '0.75rem', color: 'var(--color-gray-400)', display: 'block', marginBottom: '4px' }}>Qtd. de Cheques (Parcelas)*</label>
                                        <select
                                            className="form-input"
                                            style={{ height: '38px', fontSize: '0.85rem' }}
                                            value={multiQtd}
                                            onChange={e => setMultiQtd(Number(e.target.value))}
                                        >
                                            {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 18, 24].map(q => (
                                                <option key={q} value={q}>{q} folhas (Parcelas)</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                            <label style={{ fontSize: '0.75rem', color: 'var(--color-gray-400)' }}>Valor Total do Lote (R$)*</label>
                                            {diferenca > 0 && (
                                                <span
                                                    onClick={() => setMultiValorTotal(String(Math.max(0, diferenca)))}
                                                    style={{ fontSize: '0.7rem', color: '#a855f7', cursor: 'pointer', textDecoration: 'underline' }}
                                                >
                                                    Usar Restante
                                                </span>
                                            )}
                                        </div>
                                        <input
                                            className="form-input"
                                            style={{ height: '38px', fontSize: '0.85rem' }}
                                            type="number"
                                            placeholder="Ex: 30000"
                                            value={multiValorTotal}
                                            onChange={e => setMultiValorTotal(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Preview do Valor de Cada Parcela */}
                                {Number(multiValorTotal) > 0 && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', border: '1px dashed rgba(168, 85, 247, 0.3)' }}>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--color-gray-300)' }}>Valor por Folha:</span>
                                        <strong style={{ color: '#c084fc', fontSize: '0.92rem' }}>
                                            {multiQtd}x de {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(multiValorTotal) / multiQtd)}
                                        </strong>
                                    </div>
                                )}

                                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '8px' }}>
                                    <div>
                                        <label style={{ fontSize: '0.75rem', color: 'var(--color-gray-400)', display: 'block', marginBottom: '4px' }}>1º Vencimento (1º Cheque)*</label>
                                        <input
                                            className="form-input"
                                            style={{ height: '38px', fontSize: '0.85rem' }}
                                            type="date"
                                            value={multiPrimeiroVenc}
                                            onChange={e => setMultiPrimeiroVenc(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.75rem', color: 'var(--color-gray-400)', display: 'block', marginBottom: '4px' }}>Intervalo entre Cheques</label>
                                        <select
                                            className="form-input"
                                            style={{ height: '38px', fontSize: '0.85rem' }}
                                            value={multiIntervaloDias}
                                            onChange={e => setMultiIntervaloDias(Number(e.target.value))}
                                        >
                                            <option value={30}>A cada 30 dias (Mensal)</option>
                                            <option value={15}>A cada 15 dias (Quinzenal)</option>
                                            <option value={60}>A cada 60 dias (Bimestral)</option>
                                        </select>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '8px' }}>
                                    <div>
                                        <label style={{ fontSize: '0.75rem', color: 'var(--color-gray-400)', display: 'block', marginBottom: '4px' }}>Banco</label>
                                        <select
                                            className="form-input"
                                            style={{ height: '38px', fontSize: '0.85rem' }}
                                            value={multiBanco}
                                            onChange={e => setMultiBanco(e.target.value)}
                                        >
                                            <option value="Banco Itaú (341)">Banco Itaú (341)</option>
                                            <option value="Banco Bradesco (237)">Banco Bradesco (237)</option>
                                            <option value="Banco do Brasil (001)">Banco do Brasil (001)</option>
                                            <option value="Santander (033)">Santander (033)</option>
                                            <option value="Caixa Econômica (104)">Caixa Econômica (104)</option>
                                            <option value="Sicredi (748)">Sicredi (748)</option>
                                            <option value="Sicoob (756)">Sicoob (756)</option>
                                            <option value="Banco Safra (422)">Banco Safra (422)</option>
                                            <option value="Outro Banco">Outro Banco</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.75rem', color: 'var(--color-gray-400)', display: 'block', marginBottom: '4px' }}>Nº Inicial do Cheque</label>
                                        <input
                                            className="form-input"
                                            style={{ height: '38px', fontSize: '0.85rem' }}
                                            type="text"
                                            placeholder="Ex: 001001"
                                            value={multiNumeroInicial}
                                            onChange={e => setMultiNumeroInicial(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                    <div>
                                        <label style={{ fontSize: '0.75rem', color: 'var(--color-gray-400)', display: 'block', marginBottom: '4px' }}>Agência</label>
                                        <input
                                            className="form-input"
                                            style={{ height: '38px', fontSize: '0.85rem' }}
                                            type="text"
                                            placeholder="Ex: 1234"
                                            value={multiAgencia}
                                            onChange={e => setMultiAgencia(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.75rem', color: 'var(--color-gray-400)', display: 'block', marginBottom: '4px' }}>Conta Corrente</label>
                                        <input
                                            className="form-input"
                                            style={{ height: '38px', fontSize: '0.85rem' }}
                                            type="text"
                                            placeholder="Ex: 56789-0"
                                            value={multiConta}
                                            onChange={e => setMultiConta(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label style={{ fontSize: '0.75rem', color: 'var(--color-gray-400)', display: 'block', marginBottom: '4px' }}>Titular / Emitente</label>
                                    <input
                                        className="form-input"
                                        style={{ height: '38px', fontSize: '0.85rem' }}
                                        type="text"
                                        placeholder="Nome do Emitente dos Cheques"
                                        value={multiEmitente}
                                        onChange={e => setMultiEmitente(e.target.value)}
                                    />
                                </div>

                                <button
                                    type="button"
                                    onClick={addMultiplosCheques}
                                    style={{
                                        width: '100%',
                                        marginTop: '4px',
                                        height: '40px',
                                        fontSize: '0.88rem',
                                        fontWeight: 600,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)'
                                    }}
                                >
                                    <Layers size={18} /> Gerar e Incluir Lote de {multiQtd} Cheques
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Lista de Pagamentos Adicionados */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {pagamentos.map((p, idx) => (
                        <div
                            key={idx}
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '10px 14px',
                                background: p.tipoPagamento === 5 ? 'rgba(168, 85, 247, 0.08)' : 'rgba(255,255,255,0.04)',
                                border: p.tipoPagamento === 5 ? '1px solid rgba(168, 85, 247, 0.25)' : '1px solid rgba(255,255,255,0.06)',
                                borderRadius: '8px'
                            }}
                        >
                            {p.tipoPagamento === 5 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span style={{ fontSize: '0.9rem' }}>📑</span>
                                        <strong style={{ fontSize: '0.88rem', color: '#e9d5ff' }}>
                                            Cheque Nº {p.numeroCheque || 'S/N'}
                                        </strong>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--color-gray-400)', background: 'rgba(255,255,255,0.06)', padding: '1px 6px', borderRadius: '4px' }}>
                                            {p.banco || 'Banco'}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '0.76rem', color: 'var(--color-gray-400)' }}>
                                        Bom para: <strong style={{ color: '#38bdf8' }}>{p.dataBomPara ? new Date(p.dataBomPara).toLocaleDateString('pt-BR') : 'À Vista'}</strong>
                                        {p.emitente && <span> • Titular: {p.emitente}</span>}
                                        {p.agencia && <span> • Ag: {p.agencia} / CC: {p.conta}</span>}
                                    </div>
                                </div>
                            ) : p.tipoPagamento === 6 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span style={{ fontSize: '0.9rem' }}>🏦</span>
                                        <strong style={{ fontSize: '0.88rem', color: '#34d399' }}>
                                            Financiamento {p.parcelas ? `(${p.parcelas}x)` : ''}
                                        </strong>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--color-gray-400)', background: 'rgba(255,255,255,0.06)', padding: '1px 6px', borderRadius: '4px' }}>
                                            {p.bancoFinanciamento || 'Financeira'}
                                        </span>
                                    </div>
                                    {p.numeroContrato && <div style={{ fontSize: '0.76rem', color: 'var(--color-gray-400)' }}>Contrato: {p.numeroContrato}</div>}
                                </div>
                            ) : (p.tipoPagamento === 3 || p.tipoPagamento === 4) ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span style={{ fontSize: '0.9rem' }}>💳</span>
                                        <strong style={{ fontSize: '0.88rem', color: '#c7d2fe' }}>
                                            Cartão {p.tipoPagamento === 3 ? `Crédito ${p.parcelas ? `(${p.parcelas}x)` : ''}` : 'Débito'}
                                        </strong>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--color-gray-400)', background: 'rgba(255,255,255,0.06)', padding: '1px 6px', borderRadius: '4px' }}>
                                            {p.bandeira || 'Cartão'}
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span>{p.tipoPagamento === 2 ? '⚡' : '💵'}</span>
                                    <span style={{ fontWeight: 500, fontSize: '0.88rem' }}>
                                        {p.tipoPagamento === 2 ? 'PIX' : 'Dinheiro em Espécie'}
                                    </span>
                                </div>
                            )}

                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                <strong style={{ color: 'var(--color-success)', fontSize: '0.95rem' }}>
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.valor)}
                                </strong>
                                <button
                                    type="button"
                                    onClick={() => removePagamento(idx)}
                                    style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', display: 'flex', padding: '4px' }}
                                    title="Remover"
                                >
                                    <Trash2 size={16}/>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
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

            {/* Comissão do Operador / Vendedor */}
            <div style={{ marginTop: '16px', padding: '12px 14px', background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.25)', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', color: 'var(--color-gray-300)' }}>
                <span>Operador: <strong>{user?.nome || 'Consultor'}</strong></span>
                <span style={{ color: '#60a5fa', fontWeight: 600, background: 'rgba(59, 130, 246, 0.15)', padding: '2px 8px', borderRadius: '4px' }}>
                  {user?.comissaoPercent ?? 2}% comissão
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-gray-300)' }}>Sua Comissão Prevista:</span>
                <strong style={{ color: '#38bdf8', fontSize: '1.05rem' }}>
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((valorLiquido * (user?.comissaoPercent ?? 2)) / 100)}
                </strong>
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '20px' }}>
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
