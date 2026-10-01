import { Routes, Route } from 'react-router-dom'
import Login from './Login'
import Layout from './Layout'
import Home from './Home'
import Sinistros from './Sinistros'
import Clientes from './Clientes'
import Veiculos from './Veiculos'
import CadCliente from './CadCliente'
import CadVeiculo from './CadVeiculo'
import CadSinistro from './CadSinistro'
import Dashboard from './Dashboard'
import HistoricoVeiculo from './HistoricoVeiculo'
import GerenciarUsuarios from './GerenciarUsuarios'
import CorretorasSeguradoras from './CorretorasSeguradoras'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route element={<Layout />}>
        <Route path="/inicio" element={<Home />} />
        <Route path="/sinistros" element={<Sinistros />} />
        <Route path="/clientes" element={<Clientes />} />
        <Route path="/clientes/novo" element={<CadCliente />} />
        <Route path="/clientes/:id/editar" element={<CadCliente />} />
        <Route path="/veiculos" element={<Veiculos />} />
        <Route path="/veiculos/novo" element={<CadVeiculo />} />
        <Route path="/veiculos/:id/editar" element={<CadVeiculo />} />
        <Route path="/sinistros/novo" element={<CadSinistro />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/historico" element={<HistoricoVeiculo />} />
        <Route path="/usuarios" element={<GerenciarUsuarios />} />
        <Route path="/corretoras" element={<CorretorasSeguradoras />} />
      </Route>
    </Routes>
  )
}

export default App
