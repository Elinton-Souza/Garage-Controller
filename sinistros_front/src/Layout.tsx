import { Link, Outlet } from "react-router-dom"
import { useUsuarioStore } from "./context/UsuarioContext"

function Layout() {
  const usuario = useUsuarioStore((state) => state.usuario)

  return (
    <div>
      <header className="bg-blue-700 text-white p-4 flex justify-between items-center">
        <nav className="flex gap-4 font-medium">
          <Link to="/sinistros" className="hover:underline">Sinistros</Link>
          <Link to="/clientes" className="hover:underline">Clientes</Link>
          <Link to="/veiculos" className="hover:underline">Veículos</Link>
        </nav>
        <span>{usuario.nome}</span>
      </header>
      <Outlet />
    </div>
  )
}

export default Layout