import { prisma } from "../../lib/prisma"
import { Router } from 'express'
import { z } from 'zod'

const router = Router()

const itemSchema = z.object({
  orcamentoId: z.number().int({ message: "Informe o orçamento" }),
  descricao: z.string().min(2, { message: "Informe a descrição" }),
  valor: z.number({ message: "Informe o valor" }),
})

router.get("/", async (req, res) => {
  try {
    const itens = await prisma.itemOrcamento.findMany({
      include: { orcamento: true }
    })
    res.status(200).json(itens)
  } catch (error) {
    res.status(500).json({ erro: error })
  }
})

router.post("/", async (req, res) => {
  const valida = itemSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }

  const { orcamentoId, descricao, valor } = valida.data

  try {
    const item = await prisma.itemOrcamento.create({
      data: { orcamentoId, descricao, valor }
    })
    res.status(201).json(item)
  } catch (error) {
    console.error(error)
    res.status(400).json({ error })
  }
})

router.put("/:id", async (req, res) => {
  const { id } = req.params

  const valida = itemSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }

  const { orcamentoId, descricao, valor } = valida.data

  try {
    const item = await prisma.itemOrcamento.update({
      where: { id: Number(id) },
      data: { orcamentoId, descricao, valor }
    })
    res.status(200).json(item)
  } catch (error) {
    console.error(error)
    res.status(400).json({ error })
  }
})

router.delete("/:id", async (req, res) => {
  const { id } = req.params
  try {
    const item = await prisma.itemOrcamento.delete({ where: { id: Number(id) } })
    res.status(200).json(item)
  } catch (error) {
    res.status(400).json({ erro: error })
  }
})

export default router