import express from 'express'
import cors from 'cors'
import routesClientes from './routes/clientes'
import routesVeiculos from './routes/veiculos'
import routesCiaSeguro from './routes/ciaSeguro'

const app = express()
const port = 3000

app.use(express.json())
app.use(cors())

app.use("/clientes", routesClientes)
app.use("/veiculos", routesVeiculos)
app.use("/cia-seguro", routesCiaSeguro)

app.get('/', (req, res) => {
  res.send('Api: Garage Controller — Cadastro de Sinistros')
})

app.listen(port, () => {
  console.log(`Servidor rodando na porta: ${port}`)
})

