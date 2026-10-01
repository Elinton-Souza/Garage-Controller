import { apiFetch } from "./api";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useUsuarioStore, type RoleUsuario } from "./context/UsuarioContext";

interface UsuarioProps {
  id: number;
  nome: string;
  email: string;
  role: RoleUsuario;
}

const novoUsuarioSchema = z.object({
  nome: z.string().min(3, { message: "Nome deve possuir, no mínimo, 3 caracteres" }),
  email: z.email({ message: "Email inválido" }),
  senha: z
    .string()
    .min(8, { message: "A senha deve possuir, no mínimo, 8 caracteres" })
    .regex(/[a-z]/, { message: "A senha deve possuir letra(s) minúscula(s)" })
    .regex(/[A-Z]/, { message: "A senha deve possuir letra(s) maiúscula(s)" })
    .regex(/[0-9]/, { message: "A senha deve possuir número(s)" })
    .regex(/[^a-zA-Z0-9]/, { message: "A senha deve possuir símbolo(s)" }),
  role: z.enum(["ADMIN", "GERENTE", "FUNCIONARIO"]),
});

type NovoUsuarioForm = z.infer<typeof novoUsuarioSchema>;

// Na edição a senha é opcional: campo vazio = mantém a senha atual do usuário.
const editarUsuarioSchema = z.object({
  nome: z.string().min(3, { message: "Nome deve possuir, no mínimo, 3 caracteres" }),
  email: z.email({ message: "Email inválido" }),
  senha: z.union([
    z.literal(""),
    z
      .string()
      .min(8, { message: "A senha deve possuir, no mínimo, 8 caracteres" })
      .regex(/[a-z]/, { message: "A senha deve possuir letra(s) minúscula(s)" })
      .regex(/[A-Z]/, { message: "A senha deve possuir letra(s) maiúscula(s)" })
      .regex(/[0-9]/, { message: "A senha deve possuir número(s)" })
      .regex(/[^a-zA-Z0-9]/, { message: "A senha deve possuir símbolo(s)" }),
  ]),
  role: z.enum(["ADMIN", "GERENTE", "FUNCIONARIO"]),
});

type EditarUsuarioForm = z.infer<typeof editarUsuarioSchema>;

const ROLE_LABEL: Record<RoleUsuario, string> = {
  ADMIN: "Admin",
  GERENTE: "Gerente",
  FUNCIONARIO: "Funcionário",
};

const ROLE_COR: Record<RoleUsuario, string> = {
  ADMIN: "bg-indigo-100 text-indigo-800",
  GERENTE: "bg-blue-100 text-blue-800",
  FUNCIONARIO: "bg-emerald-100 text-emerald-800",
};

function GerenciarUsuarios() {
  const [usuarios, setUsuarios] = useState<UsuarioProps[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [editando, setEditando] = useState<UsuarioProps | null>(null);
  const usuarioLogado = useUsuarioStore((state) => state.usuario);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<NovoUsuarioForm>({
    resolver: zodResolver(novoUsuarioSchema),
    defaultValues: { role: "FUNCIONARIO" },
  });

  const {
    register: registerEdicao,
    handleSubmit: handleSubmitEdicao,
    reset: resetEdicao,
    formState: { errors: errosEdicao, isSubmitting: enviandoEdicao },
  } = useForm<EditarUsuarioForm>({
    resolver: zodResolver(editarUsuarioSchema),
  });

  async function buscaUsuarios() {
    setCarregando(true);
    try {
      const response = await apiFetch("/usuarios");
      const dados = await response.json();
      setUsuarios(dados);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    buscaUsuarios();
  }, []);

  async function onSubmit(data: NovoUsuarioForm) {
    const response = await apiFetch("/usuarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (response.status === 201) {
      toast.success("Usuário cadastrado com sucesso!");
      reset({ nome: "", email: "", senha: "", role: "FUNCIONARIO" });
      buscaUsuarios();
    } else {
      const erro = await response.json().catch(() => null);
      toast.error(erro?.erro ? String(erro.erro) : "Erro ao cadastrar usuário");
    }
  }

  function abrirEdicao(usuario: UsuarioProps) {
    setEditando(usuario);
    resetEdicao({ nome: usuario.nome, email: usuario.email, senha: "", role: usuario.role });
  }

  function fecharEdicao() {
    setEditando(null);
  }

  async function onSubmitEdicao(data: EditarUsuarioForm) {
    if (!editando) return;

    const payload: { nome: string; email: string; role: RoleUsuario; senha?: string } = {
      nome: data.nome,
      email: data.email,
      role: data.role,
    };
    if (data.senha) {
      payload.senha = data.senha;
    }

    const response = await apiFetch(`/usuarios/${editando.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (response.status === 200) {
      toast.success("Usuário atualizado com sucesso!");
      setEditando(null);
      buscaUsuarios();
    } else {
      const erro = await response.json().catch(() => null);
      toast.error(erro?.erro ? String(erro.erro) : "Erro ao atualizar usuário");
    }
  }

  async function remover(usuario: UsuarioProps) {
    if (!confirm(`Remover o login de "${usuario.nome}" (${usuario.email})? Essa ação não pode ser desfeita.`)) {
      return;
    }
    const response = await apiFetch(`/usuarios/${usuario.id}`, { method: "DELETE" });
    if (response.status === 200) {
      toast.success("Usuário removido.");
      buscaUsuarios();
    } else {
      const erro = await response.json().catch(() => null);
      toast.error(erro?.erro ? String(erro.erro) : "Erro ao remover usuário");
    }
  }

  return (
    <div className="p-6 flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Gerenciar Usuários</h1>
        <p className="text-sm text-gray-500">
          Cadastre, edite ou remova logins de Gerente ou Funcionário, e acompanhe quem tem acesso ao sistema.
        </p>
      </div>

      <div className="bg-white shadow rounded p-4 max-w-xl">
        <h2 className="text-lg font-semibold mb-3">Novo usuário</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
          <div>
            <label className="text-sm font-medium block mb-1">Nome</label>
            <input {...register("nome")} className="border rounded px-3 py-2 w-full" />
            {errors.nome && <span className="text-red-600 text-sm">{errors.nome.message}</span>}
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">Email</label>
            <input {...register("email")} className="border rounded px-3 py-2 w-full" />
            {errors.email && <span className="text-red-600 text-sm">{errors.email.message}</span>}
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">Senha</label>
            <input type="password" {...register("senha")} className="border rounded px-3 py-2 w-full" />
            {errors.senha && <span className="text-red-600 text-sm">{errors.senha.message}</span>}
            <p className="text-xs text-gray-400 mt-1">
              Mínimo 8 caracteres, com maiúscula, minúscula, número e símbolo.
            </p>
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">Perfil</label>
            <select {...register("role")} className="border rounded px-3 py-2 w-full">
              <option value="FUNCIONARIO">Funcionário</option>
              <option value="GERENTE">Gerente</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-indigo-600 text-white rounded py-2 mt-2 hover:bg-indigo-700 disabled:opacity-50"
          >
            {isSubmitting ? "Salvando..." : "Cadastrar usuário"}
          </button>
        </form>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Usuários cadastrados</h2>
        {carregando ? (
          <p className="text-sm text-gray-500">Carregando...</p>
        ) : (
          <table className="w-full border-collapse bg-white shadow rounded">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-3 border-b">Nome</th>
                <th className="p-3 border-b">Email</th>
                <th className="p-3 border-b">Perfil</th>
                <th className="p-3 border-b"></th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((usuario) => (
                <tr key={usuario.id} className="hover:bg-gray-50">
                  <td className="p-3 border-b">{usuario.nome}</td>
                  <td className="p-3 border-b">{usuario.email}</td>
                  <td className="p-3 border-b">
                    <span className={`text-xs font-semibold rounded-full px-2.5 py-1 ${ROLE_COR[usuario.role]}`}>
                      {ROLE_LABEL[usuario.role]}
                    </span>
                  </td>
                  <td className="p-3 border-b text-right whitespace-nowrap">
                    <button
                      onClick={() => abrirEdicao(usuario)}
                      className="text-xs text-indigo-700 border border-indigo-200 rounded px-2 py-1 hover:bg-indigo-50 mr-2"
                    >
                      Editar
                    </button>
                    {usuario.id !== usuarioLogado.id && (
                      <button
                        onClick={() => remover(usuario)}
                        className="text-xs text-red-600 border border-red-200 rounded px-2 py-1 hover:bg-red-50"
                      >
                        Remover
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editando && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Editar usuário</h2>
              <button
                onClick={fecharEdicao}
                className="text-gray-400 hover:text-gray-700 text-lg leading-none"
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitEdicao(onSubmitEdicao)} className="flex flex-col gap-3">
              <div>
                <label className="text-sm font-medium block mb-1">Nome</label>
                <input {...registerEdicao("nome")} className="border rounded px-3 py-2 w-full" />
                {errosEdicao.nome && <span className="text-red-600 text-sm">{errosEdicao.nome.message}</span>}
              </div>

              <div>
                <label className="text-sm font-medium block mb-1">Email</label>
                <input {...registerEdicao("email")} className="border rounded px-3 py-2 w-full" />
                {errosEdicao.email && <span className="text-red-600 text-sm">{errosEdicao.email.message}</span>}
              </div>

              <div>
                <label className="text-sm font-medium block mb-1">Nova senha</label>
                <input type="password" {...registerEdicao("senha")} className="border rounded px-3 py-2 w-full" />
                {errosEdicao.senha && <span className="text-red-600 text-sm">{errosEdicao.senha.message}</span>}
                <p className="text-xs text-gray-400 mt-1">
                  Deixe em branco para manter a senha atual. Se preenchida, precisa ter no mínimo 8 caracteres, com
                  maiúscula, minúscula, número e símbolo.
                </p>
              </div>

              <div>
                <label className="text-sm font-medium block mb-1">Perfil</label>
                <select {...registerEdicao("role")} className="border rounded px-3 py-2 w-full">
                  <option value="FUNCIONARIO">Funcionário</option>
                  <option value="GERENTE">Gerente</option>
                  <option value="ADMIN">Admin</option>
                </select>
                {editando.id === usuarioLogado.id && (
                  <p className="text-xs text-amber-600 mt-1">
                    Este é o seu próprio login — não é possível remover o próprio acesso de Admin.
                  </p>
                )}
              </div>

              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={fecharEdicao}
                  className="flex-1 border rounded py-2 text-gray-600 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={enviandoEdicao}
                  className="flex-1 bg-indigo-600 text-white rounded py-2 hover:bg-indigo-700 disabled:opacity-50"
                >
                  {enviandoEdicao ? "Salvando..." : "Salvar alterações"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default GerenciarUsuarios;
