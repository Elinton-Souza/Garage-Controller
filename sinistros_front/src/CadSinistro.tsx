import { apiFetch } from "./api";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";

// statusAtual não é mais informado no cadastro: o backend sempre grava o
// sinistro como INICIAL na abertura (StatusSinistro.INICIAL) e o status
// avança depois, tela a tela, na Atualização do sinistro.
const sinistroSchema = z
  .object({
    veiculoId: z.coerce.number().int({ message: "Selecione o veículo" }),
    tipoAtendimento: z.enum(["PARTICULAR", "SEGURO"], {
      message: "Selecione o tipo de atendimento",
    }),
    ciaSeguroId: z.coerce.number().int().optional(),
    corretoraId: z.coerce.number().int().optional(),
    numApolice: z.string().optional(),
    kmAtendimento: z.coerce
      .number()
      .int({ message: "Informe o km no momento do atendimento" }),
  })
  .refine(
    (data) => {
      if (data.tipoAtendimento === "SEGURO") {
        return data.ciaSeguroId !== undefined && data.corretoraId !== undefined;
      }
      return true;
    },
    {
      message:
        "Sinistro via seguro precisa informar a cia de seguro e a corretora",
      path: ["ciaSeguroId"],
    },
  );

type SinistroFormInput = z.input<typeof sinistroSchema>;
type SinistroFormOutput = z.output<typeof sinistroSchema>;

interface OpcaoProps {
  id: number;
  nome?: string;
  placa?: string;
  marca?: string;
}

interface WizardState {
  veiculoId?: number;
  veiculoPlaca?: string;
}

function CadSinistro() {
  const [veiculos, setVeiculos] = useState<OpcaoProps[]>([]);
  const [cias, setCias] = useState<OpcaoProps[]>([]);
  const [corretoras, setCorretoras] = useState<OpcaoProps[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const wizard = (location.state ?? {}) as WizardState;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SinistroFormInput, any, SinistroFormOutput>({
    resolver: zodResolver(sinistroSchema),
    defaultValues: wizard.veiculoId ? { veiculoId: wizard.veiculoId as any } : undefined,
  });
  const tipoAtendimento = watch("tipoAtendimento");

  useEffect(() => {
    async function buscaDados() {
      const [respVeiculos, respCias, respCorretoras] = await Promise.all([
        apiFetch(`/veiculos`),
        apiFetch(`/cia-seguro`),
        apiFetch(`/corretora`),
      ]);
      setVeiculos(await respVeiculos.json());
      setCias(await respCias.json());
      setCorretoras(await respCorretoras.json());
    }
    buscaDados();
  }, []);

  async function onSubmit(data: SinistroFormOutput) {
    const response = await apiFetch(`/sinistro`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (response.status === 201) {
      toast.success("Sinistro cadastrado com sucesso! Status inicial: INICIAL.");
      navigate("/sinistros");
    } else {
      const erro = await response.json();
      toast.error("Erro ao cadastrar sinistro");
      console.error(erro);
    }
  }

  return (
    <div className="p-6 max-w-md">
      <h1 className="text-2xl font-bold mb-4">Novo Sinistro</h1>

      {wizard.veiculoPlaca && (
        <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-800 text-sm rounded px-3 py-2">
          Veículo pré-selecionado: <strong>{wizard.veiculoPlaca}</strong>
        </div>
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-3 bg-white p-6 rounded shadow"
      >
        <label className="text-sm font-medium">Veículo</label>
        <select {...register("veiculoId")} className="border rounded px-3 py-2">
          <option value="">Selecione...</option>
          {veiculos.map((v) => (
            <option key={v.id} value={v.id}>
              {v.placa} — {v.marca}
            </option>
          ))}
        </select>
        {errors.veiculoId && (
          <span className="text-red-600 text-sm">
            {errors.veiculoId.message}
          </span>
        )}

        <label className="text-sm font-medium">Tipo de Atendimento</label>
        <select
          {...register("tipoAtendimento")}
          className="border rounded px-3 py-2"
        >
          <option value="">Selecione...</option>
          <option value="PARTICULAR">Particular</option>
          <option value="SEGURO">Seguro</option>
        </select>
        {errors.tipoAtendimento && (
          <span className="text-red-600 text-sm">
            {errors.tipoAtendimento.message}
          </span>
        )}

        {tipoAtendimento === "SEGURO" && (
          <>
            <label className="text-sm font-medium">Cia de Seguro</label>
            <select
              {...register("ciaSeguroId")}
              className="border rounded px-3 py-2"
            >
              <option value="">Selecione...</option>
              {cias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>

            <label className="text-sm font-medium">Corretora</label>
            <select
              {...register("corretoraId")}
              className="border rounded px-3 py-2"
            >
              <option value="">Selecione...</option>
              {corretoras.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>

            <label className="text-sm font-medium">Nº Apólice</label>
            <input
              {...register("numApolice")}
              className="border rounded px-3 py-2"
            />
          </>
        )}
        {errors.ciaSeguroId && (
          <span className="text-red-600 text-sm">
            {errors.ciaSeguroId.message}
          </span>
        )}

        <label className="text-sm font-medium">Km no Atendimento</label>
        <input
          type="number"
          {...register("kmAtendimento")}
          className="border rounded px-3 py-2"
        />
        {errors.kmAtendimento && (
          <span className="text-red-600 text-sm">
            {errors.kmAtendimento.message}
          </span>
        )}

        <p className="text-xs text-gray-500">
          O status inicial do sinistro é definido automaticamente como <strong>INICIAL</strong>.
        </p>

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

export default CadSinistro;
