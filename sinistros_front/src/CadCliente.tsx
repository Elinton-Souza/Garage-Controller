import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

const clienteSchema = z.object({
  nome: z.string().min(3, { message: "Nome deve possuir, no mínimo, 3 caracteres" }),
  docIdentificacao: z.string().min(11, { message: "Documento inválido" }),
  email: z.email({ message: "Email inválido" }).optional().or(z.literal("")),
  telefone: z.string().optional(),
})

type ClienteForm = z.infer<typeof clienteSchema>

function CadCliente() {
  const { register, handleSubmit, formState: { errors } } = useForm<ClienteForm>({
    resolver: zodResolver(clienteSchema),
  })
  const navigate = useNavigate()

  async function onSubmit(data: ClienteForm) {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/clientes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })

    if (response.status === 201) {
      toast.success("Cliente cadastrado com sucesso!")
      navigate("/clientes")
    } else {
      const erro = await response.json()
      toast.error("Erro ao cadastrar cliente")
      console.error(erro)
    }
  }

  return (
    <div className="p-6 max-w-md">
      <h1 className="text-2xl font-bold mb-4">Novo Cliente</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3 bg-white p-6 rounded shadow">
        <label className="text-sm font-medium">Nome</label>
        <input {...register("nome")} className="border rounded px-3 py-2" />
        {errors.nome && <span className="text-red-600 text-sm">{errors.nome.message}</span>}

        <label className="text-sm font-medium">Documento (CPF/CNPJ)</label>
        <input {...register("docIdentificacao")} className="border rounded px-3 py-2" />
        {errors.docIdentificacao && <span className="text-red-600 text-sm">{errors.docIdentificacao.message}</span>}

        <label className="text-sm font-medium">Email</label>
        <input {...register("email")} className="border rounded px-3 py-2" />
        {errors.email && <span className="text-red-600 text-sm">{errors.email.message}</span>}

        <label className="text-sm font-medium">Telefone</label>
        <input {...register("telefone")} className="border rounded px-3 py-2" />

        <button type="submit" className="bg-blue-600 text-white rounded py-2 mt-3 hover:bg-blue-700">
          Salvar
        </button>
      </form>
    </div>
  )
}

export default CadCliente