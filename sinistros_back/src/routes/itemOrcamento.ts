import { consultarPeca } from "../services/consultaIA";
import { prisma } from "../../lib/prisma";
import { requireRole } from "../middlewares/auth"
import { Router } from "express";
import { z } from "zod";

const router = Router();

const itemSchema = z.object({
  orcamentoId: z.number().int({ message: "Informe o orçamento" }),
  codigoPeca: z.string().min(1, { message: "Informe o código da peça" }),
  descricao: z.string().min(2, { message: "Informe a descrição" }),
  valor: z.number({ message: "Informe o valor" }),
  dataPedido: z.coerce.date().optional(),
  dataFaturamento: z.coerce.date().optional(),
  dataPrevistaChegada: z.coerce.date().optional(),
  dataChegadaReal: z.coerce.date().optional(),
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
      codigoPeca: 'PC-4521',
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

  const { orcamentoId, codigoPeca, descricao, valor, dataPedido, dataFaturamento, dataPrevistaChegada, dataChegadaReal } = valida.data;

  try {
    let item = await prisma.itemOrcamento.create({
      data: { orcamentoId, codigoPeca, descricao, valor, dataPedido, dataFaturamento, dataPrevistaChegada, dataChegadaReal },
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

router.post("/:id/consultar-ia", async (req, res) => {
  /*
  #swagger.tags = ["Itens de Orçamento"];
  #swagger.summary = "Consulta o mercado via IA para um item de orçamento existente";
  #swagger.description = "Reconsulta a IA (locais de compra, faixa de preço e dica técnica) para uma peça já cadastrada, atualizando os dados de IA do item com a data/hora da nova consulta.";
  #swagger.parameters['id'] = {
    in: 'path',
    required: true,
    description: 'ID do item de orçamento',
    schema: { type: 'integer' }
  };
  #swagger.responses[200] = {
    description: "Consulta realizada e item atualizado."
  };
  #swagger.responses[404] = {
    description: "Item de orçamento não encontrado."
  };
  */
  const { id } = req.params;
  try {
    const item = await prisma.itemOrcamento.findUnique({
      where: { id: Number(id) },
      include: { orcamento: { include: { sinistro: { include: { veiculo: true } } } } },
    });

    if (!item) {
      res.status(404).json({ erro: "Item de orçamento não encontrado" });
      return;
    }

    const veiculo = item.orcamento.sinistro.veiculo;
    const consulta = await consultarPeca(item.descricao, veiculo.marca, veiculo.modelo, veiculo.ano);

    const atualizado = await prisma.itemOrcamento.update({
      where: { id: item.id },
      data: {
        iaLocaisCompra: consulta.locais,
        iaFaixaPreco: consulta.faixaPrecoEstimada,
        iaDica: consulta.dica,
        iaConsultadoEm: new Date(),
      },
    });

    res.status(200).json(atualizado);
  } catch (error) {
    console.error("Erro ao consultar IA para o item:", error);
    res.status(400).json({
      erro: "Erro ao consultar IA",
      detalhe: error instanceof Error ? error.message : String(error),
    });
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
      codigoPeca: 'PC-4521',
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

  const { orcamentoId, codigoPeca, descricao, valor, dataPedido, dataFaturamento, dataPrevistaChegada, dataChegadaReal } = valida.data;

  try {
    const item = await prisma.itemOrcamento.update({
      where: { id: Number(id) },
      data: { orcamentoId, codigoPeca, descricao, valor, dataPedido, dataFaturamento, dataPrevistaChegada, dataChegadaReal },
    });
    res.status(200).json(item);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error });
  }
});

router.delete("/:id", requireRole("ADMIN"), async (req, res) => {
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
