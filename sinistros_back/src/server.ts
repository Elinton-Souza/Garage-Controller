import express from 'express'
import cors from 'cors'
import routesClientes from './routes/clientes'

const app = express()
const port = 3000

app.use(express.json())
app.use(cors())

app.use("/clientes", routesClientes)

app.get('/', (req, res) => {
  res.send('Api: Garage Controller — Cadastro de Sinistros')
})

app.listen(port, () => {
  console.log(`Servidor rodando na porta: ${port}`)
})

