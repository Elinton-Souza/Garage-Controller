import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { useUsuarioStore, type RoleUsuario } from "./context/UsuarioContext"

const loginSchema = z.object({
  email: z.email({ message: "Email inválido" }),
  senha: z.string().min(1, { message: "Informe a senha" }),
})

type LoginForm = z.infer<typeof loginSchema>

const PERFIS: { valor: RoleUsuario; label: string }[] = [
  { valor: "ADMIN", label: "Admin" },
  { valor: "GERENTE", label: "Gerente" },
  { valor: "FUNCIONARIO", label: "Funcionário" },
]

const PERFIL_LABEL: Record<RoleUsuario, string> = {
  ADMIN: "Admin",
  GERENTE: "Gerente",
  FUNCIONARIO: "Funcionário",
}

function Login() {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })
  const navigate = useNavigate()
  const logaUsuario = useUsuarioStore((state) => state.logaUsuario)
  const [perfilSelecionado, setPerfilSelecionado] = useState<RoleUsuario>("FUNCIONARIO")

  async function onSubmit(data: LoginForm) {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })

    if (response.status === 200) {
      const usuario = await response.json()

      if (usuario.role !== perfilSelecionado) {
        toast.error(
          `Este login não é de ${PERFIL_LABEL[perfilSelecionado]}. Selecione o perfil correto e tente novamente.`,
        )
        return
      }

      logaUsuario(usuario)
      toast.success(`Bem-vindo(a), ${usuario.nome}!`)
      navigate("/inicio")
    } else {
      const erro = await response.json()
      toast.error(erro.erro)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4">
      <div className="flex flex-col items-center mb-6">
        <span className="text-4xl">🚗</span>
        <h1 className="text-3xl font-bold text-blue-800 mt-1">Garage Controller</h1>
        <p className="text-sm text-gray-500">Sistema de Gestão de Oficinas</p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white p-8 rounded-lg shadow-md w-80 flex flex-col gap-3"
      >
        <h2 className="text-xl font-bold text-center mb-2">Entrar</h2>

        <div>
          <label className="text-sm font-medium block mb-1">Perfil</label>
          <div className="grid grid-cols-3 gap-1">
            {PERFIS.map((p) => (
              <button
                key={p.valor}
                type="button"
                onClick={() => setPerfilSelecionado(p.valor)}
                className={`text-xs rounded px-2 py-1.5 border transition-colors ${
                  perfilSelecionado === p.valor
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <label className="text-sm font-medium">Email</label>
        <input
          type="email"
          {...register("email")}
          className="border rounded px-3 py-2"
        />
        {errors.email && <span className="text-red-600 text-sm">{errors.email.message}</span>}

        <label className="text-sm font-medium">Senha</label>
        <input
          type="password"
          {...register("senha")}
          className="border rounded px-3 py-2"
        />
        {errors.senha && <span className="text-red-600 text-sm">{errors.senha.message}</span>}

        <button
          type="submit"
          className="bg-blue-600 text-white rounded py-2 mt-3 hover:bg-blue-700"
        >
          Entrar
        </button>
      </form>
    </div>
  )
}

export default Login
