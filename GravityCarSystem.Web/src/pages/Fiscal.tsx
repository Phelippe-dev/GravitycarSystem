import React, { useEffect, useState, useCallback } from 'react';
import { fetchNotasFiscais } from '../api';
import type { NotaFiscalDto } from '../api';
import { FileText, Download, CheckCircle, AlertCircle, Search, Filter, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

const Fiscal: React.FC = () => {
  const [notas, setNotas] = useState<NotaFiscalDto[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState('');
  const [statusFiltro, setStatusFiltro] = useState('');
  const [busca, setBusca] = useState('');

  const carregarNotas = useCallback(async () => {
    setLoading(true);
    const data = await fetchNotasFiscais(dataInicio, dataFim, tipoFiltro, statusFiltro, busca);
    setNotas(data);
    setLoading(false);
  }, [dataInicio, dataFim, tipoFiltro, statusFiltro, busca]);

  useEffect(() => {
    carregarNotas();
  }, [carregarNotas]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    carregarNotas();
  };

  const formatarCnpj = (cnpj?: string) => {
    if (!cnpj) return 'N/A';
    if (cnpj.length === 11) return cnpj.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  };

  const totalIcms = notas.reduce((acc, curr) => acc + (curr.valorIcms || 0), 0);
  const totalPisCofins = notas.reduce((acc, curr) => acc + (curr.valorPis || 0) + (curr.valorCofins || 0), 0);
  const totalVolume = notas.reduce((acc, curr) => acc + (curr.valorTotal || 0), 0);

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', width: '100%', padding: '24px' }}>
      <header className="page-header" style={{ marginBottom: '32px' }}>
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <FileText size={28} color="var(--color-blue-light)" /> Hub Fiscal
        </h1>
        <p style={{ color: 'var(--color-gray-400)', marginTop: '8px' }}>Gestão de Notas Fiscais Eletrônicas, CFOPs e Impostos Apurados</p>
      </header>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        <div className="dashboard-card" style={{ padding: '24px' }}>
            <div className="card-header">
                <h3>Volume de Notas</h3>
                <FileText color="var(--color-blue-light)" />
            </div>
            <div className="card-value">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalVolume)}</div>
            <p className="card-trend">{notas.length} notas no período</p>
        </div>
        <div className="dashboard-card" style={{ padding: '24px' }}>
            <div className="card-header">
                <h3>ICMS Apurado</h3>
                <DollarSign color="var(--color-warning)" />
            </div>
            <div className="card-value" style={{ color: 'var(--color-warning)' }}>
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalIcms)}
            </div>
            <p className="card-trend">Pode haver redução de BC p/ usados</p>
        </div>
        <div className="dashboard-card" style={{ padding: '24px' }}>
            <div className="card-header">
                <h3>PIS / COFINS</h3>
                <DollarSign color="var(--color-danger)" />
            </div>
            <div className="card-value" style={{ color: 'var(--color-danger)' }}>
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPisCofins)}
            </div>
            <p className="card-trend">Impostos Federais Totais</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="glass-panel" style={{ padding: '20px', marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div className="form-group" style={{ flex: '1 1 200px' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Filter size={16}/> Buscar NF-e</label>
            <input 
                type="text" 
                className="form-input" 
                placeholder="Nº, Chave, Destinatário..." 
                value={busca}
                onChange={e => setBusca(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch(e as any)}
            />
        </div>
        <div className="form-group" style={{ width: '150px' }}>
            <label className="form-label">Data Início</label>
            <input type="date" className="form-input" value={dataInicio} onChange={e => setDataInicio(e.target.value)} />
        </div>
        <div className="form-group" style={{ width: '150px' }}>
            <label className="form-label">Data Fim</label>
            <input type="date" className="form-input" value={dataFim} onChange={e => setDataFim(e.target.value)} />
        </div>
        <div className="form-group" style={{ width: '150px' }}>
            <label className="form-label">Tipo</label>
            <select className="form-input" value={tipoFiltro} onChange={e => setTipoFiltro(e.target.value)}>
                <option value="">Todos</option>
                <option value="0">Entrada</option>
                <option value="1">Saída</option>
            </select>
        </div>
        <div className="form-group" style={{ width: '150px' }}>
            <label className="form-label">Status</label>
            <select className="form-input" value={statusFiltro} onChange={e => setStatusFiltro(e.target.value)}>
                <option value="">Todos</option>
                <option value="1">Autorizada</option>
                <option value="2">Cancelada</option>
            </select>
        </div>
        <button className="btn btn-primary" onClick={handleSearch} style={{ height: '42px', padding: '0 24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Search size={18} /> Filtrar
        </button>
      </div>

      <div className="table-modern-container">
        <table className="table-modern">
          <thead>
            <tr>
              <th style={{ width: '50px' }}>Tipo</th>
              <th>Status</th>
              <th>Número / Série</th>
              <th>Operação / CFOP</th>
              <th>Destinatário/Emitente</th>
              <th style={{ textAlign: 'right' }}>Total</th>
              <th style={{ textAlign: 'right' }}>Impostos (I/P/C)</th>
              <th style={{ textAlign: 'center' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '32px' }}>Carregando notas fiscais...</td></tr>
            ) : notas.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: 'var(--color-gray-400)' }}>Nenhuma nota fiscal encontrada para os filtros.</td></tr>
            ) : (
              notas.map(n => (
                <tr key={n.id}>
                  <td style={{ textAlign: 'center' }}>
                    {n.tipo === 0 ? (
                        <div title="Entrada" style={{ background: 'rgba(59, 130, 246, 0.2)', color: 'var(--color-blue-light)', padding: '6px', borderRadius: '4px', display: 'inline-flex' }}>
                            <TrendingDown size={18} />
                        </div>
                    ) : (
                        <div title="Saída" style={{ background: 'rgba(16, 185, 129, 0.2)', color: 'var(--color-success)', padding: '6px', borderRadius: '4px', display: 'inline-flex' }}>
                            <TrendingUp size={18} />
                        </div>
                    )}
                  </td>
                  <td>
                    {n.status === 1 ? (
                      <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle size={14} /> Autorizada
                      </span>
                    ) : (
                      <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <AlertCircle size={14} /> Cancelada
                      </span>
                    )}
                  </td>
                  <td>
                    <strong>{n.numero || 'S/N'}</strong> / {n.serie || '1'}
                    <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--color-blue-light)', marginTop: '4px' }}>
                        {n.chaveAcesso.match(/.{1,4}/g)?.join(' ')}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{n.naturezaOperacao || 'N/A'}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-gray-400)' }}>CFOP: {n.cfop || 'N/A'}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>
                        {n.tipo === 0 ? n.emitenteNome : n.destinatarioNome}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-gray-400)' }}>
                        {formatarCnpj(n.tipo === 0 ? n.emitenteCnpj : n.destinatarioCnpj)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)' }}>
                        Emissão: {new Date(n.dataEmissao).toLocaleString('pt-BR')}
                    </div>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n.valorTotal)}
                  </td>
                  <td style={{ textAlign: 'right', fontSize: '0.85rem' }}>
                    <div style={{ color: 'var(--color-warning)' }} title="ICMS">I: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n.valorIcms || 0)}</div>
                    <div style={{ color: 'var(--color-danger)' }} title="PIS/COFINS">P/C: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((n.valorPis || 0) + (n.valorCofins || 0))}</div>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button className="btn" style={{ padding: '6px 12px', fontSize: '0.85rem', background: 'rgba(255,255,255,0.05)' }} title="Baixar XML">
                      <Download size={16} /> XML
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Fiscal;
