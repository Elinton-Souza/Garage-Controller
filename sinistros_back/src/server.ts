import express from 'express'
import cors from 'cors'
import routesClientes from './routes/clientes'
import routesVeiculos from './routes/veiculos'
import routesCiaSeguro from './routes/ciaSeguro'
import routesCorretora from './routes/corretora'
import routesCorretoraCia from './routes/corretoraCia'
import routesSinistro from './routes/sinistro'

const app = express()
const port = 3000

app.use(express.json())
app.use(cors())

app.use("/clientes", routesClientes)
app.use("/veiculos", routesVeiculos)
app.use("/cia-seguro", routesCiaSeguro)
app.use("/corretora", routesCorretora)
app.use("/corretora-cia", routesCorretoraCia)
app.use("/sinistro", routesSinistro)

app.get('/', (req, res) => {
  res.send('Api: Garage Controller — Cadastro de Sinistros')
})

app.listen(port, () => {
  console.log(`Servidor rodando na porta: ${port}`)
})

