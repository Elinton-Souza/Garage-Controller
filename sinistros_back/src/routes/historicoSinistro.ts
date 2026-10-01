import { prisma } from "../../lib/prisma"
import { requireRole } from "../middlewares/auth"
import { Router } from 'express'
import { z } from 'zod'

const router = Router()

const historicoSchema = z.object({
  sinistroId: z.number().int({ message: "Informe o sinistro" }),
  status: z.string().min(2, { message: "Informe o status" }),
  observacao: z.string().optional(),
})

router.get("/", async (req, res) => {
  /*
  #swagger.tags = ["Histórico de Sinistros"];
  #swagger.summary = "Lista todos os históricos de sinistro";
  */
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
  /*
  #swagger.tags = ["Histórico de Sinistros"];
  #swagger.summary = "Cadastra um histórico de sinistro";
  #swagger.description = "Registra uma nova entrada no histórico de um sinistro.";
  #swagger.parameters['body'] = {
    in: 'body',
    required: true,
    schema: {
      sinistroId: 1,
      status: 'Em andamento',
      observacao: 'Veículo em análise'
    }
  };
  #swagger.responses[201] = {
    description: "Histórico cadastrado com sucesso."
  };
  #swagger.responses[400] = {
    description: "Dados inválidos."
  };
  */
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
  /*
  #swagger.tags = ["Histórico de Sinistros"];
  #swagger.summary = "Atualiza um histórico de sinistro";
  #swagger.description = "Atualiza os dados de um histórico de sinistro existente.";
  #swagger.parameters['id'] = {
    in: 'path',
    required: true,
    description: 'ID do histórico a ser atualizado',
    schema: { type: 'integer' }
  };
  #swagger.parameters['body'] = {
    in: 'body',
    required: true,
    schema: {
      sinistroId: 1,
      status: 'Em andamento',
      observacao: 'Veículo em análise'
    }
  };
  #swagger.responses[200] = {
    description: "Histórico atualizado com sucesso."
  };
  #swagger.responses[400] = {
    description: "Dados inválidos."
  };
  */
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

router.delete("/:id", requireRole("ADMIN"), async (req, res) => {
  /*
  #swagger.tags = ["Histórico de Sinistros"];
  #swagger.summary = "Remove um histórico de sinistro";
  #swagger.parameters['id'] = {
    in: 'path',
    required: true,
    description: 'ID do histórico a ser removido',
    schema: { type: 'integer' }
  };
  */
  const { id } = req.params
  try {
    const historico = await prisma.historicoSinistro.delete({ where: { id: Number(id) } })
    res.status(200).json(historico)
  } catch (error) {
    res.status(400).json({ erro: error })
  }
})

export default router