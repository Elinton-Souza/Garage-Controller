-- CreateEnum
CREATE TYPE "TipoAtendimento" AS ENUM ('PARTICULAR', 'SEGURO');

-- CreateEnum
CREATE TYPE "TipoOrcamento" AS ENUM ('INICIAL', 'COMPLEMENTAR');

-- CreateTable
CREATE TABLE "Cliente" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "docIdentificacao" TEXT NOT NULL,
    "email" TEXT,
    "telefone" TEXT,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Veiculo" (
    "id" SERIAL NOT NULL,
    "placa" TEXT NOT NULL,
    "marca" TEXT NOT NULL,
    "modelo" TEXT,
    "ano" INTEGER NOT NULL,
    "clienteId" INTEGER NOT NULL,

    CONSTRAINT "Veiculo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CiaSeguro" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "telefone" TEXT,
    "contatoResponsavel" TEXT,

    CONSTRAINT "CiaSeguro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Corretora" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "corretorResponsavel" TEXT,
    "email" TEXT,

    CONSTRAINT "Corretora_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CorretoraCia" (
    "corretoraId" INTEGER NOT NULL,
    "ciaId" INTEGER NOT NULL,

    CONSTRAINT "CorretoraCia_pkey" PRIMARY KEY ("corretoraId","ciaId")
);

-- CreateTable
CREATE TABLE "Sinistro" (
    "id" SERIAL NOT NULL,
    "veiculoId" INTEGER NOT NULL,
    "tipoAtendimento" "TipoAtendimento" NOT NULL,
    "ciaSeguroId" INTEGER,
    "corretoraId" INTEGER,
    "numApolice" TEXT,
    "kmAtendimento" INTEGER NOT NULL,
    "dataAbertura" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataEncerramento" TIMESTAMP(3),
    "statusAtual" TEXT NOT NULL,

    CONSTRAINT "Sinistro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistoricoSinistro" (
    "id" SERIAL NOT NULL,
    "sinistroId" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "dataHora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observacao" TEXT,

    CONSTRAINT "HistoricoSinistro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Orcamento" (
    "id" SERIAL NOT NULL,
    "sinistroId" INTEGER NOT NULL,
    "versao" INTEGER,
    "tipo" "TipoOrcamento" NOT NULL,
    "valorTotal" DECIMAL(65,30) NOT NULL,
    "dataCriacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL,
    "dataResposta" TIMESTAMP(3),

    CONSTRAINT "Orcamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemOrcamento" (
    "id" SERIAL NOT NULL,
    "orcamentoId" INTEGER NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor" DECIMAL(65,30) NOT NULL,
    "dataPedido" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataPrevistaChegada" TIMESTAMP(3),
    "dataChegadaReal" TIMESTAMP(3),

    CONSTRAINT "ItemOrcamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Foto" (
    "id" SERIAL NOT NULL,
    "sinistroId" INTEGER NOT NULL,
    "orcamentoId" INTEGER,
    "momento" TEXT NOT NULL,
    "caminhoArquivo" TEXT NOT NULL,
    "dataCaptura" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Foto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_docIdentificacao_key" ON "Cliente"("docIdentificacao");

-- CreateIndex
CREATE UNIQUE INDEX "Veiculo_placa_key" ON "Veiculo"("placa");

-- AddForeignKey
ALTER TABLE "Veiculo" ADD CONSTRAINT "Veiculo_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorretoraCia" ADD CONSTRAINT "CorretoraCia_corretoraId_fkey" FOREIGN KEY ("corretoraId") REFERENCES "Corretora"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorretoraCia" ADD CONSTRAINT "CorretoraCia_ciaId_fkey" FOREIGN KEY ("ciaId") REFERENCES "CiaSeguro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sinistro" ADD CONSTRAINT "Sinistro_veiculoId_fkey" FOREIGN KEY ("veiculoId") REFERENCES "Veiculo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sinistro" ADD CONSTRAINT "Sinistro_ciaSeguroId_fkey" FOREIGN KEY ("ciaSeguroId") REFERENCES "CiaSeguro"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sinistro" ADD CONSTRAINT "Sinistro_corretoraId_fkey" FOREIGN KEY ("corretoraId") REFERENCES "Corretora"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoricoSinistro" ADD CONSTRAINT "HistoricoSinistro_sinistroId_fkey" FOREIGN KEY ("sinistroId") REFERENCES "Sinistro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Orcamento" ADD CONSTRAINT "Orcamento_sinistroId_fkey" FOREIGN KEY ("sinistroId") REFERENCES "Sinistro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemOrcamento" ADD CONSTRAINT "ItemOrcamento_orcamentoId_fkey" FOREIGN KEY ("orcamentoId") REFERENCES "Orcamento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Foto" ADD CONSTRAINT "Foto_sinistroId_fkey" FOREIGN KEY ("sinistroId") REFERENCES "Sinistro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Foto" ADD CONSTRAINT "Foto_orcamentoId_fkey" FOREIGN KEY ("orcamentoId") REFERENCES "Orcamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;
