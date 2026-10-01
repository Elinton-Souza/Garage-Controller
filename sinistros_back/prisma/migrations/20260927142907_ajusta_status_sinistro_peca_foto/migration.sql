-- CreateEnum
CREATE TYPE "StatusSinistro" AS ENUM ('INICIAL', 'AGUARDANDO_AUTORIZACAO', 'AUTORIZADO_COMPRA_PECAS', 'EM_SERVICO', 'FINALIZADO', 'ENTREGUE');

-- CreateEnum
CREATE TYPE "MomentoFoto" AS ENUM ('INICIAL', 'ACOMPANHAMENTO', 'FINAL');

-- Normaliza o texto livre de Sinistro.statusAtual antes de converter pro enum
UPDATE "Sinistro" SET "statusAtual" = CASE
  WHEN "statusAtual" ILIKE '%entreg%' THEN 'ENTREGUE'
  WHEN "statusAtual" ILIKE '%finaliz%' THEN 'FINALIZADO'
  WHEN "statusAtual" ILIKE '%execu%' OR "statusAtual" ILIKE '%servi%' THEN 'EM_SERVICO'
  WHEN "statusAtual" ILIKE '%compra%pec%' OR "statusAtual" ILIKE '%pec%' THEN 'AUTORIZADO_COMPRA_PECAS'
  WHEN "statusAtual" ILIKE '%aprova%' OR "statusAtual" ILIKE '%autoriza%' OR "statusAtual" ILIKE '%orcamento%' OR "statusAtual" ILIKE '%orçamento%' THEN 'AGUARDANDO_AUTORIZACAO'
  ELSE 'INICIAL'
END;

-- AlterTable
ALTER TABLE "Sinistro" ALTER COLUMN "statusAtual" TYPE "StatusSinistro" USING ("statusAtual"::"StatusSinistro");
ALTER TABLE "Sinistro" ALTER COLUMN "statusAtual" SET DEFAULT 'INICIAL';

-- Normaliza o texto livre de Foto.momento antes de converter pro enum (tabela provavelmente vazia)
UPDATE "Foto" SET "momento" = CASE
  WHEN "momento" ILIKE '%inic%' OR "momento" ILIKE '%antes%' THEN 'INICIAL'
  WHEN "momento" ILIKE '%final%' OR "momento" ILIKE '%depois%' THEN 'FINAL'
  ELSE 'ACOMPANHAMENTO'
END;

-- AlterTable
ALTER TABLE "Foto" ALTER COLUMN "momento" TYPE "MomentoFoto" USING ("momento"::"MomentoFoto");

-- AlterTable
ALTER TABLE "ItemOrcamento" ADD COLUMN "codigoPeca" TEXT NOT NULL DEFAULT 'N/D';
ALTER TABLE "ItemOrcamento" ADD COLUMN "dataFaturamento" TIMESTAMP(3);
ALTER TABLE "ItemOrcamento" ALTER COLUMN "dataPedido" DROP NOT NULL;
ALTER TABLE "ItemOrcamento" ALTER COLUMN "dataPedido" DROP DEFAULT;