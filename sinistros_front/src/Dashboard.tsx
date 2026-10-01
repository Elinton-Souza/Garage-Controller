import { apiFetch } from "./api";
import { useEffect, useState } from "react";
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

type StatusSinistro =
  | "INICIAL"
  | "AGUARDANDO_AUTORIZACAO"
  | "AUTORIZADO_COMPRA_PECAS"
  | "EM_SERVICO"
  | "FINALIZADO"
  | "ENTREGUE";

const STATUS_VALORES: StatusSinistro[] = [
  "INICIAL",
  "AGUARDANDO_AUTORIZACAO",
  "AUTORIZADO_COMPRA_PECAS",
  "EM_SERVICO",
  "FINALIZADO",
  "ENTREGUE",
];

const STATUS_LABEL: Record<StatusSinistro, string> = {
  INICIAL: "Inicial",
  AGUARDANDO_AUTORIZACAO: "Aguardando Autorização",
  AUTORIZADO_COMPRA_PECAS: "Autorizado - Compra de Peças",
  EM_SERVICO: "Em Serviço",
  FINALIZADO: "Finalizado",
  ENTREGUE: "Entregue",
};

const MESES_LABEL = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

interface ResumoProps {
  filtros: { status: string[] | null; ano: number; mes: number | null };
  mesAtualChave: string;
  geradoEm: string;
  sinistrosPorStatus: { status: string; quantidade: number }[];
  sinistrosPorTipo: { tipo: string; quantidade: number }[];
  veiculosPorMarca: { marca: string; quantidade: number }[];
  valorOrcamentosPorMes: { mes: string; total: number }[];
}

const CORES = ["#2563eb", "#16a34a", "#f59e0b", "#dc2626", "#7c3aed", "#0891b2"];

function formataMes(chave: string) {
  const [ano, mes] = chave.split("-");
  const idx = Number(mes) - 1;
  return `${MESES_LABEL[idx] ?? mes}/${ano.slice(2)}`;
}

function formataDataHora(iso: string) {
  return new Date(iso).toLocaleString("pt-BR");
}

// Ponto do gráfico de valores: destaca visualmente o mês atual (calculado em
// tempo real, com base na data de hoje) com um marcador maior e diferente.
function PontoMes(props: any) {
  const { cx, cy, payload, mesAtualChave } = props;
  const ehMesAtual = payload?.mes === mesAtualChave;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={ehMesAtual ? 6 : 3}
      fill={ehMesAtual ? "#dc2626" : "#16a34a"}
      stroke="#fff"
      strokeWidth={ehMesAtual ? 2 : 1}
    />
  );
}

function Dashboard() {
  const anoAtual = new Date().getFullYear();
  const [resumo, setResumo] = useState<ResumoProps | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [statusFiltro, setStatusFiltro] = useState<StatusSinistro[]>([]);
  const [ano, setAno] = useState(anoAtual);
  const [mes, setMes] = useState<number | null>(null); // null = acumulado

  useEffect(() => {
    async function buscaDados() {
      setCarregando(true);
      try {
        const params = new URLSearchParams();
        statusFiltro.forEach((s) => params.append("status", s));
        params.set("ano", String(ano));
        if (mes !== null) params.set("mes", String(mes));

        const response = await apiFetch(`/dashboard/resumo?${params.toString()}`);
        const dados = await response.json();
        setResumo(dados);
      } finally {
        setCarregando(false);
      }
    }
    buscaDados();
  }, [statusFiltro, ano, mes]);

  function alternaStatus(status: StatusSinistro) {
    setStatusFiltro((atual) =>
      atual.includes(status) ? atual.filter((s) => s !== status) : [...atual, status],
    );
  }

  if (!resumo) {
    return <div className="p-6">Carregando...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>

      {/* Filtros interativos */}
      <div className="bg-white shadow rounded p-4 mb-6 flex flex-col gap-3">
        <div>
          <p className="text-sm font-medium mb-2">Status do sinistro</p>
          <div className="flex flex-wrap gap-2">
            {STATUS_VALORES.map((s) => (
              <button
                key={s}
                onClick={() => alternaStatus(s)}
                className={`text-xs rounded-full px-3 py-1 border transition-colors ${
                  statusFiltro.includes(s)
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                }`}
              >
                {STATUS_LABEL[s]}
              </button>
            ))}
            {statusFiltro.length > 0 && (
              <button
                onClick={() => setStatusFiltro([])}
                className="text-xs text-gray-500 underline px-2"
              >
                Limpar filtro
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="text-sm font-medium block mb-1">Ano</label>
            <select
              value={ano}
              onChange={(e) => setAno(Number(e.target.value))}
              className="border rounded px-3 py-1.5 text-sm"
            >
              {[anoAtual - 2, anoAtual - 1, anoAtual].map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">Mês</label>
            <select
              value={mes ?? ""}
              onChange={(e) => setMes(e.target.value === "" ? null : Number(e.target.value))}
              className="border rounded px-3 py-1.5 text-sm"
            >
              <option value="">Acumulado (ano todo)</option>
              {MESES_LABEL.map((label, idx) => (
                <option key={label} value={idx + 1}>{label}</option>
              ))}
            </select>
          </div>

          {carregando && <span className="text-xs text-gray-400">Atualizando...</span>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded p-4">
          <h2 className="text-lg font-semibold mb-3">Sinistros por Status</h2>
          {resumo.sinistrosPorStatus.length === 0 ? (
            <p className="text-sm text-gray-500 py-10 text-center">Nenhum sinistro no período/filtro selecionado.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={resumo.sinistrosPorStatus}
                  dataKey="quantidade"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label
                >
                  {resumo.sinistrosPorStatus.map((_, index) => (
                    <Cell key={index} fill={CORES[index % CORES.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white shadow rounded p-4">
          <h2 className="text-lg font-semibold mb-3">Particular vs Seguro</h2>
          {resumo.sinistrosPorTipo.length === 0 ? (
            <p className="text-sm text-gray-500 py-10 text-center">Nenhum sinistro no período/filtro selecionado.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={resumo.sinistrosPorTipo}
                  dataKey="quantidade"
                  nameKey="tipo"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label
                >
                  {resumo.sinistrosPorTipo.map((_, index) => (
                    <Cell key={index} fill={CORES[index % CORES.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white shadow rounded p-4">
          <h2 className="text-lg font-semibold mb-3">Veículos por Marca</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={resumo.veiculosPorMarca}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="marca" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="quantidade" fill="#2563eb" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white shadow rounded p-4">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h2 className="text-lg font-semibold">Valor de Orçamentos por Mês</h2>
          </div>
          <p className="text-xs text-gray-400 mb-3">
            Última atualização: {formataDataHora(resumo.geradoEm)} · o mês atual (
            <span className="text-red-600 font-medium">●</span>) é sempre calculado em tempo real
          </p>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={resumo.valorOrcamentosPorMes}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" tickFormatter={formataMes} />
              <YAxis />
              <Tooltip
                labelFormatter={(label) => formataMes(String(label))}
                formatter={(value) => [`R$ ${Number(value).toFixed(2)}`, "Total"]}
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#16a34a"
                strokeWidth={2}
                dot={(props) => (
                  <PontoMes key={props.payload?.mes ?? props.cx} {...props} mesAtualChave={resumo.mesAtualChave} />
                )}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
