import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adicionarVeiculo, consultarSenatran } from '../api';
import type { Veiculo, SenatranVeiculoResultDto } from '../api';
import { buscarMarcasFipe, buscarModelosFipe, buscarAnosFipe, buscarPrecoFipeCompleto, fipeValorParaNumero } from '../services/brasilapi';
import type { FipeMarca, FipeModelo } from '../services/brasilapi';

const CadastroVeiculo: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingBusca, setLoadingBusca] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoFillSuccess, setAutoFillSuccess] = useState<string | null>(null);
  const [autoFillWarning, setAutoFillWarning] = useState<string | null>(null);
  const [detranResult, setDetranResult] = useState<SenatranVeiculoResultDto | null>(null);

  // FIPE estados
  const [marcasFipe, setMarcasFipe] = useState<FipeMarca[]>([]);
  const [modelosFipe, setModelosFipe] = useState<FipeModelo[]>([]);
  const [anosFipe, setAnosFipe] = useState<{ nome: string; valor: string }[]>([]);
  const [codigoMarcaFipe, setCodigoMarcaFipe] = useState('');
  const [codigoModeloFipe, setCodigoModeloFipe] = useState('');
  const [codigoAnoFipe, setCodigoAnoFipe] = useState('');
  const [loadingFipe, setLoadingFipe] = useState(false);
  const [fipeStatus, setFipeStatus] = useState<string | null>(null);
  const [showFipeWidget, setShowFipeWidget] = useState(true);

  useEffect(() => {
    buscarMarcasFipe(1).then(setMarcasFipe);
  }, []);

  // Campos da busca rápida no topo
  const [buscaPlaca, setBuscaPlaca] = useState('');
  const [buscaRenavam, setBuscaRenavam] = useState('');
  
  // Estado para controlar o que é exibido no input de dinheiro formatado
  const [displayValorVenda, setDisplayValorVenda] = useState<string>('');
  const [displayValorCompra, setDisplayValorCompra] = useState<string>('');

  const [formData, setFormData] = useState<Partial<Veiculo>>({
    marca: '',
    modelo: '',
    versao: '',
    anoFabricacao: new Date().getFullYear(),
    anoModelo: new Date().getFullYear(),
    valorVenda: 0,
    valorCompra: 0,
    placa: '',
    cor: '',
    combustivel: '',
    cambio: '',
    quilometragem: 0,
    renavam: '',
    chassi: '',
    status: 4
  });

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);
  };

  // Função central para buscar e autopreencher os campos por Placa ou Renavam
  const handlePuxarDados = async (placaParam?: string, renavamParam?: string) => {
    const p = (placaParam !== undefined ? placaParam : (buscaPlaca || formData.placa || '')).trim().toUpperCase();
    const r = (renavamParam !== undefined ? renavamParam : (buscaRenavam || formData.renavam || '')).trim();

    if (!p && !r) {
      setError('Por favor, informe a Placa ou o Renavam para realizar a busca automática.');
      return;
    }

    setLoadingBusca(true);
    setError(null);
    setAutoFillSuccess(null);
    setAutoFillWarning(null);

    try {
      const data = await consultarSenatran(p, r);
      if (!data) {
        throw new Error('Veículo não encontrado nas bases DETRAN / SENATRAN.');
      }

      setDetranResult(data);

      // Sincroniza campos de busca do topo
      if (data.placa) setBuscaPlaca(data.placa);
      if (data.renavam) setBuscaRenavam(data.renavam);

      // Sugestão de valores com base na FIPE
      const fipeVal = data.valorFipe || 0;
      const compraSugerida = fipeVal > 0 ? Math.round(fipeVal * 0.85) : (formData.valorCompra || 0);
      const vendaSugerida = fipeVal > 0 ? fipeVal : (formData.valorVenda || 0);

      if (compraSugerida > 0) setDisplayValorCompra(formatBRL(compraSugerida));
      if (vendaSugerida > 0) setDisplayValorVenda(formatBRL(vendaSugerida));

      // Preenche automaticamente todos os campos do formulário
      setFormData(prev => ({
        ...prev,
        marca: data.marca || prev.marca || '',
        modelo: data.modelo || prev.modelo || '',
        versao: data.versao || prev.versao || '',
        anoFabricacao: data.anoFabricacao || prev.anoFabricacao || new Date().getFullYear(),
        anoModelo: data.anoModelo || prev.anoModelo || new Date().getFullYear(),
        cor: data.cor || prev.cor || '',
        combustivel: data.combustivel || prev.combustivel || '',
        cambio: data.cambio || prev.cambio || '',
        placa: data.placa || prev.placa || '',
        renavam: data.renavam || prev.renavam || '',
        chassi: data.chassi || prev.chassi || '',
        valorCompra: compraSugerida,
        valorVenda: vendaSugerida
      }));

      setAutoFillSuccess(`✓ Veículo identificado: ${data.marcaModelo || `${data.marca} ${data.modelo}`}. Lacunas preenchidas automaticamente via ${data.origem || 'DETRAN / SENATRAN & FIPE'}!`);

      // Avisos de débitos ou restrições se houver
      const avisos: string[] = [];
      if (data.possuiRestricaoRouboFurto) avisos.push('Alerta: Consta restrição de Roubo/Furto!');
      if (data.possuiRestricaoJudicial) avisos.push('Alerta: Consta restrição Judicial/Renajud!');
      if (data.possuiAlienacaoFiduciaria) avisos.push('Consta Alienação Fiduciária ativa.');
      if (data.totalDebitosPendentes > 0) avisos.push(`Constam débitos pendentes de R$ ${formatBRL(data.totalDebitosPendentes)} (${data.descricaoDebitos || 'multas/IPVA'}).`);
      
      if (avisos.length > 0) {
        setAutoFillWarning(avisos.join(' '));
      }

    } catch (err: any) {
      setError(err.message || 'Erro ao consultar veículo pela Placa/Renavam.');
    } finally {
      setLoadingBusca(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const formattedVal = name === 'placa' ? value.toUpperCase() : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(formattedVal) : formattedVal
    }));

    if (name === 'placa') setBuscaPlaca(formattedVal);
    if (name === 'renavam') setBuscaRenavam(formattedVal);
  };

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>, isCompra: boolean = false) => {
    const rawValue = e.target.value.replace(/[^\d,]/g, '');
    if (isCompra) setDisplayValorCompra(rawValue);
    else setDisplayValorVenda(rawValue);
  };

  const handleCurrencyBlur = (displayValue: string, isCompra: boolean = false) => {
    if (!displayValue) return;
    
    let numericValue = parseFloat(displayValue.replace(/\./g, '').replace(',', '.'));
    if (isNaN(numericValue)) numericValue = 0;

    if (isCompra) {
      setFormData(prev => ({ ...prev, valorCompra: numericValue }));
      setDisplayValorCompra(formatBRL(numericValue));
    } else {
      setFormData(prev => ({ ...prev, valorVenda: numericValue }));
      setDisplayValorVenda(formatBRL(numericValue));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      await adicionarVeiculo(formData);
      navigate('/estoque'); // Redireciona para o estoque após sucesso
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao cadastrar o veículo. Verifique se o Back-end está rodando.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
      <header className="page-header" style={{ marginBottom: '20px' }}>
        <div>
          <h1 className="page-title">Cadastrar Novo Veículo</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Consulte pela Placa ou Renavam para autopreenchimento instantâneo ou informe manualmente.
          </p>
        </div>
      </header>

      {/* CARD DE CONSULTA EXPRESSA E AUTOPREENCHIMENTO */}
      <div 
        className="glass-panel" 
        style={{ 
          padding: '24px', 
          marginBottom: '28px',
          border: '1px solid rgba(59, 130, 246, 0.4)',
          background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.2) 0%, rgba(15, 23, 42, 0.7) 100%)',
          boxShadow: '0 8px 32px -4px rgba(0, 0, 0, 0.3)',
          borderRadius: '16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.4rem' }}>⚡</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#60a5fa', fontWeight: 600 }}>
                Busca Rápida por Placa ou Renavam
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
                Preenche automaticamente com dados da base da loja. Para veículos novos, use a consulta FIPE abaixo.
              </p>
            </div>
          </div>
          <span style={{ 
            fontSize: '0.75rem', 
            padding: '4px 10px', 
            borderRadius: '9999px', 
            background: 'rgba(59, 130, 246, 0.15)', 
            color: '#93c5fd', 
            border: '1px solid rgba(59, 130, 246, 0.3)',
            fontWeight: 500
          }}>
            Integração Ativa
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr)) auto', gap: '16px', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '6px', fontWeight: 500 }}>
              Placa do Veículo
            </label>
            <input 
              type="text"
              className="form-input"
              placeholder="Ex: KWT-2394 ou BRA2E19"
              value={buscaPlaca}
              maxLength={8}
              onChange={(e) => {
                const val = e.target.value.toUpperCase();
                setBuscaPlaca(val);
                setFormData(prev => ({ ...prev, placa: val }));
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handlePuxarDados();
                }
              }}
              style={{ fontWeight: 600, letterSpacing: '0.05em' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '6px', fontWeight: 500 }}>
              Renavam (opcional ou alternativo)
            </label>
            <input 
              type="text"
              className="form-input"
              placeholder="Ex: 01234567890"
              value={buscaRenavam}
              maxLength={11}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                setBuscaRenavam(val);
                setFormData(prev => ({ ...prev, renavam: val }));
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handlePuxarDados();
                }
              }}
            />
          </div>

          <div>
            <button 
              type="button" 
              className="btn btn-primary"
              onClick={() => handlePuxarDados()}
              disabled={loadingBusca || (!buscaPlaca && !buscaRenavam)}
              style={{ 
                height: '42px', 
                whiteSpace: 'nowrap', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                padding: '0 20px',
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)'
              }}
            >
              {loadingBusca ? (
                <>
                  <span className="spinner-border spinner-border-sm" style={{ width: '16px', height: '16px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 1s linear infinite' }} />
                  Puxando Dados...
                </>
              ) : (
                <>
                  <span>🔍</span> Puxar Dados Automáticos
                </>
              )}
            </button>
          </div>
        </div>

        {/* FEEDBACK DE AUTOPREENCHIMENTO */}
        {autoFillSuccess && (
          <div style={{ 
            marginTop: '16px', 
            padding: '12px 16px', 
            background: 'rgba(16, 185, 129, 0.12)', 
            border: '1px solid rgba(16, 185, 129, 0.35)', 
            borderRadius: '10px', 
            color: '#34d399', 
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <span>{autoFillSuccess}</span>
            {detranResult && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {detranResult.valorFipe && (
                  <span style={{ background: 'rgba(16, 185, 129, 0.25)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                    FIPE: R$ {formatBRL(detranResult.valorFipe)}
                  </span>
                )}
                <span style={{ background: 'rgba(59, 130, 246, 0.25)', color: '#93c5fd', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                  RENAVE: {detranResult.statusRenave || 'REGISTRADO'}
                </span>
              </div>
            )}
          </div>
        )}

        {autoFillWarning && (
          <div style={{ 
            marginTop: '10px', 
            padding: '10px 16px', 
            background: 'rgba(234, 179, 8, 0.12)', 
            border: '1px solid rgba(234, 179, 8, 0.35)', 
            borderRadius: '10px', 
            color: '#facc15', 
            fontSize: '0.825rem' 
          }}>
            ⚠️ {autoFillWarning}
          </div>
        )}
      </div>

      {/* WIDGET FIPE REAL - BrasilAPI */}
      <div className="glass-panel" style={{ padding: '20px', marginBottom: '24px', border: '1px solid rgba(139, 92, 246, 0.3)', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(15, 23, 42, 0.7) 100%)', borderRadius: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: showFipeWidget ? '16px' : '0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.2rem' }}>📊</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', color: '#a78bfa', fontWeight: 600 }}>Consulta FIPE Oficial (BrasilAPI)</h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>Selecione Marca, Modelo e Ano para buscar o valor FIPE real e oficial — gratuito, sem sair do sistema</p>
            </div>
          </div>
          <button type="button" className="btn btn-outline" style={{ fontSize: '0.8rem', padding: '6px 14px' }}
            onClick={() => setShowFipeWidget(v => !v)}>
            {showFipeWidget ? 'Fechar' : 'Abrir Consulta FIPE'}
          </button>
        </div>

        {showFipeWidget && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr)) auto', gap: '12px', alignItems: 'flex-end' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '6px' }}>Marca</label>
              <select className="form-input" value={codigoMarcaFipe}
                onChange={async (e) => {
                  const cod = e.target.value;
                  setCodigoMarcaFipe(cod);
                  setCodigoModeloFipe('');
                  setCodigoAnoFipe('');
                  setModelosFipe([]);
                  setAnosFipe([]);
                  setFipeStatus(null);
                  if (cod) {
                    const marca = marcasFipe.find(m => m.valor === cod);
                    if (marca) setFormData(prev => ({ ...prev, marca: marca.nome }));
                    const modelos = await buscarModelosFipe(1, cod);
                    setModelosFipe(modelos);
                  }
                }}>
                <option value="">-- Selecione a Marca --</option>
                {marcasFipe.map(m => <option key={m.valor} value={m.valor}>{m.nome}</option>)}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '6px' }}>Modelo</label>
              <select className="form-input" value={codigoModeloFipe} disabled={!codigoMarcaFipe}
                onChange={async (e) => {
                  const cod = e.target.value;
                  setCodigoModeloFipe(cod);
                  setCodigoAnoFipe('');
                  setAnosFipe([]);
                  setFipeStatus(null);
                  if (cod) {
                    const modelo = modelosFipe.find(m => String(m.valor) === cod);
                    if (modelo) setFormData(prev => ({ ...prev, modelo: modelo.nome }));
                    const anos = await buscarAnosFipe(1, codigoMarcaFipe, cod);
                    setAnosFipe(anos);
                  }
                }}>
                <option value="">-- Selecione o Modelo --</option>
                {modelosFipe.map(m => <option key={m.valor} value={String(m.valor)}>{m.nome}</option>)}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '6px' }}>Ano</label>
              <select className="form-input" value={codigoAnoFipe} disabled={!codigoModeloFipe}
                onChange={(e) => { setCodigoAnoFipe(e.target.value); setFipeStatus(null); }}>
                <option value="">-- Selecione o Ano --</option>
                {anosFipe.map(a => <option key={a.valor} value={a.valor}>{a.nome}</option>)}
              </select>
            </div>

            <div>
              <button type="button" className="btn btn-primary" disabled={!codigoAnoFipe || loadingFipe}
                style={{ height: '42px', whiteSpace: 'nowrap', background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', boxShadow: '0 4px 14px rgba(124,58,237,0.4)' }}
                onClick={async () => {
                  if (!codigoMarcaFipe || !codigoModeloFipe || !codigoAnoFipe) return;
                  setLoadingFipe(true);
                  setFipeStatus(null);
                  const result = await buscarPrecoFipeCompleto(1, codigoMarcaFipe, codigoModeloFipe, codigoAnoFipe);
                  setLoadingFipe(false);
                  if (result) {
                    const valorStr = result.valor || result.Valor || '';
                    const mesRef = result.mesReferencia || result.MesReferencia || '';
                    const valor = fipeValorParaNumero(valorStr);
                    const compraSugerida = Math.round(valor * 0.85);
                    setFormData(prev => ({ ...prev, valorCompra: compraSugerida, valorVenda: valor }));
                    setDisplayValorCompra(formatBRL(compraSugerida));
                    setDisplayValorVenda(formatBRL(valor));
                    setFipeStatus(`FIPE: ${valorStr} (${mesRef}) — Compra sugerida: R$ ${formatBRL(compraSugerida)}`);
                  } else {
                    setFipeStatus('Não foi possível buscar o valor FIPE para esta combinação.');
                  }
                }}>
                {loadingFipe ? '⏳ Buscando...' : '🔍 Buscar Valor FIPE'}
              </button>
            </div>
          </div>
        )}

        {fipeStatus && (
          <div style={{ marginTop: '12px', padding: '10px 16px', background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.35)', borderRadius: '8px', color: '#c4b5fd', fontSize: '0.85rem' }}>
            📊 {fipeStatus}
          </div>
        )}
      </div>

      {/* FORMULÁRIO PRINCIPAL */}
      <div className="glass-panel" style={{ padding: '32px' }}>
        {error && (
          <div style={{ padding: '16px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: '8px', marginBottom: '24px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Sessão 1: Identificação Básica */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, color: 'var(--color-blue-light)', fontSize: '1.1rem' }}>Identificação</h3>
            {formData.marca && formData.modelo && (
              <span style={{ fontSize: '0.75rem', color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '3px 8px', borderRadius: '4px', border: '1px solid rgba(16,185,129,0.3)' }}>
                Preenchido Automaticamente
              </span>
            )}
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Marca</label>
              <input type="text" name="marca" value={formData.marca} onChange={handleChange} className="form-input" placeholder="Ex: Honda" required />
            </div>
            <div className="form-group">
              <label className="form-label">Modelo</label>
              <input type="text" name="modelo" value={formData.modelo} onChange={handleChange} className="form-input" placeholder="Ex: Civic" required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Versão</label>
            <input type="text" name="versao" value={formData.versao} onChange={handleChange} className="form-input" placeholder="Ex: Touring 1.5 Turbo" required />
          </div>

          {/* Sessão 2: Detalhes Técnicos */}
          <h3 style={{ marginBottom: '16px', marginTop: '24px', color: 'var(--color-blue-light)', fontSize: '1.1rem' }}>Detalhes Técnicos</h3>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Ano Fabricação</label>
              <input type="number" name="anoFabricacao" value={formData.anoFabricacao} onChange={handleChange} className="form-input" required />
            </div>
            <div className="form-group">
              <label className="form-label">Ano Modelo</label>
              <input type="number" name="anoModelo" value={formData.anoModelo} onChange={handleChange} className="form-input" required />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Cor</label>
              <input type="text" name="cor" value={formData.cor} onChange={handleChange} className="form-input" placeholder="Ex: Prata" />
            </div>
            <div className="form-group">
              <label className="form-label">Quilometragem (km)</label>
              <input type="number" name="quilometragem" value={formData.quilometragem} onChange={handleChange} className="form-input" placeholder="Ex: 15000" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Combustível</label>
              <select name="combustivel" value={formData.combustivel} onChange={handleChange} className="form-input">
                <option value="">-- Selecione --</option>
                <option value="Flex">Flex</option>
                <option value="Gasolina">Gasolina</option>
                <option value="Etanol">Etanol</option>
                <option value="Diesel">Diesel</option>
                <option value="Elétrico">Elétrico</option>
                <option value="Híbrido">Híbrido</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Câmbio</label>
              <select name="cambio" value={formData.cambio} onChange={handleChange} className="form-input">
                <option value="">-- Selecione --</option>
                <option value="Manual">Manual</option>
                <option value="Automático">Automático</option>
              </select>
            </div>
          </div>

          {/* Sessão 3: Documentação e Financeiro */}
          <h3 style={{ marginBottom: '16px', marginTop: '24px', color: 'var(--color-blue-light)', fontSize: '1.1rem' }}>Documentação e Financeiro</h3>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Placa</label>
              <input 
                type="text" 
                name="placa" 
                value={formData.placa} 
                onChange={handleChange} 
                className="form-input" 
                placeholder="ABC-1234" 
                style={{ textTransform: 'uppercase' }}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Renavam</label>
              <input 
                type="text" 
                name="renavam" 
                value={formData.renavam} 
                onChange={handleChange} 
                className="form-input" 
                placeholder="Ex: 01234567890" 
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Chassi</label>
            <input type="text" name="chassi" value={formData.chassi} onChange={handleChange} className="form-input" placeholder="Ex: 9BW..." />
          </div>

          <div className="form-row">
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label className="form-label" style={{ margin: 0 }}>Valor de Compra (R$)</label>
                {detranResult?.valorFipe && (
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    Sugerido: ~85% FIPE
                  </span>
                )}
              </div>
              <input 
                type="text" 
                value={displayValorCompra}
                onChange={(e) => handleCurrencyChange(e, true)}
                onBlur={() => handleCurrencyBlur(displayValorCompra, true)}
                className="form-input" 
                placeholder="80.000,00" 
              />
            </div>
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label className="form-label" style={{ margin: 0 }}>Valor de Venda (R$)</label>
                {detranResult?.valorFipe && (
                  <span style={{ fontSize: '0.75rem', color: '#60a5fa' }}>
                    FIPE: R$ {formatBRL(detranResult.valorFipe)}
                  </span>
                )}
              </div>
              <input 
                type="text" 
                value={displayValorVenda}
                onChange={(e) => handleCurrencyChange(e, false)}
                onBlur={() => handleCurrencyBlur(displayValorVenda, false)}
                className="form-input" 
                placeholder="100.000,00"
                required 
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', marginTop: '32px' }}>
            <button type="button" className="btn" onClick={() => navigate('/estoque')} style={{ background: 'rgba(255,255,255,0.05)', color: 'white' }}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar e Ver Estoque'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CadastroVeiculo;
