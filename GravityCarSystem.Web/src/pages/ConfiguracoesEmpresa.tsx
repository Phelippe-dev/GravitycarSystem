import React, { useEffect, useState } from "react";
import { Building2, Save, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { API_BASE_URL } from "../api";

interface EmpresaConfig {
  id?: string;
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  inscricaoEstadual: string;
  inscricaoMunicipal: string;
  telefone: string;
  email: string;
  site: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  regimeTributario: string;
  responsavelTecnico: string;
}

const REGIME_OPTIONS = [
  "Simples Nacional",
  "Simples Nacional - Excesso de Sublimite",
  "Lucro Presumido",
  "Lucro Real",
];

// Componente Section extraido para o escopo externo para evitar perda de foco durante a digitacao
const Section: React.FC<{ title: string; icon?: string; children: React.ReactNode }> = ({ title, icon, children }) => (
  <div className="glass-panel" style={{ padding: "24px", marginBottom: "20px" }}>
    <h3 style={{ margin: "0 0 20px 0", fontSize: "0.95rem", fontWeight: 700, color: "var(--color-blue-light)", textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: "8px" }}>
      {icon} {title}
    </h3>
    {children}
  </div>
);

const ConfiguracoesEmpresa: React.FC = () => {
  const [form, setForm] = useState<EmpresaConfig>({
    razaoSocial: "", nomeFantasia: "", cnpj: "", inscricaoEstadual: "",
    inscricaoMunicipal: "", telefone: "", email: "", site: "",
    logradouro: "", numero: "", complemento: "", bairro: "", cidade: "",
    estado: "", cep: "", regimeTributario: "Simples Nacional", responsavelTecnico: ""
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);
  const [buscandoCep, setBuscandoCep] = useState(false);

  const getHeaders = () => {
    const token = localStorage.getItem("@GravityCar:token");
    return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  };

  useEffect(() => {
    carregarEmpresa();
  }, []);

  const carregarEmpresa = async () => {
    setLoading(true);
    try {
      const resp = await fetch(`${API_BASE_URL}/empresa/minha`, { headers: getHeaders() });
      if (resp.ok) {
        const data = await resp.json();
        setForm(prev => ({ ...prev, ...data }));
      }
    } catch { /* usa valores padrao */ }
    setLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const buscarCep = async () => {
    const cep = form.cep.replace(/\D/g, "");
    if (cep.length !== 8) return;
    setBuscandoCep(true);
    try {
      const resp = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await resp.json();
      if (!data.erro) {
        setForm(prev => ({
          ...prev,
          logradouro: data.logradouro || prev.logradouro,
          bairro: data.bairro || prev.bairro,
          cidade: data.localidade || prev.cidade,
          estado: data.uf || prev.estado,
        }));
      }
    } catch { /* silencia */ }
    setBuscandoCep(false);
  };

  const handleSalvar = async () => {
    if (!form.cnpj || !form.razaoSocial) {
      setMsg({ tipo: "erro", texto: "CNPJ e Razão Social são obrigatórios." });
      return;
    }
    setSaving(true);
    setMsg(null);
    try {
      const resp = await fetch(`${API_BASE_URL}/empresa/minha`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(form),
      });
      if (resp.ok) {
        setMsg({ tipo: "ok", texto: "Configurações salvas com sucesso!" });
      } else {
        const err = await resp.text();
        setMsg({ tipo: "erro", texto: err || "Erro ao salvar." });
      }
    } catch {
      setMsg({ tipo: "erro", texto: "Erro de conexão. Tente novamente." });
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "300px", gap: "12px", color: "var(--color-gray-400)" }}>
        <Loader2 size={24} style={{ animation: "spin 1s linear infinite" }} /> Carregando configurações...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", width: "100%" }}>
      <header className="page-header" style={{ marginBottom: "28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "linear-gradient(135deg, #2563eb, #1d4ed8)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Building2 size={22} color="#fff" />
          </div>
          <div>
            <h1 className="page-title" style={{ margin: 0 }}>Configurações da Empresa</h1>
            <p style={{ margin: 0, color: "var(--color-gray-400)", fontSize: "0.85rem" }}>
              Dados fiscais e cadastrais da sua concessionária
            </p>
          </div>
        </div>
        <button
          className="btn btn-primary"
          onClick={handleSalvar}
          disabled={saving}
          style={{ display: "flex", alignItems: "center", gap: "8px" }}
        >
          {saving ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Save size={16} />}
          {saving ? "Salvando..." : "Salvar Configurações"}
        </button>
      </header>

      {msg && (
        <div style={{ padding: "14px 18px", borderRadius: "10px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px", fontSize: "0.9rem", background: msg.tipo === "ok" ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)", color: msg.tipo === "ok" ? "#34d399" : "#ef4444", border: `1px solid ${msg.tipo === "ok" ? "rgba(16,185,129,0.4)" : "rgba(239,68,68,0.4)"}` }}>
          {msg.tipo === "ok" ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {msg.texto}
        </div>
      )}

      {/* Dados Principais */}
      <Section title="Dados da Empresa" icon="🏢">
        <div className="form-row">
          <div className="form-group" style={{ flex: 2 }}>
            <label className="form-label">Razão Social *</label>
            <input type="text" name="razaoSocial" className="form-input" value={form.razaoSocial} onChange={handleChange} placeholder="Ex: Gravity Motors Concessionaria LTDA" />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">Nome Fantasia</label>
            <input type="text" name="nomeFantasia" className="form-input" value={form.nomeFantasia} onChange={handleChange} placeholder="Ex: Gravity Motors" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">CNPJ *</label>
            <input type="text" name="cnpj" className="form-input" value={form.cnpj} onChange={handleChange} placeholder="00.000.000/0001-00" />
          </div>
          <div className="form-group">
            <label className="form-label">Inscrição Estadual</label>
            <input type="text" name="inscricaoEstadual" className="form-input" value={form.inscricaoEstadual} onChange={handleChange} placeholder="000.000.000.000" />
          </div>
          <div className="form-group">
            <label className="form-label">Inscrição Municipal</label>
            <input type="text" name="inscricaoMunicipal" className="form-input" value={form.inscricaoMunicipal} onChange={handleChange} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Regime Tributário</label>
            <select name="regimeTributario" className="form-input" value={form.regimeTributario} onChange={handleChange}>
              {REGIME_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Responsável Técnico / Contador</label>
            <input type="text" name="responsavelTecnico" className="form-input" value={form.responsavelTecnico} onChange={handleChange} placeholder="Nome do contador ou responsável" />
          </div>
        </div>
      </Section>

      {/* Contato */}
      <Section title="Contato" icon="📞">
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Telefone</label>
            <input type="text" name="telefone" className="form-input" value={form.telefone} onChange={handleChange} placeholder="(11) 99999-9999" />
          </div>
          <div className="form-group">
            <label className="form-label">E-mail</label>
            <input type="email" name="email" className="form-input" value={form.email} onChange={handleChange} placeholder="contato@empresa.com.br" />
          </div>
          <div className="form-group">
            <label className="form-label">Site</label>
            <input type="text" name="site" className="form-input" value={form.site} onChange={handleChange} placeholder="www.gravitycar.com.br" />
          </div>
        </div>
      </Section>

      {/* Endereco */}
      <Section title="Endereço" icon="📍">
        <div className="form-row">
          <div className="form-group" style={{ flex: "0 0 200px" }}>
            <label className="form-label">CEP</label>
            <div style={{ position: "relative" }}>
              <input type="text" name="cep" className="form-input" value={form.cep} onChange={handleChange} onBlur={buscarCep} placeholder="00000-000" maxLength={9} />
              {buscandoCep && (
                <div style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)" }}>
                  <Loader2 size={16} style={{ animation: "spin 1s linear infinite", color: "var(--color-blue)" }} />
                </div>
              )}
            </div>
            <span style={{ fontSize: "0.72rem", color: "var(--color-gray-400)", marginTop: "4px", display: "block" }}>Digite e saia do campo para buscar (ViaCEP)</span>
          </div>
          <div className="form-group" style={{ flex: 2 }}>
            <label className="form-label">Logradouro</label>
            <input type="text" name="logradouro" className="form-input" value={form.logradouro} onChange={handleChange} placeholder="Rua, Avenida..." />
          </div>
          <div className="form-group" style={{ flex: "0 0 100px" }}>
            <label className="form-label">Número</label>
            <input type="text" name="numero" className="form-input" value={form.numero} onChange={handleChange} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Complemento</label>
            <input type="text" name="complemento" className="form-input" value={form.complemento} onChange={handleChange} placeholder="Sala, Andar, Bloco..." />
          </div>
          <div className="form-group">
            <label className="form-label">Bairro</label>
            <input type="text" name="bairro" className="form-input" value={form.bairro} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label className="form-label">Cidade</label>
            <input type="text" name="cidade" className="form-input" value={form.cidade} onChange={handleChange} />
          </div>
          <div className="form-group" style={{ flex: "0 0 80px" }}>
            <label className="form-label">UF</label>
            <input type="text" name="estado" className="form-input" value={form.estado} onChange={handleChange} maxLength={2} placeholder="MG" />
          </div>
        </div>
      </Section>

      <div style={{ padding: "16px", background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: "10px", fontSize: "0.82rem", color: "var(--color-gray-300)" }}>
        <strong style={{ color: "var(--color-blue-light)" }}>Importante:</strong> Os dados aqui configurados serão usados automaticamente na emissão de Notas Fiscais e contratos. Certifique-se de que o CNPJ e Inscrição Estadual estão corretos.
      </div>
    </div>
  );
};

export default ConfiguracoesEmpresa;

