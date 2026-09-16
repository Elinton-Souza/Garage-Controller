import { useEffect, useState } from "react";
import { useUsuarioStore } from "./context/UsuarioContext";
import { Link } from "react-router-dom";

interface SinistroProps {
  id: number;
  tipoAtendimento: "PARTICULAR" | "SEGURO";
  statusAtual: string;
  dataAbertura: string;
  kmAtendimento: number;
  veiculo: {
    placa: string;
    marca: string;
    modelo: string | null;
  };
}

function Sinistros() {
  const [sinistros, setSinistros] = useState<SinistroProps[]>([]);
  const usuario = useUsuarioStore((state) => state.usuario);

  useEffect(() => {
    async function buscaDados() {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/sinistro`);
      const dados = await response.json();
      setSinistros(dados);
    }
    buscaDados();
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">
          Olá, {usuario.nome}! Lista de Sinistros
        </h1>
        <Link
          to="/sinistros/novo"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 whitespace-nowrap"
        >
          + Novo Sinistro
        </Link>
      </div>
      <table className="w-full border-collapse bg-white shadow rounded">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="p-3 border-b">ID</th>
            <th className="p-3 border-b">Veículo</th>
            <th className="p-3 border-b">Tipo</th>
            <th className="p-3 border-b">Status</th>
            <th className="p-3 border-b">Km</th>
            <th className="p-3 border-b">Data Abertura</th>
          </tr>
        </thead>
        <tbody>
          {sinistros.map((sinistro) => (
            <tr key={sinistro.id} className="hover:bg-gray-50">
              <td className="p-3 border-b">{sinistro.id}</td>
              <td className="p-3 border-b">
                {sinistro.veiculo.placa} — {sinistro.veiculo.marca}{" "}
                {sinistro.veiculo.modelo}
              </td>
              <td className="p-3 border-b">{sinistro.tipoAtendimento}</td>
              <td className="p-3 border-b">{sinistro.statusAtual}</td>
              <td className="p-3 border-b">{sinistro.kmAtendimento}</td>
              <td className="p-3 border-b">
                {new Date(sinistro.dataAbertura).toLocaleDateString("pt-BR")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Sinistros;
