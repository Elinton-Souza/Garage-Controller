import { prisma } from "../../lib/prisma"
import { Router } from 'express'
import { z } from 'zod'

const router = Router()

const veiculoSchema = z.object({
  placa: z.string()
  .transform((v) => v.toUpperCase())
  .refine((v) => /^[A-Z]{3}\d[A-Z0-9]\d{2}$/.test(v), {
    message: "Placa inválida. Use o formato antigo (ABC1234) ou Mercosul (ABC1D34)"
  }),
  marca: z.string().min(2, { message: "Marca deve possuir, no mínimo, 2 caracteres" }),
  modelo: z.string().optional(),
  ano: z.number().int().min(1900, { message: "Ano inválido" }),
  clienteId: z.number().int({ message: "Informe o cliente dono do veículo" }),
})

router.get("/", async (req, res) => {
  try {
    const veiculos = await prisma.veiculo.findMany({
      include: { cliente: true }
    })
    res.status(200).json(veiculos)
  } catch (error) {
    res.status(500).json({ erro: error })
  }
})

router.post("/", async (req, res) => {
  const valida = veiculoSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }

  const { placa, marca, modelo, ano, clienteId } = valida.data

  try {
    const veiculo = await prisma.veiculo.create({
      data: { placa, marca, modelo, ano, clienteId }
    })
    res.status(201).json(veiculo)
  } catch (error) {
    res.status(400).json({ error })
  }
})

router.delete("/:id", async (req, res) => {
  const { id } = req.params
  try {
    const veiculo = await prisma.veiculo.delete({ where: { id: Number(id) } })
    res.status(200).json(veiculo)
  } catch (error) {
    res.status(400).json({ erro: error })
  }
})

router.put("/:id", async (req, res) => {
  const { id } = req.params

  const valida = veiculoSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }

  const { placa, marca, modelo, ano, clienteId } = valida.data

  try {
    const veiculo = await prisma.veiculo.update({
      where: { id: Number(id) },
      data: { placa, marca, modelo, ano, clienteId }
    })
    res.status(200).json(veiculo)
  } catch (error) {
    res.status(400).json({ error })
  }
})

export default router