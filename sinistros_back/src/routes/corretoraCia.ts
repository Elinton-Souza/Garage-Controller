import { prisma } from "../../lib/prisma"
import { requireRole } from "../middlewares/auth"
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

  const jaExiste = await prisma.corretoraCia.findUnique({
    where: { corretoraId_ciaId: { corretoraId, ciaId } },
  })
  if (jaExiste) {
    res.status(400).json({ erro: "Esta corretora já está vinculada a esta cia de seguro." })
    return
  }

  try {
    const vinculo = await prisma.corretoraCia.create({
      data: { corretoraId, ciaId }
    })
    res.status(201).json(vinculo)
  } catch (error) {
    res.status(400).json({ error })
  }
})

router.delete("/:corretoraId/:ciaId", requireRole("ADMIN"), async (req, res) => {
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
  #swagger.responses[400] = {
    description: "Existem sinistros registrados com esta combinação de corretora e cia de seguro."
  };
  */
  const { corretoraId, ciaId } = req.params

  // Só é permitido remover o vínculo se nenhum sinistro estiver usando essa
  // mesma combinação de corretora + cia de seguro.
  const sinistroVinculado = await prisma.sinistro.findFirst({
    where: {
      corretoraId: Number(corretoraId),
      ciaSeguroId: Number(ciaId),
    },
  })

  if (sinistroVinculado) {
    res.status(400).json({
      erro: "Não é possível remover este vínculo: existem sinistros registrados com esta combinação de corretora e cia de seguro.",
    })
    return
  }

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