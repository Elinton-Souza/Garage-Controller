import { prisma } from "../../lib/prisma"
import { Router } from 'express'
import { z } from 'zod'

const router = Router()

const orcamentoSchema = z.object({
  sinistroId: z.number().int({ message: "Informe o sinistro" }),
  versao: z.number().int().optional(),
  tipo: z.enum(["INICIAL", "COMPLEMENTAR"], { message: "Informe o tipo de orçamento" }),
  valorTotal: z.number({ message: "Informe o valor total" }),
  status: z.string().min(2, { message: "Informe o status" }),
})

router.get("/", async (req, res) => {
  try {
    const orcamentos = await prisma.orcamento.findMany({
      include: { sinistro: true, itens: true }
    })
    res.status(200).json(orcamentos)
  } catch (error) {
    res.status(500).json({ erro: error })
  }
})

router.post("/", async (req, res) => {
  const valida = orcamentoSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }

  const { sinistroId, versao, tipo, valorTotal, status } = valida.data

  try {
    const orcamento = await prisma.orcamento.create({
      data: { sinistroId, versao, tipo, valorTotal, status }
    })
    res.status(201).json(orcamento)
  } catch (error) {
    console.error(error)
    res.status(400).json({ error })
  }
})

router.put("/:id", async (req, res) => {
  const { id } = req.params

  const valida = orcamentoSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }

  const { sinistroId, versao, tipo, valorTotal, status } = valida.data

  try {
    const orcamento = await prisma.orcamento.update({
      where: { id: Number(id) },
      data: { sinistroId, versao, tipo, valorTotal, status }
    })
    res.status(200).json(orcamento)
  } catch (error) {
    console.error(error)
    res.status(400).json({ error })
  }
})

router.delete("/:id", async (req, res) => {
  const { id } = req.params
  try {
    const orcamento = await prisma.orcamento.delete({ where: { id: Number(id) } })
    res.status(200).json(orcamento)
  } catch (error) {
    res.status(400).json({ erro: error })
  }
})

export default router