import express from 'express'
import cors from 'cors'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import swaggerUi from "swagger-ui-express";
import swaggerDocument from "../swagger-output.json";
import { autentica, requireRole } from './middlewares/auth'
import routesClientes from './routes/clientes'
import routesVeiculos from './routes/veiculos'
import routesCiaSeguro from './routes/ciaSeguro'
import routesCorretora from './routes/corretora'
import routesCorretoraCia from './routes/corretoraCia'
import routesSinistro from './routes/sinistro'
import routesHistoricoSinistro from './routes/historicoSinistro'
import routesOrcamento from './routes/orcamento'
import routesItemOrcamento from './routes/itemOrcamento'
import routesFoto from './routes/foto'
import routesUsuarios from './routes/usuarios'
import routesLogin from './routes/login'
import routesDashboard from './routes/dashboard'

const app = express()
const port = 3000

app.use(express.json())
app.use(cors())

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Fotos e orçamentos digitalizados ficam servidos como arquivos estáticos.
// Precisa estar ANTES do middleware de autenticação: o navegador carrega uma
// <img src="..."> sem enviar o token JWT, então essa rota tem que ser pública
// (assim como /login) para as imagens aparecerem na tela.
const uploadsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "uploads")
app.use("/uploads", express.static(uploadsDir))

// Login fica público — é a porta de entrada para obter o token.
app.use("/login", routesLogin)

// A partir daqui, toda rota exige um token JWT válido (usuário logado).
app.use(autentica)

app.use("/clientes", routesClientes)
app.use("/veiculos", routesVeiculos)
app.use("/cia-seguro", routesCiaSeguro)
app.use("/corretora", routesCorretora)
app.use("/corretora-cia", routesCorretoraCia)
app.use("/sinistro", routesSinistro)
app.use("/historico-sinistro", routesHistoricoSinistro)
app.use("/orcamento", routesOrcamento)
app.use("/item-orcamento", routesItemOrcamento)
app.use("/foto", routesFoto)
// Gerenciar usuários (cadastrar/editar/remover login e definir o perfil de
// Gerente/Funcionário) é restrito ao ADMIN.
app.use("/usuarios", requireRole("ADMIN"), routesUsuarios)
// Dashboard com dados consolidados: restrito a ADMIN e GERENTE.
app.use("/dashboard", requireRole("ADMIN", "GERENTE"), routesDashboard)

app.get('/', (req, res) => {
  res.send('Api: Garage Controller — Cadastro de Sinistros')
})

app.listen(port, () => {
  console.log(`Servidor rodando na porta: ${port}`)
})

