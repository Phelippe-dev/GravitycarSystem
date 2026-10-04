import React, { useState, useEffect } from 'react';
import { 
  fetchRecibos, 
  emitirRecibo, 
  downloadReciboPdf, 
  verificarIntegridadeRecibo, 
  solicitarAssinaturaRecibo,
  fetchVeiculos,
  fetchClientes 
} from '../api';
import type { ReciboResumo, Veiculo, Cliente, EmitirReciboInput } from '../api';
import { 
  FileText, 
  Plus, 
  Download, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Send, 
  Search,
  Lock
} from 'lucide-react';

const RecibosDigitais: React.FC = () => {
  const [recibos, setRecibos] = useState<ReciboResumo[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<number>(0);

  // Modal Emissão
  const [modalEmitir, setModalEmitir] = useState(false);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [emitindo, setEmitindo] = useState(false);

  // Form State
  const [formTipo, setFormTipo] = useState<number>(1); // 1 = Venda, 2 = Sinal
  const [formVeiculoId, setFormVeiculoId] = useState('');
  const [formClienteId, setFormClienteId] = useState('');
  const [formComprador, setFormComprador] = useState({
    nome: '',
    cpfCnpj: '',
    rg: '',
    endereco: '',
    telefone: '',
    email: ''
  });
  const [formValorTotal, setFormValorTotal] = useState('');
  const [formValorRecebido, setFormValorRecebido] = useState('');
  const [formFormaPagamento, setFormFormaPagamento] = useState<number>(2); // Pix
  const [formDetalhesPagamento, setFormDetalhesPagamento] = useState('');
  const [formValidadeSinal, setFormValidadeSinal] = useState('7');
  const [formGarantiaDias, setFormGarantiaDias] = useState('90');
  const [formGarantiaKm, setFormGarantiaKm] = useState('3000');
  const [formObservacoes, setFormObservacoes] = useState('');

  // Modal Integridade
  const [modalIntegridade, setModalIntegridade] = useState<{ aberta: boolean; valida: boolean; mensagem: string; hash?: string } | null>(null);

  useEffect(() => {
    carregarRecibos();
  }, [filtroTipo]);

  const carregarRecibos = async () => {
    setLoading(true);
    const data = await fetchRecibos(filtroTipo > 0 ? filtroTipo : undefined);
    setRecibos(data);
    setLoading(false);
  };

  const abrirModalEmissao = async () => {
    setModalEmitir(true);
    const [veics, clis] = await Promise.all([fetchVeiculos(), fetchClientes()]);
    setVeiculos(veics.filter(v => v.status === 4 || v.status === 1)); // Disponíveis ou em avaliação
    setClientes(clis);
  };

  const handleClienteChange = (clienteId: string) => {
    setFormClienteId(clienteId);
    const cli = clientes.find(c => c.id === clienteId);
    if (cli) {
      setFormComprador({
        nome: cli.nome || cli.nomeRazaoSocial || '',
        cpfCnpj: cli.cpfCnpj || '',
        rg: '',
        endereco: cli.endereco ? `${cli.endereco}, ${cli.numero || ''} - ${cli.cidade || ''}/${cli.estado || ''}` : '',
        telefone: cli.celular || cli.telefone || '',
        email: cli.email || ''
      });
    }
  };

  const handleVeiculoChange = (veiculoId: string) => {
    setFormVeiculoId(veiculoId);
    const veic = veiculos.find(v => v.id === veiculoId);
    if (veic && veic.valorVenda) {
      setFormValorTotal(veic.valorVenda.toString());
      if (formTipo === 1) {
        setFormValorRecebido(veic.valorVenda.toString());
      }
    }
  };

  const handleEmitirSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formVeiculoId) {
      alert('Selecione um veículo para emitir o recibo.');
      return;
    }
    if (!formComprador.nome || !formComprador.cpfCnpj) {
      alert('Preencha ao menos Nome e CPF/CNPJ do comprador.');
      return;
    }

    setEmitindo(true);
    try {
      const valorTotalNum = parseFloat(formValorTotal) || 0;
      const valorRecebidoNum = parseFloat(formValorRecebido) || (formTipo === 1 ? valorTotalNum : 0);

      const payload: EmitirReciboInput = {
        tipo: formTipo,
        clienteId: formClienteId || undefined,
        veiculoId: formVeiculoId,
        comprador: formComprador,
        valorTotal: valorTotalNum,
        pagamentos: [
          {
            forma: formFormaPagamento,
            valor: valorRecebidoNum,
            descricao: formDetalhesPagamento || undefined
          }
        ],
        validadeSinalDias: formTipo === 2 ? parseInt(formValidadeSinal, 10) : undefined,
        garantiaDias: formTipo === 1 ? parseInt(formGarantiaDias, 10) : undefined,
        garantiaKm: formTipo === 1 && formGarantiaKm ? parseInt(formGarantiaKm, 10) : undefined,
        observacoes: formObservacoes || undefined
      };

      const res = await emitirRecibo(payload);
      alert(`Recibo Nº ${res.numero} emitido com sucesso!\nHash SHA-256 gerado.`);
      setModalEmitir(false);
      carregarRecibos();
      // Inicia download automático do PDF
      if (res.id) {
        downloadReciboPdf(res.id, res.numero);
      }
    } catch (err: any) {
      alert('Erro ao emitir recibo: ' + err.message);
    } finally {
      setEmitindo(false);
    }
  };

  const handleVerificarIntegridade = async (id: string, hash: string) => {
    try {
      const res = await verificarIntegridadeRecibo(id);
      setModalIntegridade({
        aberta: true,
        valida: res.integridadeValida,
        mensagem: res.mensagem,
        hash
      });
    } catch (err: any) {
      alert('Erro ao checar integridade: ' + err.message);
    }
  };

  const handleSolicitarAssinatura = async (id: string) => {
    if (!confirm('Deseja iniciar o processo de assinatura digital deste documento?')) return;
    try {
      const res = await solicitarAssinaturaRecibo(id);
      alert('Solicitação de assinatura iniciada! Status: ' + res.statusAssinatura);
      carregarRecibos();
    } catch (err: any) {
      alert('Erro: ' + err.message);
    }
  };

  const recibosFiltrados = recibos.filter(r => {
    if (!busca) return true;
    const q = busca.toLowerCase();
    return r.numero.toLowerCase().includes(q) || r.hashSha256.toLowerCase().includes(q);
  });

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <header className="page-header" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText size={28} color="var(--color-blue-light)" />
            <span>Recibos Digitais & Contratos</span>
          </h1>
          <p style={{ color: 'var(--color-gray-400)', marginTop: '4px', fontSize: '0.9rem' }}>
            Emissão de Recibos de Venda e Sinal em PDF profissional com assinatura criptográfica SHA-256 e e-signature.
          </p>
        </div>

        <button 
          className="btn btn-primary"
          onClick={abrirModalEmissao}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px' }}
        >
          <Plus size={18} />
          <span>Emitir Novo Recibo</span>
        </button>
      </header>

      {/* Filtros e Busca */}
      <div className="glass-panel" style={{ padding: '14px 18px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            type="button" 
            className={`date-preset-pill ${filtroTipo === 0 ? 'active' : ''}`}
            onClick={() => setFiltroTipo(0)}
          >
            Todos ({recibos.length})
          </button>
          <button 
            type="button" 
            className={`date-preset-pill ${filtroTipo === 1 ? 'active' : ''}`}
            onClick={() => setFiltroTipo(1)}
          >
            Recibos de Venda
          </button>
          <button 
            type="button" 
            className={`date-preset-pill ${filtroTipo === 2 ? 'active' : ''}`}
            onClick={() => setFiltroTipo(2)}
          >
            Recibos de Sinal
          </button>
        </div>

        <div style={{ position: 'relative', width: '280px' }}>
          <input 
            type="text" 
            className="form-input" 
            placeholder="Buscar por número ou hash..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            style={{ width: '100%', height: '38px', paddingLeft: '34px' }}
          />
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '11px' }} />
        </div>
      </div>

      {/* Tabela de Recibos */}
      <div className="table-modern-container">
        {loading ? (
          <div style={{ padding: '50px', textAlign: 'center', color: '#94a3b8' }}>Carregando recibos emitidos...</div>
        ) : (
          <table className="table-modern">
            <thead>
              <tr>
                <th>Documento</th>
                <th>Tipo</th>
                <th>Valor Recebido / Total</th>
                <th>Data Emissão</th>
                <th>Hash SHA-256</th>
                <th>Assinatura Digital</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {recibosFiltrados.map(r => (
                <tr key={r.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileText size={18} color="#60a5fa" />
                      <div>
                        <strong>{r.numero}</strong>
                        {r.cancelado && <span style={{ marginLeft: '6px', fontSize: '0.68rem', color: '#ef4444', background: 'rgba(239,68,68,0.15)', padding: '2px 6px', borderRadius: '4px' }}>CANCELADO</span>}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ 
                      fontSize: '0.75rem', 
                      padding: '3px 8px', 
                      borderRadius: '4px',
                      background: r.tipo === 'Sinal' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                      color: r.tipo === 'Sinal' ? '#fbbf24' : '#34d399',
                      fontWeight: 600
                    }}>
                      {r.tipo === 'Sinal' ? 'Sinal / Reserva' : 'Compra e Venda'}
                    </span>
                  </td>
                  <td>
                    <strong style={{ color: '#f1f5f9' }}>
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(r.valorRecebido)}
                    </strong>
                    {r.valorTotal !== r.valorRecebido && (
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                        Total: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(r.valorTotal)}
                      </div>
                    )}
                  </td>
                  <td>
                    <span style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
                      {new Date(r.emitidoEmUtc).toLocaleDateString('pt-BR')}
                    </span>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                      {new Date(r.emitidoEmUtc).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} UTC
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <code style={{ fontSize: '0.72rem', background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px', color: '#93c5fd' }}>
                        {r.hashSha256.substring(0, 10)}...{r.hashSha256.substring(r.hashSha256.length - 6)}
                      </code>
                      <button 
                        type="button" 
                        title="Verificar Autenticidade Criptográfica"
                        onClick={() => handleVerificarIntegridade(r.id, r.hashSha256)}
                        style={{ background: 'transparent', border: 'none', color: '#34d399', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      >
                        <ShieldCheck size={16} />
                      </button>
                    </div>
                  </td>
                  <td>
                    <span style={{ 
                      fontSize: '0.72rem', 
                      padding: '2px 8px', 
                      borderRadius: '4px',
                      background: r.statusAssinatura === 'Assinado' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)',
                      color: r.statusAssinatura === 'Assinado' ? '#34d399' : '#94a3b8',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      {r.statusAssinatura === 'Assinado' ? <CheckCircle2 size={12} /> : <Lock size={12} />}
                      <span>{r.statusAssinatura || 'Presencial'}</span>
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button 
                        type="button"
                        className="btn btn-outline"
                        title="Baixar PDF Oficial"
                        onClick={() => downloadReciboPdf(r.id, r.numero)}
                        style={{ padding: '6px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Download size={14} /> PDF
                      </button>

                      {r.statusAssinatura !== 'Assinado' && (
                        <button 
                          type="button"
                          className="btn"
                          title="Enviar para Assinatura Eletrônica"
                          onClick={() => handleSolicitarAssinatura(r.id)}
                          style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '6px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Send size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {recibosFiltrados.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                    Nenhum recibo emitido ainda. Clique em "Emitir Novo Recibo" para gerar o primeiro documento oficial com layout A4 e hash SHA-256.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL EMISSÃO DE RECIBO */}
      {modalEmitir && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.75)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div className="glass-panel" style={{ maxWidth: '750px', width: '100%', maxHeight: '92vh', overflowY: 'auto', padding: '28px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ margin: 0, color: 'white', fontSize: '1.3rem' }}>Emitir Recibo Oficial com Hash SHA-256</h2>
                <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>O recibo é gerado em PDF com validade jurídica, termos de garantia e carimbo de tempo.</p>
              </div>
              <button 
                type="button" 
                onClick={() => setModalEmitir(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEmitirSubmit}>
              {/* Tipo de Recibo */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '18px' }}>
                <button
                  type="button"
                  onClick={() => setFormTipo(1)}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    background: formTipo === 1 ? 'rgba(37, 99, 235, 0.25)' : 'rgba(255,255,255,0.03)',
                    border: formTipo === 1 ? '2px solid #3b82f6' : '1px solid rgba(255,255,255,0.08)',
                    color: 'white',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Recibo de Compra e Venda
                </button>
                <button
                  type="button"
                  onClick={() => setFormTipo(2)}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    background: formTipo === 2 ? 'rgba(245, 158, 11, 0.25)' : 'rgba(255,255,255,0.03)',
                    border: formTipo === 2 ? '2px solid #f59e0b' : '1px solid rgba(255,255,255,0.08)',
                    color: 'white',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Recibo de Sinal / Reserva
                </button>
              </div>

              {/* Veículo */}
              <div className="form-group">
                <label className="form-label">Veículo Negociado *</label>
                <select 
                  className="form-input" 
                  required
                  value={formVeiculoId} 
                  onChange={e => handleVeiculoChange(e.target.value)}
                >
                  <option value="">-- Selecione o Veículo do Estoque --</option>
                  {veiculos.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.marca} {v.modelo} {v.versao} (Placa: {v.placa || 'Sem placa'}) — R$ {v.valorVenda ? v.valorVenda.toLocaleString('pt-BR') : '0,00'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Comprador */}
              <h4 style={{ margin: '16px 0 10px', color: 'var(--color-blue-light)', fontSize: '0.95rem' }}>Dados do Comprador</h4>
              <div className="form-group">
                <label className="form-label">Selecionar Cliente Cadastrado (Opcional)</label>
                <select 
                  className="form-input" 
                  value={formClienteId} 
                  onChange={e => handleClienteChange(e.target.value)}
                >
                  <option value="">-- Preencher manualmente ou selecionar cliente --</option>
                  {clientes.map(c => (
                    <option key={c.id} value={c.id}>{c.nome || c.nomeRazaoSocial} ({c.cpfCnpj})</option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Nome Completo / Razão Social *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    required 
                    placeholder="Ex: João Ferreira"
                    value={formComprador.nome}
                    onChange={e => setFormComprador({ ...formComprador, nome: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">CPF / CNPJ *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    required 
                    placeholder="000.000.000-00"
                    value={formComprador.cpfCnpj}
                    onChange={e => setFormComprador({ ...formComprador, cpfCnpj: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Telefone</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="(11) 99999-9999"
                    value={formComprador.telefone}
                    onChange={e => setFormComprador({ ...formComprador, telefone: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">E-mail</label>
                  <input 
                    type="email" 
                    className="form-input" 
                    placeholder="joao@gmail.com"
                    value={formComprador.email}
                    onChange={e => setFormComprador({ ...formComprador, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Endereço Completo</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Rua, Número, Bairro, Cidade/UF"
                  value={formComprador.endereco}
                  onChange={e => setFormComprador({ ...formComprador, endereco: e.target.value })}
                />
              </div>

              {/* Valores & Pagamento */}
              <h4 style={{ margin: '16px 0 10px', color: 'var(--color-blue-light)', fontSize: '0.95rem' }}>Valores e Condições de Pagamento</h4>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Valor Total do Negócio (R$) *</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    className="form-input" 
                    required 
                    placeholder="100000.00"
                    value={formValorTotal}
                    onChange={e => setFormValorTotal(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    {formTipo === 2 ? 'Valor do Sinal / Entrada (R$) *' : 'Valor Quitado / Recebido (R$) *'}
                  </label>
                  <input 
                    type="number" 
                    step="0.01" 
                    className="form-input" 
                    required 
                    placeholder="10000.00"
                    value={formValorRecebido}
                    onChange={e => setFormValorRecebido(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Forma de Pagamento</label>
                  <select 
                    className="form-input"
                    value={formFormaPagamento}
                    onChange={e => setFormFormaPagamento(Number(e.target.value))}
                  >
                    <option value="2">PIX</option>
                    <option value="4">Transferência Bancária / TED</option>
                    <option value="3">Dinheiro em Espécie</option>
                    <option value="5">Financiamento Bancário</option>
                    <option value="7">Veículo Usado na Troca</option>
                    <option value="8">Cartão de Crédito / Débito</option>
                    <option value="9">Cheque</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Detalhes do Pagamento</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Ex: Chave Pix CNPJ, 36x Banco Santander..."
                    value={formDetalhesPagamento}
                    onChange={e => setFormDetalhesPagamento(e.target.value)}
                  />
                </div>
              </div>

              {/* Específicos Sinal / Garantia */}
              {formTipo === 2 ? (
                <div className="form-group">
                  <label className="form-label">Validade do Sinal (Dias)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    placeholder="7"
                    value={formValidadeSinal}
                    onChange={e => setFormValidadeSinal(e.target.value)}
                  />
                </div>
              ) : (
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Prazo de Garantia (Dias CDC)</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      placeholder="90"
                      value={formGarantiaDias}
                      onChange={e => setFormGarantiaDias(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Limite de KM da Garantia</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      placeholder="3000"
                      value={formGarantiaKm}
                      onChange={e => setFormGarantiaKm(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Observações Complementares</label>
                <textarea 
                  className="form-input" 
                  rows={2}
                  placeholder="Informações adicionais que constarão no documento..."
                  value={formObservacoes}
                  onChange={e => setFormObservacoes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
                <button type="button" className="btn" onClick={() => setModalEmitir(false)} style={{ background: 'rgba(255,255,255,0.05)', color: 'white' }}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={emitindo}>
                  {emitindo ? 'Gerando PDF com SHA-256...' : 'Emitir Recibo Oficial'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL VERIFICAÇÃO DE INTEGRIDADE */}
      {modalIntegridade && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.75)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div className="glass-panel" style={{ maxWidth: '550px', width: '100%', padding: '28px', borderRadius: '16px', textAlign: 'center' }}>
            <div style={{ marginBottom: '16px' }}>
              {modalIntegridade.valida ? (
                <CheckCircle2 size={56} color="#10b981" style={{ margin: '0 auto' }} />
              ) : (
                <XCircle size={56} color="#ef4444" style={{ margin: '0 auto' }} />
              )}
            </div>

            <h3 style={{ margin: '0 0 8px', color: 'white', fontSize: '1.2rem' }}>
              {modalIntegridade.valida ? 'Documento 100% Autêntico e Válido' : 'Alerta de Inconsistência no Hash'}
            </h3>
            
            <p style={{ color: '#cbd5e1', fontSize: '0.9rem', marginBottom: '16px' }}>
              {modalIntegridade.mensagem}
            </p>

            {modalIntegridade.hash && (
              <div style={{ background: 'rgba(0,0,0,0.4)', padding: '10px', borderRadius: '8px', wordBreak: 'break-all', fontSize: '0.75rem', fontFamily: 'monospace', color: '#93c5fd', marginBottom: '20px' }}>
                SHA-256: {modalIntegridade.hash}
              </div>
            )}

            <button 
              type="button" 
              className="btn btn-primary" 
              onClick={() => setModalIntegridade(null)}
              style={{ width: '100%' }}
            >
              Fechar Verificação
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecibosDigitais;
