import { prisma } from "../../lib/prisma"
import { Router } from 'express'
import { z } from 'zod'

const router = Router()

const ciaSeguroSchema = z.object({
  nome: z.string().min(2, { message: "Nome deve possuir, no mínimo, 2 caracteres" }),
  telefone: z.string().optional(),
  contatoResponsavel: z.string().optional(),
})

router.get("/", async (req, res) => {
  try {
    const cias = await prisma.ciaSeguro.findMany()
    res.status(200).json(cias)
  } catch (error) {
    res.status(500).json({ erro: error })
  }
})

router.post("/", async (req, res) => {
  const valida = ciaSeguroSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }

  const { nome, telefone, contatoResponsavel } = valida.data

  try {
    const cia = await prisma.ciaSeguro.create({
      data: { nome, telefone, contatoResponsavel }
    })
    res.status(201).json(cia)
  } catch (error) {
    res.status(400).json({ error })
  }
})

router.delete("/:id", async (req, res) => {
  const { id } = req.params
  try {
    const cia = await prisma.ciaSeguro.delete({ where: { id: Number(id) } })
    res.status(200).json(cia)
  } catch (error) {
    res.status(400).json({ erro: error })
  }
})

router.put("/:id", async (req, res) => {
  const { id } = req.params

  const valida = ciaSeguroSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }

  const { nome, telefone, contatoResponsavel } = valida.data

  try {
    const cia = await prisma.ciaSeguro.update({
      where: { id: Number(id) },
      data: { nome, telefone, contatoResponsavel }
    })
    res.status(200).json(cia)
  } catch (error) {
    res.status(400).json({ error })
  }
})

export default router