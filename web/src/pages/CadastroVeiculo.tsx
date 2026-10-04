import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { adicionarVeiculo, atualizarVeiculo, getVeiculoDetalhes } from '../api';
import type { Veiculo } from '../api';
import { buscarMarcasFipe, buscarModelosFipe, buscarAnosFipe, buscarPrecoFipeCompleto, fipeValorParaNumero } from '../services/brasilapi';
import type { FipeMarca, FipeModelo } from '../services/brasilapi';
import { Search, Car, Bike, Truck } from 'lucide-react';

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
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tipo de veículo: 1 = Carro, 2 = Moto, 7 = Utilitário
  const [tipoVeiculo, setTipoVeiculo] = useState<number>(1);

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

  // Carrega marcas FIPE baseado no tipo de veículo selecionado (1=carros, 2=motos, 3=caminhoes/utilitarios)
  useEffect(() => {
    const fipeTipoParam: 1 | 2 | 3 = tipoVeiculo === 2 ? 2 : tipoVeiculo === 7 ? 3 : 1;
    setLoadingFipe(true);
    setCodigoMarcaFipe('');
    setCodigoModeloFipe('');
    setCodigoAnoFipe('');
    setModelosFipe([]);
    setAnosFipe([]);
    buscarMarcasFipe(fipeTipoParam)
      .then(setMarcasFipe)
      .finally(() => setLoadingFipe(false));
  }, [tipoVeiculo]);

  // Estado para controlar o que é exibido no input de dinheiro formatado
  const [displayValorVenda, setDisplayValorVenda] = useState<string>('');
  const [displayValorCompra, setDisplayValorCompra] = useState<string>('');

  const [formData, setFormData] = useState<Partial<Veiculo>>({
    tipoVeiculo: 1,
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
    status: 4,
    consignado: false,
    cilindrada: undefined,
    categoriaMoto: undefined,
    partida: undefined,
    refrigeracao: undefined,
    codigoFipe: '',
    valorFipe: undefined,
    mesReferenciaFipe: ''
  });

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);
  };

  useEffect(() => {
    if (isEditing) {
      setLoading(true);
      getVeiculoDetalhes(id).then(v => {
        setFormData({
            tipoVeiculo: v.tipoVeiculo || 1,
            marca: v.marca,
            modelo: v.modelo,
            versao: v.versao,
            anoFabricacao: v.anoFabricacao,
            anoModelo: v.anoModelo,
            valorVenda: v.valorVenda,
            valorCompra: v.valorCompra,
            placa: v.placa,
            cor: v.cor,
            combustivel: v.combustivel,
            cambio: v.cambio,
            quilometragem: v.quilometragem,
            renavam: v.renavam,
            chassi: v.chassi,
            status: v.status,
            consignado: v.consignado || false,
            cilindrada: v.cilindrada,
            categoriaMoto: v.categoriaMoto,
            partida: v.partida,
            refrigeracao: v.refrigeracao,
            codigoFipe: v.codigoFipe,
            valorFipe: v.valorFipe,
            mesReferenciaFipe: v.mesReferenciaFipe
        });
        if (v.tipoVeiculo) setTipoVeiculo(v.tipoVeiculo);
        if (v.valorVenda) setDisplayValorVenda(formatBRL(v.valorVenda));
        if (v.valorCompra) setDisplayValorCompra(formatBRL(v.valorCompra));
      }).catch(err => {
        console.error(err);
        setError("Erro ao carregar dados do veículo.");
      }).finally(() => setLoading(false));
    }
  }, [id, isEditing]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = e.target as HTMLInputElement;
    const { name, value, type, checked } = target;
    const formattedVal = name === 'placa' ? value.toUpperCase() : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? (formattedVal === '' ? undefined : Number(formattedVal)) : formattedVal)
    }));
  };

  const handleTipoChange = (novoTipo: number) => {
    setTipoVeiculo(novoTipo);
    setFormData(prev => ({
      ...prev,
      tipoVeiculo: novoTipo,
      // Se mudar para Carro/Utilitário, reseta campos exclusivos de moto
      cilindrada: novoTipo === 2 ? prev.cilindrada : undefined,
      categoriaMoto: novoTipo === 2 ? prev.categoriaMoto : undefined
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
      if (isEditing) {
        await atualizarVeiculo(id, formData);
        navigate(`/veiculos/${id}`);
      } else {
        await adicionarVeiculo(formData);
        navigate('/estoque');
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao salvar o veículo. Verifique se o Back-end está rodando.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
      <header className="page-header" style={{ marginBottom: '20px' }}>
        <div>
          <h1 className="page-title">{isEditing ? 'Editar Veículo' : 'Cadastrar Novo Veículo'}</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Suporte completo a Carros, Motos e Utilitários com consulta oficial à Tabela FIPE.
          </p>
        </div>
      </header>

      {/* SELETOR DE CATEGORIA PRINCIPAL (CARRO / MOTO / UTILITÁRIO) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
        <button
          type="button"
          onClick={() => handleTipoChange(1)}
          style={{
            padding: '16px',
            borderRadius: '12px',
            background: tipoVeiculo === 1 ? 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)' : 'rgba(30, 41, 59, 0.7)',
            border: tipoVeiculo === 1 ? '2px solid #60a5fa' : '1px solid rgba(255,255,255,0.1)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: 600,
            transition: 'all 0.2s ease',
            boxShadow: tipoVeiculo === 1 ? '0 4px 14px rgba(37, 99, 235, 0.4)' : 'none'
          }}
        >
          <Car size={24} color={tipoVeiculo === 1 ? '#93c5fd' : '#94a3b8'} />
          <span>Carro de Passeio</span>
        </button>

        <button
          type="button"
          onClick={() => handleTipoChange(2)}
          style={{
            padding: '16px',
            borderRadius: '12px',
            background: tipoVeiculo === 2 ? 'linear-gradient(135deg, #701a75 0%, #c026d3 100%)' : 'rgba(30, 41, 59, 0.7)',
            border: tipoVeiculo === 2 ? '2px solid #f472b6' : '1px solid rgba(255,255,255,0.1)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: 600,
            transition: 'all 0.2s ease',
            boxShadow: tipoVeiculo === 2 ? '0 4px 14px rgba(192, 38, 211, 0.4)' : 'none'
          }}
        >
          <Bike size={24} color={tipoVeiculo === 2 ? '#fbcfe8' : '#94a3b8'} />
          <span>Motocicleta / Scooter</span>
        </button>

        <button
          type="button"
          onClick={() => handleTipoChange(7)}
          style={{
            padding: '16px',
            borderRadius: '12px',
            background: tipoVeiculo === 7 ? 'linear-gradient(135deg, #065f46 0%, #059669 100%)' : 'rgba(30, 41, 59, 0.7)',
            border: tipoVeiculo === 7 ? '2px solid #34d399' : '1px solid rgba(255,255,255,0.1)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: 600,
            transition: 'all 0.2s ease',
            boxShadow: tipoVeiculo === 7 ? '0 4px 14px rgba(5, 150, 105, 0.4)' : 'none'
          }}
        >
          <Truck size={24} color={tipoVeiculo === 7 ? '#a7f3d0' : '#94a3b8'} />
          <span>Utilitário / Caminhonete</span>
        </button>
      </div>

      {/* WIDGET FIPE DINÂMICO (CARROS / MOTOS / UTILITÁRIOS) */}
      <div className="glass-panel" style={{ padding: '20px', marginBottom: '24px', border: '1px solid rgba(59, 130, 246, 0.25)', borderRadius: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: showFipeWidget ? '16px' : '0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.2rem' }}>📊</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', color: '#60a5fa', fontWeight: 600 }}>
                Consulta Tabela FIPE — {tipoVeiculo === 2 ? 'Motos' : tipoVeiculo === 7 ? 'Utilitários' : 'Carros'}
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
                Preenche automaticamente Marca, Modelo, Versão e valores sugeridos
              </p>
            </div>
          </div>
          <button type="button" className="btn btn-outline" style={{ fontSize: '0.8rem', padding: '6px 14px' }}
            onClick={() => setShowFipeWidget(v => !v)}>
            {showFipeWidget ? 'Recolher' : 'Abrir Consulta FIPE'}
          </button>
        </div>

        {showFipeWidget && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr)) auto', gap: '12px', alignItems: 'flex-end' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '6px' }}>Marca FIPE</label>
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
                    const fipeTipo: 1 | 2 | 3 = tipoVeiculo === 2 ? 2 : tipoVeiculo === 7 ? 3 : 1;
                    const modelos = await buscarModelosFipe(fipeTipo, cod);
                    setModelosFipe(modelos);
                  }
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '6px' }}>Modelo FIPE</label>
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

                      // Tentar inferir cilindrada para motos
                      let cc: number | undefined = undefined;
                      const ccMatch = mNome.match(/(\d{2,4})\s*(cc|c\.c\.)?/i);
                      if (ccMatch && tipoVeiculo === 2) {
                        const parsed = parseInt(ccMatch[1], 10);
                        if (parsed >= 50 && parsed <= 2500) cc = parsed;
                      }

                      setFormData(prev => ({ 
                        ...prev, 
                        modelo: mNome.split(' ')[0],
                        versao: mNome,
                        combustivel: combustivel || prev.combustivel,
                        cambio: cambio || prev.cambio,
                        cilindrada: cc || prev.cilindrada
                      }));
                    }
                    const fipeTipo: 1 | 2 | 3 = tipoVeiculo === 2 ? 2 : tipoVeiculo === 7 ? 3 : 1;
                    const anos = await buscarAnosFipe(fipeTipo, codigoMarcaFipe, cod);
                    setAnosFipe(anos);
                  }
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '6px' }}>Ano Modelo FIPE</label>
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
                    const nomeStr = anoObj.nome;
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
                  const fipeTipo: 1 | 2 | 3 = tipoVeiculo === 2 ? 2 : tipoVeiculo === 7 ? 3 : 1;
                  const result = await buscarPrecoFipeCompleto(fipeTipo, codigoMarcaFipe, codigoModeloFipe, codigoAnoFipe);
                  setLoadingFipe(false);
                  if (result) {
                    const valorStr = result.valor || result.Valor || '';
                    const mesRef = result.mesReferencia || result.MesReferencia || '';
                    const codFipe = result.codigoFipe || result.CodigoFipe || '';
                    const valor = fipeValorParaNumero(valorStr);
                    const compraSugerida = Math.round(valor * 0.85);
                    setFormData(prev => ({ 
                      ...prev, 
                      valorCompra: compraSugerida, 
                      valorVenda: valor,
                      valorFipe: valor,
                      codigoFipe: codFipe,
                      mesReferenciaFipe: mesRef
                    }));
                    setDisplayValorCompra(formatBRL(compraSugerida));
                    setDisplayValorVenda(formatBRL(valor));
                    setFipeStatus(`FIPE: ${valorStr} (${mesRef} - Código: ${codFipe}) — Preço sugerido de compra: R$ ${formatBRL(compraSugerida)}`);
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
            <h3 style={{ margin: 0, color: 'var(--color-blue-light)', fontSize: '1.1rem' }}>Identificação do Veículo</h3>
            {formData.marca && formData.modelo && (
              <span style={{ fontSize: '0.75rem', color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '3px 8px', borderRadius: '4px', border: '1px solid rgba(16,185,129,0.3)' }}>
                Dados FIPE Aplicados
              </span>
            )}
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Marca</label>
              <input type="text" name="marca" value={formData.marca} onChange={handleChange} className="form-input" placeholder={tipoVeiculo === 2 ? "Ex: Honda, Yamaha" : "Ex: Toyota, VW"} required />
            </div>
            <div className="form-group">
              <label className="form-label">Modelo</label>
              <input type="text" name="modelo" value={formData.modelo} onChange={handleChange} className="form-input" placeholder={tipoVeiculo === 2 ? "Ex: CB 500F, Fazer" : "Ex: Corolla, Civic"} required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Versão / Detalhes</label>
            <input type="text" name="versao" value={formData.versao} onChange={handleChange} className="form-input" placeholder="Ex: ABS Flex Edition" required />
          </div>

          {/* SESSÃO EXCLUSIVA PARA MOTOS */}
          {tipoVeiculo === 2 && (
            <div style={{ background: 'rgba(192, 38, 211, 0.08)', border: '1px solid rgba(192, 38, 211, 0.25)', borderRadius: '12px', padding: '20px', margin: '20px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Bike size={20} color="#f472b6" />
                <h4 style={{ margin: 0, color: '#f472b6', fontSize: '1rem' }}>Especificações da Motocicleta</h4>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Cilindrada (cc)</label>
                  <input 
                    type="number" 
                    name="cilindrada" 
                    value={formData.cilindrada || ''} 
                    onChange={handleChange} 
                    className="form-input" 
                    placeholder="Ex: 160, 250, 500, 1000" 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Estilo da Moto</label>
                  <select 
                    name="categoriaMoto" 
                    value={formData.categoriaMoto || ''} 
                    onChange={handleChange} 
                    className="form-input"
                  >
                    <option value="">-- Selecione o Estilo --</option>
                    <option value="10">Street</option>
                    <option value="4">Trail</option>
                    <option value="11">Big Trail</option>
                    <option value="3">Custom</option>
                    <option value="5">Scooter</option>
                    <option value="1">Naked</option>
                    <option value="2">Esportiva</option>
                    <option value="6">Touring</option>
                    <option value="7">Cross / Off-Road</option>
                    <option value="8">Cafe Racer</option>
                    <option value="9">Scrambler</option>
                    <option value="12">Cub / Biz</option>
                    <option value="13">Elétrica</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Tipo de Partida</label>
                  <select 
                    name="partida" 
                    value={formData.partida || ''} 
                    onChange={handleChange} 
                    className="form-input"
                  >
                    <option value="">-- Selecione a Partida --</option>
                    <option value="1">Elétrica</option>
                    <option value="2">Pedal</option>
                    <option value="3">Elétrica e Pedal</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Tipo de Refrigeração</label>
                  <select 
                    name="refrigeracao" 
                    value={formData.refrigeracao || ''} 
                    onChange={handleChange} 
                    className="form-input"
                  >
                    <option value="">-- Selecione a Refrigeração --</option>
                    <option value="1">Ar</option>
                    <option value="4">Líquida</option>
                    <option value="2">Óleo</option>
                    <option value="3">Ar e Óleo</option>
                  </select>
                </div>
              </div>
            </div>
          )}

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
              <input type="text" name="cor" value={formData.cor} onChange={handleChange} className="form-input" placeholder="Ex: Preto, Vermelho, Prata" />
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
                <option value="Semi-Automático">Semi-Automático</option>
                <option value="CVT">CVT</option>
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

          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '8px' }}>
            <input 
              type="checkbox" 
              name="consignado" 
              checked={formData.consignado || false} 
              onChange={handleChange} 
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <label className="form-label" style={{ margin: 0, cursor: 'pointer' }}>Veículo Consignado (Cliente deixou na loja para venda)</label>
          </div>

          <div className="form-row">
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label className="form-label" style={{ margin: 0 }}>Valor de Compra / Custo (R$)</label>
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

          {/* Dados FIPE capturados */}
          {formData.codigoFipe && (
            <div style={{ padding: '12px 16px', background: 'rgba(37, 99, 235, 0.08)', borderRadius: '8px', border: '1px solid rgba(37, 99, 235, 0.2)', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: '#93c5fd' }}>
                Referência FIPE: <strong>{formData.codigoFipe}</strong> ({formData.mesReferenciaFipe || 'Vigente'}) — Valor Tabela: R$ {formatBRL(formData.valorFipe || 0)}
              </span>
            </div>
          )}

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
