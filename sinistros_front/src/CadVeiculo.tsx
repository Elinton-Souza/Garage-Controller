import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
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

function CadVeiculo() {
  const [clientes, setClientes] = useState<ClienteProps[]>([]);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VeiculoFormInput, any, VeiculoFormOutput>({
    resolver: zodResolver(veiculoSchema),
  });
  const navigate = useNavigate();

  useEffect(() => {
    async function buscaClientes() {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/clientes`);
      const dados = await response.json();
      setClientes(dados);
    }
    buscaClientes();
  }, []);

  async function onSubmit(data: VeiculoFormOutput) {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/veiculos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (response.status === 201) {
      toast.success("Veículo cadastrado com sucesso!");
      navigate("/veiculos");
    } else {
      const erro = await response.json();
      toast.error("Erro ao cadastrar veículo");
      console.error(erro);
    }
  }

  return (
    <div className="p-6 max-w-md">
      <h1 className="text-2xl font-bold mb-4">Novo Veículo</h1>
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
          Salvar
        </button>
      </form>
    </div>
  );
}

export default CadVeiculo;
