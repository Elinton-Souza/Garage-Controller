import { create } from "zustand"

interface UsuarioLogado {
  id: number
  nome: string
  email: string
  token: string
}

interface UsuarioStore {
  usuario: UsuarioLogado
  logaUsuario: (usuarioLogado: UsuarioLogado) => void
  deslogaUsuario: () => void
}

export const useUsuarioStore = create<UsuarioStore>((set) => ({
  usuario: { id: 0, nome: "", email: "", token: "" },
  logaUsuario: (usuarioLogado: UsuarioLogado) => set({ usuario: usuarioLogado }),
  deslogaUsuario: () => set({ usuario: { id: 0, nome: "", email: "", token: "" } }),
}))