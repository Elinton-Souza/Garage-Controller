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
  /*
  #swagger.tags = ["Sinistros"];
  #swagger.summary = "Lista todos os sinistros";
  */
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
  /*
  #swagger.tags = ["Sinistros"];
  #swagger.summary = "Cadastra um sinistro";
  #swagger.description = "Realiza o cadastro de um novo sinistro. Se o tipo de atendimento for SEGURO, é obrigatório informar a cia de seguro e a corretora.";
  #swagger.parameters['body'] = {
    in: 'body',
    required: true,
    schema: {
      veiculoId: 1,
      tipoAtendimento: 'SEGURO',
      ciaSeguroId: 1,
      corretoraId: 1,
      numApolice: '123456',
      kmAtendimento: 15000,
      statusAtual: 'Em andamento'
    }
  };
  #swagger.responses[201] = {
    description: "Sinistro cadastrado com sucesso."
  };
  #swagger.responses[400] = {
    description: "Dados inválidos."
  };
  */
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
  /*
  #swagger.tags = ["Sinistros"];
  #swagger.summary = "Remove um sinistro";
  #swagger.parameters['id'] = {
    in: 'path',
    required: true,
    description: 'ID do sinistro a ser removido',
    schema: { type: 'integer' }
  };
  */
  const { id } = req.params
  try {
    const sinistro = await prisma.sinistro.delete({ where: { id: Number(id) } })
    res.status(200).json(sinistro)
  } catch (error) {
    res.status(400).json({ erro: error })
  }
})

router.put("/:id", async (req, res) => {
  /*
  #swagger.tags = ["Sinistros"];
  #swagger.summary = "Atualiza um sinistro";
  #swagger.description = "Atualiza os dados de um sinistro existente.";
  #swagger.parameters['id'] = {
    in: 'path',
    required: true,
    description: 'ID do sinistro a ser atualizado',
    schema: { type: 'integer' }
  };
  #swagger.parameters['body'] = {
    in: 'body',
    required: true,
    schema: {
      veiculoId: 1,
      tipoAtendimento: 'SEGURO',
      ciaSeguroId: 1,
      corretoraId: 1,
      numApolice: '123456',
      kmAtendimento: 15000,
      statusAtual: 'Em andamento'
    }
  };
  #swagger.responses[200] = {
    description: "Sinistro atualizado com sucesso."
  };
  #swagger.responses[400] = {
    description: "Dados inválidos."
  };
  */
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