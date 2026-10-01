import { prisma } from "../../lib/prisma"
import { requireRole } from "../middlewares/auth"
import { Router } from 'express'
import { z } from 'zod'

const router = Router()

const ciaSeguroSchema = z.object({
  nome: z.string().min(2, { message: "Nome deve possuir, no mínimo, 2 caracteres" }),
  telefone: z.string().min(1, { message: "Informe o telefone" }),
  contatoResponsavel: z.string().min(1, { message: "Informe o contato responsável" }),
})

router.get("/", async (req, res) => {
  /*
  #swagger.tags = ["Cias de Seguro"];
  #swagger.summary = "Lista todas as cias de seguro";
  */
  try {
    const cias = await prisma.ciaSeguro.findMany()
    res.status(200).json(cias)
  } catch (error) {
    res.status(500).json({ erro: error })
  }
})

router.post("/", async (req, res) => {
  /*
  #swagger.tags = ["Cias de Seguro"];
  #swagger.summary = "Cadastra uma cia de seguro";
  #swagger.description = "Realiza o cadastro de uma nova cia de seguro.";
  #swagger.parameters['body'] = {
    in: 'body',
    required: true,
    schema: {
      nome: 'Porto Seguro',
      telefone: '5133334444',
      contatoResponsavel: 'João'
    }
  };
  #swagger.responses[201] = {
    description: "Cia de seguro cadastrada com sucesso."
  };
  #swagger.responses[400] = {
    description: "Dados inválidos."
  };
  */
  const valida = ciaSeguroSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }

  const { nome, telefone, contatoResponsavel } = valida.data

  try {
    const cia = await prisma.ciaSeguro.create({
      data: { nome, telefone, contatoResponsavel }
    })
    res.status(201).json(cia)
  } catch (error) {
    res.status(400).json({ error })
  }
})

router.delete("/:id", requireRole("ADMIN"), async (req, res) => {
  /*
  #swagger.tags = ["Cias de Seguro"];
  #swagger.summary = "Remove uma cia de seguro";
  #swagger.parameters['id'] = {
    in: 'path',
    required: true,
    description: 'ID da cia de seguro a ser removida',
    schema: { type: 'integer' }
  };
  */
  const { id } = req.params
  try {
    const cia = await prisma.ciaSeguro.delete({ where: { id: Number(id) } })
    res.status(200).json(cia)
  } catch (error) {
    res.status(400).json({ erro: error })
  }
})

router.put("/:id", async (req, res) => {
  /*
  #swagger.tags = ["Cias de Seguro"];
  #swagger.summary = "Atualiza uma cia de seguro";
  #swagger.description = "Atualiza os dados de uma cia de seguro existente.";
  #swagger.parameters['id'] = {
    in: 'path',
    required: true,
    description: 'ID da cia de seguro a ser atualizada',
    schema: { type: 'integer' }
  };
  #swagger.parameters['body'] = {
    in: 'body',
    required: true,
    schema: {
      nome: 'Porto Seguro',
      telefone: '5133334444',
      contatoResponsavel: 'João'
    }
  };
  #swagger.responses[200] = {
    description: "Cia de seguro atualizada com sucesso."
  };
  #swagger.responses[400] = {
    description: "Dados inválidos."
  };
  */
  const { id } = req.params

  const valida = ciaSeguroSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }

  const { nome, telefone, contatoResponsavel } = valida.data

  try {
    const cia = await prisma.ciaSeguro.update({
      where: { id: Number(id) },
      data: { nome, telefone, contatoResponsavel }
    })
    res.status(200).json(cia)
  } catch (error) {
    res.status(400).json({ error })
  }
})

export default router