import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../api';
import logoImg from '../assets/logo.png';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [mostrarSenha, setMostrarSenha] = useState(false);
    const [lembrarMim, setLembrarMim] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/Auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, senha })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erro ao realizar login');
            }

            const data = await response.json();
            login(data.token);
            navigate('/');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
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
                    <img src={logoImg} alt="Gravity Tech Logo" className="brand-logo-large" />
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
                        <h2>Bem-vindo de volta!</h2>
                        <p>Acesse sua conta para continuar.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="login-form">
                        <div className="form-group">
                            <label htmlFor="email">E-mail corporativo</label>
                            <div className="input-with-icon">
                                <Mail size={18} className="icon-left" />
                                <input
                                    id="email"
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="seu@email.com"
                                />
                            </div>
                        </div>

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

                        {error && (
                            <div className="error-message">
                                {error}
                            </div>
                        )}

                        <button type="submit" disabled={loading} className="btn-modern-primary">
                            <span>{loading ? 'Entrando...' : 'Entrar'}</span>
                            {!loading && <ArrowRight size={18} />}
                        </button>

                        <div className="divider">
                            <span>ou continue com</span>
                        </div>

                        <button type="button" className="btn-modern-secondary" onClick={() => alert("Funcionalidade em desenvolvimento!")}>
                            <ShieldCheck size={18} />
                            <span>Entrar com token de segurança</span>
                        </button>
                    </form>

                    <div className="login-footer">
                        © 2025 Gravity Tech. Todos os direitos reservados.
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
