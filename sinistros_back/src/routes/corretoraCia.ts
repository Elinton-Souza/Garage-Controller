import { prisma } from "../../lib/prisma"
import { Router } from 'express'
import { z } from 'zod'

const router = Router()

const corretoraCiaSchema = z.object({
  corretoraId: z.number().int({ message: "Informe a corretora" }),
  ciaId: z.number().int({ message: "Informe a cia de seguro" }),
})

router.get("/", async (req, res) => {
  try {
    const vinculos = await prisma.corretoraCia.findMany({
      include: { corretora: true, cia: true }
    })
    res.status(200).json(vinculos)
  } catch (error) {
    res.status(500).json({ erro: error })
  }
})

router.post("/", async (req, res) => {
  const valida = corretoraCiaSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }

  const { corretoraId, ciaId } = valida.data

  try {
    const vinculo = await prisma.corretoraCia.create({
      data: { corretoraId, ciaId }
    })
    res.status(201).json(vinculo)
  } catch (error) {
    res.status(400).json({ error })
  }
})

router.delete("/:corretoraId/:ciaId", async (req, res) => {
  const { corretoraId, ciaId } = req.params
  try {
    const vinculo = await prisma.corretoraCia.delete({
      where: {
        corretoraId_ciaId: {
          corretoraId: Number(corretoraId),
          ciaId: Number(ciaId)
        }
      }
    })
    res.status(200).json(vinculo)
  } catch (error) {
    res.status(400).json({ erro: error })
  }
})

export default router