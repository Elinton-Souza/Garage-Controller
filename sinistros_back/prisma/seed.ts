import { prisma } from '../lib/prisma'
import dados from './seed-data.json'

async function main() {
  const clienteMap = new Map<number, number>()
  for (const c of dados.clientes as any[]) {
    const { id, ...data } = c
    const created = await prisma.cliente.create({ data })
    clienteMap.set(id, created.id)
  }

  const ciaSeguroMap = new Map<number, number>()
  for (const c of dados.ciasSeguro as any[]) {
    const { id, ...data } = c
    const created = await prisma.ciaSeguro.create({ data })
    ciaSeguroMap.set(id, created.id)
  }

  const corretoraMap = new Map<number, number>()
  for (const c of dados.corretoras as any[]) {
    const { id, ...data } = c
    const created = await prisma.corretora.create({ data })
    corretoraMap.set(id, created.id)
  }

  const veiculoMap = new Map<number, number>()
  for (const v of dados.veiculos as any[]) {
    const { id, clienteId, ...data } = v
    const created = await prisma.veiculo.create({
      data: { ...data, clienteId: clienteMap.get(clienteId)! },
    })
    veiculoMap.set(id, created.id)
  }

  const sinistroMap = new Map<number, number>()
  for (const s of dados.sinistros as any[]) {
    const { id, veiculoId, ciaSeguroId, corretoraId, dataAbertura, ...data } = s
    const created = await prisma.sinistro.create({
      data: {
        ...data,
        veiculoId: veiculoMap.get(veiculoId)!,
        ciaSeguroId: ciaSeguroId != null ? ciaSeguroMap.get(ciaSeguroId) : null,
        corretoraId: corretoraId != null ? corretoraMap.get(corretoraId) : null,
        dataAbertura: new Date(dataAbertura),
      },
    })
    sinistroMap.set(id, created.id)
  }

  const orcamentoMap = new Map<number, number>()
  for (const o of dados.orcamentos as any[]) {
    const { id, sinistroId, ...data } = o
    const created = await prisma.orcamento.create({
      data: { ...data, sinistroId: sinistroMap.get(sinistroId)! },
    })
    orcamentoMap.set(id, created.id)
  }

  for (const i of dados.itensOrcamento as any[]) {
    const { id, orcamentoId, ...data } = i
    await prisma.itemOrcamento.create({
      data: { ...data, orcamentoId: orcamentoMap.get(orcamentoId)! },
    })
  }

  console.log('Seed concluído com sucesso!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })