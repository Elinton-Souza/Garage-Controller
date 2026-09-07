import { prisma } from "../../lib/prisma"
import { Router } from 'express'
import { z } from 'zod'

const router = Router()

const historicoSchema = z.object({
  sinistroId: z.number().int({ message: "Informe o sinistro" }),
  status: z.string().min(2, { message: "Informe o status" }),
  observacao: z.string().optional(),
})

router.get("/", async (req, res) => {
  try {
    const historicos = await prisma.historicoSinistro.findMany({
      include: { sinistro: true }
    })
    res.status(200).json(historicos)
  } catch (error) {
    res.status(500).json({ erro: error })
  }
})

router.post("/", async (req, res) => {
  const valida = historicoSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }

  const { sinistroId, status, observacao } = valida.data

  try {
    const historico = await prisma.historicoSinistro.create({
      data: { sinistroId, status, observacao }
    })
    res.status(201).json(historico)
  } catch (error) {
    console.error(error)
    res.status(400).json({ error })
  }
})

router.put("/:id", async (req, res) => {
  const { id } = req.params

  const valida = historicoSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }

  const { sinistroId, status, observacao } = valida.data

  try {
    const historico = await prisma.historicoSinistro.update({
      where: { id: Number(id) },
      data: { sinistroId, status, observacao }
    })
    res.status(200).json(historico)
  } catch (error) {
    console.error(error)
    res.status(400).json({ error })
  }
})

router.delete("/:id", async (req, res) => {
  const { id } = req.params
  try {
    const historico = await prisma.historicoSinistro.delete({ where: { id: Number(id) } })
    res.status(200).json(historico)
  } catch (error) {
    res.status(400).json({ erro: error })
  }
})

export default router