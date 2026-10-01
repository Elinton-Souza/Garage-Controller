import { prisma } from "../../lib/prisma";
import { requireRole } from "../middlewares/auth"
import { Router } from "express";
import { z } from "zod";

const router = Router();

const veiculoSchema = z.object({
  placa: z
    .string()
    .transform((v) => v.toUpperCase())
    .refine((v) => /^[A-Z]{3}\d[A-Z0-9]\d{2}$/.test(v), {
      message:
        "Placa inválida. Use o formato antigo (ABC1234) ou Mercosul (ABC1D34)",
    }),
  marca: z
    .string()
    .min(2, { message: "Marca deve possuir, no mínimo, 2 caracteres" }),
  modelo: z.string().optional(),
  ano: z.number().int().min(1900, { message: "Ano inválido" }),
  clienteId: z.number().int({ message: "Informe o cliente dono do veículo" }),
});

router.get("/", async (req, res) => {
  /*
#swagger.tags = ["Veículos"];
#swagger.summary = "Lista todos os veículos";
*/
  try {
    const veiculos = await prisma.veiculo.findMany({
      include: { cliente: true },
    });
    res.status(200).json(veiculos);
  } catch (error) {
    res.status(500).json({ erro: error });
  }
});

router.get("/historico/:placa", async (req, res) => {
  /*
#swagger.tags = ["Veículos"];
#swagger.summary = "Histórico completo de um veículo pela placa";
#swagger.description = "Retorna o veículo, o cliente dono, todos os sinistros (com histórico de status, orçamentos, itens de peça ordenados pelo código e fotos).";
#swagger.parameters['placa'] = {
  in: 'path',
  required: true,
  description: 'Placa do veículo (formato antigo ou Mercosul)',
  schema: { type: 'string' }
};
#swagger.responses[200] = {
  description: "Histórico do veículo encontrado."
};
#swagger.responses[404] = {
  description: "Veículo não encontrado para essa placa."
};
*/
  const { placa } = req.params;
  try {
    const veiculo = await prisma.veiculo.findUnique({
      where: { placa: placa.toUpperCase() },
      include: {
        cliente: true,
        sinistros: {
          orderBy: { dataAbertura: "asc" },
          include: {
            ciaSeguro: true,
            corretora: true,
            historico: { orderBy: { dataHora: "asc" } },
            foto: { orderBy: { dataCaptura: "asc" } },
            orcamento: {
              orderBy: { dataCriacao: "asc" },
              include: {
                itens: { orderBy: { codigoPeca: "asc" } },
              },
            },
          },
        },
      },
    });

    if (!veiculo) {
      res.status(404).json({ erro: "Veículo não encontrado para essa placa" });
      return;
    }

    res.status(200).json(veiculo);
  } catch (error) {
    console.error("Erro ao buscar histórico do veículo:", error);
    res.status(500).json({
      erro: "Erro ao buscar histórico do veículo",
      detalhe: error instanceof Error ? error.message : String(error),
    });
  }
});

router.post("/", async (req, res) => {
  /*
#swagger.tags = ["Veículos"];
#swagger.summary = "Cadastra um veículo";
#swagger.description = "Realiza o cadastro de um novo veículo.";
#swagger.parameters['body'] = {
  in: 'body',
  required: true,
  schema: {
    placa: 'ABC1D34',
    marca: 'Fiat',
    modelo: 'Uno',
    ano: 2020,
    clienteId: 1
  }
};
#swagger.responses[201] = {
  description: "Veículo cadastrado com sucesso."
};
#swagger.responses[400] = {
  description: "Dados inválidos."
};
*/
  const valida = veiculoSchema.safeParse(req.body);
  if (!valida.success) {
    res.status(400).json({ erro: valida.error });
    return;
  }

  const { placa, marca, modelo, ano, clienteId } = valida.data;

  try {
    const veiculo = await prisma.veiculo.create({
      data: { placa, marca, modelo, ano, clienteId },
    });
    res.status(201).json(veiculo);
  } catch (error) {
    res.status(400).json({ error });
  }
});

router.delete("/:id", requireRole("ADMIN"), async (req, res) => {
  /*
#swagger.tags = ["Veículos"];
#swagger.summary = "Remove um veículo";
#swagger.parameters['id'] = {
  in: 'path',
  required: true,
  description: 'ID do veículo a ser removido',
  schema: { type: 'integer' }
};
*/
  const { id } = req.params;
  try {
    const veiculo = await prisma.veiculo.delete({ where: { id: Number(id) } });
    res.status(200).json(veiculo);
  } catch (error) {
    res.status(400).json({ erro: error });
  }
});

router.put("/:id", async (req, res) => {
  /*
#swagger.tags = ["Veículos"];
#swagger.summary = "Atualiza um veículo";
#swagger.description = "Atualiza os dados de um veículo existente.";
#swagger.parameters['id'] = {
  in: 'path',
  required: true,
  description: 'ID do veículo a ser atualizado',
  schema: { type: 'integer' }
};
#swagger.parameters['body'] = {
  in: 'body',
  required: true,
  schema: {
    placa: 'ABC1D34',
    marca: 'Fiat',
    modelo: 'Uno',
    ano: 2020,
    clienteId: 1
  }
};
#swagger.responses[200] = {
  description: "Veículo atualizado com sucesso."
};
#swagger.responses[400] = {
  description: "Dados inválidos."
};
*/
  const { id } = req.params;

  const valida = veiculoSchema.safeParse(req.body);
  if (!valida.success) {
    res.status(400).json({ erro: valida.error });
    return;
  }

  const { placa, marca, modelo, ano, clienteId } = valida.data;

  try {
    const veiculo = await prisma.veiculo.update({
      where: { id: Number(id) },
      data: { placa, marca, modelo, ano, clienteId },
    });
    res.status(200).json(veiculo);
  } catch (error) {
    res.status(400).json({ error });
  }
});

export default router;
