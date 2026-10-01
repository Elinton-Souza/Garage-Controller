import { prisma } from "../../lib/prisma"
import { requireRole } from "../middlewares/auth"
import { Router } from 'express'
import { z } from 'zod'

const router = Router()

const fotoSchema = z.object({
  sinistroId: z.number().int({ message: "Informe o sinistro" }),
  orcamentoId: z.number().int().optional(),
  momento: z.enum(["INICIAL", "ACOMPANHAMENTO", "FINAL"], { message: "Informe o momento (INICIAL, ACOMPANHAMENTO ou FINAL)" }),
  caminhoArquivo: z.string().min(2, { message: "Informe o caminho do arquivo" }),
})

router.get("/", async (req, res) => {
  /*
  #swagger.tags = ["Fotos"];
  #swagger.summary = "Lista todas as fotos";
  */
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
  /*
  #swagger.tags = ["Fotos"];
  #swagger.summary = "Cadastra uma foto";
  #swagger.description = "Registra uma nova foto vinculada a um sinistro (e, opcionalmente, a um orçamento).";
  #swagger.parameters['body'] = {
    in: 'body',
    required: true,
    schema: {
      sinistroId: 1,
      orcamentoId: 1,
      momento: 'INICIAL',
      caminhoArquivo: '/uploads/foto1.jpg'
    }
  };
  #swagger.responses[201] = {
    description: "Foto cadastrada com sucesso."
  };
  #swagger.responses[400] = {
    description: "Dados inválidos."
  };
  */
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
  /*
  #swagger.tags = ["Fotos"];
  #swagger.summary = "Atualiza uma foto";
  #swagger.description = "Atualiza os dados de uma foto existente.";
  #swagger.parameters['id'] = {
    in: 'path',
    required: true,
    description: 'ID da foto a ser atualizada',
    schema: { type: 'integer' }
  };
  #swagger.parameters['body'] = {
    in: 'body',
    required: true,
    schema: {
      sinistroId: 1,
      orcamentoId: 1,
      momento: 'ACOMPANHAMENTO',
      caminhoArquivo: '/uploads/foto1.jpg'
    }
  };
  #swagger.responses[200] = {
    description: "Foto atualizada com sucesso."
  };
  #swagger.responses[400] = {
    description: "Dados inválidos."
  };
  */
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

router.delete("/:id", requireRole("ADMIN"), async (req, res) => {
  /*
  #swagger.tags = ["Fotos"];
  #swagger.summary = "Remove uma foto";
  #swagger.parameters['id'] = {
    in: 'path',
    required: true,
    description: 'ID da foto a ser removida',
    schema: { type: 'integer' }
  };
  */
  const { id } = req.params
  try {
    const foto = await prisma.foto.delete({ where: { id: Number(id) } })
    res.status(200).json(foto)
  } catch (error) {
    res.status(400).json({ erro: error })
  }
})

export default router