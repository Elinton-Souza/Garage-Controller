import { NextFunction, Request, Response } from "express"
import jwt from "jsonwebtoken"

export type RoleUsuario = "ADMIN" | "GERENTE" | "FUNCIONARIO"

export interface UsuarioLogadoPayload {
  usuarioLogadoId: number
  usuarioLogadoNome: string
  usuarioLogadoRole: RoleUsuario
}

// Estende o Request do Express para carregar os dados do usuário autenticado,
// decodificados a partir do token JWT enviado no header Authorization.
declare global {
  namespace Express {
    interface Request {
      usuarioLogado?: UsuarioLogadoPayload
    }
  }
}

// Exige um token JWT válido no header "Authorization: Bearer <token>".
// Em caso de sucesso, popula req.usuarioLogado com os dados do token.
export function autentica(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ erro: "Token não informado. Faça login novamente." })
    return
  }

  const token = authHeader.slice("Bearer ".length)

  try {
    const payload = jwt.verify(token, process.env.JWT_KEY as string) as UsuarioLogadoPayload
    req.usuarioLogado = payload
    next()
  } catch (error) {
    res.status(401).json({ erro: "Sessão expirada ou inválida. Faça login novamente." })
  }
}

// Deve ser usado APÓS "autentica". Restringe a rota a um ou mais perfis.
export function requireRole(...rolesPermitidos: RoleUsuario[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = req.usuarioLogado?.usuarioLogadoRole

    if (!role) {
      res.status(401).json({ erro: "Token não informado. Faça login novamente." })
      return
    }

    if (!rolesPermitidos.includes(role)) {
      res.status(403).json({ erro: "Acesso negado. Você não tem permissão para esta ação." })
      return
    }

    next()
  }
}
