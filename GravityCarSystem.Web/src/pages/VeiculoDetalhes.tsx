import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Upload,
  FileText,
  DollarSign,
  Clock,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Printer,
  FileDown,
  Download,
  Trash2,
  X,
  Eye,
  Star,
  Edit2,
  Check
} from 'lucide-react';
import {
  getVeiculoDetalhes,
  uploadFotoVeiculo,
  removerFotoVeiculo,
  definirFotoPrincipalVeiculo,
  uploadDocumentoVeiculo,
  removerDocumentoVeiculo,
  adicionarCustoVeiculo,
  atualizarObservacoesVeiculo,
  API_BASE_URL
} from '../api';
import type { VeiculoDetalhes } from '../api';
import logoImg from '../assets/logo.png';

const VeiculoDetalhesPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [veiculo, setVeiculo] = useState<VeiculoDetalhes | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [descCusto, setDescCusto] = useState('');
  const [valorCusto, setValorCusto] = useState('');
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  // Estados para Documentos e PDF
  const [showModalUpload, setShowModalUpload] = useState(false);
  const [tipoDocumento, setTipoDocumento] = useState('CRLV Digital (PDF)');
  const [arquivoDoc, setArquivoDoc] = useState<File | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [showModalDossiePdf, setShowModalDossiePdf] = useState(false);

  // Estados para Observações Técnicas Editáveis
  const [editandoObs, setEditandoObs] = useState(false);
  const [textoObs, setTextoObs] = useState('');
  const [salvandoObs, setSalvandoObs] = useState(false);

  const handleSalvarObs = async () => {
    if (!id) return;
    try {
      setSalvandoObs(true);
      const sucesso = await atualizarObservacoesVeiculo(id, textoObs);
      if (sucesso) {
        setVeiculo(prev => prev ? { ...prev, observacoes: textoObs } : null);
        setEditandoObs(false);
      } else {
        alert('Falha ao salvar observações do veículo.');
      }
    } catch {
      alert('Erro de conexão ao salvar observações.');
    } finally {
      setSalvandoObs(false);
    }
  };

  const getStatusLabel = (status: number) => {
    switch (status) {
      case 1: return 'Em Avaliação';
      case 2: return 'Em Compra';
      case 3: return 'Em Preparação';
      case 4: return 'Disponível';
      case 5: return 'Reservado';
      case 6: return 'Vendido';
      default: return 'Indisponível';
    }
  };

  const resolvePhotoUrl = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${API_BASE_URL.replace('/api', '')}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const carregarVeiculo = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await getVeiculoDetalhes(id);
      setVeiculo(data);
    } catch (err: any) {
      setError('Erro ao carregar detalhes do veículo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarVeiculo();
  }, [id]);

  const handleUploadFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !id) return;
    try {
      setLoading(true);
      const files = Array.from(e.target.files);
      const hasFotos = veiculo?.fotos && veiculo.fotos.length > 0;
      for (let i = 0; i < files.length; i++) {
        const isPrimeira = !hasFotos && i === 0;
        await uploadFotoVeiculo(id, files[i], isPrimeira);
      }
      await carregarVeiculo();
    } catch (err) {
      alert('Erro ao fazer upload da(s) foto(s).');
    } finally {
      setLoading(false);
    }
  };

  const nextPhoto = () => {
    if (veiculo?.fotos) {
      setCurrentPhotoIndex((prev) => (prev + 1) % veiculo.fotos.length);
    }
  };

  const prevPhoto = () => {
    if (veiculo?.fotos) {
      setCurrentPhotoIndex((prev) => (prev - 1 + veiculo.fotos.length) % veiculo.fotos.length);
    }
  };

  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null);
  const [settingPrincipalId, setSettingPrincipalId] = useState<string | null>(null);

  const handleRemoverFoto = async (fotoId: string) => {
    if (!id || !fotoId) return;
    if (!window.confirm('Deseja realmente excluir esta foto do estoque?')) return;

    try {
      setDeletingPhotoId(fotoId);
      await removerFotoVeiculo(id, fotoId);
      if (veiculo && veiculo.fotos.length > 1 && currentPhotoIndex >= veiculo.fotos.length - 1) {
        setCurrentPhotoIndex(Math.max(0, veiculo.fotos.length - 2));
      }
      await carregarVeiculo();
    } catch (err) {
      alert('Erro ao excluir foto do veículo.');
    } finally {
      setDeletingPhotoId(null);
    }
  };

  const handleDefinirFotoPrincipal = async (fotoId: string) => {
    if (!id || !fotoId) return;
    try {
      setSettingPrincipalId(fotoId);
      await definirFotoPrincipalVeiculo(id, fotoId);
      await carregarVeiculo();
    } catch (err) {
      alert('Erro ao definir foto como principal.');
    } finally {
      setSettingPrincipalId(null);
    }
  };

  const handleConfirmUploadDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!arquivoDoc || !id) return;
    try {
      setUploadingDoc(true);
      await uploadDocumentoVeiculo(id, arquivoDoc, tipoDocumento);
      setShowModalUpload(false);
      setArquivoDoc(null);
      await carregarVeiculo();
    } catch (err) {
      alert('Erro ao fazer upload do documento.');
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleDeleteDoc = async (docId: string, nomeDoc: string) => {
    if (!id) return;
    if (!window.confirm(`Deseja realmente excluir o documento "${nomeDoc}"?`)) return;
    try {
      await removerDocumentoVeiculo(id, docId);
      await carregarVeiculo();
    } catch (err) {
      alert('Erro ao excluir documento.');
    }
  };

  const handleAddCusto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      const valorNumerico = parseFloat(valorCusto.replace(',', '.'));
      if (isNaN(valorNumerico) || valorNumerico <= 0) {
        alert('Digite um valor válido.');
        return;
      }
      await adicionarCustoVeiculo(id, { descricao: descCusto, valor: valorNumerico, dataCusto: new Date().toISOString() } as any);
      setDescCusto('');
      setValorCusto('');
      carregarVeiculo();
    } catch (err: any) {
      alert(err.message || 'Erro ao lançar custo.');
    }
  };

  if (loading && !veiculo) return <div style={{ padding: '24px' }}>Carregando detalhes...</div>;
  if (error || !veiculo) return <div style={{ padding: '24px', color: 'var(--color-danger)' }}>{error || 'Veículo não encontrado'}</div>;

  const totalCustos = veiculo.custos?.reduce((acc, c) => acc + c.valor, 0) || 0;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', padding: '24px' }}>
      <header className="page-header print-hidden" style={{ marginBottom: '32px' }}>
        <button className="btn" onClick={() => navigate('/estoque')} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '16px', background: 'transparent', padding: 0 }}>
          <ArrowLeft size={20} /> Voltar ao Estoque
        </button>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 className="page-title">{veiculo.marca} {veiculo.modelo}</h1>
            <p style={{ color: 'var(--color-gray-400)', fontSize: '1.1rem', marginTop: '4px' }}>
              Placa: {veiculo.placa} • {veiculo.anoFabricacao}/{veiculo.anoModelo}
            </p>
          </div>
          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
            <button
              className="btn btn-primary"
              onClick={() => setShowModalDossiePdf(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 18px', fontSize: '0.9rem', background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)', boxShadow: '0 4px 14px rgba(37,99,235,0.35)', fontWeight: 600, cursor: 'pointer' }}
              title="Gerar Ficha Técnica do Produto em PDF"
            >
              <FileText size={18} /> Ficha Técnica do Veículo
            </button>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-blue-light)' }}>
              R$ {veiculo.valorVenda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div className={veiculo.status === 0 ? 'badge badge-success' : 'badge badge-warning'}>
              {veiculo.status === 0 ? 'Disponível' : veiculo.status === 1 ? 'Vendido' : 'Manutenção'}
            </div>
          </div>
        </div>
      </header>

      <div className="print-hidden" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>Galeria do Veículo</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-gray-400)' }}>
                  {veiculo.fotos.length} {veiculo.fotos.length === 1 ? 'foto cadastrada' : 'fotos cadastradas'}
                </span>
              </div>
              <div>
                <input type="file" id="upload-foto" hidden multiple accept="image/*" onChange={handleUploadFoto} />
                <label htmlFor="upload-foto" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '8px 16px', fontSize: '0.9rem' }}>
                  <Upload size={16} /> Adicionar Fotos
                </label>
              </div>
            </div>

            {veiculo.fotos.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-gray-400)', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                Nenhuma foto cadastrada. Clique em "Adicionar Fotos" acima.
              </div>
            ) : (
              <div>
                {/* Visualizador Principal de Foto */}
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    aspectRatio: '16/9',
                    maxHeight: '420px',
                    background: '#090d16',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid rgba(255,255,255,0.08)'
                  }}
                >
                  {/* Barra Superior Flutuante de Ações com fundo escuro e espaçamento perfeito */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 16px',
                      background: 'linear-gradient(180deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 70%, transparent 100%)',
                      zIndex: 10
                    }}
                  >
                    {/* Lado Esquerdo: Foto Principal */}
                    {veiculo.fotos[currentPhotoIndex].isPrincipal ? (
                      <span
                        style={{
                          background: 'rgba(16, 185, 129, 0.95)',
                          color: '#fff',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
                        }}
                      >
                        <Star size={14} fill="#fff" /> Foto de Capa (Principal)
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleDefinirFotoPrincipal(veiculo.fotos[currentPhotoIndex].id)}
                        disabled={settingPrincipalId === veiculo.fotos[currentPhotoIndex].id}
                        style={{
                          background: 'rgba(15, 23, 42, 0.85)',
                          color: '#fef08a',
                          border: '1px solid rgba(254, 240, 138, 0.4)',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          backdropFilter: 'blur(4px)',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                          transition: 'all 0.15s'
                        }}
                        title="Tornar esta a foto de capa do estoque"
                      >
                        <Star size={14} />
                        {settingPrincipalId === veiculo.fotos[currentPhotoIndex].id ? 'Definindo...' : 'Definir como Capa'}
                      </button>
                    )}

                    {/* Lado Direito: Botão Excluir bem destacado e fácil de clicar */}
                    <button
                      type="button"
                      onClick={() => handleRemoverFoto(veiculo.fotos[currentPhotoIndex].id)}
                      disabled={deletingPhotoId === veiculo.fotos[currentPhotoIndex].id}
                      style={{
                        background: '#ef4444',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '8px 16px',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        boxShadow: '0 2px 10px rgba(239, 68, 68, 0.5)',
                        transition: 'all 0.15s'
                      }}
                      title="Excluir esta foto do veículo"
                    >
                      <Trash2 size={16} />
                      {deletingPhotoId === veiculo.fotos[currentPhotoIndex].id ? 'Excluindo...' : 'Excluir Foto'}
                    </button>
                  </div>

                  {/* Setas de Navegação */}
                  {veiculo.fotos.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={prevPhoto}
                        style={{
                          position: 'absolute',
                          left: '14px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          zIndex: 8,
                          width: '42px',
                          height: '42px',
                          borderRadius: '50%',
                          background: 'rgba(0,0,0,0.65)',
                          color: '#fff',
                          border: '1px solid rgba(255,255,255,0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          backdropFilter: 'blur(4px)',
                          transition: 'all 0.15s'
                        }}
                        title="Foto anterior"
                      >
                        <ChevronLeft size={24} />
                      </button>
                      <button
                        type="button"
                        onClick={nextPhoto}
                        style={{
                          position: 'absolute',
                          right: '14px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          zIndex: 8,
                          width: '42px',
                          height: '42px',
                          borderRadius: '50%',
                          background: 'rgba(0,0,0,0.65)',
                          color: '#fff',
                          border: '1px solid rgba(255,255,255,0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          backdropFilter: 'blur(4px)',
                          transition: 'all 0.15s'
                        }}
                        title="Próxima foto"
                      >
                        <ChevronRight size={24} />
                      </button>
                    </>
                  )}

                  {/* Imagem em Destaque */}
                  <img
                    src={resolvePhotoUrl(veiculo.fotos[currentPhotoIndex].url)}
                    alt={`Foto ${currentPhotoIndex + 1}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain'
                    }}
                  />

                  {/* Indicador de Posição Flutuante no Rodapé */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '12px',
                      background: 'rgba(0,0,0,0.7)',
                      color: '#e2e8f0',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '0.8rem',
                      fontWeight: 500,
                      backdropFilter: 'blur(4px)',
                      border: '1px solid rgba(255,255,255,0.1)'
                    }}
                  >
                    {currentPhotoIndex + 1} de {veiculo.fotos.length}
                  </div>
                </div>

                {/* Faixa de Miniaturas (Thumbnails) abaixo da imagem, em linha separada */}
                {veiculo.fotos.length > 1 && (
                  <div style={{ marginTop: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--color-gray-400)', fontWeight: 500 }}>
                        Clique para selecionar ou excluir:
                      </span>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        gap: '10px',
                        overflowX: 'auto',
                        paddingBottom: '6px',
                        scrollbarWidth: 'thin'
                      }}
                    >
                      {veiculo.fotos.map((f, idx) => {
                        const isCurrent = idx === currentPhotoIndex;
                        return (
                          <div
                            key={f.id || idx}
                            onClick={() => setCurrentPhotoIndex(idx)}
                            style={{
                              position: 'relative',
                              width: '84px',
                              height: '60px',
                              borderRadius: '8px',
                              overflow: 'hidden',
                              flexShrink: 0,
                              cursor: 'pointer',
                              border: isCurrent ? '2px solid var(--color-primary)' : '1px solid rgba(255,255,255,0.15)',
                              boxShadow: isCurrent ? '0 0 10px rgba(59, 130, 246, 0.5)' : 'none',
                              opacity: isCurrent ? 1 : 0.6,
                              transform: isCurrent ? 'scale(1.04)' : 'scale(1)',
                              transition: 'all 0.15s ease'
                            }}
                            title={`Foto ${idx + 1}${f.isPrincipal ? ' (Capa)' : ''}`}
                          >
                            <img
                              src={resolvePhotoUrl(f.url)}
                              alt={`Miniatura ${idx + 1}`}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />

                            {/* Badge de Principal na Miniatura */}
                            {f.isPrincipal && (
                              <span
                                style={{
                                  position: 'absolute',
                                  bottom: '3px',
                                  left: '3px',
                                  background: 'rgba(16, 185, 129, 0.95)',
                                  borderRadius: '4px',
                                  padding: '1px 5px',
                                  fontSize: '0.62rem',
                                  color: '#fff',
                                  fontWeight: 'bold',
                                  boxShadow: '0 1px 4px rgba(0,0,0,0.5)'
                                }}
                              >
                                ★ Capa
                              </span>
                            )}

                            {/* Botão de Lixeira em Cada Miniatura */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoverFoto(f.id);
                              }}
                              disabled={deletingPhotoId === f.id}
                              style={{
                                position: 'absolute',
                                top: '3px',
                                right: '3px',
                                background: 'rgba(239, 68, 68, 0.9)',
                                border: 'none',
                                borderRadius: '4px',
                                color: '#fff',
                                width: '22px',
                                height: '22px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
                                transition: 'background 0.15s'
                              }}
                              title="Excluir esta foto"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={20} color="var(--color-blue-light)" />
              Ficha Técnica do Veículo
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', fontSize: '0.85rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ color: 'var(--color-gray-400)', fontSize: '0.72rem', display: 'block', textTransform: 'uppercase' }}>Versão</span>
                <strong style={{ color: '#fff', fontSize: '0.9rem' }}>{veiculo.versao || 'Padrão'}</strong>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ color: 'var(--color-gray-400)', fontSize: '0.72rem', display: 'block', textTransform: 'uppercase' }}>Câmbio</span>
                <strong style={{ color: '#fff', fontSize: '0.9rem' }}>{veiculo.cambio || 'Automático'}</strong>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ color: 'var(--color-gray-400)', fontSize: '0.72rem', display: 'block', textTransform: 'uppercase' }}>Combustível</span>
                <strong style={{ color: '#fff', fontSize: '0.9rem' }}>{veiculo.combustivel || 'Flex'}</strong>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ color: 'var(--color-gray-400)', fontSize: '0.72rem', display: 'block', textTransform: 'uppercase' }}>Quilometragem</span>
                <strong style={{ color: '#fff', fontSize: '0.9rem' }}>{veiculo.quilometragem ? `${veiculo.quilometragem.toLocaleString('pt-BR')} km` : '0 km'}</strong>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ color: 'var(--color-gray-400)', fontSize: '0.72rem', display: 'block', textTransform: 'uppercase' }}>Cor</span>
                <strong style={{ color: '#fff', fontSize: '0.9rem' }}>{veiculo.cor || 'Não informada'}</strong>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ color: 'var(--color-gray-400)', fontSize: '0.72rem', display: 'block', textTransform: 'uppercase' }}>Renavam</span>
                <strong style={{ color: '#fff', fontSize: '0.9rem' }}>{veiculo.renavam || 'Não informado'}</strong>
              </div>
            </div>

            <div style={{ marginTop: '16px', background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ color: 'var(--color-gray-400)', fontSize: '0.72rem', textTransform: 'uppercase' }}>Observações Técnicas / Inspeção Comercial</span>
                {!editandoObs && (
                  <button 
                    type="button" 
                    onClick={() => { setTextoObs(veiculo.observacoes || ''); setEditandoObs(true); }}
                    className="btn"
                    style={{ padding: '4px 10px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)', cursor: 'pointer' }}
                    title="Editar observações técnicas do veículo"
                  >
                    <Edit2 size={12} /> Editar
                  </button>
                )}
              </div>

              {editandoObs ? (
                <div>
                  <textarea
                    className="form-input"
                    rows={4}
                    value={textoObs}
                    onChange={e => setTextoObs(e.target.value)}
                    placeholder="Descreva detalhes de pintura, mecânica, garantia de fábrica, pneus, histórico ou avarias..."
                    style={{ width: '100%', fontSize: '0.85rem', lineHeight: 1.5, resize: 'vertical', background: 'rgba(15, 23, 42, 0.9)' }}
                    autoFocus
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                    <button 
                      type="button" 
                      onClick={() => setEditandoObs(false)}
                      disabled={salvandoObs}
                      className="btn"
                      style={{ padding: '6px 12px', fontSize: '0.8rem', background: 'rgba(255,255,255,0.05)', cursor: 'pointer' }}
                    >
                      <X size={13} /> Cancelar
                    </button>
                    <button 
                      type="button" 
                      onClick={handleSalvarObs}
                      disabled={salvandoObs}
                      className="btn btn-primary"
                      style={{ padding: '6px 14px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                    >
                      <Check size={14} /> {salvandoObs ? 'Salvando...' : 'Salvar Observações'}
                    </button>
                  </div>
                </div>
              ) : (
                <p style={{ color: '#cbd5e1', fontSize: '0.85rem', margin: 0, lineHeight: 1.5 }}>
                  {veiculo.observacoes || 'Nenhuma observação técnica registrada. Veículo em conformidade para o estoque.'}
                </p>
              )}
            </div>
          </div>

        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={20} color="var(--color-blue-light)" />
                Documentos & PDFs
              </h3>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  className="btn"
                  onClick={() => setShowModalDossiePdf(true)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '0.82rem', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)' }}
                >
                  <FileDown size={14} /> Ficha em PDF
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => setShowModalUpload(true)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '0.82rem' }}
                >
                  <Upload size={14} /> Upload PDF/Doc
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {veiculo.documentos.map(doc => {
                const isPdf = doc.nomeArquivo?.toLowerCase().endsWith('.pdf') || doc.tipoDocumento?.toLowerCase().includes('pdf');
                const fileUrl = `${API_BASE_URL.replace('/api', '')}${doc.url}`;
                return (
                  <div key={doc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '6px',
                        background: isPdf ? 'rgba(239, 68, 68, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                        border: `1px solid ${isPdf ? 'rgba(239, 68, 68, 0.3)' : 'rgba(56, 189, 248, 0.3)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        {isPdf ? (
                          <span style={{ fontSize: '0.65rem', fontWeight: 'bold', color: '#ef4444' }}>PDF</span>
                        ) : (
                          <FileText size={18} color="#38bdf8" />
                        )}
                      </div>
                      <div style={{ minWidth: 0, overflow: 'hidden' }}>
                        <div style={{ fontWeight: 500, fontSize: '0.9rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                          {doc.tipoDocumento}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--color-gray-400)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                          {doc.nomeArquivo}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      <a
                        href={fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn"
                        title="Visualizar documento"
                        style={{ padding: '6px 10px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.06)' }}
                      >
                        <Eye size={14} /> Ver
                      </a>
                      <a
                        href={fileUrl}
                        download={doc.nomeArquivo}
                        className="btn"
                        title="Baixar arquivo"
                        style={{ padding: '6px 10px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.06)' }}
                      >
                        <Download size={14} />
                      </a>
                      <button
                        onClick={() => handleDeleteDoc(doc.id, doc.tipoDocumento || doc.nomeArquivo)}
                        className="btn"
                        title="Excluir documento"
                        style={{ padding: '6px 10px', fontSize: '0.8rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
              {veiculo.documentos.length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--color-gray-400)', fontSize: '0.9rem', padding: '20px 0', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '8px' }}>
                  Nenhum documento ou PDF anexado ainda.
                  <div style={{ marginTop: '10px' }}>
                    <button
                      onClick={() => setShowModalUpload(true)}
                      className="btn"
                      style={{ fontSize: '0.82rem', padding: '6px 14px', background: 'rgba(255,255,255,0.06)' }}
                    >
                      + Anexar Documento PDF
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <DollarSign size={20} color="var(--color-warning)" /> Custos Adicionais
            </h3>
            <form onSubmit={handleAddCusto} style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
              <input className="form-input" style={{ flex: 2, paddingLeft: '12px' }} placeholder="Ex: Lavagem" value={descCusto} onChange={e => setDescCusto(e.target.value)} required />
              <input className="form-input" style={{ flex: 1, paddingLeft: '12px' }} placeholder="R$ 0,00" value={valorCusto} onChange={e => setValorCusto(e.target.value)} required />
              <button type="submit" className="btn btn-primary">Lançar</button>
            </form>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--color-gray-400)', textAlign: 'left' }}>
                  <th style={{ padding: '12px 8px' }}>Descrição</th>
                  <th style={{ padding: '12px 8px' }}>Data</th>
                  <th style={{ padding: '12px 8px', textAlign: 'right' }}>Valor</th>
                </tr>
              </thead>
              <tbody>
                {veiculo.custos.map(custo => (
                  <tr key={custo.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <td style={{ padding: '12px 8px' }}>{custo.descricao}</td>
                    <td style={{ padding: '12px 8px', color: 'var(--color-gray-400)' }}>{new Date(custo.dataCusto).toLocaleDateString('pt-BR')}</td>
                    <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 500, color: '#fca5a5' }}>
                      - R$ {custo.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
                {veiculo.custos.length === 0 && (
                  <tr><td colSpan={3} style={{ padding: '24px', textAlign: 'center', color: 'var(--color-gray-400)' }}>Nenhum custo lançado.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={20} /> Histórico
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {veiculo.historico.map(hist => (
                <div key={hist.id} style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--color-blue)', marginTop: '4px' }}></div>
                    <div style={{ width: '2px', flex: 1, background: 'var(--glass-border)', marginTop: '4px' }}></div>
                  </div>
                  <div style={{ paddingBottom: '16px' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-gray-400)', marginBottom: '4px' }}>
                      {new Date(hist.dataAlteracao).toLocaleString('pt-BR')}
                    </div>
                    <div style={{ fontWeight: 500, fontSize: '0.95rem' }}>
                      Status alterado de {hist.statusAnterior} para <span style={{ color: 'var(--color-blue-light)' }}>{hist.statusNovo}</span>
                    </div>
                    {hist.observacao && (
                      <div style={{ fontSize: '0.85rem', color: 'var(--color-gray-400)', marginTop: '4px' }}>{hist.observacao}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Modal para Upload de Documento / PDF */}
      {showModalUpload && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px'
        }}>
          <div className="glass-panel" style={{
            maxWidth: '520px',
            width: '100%',
            padding: '28px',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={20} color="#38bdf8" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Anexar Documento / PDF</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-gray-400)', margin: 0 }}>Vincular CRLV, Laudo ou Contrato ao veículo</p>
                </div>
              </div>
              <button
                onClick={() => setShowModalUpload(false)}
                className="btn"
                style={{ padding: '6px', background: 'transparent', border: 'none', color: 'var(--color-gray-400)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleConfirmUploadDoc} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', fontWeight: 500, color: 'var(--color-gray-300)' }}>
                  Tipo do Documento
                </label>
                <select
                  className="form-input"
                  value={tipoDocumento}
                  onChange={(e) => setTipoDocumento(e.target.value)}
                  style={{ width: '100%', cursor: 'pointer' }}
                >
                  <option value="CRLV Digital (PDF)">CRLV Digital (PDF)</option>
                  <option value="Laudo Cautelar / Vistoria (PDF)">Laudo Cautelar / Vistoria (PDF)</option>
                  <option value="Nota Fiscal de Entrada/Saída">Nota Fiscal (NFe)</option>
                  <option value="Contrato de Compra e Venda">Contrato de Compra e Venda</option>
                  <option value="Procuração / ATPV-e">Procuração / ATPV-e</option>
                  <option value="Comprovante de Pagamento">Comprovante de Pagamento</option>
                  <option value="Outro Documento">Outro Documento</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', fontWeight: 500, color: 'var(--color-gray-300)' }}>
                  Arquivo (PDF ou Imagem)
                </label>
                <div style={{
                  border: '2px dashed rgba(255, 255, 255, 0.15)',
                  borderRadius: '10px',
                  padding: '24px 16px',
                  textAlign: 'center',
                  background: 'rgba(255, 255, 255, 0.02)',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s'
                }}>
                  <input
                    type="file"
                    id="modal-file-doc"
                    accept=".pdf,application/pdf,image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setArquivoDoc(e.target.files[0]);
                      }
                    }}
                  />
                  <label htmlFor="modal-file-doc" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <Upload size={28} color="#38bdf8" />
                    {arquivoDoc ? (
                      <div>
                        <div style={{ fontWeight: 600, color: '#38bdf8' }}>{arquivoDoc.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-400)', marginTop: '2px' }}>
                          {(arquivoDoc.size / (1024 * 1024)).toFixed(2)} MB • Clique para trocar
                        </div>
                      </div>
                    ) : (
                      <div>
                        <span style={{ fontWeight: 500, color: '#fff' }}>Clique para selecionar o PDF ou imagem</span>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-400)', marginTop: '4px' }}>
                          Suporta arquivos .PDF, .JPG, .PNG de até 20MB
                        </div>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                <button
                  type="button"
                  className="btn"
                  onClick={() => { setShowModalUpload(false); setArquivoDoc(null); }}
                  disabled={uploadingDoc}
                  style={{ background: 'rgba(255, 255, 255, 0.05)' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!arquivoDoc || uploadingDoc}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  {uploadingDoc ? 'Enviando...' : 'Salvar Documento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal / Visualização de Impressão / Salvar PDF do Veículo */}
      {showModalDossiePdf && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          {/* Barra superior de ações */}
          <div className="print-hidden" style={{
            maxWidth: '850px',
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
            background: 'rgba(15, 23, 42, 0.9)',
            padding: '12px 20px',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FileDown size={20} color="#38bdf8" />
              <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Visualização para Impressão & Exportação PDF</span>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => window.print()}
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 18px', fontSize: '0.9rem', background: '#2563eb' }}
              >
                <Printer size={16} /> Imprimir / Salvar como PDF
              </button>
              <button
                onClick={() => setShowModalDossiePdf(false)}
                className="btn"
                style={{ padding: '8px 14px', fontSize: '0.9rem', background: 'rgba(255,255,255,0.1)' }}
              >
                <X size={16} /> Fechar
              </button>
            </div>
          </div>

          {/* Documento A4 Estilizado */}
          <div style={{
            maxWidth: '850px',
            width: '100%',
            maxHeight: '85vh',
            overflowY: 'auto',
            background: '#ffffff',
            color: '#1e293b',
            padding: '40px',
            borderRadius: '8px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)',
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }} className="dossie-printable">
            {/* Cabeçalho do Dossiê */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #0284c7', paddingBottom: '16px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img src={logoImg} alt="Gravity Car System" style={{ height: '48px', objectFit: 'contain' }} />
                <div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>GRAVITY CAR SYSTEM</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Gestão Integrada de Frotas & Veículos</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0284c7' }}>FICHA TÉCNICA DO PRODUTO</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Data: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
            </div>

            {/* Dados do Veículo */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0' }}>
                  {veiculo.marca} {veiculo.modelo}
                </h2>
                <div style={{ display: 'inline-block', background: '#f1f5f9', padding: '4px 10px', borderRadius: '4px', fontWeight: 700, fontSize: '0.9rem', color: '#0f172a', marginBottom: '16px' }}>
                  PLACA: {veiculo.placa}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.85rem' }}>
                  <div><strong style={{ color: '#64748b' }}>Ano Fab/Mod:</strong> {veiculo.anoFabricacao} / {veiculo.anoModelo}</div>
                  <div><strong style={{ color: '#64748b' }}>Status:</strong> {getStatusLabel(veiculo.status)}</div>
                  <div><strong style={{ color: '#64748b' }}>Renavam:</strong> {veiculo.renavam || 'Não informado'}</div>
                  <div><strong style={{ color: '#64748b' }}>Chassi:</strong> {veiculo.chassi || 'Não informado'}</div>
                  <div><strong style={{ color: '#64748b' }}>Quilometragem:</strong> {veiculo.quilometragem ? `${veiculo.quilometragem.toLocaleString('pt-BR')} km` : 'Não informada'}</div>
                  <div><strong style={{ color: '#64748b' }}>Cor:</strong> {veiculo.cor || 'Não informada'}</div>
                  <div><strong style={{ color: '#64748b' }}>Combustível:</strong> {veiculo.combustivel || 'Flex'}</div>
                  <div><strong style={{ color: '#64748b' }}>Câmbio:</strong> {veiculo.cambio || 'Automático'}</div>
                </div>
              </div>

              {/* Preço e Foto Principal */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Valor de Venda</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0284c7', margin: '4px 0 12px 0' }}>
                  R$ {veiculo.valorVenda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                {veiculo.fotos && veiculo.fotos.length > 0 ? (
                  <img
                    src={resolvePhotoUrl(veiculo.fotos[0].url)}
                    alt="Foto do Veículo"
                    style={{ width: '100%', height: '110px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                ) : (
                  <div style={{ width: '100%', height: '110px', background: '#e2e8f0', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.8rem' }}>
                    Sem foto
                  </div>
                )}
              </div>
            </div>

            {/* Ficha Técnica & Inspeção */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>🛡️</span> Ficha Técnica & Inspeção
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', fontSize: '0.8rem' }}>
                <div style={{ background: '#ffffff', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <div style={{ color: '#64748b', fontSize: '0.7rem' }}>CONDIÇÃO</div>
                  <div style={{ fontWeight: 700, color: '#16a34a' }}>
                    SEMINOVO
                  </div>
                </div>
                <div style={{ background: '#ffffff', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <div style={{ color: '#64748b', fontSize: '0.7rem' }}>PINTURA</div>
                  <div style={{ fontWeight: 700, color: '#16a34a' }}>
                    ORIGINAL
                  </div>
                </div>
                <div style={{ background: '#ffffff', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <div style={{ color: '#64748b', fontSize: '0.7rem' }}>MECÂNICA</div>
                  <div style={{ fontWeight: 700, color: '#16a34a' }}>
                    REVISADO
                  </div>
                </div>
                <div style={{ background: '#ffffff', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <div style={{ color: '#64748b', fontSize: '0.7rem' }}>DOCUMENTAÇÃO</div>
                  <div style={{ fontWeight: 700, color: '#16a34a' }}>
                    REGULARIZADA
                  </div>
                </div>
              </div>
            </div>

            {/* Documentos Anexados */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a', marginBottom: '8px' }}>
                Documentos Vinculados ({veiculo.documentos.length})
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', border: '1px solid #e2e8f0' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', textAlign: 'left', color: '#475569' }}>
                    <th style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>Tipo do Documento</th>
                    <th style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>Nome do Arquivo</th>
                    <th style={{ padding: '8px', borderBottom: '1px solid #e2e8f0', textAlign: 'center' }}>Formato</th>
                  </tr>
                </thead>
                <tbody>
                  {veiculo.documentos.map(doc => (
                    <tr key={doc.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '8px', fontWeight: 600 }}>{doc.tipoDocumento}</td>
                      <td style={{ padding: '8px', color: '#64748b' }}>{doc.nomeArquivo}</td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        {doc.nomeArquivo?.toLowerCase().endsWith('.pdf') ? 'PDF' : 'IMAGEM'}
                      </td>
                    </tr>
                  ))}
                  {veiculo.documentos.length === 0 && (
                    <tr>
                      <td colSpan={3} style={{ padding: '12px', textAlign: 'center', color: '#94a3b8' }}>Nenhum documento físico/digital arquivado.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Custos e Manutenção */}
            <div style={{ marginBottom: '32px' }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a', marginBottom: '8px' }}>
                Custos de Preparação & Serviços Realizados
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', border: '1px solid #e2e8f0' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', textAlign: 'left', color: '#475569' }}>
                    <th style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>Descrição</th>
                    <th style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>Data</th>
                    <th style={{ padding: '8px', borderBottom: '1px solid #e2e8f0', textAlign: 'right' }}>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {veiculo.custos.map(custo => (
                    <tr key={custo.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '8px' }}>{custo.descricao}</td>
                      <td style={{ padding: '8px', color: '#64748b' }}>{new Date(custo.dataCusto).toLocaleDateString('pt-BR')}</td>
                      <td style={{ padding: '8px', textAlign: 'right', fontWeight: 600 }}>
                        R$ {custo.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                  <tr style={{ background: '#f8fafc', fontWeight: 700 }}>
                    <td colSpan={2} style={{ padding: '8px' }}>Total de Investimento em Preparação:</td>
                    <td style={{ padding: '8px', textAlign: 'right', color: '#0284c7' }}>
                      R$ {totalCustos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Responsáveis Técnicos */}
            <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px dashed #cbd5e1' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', textAlign: 'center' }}>
                <div>
                  <div style={{ borderTop: '1px solid #0f172a', margin: '30px auto 8px auto', width: '80%' }}></div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>Responsável Técnico / Estoque</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Conferência e Inspeção</div>
                </div>
                <div>
                  <div style={{ borderTop: '1px solid #0f172a', margin: '30px auto 8px auto', width: '80%' }}></div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>Gerência de Vendas / Pátio</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Gravity Car System</div>
                </div>
              </div>
            </div>

            {/* Rodapé da Ficha Técnica */}
            <div style={{ marginTop: '30px', textAlign: 'center', fontSize: '0.72rem', color: '#64748b', borderTop: '1px solid #e2e8f0', paddingTop: '12px', lineHeight: 1.5 }}>
              <div><strong>GRAVITY CAR SYSTEM • FICHA TÉCNICA DO PRODUTO & ESPECIFICAÇÕES DE ESTOQUE</strong></div>
              <div style={{ marginTop: '4px', color: '#94a3b8' }}>
                Documento gerado para controle interno de pátio, ficha de apresentação comercial e especificação das características do veículo.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VeiculoDetalhesPage;
