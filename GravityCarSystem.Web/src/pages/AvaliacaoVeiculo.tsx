import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchClientes, salvarAvaliacao, API_BASE_URL } from '../api';
import type { Cliente, SenatranVeiculoResultDto } from '../api';
import { 
  ClipboardList, 
  ShieldCheck, 
  User, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle
} from 'lucide-react';


const AvaliacaoVeiculo: React.FC = () => {
    const navigate = useNavigate();
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [saving, setSaving] = useState(false);
    const [searchingPlaca, setSearchingPlaca] = useState(false);
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
    
    // Dados da Consulta Governamental (DETRAN / SENATRAN / PRF / FIPE)
    const [detranData, setDetranData] = useState<SenatranVeiculoResultDto | null>(null);

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
        try {
            const cli = await fetchClientes();
            setClientes(cli);
            if (cli.length > 0) {
                setClienteId(cli[0].id);
            }
        } catch (e) {
            console.error('Erro ao carregar clientes:', e);
        }
    };

    useEffect(() => {
        const mercado = Number(valorMercado.replace(',', '.')) || 0;
        const prep = Number(custoPreparacao.replace(',', '.')) || 0;
        const doc = Number(custoDoc.replace(',', '.')) || 0;
        
        setValorSugerido(Math.max(0, mercado - prep - doc));
    }, [valorMercado, custoPreparacao, custoDoc]);

    // Consulta Automatizada DETRAN / SENATRAN & FIPE
    const handleConsultarPlaca = async (placaParaConsultar?: string) => {
        const placaAlvo = (placaParaConsultar || placa).trim().toUpperCase();
        if (!placaAlvo || placaAlvo.length < 5) return;

        setSearchingPlaca(true);
        setErrorMsg('');
        try {
            const token = localStorage.getItem('@GravityCar:token');
            const res = await fetch(`${API_BASE_URL}/senatran/consulta?placa=${encodeURIComponent(placaAlvo)}`, {
                headers: {
                    'Authorization': token ? `Bearer ${token}` : ''
                }
            });

            if (!res.ok) {
                throw new Error('Falha ao comunicar com os serviços do DETRAN/SENATRAN.');
            }

            const data: SenatranVeiculoResultDto = await res.json();
            setDetranData(data);

            // Auto preenchimento inteligente dos dados do veículo se retornados pela base ou API
            if (data.marca) setMarca(data.marca);
            if (data.modelo) setModelo(data.modelo);
            if (data.anoFabricacao) setAnoFab(String(data.anoFabricacao));
            if (data.anoModelo) setAnoMod(String(data.anoModelo));
            if (data.valorFipe && data.valorFipe > 0) {
                setValorMercado(String(data.valorFipe));
            }
            if (data.totalDebitosPendentes > 0) {
                setCustoDoc(String(data.totalDebitosPendentes));
            }

            if (data.marca && data.modelo) {
                setSuccessMsg(`✓ Veículo ${data.marca} ${data.modelo} localizado na base!`);
            } else {
                setSuccessMsg(`✓ Placa ${placaAlvo} registrada. Preencha Marca e Modelo ou use a FIPE.`);
            }
            setTimeout(() => setSuccessMsg(''), 4000);
        } catch (err: any) {
            console.warn('Erro ao consultar DETRAN:', err);
        } finally {
            setSearchingPlaca(false);
        }
    };

    const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
        if (e && e.preventDefault) e.preventDefault();
        setErrorMsg('');
        setSuccessMsg('');
        
        const cliId = clienteId || (clientes.length > 0 ? clientes[0].id : '');
        if (!cliId) return setErrorMsg('Selecione ou cadastre um cliente primeiro.');
        if (!placa) return setErrorMsg('Informe a placa do veículo.');
        if (!marca || !modelo) return setErrorMsg('Informe a marca e o modelo do veículo.');
        
        setSaving(true);

        const valMercadoNum = Number(String(valorMercado).replace(',', '.')) || 0;
        const valSugeridoFinal = valorSugerido > 0 ? valorSugerido : valMercadoNum;
        const valAprovadoNum = valorAprovado ? Number(String(valorAprovado).replace(',', '.')) : valSugeridoFinal;

        const avaliacao = {
            clienteId: cliId,
            marca: marca || 'Não informada',
            modelo: modelo || 'Não informado',
            placa: placa.toUpperCase(),
            anoFabricacao: Number(anoFab) || new Date().getFullYear(),
            anoModelo: Number(anoMod) || new Date().getFullYear(),
            quilometragem: Number(km) || 0,
            valorMercado: valMercadoNum,
            valorAvaliacao: valSugeridoFinal, // Custo abatido
            valorAprovado: valAprovadoNum,
            observacoes: detranData 
                ? `Avaliação cadastrada. Origem: ${detranData.origem}. Débitos apurados: R$ ${detranData.totalDebitosPendentes}`
                : 'Avaliação via Painel Web',
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
            await salvarAvaliacao(avaliacao);
            setSuccessMsg('Avaliação salva com sucesso! O veículo foi adicionado ao Estoque.');
            setTimeout(() => navigate('/estoque'), 1500);
        } catch (err: any) {
            setErrorMsg(err.message || 'Erro ao salvar avaliação');
            setSaving(false);
        }
    };

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', width: '100%', padding: '24px' }}>
            <header style={{ marginBottom: '32px' }}>
                <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <ClipboardList size={28} color="var(--color-blue-light)" /> Avaliação de Veículo (Troca/Compra)
                </h1>
                <p style={{ color: 'var(--color-gray-400)', marginTop: '8px' }}>
                    Preencha o checklist e consulte a tabela FIPE com automação instantânea.
                </p>
            </header>

            {errorMsg && <div className="badge badge-danger" style={{ display: 'block', padding: '16px', marginBottom: '24px' }}>{errorMsg}</div>}
            {successMsg && <div className="badge badge-success" style={{ display: 'block', padding: '16px', marginBottom: '24px' }}>{successMsg}</div>}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                <div className="glass-panel" style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    <div>
                        <h3 style={{ marginBottom: '16px', color: 'var(--color-gray-400)' }}><User size={16}/> Dados Básicos</h3>
                        <div className="form-group">
                            <label className="form-label">Cliente</label>
                            <select className="form-input" value={clienteId} onChange={e => setClienteId(e.target.value)}>
                                <option value="">-- Selecione o Cliente --</option>
                                {clientes.map(c => <option key={c.id} value={c.id}>{c.nomeRazaoSocial || c.nome}</option>)}
                            </select>
                        </div>

                        {/* Campo de Placa com Botão de Busca Automática DETRAN / FIPE */}
                        <div className="form-group">
                            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>Placa do Veículo</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--color-blue-light)' }}>Consulta Automática FIPE</span>
                            </label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input 
                                    className="form-input" 
                                    value={placa} 
                                    onChange={e => setPlaca(e.target.value.toUpperCase())}
                                    onBlur={() => { if (placa && !marca) handleConsultarPlaca(); }}
                                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleConsultarPlaca(); } }}
                                    placeholder="Ex: ADNOA21 ou GCS-7788" 
                                    style={{ textTransform: 'uppercase', fontWeight: 600, letterSpacing: '1px' }}
                                    required 
                                />
                                <button 
                                    type="button" 
                                    className="btn btn-primary"
                                    onClick={() => handleConsultarPlaca()}
                                    disabled={searchingPlaca || !placa}
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', padding: '0 14px' }}
                                    title="Consultar base do sistema e integração FIPE"
                                >
                                    {searchingPlaca ? (
                                        <span>Consultando...</span>
                                    ) : (
                                        <>
                                            <Sparkles size={16} /> Buscar
                                        </>
                                    )}
                                </button>

                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div className="form-group">
                                <label className="form-label">Marca</label>
                                <input className="form-input" value={marca} onChange={e => setMarca(e.target.value)} required placeholder="Ex: Audi" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Modelo</label>
                                <input className="form-input" value={modelo} onChange={e => setModelo(e.target.value)} required placeholder="Ex: Q3" />
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div className="form-group">
                                <label className="form-label">Ano Fab/Mod</label>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                    <input className="form-input" value={anoFab} onChange={e => setAnoFab(e.target.value)} required placeholder="Fab"/>
                                    <input className="form-input" value={anoMod} onChange={e => setAnoMod(e.target.value)} required placeholder="Mod"/>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">KM Rodados</label>
                                <input className="form-input" type="number" value={km} onChange={e => setKm(e.target.value)} required placeholder="Ex: 85000" />
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

                {detranData && (
                    <div className="glass-panel" style={{
                        padding: '20px 24px',
                        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.6) 100%)',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        borderRadius: '12px',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <ShieldCheck size={22} color="#38bdf8" />
                            </div>
                            <div>
                                <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>
                                    Resultado FIPE / Tabela de Referência
                                </h4>
                                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--color-gray-400)' }}>
                                    Placa pesquisada: <strong style={{ color: 'var(--color-blue-light)' }}>{detranData.placa}</strong>
                                </p>
                            </div>
                        </div>
                        <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#38bdf8', background: 'rgba(56, 189, 248, 0.12)', padding: '8px 16px', borderRadius: '6px', border: '1px solid rgba(56, 189, 248, 0.25)' }}>
                            FIPE: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(detranData.valorFipe || 0)}
                        </span>
                    </div>
                )}

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

                {errorMsg && (
                    <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid var(--color-danger)', color: 'var(--color-danger)', padding: '12px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <AlertTriangle size={18} />
                        {errorMsg}
                    </div>
                )}
                {successMsg && (
                    <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid var(--color-success)', color: 'var(--color-success)', padding: '12px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CheckCircle2 size={18} />
                        {successMsg}
                    </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
                    <button type="button" className="btn" onClick={() => navigate(-1)}>Cancelar</button>
                    <button type="button" id="btn-salvar-avaliacao" className="btn btn-primary" onClick={(e) => handleSubmit(e)} disabled={saving}>
                        {saving ? 'Salvando...' : 'Salvar Avaliação'}
                    </button>
                </div>

            </form>
        </div>
    );
};

export default AvaliacaoVeiculo;
