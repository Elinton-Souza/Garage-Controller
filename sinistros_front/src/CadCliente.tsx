import { apiFetch } from "./api";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"

const clienteSchema = z.object({
  nome: z.string().min(3, { message: "Nome deve possuir, no mínimo, 3 caracteres" }),
  docIdentificacao: z.string().min(11, { message: "Documento inválido" }),
  email: z.email({ message: "Email inválido" }).optional().or(z.literal("")),
  telefone: z.string().optional(),
})

type ClienteForm = z.infer<typeof clienteSchema>

interface ClienteExistente {
  id: number
  nome: string
  docIdentificacao: string
  email: string | null
  telefone: string | null
}

function CadCliente() {
  const { id } = useParams()
  const modoEdicao = !!id
  const location = useLocation()
  const clienteNoState = (location.state as { cliente?: ClienteExistente } | null)?.cliente
  const [carregando, setCarregando] = useState(modoEdicao && !clienteNoState)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ClienteForm>({
    resolver: zodResolver(clienteSchema),
  })
  const navigate = useNavigate()

  useEffect(() => {
    if (!modoEdicao) return

    function preenche(cliente: ClienteExistente) {
      reset({
        nome: cliente.nome,
        docIdentificacao: cliente.docIdentificacao,
        email: cliente.email ?? "",
        telefone: cliente.telefone ?? "",
      })
    }

    if (clienteNoState) {
      preenche(clienteNoState)
      return
    }

    // Acesso direto à URL de edição (sem vir pela lista de clientes): busca
    // os dados pelo id antes de exibir o formulário.
    async function buscaCliente() {
      const response = await apiFetch(`/clientes`)
      const clientes: ClienteExistente[] = await response.json()
      const encontrado = clientes.find((c) => c.id === Number(id))
      if (encontrado) {
        preenche(encontrado)
      } else {
        toast.error("Cliente não encontrado")
        navigate("/clientes")
      }
      setCarregando(false)
    }
    buscaCliente()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modoEdicao, id])

  async function onSubmit(data: ClienteForm) {
    if (modoEdicao) {
      const response = await apiFetch(`/clientes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (response.status === 200) {
        toast.success("Cliente atualizado com sucesso!")
        navigate("/clientes")
      } else {
        const erro = await response.json().catch(() => null)
        toast.error(erro?.erro ? String(erro.erro) : "Erro ao atualizar cliente")
      }
      return
    }

    const response = await apiFetch(`/clientes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })

    if (response.status === 201) {
      const cliente = await response.json()
      toast.success("Cliente cadastrado com sucesso! Agora cadastre o veículo dele.")
      // Fluxo guiado: após salvar o cliente, segue direto para o cadastro
      // do veículo, já com o cliente pré-selecionado.
      navigate("/veiculos/novo", {
        state: { clienteId: cliente.id, clienteNome: cliente.nome },
      })
    } else {
      const erro = await response.json()
      toast.error("Erro ao cadastrar cliente")
      console.error(erro)
    }
  }

  if (carregando) {
    return (
      <div className="p-6">
        <p className="text-sm text-gray-500">Carregando...</p>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-md">
      <h1 className="text-2xl font-bold mb-4">{modoEdicao ? "Editar Cliente" : "Novo Cliente"}</h1>
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
          {modoEdicao ? "Salvar alterações" : "Salvar e cadastrar veículo"}
        </button>
      </form>
    </div>
  )
}

export default CadCliente
