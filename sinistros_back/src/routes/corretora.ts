import { prisma } from "../../lib/prisma"
import { Router } from 'express'
import { z } from 'zod'

const router = Router()

const corretoraSchema = z.object({
  nome: z.string().min(2, { message: "Nome deve possuir, no mínimo, 2 caracteres" }),
  corretorResponsavel: z.string().optional(),
  email: z.email({ message: "Email inválido" }).optional(),
})

router.get("/", async (req, res) => {
  try {
    const corretoras = await prisma.corretora.findMany()
    res.status(200).json(corretoras)
  } catch (error) {
    res.status(500).json({ erro: error })
  }
})

router.post("/", async (req, res) => {
  const valida = corretoraSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }

  const { nome, corretorResponsavel, email } = valida.data

  try {
    const corretora = await prisma.corretora.create({
      data: { nome, corretorResponsavel, email }
    })
    res.status(201).json(corretora)
  } catch (error) {
    res.status(400).json({ error })
  }
})

router.delete("/:id", async (req, res) => {
  const { id } = req.params
  try {
    const corretora = await prisma.corretora.delete({ where: { id: Number(id) } })
    res.status(200).json(corretora)
  } catch (error) {
    res.status(400).json({ erro: error })
  }
})

router.put("/:id", async (req, res) => {
  const { id } = req.params

  const valida = corretoraSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }

  const { nome, corretorResponsavel, email } = valida.data

  try {
    const corretora = await prisma.corretora.update({
      where: { id: Number(id) },
      data: { nome, corretorResponsavel, email }
    })
    res.status(200).json(corretora)
  } catch (error) {
    res.status(400).json({ error })
  }
})

export default router