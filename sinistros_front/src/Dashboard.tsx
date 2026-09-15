import { useEffect, useState } from "react";
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

interface ResumoProps {
  sinistrosPorStatus: { status: string; quantidade: number }[];
  sinistrosPorTipo: { tipo: string; quantidade: number }[];
  veiculosPorMarca: { marca: string; quantidade: number }[];
  valorOrcamentosPorMes: { mes: string; total: number }[];
}

const CORES = ["#2563eb", "#16a34a", "#f59e0b", "#dc2626", "#7c3aed", "#0891b2"];

function Dashboard() {
  const [resumo, setResumo] = useState<ResumoProps | null>(null);

  useEffect(() => {
    async function buscaDados() {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/dashboard/resumo`);
      const dados = await response.json();
      setResumo(dados);
    }
    buscaDados();
  }, []);

  if (!resumo) {
    return <div className="p-6">Carregando...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded p-4">
          <h2 className="text-lg font-semibold mb-3">Sinistros por Status</h2>
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
        </div>

        <div className="bg-white shadow rounded p-4">
          <h2 className="text-lg font-semibold mb-3">Particular vs Seguro</h2>
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
          <h2 className="text-lg font-semibold mb-3">Valor de Orçamentos por Mês</h2>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={resumo.valorOrcamentosPorMes}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
              <Line type="monotone" dataKey="total" stroke="#16a34a" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;