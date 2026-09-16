import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

interface ClienteProps {
  id: number;
  nome: string;
  docIdentificacao: string;
  email: string | null;
  telefone: string | null;
}

function Clientes() {
  const [clientes, setClientes] = useState<ClienteProps[]>([]);

  useEffect(() => {
    async function buscaDados() {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/clientes`);
      const dados = await response.json();
      setClientes(dados);
    }
    buscaDados();
  }, []);

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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Clientes;
