import { prisma } from "../../lib/prisma"
import { Router } from 'express'
import { z } from 'zod'
import bcrypt from 'bcrypt'

const router = Router()

const usuarioSchema = z.object({
  nome: z.string().min(3, { message: "Nome deve possuir, no mínimo, 3 caracteres" }),
  email: z.email({ message: "Email inválido" }),
  senha: z.string(),
  role: z.enum(["ADMIN", "GERENTE", "FUNCIONARIO"]).default("FUNCIONARIO"),
})

// Na edição a senha é opcional: string vazia/ausente = mantém a senha atual.
const usuarioUpdateSchema = z.object({
  nome: z.string().min(3, { message: "Nome deve possuir, no mínimo, 3 caracteres" }),
  email: z.email({ message: "Email inválido" }),
  senha: z.string().optional(),
  role: z.enum(["ADMIN", "GERENTE", "FUNCIONARIO"]),
})

function validaSenha(senha: string) {
  const mensa: string[] = []

  if (senha.length < 8) {
    mensa.push("A senha deve possuir, no mínimo, 8 caracteres")
  }

  let pequenas = 0
  let grandes = 0
  let numeros = 0
  let simbolos = 0

  for (const letra of senha) {
    if (/[a-z]/.test(letra)) {
      pequenas++
    } else if (/[A-Z]/.test(letra)) {
      grandes++
    } else if (/[0-9]/.test(letra)) {
      numeros++
    } else {
      simbolos++
    }
  }

  if (pequenas == 0) mensa.push("A senha deve possuir letra(s) minúscula(s)")
  if (grandes == 0) mensa.push("A senha deve possuir letra(s) maiúscula(s)")
  if (numeros == 0) mensa.push("A senha deve possuir número(s)")
  if (simbolos == 0) mensa.push("A senha deve possuir símbolo(s)")

  return mensa
}

router.get("/", async (req, res) => {
  /*
  #swagger.tags = ["Usuários"];
  #swagger.summary = "Lista todos os usuários";
  */
  try {
    const usuarios = await prisma.usuario.findMany({
      select: { id: true, nome: true, email: true, role: true },
      orderBy: { nome: "asc" },
    })
    res.status(200).json(usuarios)
  } catch (error) {
    res.status(500).json({ erro: error })
  }
})

router.post("/", async (req, res) => {
  /*
  #swagger.tags = ["Usuários"];
  #swagger.summary = "Cadastra um usuário";
  #swagger.description = "Cadastra um novo usuário. A senha deve ter no mínimo 8 caracteres, com letra maiúscula, minúscula, número e símbolo.";
  #swagger.parameters['body'] = {
    in: 'body',
    required: true,
    schema: {
      nome: 'Elinton Souza',
      email: 'elinton@email.com',
      senha: 'Senha@123'
    }
  };
  #swagger.responses[201] = {
    description: "Usuário cadastrado com sucesso."
  };
  #swagger.responses[400] = {
    description: "Dados inválidos ou e-mail já cadastrado."
  };
  */
  const valida = usuarioSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }

  const { nome, email, senha, role } = valida.data

  const jaExiste = await prisma.usuario.findUnique({ where: { email } })
  if (jaExiste) {
    res.status(400).json({ erro: "E-mail já cadastrado" })
    return
  }

  const errosSenha = validaSenha(senha)
  if (errosSenha.length > 0) {
    res.status(400).json({ erro: errosSenha.join("; ") })
    return
  }

  const salt = bcrypt.genSaltSync(12)
  const hash = bcrypt.hashSync(senha, salt)

  try {
    const usuario = await prisma.usuario.create({
      data: { nome, email, senha: hash, role },
      select: { id: true, nome: true, email: true, role: true }
    })
    res.status(201).json(usuario)
  } catch (error) {
    console.error(error)
    res.status(400).json({ error })
  }
})

router.put("/:id", async (req, res) => {
  /*
  #swagger.tags = ["Usuários"];
  #swagger.summary = "Atualiza um usuário";
  #swagger.description = "Atualiza os dados de um usuário existente.";
  #swagger.parameters['id'] = {
    in: 'path',
    required: true,
    description: 'ID do usuário a ser atualizado',
    schema: { type: 'integer' }
  };
  #swagger.parameters['body'] = {
    in: 'body',
    required: true,
    schema: {
      nome: 'Elinton Souza',
      email: 'elinton@email.com',
      senha: 'Senha@123 (opcional — deixe de fora para manter a senha atual)'
    }
  };
  #swagger.responses[200] = {
    description: "Usuário atualizado com sucesso."
  };
  #swagger.responses[400] = {
    description: "Dados inválidos."
  };
  */
  const { id } = req.params

  const valida = usuarioUpdateSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }

  const { nome, email, senha, role } = valida.data

  // Impede que o próprio admin remova seu acesso de administrador por engano
  // (ficaria sem ninguém com permissão para reverter a mudança).
  if (req.usuarioLogado?.usuarioLogadoId === Number(id) && role !== "ADMIN") {
    res.status(400).json({ erro: "Você não pode remover seu próprio acesso de administrador." })
    return
  }

  const emailEmUso = await prisma.usuario.findFirst({
    where: { email, NOT: { id: Number(id) } },
  })
  if (emailEmUso) {
    res.status(400).json({ erro: "E-mail já cadastrado para outro usuário." })
    return
  }

  const data: { nome: string; email: string; role: "ADMIN" | "GERENTE" | "FUNCIONARIO"; senha?: string } = {
    nome,
    email,
    role,
  }

  if (senha && senha.trim() !== "") {
    const errosSenha = validaSenha(senha)
    if (errosSenha.length > 0) {
      res.status(400).json({ erro: errosSenha.join("; ") })
      return
    }
    const salt = bcrypt.genSaltSync(12)
    data.senha = bcrypt.hashSync(senha, salt)
  }

  try {
    const usuario = await prisma.usuario.update({
      where: { id: Number(id) },
      data,
      select: { id: true, nome: true, email: true, role: true }
    })
    res.status(200).json(usuario)
  } catch (error) {
    console.error(error)
    res.status(400).json({ error })
  }
})

router.delete("/:id", async (req, res) => {
  /*
  #swagger.tags = ["Usuários"];
  #swagger.summary = "Remove um usuário";
  #swagger.parameters['id'] = {
    in: 'path',
    required: true,
    description: 'ID do usuário a ser removido',
    schema: { type: 'integer' }
  };
  */
  const { id } = req.params

  if (req.usuarioLogado?.usuarioLogadoId === Number(id)) {
    res.status(400).json({ erro: "Você não pode remover seu próprio usuário." })
    return
  }

  try {
    const usuario = await prisma.usuario.delete({
      where: { id: Number(id) },
      select: { id: true, nome: true, email: true, role: true }
    })
    res.status(200).json(usuario)
  } catch (error) {
    res.status(400).json({ erro: error })
  }
})

export default router