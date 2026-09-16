import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

interface VeiculoProps {
  id: number;
  placa: string;
  marca: string;
  modelo: string | null;
  ano: number;
  cliente: { nome: string };
}

function Veiculos() {
  const [veiculos, setVeiculos] = useState<VeiculoProps[]>([]);

  useEffect(() => {
    async function buscaDados() {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/veiculos`);
      const dados = await response.json();
      setVeiculos(dados);
    }
    buscaDados();
  }, []);

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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Veiculos;
