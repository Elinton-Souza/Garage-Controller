import { Link, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom"
import { useUsuarioStore, type RoleUsuario } from "./context/UsuarioContext"

interface LinkNav {
  to: string
  label: string
  roles?: RoleUsuario[]
}

const LINKS: LinkNav[] = [
  { to: "/inicio", label: "Início" },
  { to: "/clientes", label: "Clientes" },
  { to: "/veiculos", label: "Veículos" },
  { to: "/sinistros", label: "Sinistros" },
  { to: "/historico", label: "Histórico por Placa" },
  { to: "/corretoras", label: "Corretoras e Seguradoras" },
  { to: "/dashboard", label: "Dashboard", roles: ["ADMIN", "GERENTE"] },
  { to: "/usuarios", label: "Gerenciar Usuários", roles: ["ADMIN"] },
]

// Páginas já acessíveis diretamente pelo menu principal: não precisam de um
// botão "Voltar" adicional.
const PAGINAS_RAIZ = LINKS.map((l) => l.to)

// Cor do cabeçalho conforme o perfil logado — ajuda a identificar rapidamente
// com qual perfil você está navegando no sistema.
const TEMA_POR_PERFIL: Record<RoleUsuario, { header: string; ativo: string; sair: string }> = {
  ADMIN: { header: "bg-indigo-800", ativo: "bg-indigo-950", sair: "bg-indigo-900 hover:bg-indigo-950" },
  GERENTE: { header: "bg-blue-700", ativo: "bg-blue-900", sair: "bg-blue-800 hover:bg-blue-950" },
  FUNCIONARIO: { header: "bg-emerald-700", ativo: "bg-emerald-900", sair: "bg-emerald-800 hover:bg-emerald-950" },
}

function podeAcessar(roles: RoleUsuario[] | undefined, role: RoleUsuario | "") {
  if (!roles || roles.length === 0) return true
  return role !== "" && roles.includes(role)
}

function Layout() {
  const usuario = useUsuarioStore((state) => state.usuario)
  const deslogaUsuario = useUsuarioStore((state) => state.deslogaUsuario)
  const location = useLocation()
  const navigate = useNavigate()

  // Sem usuário logado (ex: acessou a URL direto, ou já deslogou): volta pro login.
  if (!usuario.token) {
    return <Navigate to="/" replace />
  }

  const role = usuario.role
  const tema = TEMA_POR_PERFIL[role || "FUNCIONARIO"]

  // Rota protegida (ex: /dashboard só para ADMIN/GERENTE) acessada por um
  // perfil sem permissão: mostra a tela de acesso negado em vez da página.
  const linkAtual = LINKS.find((l) => l.to === location.pathname)
  const acessoNegado = linkAtual ? !podeAcessar(linkAtual.roles, role) : false

  const mostraVoltar = !PAGINAS_RAIZ.includes(location.pathname)

  function sair() {
    deslogaUsuario()
    navigate("/")
  }

  return (
    <div>
      <header className={`${tema.header} text-white p-4 flex justify-between items-center flex-wrap gap-2 transition-colors`}>
        <nav className="flex gap-1 flex-wrap">
          {LINKS.filter((link) => podeAcessar(link.roles, role)).map((link) => {
            const ativo = location.pathname === link.to
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3 py-1.5 rounded font-medium transition-colors ${
                  ativo ? tema.ativo : "hover:bg-black/20"
                }`}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-3">
          <span>
            {usuario.nome}
            {role && <span className="ml-1.5 text-xs bg-black/20 rounded-full px-2 py-0.5">{role}</span>}
          </span>
          <button
            onClick={sair}
            className={`text-sm rounded px-3 py-1.5 font-medium transition-colors ${tema.sair}`}
          >
            Sair
          </button>
        </div>
      </header>

      {mostraVoltar && (
        <div className="bg-gray-100 border-b px-4 py-2">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-sm text-blue-700 hover:underline font-medium"
          >
            ← Voltar
          </button>
        </div>
      )}

      {acessoNegado ? (
        <div className="p-10 flex flex-col items-center text-center gap-2">
          <span className="text-4xl">🚫</span>
          <h1 className="text-xl font-bold text-gray-800">Acesso negado</h1>
          <p className="text-sm text-gray-500 max-w-md">
            Seu perfil ({role || "—"}) não tem permissão para acessar esta página. Fale com um administrador se
            achar que isso é um engano.
          </p>
        </div>
      ) : (
        <Outlet />
      )}
    </div>
  )
}

export default Layout
