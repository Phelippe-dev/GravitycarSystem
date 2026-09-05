import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchClientes, API_BASE_URL } from '../api';
import type { Cliente } from '../api';
import { ClipboardList, ShieldCheck, User } from 'lucide-react';

const AvaliacaoVeiculo: React.FC = () => {
    const navigate = useNavigate();
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [saving, setSaving] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const [clienteId, setClienteId] = useState('');
    const [marca, setMarca] = useState('');
    const [modelo, setModelo] = useState('');
    const [placa, setPlaca] = useState('');
    const [anoFab, setAnoFab] = useState('');
    const [anoMod, setAnoMod] = useState('');
    const [km, setKm] = useState('');

    const [valorMercado, setValorMercado] = useState('');
    
    // Checklist State
    const [statusMotor, setStatusMotor] = useState(1);
    const [statusCambio, setStatusCambio] = useState(1);
    const [statusSuspensao, setStatusSuspensao] = useState(1);
    const [statusPneus, setStatusPneus] = useState(1);
    const [statusPintura, setStatusPintura] = useState(1);
    const [statusInterior, setStatusInterior] = useState(1);
    
    const [custoPreparacao, setCustoPreparacao] = useState('');
    const [custoDoc, setCustoDoc] = useState('');
    
    const [valorSugerido, setValorSugerido] = useState(0);
    const [valorAprovado, setValorAprovado] = useState('');

    useEffect(() => {
        carregarDados();
    }, []);

    const carregarDados = async () => {
        const cli = await fetchClientes();
        setClientes(cli);
    };

    useEffect(() => {
        const mercado = Number(valorMercado.replace(',', '.')) || 0;
        const prep = Number(custoPreparacao.replace(',', '.')) || 0;
        const doc = Number(custoDoc.replace(',', '.')) || 0;
        
        setValorSugerido(mercado - prep - doc);
    }, [valorMercado, custoPreparacao, custoDoc]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');
        if (!clienteId) return setErrorMsg('Selecione um cliente.');
        
        setSaving(true);

        const avaliacao = {
            clienteId,
            marca,
            modelo,
            placa,
            anoFabricacao: Number(anoFab) || null,
            anoModelo: Number(anoMod) || null,
            quilometragem: Number(km) || 0,
            valorMercado: Number(valorMercado.replace(',', '.')) || 0,
            valorAvaliacao: valorSugerido, // Custo abatido
            valorAprovado: valorAprovado ? Number(valorAprovado.replace(',', '.')) : null,
            observacoes: 'Avaliação via Painel Web',
            itens: [
                { categoria: 'Mecânica', item: 'Motor', status: statusMotor, custoEstimado: 0 },
                { categoria: 'Mecânica', item: 'Câmbio', status: statusCambio, custoEstimado: 0 },
                { categoria: 'Mecânica', item: 'Suspensão', status: statusSuspensao, custoEstimado: 0 },
                { categoria: 'Estética', item: 'Pneus', status: statusPneus, custoEstimado: 0 },
                { categoria: 'Estética', item: 'Pintura', status: statusPintura, custoEstimado: 0 },
                { categoria: 'Estética', item: 'Interior', status: statusInterior, custoEstimado: 0 },
                { categoria: 'Documentação', item: 'Geral', status: 1, custoEstimado: Number(custoDoc) || 0 }
            ]
        };

        try {
            const response = await fetch(`${API_BASE_URL}/avaliacoes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('@GravityCar:token')}`
                },
                body: JSON.stringify(avaliacao)
            });

            if (!response.ok) throw new Error('Erro ao salvar avaliação');
            
            setSuccessMsg('Avaliação salva com sucesso! O veículo foi adicionado ao Estoque.');
            setTimeout(() => navigate('/estoque'), 1800);
        } catch (err: any) {
            setErrorMsg(err.message);
            setSaving(false);
        }
    };

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', width: '100%', padding: '24px' }}>
            <header style={{ marginBottom: '32px' }}>
                <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <ClipboardList size={28} color="var(--color-blue-light)" /> Avaliação de Veículo (Troca/Compra)
                </h1>
                <p style={{ color: 'var(--color-gray-400)', marginTop: '8px' }}>Preencha o checklist e simule o valor de captação.</p>
            </header>

            {errorMsg && <div className="badge badge-danger" style={{ display: 'block', padding: '16px', marginBottom: '24px' }}>{errorMsg}</div>}
            {successMsg && <div className="badge badge-success" style={{ display: 'block', padding: '16px', marginBottom: '24px' }}>{successMsg}</div>}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                <div className="glass-panel" style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    <div>
                        <h3 style={{ marginBottom: '16px', color: 'var(--color-gray-400)' }}><User size={16}/> Dados Básicos</h3>
                        <div className="form-group">
                            <label className="form-label">Cliente</label>
                            <select className="form-input" value={clienteId} onChange={e => setClienteId(e.target.value)} required>
                                <option value="">-- Selecione o Cliente --</option>
                                {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                            </select>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div className="form-group">
                                <label className="form-label">Marca</label>
                                <input className="form-input" value={marca} onChange={e => setMarca(e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Modelo</label>
                                <input className="form-input" value={modelo} onChange={e => setModelo(e.target.value)} required />
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                            <div className="form-group">
                                <label className="form-label">Placa</label>
                                <input className="form-input" value={placa} onChange={e => setPlaca(e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Ano Fab/Mod</label>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                    <input className="form-input" value={anoFab} onChange={e => setAnoFab(e.target.value)} required placeholder="Fab"/>
                                    <input className="form-input" value={anoMod} onChange={e => setAnoMod(e.target.value)} required placeholder="Mod"/>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">KM</label>
                                <input className="form-input" type="number" value={km} onChange={e => setKm(e.target.value)} required />
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 style={{ marginBottom: '16px', color: 'var(--color-gray-400)' }}><ShieldCheck size={16}/> Checklist</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div className="form-group">
                                <label className="form-label">Motor</label>
                                <select className="form-input" value={statusMotor} onChange={e => setStatusMotor(Number(e.target.value))}>
                                    <option value={1}>OK</option><option value={2}>Revisar</option><option value={3}>Grave</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Câmbio</label>
                                <select className="form-input" value={statusCambio} onChange={e => setStatusCambio(Number(e.target.value))}>
                                    <option value={1}>OK</option><option value={2}>Revisar</option><option value={3}>Grave</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Suspensão</label>
                                <select className="form-input" value={statusSuspensao} onChange={e => setStatusSuspensao(Number(e.target.value))}>
                                    <option value={1}>OK</option><option value={2}>Revisar</option><option value={3}>Trocar</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Pneus</label>
                                <select className="form-input" value={statusPneus} onChange={e => setStatusPneus(Number(e.target.value))}>
                                    <option value={1}>OK</option><option value={2}>Meia Vida</option><option value={3}>Trocar</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Pintura</label>
                                <select className="form-input" value={statusPintura} onChange={e => setStatusPintura(Number(e.target.value))}>
                                    <option value={1}>OK</option><option value={2}>Detalhes</option><option value={3}>Refazer</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Interior</label>
                                <select className="form-input" value={statusInterior} onChange={e => setStatusInterior(Number(e.target.value))}>
                                    <option value={1}>OK</option><option value={2}>Higienizar</option><option value={3}>Rasgado</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="glass-panel" style={{ padding: '24px' }}>
                    <h3 style={{ marginBottom: '16px', color: 'var(--color-warning)' }}>Matemática da Captação</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
                        
                        <div className="form-group">
                            <label className="form-label">Valor de Mercado (FIPE/Webmotors)</label>
                            <input className="form-input" value={valorMercado} onChange={e => setValorMercado(e.target.value)} required placeholder="78000" />
                        </div>
                        
                        <div className="form-group">
                            <label className="form-label">(-) Custos Estimados (Preparação + Doc)</label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input className="form-input" value={custoPreparacao} onChange={e => setCustoPreparacao(e.target.value)} placeholder="Prep. Ex: 1500" />
                                <input className="form-input" value={custoDoc} onChange={e => setCustoDoc(e.target.value)} placeholder="Doc. Ex: 800" />
                            </div>
                        </div>
                        
                        <div style={{ padding: '16px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', border: '1px solid var(--color-success)', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.9rem', color: 'var(--color-success)', marginBottom: '8px' }}>Valor Sugerido para o Cliente</div>
                            <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--color-white)' }}>
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorSugerido)}
                            </div>
                        </div>

                    </div>

                    <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                        <div className="form-group" style={{ maxWidth: '300px' }}>
                            <label className="form-label">Valor Final Aprovado (R$)</label>
                            <input className="form-input" value={valorAprovado} onChange={e => setValorAprovado(e.target.value)} placeholder="Valor que o gerente fechou" />
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
                    <button type="button" className="btn" onClick={() => navigate(-1)}>Cancelar</button>
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                        {saving ? 'Salvando...' : 'Salvar Avaliação'}
                    </button>
                </div>

            </form>
        </div>
    );
};

export default AvaliacaoVeiculo;
