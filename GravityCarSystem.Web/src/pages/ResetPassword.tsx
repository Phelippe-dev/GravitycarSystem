import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, Key } from 'lucide-react';
import { API_BASE_URL } from '../api';
import logoImg from '../assets/logo.png';

const ResetPassword: React.FC = () => {
    const [email, setEmail] = useState('');
    const [token, setToken] = useState('');
    const [novaSenha, setNovaSenha] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/Auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, token, novaSenha })
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Erro ao redefinir senha');
            }

            setMessage('Senha redefinida com sucesso! Redirecionando...');
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-header">
                <div className="login-logo-container">
                    <img src={logoImg} alt="Gravity Tech Logo" className="login-logo-img" />
                </div>
                <h2 className="login-title">Criar Nova Senha</h2>
                <p className="login-subtitle">Insira o código de segurança e sua nova senha</p>
            </div>

            <div className="glass-panel login-box">
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ textAlign: 'center' }}>E-mail</label>
                        <div className="input-icon-wrapper" style={{ marginTop: '8px' }}>
                            <Mail className="input-icon" size={20} />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="form-input"
                                placeholder="seu@email.com"
                                style={{ textAlign: 'center', paddingLeft: '40px', paddingRight: '40px' }}
                            />
                        </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ textAlign: 'center' }}>Código de Segurança</label>
                        <div className="input-icon-wrapper" style={{ marginTop: '8px' }}>
                            <Key className="input-icon" size={20} />
                            <input
                                type="text"
                                required
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                                className="form-input"
                                placeholder="000000"
                                style={{ textAlign: 'center', paddingLeft: '40px', paddingRight: '40px', letterSpacing: '4px', fontWeight: 'bold' }}
                            />
                        </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ textAlign: 'center' }}>Nova Senha (6 dígitos)</label>
                        <div className="input-icon-wrapper" style={{ marginTop: '8px' }}>
                            <Lock className="input-icon" size={20} />
                            <input
                                type="password"
                                required
                                value={novaSenha}
                                onChange={(e) => setNovaSenha(e.target.value)}
                                className="form-input"
                                placeholder="******"
                                style={{ textAlign: 'center', paddingLeft: '40px', paddingRight: '40px', letterSpacing: '4px' }}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}

                    {message && (
                        <div className="success-message" style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#6ee7b7', padding: '12px', borderRadius: '8px', fontSize: '0.9rem', textAlign: 'center', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                            {message}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary login-btn"
                    >
                        {loading ? 'Salvando...' : 'Redefinir Senha'}
                    </button>
                    
                    <div style={{ textAlign: 'center', marginTop: '16px' }}>
                        <Link to="/login" style={{ color: 'var(--color-gray-400)', textDecoration: 'none', fontSize: '0.9rem' }}>
                            Cancelar
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ResetPassword;
