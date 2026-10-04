import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { consultarAutenticidadeReciboPublico } from '../api';
import { XCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';

const VerificarRecibo: React.FC = () => {
  const { hash } = useParams<{ hash: string }>();
  const [loading, setLoading] = useState(true);
  const [dados, setDados] = useState<any>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (hash) {
      setLoading(true);
      consultarAutenticidadeReciboPublico(hash)
        .then(res => {
          if (res.erro) {
            setErro(res.erro);
          } else {
            setDados(res);
          }
        })
        .catch(() => {
          setErro('Não foi possível verificar a autenticidade deste documento.');
        })
        .finally(() => setLoading(false));
    }
  }, [hash]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0b0f17', padding: '24px' }}>
      <div className="glass-panel" style={{ maxWidth: '650px', width: '100%', padding: '36px', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.1)', boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}>
        
        {/* Logo / Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <img src="/src/assets/Motors Logo.png" alt="Motors Xy" style={{ height: '70px', objectFit: 'contain', marginBottom: '12px' }} />
          <h2 style={{ margin: 0, color: 'white', fontSize: '1.4rem', fontWeight: 700 }}>Validador Oficial de Documentos</h2>
          <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>Motors Xy Automotive Cloud Platform</p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
            <div style={{ fontSize: '1.2rem', marginBottom: '8px' }}>🔍</div>
            <div>Verificando integridade e assinatura criptográfica SHA-256...</div>
          </div>
        ) : erro || !dados ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <XCircle size={56} color="#ef4444" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ color: '#ef4444', margin: '0 0 8px' }}>Documento Não Encontrado ou Inválido</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '24px' }}>
              {erro || 'Este documento não consta na base de dados oficial. Ele pode ter sido adulterado ou emitido fora da plataforma.'}
            </p>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '8px', wordBreak: 'break-all', fontSize: '0.75rem', fontFamily: 'monospace', color: '#94a3b8' }}>
              Hash consultado: {hash}
            </div>
          </div>
        ) : (
          <div>
            {/* Status Banner */}
            <div style={{ 
              padding: '16px', 
              borderRadius: '12px', 
              marginBottom: '24px',
              background: dados.valido ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${dados.valido ? '#10b981' : '#ef4444'}`,
              display: 'flex',
              alignItems: 'center',
              gap: '14px'
            }}>
              {dados.valido ? (
                <CheckCircle2 size={36} color="#10b981" />
              ) : (
                <AlertTriangle size={36} color="#ef4444" />
              )}
              <div>
                <h4 style={{ margin: 0, color: dados.valido ? '#34d399' : '#f87171', fontSize: '1.05rem', fontWeight: 700 }}>
                  {dados.valido ? 'DOCUMENTO AUTÊNTICO E VÁLIDO' : (dados.cancelado ? 'DOCUMENTO CANCELADO' : 'DIVERGÊNCIA NO HASH')}
                </h4>
                <p style={{ margin: '3px 0 0', color: '#cbd5e1', fontSize: '0.85rem' }}>
                  {dados.mensagem}
                </p>
              </div>
            </div>

            {/* Detalhes do Documento */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>NÚMERO DO DOCUMENTO</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: 'white' }}>{dados.numero}</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>TIPO</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#60a5fa' }}>
                    {dados.tipo === 'Sinal' ? 'Recibo de Sinal / Reserva' : 'Recibo de Compra e Venda'}
                  </div>
                </div>
              </div>

              {/* Concessionária Emissora */}
              {dados.empresa && (
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: '4px' }}>CONCESSIONÁRIA EMISSORA</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: 'white' }}>{dados.empresa.nomeFantasia || dados.empresa.razaoSocial}</div>
                  <div style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>
                    CNPJ: {dados.empresa.cnpj || '-'} {dados.empresa.cidade ? `· ${dados.empresa.cidade}/${dados.empresa.uf}` : ''}
                  </div>
                </div>
              )}

              {/* Veículo */}
              {dados.veiculo && (
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: '4px' }}>VEÍCULO OBJETO DO RECIBO</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: 'white' }}>
                    {dados.veiculo.marca} {dados.veiculo.modelo} {dados.veiculo.versao || ''}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#93c5fd', marginTop: '2px' }}>
                    Placa: {dados.veiculo.placa || 'Sem placa'} · Ano: {dados.veiculo.anoModelo || '-'}
                    {dados.veiculo.cilindrada ? ` · ${dados.veiculo.cilindrada} cc` : ''}
                  </div>
                </div>
              )}

              {/* Comprador e Valor */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>COMPRADOR</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'white' }}>{dados.compradorNome || '-'}</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>VALOR TOTAL / PAGO</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#34d399' }}>
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(dados.valorRecebido)}
                  </div>
                </div>
              </div>

              {/* Carimbo de Tempo e Hash */}
              <div style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.08)', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.7rem', color: '#60a5fa', fontWeight: 600, marginBottom: '4px' }}>HASH CRIPTOGRÁFICO DE INTEGRIDADE (SHA-256)</div>
                <code style={{ fontSize: '0.72rem', color: '#93c5fd', wordBreak: 'break-all', display: 'block', fontFamily: 'monospace' }}>
                  {dados.hashSha256}
                </code>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '6px' }}>
                  Emitido em: {new Date(dados.emitidoEmUtc).toLocaleString('pt-BR')} (UTC)
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <Link to="/login" style={{ color: '#60a5fa', fontSize: '0.85rem', textDecoration: 'none' }}>
                ← Acessar Plataforma Motors Xy
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerificarRecibo;
