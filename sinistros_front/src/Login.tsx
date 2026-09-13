import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { useUsuarioStore } from "./context/UsuarioContext"

const loginSchema = z.object({
  email: z.email({ message: "Email inválido" }),
  senha: z.string().min(1, { message: "Informe a senha" }),
})

type LoginForm = z.infer<typeof loginSchema>

function Login() {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })
  const navigate = useNavigate()
  const logaUsuario = useUsuarioStore((state) => state.logaUsuario)

  async function onSubmit(data: LoginForm) {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })

    if (response.status === 200) {
      const usuario = await response.json()
      logaUsuario(usuario)
      toast.success(`Bem-vindo(a), ${usuario.nome}!`)
      navigate("/sinistros")
    } else {
      const erro = await response.json()
      toast.error(erro.erro)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white p-8 rounded-lg shadow-md w-80 flex flex-col gap-3"
      >
        <h1 className="text-2xl font-bold text-center mb-2">Entrar</h1>

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