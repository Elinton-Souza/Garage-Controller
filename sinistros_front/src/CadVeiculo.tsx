import { apiFetch } from "./api";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

const veiculoSchema = z.object({
  placa: z.string().min(7, { message: "Placa inválida" }),
  marca: z
    .string()
    .min(2, { message: "Marca deve possuir, no mínimo, 2 caracteres" }),
  modelo: z.string().optional(),
  ano: z.coerce.number().int().min(1900, { message: "Ano inválido" }),
  clienteId: z.coerce.number().int({ message: "Selecione o cliente" }),
});

type VeiculoFormInput = z.input<typeof veiculoSchema>;
type VeiculoFormOutput = z.output<typeof veiculoSchema>;

interface ClienteProps {
  id: number;
  nome: string;
}

interface VeiculoExistente {
  id: number;
  placa: string;
  marca: string;
  modelo: string | null;
  ano: number;
  clienteId: number;
}

interface WizardState {
  clienteId?: number;
  clienteNome?: string;
  veiculo?: VeiculoExistente;
}

function CadVeiculo() {
  const { id } = useParams();
  const modoEdicao = !!id;
  const [clientes, setClientes] = useState<ClienteProps[]>([]);
  const [carregando, setCarregando] = useState(modoEdicao);
  const location = useLocation();
  const wizard = (location.state ?? {}) as WizardState;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<VeiculoFormInput, any, VeiculoFormOutput>({
    resolver: zodResolver(veiculoSchema),
    defaultValues: wizard.clienteId ? { clienteId: wizard.clienteId as any } : undefined,
  });
  const navigate = useNavigate();

  useEffect(() => {
    async function buscaClientes() {
      const response = await apiFetch(`/clientes`);
      const dados = await response.json();
      setClientes(dados);
    }
    buscaClientes();
  }, []);

  useEffect(() => {
    if (!modoEdicao) return;

    function preenche(veiculo: VeiculoExistente) {
      reset({
        placa: veiculo.placa,
        marca: veiculo.marca,
        modelo: veiculo.modelo ?? "",
        ano: veiculo.ano as any,
        clienteId: veiculo.clienteId as any,
      });
    }

    if (wizard.veiculo) {
      preenche(wizard.veiculo);
      setCarregando(false);
      return;
    }

    // Acesso direto à URL de edição (sem vir pela lista de veículos): busca
    // os dados pelo id antes de exibir o formulário.
    async function buscaVeiculo() {
      const response = await apiFetch(`/veiculos`);
      const veiculos: (VeiculoExistente & { cliente: { id: number } })[] = await response.json();
      const encontrado = veiculos.find((v) => v.id === Number(id));
      if (encontrado) {
        preenche(encontrado);
      } else {
        toast.error("Veículo não encontrado");
        navigate("/veiculos");
      }
      setCarregando(false);
    }
    buscaVeiculo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modoEdicao, id]);

  async function onSubmit(data: VeiculoFormOutput) {
    if (modoEdicao) {
      const response = await apiFetch(`/veiculos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.status === 200) {
        toast.success("Veículo atualizado com sucesso!");
        navigate("/veiculos");
      } else {
        const erro = await response.json().catch(() => null);
        toast.error(erro?.erro ? String(erro.erro) : "Erro ao atualizar veículo");
      }
      return;
    }

    const response = await apiFetch(`/veiculos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (response.status === 201) {
      const veiculo = await response.json();
      toast.success("Veículo cadastrado com sucesso! Agora abra o sinistro dele.");
      // Fluxo guiado: após salvar o veículo, segue direto para a abertura
      // do sinistro, já com o veículo pré-selecionado.
      navigate("/sinistros/novo", {
        state: { veiculoId: veiculo.id, veiculoPlaca: veiculo.placa },
      });
    } else {
      const erro = await response.json();
      toast.error("Erro ao cadastrar veículo");
      console.error(erro);
    }
  }

  if (carregando) {
    return (
      <div className="p-6">
        <p className="text-sm text-gray-500">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-md">
      <h1 className="text-2xl font-bold mb-4">{modoEdicao ? "Editar Veículo" : "Novo Veículo"}</h1>

      {wizard.clienteNome && !modoEdicao && (
        <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-800 text-sm rounded px-3 py-2">
          Cliente pré-selecionado: <strong>{wizard.clienteNome}</strong>
        </div>
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-3 bg-white p-6 rounded shadow"
      >
        <label className="text-sm font-medium">Placa</label>
        <input
          {...register("placa")}
          className="border rounded px-3 py-2"
          placeholder="ABC1234 ou ABC1D34"
        />
        {errors.placa && (
          <span className="text-red-600 text-sm">{errors.placa.message}</span>
        )}

        <label className="text-sm font-medium">Marca</label>
        <input {...register("marca")} className="border rounded px-3 py-2" />
        {errors.marca && (
          <span className="text-red-600 text-sm">{errors.marca.message}</span>
        )}

        <label className="text-sm font-medium">Modelo</label>
        <input {...register("modelo")} className="border rounded px-3 py-2" />

        <label className="text-sm font-medium">Ano</label>
        <input
          type="number"
          {...register("ano")}
          className="border rounded px-3 py-2"
        />
        {errors.ano && (
          <span className="text-red-600 text-sm">{errors.ano.message}</span>
        )}

        <label className="text-sm font-medium">Cliente</label>
        <select {...register("clienteId")} className="border rounded px-3 py-2">
          <option value="">Selecione...</option>
          {clientes.map((cliente) => (
            <option key={cliente.id} value={cliente.id}>
              {cliente.nome}
            </option>
          ))}
        </select>
        {errors.clienteId && (
          <span className="text-red-600 text-sm">
            {errors.clienteId.message}
          </span>
        )}

        <button
          type="submit"
          className="bg-blue-600 text-white rounded py-2 mt-3 hover:bg-blue-700"
        >
          {modoEdicao ? "Salvar alterações" : "Salvar e abrir sinistro"}
        </button>
      </form>
    </div>
  );
}

export default CadVeiculo;
