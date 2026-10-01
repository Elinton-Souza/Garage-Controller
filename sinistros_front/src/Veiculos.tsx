import { apiFetch } from "./api";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface VeiculoProps {
  id: number;
  placa: string;
  marca: string;
  modelo: string | null;
  ano: number;
  clienteId: number;
  cliente: { nome: string };
}

function Veiculos() {
  const [veiculos, setVeiculos] = useState<VeiculoProps[]>([]);
  const navigate = useNavigate();

  async function buscaDados() {
    const response = await apiFetch(`/veiculos`);
    const dados = await response.json();
    setVeiculos(dados);
  }

  useEffect(() => {
    buscaDados();
  }, []);

  function editar(veiculo: VeiculoProps) {
    navigate(`/veiculos/${veiculo.id}/editar`, { state: { veiculo } });
  }

  async function remover(veiculo: VeiculoProps) {
    if (!confirm(`Remover o veículo "${veiculo.placa}"? Essa ação não pode ser desfeita.`)) {
      return;
    }
    const response = await apiFetch(`/veiculos/${veiculo.id}`, { method: "DELETE" });
    if (response.status === 200) {
      toast.success("Veículo removido.");
      buscaDados();
    } else {
      const erro = await response.json().catch(() => null);
      toast.error(erro?.erro ? String(erro.erro) : "Erro ao remover veículo");
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Veículos</h1>
        <Link
          to="/veiculos/novo"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + Novo Veículo
        </Link>
      </div>
      <table className="w-full border-collapse bg-white shadow rounded">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="p-3 border-b">ID</th>
            <th className="p-3 border-b">Placa</th>
            <th className="p-3 border-b">Marca</th>
            <th className="p-3 border-b">Modelo</th>
            <th className="p-3 border-b">Ano</th>
            <th className="p-3 border-b">Cliente</th>
            <th className="p-3 border-b"></th>
          </tr>
        </thead>
        <tbody>
          {veiculos.map((veiculo) => (
            <tr key={veiculo.id} className="hover:bg-gray-50">
              <td className="p-3 border-b">{veiculo.id}</td>
              <td className="p-3 border-b">{veiculo.placa}</td>
              <td className="p-3 border-b">{veiculo.marca}</td>
              <td className="p-3 border-b">{veiculo.modelo}</td>
              <td className="p-3 border-b">{veiculo.ano}</td>
              <td className="p-3 border-b">{veiculo.cliente.nome}</td>
              <td className="p-3 border-b text-right whitespace-nowrap">
                <button
                  onClick={() => editar(veiculo)}
                  className="text-xs text-indigo-700 border border-indigo-200 rounded px-2 py-1 hover:bg-indigo-50 mr-2"
                >
                  Editar
                </button>
                <button
                  onClick={() => remover(veiculo)}
                  className="text-xs text-red-600 border border-red-200 rounded px-2 py-1 hover:bg-red-50"
                >
                  Remover
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Veiculos;
