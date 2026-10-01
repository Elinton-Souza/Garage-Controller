import { Link } from "react-router-dom"
import { useUsuarioStore, type RoleUsuario } from "./context/UsuarioContext"

interface OpcaoMenu {
  to: string
  titulo: string
  descricao: string
  icone: string
  cor: string
  roles?: RoleUsuario[]
}

const OPCOES: OpcaoMenu[] = [
  {
    to: "/clientes",
    titulo: "Clientes",
    descricao: "Cadastrar e consultar clientes",
    icone: "👤",
    cor: "bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-800",
  },
  {
    to: "/veiculos",
    titulo: "Veículos",
    descricao: "Cadastrar e consultar veículos",
    icone: "🚗",
    cor: "bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-800",
  },
  {
    to: "/sinistros",
    titulo: "Sinistros",
    descricao: "Abrir e acompanhar sinistros",
    icone: "🛠️",
    cor: "bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-800",
  },
  {
    to: "/historico",
    titulo: "Histórico por Placa",
    descricao: "Consultar todo o histórico de um veículo",
    icone: "📋",
    cor: "bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-800",
  },
  {
    to: "/corretoras",
    titulo: "Corretoras e Seguradoras",
    descricao: "Cadastrar corretoras, cias de seguro e seus vínculos",
    icone: "🤝",
    cor: "bg-sky-50 hover:bg-sky-100 border-sky-200 text-sky-800",
  },
  {
    to: "/dashboard",
    titulo: "Dashboard",
    descricao: "Indicadores e gráficos da oficina",
    icone: "📊",
    cor: "bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-800",
    roles: ["ADMIN", "GERENTE"],
  },
  {
    to: "/usuarios",
    titulo: "Gerenciar Usuários",
    descricao: "Cadastrar login de Gerente ou Funcionário",
    icone: "🔑",
    cor: "bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-800",
    roles: ["ADMIN"],
  },
]

function Home() {
  const usuario = useUsuarioStore((state) => state.usuario)
  const opcoesVisiveis = OPCOES.filter((o) => !o.roles || (usuario.role !== "" && o.roles.includes(usuario.role)))

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-1">Olá, {usuario.nome}!</h1>
      <p className="text-gray-500 mb-6">O que você quer fazer agora?</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl">
        {opcoesVisiveis.map((opcao) => (
          <Link
            key={opcao.to}
            to={opcao.to}
            className={`border rounded-lg p-5 flex flex-col gap-2 shadow-sm transition-colors ${opcao.cor}`}
          >
            <span className="text-3xl">{opcao.icone}</span>
            <span className="text-lg font-semibold">{opcao.titulo}</span>
            <span className="text-sm opacity-80">{opcao.descricao}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default Home
