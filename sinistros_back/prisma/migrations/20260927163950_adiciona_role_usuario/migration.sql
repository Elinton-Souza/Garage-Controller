-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'GERENTE', 'FUNCIONARIO');

-- AlterTable
ALTER TABLE "ItemOrcamento" ALTER COLUMN "codigoPeca" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'FUNCIONARIO';
