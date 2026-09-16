-- AlterTable
ALTER TABLE "ItemOrcamento" ADD COLUMN     "iaConsultadoEm" TIMESTAMP(3),
ADD COLUMN     "iaDica" TEXT,
ADD COLUMN     "iaFaixaPreco" TEXT,
ADD COLUMN     "iaLocaisCompra" JSONB;
