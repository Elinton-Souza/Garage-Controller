// Script de demonstração: registra os 2 casos reais (Kwid e Tiggo) com fotos
// de vistoria e orçamentos reais, para apresentação ao professor.
//
// Como rodar (no terminal do Windows, dentro da pasta sinistros_back):
//   npx tsx scripts/seed-demo.ts
//
// É seguro rodar mais de uma vez: o script verifica o que já existe (por
// placa / docIdentificacao) e não duplica cliente, veículo, sinistro,
// orçamento nem fotos já cadastrados.
//
// Pré-requisito: as fotos e PDFs já precisam estar em sinistros_back/uploads
// (isso já foi organizado automaticamente). O servidor (npm run dev) precisa
// estar rodando normalmente depois, para as fotos aparecerem na tela — este
// script só grava no banco, não precisa do servidor rodando para funcionar.

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { prisma } from "../lib/prisma"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const UPLOADS_DIR = path.join(__dirname, "..", "uploads")
const BASE_URL = "http://localhost:3000"

type MomentoFoto = "INICIAL" | "ACOMPANHAMENTO" | "FINAL"

function listaArquivos(...partes: string[]): string[] {
  const dir = path.join(UPLOADS_DIR, ...partes)
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir)
    .filter((f) => !f.startsWith("."))
    .sort((a, b) => Number(a.split(".")[0]) - Number(b.split(".")[0]))
}

async function garanteCliente(nome: string, docIdentificacao: string, telefone?: string) {
  const existente = await prisma.cliente.findUnique({ where: { docIdentificacao } })
  if (existente) return existente
  return prisma.cliente.create({ data: { nome, docIdentificacao, telefone } })
}

async function garanteVeiculo(placa: string, marca: string, modelo: string, ano: number, clienteId: number) {
  const existente = await prisma.veiculo.findUnique({ where: { placa } })
  if (existente) return existente
  return prisma.veiculo.create({ data: { placa, marca, modelo, ano, clienteId } })
}

async function garanteFotos(
  sinistroId: number,
  momento: MomentoFoto,
  arquivos: string[],
  subpasta: string[],
  orcamentoId?: number
) {
  for (const arquivo of arquivos) {
    const caminhoArquivo = `${BASE_URL}/uploads/${subpasta.join("/")}/${arquivo}`
    const jaExiste = await prisma.foto.findFirst({ where: { sinistroId, caminhoArquivo } })
    if (jaExiste) continue
    await prisma.foto.create({ data: { sinistroId, momento, caminhoArquivo, orcamentoId } })
  }
}

async function seedKwid() {
  console.log("--- KWID ---")

  // O orçamento da oficina não trouxe nome/documento do cliente final (campo
  // veio em branco no PDF) — por isso o doc abaixo é um placeholder. Edite o
  // cliente pela tela "Clientes" quando tiver o nome real.
  const cliente = await garanteCliente("Cliente do Kwid (completar dados)", "111.111.111-11")
  const veiculo = await garanteVeiculo("JCZ0C27", "Renault", "Kwid Outsider 1.0 12V Flex", 2025, cliente.id)

  let sinistro = await prisma.sinistro.findFirst({ where: { veiculoId: veiculo.id } })
  const novoSinistro = !sinistro
  if (!sinistro) {
    sinistro = await prisma.sinistro.create({
      data: {
        veiculoId: veiculo.id,
        tipoAtendimento: "PARTICULAR",
        kmAtendimento: 11405,
        dataAbertura: new Date("2026-08-06T10:30:00"),
        statusAtual: "FINALIZADO",
      },
    })
  }

  if (novoSinistro) {
    await prisma.historicoSinistro.createMany({
      data: [
        { sinistroId: sinistro.id, status: "INICIAL", dataHora: new Date("2026-08-06T10:30:00"), observacao: "Veículo recebido para avaliação e orçamento inicial." },
        { sinistroId: sinistro.id, status: "EM_SERVICO", dataHora: new Date("2026-08-10T09:00:00"), observacao: "Peças liberadas, início do reparo na funilaria." },
        { sinistroId: sinistro.id, status: "FINALIZADO", dataHora: new Date("2026-08-20T17:00:00"), observacao: "Reparo concluído." },
      ],
    })
  }

  let orcamento = await prisma.orcamento.findFirst({ where: { sinistroId: sinistro.id, tipo: "INICIAL" } })
  if (!orcamento) {
    orcamento = await prisma.orcamento.create({
      data: {
        sinistroId: sinistro.id,
        versao: 1,
        tipo: "INICIAL",
        valorTotal: 28752.80,
        status: "Pendente",
        dataCriacao: new Date("2026-08-06T10:30:59"),
      },
    })

    const itens: { codigoPeca: string; descricao: string; valor: number }[] = [
      { codigoPeca: "990459232R", descricao: "Adesivo da porta dianteira esquerda (Outsider)", valor: 81.60 },
      { codigoPeca: "543026080R", descricao: "Amortecedor dianteiro esquerdo", valor: 445.70 },
      { codigoPeca: "620725575R", descricao: "Aplique do parachoque dianteiro inferior", valor: 391.60 },
      { codigoPeca: "403005174R", descricao: "Aro de roda de liga leve", valor: 4862.40 },
      { codigoPeca: "648600154R", descricao: "Bandeja da bateria", valor: 153.50 },
      { codigoPeca: "545032428R", descricao: "Braço oscilante dianteiro esquerdo", valor: 435.00 },
      { codigoPeca: "651000607R", descricao: "Capô", valor: 2052.20 },
      { codigoPeca: "214763673R", descricao: "Defletor do radiador", valor: 97.60 },
      { codigoPeca: "654004747R", descricao: "Dobradiça direita do capô", valor: 294.10 },
      { codigoPeca: "654016135R", descricao: "Dobradiça esquerda do capô", valor: 295.50 },
      { codigoPeca: "804202083R", descricao: "Dobradiça inferior da porta dianteira esquerda", valor: 369.10 },
      { codigoPeca: "804202083R", descricao: "Dobradiça superior da porta dianteira esquerda", valor: 369.10 },
      { codigoPeca: "628909311R", descricao: "Emblema da grade", valor: 108.60 },
      { codigoPeca: "260602727R", descricao: "Farol esquerdo", valor: 785.60 },
      { codigoPeca: "762457763R", descricao: "Fechamento da lateral dianteira interna esquerda", valor: 39.60 },
      { codigoPeca: "623834398R", descricao: "Friso direito da grade do radiador", valor: 62.60 },
      { codigoPeca: "623834398R", descricao: "Friso esquerdo da grade do radiador", valor: 62.60 },
      { codigoPeca: "668118617R", descricao: "Grade do painel do limpador", valor: 243.30 },
      { codigoPeca: "623103295R", descricao: "Grade do radiador", valor: 278.70 },
      { codigoPeca: "657223497R", descricao: "Grampo da vareta do capô", valor: 23.10 },
      { codigoPeca: "668635019R", descricao: "Guarnição esquerda da grade do painel do limpador", valor: 74.20 },
      { codigoPeca: "261521020R", descricao: "Jogo de grades do parachoque dianteiro", valor: 420.50 },
      { codigoPeca: "001", descricao: "Kit presilhas", valor: 250.00 },
      { codigoPeca: "266058942R", descricao: "Lanterna auxiliar LED esquerda", valor: 1190.20 },
      { codigoPeca: "762318308R", descricao: "Lateral dianteira interna esquerda", valor: 544.10 },
      { codigoPeca: "400157828R", descricao: "Manga de eixo dianteira esquerda", valor: 330.10 },
      { codigoPeca: "638132298R", descricao: "Moldura do vão de roda dianteiro esquerdo", valor: 223.40 },
      { codigoPeca: "638414175R", descricao: "Parabarro dianteiro esquerdo", valor: 89.90 },
      { codigoPeca: "620264905R", descricao: "Parachoque dianteiro inferior", valor: 541.00 },
      { codigoPeca: "620224832R", descricao: "Parachoque dianteiro superior", valor: 760.30 },
      { codigoPeca: "631013941R", descricao: "Paralama dianteiro esquerdo", valor: 659.50 },
      { codigoPeca: "391016390R", descricao: "Semieixo completo dianteiro esquerdo", valor: 1274.90 },
      { codigoPeca: "631454472R", descricao: "Suporte anterior do paralama dianteiro esquerdo", valor: 35.10 },
      { codigoPeca: "622239305R", descricao: "Suporte esquerdo do parachoque dianteiro superior", valor: 48.10 },
    ]
    await prisma.itemOrcamento.createMany({
      data: itens.map((it) => ({ ...it, orcamentoId: orcamento!.id })),
    })
  }

  await garanteFotos(sinistro.id, "INICIAL", listaArquivos("kwid", "inicial"), ["kwid", "inicial"])
  await garanteFotos(sinistro.id, "ACOMPANHAMENTO", listaArquivos("kwid", "acompanhamento"), ["kwid", "acompanhamento"])
  await garanteFotos(sinistro.id, "ACOMPANHAMENTO", listaArquivos("kwid", "complemento"), ["kwid", "complemento"])
  await garanteFotos(sinistro.id, "FINAL", listaArquivos("kwid", "final"), ["kwid", "final"])

  console.log(`Kwid pronto — Sinistro #${sinistro.id}, Veículo #${veiculo.id}, Cliente #${cliente.id}`)
}

async function seedTiggo() {
  console.log("--- TIGGO ---")

  // Nome e telefone reais vieram do orçamento autorizado pela seguradora
  // (campo "Segurado"). O CPF não aparece em nenhum dos documentos — o
  // placeholder abaixo precisa ser corrigido na tela "Clientes".
  const cliente = await garanteCliente("Gilberto Voloski Isquierdo", "222.222.222-22", "(53) 99151-2119")
  const veiculo = await garanteVeiculo("TRK1F32", "Chery", "Tiggo 5X Sport 1.5 Turbo", 2027, cliente.id)

  // Cia de seguros real (Porto Seguro) citada no orçamento autorizado.
  let ciaSeguro = await prisma.ciaSeguro.findFirst({ where: { nome: { contains: "Porto Seguro" } } })
  if (!ciaSeguro) {
    ciaSeguro = await prisma.ciaSeguro.create({
      data: {
        nome: "Porto Seguro Cia de Seguros Gerais",
        // Telefone/contato não constam no documento — ajuste se tiver o dado real.
        telefone: "A confirmar",
        contatoResponsavel: "Central de Relacionamento Porto Seguro",
      },
    })
  }

  // O documento não cita uma corretora — reaproveita a primeira já cadastrada
  // no sistema como placeholder. Troque pela corretora real na tela de edição
  // do sinistro, se souber qual foi.
  const corretora = await prisma.corretora.findFirst()
  if (!corretora) {
    throw new Error("Nenhuma corretora cadastrada no sistema — cadastre uma antes de rodar o seed do Tiggo.")
  }

  let sinistro = await prisma.sinistro.findFirst({ where: { veiculoId: veiculo.id } })
  const novoSinistro = !sinistro
  if (!sinistro) {
    sinistro = await prisma.sinistro.create({
      data: {
        veiculoId: veiculo.id,
        tipoAtendimento: "SEGURO",
        ciaSeguroId: ciaSeguro.id,
        corretoraId: corretora.id,
        numApolice: "25496864",
        kmAtendimento: 819,
        dataAbertura: new Date("2026-08-07T17:57:46"),
        statusAtual: "EM_SERVICO",
      },
    })
  }

  if (novoSinistro) {
    await prisma.historicoSinistro.createMany({
      data: [
        { sinistroId: sinistro.id, status: "INICIAL", dataHora: new Date("2026-08-07T17:57:46"), observacao: "Vistoria inicial realizada, orçamento enviado à seguradora." },
        { sinistroId: sinistro.id, status: "AGUARDANDO_AUTORIZACAO", dataHora: new Date("2026-08-07T18:30:00"), observacao: "Aguardando liberação da Porto Seguro." },
        { sinistroId: sinistro.id, status: "AUTORIZADO_COMPRA_PECAS", dataHora: new Date("2026-08-12T21:21:26"), observacao: "Orçamento complementar liberado pela seguradora (reparo liberado)." },
        { sinistroId: sinistro.id, status: "EM_SERVICO", dataHora: new Date("2026-08-13T09:00:00"), observacao: "Início do reparo na funilaria." },
      ],
    })
  }

  let orcamentoInicial = await prisma.orcamento.findFirst({ where: { sinistroId: sinistro.id, tipo: "INICIAL" } })
  if (!orcamentoInicial) {
    orcamentoInicial = await prisma.orcamento.create({
      data: {
        sinistroId: sinistro.id,
        versao: 1,
        tipo: "INICIAL",
        valorTotal: 58618.70,
        status: "Pendente",
        dataCriacao: new Date("2026-08-07T17:57:46"),
      },
    })

    const itensIniciais: { codigoPeca: string; descricao: string; valor: number }[] = [
      { codigoPeca: "553000124AADYJ", descricao: "Capô", valor: 7637.57 },
      { codigoPeca: "301000058AA", descricao: "Condensador do A/C", valor: 2077.34 },
      { codigoPeca: "302000866AA", descricao: "Defletor inferior do radiador", valor: 197.92 },
      { codigoPeca: "302003023AA", descricao: "Defletor superior do radiador", valor: 358.16 },
      { codigoPeca: "J268402040DY", descricao: "Dobradiça direita do capô", valor: 597.19 },
      { codigoPeca: "J268402030DY", descricao: "Dobradiça esquerda do capô", valor: 597.19 },
      { codigoPeca: "302000916AA", descricao: "Eletroventilador", valor: 3051.03 },
      { codigoPeca: "605000627AB", descricao: "Farol direito", valor: 9476.42 },
      { codigoPeca: "605000626AB", descricao: "Farol esquerdo", valor: 9476.42 },
      { codigoPeca: "602005062AA", descricao: "Grade do radiador", valor: 9055.65 },
      { codigoPeca: "602005065AA", descricao: "Guia direita do parachoque dianteiro superior", valor: 83.57 },
      { codigoPeca: "602005064AA", descricao: "Guia esquerda do parachoque dianteiro superior", valor: 83.57 },
      { codigoPeca: "602006900AA", descricao: "Moldura direita do parachoque dianteiro inferior", valor: 135.52 },
      { codigoPeca: "602006899AA", descricao: "Moldura esquerda do parachoque dianteiro inferior", valor: 135.52 },
      { codigoPeca: "602006898AA", descricao: "Moldura inferior da grade do radiador", valor: 701.86 },
      { codigoPeca: "602006896AA", descricao: "Parachoque dianteiro inferior", valor: 1719.22 },
      { codigoPeca: "602006895AA", descricao: "Parachoque dianteiro superior", valor: 2681.36 },
      { codigoPeca: "302000021AA", descricao: "Radiador", valor: 3255.51 },
      { codigoPeca: "302000632AA", descricao: "Radiador auxiliar", valor: 1392.38 },
      { codigoPeca: "M112803553BA", descricao: "Suporte da placa dianteira", valor: 122.38 },
      { codigoPeca: "602005067AA", descricao: "Suporte direito do parachoque dianteiro superior", valor: 146.46 },
      { codigoPeca: "602005066AA", descricao: "Suporte esquerdo do parachoque dianteiro superior", valor: 146.46 },
    ]
    await prisma.itemOrcamento.createMany({
      data: itensIniciais.map((it) => ({ ...it, orcamentoId: orcamentoInicial!.id })),
    })
  }

  // Orçamento complementar: valores reavaliados e liberados pela seguradora
  // (documento "orçamento autorizado"), já com desconto da oficina aplicado.
  let orcamentoComplementar = await prisma.orcamento.findFirst({ where: { sinistroId: sinistro.id, tipo: "COMPLEMENTAR" } })
  if (!orcamentoComplementar) {
    orcamentoComplementar = await prisma.orcamento.create({
      data: {
        sinistroId: sinistro.id,
        versao: 2,
        tipo: "COMPLEMENTAR",
        valorTotal: 33619.80,
        status: "Aprovado",
        dataCriacao: new Date("2026-08-12T21:21:26"),
        dataResposta: new Date("2026-08-11T00:00:00"),
      },
    })

    const itensComplementares: { codigoPeca: string; descricao: string; valor: number }[] = [
      { codigoPeca: "M112803553BA", descricao: "Suporte de placas", valor: 90.35 },
      { codigoPeca: "302000632AA", descricao: "Intercooler", valor: 1322.76 },
      { codigoPeca: "302000021AA", descricao: "Radiador (radiador de água)", valor: 3092.73 },
      { codigoPeca: "602006895AA", descricao: "Parachoque dianteiro superior", valor: 2547.29 },
      { codigoPeca: "602006896AA", descricao: "Parachoque dianteiro inferior", valor: 1633.26 },
      { codigoPeca: "602006898AA", descricao: "Moldura inferior da grade do radiador", valor: 666.77 },
      { codigoPeca: "602006899AA", descricao: "Moldura esquerda do parachoque dianteiro inferior", valor: 128.74 },
      { codigoPeca: "602006900AA", descricao: "Moldura direita do parachoque dianteiro inferior", valor: 128.74 },
      { codigoPeca: "602005062AA", descricao: "Grade do radiador", valor: 8602.87 },
      { codigoPeca: "302003023AA", descricao: "Defletor superior do radiador", valor: 349.11 },
      { codigoPeca: "302000866AA", descricao: "Defletor inferior do radiador", valor: 188.02 },
      { codigoPeca: "301000058AA", descricao: "Condensador do A/C", valor: 1973.47 },
      { codigoPeca: "553000124AADYJ", descricao: "Capô do motor (primer)", valor: 7255.69 },
    ]
    await prisma.itemOrcamento.createMany({
      data: itensComplementares.map((it) => ({ ...it, orcamentoId: orcamentoComplementar!.id })),
    })
  }

  await garanteFotos(sinistro.id, "INICIAL", listaArquivos("tiggo", "inicial"), ["tiggo", "inicial"])
  await garanteFotos(sinistro.id, "ACOMPANHAMENTO", listaArquivos("tiggo", "acompanhamento"), ["tiggo", "acompanhamento"])
  // Fotos de "complemento" ficam amarradas ao orçamento complementar aprovado.
  await garanteFotos(sinistro.id, "ACOMPANHAMENTO", listaArquivos("tiggo", "complemento"), ["tiggo", "complemento"], orcamentoComplementar.id)

  console.log(`Tiggo pronto — Sinistro #${sinistro.id}, Veículo #${veiculo.id}, Cliente #${cliente.id}`)
}

async function main() {
  await seedKwid()
  await seedTiggo()
  console.log("")
  console.log("Concluído! Os orçamentos em PDF também foram copiados para dentro de")
  console.log("sinistros_back/uploads/kwid e /tiggo — você pode abri-los direto por lá")
  console.log("se quiser mostrar o documento original ao professor.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
