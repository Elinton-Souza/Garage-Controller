import { prisma } from "../../lib/prisma"
import { Router } from 'express'
import { z } from 'zod'

const router = Router()

const corretoraCiaSchema = z.object({
  corretoraId: z.number().int({ message: "Informe a corretora" }),
  ciaId: z.number().int({ message: "Informe a cia de seguro" }),
})

router.get("/", async (req, res) => {
  /*
  #swagger.tags = ["Corretora x Cia"];
  #swagger.summary = "Lista os vínculos entre corretoras e cias de seguro";
  */
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
  /*
  #swagger.tags = ["Corretora x Cia"];
  #swagger.summary = "Cria um vínculo entre corretora e cia de seguro";
  #swagger.description = "Vincula uma corretora a uma cia de seguro.";
  #swagger.parameters['body'] = {
    in: 'body',
    required: true,
    schema: {
      corretoraId: 1,
      ciaId: 1
    }
  };
  #swagger.responses[201] = {
    description: "Vínculo criado com sucesso."
  };
  #swagger.responses[400] = {
    description: "Dados inválidos."
  };
  */
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
  /*
  #swagger.tags = ["Corretora x Cia"];
  #swagger.summary = "Remove um vínculo entre corretora e cia de seguro";
  #swagger.parameters['corretoraId'] = {
    in: 'path',
    required: true,
    description: 'ID da corretora',
    schema: { type: 'integer' }
  };
  #swagger.parameters['ciaId'] = {
    in: 'path',
    required: true,
    description: 'ID da cia de seguro',
    schema: { type: 'integer' }
  };
  */
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