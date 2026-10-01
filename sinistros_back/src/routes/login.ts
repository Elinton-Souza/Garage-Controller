import { prisma } from "../../lib/prisma"
import { Router } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const router = Router()

router.post("/", async (req, res) => {
  /*
  #swagger.tags = ["Login"];
  #swagger.summary = "Autentica um usuário";
  #swagger.description = "Realiza o login e retorna um token JWT válido por 1 hora.";
  #swagger.parameters['body'] = {
    in: 'body',
    required: true,
    schema: {
      email: 'usuario@email.com',
      senha: '123456'
    }
  };
  #swagger.responses[200] = {
    description: "Login realizado com sucesso, retorna o token."
  };
  #swagger.responses[400] = {
    description: "Requisição inválida (faltou email ou senha)."
  };
  #swagger.responses[401] = {
    description: "Login ou senha incorretos."
  };
  */
  const { email, senha } = req.body
  const mensagemPadrao = "Login ou senha incorretos"

  if (!email || !senha) {
    res.status(400).json({ erro: mensagemPadrao })
    return
  }

  try {
    const usuario = await prisma.usuario.findUnique({ where: { email } })

    if (!usuario) {
      res.status(401).json({ erro: mensagemPadrao })
      return
    }

    const senhaCorreta = await bcrypt.compare(senha, usuario.senha)

    if (!senhaCorreta) {
      res.status(401).json({ erro: mensagemPadrao })
      return
    }

    const jwtSecret = process.env.JWT_KEY
    if (!jwtSecret) {
      console.error("JWT_KEY não definida.")
      res.status(500).json({ erro: "Erro interno de configuração." })
      return
    }

    const token = jwt.sign(
      {
        usuarioLogadoId: usuario.id,
        usuarioLogadoNome: usuario.nome,
        usuarioLogadoRole: usuario.role,
      },
      jwtSecret,
      { expiresIn: "1h" }
    )

    res.status(200).json({
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      role: usuario.role,
      token,
    })
  } catch (error) {
    console.error("Erro no login:", error)
    res.status(500).json({ erro: "Erro ao processar login." })
  }
})

export default router
