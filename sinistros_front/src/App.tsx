import { Routes, Route } from 'react-router-dom'
import Login from './Login'
import Layout from './Layout'
import Sinistros from './Sinistros'
import Clientes from './Clientes'
import Veiculos from './Veiculos'
import CadCliente from './CadCliente'
import CadVeiculo from './CadVeiculo'
import CadSinistro from './CadSinistro'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route element={<Layout />}>
        <Route path="/sinistros" element={<Sinistros />} />
        <Route path="/clientes" element={<Clientes />} />
        <Route path="/clientes/novo" element={<CadCliente />} />
        <Route path="/veiculos" element={<Veiculos />} />
        <Route path="/veiculos/novo" element={<CadVeiculo />} />
        <Route path="/sinistros/novo" element={<CadSinistro />} />
      </Route>
    </Routes>
  )
}

export default App