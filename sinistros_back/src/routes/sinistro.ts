import { prisma } from "../../lib/prisma"
import { Router } from 'express'
import { z } from 'zod'

const router = Router()

const sinistroSchema = z.object({
  veiculoId: z.number().int({ message: "Informe o veículo" }),
  tipoAtendimento: z.enum(["PARTICULAR", "SEGURO"], { message: "Informe o tipo de atendimento" }),
  ciaSeguroId: z.number().int().optional(),
  corretoraId: z.number().int().optional(),
  numApolice: z.string().optional(),
  kmAtendimento: z.number().int({ message: "Informe o km no momento do atendimento" }),
  statusAtual: z.string().min(2, { message: "Informe o status atual" }),
}).refine((data) => {
  if (data.tipoAtendimento === "SEGURO") {
    return data.ciaSeguroId !== undefined && data.corretoraId !== undefined
  }
  return true
}, {
  message: "Sinistro via seguro precisa informar a cia de seguro e a corretora",
  path: ["ciaSeguroId"]
})

router.get("/", async (req, res) => {
  try {
    const sinistros = await prisma.sinistro.findMany({
      include: { veiculo: true, ciaSeguro: true, corretora: true }
    })
    res.status(200).json(sinistros)
  } catch (error) {
    res.status(500).json({ erro: error })
  }
})

router.post("/", async (req, res) => {
  const valida = sinistroSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }

  const { veiculoId, tipoAtendimento, ciaSeguroId, corretoraId, numApolice, kmAtendimento, statusAtual } = valida.data

  try {
    const sinistro = await prisma.sinistro.create({
      data: { veiculoId, tipoAtendimento, ciaSeguroId, corretoraId, numApolice, kmAtendimento, statusAtual }
    })
    res.status(201).json(sinistro)
  } catch (error) {
    res.status(400).json({ error })
  }
})

router.delete("/:id", async (req, res) => {
  const { id } = req.params
  try {
    const sinistro = await prisma.sinistro.delete({ where: { id: Number(id) } })
    res.status(200).json(sinistro)
  } catch (error) {
    res.status(400).json({ erro: error })
  }
})

router.put("/:id", async (req, res) => {
  const { id } = req.params

  const valida = sinistroSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }

  const { veiculoId, tipoAtendimento, ciaSeguroId, corretoraId, numApolice, kmAtendimento, statusAtual } = valida.data

  try {
    const sinistro = await prisma.sinistro.update({
      where: { id: Number(id) },
      data: { veiculoId, tipoAtendimento, ciaSeguroId, corretoraId, numApolice, kmAtendimento, statusAtual }
    })
    res.status(200).json(sinistro)
  } catch (error) {
    res.status(400).json({ error })
  }
})

export default router