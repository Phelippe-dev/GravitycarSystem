import React, { useEffect, useState } from "react";
import { fetchClientes, adicionarCliente } from "../api";
import type { Cliente } from "../api";
import { useNavigate } from "react-router-dom";
import { buscarCnpj, buscarCep } from "../services/brasilapi";
import { Loader2, CheckCircle, Building2, User } from "lucide-react";

const Clientes: React.FC = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();

  const [tipoPessoa, setTipoPessoa] = useState<"PF" | "PJ">("PF");
  const [loadingCnpj, setLoadingCnpj] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);
  const [cnpjStatus, setCnpjStatus] = useState<"idle" | "ok" | "error">("idle");
  const [cepStatus, setCepStatus] = useState<"idle" | "ok" | "error">("idle");

  const [formData, setFormData] = useState<Partial<Cliente>>({
    nome: "", cpfCnpj: "", email: "", telefone: "",
    endereco: "", cep: "", bairro: "", cidade: "", estado: ""
  });

  useEffect(() => { carregarClientes(); }, []);

  const carregarClientes = async () => {
    setLoading(true);
    const dados = await fetchClientes();
    setClientes(dados);
    setLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCnpjBlur = async () => {
    const doc = (formData.cpfCnpj || "").replace(/\D/g, "");
    if (tipoPessoa !== "PJ" || doc.length !== 14) return;
    setLoadingCnpj(true);
    setCnpjStatus("idle");
    const data = await buscarCnpj(doc);
    setLoadingCnpj(false);
    if (data) {
      setCnpjStatus("ok");
      const cepNumeros = (data.cep || "").replace(/\D/g, "");
      setFormData(prev => ({
        ...prev,
        nome: data.razao_social || prev.nome,
        email: data.email || prev.email,
        telefone: data.ddd_telefone_1?.replace(/\D/g, "") || prev.telefone,
        endereco: data.logradouro ? `${data.logradouro}${data.numero ? ", " + data.numero : ""}` : prev.endereco,
        bairro: data.bairro || prev.bairro,
        cidade: data.municipio || prev.cidade,
        estado: data.uf || prev.estado,
        cep: cepNumeros || prev.cep,
      }));
    } else {
      setCnpjStatus("error");
    }
  };

  const handleCepBlur = async () => {
    const cep = (formData.cep || "").replace(/\D/g, "");
    if (cep.length !== 8) return;
    setLoadingCep(true);
    setCepStatus("idle");
    const data = await buscarCep(cep);
    setLoadingCep(false);
    if (data) {
      setCepStatus("ok");
      setFormData(prev => ({
        ...prev,
        endereco: data.logradouro || prev.endereco,
        bairro: data.bairro || prev.bairro,
        cidade: data.localidade || prev.cidade,
        estado: data.uf || prev.estado,
      }));
    } else {
      setCepStatus("error");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adicionarCliente(formData);
      setShowForm(false);
      setFormData({ nome: "", cpfCnpj: "", email: "", telefone: "", endereco: "", cep: "", bairro: "", cidade: "", estado: "" });
      setCnpjStatus("idle");
      setCepStatus("idle");
      carregarClientes();
    } catch {
      alert("Erro ao salvar cliente.");
    }
  };

  const borderColor = (s: "idle" | "ok" | "error") =>
    s === "ok" ? "var(--color-success)" : s === "error" ? "var(--color-danger)" : undefined;

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", width: "100%" }}>
      <header className="page-header">
        <h1 className="page-title">Gestao de Clientes</h1>
        {!showForm && (
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Novo Cliente</button>
        )}
      </header>

      {showForm ? (
        <div className="glass-panel" style={{ padding: "32px", marginBottom: "24px" }}>
          <h2 style={{ marginBottom: "24px" }}>Cadastrar Novo Cliente</h2>

          <div style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
            <button type="button" className={`btn ${tipoPessoa === "PF" ? "btn-primary" : "btn-outline"}`}
              style={{ display: "flex", alignItems: "center", gap: "8px" }} onClick={() => setTipoPessoa("PF")}>
              <User size={16} /> Pessoa Fisica
            </button>
            <button type="button" className={`btn ${tipoPessoa === "PJ" ? "btn-primary" : "btn-outline"}`}
              style={{ display: "flex", alignItems: "center", gap: "8px" }} onClick={() => setTipoPessoa("PJ")}>
              <Building2 size={16} /> Pessoa Juridica
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group" style={{ position: "relative" }}>
                <label className="form-label">{tipoPessoa === "PJ" ? "CNPJ" : "CPF"}</label>
                <div style={{ position: "relative" }}>
                  <input type="text" name="cpfCnpj" className="form-input" required
                    placeholder={tipoPessoa === "PJ" ? "00.000.000/0001-00" : "000.000.000-00"}
                    value={formData.cpfCnpj} onChange={handleChange} onBlur={handleCnpjBlur}
                    style={{ borderColor: borderColor(cnpjStatus) }} />
                  <div style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)" }}>
                    {loadingCnpj && <Loader2 size={16} color="var(--color-blue)" />}
                    {cnpjStatus === "ok" && <CheckCircle size={16} color="var(--color-success)" />}
                  </div>
                </div>
                {tipoPessoa === "PJ" && cnpjStatus === "ok" && (
                  <span style={{ fontSize: "0.75rem", color: "var(--color-success)", marginTop: "4px", display: "block" }}>
                    Dados preenchidos automaticamente via Receita Federal
                  </span>
                )}
                {tipoPessoa === "PJ" && cnpjStatus === "error" && (
                  <span style={{ fontSize: "0.75rem", color: "var(--color-danger)", marginTop: "4px", display: "block" }}>
                    CNPJ nao encontrado na Receita Federal
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">{tipoPessoa === "PJ" ? "Razao Social" : "Nome Completo"}</label>
                <input type="text" name="nome" className="form-input" required
                  value={formData.nome} onChange={handleChange}
                  placeholder={tipoPessoa === "PJ" ? "Preenchido automaticamente pelo CNPJ" : "Nome completo"} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">E-mail</label>
                <input type="email" name="email" className="form-input"
                  value={formData.email} onChange={handleChange} placeholder="email@exemplo.com" />
              </div>
              <div className="form-group">
                <label className="form-label">Telefone</label>
                <input type="text" name="telefone" className="form-input"
                  value={formData.telefone} onChange={handleChange} placeholder="(11) 99999-9999" />
              </div>
            </div>

            <div style={{ marginTop: "16px", padding: "20px", background: "rgba(0,0,0,0.2)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }}>
              <h4 style={{ margin: "0 0 16px 0", fontSize: "0.85rem", color: "var(--color-gray-300)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Endereco
              </h4>
              <div className="form-row">
                <div className="form-group" style={{ flex: "0 0 200px" }}>
                  <label className="form-label">CEP</label>
                  <div style={{ position: "relative" }}>
                    <input type="text" name="cep" className="form-input"
                      value={formData.cep} onChange={handleChange} onBlur={handleCepBlur}
                      placeholder="00000-000" maxLength={9}
                      style={{ borderColor: borderColor(cepStatus) }} />
                    <div style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)" }}>
                      {loadingCep && <Loader2 size={16} color="var(--color-blue)" />}
                      {cepStatus === "ok" && <CheckCircle size={16} color="var(--color-success)" />}
                    </div>
                  </div>
                  {cepStatus === "ok" && <span style={{ fontSize: "0.75rem", color: "var(--color-success)", marginTop: "4px", display: "block" }}>Endereco preenchido (ViaCEP)</span>}
                  {cepStatus === "error" && <span style={{ fontSize: "0.75rem", color: "var(--color-danger)", marginTop: "4px", display: "block" }}>CEP nao encontrado</span>}
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Logradouro</label>
                  <input type="text" name="endereco" className="form-input"
                    value={formData.endereco} onChange={handleChange} placeholder="Rua, Avenida, numero..." />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Bairro</label>
                  <input type="text" name="bairro" className="form-input"
                    value={formData.bairro} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Cidade</label>
                  <input type="text" name="cidade" className="form-input"
                    value={formData.cidade} onChange={handleChange} />
                </div>
                <div className="form-group" style={{ flex: "0 0 100px" }}>
                  <label className="form-label">UF</label>
                  <input type="text" name="estado" className="form-input"
                    value={formData.estado} onChange={handleChange} maxLength={2} placeholder="SP" />
                </div>
              </div>
            </div>

            <div className="form-group" style={{ marginTop: "24px", display: "flex", gap: "12px" }}>
              <button type="button" className="btn" onClick={() => { setShowForm(false); setCnpjStatus("idle"); setCepStatus("idle"); }}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary">Salvar Cliente</button>
            </div>
          </form>
        </div>
      ) : (
        <div className="table-modern-container">
          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--color-gray-400)" }}>Carregando clientes...</div>
          ) : (
            <table className="table-modern">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Documento (CPF/CNPJ)</th>
                  <th>Contato</th>
                  <th>Acoes</th>
                </tr>
              </thead>
              <tbody>
                {clientes.map(c => {
                  const initial = (c.nome || c.nomeRazaoSocial || "C").charAt(0).toUpperCase();
                  const name = c.nome || c.nomeRazaoSocial || "-";
                  return (
                    <tr key={c.id}>
                      <td><div className="avatar-cell"><div className="avatar-sm">{initial}</div><strong>{name}</strong></div></td>
                      <td>{c.cpfCnpj || "-"}</td>
                      <td>{c.telefone || c.email || "-"}</td>
                      <td>
                        <button className="btn btn-outline" style={{ padding: "6px 12px", fontSize: "0.8rem" }}
                          onClick={() => navigate(`/clientes/${c.id}`)}>Ver Perfil</button>
                      </td>
                    </tr>
                  );
                })}
                {clientes.length === 0 && (
                  <tr><td colSpan={4} style={{ padding: "40px", textAlign: "center", color: "var(--color-gray-400)" }}>Nenhum cliente cadastrado.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default Clientes;
