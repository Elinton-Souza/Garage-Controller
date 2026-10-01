// Script de apresentação: troca o endereço das fotos já cadastradas no banco
// de "http://localhost:3000/uploads/..." (seu computador) para o endereço
// público das mesmas fotos, hospedadas como arquivos estáticos no Vercel.
//
// Por quê: as fotos do seed de demonstração (Kwid e Tiggo) foram cadastradas
// apontando para o seu servidor local. Isso funciona enquanto você está
// testando na sua própria máquina, mas não aparece para quem acessa o site
// publicado de outro computador. Rodar este script resolve isso.
//
// Como rodar (no terminal do Windows, dentro da pasta sinistros_back):
//   npx tsx scripts/atualiza-fotos-producao.ts
//
// É seguro rodar mais de uma vez — só atualiza o que ainda estiver
// apontando para localhost.

import { prisma } from "../lib/prisma"

const DE = "http://localhost:3000/uploads/"
const PARA = "https://garage-controller.vercel.app/fotos-demo/"

async function main() {
  const fotos = await prisma.foto.findMany({
    where: { caminhoArquivo: { startsWith: DE } },
  })

  if (fotos.length === 0) {
    console.log("Nenhuma foto apontando para localhost — nada para atualizar.")
    return
  }

  console.log(`Encontradas ${fotos.length} fotos apontando para localhost. Atualizando...`)

  for (const foto of fotos) {
    const novoCaminho = foto.caminhoArquivo.replace(DE, PARA)
    await prisma.foto.update({
      where: { id: foto.id },
      data: { caminhoArquivo: novoCaminho },
    })
  }

  console.log(`Pronto! ${fotos.length} fotos agora apontam para o Vercel.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
