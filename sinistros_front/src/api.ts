import { useUsuarioStore } from "./context/UsuarioContext"

// Helper central de requisições autenticadas. Anexa o token JWT salvo no
// login como header Authorization em toda chamada à API, e desloga
// automaticamente o usuário se o backend responder 401 (token ausente,
// expirado ou inválido) — assim a tela de login aparece de novo sozinha
// em vez de a aplicação ficar presa em erros silenciosos.
export function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = useUsuarioStore.getState().usuario.token

  const headers = new Headers(options.headers)
  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  const url = path.startsWith("http") ? path : `${import.meta.env.VITE_API_URL}${path}`

  return fetch(url, { ...options, headers }).then((response) => {
    if (response.status === 401) {
      useUsuarioStore.getState().deslogaUsuario()
    }
    return response
  })
}
