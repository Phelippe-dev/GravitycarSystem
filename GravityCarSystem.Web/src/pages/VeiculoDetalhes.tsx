import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, FileText, DollarSign, Clock, ChevronLeft, ChevronRight, ShieldAlert, CheckCircle, AlertTriangle } from 'lucide-react';
import {
  getVeiculoDetalhes,
  uploadFotoVeiculo,
  uploadDocumentoVeiculo,
  adicionarCustoVeiculo,
  consultarSenatran,
  registrarEntradaRenave,
  API_BASE_URL
} from '../api';
import type { VeiculoDetalhes, SenatranVeiculoResultDto } from '../api';

const VeiculoDetalhesPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [veiculo, setVeiculo] = useState<VeiculoDetalhes | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [descCusto, setDescCusto] = useState('');
  const [valorCusto, setValorCusto] = useState('');
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  // Estados Senatran
  const [dossie, setDossie] = useState<SenatranVeiculoResultDto | null>(null);
  const [loadingSenatran, setLoadingSenatran] = useState(false);

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

  const handleConsultarSenatran = async () => {
    if (!veiculo?.placa) return;
    setLoadingSenatran(true);
    const result = await consultarSenatran(veiculo.placa, veiculo.renavam || '');
    if (result) {
        setDossie(result);
    } else {
        alert('Erro ao comunicar com a base da SENATRAN.');
    }
    setLoadingSenatran(false);
  };

  const handleEntradaRenave = async () => {
    if (!id) return;
    setLoadingSenatran(true);
    const sucesso = await registrarEntradaRenave(id);
    if (sucesso) {
        alert('Veículo registrado no RENAVE com sucesso!');
        handleConsultarSenatran(); // Recarrega dossiê para atualizar status (mockado)
    } else {
        alert('Falha ao registrar entrada no RENAVE.');
    }
    setLoadingSenatran(false);
  };

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

  const handleUploadDoc = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !id) return;
    try {
      const tipo = prompt('Qual o tipo de documento? (CRLV, Recibo, NFe, Outro)', 'Outro');
      if (!tipo) return;
      await uploadDocumentoVeiculo(id, e.target.files[0], tipo);
      carregarVeiculo();
    } catch (err) {
      alert('Erro ao fazer upload do documento.');
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
    } catch (err) {
      alert('Erro ao lançar custo.');
    }
  };

  if (loading && !veiculo) return <div style={{ padding: '24px' }}>Carregando detalhes...</div>;
  if (error || !veiculo) return <div style={{ padding: '24px', color: 'var(--color-danger)' }}>{error || 'Veículo não encontrado'}</div>;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', padding: '24px' }}>
      <header className="page-header" style={{ marginBottom: '32px' }}>
        <button className="btn" onClick={() => navigate('/estoque')} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '16px', background: 'transparent', padding: 0 }}>
          <ArrowLeft size={20} /> Voltar ao Estoque
        </button>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className="page-title">{veiculo.marca} {veiculo.modelo}</h1>
            <p style={{ color: 'var(--color-gray-400)', fontSize: '1.1rem', marginTop: '4px' }}>
              Placa: {veiculo.placa} • {veiculo.anoFabricacao}/{veiculo.anoModelo}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-blue-light)' }}>
              R$ {veiculo.valorVenda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div className={veiculo.status === 0 ? 'badge badge-success' : 'badge badge-warning'} style={{ marginTop: '8px' }}>
              {veiculo.status === 0 ? 'Disponível' : veiculo.status === 1 ? 'Vendido' : 'Manutenção'}
            </div>
          </div>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Galeria</h3>
              <div>
                <input type="file" id="upload-foto" hidden multiple accept="image/*" onChange={handleUploadFoto} />
                <label htmlFor="upload-foto" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '8px 16px', fontSize: '0.9rem' }}>
                  <Upload size={16} /> Add Fotos
                </label>
              </div>
            </div>
            {veiculo.fotos.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-gray-400)', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                Nenhuma foto cadastrada.
              </div>
            ) : (
              <div className="carousel-container">
                <div style={{ position: 'relative', width: '100%', height: '350px', background: '#000', borderRadius: '8px', overflow: 'hidden' }}>
                  {veiculo.fotos.length > 1 && (
                    <button className="carousel-btn left" onClick={prevPhoto}>
                      <ChevronLeft size={24} />
                    </button>
                  )}
                  <img 
                    src={`${API_BASE_URL.replace('/api', '')}${veiculo.fotos[currentPhotoIndex].url}`} 
                    alt={`Foto ${currentPhotoIndex + 1}`} 
                    className="carousel-img"
                  />
                  {veiculo.fotos[currentPhotoIndex].isPrincipal && (
                    <span className="badge badge-success" style={{ position: 'absolute', top: '16px', right: '16px' }}>Principal</span>
                  )}
                  {veiculo.fotos.length > 1 && (
                    <button className="carousel-btn right" onClick={nextPhoto}>
                      <ChevronRight size={24} />
                    </button>
                  )}
                </div>
                <div style={{ textAlign: 'center', marginTop: '8px', color: 'var(--color-gray-400)', fontSize: '0.9rem' }}>
                  {currentPhotoIndex + 1} de {veiculo.fotos.length}
                </div>
              </div>
            )}
          </div>

          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={20} color="var(--color-blue-light)" />
              Dossiê SENATRAN
            </h3>
            
            {!dossie ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                    <p style={{ color: 'var(--color-gray-400)', marginBottom: '16px' }}>Nenhuma consulta realizada para esta placa.</p>
                    <button className="btn btn-primary" onClick={handleConsultarSenatran} disabled={loadingSenatran}>
                        {loadingSenatran ? 'Consultando Bases...' : 'Consultar Base Nacional'}
                    </button>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--color-gray-400)' }}>Status RENAVE</div>
                            <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', color: dossie.statusRenave === 'NÃO REGISTRADO' ? 'var(--color-warning)' : 'var(--color-success)' }}>
                                {dossie.statusRenave === 'NÃO REGISTRADO' ? <AlertTriangle size={16}/> : <CheckCircle size={16}/>}
                                {dossie.statusRenave}
                            </div>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--color-gray-400)' }}>Débitos Pendentes</div>
                            <div style={{ fontWeight: 'bold', color: dossie.totalDebitosPendentes > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(dossie.totalDebitosPendentes)}
                            </div>
                        </div>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '0.85rem' }}>
                        <div style={{ padding: '8px', background: dossie.possuiRestricaoRouboFurto ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', border: `1px solid ${dossie.possuiRestricaoRouboFurto ? 'var(--color-danger)' : 'var(--color-success)'}`, borderRadius: '4px', textAlign: 'center' }}>
                            <strong>Roubo/Furto:</strong><br/>{dossie.possuiRestricaoRouboFurto ? 'SIM' : 'NÃO'}
                        </div>
                        <div style={{ padding: '8px', background: dossie.possuiRestricaoJudicial ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', border: `1px solid ${dossie.possuiRestricaoJudicial ? 'var(--color-danger)' : 'var(--color-success)'}`, borderRadius: '4px', textAlign: 'center' }}>
                            <strong>Judicial:</strong><br/>{dossie.possuiRestricaoJudicial ? 'SIM' : 'NÃO'}
                        </div>
                        <div style={{ padding: '8px', background: dossie.possuiAlienacaoFiduciaria ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)', border: `1px solid ${dossie.possuiAlienacaoFiduciaria ? 'var(--color-warning)' : 'var(--color-success)'}`, borderRadius: '4px', textAlign: 'center' }}>
                            <strong>Alienação:</strong><br/>{dossie.possuiAlienacaoFiduciaria ? 'SIM' : 'NÃO'}
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                        <button className="btn" onClick={handleConsultarSenatran} disabled={loadingSenatran} style={{ flex: 1 }}>Atualizar</button>
                        {dossie.statusRenave === 'NÃO REGISTRADO' && (
                            <button className="btn btn-primary" onClick={handleEntradaRenave} disabled={loadingSenatran} style={{ flex: 1 }}>
                                Dar Entrada RENAVE
                            </button>
                        )}
                    </div>
                </div>
            )}
          </div>

        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={20} color="var(--color-blue-light)" />
                Documentos
              </h3>
              <div>
                <input type="file" id="upload-doc" hidden accept=".pdf,image/*" onChange={handleUploadDoc} />
                <label htmlFor="upload-doc" className="btn" style={{ padding: '6px 12px', fontSize: '0.85rem', background: 'rgba(255,255,255,0.05)' }}>
                  Upload
                </label>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {veiculo.documentos.map(doc => (
                <div key={doc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <FileText size={24} color="var(--color-gray-400)" />
                    <div>
                      <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{doc.tipoDocumento}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-gray-400)' }}>{doc.nomeArquivo}</div>
                    </div>
                  </div>
                  <a href={`${API_BASE_URL.replace('/api', '')}${doc.url}`} target="_blank" rel="noreferrer" style={{ color: 'var(--color-blue-light)', textDecoration: 'none', fontSize: '0.85rem' }}>Ver</a>
                </div>
              ))}
              {veiculo.documentos.length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--color-gray-400)', fontSize: '0.9rem' }}>Nenhum documento salvo.</div>
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
    </div>
  );
};

export default VeiculoDetalhesPage;
