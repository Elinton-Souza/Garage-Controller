import { apiFetch } from "./api";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

interface CorretoraProps {
  id: number;
  nome: string;
  corretorResponsavel: string;
  email: string;
}

interface CiaSeguroProps {
  id: number;
  nome: string;
  telefone: string;
  contatoResponsavel: string;
}

interface VinculoProps {
  corretoraId: number;
  ciaId: number;
  corretora: CorretoraProps;
  cia: CiaSeguroProps;
}

type Aba = "corretoras" | "cias" | "vinculos";

const ABAS: { chave: Aba; label: string }[] = [
  { chave: "corretoras", label: "Corretoras" },
  { chave: "cias", label: "Cias de Seguro" },
  { chave: "vinculos", label: "Vínculos" },
];

// ---------- Corretora ----------
const corretoraSchema = z.object({
  nome: z.string().min(2, { message: "Nome deve possuir, no mínimo, 2 caracteres" }),
  corretorResponsavel: z.string().min(1, { message: "Informe o corretor responsável" }),
  email: z.email({ message: "Email inválido" }),
});
type CorretoraForm = z.infer<typeof corretoraSchema>;

// ---------- Cia de Seguro ----------
const ciaSchema = z.object({
  nome: z.string().min(2, { message: "Nome deve possuir, no mínimo, 2 caracteres" }),
  telefone: z.string().min(1, { message: "Informe o telefone" }),
  contatoResponsavel: z.string().min(1, { message: "Informe o contato responsável" }),
});
type CiaForm = z.infer<typeof ciaSchema>;

// ---------- Vínculo ----------
const vinculoSchema = z.object({
  corretoraId: z.coerce.number().int({ message: "Selecione a corretora" }),
  ciaId: z.coerce.number().int({ message: "Selecione a cia de seguro" }),
});
type VinculoFormInput = z.input<typeof vinculoSchema>;
type VinculoFormOutput = z.output<typeof vinculoSchema>;

function CorretorasSeguradoras() {
  const [aba, setAba] = useState<Aba>("corretoras");
  const [corretoras, setCorretoras] = useState<CorretoraProps[]>([]);
  const [cias, setCias] = useState<CiaSeguroProps[]>([]);
  const [vinculos, setVinculos] = useState<VinculoProps[]>([]);
  const [carregando, setCarregando] = useState(true);

  const [editandoCorretora, setEditandoCorretora] = useState<CorretoraProps | null>(null);
  const [editandoCia, setEditandoCia] = useState<CiaSeguroProps | null>(null);

  async function buscaTudo() {
    setCarregando(true);
    try {
      const [respCorretoras, respCias, respVinculos] = await Promise.all([
        apiFetch("/corretora"),
        apiFetch("/cia-seguro"),
        apiFetch("/corretora-cia"),
      ]);
      setCorretoras(await respCorretoras.json());
      setCias(await respCias.json());
      setVinculos(await respVinculos.json());
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    buscaTudo();
  }, []);

  // ----- Corretora: cadastrar -----
  const {
    register: registerCorretora,
    handleSubmit: handleSubmitCorretora,
    reset: resetCorretora,
    formState: { errors: errosCorretora, isSubmitting: enviandoCorretora },
  } = useForm<CorretoraForm>({ resolver: zodResolver(corretoraSchema) });

  async function onSubmitCorretora(data: CorretoraForm) {
    const response = await apiFetch("/corretora", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (response.status === 201) {
      toast.success("Corretora cadastrada com sucesso!");
      resetCorretora({ nome: "", corretorResponsavel: "", email: "" });
      buscaTudo();
    } else {
      const erro = await response.json().catch(() => null);
      toast.error(erro?.erro ? String(erro.erro) : "Erro ao cadastrar corretora");
    }
  }

  // ----- Corretora: editar -----
  const {
    register: registerEdicaoCorretora,
    handleSubmit: handleSubmitEdicaoCorretora,
    reset: resetEdicaoCorretora,
    formState: { errors: errosEdicaoCorretora, isSubmitting: enviandoEdicaoCorretora },
  } = useForm<CorretoraForm>({ resolver: zodResolver(corretoraSchema) });

  function abrirEdicaoCorretora(corretora: CorretoraProps) {
    setEditandoCorretora(corretora);
    resetEdicaoCorretora({
      nome: corretora.nome,
      corretorResponsavel: corretora.corretorResponsavel,
      email: corretora.email,
    });
  }

  async function onSubmitEdicaoCorretora(data: CorretoraForm) {
    if (!editandoCorretora) return;
    const response = await apiFetch(`/corretora/${editandoCorretora.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (response.status === 200) {
      toast.success("Corretora atualizada com sucesso!");
      setEditandoCorretora(null);
      buscaTudo();
    } else {
      const erro = await response.json().catch(() => null);
      toast.error(erro?.erro ? String(erro.erro) : "Erro ao atualizar corretora");
    }
  }

  async function removerCorretora(corretora: CorretoraProps) {
    if (!confirm(`Remover a corretora "${corretora.nome}"? Essa ação não pode ser desfeita.`)) return;
    const response = await apiFetch(`/corretora/${corretora.id}`, { method: "DELETE" });
    if (response.status === 200) {
      toast.success("Corretora removida.");
      buscaTudo();
    } else {
      const erro = await response.json().catch(() => null);
      toast.error(erro?.erro ? String(erro.erro) : "Erro ao remover corretora");
    }
  }

  // ----- Cia de Seguro: cadastrar -----
  const {
    register: registerCia,
    handleSubmit: handleSubmitCia,
    reset: resetCia,
    formState: { errors: errosCia, isSubmitting: enviandoCia },
  } = useForm<CiaForm>({ resolver: zodResolver(ciaSchema) });

  async function onSubmitCia(data: CiaForm) {
    const response = await apiFetch("/cia-seguro", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (response.status === 201) {
      toast.success("Cia de seguro cadastrada com sucesso!");
      resetCia({ nome: "", telefone: "", contatoResponsavel: "" });
      buscaTudo();
    } else {
      const erro = await response.json().catch(() => null);
      toast.error(erro?.erro ? String(erro.erro) : "Erro ao cadastrar cia de seguro");
    }
  }

  // ----- Cia de Seguro: editar -----
  const {
    register: registerEdicaoCia,
    handleSubmit: handleSubmitEdicaoCia,
    reset: resetEdicaoCia,
    formState: { errors: errosEdicaoCia, isSubmitting: enviandoEdicaoCia },
  } = useForm<CiaForm>({ resolver: zodResolver(ciaSchema) });

  function abrirEdicaoCia(cia: CiaSeguroProps) {
    setEditandoCia(cia);
    resetEdicaoCia({ nome: cia.nome, telefone: cia.telefone, contatoResponsavel: cia.contatoResponsavel });
  }

  async function onSubmitEdicaoCia(data: CiaForm) {
    if (!editandoCia) return;
    const response = await apiFetch(`/cia-seguro/${editandoCia.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (response.status === 200) {
      toast.success("Cia de seguro atualizada com sucesso!");
      setEditandoCia(null);
      buscaTudo();
    } else {
      const erro = await response.json().catch(() => null);
      toast.error(erro?.erro ? String(erro.erro) : "Erro ao atualizar cia de seguro");
    }
  }

  async function removerCia(cia: CiaSeguroProps) {
    if (!confirm(`Remover a cia de seguro "${cia.nome}"? Essa ação não pode ser desfeita.`)) return;
    const response = await apiFetch(`/cia-seguro/${cia.id}`, { method: "DELETE" });
    if (response.status === 200) {
      toast.success("Cia de seguro removida.");
      buscaTudo();
    } else {
      const erro = await response.json().catch(() => null);
      toast.error(erro?.erro ? String(erro.erro) : "Erro ao remover cia de seguro");
    }
  }

  // ----- Vínculo: cadastrar -----
  const {
    register: registerVinculo,
    handleSubmit: handleSubmitVinculo,
    reset: resetVinculo,
    formState: { errors: errosVinculo, isSubmitting: enviandoVinculo },
  } = useForm<VinculoFormInput, any, VinculoFormOutput>({ resolver: zodResolver(vinculoSchema) });

  async function onSubmitVinculo(data: VinculoFormOutput) {
    const response = await apiFetch("/corretora-cia", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (response.status === 201) {
      toast.success("Vínculo cadastrado com sucesso!");
      resetVinculo();
      buscaTudo();
    } else {
      const erro = await response.json().catch(() => null);
      toast.error(erro?.erro ? String(erro.erro) : "Erro ao cadastrar vínculo");
    }
  }

  async function removerVinculo(vinculo: VinculoProps) {
    if (!confirm(`Remover o vínculo entre "${vinculo.corretora?.nome}" e "${vinculo.cia?.nome}"?`)) return;
    const response = await apiFetch(`/corretora-cia/${vinculo.corretoraId}/${vinculo.ciaId}`, {
      method: "DELETE",
    });
    if (response.status === 200) {
      toast.success("Vínculo removido.");
      buscaTudo();
    } else {
      const erro = await response.json().catch(() => null);
      toast.error(erro?.erro ? String(erro.erro) : "Erro ao remover vínculo");
    }
  }

  return (
    <div className="p-6 flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Corretoras e Seguradoras</h1>
        <p className="text-sm text-gray-500">
          Cadastre corretoras, cias de seguro e o vínculo de credenciamento entre elas.
        </p>
      </div>

      <div className="flex gap-1 border-b border-gray-200">
        {ABAS.map((item) => (
          <button
            key={item.chave}
            onClick={() => setAba(item.chave)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              aba === item.chave
                ? "border-blue-600 text-blue-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {carregando ? (
        <p className="text-sm text-gray-500">Carregando...</p>
      ) : (
        <>
          {aba === "corretoras" && (
            <div className="flex flex-col gap-6">
              <div className="bg-white shadow rounded p-4 max-w-xl">
                <h2 className="text-lg font-semibold mb-3">Nova corretora</h2>
                <form onSubmit={handleSubmitCorretora(onSubmitCorretora)} className="flex flex-col gap-3">
                  <div>
                    <label className="text-sm font-medium block mb-1">Nome</label>
                    <input {...registerCorretora("nome")} className="border rounded px-3 py-2 w-full" />
                    {errosCorretora.nome && (
                      <span className="text-red-600 text-sm">{errosCorretora.nome.message}</span>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1">Corretor responsável</label>
                    <input {...registerCorretora("corretorResponsavel")} className="border rounded px-3 py-2 w-full" />
                    {errosCorretora.corretorResponsavel && (
                      <span className="text-red-600 text-sm">{errosCorretora.corretorResponsavel.message}</span>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1">Email</label>
                    <input {...registerCorretora("email")} className="border rounded px-3 py-2 w-full" />
                    {errosCorretora.email && (
                      <span className="text-red-600 text-sm">{errosCorretora.email.message}</span>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={enviandoCorretora}
                    className="bg-blue-600 text-white rounded py-2 mt-2 hover:bg-blue-700 disabled:opacity-50"
                  >
                    {enviandoCorretora ? "Salvando..." : "Cadastrar corretora"}
                  </button>
                </form>
              </div>

              <div>
                <h2 className="text-lg font-semibold mb-3">Corretoras cadastradas</h2>
                {corretoras.length === 0 ? (
                  <p className="text-sm text-gray-500">Nenhuma corretora cadastrada ainda.</p>
                ) : (
                  <table className="w-full border-collapse bg-white shadow rounded">
                    <thead>
                      <tr className="bg-gray-100 text-left">
                        <th className="p-3 border-b">Nome</th>
                        <th className="p-3 border-b">Corretor responsável</th>
                        <th className="p-3 border-b">Email</th>
                        <th className="p-3 border-b"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {corretoras.map((corretora) => (
                        <tr key={corretora.id} className="hover:bg-gray-50">
                          <td className="p-3 border-b">{corretora.nome}</td>
                          <td className="p-3 border-b">{corretora.corretorResponsavel}</td>
                          <td className="p-3 border-b">{corretora.email}</td>
                          <td className="p-3 border-b text-right whitespace-nowrap">
                            <button
                              onClick={() => abrirEdicaoCorretora(corretora)}
                              className="text-xs text-indigo-700 border border-indigo-200 rounded px-2 py-1 hover:bg-indigo-50 mr-2"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => removerCorretora(corretora)}
                              className="text-xs text-red-600 border border-red-200 rounded px-2 py-1 hover:bg-red-50"
                            >
                              Remover
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {aba === "cias" && (
            <div className="flex flex-col gap-6">
              <div className="bg-white shadow rounded p-4 max-w-xl">
                <h2 className="text-lg font-semibold mb-3">Nova cia de seguro</h2>
                <form onSubmit={handleSubmitCia(onSubmitCia)} className="flex flex-col gap-3">
                  <div>
                    <label className="text-sm font-medium block mb-1">Nome</label>
                    <input {...registerCia("nome")} className="border rounded px-3 py-2 w-full" />
                    {errosCia.nome && <span className="text-red-600 text-sm">{errosCia.nome.message}</span>}
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1">Telefone</label>
                    <input {...registerCia("telefone")} className="border rounded px-3 py-2 w-full" />
                    {errosCia.telefone && (
                      <span className="text-red-600 text-sm">{errosCia.telefone.message}</span>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1">Contato responsável</label>
                    <input {...registerCia("contatoResponsavel")} className="border rounded px-3 py-2 w-full" />
                    {errosCia.contatoResponsavel && (
                      <span className="text-red-600 text-sm">{errosCia.contatoResponsavel.message}</span>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={enviandoCia}
                    className="bg-blue-600 text-white rounded py-2 mt-2 hover:bg-blue-700 disabled:opacity-50"
                  >
                    {enviandoCia ? "Salvando..." : "Cadastrar cia de seguro"}
                  </button>
                </form>
              </div>

              <div>
                <h2 className="text-lg font-semibold mb-3">Cias de seguro cadastradas</h2>
                {cias.length === 0 ? (
                  <p className="text-sm text-gray-500">Nenhuma cia de seguro cadastrada ainda.</p>
                ) : (
                  <table className="w-full border-collapse bg-white shadow rounded">
                    <thead>
                      <tr className="bg-gray-100 text-left">
                        <th className="p-3 border-b">Nome</th>
                        <th className="p-3 border-b">Telefone</th>
                        <th className="p-3 border-b">Contato responsável</th>
                        <th className="p-3 border-b"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {cias.map((cia) => (
                        <tr key={cia.id} className="hover:bg-gray-50">
                          <td className="p-3 border-b">{cia.nome}</td>
                          <td className="p-3 border-b">{cia.telefone}</td>
                          <td className="p-3 border-b">{cia.contatoResponsavel}</td>
                          <td className="p-3 border-b text-right whitespace-nowrap">
                            <button
                              onClick={() => abrirEdicaoCia(cia)}
                              className="text-xs text-indigo-700 border border-indigo-200 rounded px-2 py-1 hover:bg-indigo-50 mr-2"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => removerCia(cia)}
                              className="text-xs text-red-600 border border-red-200 rounded px-2 py-1 hover:bg-red-50"
                            >
                              Remover
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {aba === "vinculos" && (
            <div className="flex flex-col gap-6">
              <div className="bg-white shadow rounded p-4 max-w-xl">
                <h2 className="text-lg font-semibold mb-3">Novo vínculo</h2>
                {corretoras.length === 0 || cias.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    Cadastre ao menos uma corretora e uma cia de seguro antes de criar um vínculo.
                  </p>
                ) : (
                  <form onSubmit={handleSubmitVinculo(onSubmitVinculo)} className="flex flex-col gap-3">
                    <div>
                      <label className="text-sm font-medium block mb-1">Corretora</label>
                      <select {...registerVinculo("corretoraId")} className="border rounded px-3 py-2 w-full">
                        <option value="">Selecione...</option>
                        {corretoras.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.nome}
                          </option>
                        ))}
                      </select>
                      {errosVinculo.corretoraId && (
                        <span className="text-red-600 text-sm">{errosVinculo.corretoraId.message}</span>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium block mb-1">Cia de Seguro</label>
                      <select {...registerVinculo("ciaId")} className="border rounded px-3 py-2 w-full">
                        <option value="">Selecione...</option>
                        {cias.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.nome}
                          </option>
                        ))}
                      </select>
                      {errosVinculo.ciaId && (
                        <span className="text-red-600 text-sm">{errosVinculo.ciaId.message}</span>
                      )}
                    </div>
                    <button
                      type="submit"
                      disabled={enviandoVinculo}
                      className="bg-blue-600 text-white rounded py-2 mt-2 hover:bg-blue-700 disabled:opacity-50"
                    >
                      {enviandoVinculo ? "Salvando..." : "Criar vínculo"}
                    </button>
                  </form>
                )}
              </div>

              <div>
                <h2 className="text-lg font-semibold mb-3">Vínculos cadastrados</h2>
                {vinculos.length === 0 ? (
                  <p className="text-sm text-gray-500">Nenhum vínculo cadastrado ainda.</p>
                ) : (
                  <table className="w-full border-collapse bg-white shadow rounded">
                    <thead>
                      <tr className="bg-gray-100 text-left">
                        <th className="p-3 border-b">Corretora</th>
                        <th className="p-3 border-b">Cia de Seguro</th>
                        <th className="p-3 border-b"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {vinculos.map((vinculo) => (
                        <tr key={`${vinculo.corretoraId}-${vinculo.ciaId}`} className="hover:bg-gray-50">
                          <td className="p-3 border-b">{vinculo.corretora?.nome}</td>
                          <td className="p-3 border-b">{vinculo.cia?.nome}</td>
                          <td className="p-3 border-b text-right whitespace-nowrap">
                            <button
                              onClick={() => removerVinculo(vinculo)}
                              className="text-xs text-red-600 border border-red-200 rounded px-2 py-1 hover:bg-red-50"
                            >
                              Remover
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {editandoCorretora && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Editar corretora</h2>
              <button
                onClick={() => setEditandoCorretora(null)}
                className="text-gray-400 hover:text-gray-700 text-lg leading-none"
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmitEdicaoCorretora(onSubmitEdicaoCorretora)} className="flex flex-col gap-3">
              <div>
                <label className="text-sm font-medium block mb-1">Nome</label>
                <input {...registerEdicaoCorretora("nome")} className="border rounded px-3 py-2 w-full" />
                {errosEdicaoCorretora.nome && (
                  <span className="text-red-600 text-sm">{errosEdicaoCorretora.nome.message}</span>
                )}
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Corretor responsável</label>
                <input {...registerEdicaoCorretora("corretorResponsavel")} className="border rounded px-3 py-2 w-full" />
                {errosEdicaoCorretora.corretorResponsavel && (
                  <span className="text-red-600 text-sm">{errosEdicaoCorretora.corretorResponsavel.message}</span>
                )}
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Email</label>
                <input {...registerEdicaoCorretora("email")} className="border rounded px-3 py-2 w-full" />
                {errosEdicaoCorretora.email && (
                  <span className="text-red-600 text-sm">{errosEdicaoCorretora.email.message}</span>
                )}
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setEditandoCorretora(null)}
                  className="flex-1 border rounded py-2 text-gray-600 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={enviandoEdicaoCorretora}
                  className="flex-1 bg-indigo-600 text-white rounded py-2 hover:bg-indigo-700 disabled:opacity-50"
                >
                  {enviandoEdicaoCorretora ? "Salvando..." : "Salvar alterações"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editandoCia && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Editar cia de seguro</h2>
              <button
                onClick={() => setEditandoCia(null)}
                className="text-gray-400 hover:text-gray-700 text-lg leading-none"
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmitEdicaoCia(onSubmitEdicaoCia)} className="flex flex-col gap-3">
              <div>
                <label className="text-sm font-medium block mb-1">Nome</label>
                <input {...registerEdicaoCia("nome")} className="border rounded px-3 py-2 w-full" />
                {errosEdicaoCia.nome && (
                  <span className="text-red-600 text-sm">{errosEdicaoCia.nome.message}</span>
                )}
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Telefone</label>
                <input {...registerEdicaoCia("telefone")} className="border rounded px-3 py-2 w-full" />
                {errosEdicaoCia.telefone && (
                  <span className="text-red-600 text-sm">{errosEdicaoCia.telefone.message}</span>
                )}
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Contato responsável</label>
                <input {...registerEdicaoCia("contatoResponsavel")} className="border rounded px-3 py-2 w-full" />
                {errosEdicaoCia.contatoResponsavel && (
                  <span className="text-red-600 text-sm">{errosEdicaoCia.contatoResponsavel.message}</span>
                )}
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setEditandoCia(null)}
                  className="flex-1 border rounded py-2 text-gray-600 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={enviandoEdicaoCia}
                  className="flex-1 bg-indigo-600 text-white rounded py-2 hover:bg-indigo-700 disabled:opacity-50"
                >
                  {enviandoEdicaoCia ? "Salvando..." : "Salvar alterações"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CorretorasSeguradoras;
