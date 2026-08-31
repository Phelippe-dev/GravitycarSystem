import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adicionarVeiculo } from '../api';
import type { Veiculo } from '../api';

const CadastroVeiculo: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
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
      setDisplayValorCompra(new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(numericValue));
    } else {
      setFormData(prev => ({ ...prev, valorVenda: numericValue }));
      setDisplayValorVenda(new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(numericValue));
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
      <header className="page-header">
        <h1 className="page-title">Cadastrar Veículo</h1>
      </header>

      <div className="glass-panel" style={{ padding: '32px' }}>
        {error && (
          <div style={{ padding: '16px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: '8px', marginBottom: '24px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Sessão 1: Identificação Básica */}
          <h3 style={{ marginBottom: '16px', color: 'var(--color-blue-light)', fontSize: '1.1rem' }}>Identificação</h3>
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
              <select name="combustivel" value={formData.combustivel} onChange={handleChange} className="form-input" style={{ appearance: 'auto' }}>
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
              <select name="cambio" value={formData.cambio} onChange={handleChange} className="form-input" style={{ appearance: 'auto' }}>
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
              <input type="text" name="placa" value={formData.placa} onChange={handleChange} className="form-input" placeholder="ABC-1234" />
            </div>
            <div className="form-group">
              <label className="form-label">Renavam</label>
              <input type="text" name="renavam" value={formData.renavam} onChange={handleChange} className="form-input" placeholder="Ex: 01234567890" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Chassi</label>
            <input type="text" name="chassi" value={formData.chassi} onChange={handleChange} className="form-input" placeholder="Ex: 9BW..." />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Valor de Compra (R$)</label>
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
              <label className="form-label">Valor de Venda (R$)</label>
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
