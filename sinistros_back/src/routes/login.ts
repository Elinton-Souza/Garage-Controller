import { prisma } from "../../lib/prisma"
import { Router } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const router = Router()

router.post("/", async (req, res) => {
  const { email, senha } = req.body

  const mensagemPadrao = "Login ou senha incorretos"

  if (!email || !senha) {
    res.status(400).json({ erro: mensagemPadrao })
    return
  }

  try {
    const usuario = await prisma.usuario.findFirst({ where: { email } })

    if (usuario == null) {
      res.status(400).json({ erro: mensagemPadrao })
      return
    }

    if (bcrypt.compareSync(senha, usuario.senha)) {
      const token = jwt.sign(
        { usuarioLogadoId: usuario.id, usuarioLogadoNome: usuario.nome },
        process.env.JWT_KEY as string,
        { expiresIn: "1h" }
      )

      res.status(200).json({
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        token
      })
    } else {
      res.status(400).json({ erro: mensagemPadrao })
    }
  } catch (error) {
    console.error(error)
    res.status(400).json({ erro: mensagemPadrao })
  }
})

export default router