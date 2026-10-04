import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, KeyRound } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../api';
import logoImg from '../assets/Logo.png';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [tokenSeguranca, setTokenSeguranca] = useState('');
    const [modoToken, setModoToken] = useState(false);
    const [mostrarSenha, setMostrarSenha] = useState(false);
    const [lembrarMim, setLembrarMim] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (modoToken) {
            const codigoNumerico = tokenSeguranca.trim().replace(/\D/g, '');
            if (codigoNumerico.length !== 6) {
                setError('O código de liberação deve conter exatamente 6 dígitos numéricos.');
                return;
            }
        }

        setLoading(true);

        try {
            const url = modoToken ? `${API_BASE_URL}/Auth/login-token` : `${API_BASE_URL}/Auth/login`;
            const payload = modoToken 
                ? { email: email.trim() || undefined, codigo: tokenSeguranca.trim().replace(/\D/g, '') }
                : { email: email.trim(), senha };

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const responseText = await response.text();
                let errorMsg = modoToken ? 'Código de liberação inválido ou expirado.' : 'E-mail ou senha inválidos.';
                try {
                    const errorData = JSON.parse(responseText);
                    errorMsg = errorData.erro || errorData.message || errorData.title || errorMsg;
                } catch {
                    if (responseText && responseText.length < 200 && !responseText.includes('<html')) {
                        errorMsg = responseText;
                    } else if (response.status === 500 || response.status === 503) {
                        errorMsg = 'Banco de dados inacessível ou temporariamente offline na porta 5434.';
                    }
                }
                throw new Error(errorMsg);
            }

            const data = await response.json();
            login(data.token, data.role);
            navigate('/');
        } catch (err: any) {
            setError(err.message || 'Erro ao realizar autenticação.');
        } finally {
            setLoading(false);
        }
    };

    const alternarModo = (usarToken: boolean) => {
        setModoToken(usarToken);
        setError('');
    };

    return (
        <div className="login-split-layout">
            {/* Background glowing effects */}
            <div className="glow-effect glow-top-left"></div>
            <div className="glow-effect glow-bottom-right"></div>
            <div className="dotted-pattern dot-top-left"></div>
            <div className="dotted-pattern dot-bottom-right"></div>

            {/* Left side (Brand) */}
            <div className="login-brand-side">
                <div className="brand-content">
                    <img src={logoImg} alt="XY Works Logo" className="brand-logo-large" />
                    <p className="brand-tagline">
                        Soluções inteligentes para<br />
                        <span className="brand-highlight">impulsionar</span> o seu negócio.
                    </p>
                </div>
            </div>

            {/* Right side (Form) */}
            <div className="login-form-side">
                <div className="login-card-modern">
                    <div className="login-card-header">
                        <img src={logoImg} alt="Motors Xy System Logo" style={{ height: '140px', objectFit: 'contain', marginBottom: '16px' }} />
                        <h2>{modoToken ? 'Código de Liberação' : 'Bem-vindo de volta!'}</h2>
                        <p>{modoToken ? 'Digite o código de 6 dígitos fornecido ao criar seu acesso.' : 'Acesse sua conta para continuar.'}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="login-form">
                        <div className="form-group">
                            <label htmlFor="email">E-mail corporativo {modoToken && <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>(opcional se o código for único)</span>}</label>
                            <div className="input-with-icon">
                                <Mail size={18} className="icon-left" />
                                <input
                                    id="email"
                                    type="email"
                                    required={!modoToken}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="seu@email.com"
                                />
                            </div>
                        </div>

                        {!modoToken ? (
                            <>
                                <div className="form-group">
                                    <label htmlFor="senha">Senha</label>
                                    <div className="input-with-icon">
                                        <Lock size={18} className="icon-left" />
                                        <input
                                            id="senha"
                                            type={mostrarSenha ? "text" : "password"}
                                            required
                                            value={senha}
                                            onChange={(e) => setSenha(e.target.value)}
                                            placeholder="••••••••"
                                            style={{ letterSpacing: '2px' }}
                                        />
                                        <button 
                                            type="button" 
                                            className="icon-right-btn"
                                            onClick={() => setMostrarSenha(!mostrarSenha)}
                                        >
                                            {mostrarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="form-options">
                                    <label className="checkbox-label">
                                        <input 
                                            type="checkbox" 
                                            checked={lembrarMim}
                                            onChange={(e) => setLembrarMim(e.target.checked)}
                                        />
                                        <span>Lembrar de mim</span>
                                    </label>
                                    <Link to="/esqueci-minha-senha" className="forgot-link">
                                        Esqueci minha senha
                                    </Link>
                                </div>
                            </>
                        ) : (
                            <div className="form-group">
                                <label htmlFor="tokenSeguranca">Token de Liberação (6 Dígitos)</label>
                                <div className="input-with-icon">
                                    <ShieldCheck size={18} className="icon-left" style={{ color: 'var(--primary-color, #ff6600)' }} />
                                    <input
                                        id="tokenSeguranca"
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        maxLength={6}
                                        required
                                        autoFocus
                                        value={tokenSeguranca}
                                        onChange={(e) => setTokenSeguranca(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        placeholder="0 0 0 0 0 0"
                                        style={{ 
                                            letterSpacing: '8px', 
                                            fontSize: '1.25rem', 
                                            fontWeight: 700, 
                                            textAlign: 'center',
                                            textTransform: 'uppercase'
                                        }}
                                    />
                                </div>
                                <span style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '4px', display: 'block' }}>
                                    Código numérico emitido no momento da criação da conta.
                                </span>
                            </div>
                        )}

                        {error && (
                            <div className="error-message">
                                {error}
                            </div>
                        )}

                        <button type="submit" disabled={loading} className="btn-modern-primary">
                            <span>{loading ? (modoToken ? 'Validando token...' : 'Entrando...') : (modoToken ? 'Liberar e Acessar' : 'Entrar')}</span>
                            {!loading && (modoToken ? <ShieldCheck size={18} /> : <ArrowRight size={18} />)}
                        </button>

                        <div className="divider">
                            <span>ou continue com</span>
                        </div>

                        {!modoToken ? (
                            <button 
                                type="button" 
                                className="btn-modern-secondary" 
                                onClick={() => alternarModo(true)}
                            >
                                <ShieldCheck size={18} />
                                <span>Entrar com token de segurança</span>
                            </button>
                        ) : (
                            <button 
                                type="button" 
                                className="btn-modern-secondary" 
                                onClick={() => alternarModo(false)}
                            >
                                <KeyRound size={18} />
                                <span>Entrar com e-mail e senha</span>
                            </button>
                        )}
                    </form>

                    <div className="login-footer">
                        © 2025 XY Works. Todos os direitos reservados.
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
