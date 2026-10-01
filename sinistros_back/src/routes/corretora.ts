import { prisma } from "../../lib/prisma"
import { requireRole } from "../middlewares/auth"
import { Router } from 'express'
import { z } from 'zod'

const router = Router()

const corretoraSchema = z.object({
  nome: z.string().min(2, { message: "Nome deve possuir, no mínimo, 2 caracteres" }),
  corretorResponsavel: z.string().min(1, { message: "Informe o corretor responsável" }),
  email: z.email({ message: "Email inválido" }),
})

router.get("/", async (req, res) => {
  /*
  #swagger.tags = ["Corretoras"];
  #swagger.summary = "Lista todas as corretoras";
  */
  try {
    const corretoras = await prisma.corretora.findMany()
    res.status(200).json(corretoras)
  } catch (error) {
    res.status(500).json({ erro: error })
  }
})

router.post("/", async (req, res) => {
  /*
  #swagger.tags = ["Corretoras"];
  #swagger.summary = "Cadastra uma corretora";
  #swagger.description = "Realiza o cadastro de uma nova corretora.";
  #swagger.parameters['body'] = {
    in: 'body',
    required: true,
    schema: {
      nome: 'Corretora ABC',
      corretorResponsavel: 'Maria',
      email: 'contato@corretora.com'
    }
  };
  #swagger.responses[201] = {
    description: "Corretora cadastrada com sucesso."
  };
  #swagger.responses[400] = {
    description: "Dados inválidos."
  };
  */
  const valida = corretoraSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }

  const { nome, corretorResponsavel, email } = valida.data

  try {
    const corretora = await prisma.corretora.create({
      data: { nome, corretorResponsavel, email }
    })
    res.status(201).json(corretora)
  } catch (error) {
    res.status(400).json({ error })
  }
})

router.delete("/:id", requireRole("ADMIN"), async (req, res) => {
  /*
  #swagger.tags = ["Corretoras"];
  #swagger.summary = "Remove uma corretora";
  #swagger.parameters['id'] = {
    in: 'path',
    required: true,
    description: 'ID da corretora a ser removida',
    schema: { type: 'integer' }
  };
  */
  const { id } = req.params
  try {
    const corretora = await prisma.corretora.delete({ where: { id: Number(id) } })
    res.status(200).json(corretora)
  } catch (error) {
    res.status(400).json({ erro: error })
  }
})

router.put("/:id", async (req, res) => {
  /*
  #swagger.tags = ["Corretoras"];
  #swagger.summary = "Atualiza uma corretora";
  #swagger.description = "Atualiza os dados de uma corretora existente.";
  #swagger.parameters['id'] = {
    in: 'path',
    required: true,
    description: 'ID da corretora a ser atualizada',
    schema: { type: 'integer' }
  };
  #swagger.parameters['body'] = {
    in: 'body',
    required: true,
    schema: {
      nome: 'Corretora ABC',
      corretorResponsavel: 'Maria',
      email: 'contato@corretora.com'
    }
  };
  #swagger.responses[200] = {
    description: "Corretora atualizada com sucesso."
  };
  #swagger.responses[400] = {
    description: "Dados inválidos."
  };
  */
  const { id } = req.params

  const valida = corretoraSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }

  const { nome, corretorResponsavel, email } = valida.data

  try {
    const corretora = await prisma.corretora.update({
      where: { id: Number(id) },
      data: { nome, corretorResponsavel, email }
    })
    res.status(200).json(corretora)
  } catch (error) {
    res.status(400).json({ error })
  }
})

export default router