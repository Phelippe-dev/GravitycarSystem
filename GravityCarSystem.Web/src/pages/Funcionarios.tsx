import React, { useState, useEffect } from 'react';
import { UserPlus, Users, Edit2, Power, Search, X } from 'lucide-react';
import { API_BASE_URL } from '../api';
import { useAuth } from '../contexts/AuthContext';

interface Funcionario {
    id: string;
    nome: string;
    email: string;
    cargo: string;
    role: 'Admin' | 'Gerente' | 'Vendedor';
    comissaoPercent: number;
    ativo: boolean;
    criadoEm?: string;
}

const ROLES_DISPONIVEIS = [
    { value: 'Gerente', label: 'Gerente', icon: '📊', desc: 'Acesso financeiro e relatórios', color: '#8b5cf6' },
    { value: 'Vendedor', label: 'Consultor de Vendas', icon: '💼', desc: 'Vendas, estoque e atendimento', color: '#f59e0b' },
];

const FuncionariosPage: React.FC = () => {
    const { activeRole } = useAuth();
    const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
    const [loading, setLoading] = useState(true);
    const [busca, setBusca] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editando, setEditando] = useState<Funcionario | null>(null);
    const [salvando, setSalvando] = useState(false);
    const [msgStatus, setMsgStatus] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null);

    const [form, setForm] = useState({
        nome: '',
        email: '',
        senha: '',
        role: 'Vendedor',
        comissaoPercent: 2.0,
        cargo: '',
    });

    const getHeaders = () => {
        const token = localStorage.getItem('@GravityCar:token');
        return { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) };
    };

    const carregar = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/funcionarios`, { headers: getHeaders() });
            if (res.ok) setFuncionarios(await res.json());
            else setFuncionarios([]);
        } catch { setFuncionarios([]); }
        setLoading(false);
    };

    useEffect(() => { carregar(); }, []);

    const abrirNovo = () => {
        setEditando(null);
        setForm({ nome: '', email: '', senha: '', role: 'Vendedor', comissaoPercent: 2.0, cargo: '' });
        setMsgStatus(null);
        setShowModal(true);
    };

    const abrirEditar = (f: Funcionario) => {
        setEditando(f);
        setForm({ nome: f.nome, email: f.email, senha: '', role: f.role, comissaoPercent: f.comissaoPercent, cargo: f.cargo || '' });
        setMsgStatus(null);
        setShowModal(true);
    };

    const salvar = async () => {
        if (!form.nome.trim() || !form.email.trim()) { setMsgStatus({ tipo: 'erro', texto: 'Nome e e-mail são obrigatórios.' }); return; }
        if (!editando && !form.senha.trim()) { setMsgStatus({ tipo: 'erro', texto: 'A senha inicial é obrigatória para novos funcionários.' }); return; }
        setSalvando(true);
        setMsgStatus(null);
        try {
            const url = editando ? `${API_BASE_URL}/funcionarios/${editando.id}` : `${API_BASE_URL}/funcionarios`;
            const method = editando ? 'PUT' : 'POST';
            const body = editando
                ? { nome: form.nome, role: form.role, comissaoPercent: form.comissaoPercent, cargo: form.cargo }
                : { nome: form.nome, email: form.email, senha: form.senha, role: form.role, comissaoPercent: form.comissaoPercent, cargo: form.cargo };
            const res = await fetch(url, { method, headers: getHeaders(), body: JSON.stringify(body) });
            if (res.ok) {
                setMsgStatus({ tipo: 'ok', texto: editando ? 'Funcionário atualizado!' : 'Funcionário cadastrado com sucesso!' });
                await carregar();
                setTimeout(() => { setShowModal(false); setMsgStatus(null); }, 1200);
            } else {
                const err = await res.text();
                setMsgStatus({ tipo: 'erro', texto: err || 'Erro ao salvar. Tente novamente.' });
            }
        } catch { setMsgStatus({ tipo: 'erro', texto: 'Erro de conexão.' }); }
        setSalvando(false);
    };

    const toggleAtivo = async (f: Funcionario) => {
        try {
            await fetch(`${API_BASE_URL}/funcionarios/${f.id}/toggle-ativo`, { method: 'PATCH', headers: getHeaders() });
            await carregar();
        } catch { /* silencioso */ }
    };

    const filtrados = funcionarios.filter(f =>
        f.nome.toLowerCase().includes(busca.toLowerCase()) ||
        f.email.toLowerCase().includes(busca.toLowerCase()) ||
        f.role.toLowerCase().includes(busca.toLowerCase())
    );

    const roleCor = (role: string) => role === 'Admin' ? '#10b981' : role === 'Gerente' ? '#8b5cf6' : '#f59e0b';
    const roleIcon = (role: string) => role === 'Admin' ? '🏢' : role === 'Gerente' ? '📊' : '💼';

    if (activeRole === 'Vendedor') {
        return (
            <div className="page-container">
                <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🚫</div>
                    <h2 style={{ color: '#ef4444', marginBottom: '8px' }}>Acesso Restrito</h2>
                    <p style={{ color: 'var(--color-gray-400)' }}>Somente Administradores e Gerentes podem gerenciar funcionários.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container" style={{ maxWidth: '900px', margin: '0 auto', width: '100%' }}>
            {/* Cabeçalho */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '1.6rem', fontWeight: 700, margin: 0 }}>
                        <Users size={24} style={{ marginRight: '10px', verticalAlign: 'middle' }} />
                        Equipe & Funcionários
                    </h1>
                    <p style={{ color: 'var(--color-gray-400)', fontSize: '0.88rem', marginTop: '4px' }}>
                        Gerencie os acessos e perfis da equipe da sua concessionária
                    </p>
                </div>
                <button className="btn btn-primary" onClick={abrirNovo} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <UserPlus size={18} /> Novo Funcionário
                </button>
            </div>

            {/* Cards de resumo */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
                {[
                    { label: 'Total de Funcionários', value: funcionarios.length, color: '#60a5fa', icon: '👥' },
                    { label: 'Ativos', value: funcionarios.filter(f => f.ativo).length, color: '#34d399', icon: '✅' },
                    { label: 'Consultores de Venda', value: funcionarios.filter(f => f.role === 'Vendedor').length, color: '#fbbf24', icon: '💼' },
                ].map(({ label, value, color, icon }) => (
                    <div key={label} className="glass-panel" style={{ padding: '16px', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.5rem' }}>{icon}</div>
                        <div style={{ fontSize: '1.6rem', fontWeight: 700, color }}>{value}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--color-gray-400)' }}>{label}</div>
                    </div>
                ))}
            </div>

            {/* Barra de busca */}
            <div className="glass-panel" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <Search size={16} color="var(--color-gray-400)" />
                <input
                    className="form-input"
                    placeholder="Buscar por nome, e-mail ou cargo..."
                    value={busca}
                    onChange={e => setBusca(e.target.value)}
                    style={{ border: 'none', background: 'transparent', flex: 1, boxShadow: 'none', padding: '0' }}
                />
                {busca && <button onClick={() => setBusca('')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-gray-400)' }}><X size={14} /></button>}
            </div>

            {/* Lista */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-gray-400)' }}>Carregando equipe...</div>
            ) : filtrados.length === 0 ? (
                <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>👥</div>
                    <h3 style={{ color: 'var(--color-gray-300)' }}>{busca ? 'Nenhum funcionário encontrado' : 'Nenhum funcionário cadastrado ainda'}</h3>
                    {!busca && <button className="btn btn-primary" onClick={abrirNovo} style={{ marginTop: '16px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}><UserPlus size={16} /> Cadastrar Primeiro Funcionário</button>}
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {filtrados.map(f => (
                        <div key={f.id} className="glass-panel" style={{
                            padding: '16px 20px',
                            display: 'flex', alignItems: 'center', gap: '16px',
                            opacity: f.ativo ? 1 : 0.55,
                            borderLeft: `3px solid ${roleCor(f.role)}`
                        }}>
                            {/* Avatar */}
                            <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: `${roleCor(f.role)}22`, border: `2px solid ${roleCor(f.role)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.1rem', color: roleCor(f.role), flexShrink: 0 }}>
                                {f.nome.charAt(0).toUpperCase()}
                            </div>

                            {/* Infos */}
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                    <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{f.nome}</span>
                                    <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '4px', background: `${roleCor(f.role)}20`, color: roleCor(f.role), fontWeight: 600 }}>
                                        {roleIcon(f.role)} {f.role === 'Vendedor' ? 'Consultor de Vendas' : f.role}
                                    </span>
                                    {!f.ativo && <span style={{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: '4px', background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>INATIVO</span>}
                                </div>
                                <div style={{ fontSize: '0.82rem', color: 'var(--color-gray-400)', marginTop: '2px' }}>{f.email}</div>
                                {f.role === 'Vendedor' && (
                                    <div style={{ fontSize: '0.78rem', color: '#fbbf24', marginTop: '2px' }}>💰 Comissão: {f.comissaoPercent.toFixed(1)}% por venda</div>
                                )}
                            </div>

                            {/* Ações */}
                            <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                                <button onClick={() => abrirEditar(f)} title="Editar"
                                    style={{ padding: '7px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', cursor: 'pointer', color: 'var(--color-gray-300)', display: 'flex', alignItems: 'center' }}>
                                    <Edit2 size={15} />
                                </button>
                                <button onClick={() => toggleAtivo(f)} title={f.ativo ? 'Desativar acesso' : 'Reativar acesso'}
                                    style={{ padding: '7px', borderRadius: '8px', border: `1px solid ${f.ativo ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`, background: f.ativo ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)', cursor: 'pointer', color: f.ativo ? '#ef4444' : '#34d399', display: 'flex', alignItems: 'center' }}>
                                    <Power size={15} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ─── Modal de Cadastro/Edição ─── */}
            {showModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '16px' }}>
                    <div className="glass-panel" style={{ maxWidth: '480px', width: '100%', padding: '28px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.12)' }}>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0, fontWeight: 700 }}>{editando ? '✏️ Editar Funcionário' : '👤 Novo Funcionário'}</h3>
                            <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-gray-400)', fontSize: '1.2rem' }}>✕</button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div>
                                <label style={{ fontSize: '0.8rem', color: 'var(--color-gray-400)', display: 'block', marginBottom: '4px' }}>Nome Completo*</label>
                                <input className="form-input" value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} placeholder="Ex: João da Silva" />
                            </div>

                            {!editando && (
                                <>
                                    <div>
                                        <label style={{ fontSize: '0.8rem', color: 'var(--color-gray-400)', display: 'block', marginBottom: '4px' }}>E-mail de Acesso*</label>
                                        <input className="form-input" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="joao@gravity.com.br" />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.8rem', color: 'var(--color-gray-400)', display: 'block', marginBottom: '4px' }}>Senha Inicial*</label>
                                        <input className="form-input" type="password" value={form.senha} onChange={e => setForm(p => ({ ...p, senha: e.target.value }))} placeholder="Mínimo 6 caracteres" />
                                        <div style={{ fontSize: '0.72rem', color: 'var(--color-gray-400)', marginTop: '3px' }}>O funcionário poderá alterar a senha após o primeiro login.</div>
                                    </div>
                                </>
                            )}

                            <div>
                                <label style={{ fontSize: '0.8rem', color: 'var(--color-gray-400)', display: 'block', marginBottom: '6px' }}>Nível de Acesso*</label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {ROLES_DISPONIVEIS.map(({ value, label, icon, desc, color }) => (
                                        <div key={value} onClick={() => setForm(p => ({ ...p, role: value }))}
                                            style={{ padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', border: form.role === value ? `2px solid ${color}` : '1px solid rgba(255,255,255,0.08)', background: form.role === value ? `${color}15` : 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', gap: '10px', transition: 'all 0.15s' }}>
                                            <span>{icon}</span>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 600, fontSize: '0.88rem', color: form.role === value ? color : '#fff' }}>{label}</div>
                                                <div style={{ fontSize: '0.73rem', color: 'var(--color-gray-400)' }}>{desc}</div>
                                            </div>
                                            {form.role === value && <span style={{ fontSize: '0.7rem', color, fontWeight: 700 }}>✓</span>}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {form.role === 'Vendedor' && (
                                <div>
                                    <label style={{ fontSize: '0.8rem', color: 'var(--color-gray-400)', display: 'block', marginBottom: '4px' }}>Comissão por Venda (%)</label>
                                    <input className="form-input" type="number" step="0.5" min="0" max="20"
                                        value={form.comissaoPercent} onChange={e => setForm(p => ({ ...p, comissaoPercent: Number(e.target.value) }))}
                                        placeholder="Ex: 2.5" />
                                </div>
                            )}

                            <div>
                                <label style={{ fontSize: '0.8rem', color: 'var(--color-gray-400)', display: 'block', marginBottom: '4px' }}>Cargo / Apelido (opcional)</label>
                                <input className="form-input" value={form.cargo} onChange={e => setForm(p => ({ ...p, cargo: e.target.value }))} placeholder="Ex: Gerente de Piso, Captador" />
                            </div>
                        </div>

                        {msgStatus && (
                            <div style={{ marginTop: '14px', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem', background: msgStatus.tipo === 'ok' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: msgStatus.tipo === 'ok' ? '#34d399' : '#ef4444', border: `1px solid ${msgStatus.tipo === 'ok' ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}` }}>
                                {msgStatus.tipo === 'ok' ? '✅' : '⚠️'} {msgStatus.texto}
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
                            <button className="btn" onClick={() => setShowModal(false)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)' }}>Cancelar</button>
                            <button className="btn btn-primary" onClick={salvar} disabled={salvando}>
                                {salvando ? 'Salvando...' : (editando ? 'Salvar Alterações' : 'Cadastrar Funcionário')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FuncionariosPage;
