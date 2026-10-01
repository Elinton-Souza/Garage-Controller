import { create } from "zustand"
import { persist } from "zustand/middleware"

export type RoleUsuario = "ADMIN" | "GERENTE" | "FUNCIONARIO"

interface UsuarioLogado {
  id: number
  nome: string
  email: string
  role: RoleUsuario | ""
  token: string
}

interface UsuarioStore {
  usuario: UsuarioLogado
  logaUsuario: (usuarioLogado: UsuarioLogado) => void
  deslogaUsuario: () => void
}

export const useUsuarioStore = create<UsuarioStore>()(
  persist(
    (set) => ({
      usuario: { id: 0, nome: "", email: "", role: "", token: "" },
      logaUsuario: (usuarioLogado: UsuarioLogado) => set({ usuario: usuarioLogado }),
      deslogaUsuario: () => set({ usuario: { id: 0, nome: "", email: "", role: "", token: "" } }),
    }),
    { name: "garage-controller-usuario" },
  ),
)
