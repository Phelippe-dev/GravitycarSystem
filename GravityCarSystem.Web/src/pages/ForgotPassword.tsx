import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import { API_BASE_URL } from '../api';
import logoImg from '../assets/logo.png';

const ForgotPassword: React.FC = () => {
    const [email, setEmail] = useState('');
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
            const response = await fetch(`${API_BASE_URL}/Auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Erro ao processar solicitação');
            }

            setMessage(data.message + (data.token_dev ? ` (Token de Dev: ${data.token_dev})` : ''));
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
                <h2 className="login-title">Recuperar Senha</h2>
                <p className="login-subtitle">Enviaremos instruções para o seu e-mail</p>
            </div>

            <div className="glass-panel login-box">
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label htmlFor="email" className="form-label" style={{ textAlign: 'center' }}>
                            Qual é o seu e-mail corporativo?
                        </label>
                        <div className="input-icon-wrapper" style={{ marginTop: '8px' }}>
                            <Mail className="input-icon" size={20} />
                            <input
                                id="email"
                                name="email"
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
                        {loading ? 'Enviando...' : 'Enviar Código'}
                    </button>

                    <div style={{ textAlign: 'center', marginTop: '16px' }}>
                        <Link to="/login" style={{ color: 'var(--color-blue-light)', textDecoration: 'none', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                            <ArrowLeft size={16} /> Voltar para o Login
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ForgotPassword;
