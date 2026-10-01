import { apiFetch } from "./api";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface ClienteProps {
  id: number;
  nome: string;
  docIdentificacao: string;
  email: string | null;
  telefone: string | null;
}

function Clientes() {
  const [clientes, setClientes] = useState<ClienteProps[]>([]);
  const navigate = useNavigate();

  async function buscaDados() {
    const response = await apiFetch(`/clientes`);
    const dados = await response.json();
    setClientes(dados);
  }

  useEffect(() => {
    buscaDados();
  }, []);

  function editar(cliente: ClienteProps) {
    navigate(`/clientes/${cliente.id}/editar`, { state: { cliente } });
  }

  async function remover(cliente: ClienteProps) {
    if (!confirm(`Remover o cliente "${cliente.nome}"? Essa ação não pode ser desfeita.`)) {
      return;
    }
    const response = await apiFetch(`/clientes/${cliente.id}`, { method: "DELETE" });
    if (response.status === 200) {
      toast.success("Cliente removido.");
      buscaDados();
    } else {
      const erro = await response.json().catch(() => null);
      toast.error(erro?.erro ? String(erro.erro) : "Erro ao remover cliente");
    }
  }

  return (
    <div className="p-6">
      <div
        className="flex justify-between
      items-center mb-4">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <Link
          to="/clientes/novo"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          + Novo Cliente
        </Link>
      </div>
      <table className="w-full border-collapse bg-white shadow rounded">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="p-3 border-b">ID</th>
            <th className="p-3 border-b">Nome</th>
            <th className="p-3 border-b">Documento</th>
            <th className="p-3 border-b">Email</th>
            <th className="p-3 border-b">Telefone</th>
            <th className="p-3 border-b"></th>
          </tr>
        </thead>
        <tbody>
          {clientes.map((cliente) => (
            <tr key={cliente.id} className="hover:bg-gray-50">
              <td className="p-3 border-b">{cliente.id}</td>
              <td className="p-3 border-b">{cliente.nome}</td>
              <td className="p-3 border-b">{cliente.docIdentificacao}</td>
              <td className="p-3 border-b">{cliente.email}</td>
              <td className="p-3 border-b">{cliente.telefone}</td>
              <td className="p-3 border-b text-right whitespace-nowrap">
                <button
                  onClick={() => editar(cliente)}
                  className="text-xs text-indigo-700 border border-indigo-200 rounded px-2 py-1 hover:bg-indigo-50 mr-2"
                >
                  Editar
                </button>
                <button
                  onClick={() => remover(cliente)}
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

export default Clientes;
