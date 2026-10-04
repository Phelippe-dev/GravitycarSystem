import React, { useState, useEffect } from 'react';
import { 
  fetchKanbanLeads, 
  moverLead, 
  criarLead, 
  fetchLeadDetalhes, 
  adicionarInteracaoLead, 
  converterLeadEmCliente, 
  fetchVeiculosCompativeisLead 
} from '../api';
import type { KanbanColuna, LeadCard, LeadDetalhes, Veiculo } from '../api';
import { 
  Users, 
  Plus, 
  Phone, 
  MessageSquare, 
  Car, 
  Bike, 
  Truck, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft,
  Search
} from 'lucide-react';

const ESTAGIOS = [
  { id: 1, titulo: 'Novos', cor: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
  { id: 2, titulo: 'Em Contato', cor: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' },
  { id: 3, titulo: 'Qualificados', cor: '#06b6d4', bg: 'rgba(6, 182, 212, 0.1)' },
  { id: 4, titulo: 'Proposta', cor: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
  { id: 5, titulo: 'Negociação', cor: '#ec4899', bg: 'rgba(236, 72, 153, 0.1)' },
  { id: 6, titulo: 'Ganhos', cor: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
  { id: 7, titulo: 'Perdidos', cor: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' }
];

const LeadsKanban: React.FC = () => {
  const [colunas, setColunas] = useState<KanbanColuna[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<number>(0);

  // Modais
  const [modalNovoLead, setModalNovoLead] = useState(false);
  const [modalDetalhesLead, setModalDetalhesLead] = useState<LeadDetalhes | null>(null);
  const [veiculosCompativeis, setVeiculosCompativeis] = useState<Veiculo[]>([]);
  const [loadingCompativeis, setLoadingCompativeis] = useState(false);
  const [novaNota, setNovaNota] = useState('');
  const [submittingNota, setSubmittingNota] = useState(false);

  // Form Novo Lead
  const [novoLeadForm, setNovoLeadForm] = useState({
    nome: '',
    email: '',
    telefone: '',
    mensagem: '',
    tipoOportunidade: 1, // Compra
    valorEstimado: '',
    interesseTipo: 1,    // Carro
    interesseMarca: '',
    interesseModelo: '',
    interessePrecoMax: '',
    interesseAnoMin: ''
  });

  useEffect(() => {
    carregarKanban();
  }, [filtroTipo, busca]);

  const carregarKanban = async () => {
    setLoading(true);
    const data = await fetchKanbanLeads(undefined, filtroTipo > 0 ? filtroTipo : undefined, busca);
    setColunas(data);
    setLoading(false);
  };

  const handleMover = async (leadId: string, novoEstagio: number) => {
    try {
      let motivo: string | undefined = undefined;
      if (novoEstagio === 7) {
        const m = prompt('Informe o motivo da perda da oportunidade:');
        if (!m) return;
        motivo = m;
      }
      await moverLead(leadId, novoEstagio, 0, motivo);
      carregarKanban();
    } catch (err: any) {
      alert('Erro ao mover lead: ' + err.message);
    }
  };

  const abrirDetalhes = async (lead: LeadCard) => {
    const det = await fetchLeadDetalhes(lead.id);
    if (det) {
      setModalDetalhesLead(det);
      setLoadingCompativeis(true);
      const comps = await fetchVeiculosCompativeisLead(lead.id);
      setVeiculosCompativeis(comps);
      setLoadingCompativeis(false);
    }
  };

  const handleAdicionarNota = async () => {
    if (!modalDetalhesLead || !novaNota.trim()) return;
    setSubmittingNota(true);
    try {
      await adicionarInteracaoLead(modalDetalhesLead.lead.id, 'Nota', novaNota.trim());
      setNovaNota('');
      const atualizado = await fetchLeadDetalhes(modalDetalhesLead.lead.id);
      if (atualizado) setModalDetalhesLead(atualizado);
    } catch (err: any) {
      alert('Erro ao salvar nota: ' + err.message);
    } finally {
      setSubmittingNota(false);
    }
  };

  const handleConverterCliente = async () => {
    if (!modalDetalhesLead) return;
    try {
      const res = await converterLeadEmCliente(modalDetalhesLead.lead.id);
      alert('Lead convertido em Cliente com sucesso! ID do Cliente: ' + res.clienteId);
      const atualizado = await fetchLeadDetalhes(modalDetalhesLead.lead.id);
      if (atualizado) setModalDetalhesLead(atualizado);
    } catch (err: any) {
      alert('Erro ao converter: ' + err.message);
    }
  };

  const handleCriarLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await criarLead({
        nome: novoLeadForm.nome,
        email: novoLeadForm.email || undefined,
        telefone: novoLeadForm.telefone || undefined,
        mensagem: novoLeadForm.mensagem || undefined,
        tipoOportunidade: Number(novoLeadForm.tipoOportunidade),
        valorEstimado: novoLeadForm.valorEstimado ? Number(novoLeadForm.valorEstimado) : undefined,
        origem: 1, // Manual
        interesse: {
          tipo: Number(novoLeadForm.interesseTipo),
          marca: novoLeadForm.interesseMarca || undefined,
          modelo: novoLeadForm.interesseModelo || undefined,
          precoMax: novoLeadForm.interessePrecoMax ? Number(novoLeadForm.interessePrecoMax) : undefined,
          anoMin: novoLeadForm.interesseAnoMin ? Number(novoLeadForm.interesseAnoMin) : undefined
        }
      });
      setModalNovoLead(false);
      setNovoLeadForm({
        nome: '',
        email: '',
        telefone: '',
        mensagem: '',
        tipoOportunidade: 1,
        valorEstimado: '',
        interesseTipo: 1,
        interesseMarca: '',
        interesseModelo: '',
        interessePrecoMax: '',
        interesseAnoMin: ''
      });
      carregarKanban();
    } catch (err: any) {
      alert('Erro ao cadastrar lead: ' + err.message);
    }
  };

  const getTipoIcon = (tipo?: number) => {
    if (tipo === 2 || tipo === 3) return <Bike size={14} color="#f472b6" />;
    if (tipo === 7 || tipo === 6) return <Truck size={14} color="#34d399" />;
    return <Car size={14} color="#93c5fd" />;
  };

  const totalGeralLeads = colunas.reduce((acc, c) => acc + c.quantidade, 0);
  const totalValorPipeline = colunas
    .filter(c => c.estagio !== 7) // Exclui perdidos
    .reduce((acc, c) => acc + c.valorTotal, 0);

  return (
    <div style={{ maxWidth: '100%', margin: '0 auto', width: '100%', padding: '0 10px' }}>
      {/* Header */}
      <header className="page-header" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users size={28} color="var(--color-blue-light)" />
            <span>Pipeline de Oportunidades (CRM)</span>
          </h1>
          <p style={{ color: 'var(--color-gray-400)', marginTop: '4px', fontSize: '0.9rem' }}>
            Gestão de leads, prospecção e funil de vendas multimarcas em formato Kanban.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ padding: '8px 16px', background: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px' }}>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Potencial do Funil</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#34d399' }}>
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValorPipeline)}
            </div>
          </div>

          <button 
            className="btn btn-primary"
            onClick={() => setModalNovoLead(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px' }}
          >
            <Plus size={18} />
            <span>Novo Lead</span>
          </button>
        </div>
      </header>

      {/* Filtros e Busca */}
      <div className="glass-panel" style={{ padding: '14px 18px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '0.82rem', color: '#94a3b8', marginRight: '4px' }}>Interesse:</span>
          <button 
            type="button"
            className={`date-preset-pill ${filtroTipo === 0 ? 'active' : ''}`}
            onClick={() => setFiltroTipo(0)}
          >
            Todos ({totalGeralLeads})
          </button>
          <button 
            type="button"
            className={`date-preset-pill ${filtroTipo === 1 ? 'active' : ''}`}
            onClick={() => setFiltroTipo(1)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Car size={14} /> Carros
          </button>
          <button 
            type="button"
            className={`date-preset-pill ${filtroTipo === 2 ? 'active' : ''}`}
            onClick={() => setFiltroTipo(2)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Bike size={14} /> Motos
          </button>
          <button 
            type="button"
            className={`date-preset-pill ${filtroTipo === 7 ? 'active' : ''}`}
            onClick={() => setFiltroTipo(7)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Truck size={14} /> Utilitários
          </button>
        </div>

        <div style={{ position: 'relative', width: '280px' }}>
          <input 
            type="text" 
            className="form-input" 
            placeholder="Buscar por nome, fone, email..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            style={{ width: '100%', height: '38px', paddingLeft: '34px' }}
          />
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '11px' }} />
        </div>
      </div>

      {/* BOARD KANBAN */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
          Carregando pipeline de leads...
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(7, minmax(260px, 1fr))', 
          gap: '14px', 
          overflowX: 'auto', 
          paddingBottom: '20px',
          alignItems: 'start'
        }}>
          {ESTAGIOS.map(estagioConfig => {
            const coluna = colunas.find(c => c.estagio === estagioConfig.id) || {
              estagio: estagioConfig.id,
              titulo: estagioConfig.titulo,
              quantidade: 0,
              valorTotal: 0,
              leads: []
            };

            return (
              <div 
                key={estagioConfig.id} 
                style={{ 
                  background: 'rgba(15, 23, 42, 0.65)', 
                  border: '1px solid rgba(255, 255, 255, 0.08)', 
                  borderRadius: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  maxHeight: 'calc(100vh - 230px)',
                  minHeight: '350px'
                }}
              >
                {/* Cabeçalho da coluna */}
                <div style={{ 
                  padding: '12px 14px', 
                  borderBottom: `2px solid ${estagioConfig.cor}`,
                  background: estagioConfig.bg,
                  borderRadius: '12px 12px 0 0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#f1f5f9' }}>
                      {estagioConfig.titulo}
                    </span>
                    <span style={{ 
                      fontSize: '0.72rem', 
                      fontWeight: 700, 
                      padding: '2px 7px', 
                      background: 'rgba(0,0,0,0.3)', 
                      borderRadius: '10px',
                      color: estagioConfig.cor
                    }}>
                      {coluna.quantidade}
                    </span>
                  </div>
                  {coluna.valorTotal > 0 && (
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>
                      {new Intl.NumberFormat('pt-BR', { notation: 'compact', style: 'currency', currency: 'BRL' }).format(coluna.valorTotal)}
                    </span>
                  )}
                </div>

                {/* Lista de Cards */}
                <div style={{ padding: '10px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                  {coluna.leads.map(lead => {
                    const foneLimpo = lead.telefone ? lead.telefone.replace(/\D/g, '') : '';
                    const linkWhatsApp = foneLimpo ? `https://wa.me/55${foneLimpo}` : null;

                    return (
                      <div 
                        key={lead.id}
                        style={{
                          background: 'rgba(30, 41, 59, 0.8)',
                          border: '1px solid rgba(255,255,255,0.06)',
                          borderRadius: '10px',
                          padding: '12px',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
                          transition: 'transform 0.15s ease, border-color 0.15s ease',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = estagioConfig.cor}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}
                      >
                        {/* Topo do card: Tipo de veículo & Canal */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: '#cbd5e1' }}>
                            {getTipoIcon(lead.interesseTipo)}
                            <span>{lead.interesseMarca || (lead.interesseTipo === 2 ? 'Moto' : 'Carro')}</span>
                          </span>

                          <span style={{ fontSize: '0.68rem', color: '#94a3b8', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>
                            {lead.canal || 'Direto'}
                          </span>
                        </div>

                        {/* Nome do Lead */}
                        <h4 
                          onClick={() => abrirDetalhes(lead)}
                          style={{ margin: '0 0 6px 0', fontSize: '0.95rem', color: '#f8fafc', fontWeight: 600, wordBreak: 'break-word' }}
                        >
                          {lead.nome}
                        </h4>

                        {/* Interesse do lead */}
                        {lead.interesseModelo && (
                          <div style={{ fontSize: '0.8rem', color: '#60a5fa', marginBottom: '6px' }}>
                            Interesse: <strong>{lead.interesseModelo}</strong>
                          </div>
                        )}

                        {/* Valor Estimado */}
                        {lead.valorEstimado ? (
                          <div style={{ fontSize: '0.82rem', color: '#34d399', fontWeight: 700, marginBottom: '8px' }}>
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lead.valorEstimado)}
                          </div>
                        ) : null}

                        {/* Contatos rápidos */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '8px', marginTop: '6px' }}>
                          {linkWhatsApp && (
                            <a 
                              href={linkWhatsApp} 
                              target="_blank" 
                              rel="noreferrer" 
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#22c55e', fontSize: '0.75rem', textDecoration: 'none' }}
                              onClick={e => e.stopPropagation()}
                            >
                              <Phone size={12} />
                              <span>Zap</span>
                            </a>
                          )}

                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); abrirDetalhes(lead); }}
                            style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '2px' }}
                          >
                            <span>Detalhes</span>
                            <ChevronRight size={14} />
                          </button>
                        </div>

                        {/* Ações de Mover Rápido (Avançar / Retroceder) */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', paddingTop: '6px', borderTop: '1px dashed rgba(255,255,255,0.06)' }}>
                          {estagioConfig.id > 1 ? (
                            <button
                              type="button"
                              title="Voltar estágio"
                              onClick={(e) => { e.stopPropagation(); handleMover(lead.id, estagioConfig.id - 1); }}
                              style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#94a3b8', borderRadius: '4px', padding: '3px 6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px', fontSize: '0.7rem' }}
                            >
                              <ChevronLeft size={12} /> Voltar
                            </button>
                          ) : <span />}

                          {estagioConfig.id < 6 ? (
                            <button
                              type="button"
                              title="Avançar estágio"
                              onClick={(e) => { e.stopPropagation(); handleMover(lead.id, estagioConfig.id + 1); }}
                              style={{ background: 'rgba(37, 99, 235, 0.2)', border: '1px solid rgba(37, 99, 235, 0.4)', color: '#93c5fd', borderRadius: '4px', padding: '3px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px', fontSize: '0.7rem', fontWeight: 600 }}
                            >
                              Avançar <ChevronRight size={12} />
                            </button>
                          ) : (
                            estagioConfig.id === 6 ? (
                              <span style={{ fontSize: '0.7rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '2px' }}>
                                <CheckCircle2 size={12} /> Ganho
                              </span>
                            ) : null
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {coluna.leads.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '24px 10px', color: '#64748b', fontSize: '0.8rem' }}>
                      Nenhuma oportunidade
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL DETALHES DO LEAD */}
      {modalDetalhesLead && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.75)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div className="glass-panel" style={{ maxWidth: '850px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '28px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                  Oportunidade #{modalDetalhesLead.lead.id.substring(0, 8)}
                </span>
                <h2 style={{ margin: '4px 0 0', color: 'white', fontSize: '1.4rem' }}>{modalDetalhesLead.lead.nome}</h2>
              </div>
              <button 
                type="button" 
                onClick={() => setModalDetalhesLead(null)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Contato & Conversão em Cliente */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '20px', background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '10px' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Telefone / WhatsApp</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'white' }}>{modalDetalhesLead.lead.telefone || '-'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>E-mail</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'white' }}>{modalDetalhesLead.lead.email || '-'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Status no Sistema</div>
                {modalDetalhesLead.lead.clienteId ? (
                  <span style={{ color: '#34d399', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                    <CheckCircle2 size={14} /> Cliente Cadastrado
                  </span>
                ) : (
                  <button 
                    type="button" 
                    className="btn btn-primary"
                    onClick={handleConverterCliente}
                    style={{ fontSize: '0.75rem', padding: '4px 10px', marginTop: '2px' }}
                  >
                    Converter em Cliente
                  </button>
                )}
              </div>
            </div>

            {/* Mensagem original */}
            {modalDetalhesLead.mensagem && (
              <div style={{ marginBottom: '20px', background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '12px 16px', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.75rem', color: '#93c5fd', fontWeight: 600, marginBottom: '4px' }}>Mensagem do Cliente:</div>
                <div style={{ color: '#e2e8f0', fontSize: '0.9rem', fontStyle: 'italic' }}>"{modalDetalhesLead.mensagem}"</div>
              </div>
            )}

            {/* Veículos do estoque que batem com o interesse */}
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ margin: '0 0 10px', color: 'var(--color-blue-light)', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Car size={18} />
                <span>Veículos no Estoque que dão Match com este Lead</span>
              </h4>

              {loadingCompativeis ? (
                <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Buscando estoque compatível...</div>
              ) : veiculosCompativeis.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                  {veiculosCompativeis.map(v => (
                    <div key={v.id} style={{ background: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'white' }}>{v.marca} {v.modelo}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{v.versao || ''} · Ano {v.anoModelo}</div>
                      <div style={{ fontSize: '0.9rem', color: '#34d399', fontWeight: 700, marginTop: '4px' }}>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v.valorVenda)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '0.85rem', color: '#94a3b8', background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '6px' }}>
                  Nenhum veículo disponível no estoque atende a todos os critérios específicos deste lead no momento.
                </div>
              )}
            </div>

            {/* Histórico de Interações */}
            <div>
              <h4 style={{ margin: '0 0 10px', color: 'var(--color-blue-light)', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MessageSquare size={18} />
                <span>Histórico de Contatos e Notas</span>
              </h4>

              <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Escreva uma anotação sobre a conversa (ex: ligou querendo ver no sábado)..."
                  value={novaNota}
                  onChange={e => setNovaNota(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAdicionarNota()}
                  style={{ flex: 1 }}
                />
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={handleAdicionarNota}
                  disabled={submittingNota || !novaNota.trim()}
                >
                  Salvar Nota
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                {modalDetalhesLead.interacoes.map(it => (
                  <div key={it.id} style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderLeft: '3px solid #3b82f6', borderRadius: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '2px' }}>
                      <span style={{ fontWeight: 600, color: '#93c5fd' }}>{it.tipo}</span>
                      <span>{new Date(it.dataCriacao).toLocaleString('pt-BR')}</span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#f1f5f9' }}>{it.descricao}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL NOVO LEAD */}
      {modalNovoLead && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.75)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div className="glass-panel" style={{ maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '28px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, color: 'white', fontSize: '1.3rem' }}>Nova Oportunidade / Lead</h2>
              <button 
                type="button" 
                onClick={() => setModalNovoLead(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCriarLeadSubmit}>
              <div className="form-group">
                <label className="form-label">Nome Completo *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  required 
                  placeholder="Ex: Carlos Silva"
                  value={novoLeadForm.nome}
                  onChange={e => setNovoLeadForm({ ...novoLeadForm, nome: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Telefone / WhatsApp</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="(11) 99999-9999"
                    value={novoLeadForm.telefone}
                    onChange={e => setNovoLeadForm({ ...novoLeadForm, telefone: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">E-mail</label>
                  <input 
                    type="email" 
                    className="form-input" 
                    placeholder="carlos@gmail.com"
                    value={novoLeadForm.email}
                    onChange={e => setNovoLeadForm({ ...novoLeadForm, email: e.target.value })}
                  />
                </div>
              </div>

              <h4 style={{ margin: '16px 0 10px', color: 'var(--color-blue-light)', fontSize: '0.95rem' }}>Interesse do Veículo</h4>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Tipo de Veículo</label>
                  <select 
                    className="form-input"
                    value={novoLeadForm.interesseTipo}
                    onChange={e => setNovoLeadForm({ ...novoLeadForm, interesseTipo: Number(e.target.value) })}
                  >
                    <option value="1">Carro de Passeio</option>
                    <option value="2">Motocicleta / Scooter</option>
                    <option value="7">Utilitário / Caminhonete</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Marca Desejada</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Ex: Honda, Toyota, BMW"
                    value={novoLeadForm.interesseMarca}
                    onChange={e => setNovoLeadForm({ ...novoLeadForm, interesseMarca: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Modelo Desejado</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Ex: Civic, CB 500, Hilux"
                    value={novoLeadForm.interesseModelo}
                    onChange={e => setNovoLeadForm({ ...novoLeadForm, interesseModelo: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Orçamento Máximo (R$)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    placeholder="Ex: 85000"
                    value={novoLeadForm.interessePrecoMax}
                    onChange={e => setNovoLeadForm({ ...novoLeadForm, interessePrecoMax: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Mensagem / Observações</label>
                <textarea 
                  className="form-input" 
                  rows={3}
                  placeholder="Detalhes sobre a negociação ou interesse..."
                  value={novoLeadForm.mensagem}
                  onChange={e => setNovoLeadForm({ ...novoLeadForm, mensagem: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
                <button type="button" className="btn" onClick={() => setModalNovoLead(false)} style={{ background: 'rgba(255,255,255,0.05)', color: 'white' }}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Cadastrar Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadsKanban;
