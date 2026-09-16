import { prisma } from "../../lib/prisma"
import { Router } from 'express'
import { z } from 'zod'

const router = Router()

const fotoSchema = z.object({
  sinistroId: z.number().int({ message: "Informe o sinistro" }),
  orcamentoId: z.number().int().optional(),
  momento: z.string().min(2, { message: "Informe o momento (ex: antes, durante, depois)" }),
  caminhoArquivo: z.string().min(2, { message: "Informe o caminho do arquivo" }),
})

router.get("/", async (req, res) => {
  try {
    const fotos = await prisma.foto.findMany({
      include: { sinistro: true, orcamento: true }
    })
    res.status(200).json(fotos)
  } catch (error) {
    res.status(500).json({ erro: error })
  }
})

router.post("/", async (req, res) => {
  const valida = fotoSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }

  const { sinistroId, orcamentoId, momento, caminhoArquivo } = valida.data

  try {
    const foto = await prisma.foto.create({
      data: { sinistroId, orcamentoId, momento, caminhoArquivo }
    })
    res.status(201).json(foto)
  } catch (error) {
    console.error(error)
    res.status(400).json({ error })
  }
})

router.put("/:id", async (req, res) => {
  const { id } = req.params

  const valida = fotoSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }

  const { sinistroId, orcamentoId, momento, caminhoArquivo } = valida.data

  try {
    const foto = await prisma.foto.update({
      where: { id: Number(id) },
      data: { sinistroId, orcamentoId, momento, caminhoArquivo }
    })
    res.status(200).json(foto)
  } catch (error) {
    console.error(error)
    res.status(400).json({ error })
  }
})

router.delete("/:id", async (req, res) => {
  const { id } = req.params
  try {
    const foto = await prisma.foto.delete({ where: { id: Number(id) } })
    res.status(200).json(foto)
  } catch (error) {
    res.status(400).json({ erro: error })
  }
})

export default router