import { consultarPeca } from "../services/consultaIA";
import { prisma } from "../../lib/prisma";
import { Router } from "express";
import { z } from "zod";

const router = Router();

const itemSchema = z.object({
  orcamentoId: z.number().int({ message: "Informe o orçamento" }),
  descricao: z.string().min(2, { message: "Informe a descrição" }),
  valor: z.number({ message: "Informe o valor" }),
});

router.get("/", async (req, res) => {
  /*
  #swagger.tags = ["Itens de Orçamento"];
  #swagger.summary = "Lista todos os itens de orçamento";
  */
  try {
    const itens = await prisma.itemOrcamento.findMany({
      include: { orcamento: true },
    });
    res.status(200).json(itens);
  } catch (error) {
    res.status(500).json({ erro: error });
  }
});

router.post("/", async (req, res) => {
  /*
  #swagger.tags = ["Itens de Orçamento"];
  #swagger.summary = "Cadastra um item de orçamento";
  #swagger.description = "Cadastra um item de orçamento. Automaticamente consulta a IA para sugerir locais de compra, faixa de preço e dicas sobre a peça informada.";
  #swagger.parameters['body'] = {
    in: 'body',
    required: true,
    schema: {
      orcamentoId: 1,
      descricao: 'Para-choque dianteiro',
      valor: 350.00
    }
  };
  #swagger.responses[201] = {
    description: "Item de orçamento cadastrado com sucesso."
  };
  #swagger.responses[400] = {
    description: "Dados inválidos."
  };
  */
  const valida = itemSchema.safeParse(req.body);
  if (!valida.success) {
    res.status(400).json({ erro: valida.error });
    return;
  }

  const { orcamentoId, descricao, valor } = valida.data;

  try {
    let item = await prisma.itemOrcamento.create({
      data: { orcamentoId, descricao, valor },
    });

    try {
      const orcamento = await prisma.orcamento.findUnique({
        where: { id: orcamentoId },
        include: { sinistro: { include: { veiculo: true } } },
      });

      if (orcamento) {
        const veiculo = orcamento.sinistro.veiculo;
        const consulta = await consultarPeca(
          descricao,
          veiculo.marca,
          veiculo.modelo,
          veiculo.ano,
        );

        item = await prisma.itemOrcamento.update({
          where: { id: item.id },
          data: {
            iaLocaisCompra: consulta.locais,
            iaFaixaPreco: consulta.faixaPrecoEstimada,
            iaDica: consulta.dica,
            iaConsultadoEm: new Date(),
          },
        });
      }
    } catch (erroIA) {
      console.error("Falha na consulta de IA:", erroIA);
      // segue sem os dados de IA — não quebra a criação do item
    }

    res.status(201).json(item);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error });
  }
});

router.put("/:id", async (req, res) => {
  /*
  #swagger.tags = ["Itens de Orçamento"];
  #swagger.summary = "Atualiza um item de orçamento";
  #swagger.description = "Atualiza os dados de um item de orçamento existente.";
  #swagger.parameters['id'] = {
    in: 'path',
    required: true,
    description: 'ID do item de orçamento a ser atualizado',
    schema: { type: 'integer' }
  };
  #swagger.parameters['body'] = {
    in: 'body',
    required: true,
    schema: {
      orcamentoId: 1,
      descricao: 'Para-choque dianteiro',
      valor: 350.00
    }
  };
  #swagger.responses[200] = {
    description: "Item de orçamento atualizado com sucesso."
  };
  #swagger.responses[400] = {
    description: "Dados inválidos."
  };
  */
  const { id } = req.params;

  const valida = itemSchema.safeParse(req.body);
  if (!valida.success) {
    res.status(400).json({ erro: valida.error });
    return;
  }

  const { orcamentoId, descricao, valor } = valida.data;

  try {
    const item = await prisma.itemOrcamento.update({
      where: { id: Number(id) },
      data: { orcamentoId, descricao, valor },
    });
    res.status(200).json(item);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error });
  }
});

router.delete("/:id", async (req, res) => {
  /*
  #swagger.tags = ["Itens de Orçamento"];
  #swagger.summary = "Remove um item de orçamento";
  #swagger.parameters['id'] = {
    in: 'path',
    required: true,
    description: 'ID do item de orçamento a ser removido',
    schema: { type: 'integer' }
  };
  */
  const { id } = req.params;
  try {
    const item = await prisma.itemOrcamento.delete({
      where: { id: Number(id) },
    });
    res.status(200).json(item);
  } catch (error) {
    res.status(400).json({ erro: error });
  }
});

export default router;
