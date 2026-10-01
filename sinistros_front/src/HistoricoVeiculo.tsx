import { apiFetch } from "./api";
import { Fragment, useState, type FormEvent } from "react";
import { toast } from "sonner";

type StatusSinistro =
  | "INICIAL"
  | "AGUARDANDO_AUTORIZACAO"
  | "AUTORIZADO_COMPRA_PECAS"
  | "EM_SERVICO"
  | "FINALIZADO"
  | "ENTREGUE";

type MomentoFoto = "INICIAL" | "ACOMPANHAMENTO" | "FINAL";

const FASES_ORDEM: StatusSinistro[] = [
  "INICIAL",
  "AGUARDANDO_AUTORIZACAO",
  "AUTORIZADO_COMPRA_PECAS",
  "EM_SERVICO",
  "FINALIZADO",
  "ENTREGUE",
];

const STATUS_LABEL: Record<StatusSinistro, string> = {
  INICIAL: "Inicial",
  AGUARDANDO_AUTORIZACAO: "Aguardando Autorização",
  AUTORIZADO_COMPRA_PECAS: "Autorizado - Compra de Peças",
  EM_SERVICO: "Em Serviço",
  FINALIZADO: "Finalizado",
  ENTREGUE: "Entregue",
};

const STATUS_COR: Record<StatusSinistro, string> = {
  INICIAL: "bg-gray-200 text-gray-800",
  AGUARDANDO_AUTORIZACAO: "bg-amber-100 text-amber-800",
  AUTORIZADO_COMPRA_PECAS: "bg-sky-100 text-sky-800",
  EM_SERVICO: "bg-indigo-100 text-indigo-800",
  FINALIZADO: "bg-green-100 text-green-800",
  ENTREGUE: "bg-emerald-200 text-emerald-900",
};

const SINISTRO_ENCERRADO: StatusSinistro[] = ["FINALIZADO", "ENTREGUE"];

const MOMENTOS: MomentoFoto[] = ["INICIAL", "ACOMPANHAMENTO", "FINAL"];
const MOMENTO_LABEL: Record<MomentoFoto, string> = {
  INICIAL: "Iniciais",
  ACOMPANHAMENTO: "Acompanhamento",
  FINAL: "Finais",
};

interface Cliente {
  id: number;
  nome: string;
  docIdentificacao: string;
  email?: string;
  telefone?: string;
}

interface HistoricoEntry {
  id: number;
  sinistroId: number;
  status: string;
  observacao?: string;
  dataHora: string;
}

interface Foto {
  id: number;
  sinistroId: number;
  orcamentoId?: number;
  momento: MomentoFoto;
  caminhoArquivo: string;
  dataCaptura: string;
}

interface ItemOrcamento {
  id: number;
  orcamentoId: number;
  codigoPeca: string;
  descricao: string;
  valor: number;
  dataPedido?: string;
  dataFaturamento?: string;
  dataPrevistaChegada?: string;
  dataChegadaReal?: string;
  iaLocaisCompra?: { nome: string; faixaPreco: string; observacao: string; link?: string }[];
  iaFaixaPreco?: string;
  iaDica?: string;
  iaConsultadoEm?: string;
}

interface Orcamento {
  id: number;
  sinistroId: number;
  versao?: number;
  tipo: "INICIAL" | "COMPLEMENTAR";
  valorTotal: number;
  status: string;
  dataCriacao: string;
  itens: ItemOrcamento[];
}

interface Sinistro {
  id: number;
  veiculoId: number;
  tipoAtendimento: "PARTICULAR" | "SEGURO";
  ciaSeguroId?: number;
  corretoraId?: number;
  numApolice?: string;
  kmAtendimento: number;
  statusAtual: StatusSinistro;
  dataAbertura: string;
  ciaSeguro?: { nome: string };
  corretora?: { nome: string };
  historico: HistoricoEntry[];
  foto: Foto[];
  orcamento: Orcamento[];
}

interface Veiculo {
  id: number;
  placa: string;
  marca: string;
  modelo?: string;
  ano: number;
  clienteId: number;
  cliente: Cliente;
  sinistros: Sinistro[];
}

function formataData(valor?: string) {
  if (!valor) return "—";
  return new Date(valor).toLocaleDateString("pt-BR");
}

function formataDataHora(valor?: string) {
  if (!valor) return "—";
  return new Date(valor).toLocaleString("pt-BR");
}

function formataPlaca(valor: string) {
  return valor
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 7);
}

function AbaFotos({ sinistroId, fotos, onAtualizar }: { sinistroId: number; fotos: Foto[]; onAtualizar: () => void }) {
  const [aba, setAba] = useState<MomentoFoto>("INICIAL");
  const [caminho, setCaminho] = useState("");
  const [enviando, setEnviando] = useState(false);

  const fotosDaAba = fotos.filter((f) => f.momento === aba);

  async function enviarFoto(e: FormEvent) {
    e.preventDefault();
    if (!caminho.trim()) return;
    setEnviando(true);
    try {
      const response = await apiFetch(`/foto`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sinistroId, momento: aba, caminhoArquivo: caminho.trim() }),
      });
      if (response.status === 201) {
        toast.success("Foto adicionada!");
        setCaminho("");
        onAtualizar();
      } else {
        toast.error("Erro ao adicionar foto");
      }
    } catch (e) {
      console.error(e);
      toast.error("Erro ao adicionar foto");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div>
      <div className="flex gap-2 border-b mb-3">
        {MOMENTOS.map((m) => (
          <button
            key={m}
            onClick={() => setAba(m)}
            className={`px-3 py-1.5 text-sm font-medium border-b-2 -mb-px ${
              aba === m ? "border-blue-600 text-blue-700" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {MOMENTO_LABEL[m]} ({fotos.filter((f) => f.momento === m).length})
          </button>
        ))}
      </div>

      {fotosDaAba.length === 0 ? (
        <p className="text-sm text-gray-500 mb-3">Nenhuma foto nesta fase.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
          {fotosDaAba.map((f) => (
            <a
              key={f.id}
              href={f.caminhoArquivo}
              target="_blank"
              rel="noreferrer"
              className="block border rounded overflow-hidden bg-gray-50 hover:opacity-80"
              title={f.caminhoArquivo}
            >
              <img
                src={f.caminhoArquivo}
                alt={`Foto ${MOMENTO_LABEL[f.momento]}`}
                className="w-full h-24 object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
              <span className="block text-[10px] text-gray-500 px-1 py-0.5 truncate">
                {formataData(f.dataCaptura)}
              </span>
            </a>
          ))}
        </div>
      )}

      <form onSubmit={enviarFoto} className="flex gap-2">
        <input
          value={caminho}
          onChange={(e) => setCaminho(e.target.value)}
          placeholder={`URL/caminho da foto (${MOMENTO_LABEL[aba]})`}
          className="border rounded px-3 py-1.5 text-sm flex-1"
        />
        <button
          type="submit"
          disabled={enviando}
          className="bg-blue-600 text-white text-sm rounded px-3 py-1.5 hover:bg-blue-700 disabled:opacity-50"
        >
          Adicionar Foto
        </button>
      </form>
    </div>
  );
}

function TabelaPecas({ orcamentos }: { orcamentos: Orcamento[] }) {
  const itensBase = orcamentos.flatMap((o) => o.itens.map((it) => ({ ...it, tipoOrcamento: o.tipo })));
  // Sobrepõe os dados de IA vindos de uma reconsulta feita nesta sessão,
  // sem precisar refazer a busca inteira do histórico do veículo.
  const [iaExtra, setIaExtra] = useState<Record<number, Pick<ItemOrcamento, "iaLocaisCompra" | "iaFaixaPreco" | "iaDica" | "iaConsultadoEm">>>({});
  const [consultando, setConsultando] = useState<number | null>(null);
  const [aberto, setAberto] = useState<number | null>(null);

  const itens = itensBase.map((it) => ({ ...it, ...iaExtra[it.id] }));

  if (itens.length === 0) {
    return <p className="text-sm text-gray-500">Nenhuma peça lançada ainda.</p>;
  }

  async function consultarIA(itemId: number) {
    setConsultando(itemId);
    try {
      const response = await apiFetch(`/item-orcamento/${itemId}/consultar-ia`, {
        method: "POST",
      });
      if (response.ok) {
        const atualizado = await response.json();
        setIaExtra((prev) => ({
          ...prev,
          [itemId]: {
            iaLocaisCompra: atualizado.iaLocaisCompra,
            iaFaixaPreco: atualizado.iaFaixaPreco,
            iaDica: atualizado.iaDica,
            iaConsultadoEm: atualizado.iaConsultadoEm,
          },
        }));
        setAberto(itemId);
        toast.success("Consulta de mercado atualizada!");
      } else {
        const corpo = await response.json().catch(() => null);
        console.error("Erro ao consultar IA:", response.status, corpo);
        toast.error(
          corpo?.detalhe
            ? `Erro ao consultar o mercado via IA: ${corpo.detalhe}`
            : "Erro ao consultar o mercado via IA",
        );
      }
    } catch (e) {
      console.error(e);
      toast.error("Erro ao consultar o mercado via IA. Verifique se o backend está rodando.");
    } finally {
      setConsultando(null);
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-100 text-left text-gray-600">
            <th className="px-2 py-1.5 border-b">Código da Peça</th>
            <th className="px-2 py-1.5 border-b">Nome/Descrição</th>
            <th className="px-2 py-1.5 border-b">Data do Pedido</th>
            <th className="px-2 py-1.5 border-b">Data de Faturamento</th>
            <th className="px-2 py-1.5 border-b">Previsão de Chegada</th>
            <th className="px-2 py-1.5 border-b">Data de Chegada Real / Status</th>
            <th className="px-2 py-1.5 border-b">Consulta de Mercado (IA)</th>
          </tr>
        </thead>
        <tbody>
          {itens.map((item) => (
            <Fragment key={item.id}>
              <tr className="border-b last:border-0">
                <td className="px-2 py-1.5 font-mono">{item.codigoPeca}</td>
                <td className="px-2 py-1.5">
                  {item.descricao}
                  {item.tipoOrcamento === "COMPLEMENTAR" && (
                    <span className="ml-1 text-[10px] uppercase tracking-wide bg-purple-100 text-purple-700 rounded px-1 py-0.5">
                      Complementar
                    </span>
                  )}
                </td>
                <td className="px-2 py-1.5">{formataData(item.dataPedido)}</td>
                <td className="px-2 py-1.5">{formataData(item.dataFaturamento)}</td>
                <td className="px-2 py-1.5">{formataData(item.dataPrevistaChegada)}</td>
                <td className="px-2 py-1.5">
                  {item.dataChegadaReal ? (
                    formataData(item.dataChegadaReal)
                  ) : (
                    <span className="text-amber-700 bg-amber-50 rounded px-1.5 py-0.5 text-xs">
                      Aguardando chegada
                    </span>
                  )}
                </td>
                <td className="px-2 py-1.5">
                  {item.iaConsultadoEm ? (
                    <button
                      onClick={() => setAberto(aberto === item.id ? null : item.id)}
                      className="text-xs text-sky-700 border border-sky-300 rounded px-2 py-1 hover:bg-sky-50"
                    >
                      {aberto === item.id ? "Ocultar IA" : "Ver consulta IA"}
                    </button>
                  ) : (
                    <button
                      onClick={() => consultarIA(item.id)}
                      disabled={consultando === item.id}
                      className="text-xs text-white bg-sky-600 rounded px-2 py-1 hover:bg-sky-700 disabled:opacity-50"
                    >
                      {consultando === item.id ? "Consultando..." : "Consultar Mercado via IA"}
                    </button>
                  )}
                </td>
              </tr>
              {aberto === item.id && item.iaConsultadoEm && (
                <tr className="border-b last:border-0 bg-sky-50">
                  <td colSpan={7} className="px-3 py-3">
                    <div className="flex flex-col gap-1 text-sm">
                      <div>
                        <strong className="text-sky-900">Locais recomendados:</strong>
                        {item.iaLocaisCompra && item.iaLocaisCompra.length > 0 ? (
                          <ul className="mt-1 flex flex-col gap-1.5">
                            {item.iaLocaisCompra.map((local, idx) => {
                              const temLink = !!local.link && /^https?:\/\//.test(local.link);
                              const conteudo = (
                                <>
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="font-medium text-sky-900">
                                      {local.nome}
                                      {temLink && <span className="ml-1 text-sky-500">↗</span>}
                                    </span>
                                    <span className="text-xs font-semibold text-emerald-700 whitespace-nowrap">
                                      {local.faixaPreco || "—"}
                                    </span>
                                  </div>
                                  {local.observacao && (
                                    <span className="block text-gray-500 text-xs mt-0.5">{local.observacao}</span>
                                  )}
                                </>
                              );
                              return temLink ? (
                                <li key={idx}>
                                  <a
                                    href={local.link}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="block bg-white border border-sky-200 rounded px-2 py-1.5 hover:border-sky-400 hover:bg-sky-50 transition-colors"
                                  >
                                    {conteudo}
                                  </a>
                                </li>
                              ) : (
                                <li key={idx} className="bg-white border border-sky-100 rounded px-2 py-1.5">
                                  {conteudo}
                                </li>
                              );
                            })}
                          </ul>
                        ) : (
                          " —"
                        )}
                      </div>
                      <p>
                        <strong className="text-sky-900">Faixa de preço estimada (geral):</strong>{" "}
                        {item.iaFaixaPreco || "—"}
                      </p>
                      <p>
                        <strong className="text-sky-900">Dica técnica:</strong> {item.iaDica || "—"}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-sky-700">
                          Consultado em: {formataDataHora(item.iaConsultadoEm)}
                        </span>
                        <button
                          onClick={() => consultarIA(item.id)}
                          disabled={consultando === item.id}
                          className="text-xs text-sky-700 underline disabled:opacity-50"
                        >
                          {consultando === item.id ? "Consultando..." : "Atualizar consulta"}
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OrcamentoComplementar({ sinistro, onCriado }: { sinistro: Sinistro; onCriado: () => void }) {
  const [aberto, setAberto] = useState(false);
  const [codigoPeca, setCodigoPeca] = useState("");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [enviando, setEnviando] = useState(false);

  const encerrado = SINISTRO_ENCERRADO.includes(sinistro.statusAtual);

  async function salvar(e: FormEvent) {
    e.preventDefault();
    if (!codigoPeca.trim() || !descricao.trim() || !valor) return;
    setEnviando(true);
    try {
      const proximaVersao =
        Math.max(0, ...sinistro.orcamento.map((o) => o.versao ?? 0)) + 1;

      const respOrcamento = await apiFetch(`/orcamento`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sinistroId: sinistro.id,
          versao: proximaVersao,
          tipo: "COMPLEMENTAR",
          valorTotal: Number(valor),
          status: "Pendente",
        }),
      });

      if (respOrcamento.status !== 201) {
        toast.error("Erro ao criar orçamento complementar");
        return;
      }
      const orcamento = await respOrcamento.json();

      const respItem = await apiFetch(`/item-orcamento`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orcamentoId: orcamento.id,
          codigoPeca: codigoPeca.trim(),
          descricao: descricao.trim(),
          valor: Number(valor),
        }),
      });

      if (respItem.status !== 201) {
        toast.error("Orçamento criado, mas houve erro ao adicionar a peça");
        return;
      }

      toast.success("Orçamento complementar adicionado!");
      setCodigoPeca("");
      setDescricao("");
      setValor("");
      setAberto(false);
      onCriado();
    } finally {
      setEnviando(false);
    }
  }

  if (encerrado) {
    return (
      <p className="text-xs text-gray-500 mt-2">
        Sinistro encerrado — não é possível adicionar orçamento complementar.
      </p>
    );
  }

  if (!aberto) {
    return (
      <button
        onClick={() => setAberto(true)}
        className="mt-2 text-sm text-blue-700 border border-blue-300 rounded px-3 py-1.5 hover:bg-blue-50"
      >
        + Adicionar Orçamento Complementar
      </button>
    );
  }

  return (
    <form onSubmit={salvar} className="mt-2 bg-purple-50 border border-purple-200 rounded p-3 flex flex-col gap-2">
      <p className="text-xs font-medium text-purple-800">Nova peça complementar</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <input
          value={codigoPeca}
          onChange={(e) => setCodigoPeca(e.target.value)}
          placeholder="Código da peça"
          className="border rounded px-2 py-1.5 text-sm"
        />
        <input
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="Descrição"
          className="border rounded px-2 py-1.5 text-sm"
        />
        <input
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          type="number"
          step="0.01"
          placeholder="Valor (R$)"
          className="border rounded px-2 py-1.5 text-sm"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={enviando}
          className="bg-purple-600 text-white text-sm rounded px-3 py-1.5 hover:bg-purple-700 disabled:opacity-50"
        >
          Salvar
        </button>
        <button
          type="button"
          onClick={() => setAberto(false)}
          className="text-sm text-gray-600 px-3 py-1.5 hover:underline"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

function AvancarStatus({ sinistro, onAtualizar }: { sinistro: Sinistro; onAtualizar: () => void }) {
  const faseAtualIdx = FASES_ORDEM.indexOf(sinistro.statusAtual);
  const encerrado = sinistro.statusAtual === "ENTREGUE";
  const proximaFase = faseAtualIdx < FASES_ORDEM.length - 1 ? FASES_ORDEM[faseAtualIdx + 1] : sinistro.statusAtual;

  const [aberto, setAberto] = useState(false);
  const [novoStatus, setNovoStatus] = useState<StatusSinistro>(proximaFase);
  const [observacao, setObservacao] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function salvar(e: FormEvent) {
    e.preventDefault();
    setEnviando(true);
    try {
      const respSinistro = await apiFetch(`/sinistro/${sinistro.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          veiculoId: sinistro.veiculoId,
          tipoAtendimento: sinistro.tipoAtendimento,
          ciaSeguroId: sinistro.ciaSeguroId,
          corretoraId: sinistro.corretoraId,
          numApolice: sinistro.numApolice,
          kmAtendimento: sinistro.kmAtendimento,
          statusAtual: novoStatus,
        }),
      });

      if (respSinistro.status !== 200) {
        const erro = await respSinistro.json().catch(() => null);
        toast.error(erro?.erro ? String(erro.erro) : "Erro ao atualizar status do sinistro");
        return;
      }

      const respHistorico = await apiFetch(`/historico-sinistro`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sinistroId: sinistro.id,
          status: STATUS_LABEL[novoStatus],
          observacao: observacao.trim() || undefined,
        }),
      });

      if (respHistorico.status !== 201) {
        toast.error("Status atualizado, mas houve erro ao registrar no histórico");
      } else {
        toast.success("Status do sinistro atualizado!");
      }

      setObservacao("");
      setAberto(false);
      onAtualizar();
    } finally {
      setEnviando(false);
    }
  }

  if (encerrado) {
    return <p className="text-xs text-gray-500 mt-2">Sinistro entregue — ciclo encerrado.</p>;
  }

  if (!aberto) {
    return (
      <button
        onClick={() => setAberto(true)}
        className="mt-2 text-sm text-blue-700 border border-blue-300 rounded px-3 py-1.5 hover:bg-blue-50"
      >
        Avançar status
      </button>
    );
  }

  return (
    <form onSubmit={salvar} className="mt-2 bg-blue-50 border border-blue-200 rounded p-3 flex flex-col gap-2">
      <p className="text-xs font-medium text-blue-800">Atualizar status do sinistro</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <select
          value={novoStatus}
          onChange={(e) => setNovoStatus(e.target.value as StatusSinistro)}
          className="border rounded px-2 py-1.5 text-sm"
        >
          {FASES_ORDEM.map((fase) => (
            <option key={fase} value={fase}>
              {STATUS_LABEL[fase]}
            </option>
          ))}
        </select>
        <input
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
          placeholder="Observação (opcional)"
          className="border rounded px-2 py-1.5 text-sm"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={enviando}
          className="bg-blue-600 text-white text-sm rounded px-3 py-1.5 hover:bg-blue-700 disabled:opacity-50"
        >
          Confirmar
        </button>
        <button
          type="button"
          onClick={() => setAberto(false)}
          className="text-sm text-gray-600 px-3 py-1.5 hover:underline"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

function CardSinistro({ sinistro, numero, onAtualizar }: { sinistro: Sinistro; numero: number; onAtualizar: () => void }) {
  const faseAtualIdx = FASES_ORDEM.indexOf(sinistro.statusAtual);

  return (
    <div className="bg-white shadow rounded p-4 flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-semibold">Sinistro #{numero}</h3>
        <span className={`text-xs font-semibold rounded-full px-3 py-1 ${STATUS_COR[sinistro.statusAtual]}`}>
          {STATUS_LABEL[sinistro.statusAtual]}
        </span>
      </div>

      <div className="text-sm text-gray-600 grid grid-cols-2 sm:grid-cols-4 gap-2">
        <span><strong className="text-gray-800">Abertura:</strong> {formataData(sinistro.dataAbertura)}</span>
        <span><strong className="text-gray-800">Atendimento:</strong> {sinistro.tipoAtendimento === "SEGURO" ? "Seguro" : "Particular"}</span>
        <span><strong className="text-gray-800">Km:</strong> {sinistro.kmAtendimento}</span>
        {sinistro.tipoAtendimento === "SEGURO" && (
          <span><strong className="text-gray-800">Apólice:</strong> {sinistro.numApolice ?? "—"}</span>
        )}
        {sinistro.ciaSeguro && (
          <span><strong className="text-gray-800">Cia:</strong> {sinistro.ciaSeguro.nome}</span>
        )}
        {sinistro.corretora && (
          <span><strong className="text-gray-800">Corretora:</strong> {sinistro.corretora.nome}</span>
        )}
      </div>

      {/* Linha do tempo de fases */}
      <div>
        <p className="text-sm font-medium mb-2">Fases percorridas</p>
        <div className="flex flex-wrap gap-2">
          {FASES_ORDEM.map((fase, idx) => (
            <span
              key={fase}
              className={`text-xs rounded-full px-2.5 py-1 border ${
                idx <= faseAtualIdx
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-400 border-gray-200"
              }`}
            >
              {STATUS_LABEL[fase]}
            </span>
          ))}
        </div>
        <AvancarStatus sinistro={sinistro} onAtualizar={onAtualizar} />
      </div>

      {sinistro.historico.length > 0 && (
        <div>
          <p className="text-sm font-medium mb-2">Histórico de andamento</p>
          <ul className="text-sm text-gray-600 flex flex-col gap-1 border-l-2 border-gray-200 pl-3">
            {sinistro.historico.map((h) => (
              <li key={h.id}>
                <span className="text-gray-800 font-medium">{h.status}</span>{" "}
                <span className="text-gray-400">— {formataDataHora(h.dataHora)}</span>
                {h.observacao && <span className="block text-gray-500">{h.observacao}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <p className="text-sm font-medium mb-2">Fotos</p>
        <AbaFotos sinistroId={sinistro.id} fotos={sinistro.foto} onAtualizar={onAtualizar} />
      </div>

      <div>
        <p className="text-sm font-medium mb-2">Peças</p>
        <TabelaPecas orcamentos={sinistro.orcamento} />
        <OrcamentoComplementar sinistro={sinistro} onCriado={onAtualizar} />
      </div>
    </div>
  );
}

function HistoricoVeiculo() {
  const [placa, setPlaca] = useState("");
  const [veiculo, setVeiculo] = useState<Veiculo | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [buscou, setBuscou] = useState(false);

  async function buscar(placaBusca?: string) {
    const alvo = (placaBusca ?? placa).trim();
    if (alvo.length < 7) {
      toast.error("Informe uma placa válida");
      return;
    }
    setCarregando(true);
    setErro(null);
    setBuscou(true);
    try {
      const response = await apiFetch(`/veiculos/historico/${alvo}`);
      if (response.status === 404) {
        setVeiculo(null);
        setErro("Nenhum veículo encontrado para essa placa.");
        return;
      }
      if (!response.ok) {
        setVeiculo(null);
        const corpo = await response.json().catch(() => null);
        console.error("Erro ao buscar histórico do veículo:", response.status, corpo);
        setErro(
          corpo?.detalhe
            ? `Erro ao buscar o histórico do veículo: ${corpo.detalhe}`
            : "Erro ao buscar o histórico do veículo.",
        );
        return;
      }
      const dados = await response.json();
      setVeiculo(dados);
    } catch (e) {
      console.error(e);
      setErro("Erro ao buscar o histórico do veículo. Verifique se o backend está rodando.");
    } finally {
      setCarregando(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    buscar();
  }

  return (
    <div className="p-6 flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Histórico por Placa</h1>
        <p className="text-sm text-gray-500">
          Consulte o histórico completo de um veículo: cliente, sinistros, status, orçamentos, fotos e peças.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 max-w-md">
        <input
          value={placa}
          onChange={(e) => setPlaca(formataPlaca(e.target.value))}
          placeholder="ABC1234 ou ABC1D34"
          className="border rounded px-3 py-2 flex-1 font-mono uppercase tracking-wide"
          maxLength={7}
        />
        <button
          type="submit"
          disabled={carregando}
          className="bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700 disabled:opacity-50"
        >
          {carregando ? "Buscando..." : "Buscar"}
        </button>
      </form>

      {erro && buscou && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded px-4 py-3 max-w-md">
          {erro}
        </div>
      )}

      {veiculo && (
        <div className="flex flex-col gap-6">
          <div className="bg-white shadow rounded p-4">
            <h2 className="text-lg font-semibold mb-2">
              {veiculo.placa} — {veiculo.marca} {veiculo.modelo ?? ""} ({veiculo.ano})
            </h2>
            <div className="text-sm text-gray-600 grid grid-cols-1 sm:grid-cols-2 gap-1">
              <span><strong className="text-gray-800">Cliente:</strong> {veiculo.cliente.nome}</span>
              <span><strong className="text-gray-800">Documento:</strong> {veiculo.cliente.docIdentificacao}</span>
              {veiculo.cliente.telefone && (
                <span><strong className="text-gray-800">Telefone:</strong> {veiculo.cliente.telefone}</span>
              )}
              {veiculo.cliente.email && (
                <span><strong className="text-gray-800">Email:</strong> {veiculo.cliente.email}</span>
              )}
            </div>
          </div>

          {veiculo.sinistros.length === 0 ? (
            <p className="text-sm text-gray-500">Este veículo ainda não possui sinistros registrados.</p>
          ) : (
            veiculo.sinistros.map((s, idx) => (
              <CardSinistro key={s.id} sinistro={s} numero={idx + 1} onAtualizar={() => buscar(veiculo.placa)} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default HistoricoVeiculo;
