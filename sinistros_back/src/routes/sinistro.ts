import { prisma } from "../../lib/prisma"
import { requireRole } from "../middlewares/auth"
import { Router } from 'express'
import { z } from 'zod'

const router = Router()

const statusSinistroValues = [
  "INICIAL",
  "AGUARDANDO_AUTORIZACAO",
  "AUTORIZADO_COMPRA_PECAS",
  "EM_SERVICO",
  "FINALIZADO",
  "ENTREGUE",
] as const

const sinistroCampos = z.object({
  veiculoId: z.number().int({ message: "Informe o veículo" }),
  tipoAtendimento: z.enum(["PARTICULAR", "SEGURO"], { message: "Informe o tipo de atendimento" }),
  ciaSeguroId: z.number().int().optional(),
  corretoraId: z.number().int().optional(),
  numApolice: z.string().optional(),
  kmAtendimento: z.number().int({ message: "Informe o km no momento do atendimento" }),
})

function exigeSeguroCompleto<T extends typeof sinistroCampos>(schema: T) {
  return schema.refine((data) => {
    if (data.tipoAtendimento === "SEGURO") {
      return data.ciaSeguroId !== undefined && data.corretoraId !== undefined
    }
    return true
  }, {
    message: "Sinistro via seguro precisa informar a cia de seguro e a corretora",
    path: ["ciaSeguroId"]
  })
}

// Abertura de sinistro: statusAtual não é informado pelo cliente, é sempre gravado como INICIAL
const sinistroCreateSchema = exigeSeguroCompleto(sinistroCampos)

// Atualização: permite avançar o status entre as fases do enum StatusSinistro
const sinistroUpdateSchema = exigeSeguroCompleto(
  sinistroCampos.extend({
    statusAtual: z.enum(statusSinistroValues, { message: "Status inválido" }),
  })
)

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
  #swagger.description = "Realiza o cadastro de um novo sinistro. O status é sempre gravado como INICIAL na abertura. Se o tipo de atendimento for SEGURO, é obrigatório informar a cia de seguro e a corretora.";
  #swagger.parameters['body'] = {
    in: 'body',
    required: true,
    schema: {
      veiculoId: 1,
      tipoAtendimento: 'SEGURO',
      ciaSeguroId: 1,
      corretoraId: 1,
      numApolice: '123456',
      kmAtendimento: 15000
    }
  };
  #swagger.responses[201] = {
    description: "Sinistro cadastrado com sucesso, com status INICIAL."
  };
  #swagger.responses[400] = {
    description: "Dados inválidos."
  };
  */
  const valida = sinistroCreateSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }

  const { veiculoId, tipoAtendimento, ciaSeguroId, corretoraId, numApolice, kmAtendimento } = valida.data

  try {
    const sinistro = await prisma.sinistro.create({
      // status sempre inicia como INICIAL na abertura do sinistro — não vem do cliente
      data: { veiculoId, tipoAtendimento, ciaSeguroId, corretoraId, numApolice, kmAtendimento, statusAtual: "INICIAL" }
    })
    res.status(201).json(sinistro)
  } catch (error) {
    res.status(400).json({ error })
  }
})

router.delete("/:id", requireRole("ADMIN"), async (req, res) => {
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
      statusAtual: 'AGUARDANDO_AUTORIZACAO'
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

  const valida = sinistroUpdateSchema.safeParse(req.body)
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