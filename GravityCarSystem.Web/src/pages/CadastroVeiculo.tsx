import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adicionarVeiculo } from '../api';
import type { Veiculo } from '../api';
import { buscarMarcasFipe, buscarModelosFipe, buscarAnosFipe, buscarPrecoFipeCompleto, fipeValorParaNumero } from '../services/brasilapi';
import type { FipeMarca, FipeModelo } from '../services/brasilapi';
import { Search } from 'lucide-react';

const SearchableSelect = ({ options, value, onChange, placeholder, disabled = false }: { options: {label: string, value: string}[], value: string, onChange: (val: string) => void, placeholder: string, disabled?: boolean }) => {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  
  const selectedOption = options.find(o => String(o.value) === String(value));
  const displayValue = isOpen ? search : (selectedOption ? selectedOption.label : '');

  const filteredOptions = options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input 
          className="form-input" 
          style={{ width: '100%', paddingRight: '30px' }}
          placeholder={placeholder} 
          value={displayValue} 
          disabled={disabled}
          onChange={e => { setSearch(e.target.value); setIsOpen(true); }}
          onFocus={() => { setSearch(''); setIsOpen(true); }}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && isOpen && filteredOptions.length > 0) {
              e.preventDefault();
              onChange(String(filteredOptions[0].value));
              setIsOpen(false);
            }
          }}
        />
        <Search size={16} color="var(--color-gray-400)" style={{ position: 'absolute', right: '12px', pointerEvents: 'none' }} />
      </div>
      {isOpen && !disabled && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', maxHeight: '250px', overflowY: 'auto', zIndex: 50, marginTop: '4px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)' }}>
          {filteredOptions.length === 0 ? <div style={{ padding: '10px 14px', color: '#94a3b8', fontSize: '0.9rem' }}>Nenhum resultado encontrado</div> : null}
          {filteredOptions.map(o => (
            <div 
              key={o.value} 
              style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.9rem', color: '#e2e8f0', transition: 'background 0.2s' }}
              onClick={() => { onChange(String(o.value)); setIsOpen(false); }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              {o.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const CadastroVeiculo: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const formattedVal = name === 'placa' ? value.toUpperCase() : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (formattedVal === '' ? '' : Number(formattedVal)) : formattedVal
    }));
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
            Preencha os dados do veículo manualmente. Use a Consulta FIPE abaixo para buscar o valor de mercado.
          </p>
        </div>
      </header>

      {/* WIDGET FIPE REAL - BrasilAPI */}
      <div className="glass-panel" style={{ padding: '20px', marginBottom: '24px', border: '1px solid rgba(59, 130, 246, 0.25)', borderRadius: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: showFipeWidget ? '16px' : '0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.2rem' }}>📊</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', color: '#60a5fa', fontWeight: 600 }}>Consulta FIPE</h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>Selecione Marca, Modelo e Ano</p>
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
              <SearchableSelect 
                placeholder="-- Selecione a Marca --"
                value={codigoMarcaFipe}
                options={marcasFipe.map(m => ({ label: m.nome, value: String(m.valor) }))}
                onChange={async (cod) => {
                  setCodigoMarcaFipe(cod);
                  setCodigoModeloFipe('');
                  setCodigoAnoFipe('');
                  setModelosFipe([]);
                  setAnosFipe([]);
                  setFipeStatus(null);
                  if (cod) {
                    const marca = marcasFipe.find(m => String(m.valor) === cod);
                    if (marca) setFormData(prev => ({ ...prev, marca: marca.nome }));
                    const modelos = await buscarModelosFipe(1, cod);
                    setModelosFipe(modelos);
                  }
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '6px' }}>Modelo</label>
              <SearchableSelect 
                placeholder="-- Selecione o Modelo --"
                value={codigoModeloFipe}
                disabled={!codigoMarcaFipe}
                options={modelosFipe.map(m => ({ label: m.nome, value: String(m.valor) }))}
                onChange={async (cod) => {
                  setCodigoModeloFipe(cod);
                  setCodigoAnoFipe('');
                  setAnosFipe([]);
                  setFipeStatus(null);
                  if (cod) {
                    const modelo = modelosFipe.find(m => String(m.valor) === cod);
                    if (modelo) {
                      const mNome = modelo.nome;
                      
                      let combustivel = '';
                      const mLower = mNome.toLowerCase();
                      if (mLower.includes('flex')) combustivel = 'Flex';
                      else if (mLower.includes('hibrido') || mLower.includes('híbrido')) combustivel = 'Híbrido';
                      else if (mLower.includes('eletrico') || mLower.includes('elétrico')) combustivel = 'Elétrico';
                      else if (mLower.includes('diesel')) combustivel = 'Diesel';
                      else if (mLower.includes('gasolina')) combustivel = 'Gasolina';
                      else if (mLower.includes('etanol')) combustivel = 'Etanol';

                      let cambio = '';
                      if (mLower.includes('aut') || mLower.includes('cvt')) cambio = 'Automático';
                      else if (mLower.includes('man')) cambio = 'Manual';

                      setFormData(prev => ({ 
                        ...prev, 
                        modelo: mNome.split(' ')[0], // Pega a primeira palavra pro modelo geral (ex: Focus)
                        versao: mNome, // Põe o texto completo na versão
                        combustivel: combustivel || prev.combustivel,
                        cambio: cambio || prev.cambio
                      }));
                    }
                    const anos = await buscarAnosFipe(1, codigoMarcaFipe, cod);
                    setAnosFipe(anos);
                  }
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '6px' }}>Ano</label>
              <SearchableSelect 
                placeholder="-- Selecione o Ano --"
                value={codigoAnoFipe}
                disabled={!codigoModeloFipe}
                options={anosFipe.map(a => ({ label: a.nome, value: String(a.valor) }))}
                onChange={(cod) => { 
                  const val = cod;
                  setCodigoAnoFipe(val); 
                  setFipeStatus(null); 
                  
                  const anoObj = anosFipe.find(a => String(a.valor) === val);
                  if (anoObj) {
                    const nomeStr = anoObj.nome; // Ex: "2009 Gasolina" ou "2015 Diesel"
                    const anoMatch = nomeStr.match(/^(\d{4})/);
                    const anoNum = anoMatch ? parseInt(anoMatch[1], 10) : new Date().getFullYear();
                    
                    let combustivel = '';
                    const aLower = nomeStr.toLowerCase();
                    if (aLower.includes('gasolina')) combustivel = 'Gasolina';
                    else if (aLower.includes('diesel')) combustivel = 'Diesel';
                    else if (aLower.includes('etanol')) combustivel = 'Etanol';
                    else if (aLower.includes('flex')) combustivel = 'Flex';

                    setFormData(prev => ({
                      ...prev,
                      anoFabricacao: anoNum,
                      anoModelo: anoNum,
                      combustivel: combustivel || prev.combustivel
                    }));
                  }
                }}
              />
            </div>

            <div>
              <button type="button" className="btn btn-primary" disabled={!codigoAnoFipe || loadingFipe}
                style={{ height: '42px', whiteSpace: 'nowrap' }}
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
          <div style={{ marginTop: '12px', padding: '10px 16px', background: 'rgba(59,130,246,0.10)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '8px', color: '#93c5fd', fontSize: '0.85rem' }}>
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
