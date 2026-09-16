import { prisma } from "../../lib/prisma"
import { Router } from 'express'
import { z } from 'zod'
import bcrypt from 'bcrypt'

const router = Router()

const usuarioSchema = z.object({
  nome: z.string().min(3, { message: "Nome deve possuir, no mínimo, 3 caracteres" }),
  email: z.email({ message: "Email inválido" }),
  senha: z.string(),
})

function validaSenha(senha: string) {
  const mensa: string[] = []

  if (senha.length < 8) {
    mensa.push("A senha deve possuir, no mínimo, 8 caracteres")
  }

  let pequenas = 0
  let grandes = 0
  let numeros = 0
  let simbolos = 0

  for (const letra of senha) {
    if (/[a-z]/.test(letra)) {
      pequenas++
    } else if (/[A-Z]/.test(letra)) {
      grandes++
    } else if (/[0-9]/.test(letra)) {
      numeros++
    } else {
      simbolos++
    }
  }

  if (pequenas == 0) mensa.push("A senha deve possuir letra(s) minúscula(s)")
  if (grandes == 0) mensa.push("A senha deve possuir letra(s) maiúscula(s)")
  if (numeros == 0) mensa.push("A senha deve possuir número(s)")
  if (simbolos == 0) mensa.push("A senha deve possuir símbolo(s)")

  return mensa
}

router.get("/", async (req, res) => {
  try {
    const usuarios = await prisma.usuario.findMany({
      select: { id: true, nome: true, email: true }
    })
    res.status(200).json(usuarios)
  } catch (error) {
    res.status(500).json({ erro: error })
  }
})

router.post("/", async (req, res) => {
  const valida = usuarioSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }

  const { nome, email, senha } = valida.data

  const jaExiste = await prisma.usuario.findUnique({ where: { email } })
  if (jaExiste) {
    res.status(400).json({ erro: "E-mail já cadastrado" })
    return
  }

  const errosSenha = validaSenha(senha)
  if (errosSenha.length > 0) {
    res.status(400).json({ erro: errosSenha.join("; ") })
    return
  }

  const salt = bcrypt.genSaltSync(12)
  const hash = bcrypt.hashSync(senha, salt)

  try {
    const usuario = await prisma.usuario.create({
      data: { nome, email, senha: hash },
      select: { id: true, nome: true, email: true }
    })
    res.status(201).json(usuario)
  } catch (error) {
    console.error(error)
    res.status(400).json({ error })
  }
})

router.put("/:id", async (req, res) => {
  const { id } = req.params

  const valida = usuarioSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }

  const { nome, email, senha } = valida.data

  const errosSenha = validaSenha(senha)
  if (errosSenha.length > 0) {
    res.status(400).json({ erro: errosSenha.join("; ") })
    return
  }

  const salt = bcrypt.genSaltSync(12)
  const hash = bcrypt.hashSync(senha, salt)

  try {
    const usuario = await prisma.usuario.update({
      where: { id: Number(id) },
      data: { nome, email, senha: hash },
      select: { id: true, nome: true, email: true }
    })
    res.status(200).json(usuario)
  } catch (error) {
    console.error(error)
    res.status(400).json({ error })
  }
})

router.delete("/:id", async (req, res) => {
  const { id } = req.params
  try {
    const usuario = await prisma.usuario.delete({
      where: { id: Number(id) },
      select: { id: true, nome: true, email: true }
    })
    res.status(200).json(usuario)
  } catch (error) {
    res.status(400).json({ erro: error })
  }
})

export default router