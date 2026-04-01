# Elevamente - Sistema Melhora do Operador

Sistema completo de gestao e acompanhamento de operadores, com mentoria, tratativas, agenda, relatorios e analise financeira.

**Stack:** React + Vite (SPA) - arquivo unico `src/App.jsx`
**Deploy:** GitHub Pages
**Repositorio:** [github.com/Henriquesb1993/elevamente](https://github.com/Henriquesb1993/elevamente)

---

## Como rodar localmente

```bash
cd elevamente
npm install
npm run dev
# Acesse: http://localhost:5173
```

## Deploy

```bash
npm run build
git push origin main
# GitHub Pages serve o dist/ via Actions
```

---

## Telas do Sistema

| Tela | Descricao |
|------|-----------|
| Dashboard | KPIs clicaveis, graficos de eventos, operadores em atencao, agenda do dia, tratativas pendentes |
| Operadores | Lista filtrada por garagem/status/busca, cards com stats |
| Ficha do Operador | Perfil completo: eventos, perda financeira, multas/reclamacoes, mentoria, tratativas, timeline, PDF |
| Mentoria | Registro de sessoes, edicao, exclusao, KPIs filtraveis, exportacao Excel |
| Agenda | Agendamento de mentorias, visao semana/lista/calendario, controle compareceu/faltou |
| Tratativas | Kanban/lista, graficos clicaveis por area, status flow, modal de detalhes |
| Relatorios | Visao geral, ranking sortavel, causas interativas, tratativas por area, evolucao, PDF/Excel |
| Auditoria | Log completo de acoes do sistema |
| Parametros | Valores financeiros por funcao (Motorista, Cobrador, Fiscal, Coordenador) |
| Base de Dados | Upload Excel, persistencia localStorage, so admin pode deletar |

---

## Usuarios de Teste (hardcoded em App.jsx)

| Login | Senha | Perfil | Nome |
|-------|-------|--------|------|
| HENRIQUE123 | HENRIQUE123 | admin | Henrique |
| JUR123@ | JUR123@ | juridico | Juridico |
| RH2026@ | RH2026@ | rh | Equipe de RH |
| MENTOR@2026 | MENTOR@2026 | mentor | Mentor |
| ALVARO123 | ALVARO123 | gestor_gar | Alvaro |
| REGINALDO123@ | REGINALDO123@ | gestor_gar | Reginaldo |
| MARCOSELOI123 | MARCOSELOI123 | gestor_gar | Marcos Eloi |

---

## Armazenamento Atual (localStorage)

| Chave | Conteudo |
|-------|----------|
| `elevamente_v1` | sessions, tratativas, agenda, custos |
| `elevamente_excel_data` | operadores, KPIs, eventos, causas, sheetSummary |
| `elevamente_excel_name` | nome do arquivo Excel |
| `elevamente_excel_size` | tamanho do arquivo |
| `elevamente_theme` | dark ou light |
| `elevamente_audit_v1` | logs de auditoria |

---

## Processamento do Excel

| Aba | Dados extraidos |
|-----|-----------------|
| QUADRO_FUNC | RE, Nome, Funcao, Garagem (coluna "L"), Admissao, coluna ELEVAMENTE (SIM/NAO) |
| PRONTUARIO | Eventos por operador (faltas, multas, suspensoes, atestados, acidentes) |
| LISTA PRESENCA / FORMULARIO | Data mentoria, comprometimento, resultado |
| MULTAS | Autos de infracao detalhados |

---

## Tecnologias

- React 18 + Vite
- Recharts (graficos)
- SheetJS/XLSX (leitura de planilhas)
- jsPDF + AutoTable (exportacao PDF)

---

## Tema

Dois temas: **Apagar a luz** (dark) e **Acender a luz** (light, baseado no Portal Sambaiba).

---

## PENDENTE: Migracao para PostgreSQL

### O que falta o Henrique fornecer:

```
Host:     _______________  (ex: localhost, IP, ou URL do Supabase/Railway)
Porta:    _______________  (padrao: 5432)
Banco:    _______________  (ex: elevamente_db)
Usuario:  _______________  (ex: elevamente_user)
Senha:    _______________
```

### Mapeamento: Tela do Sistema -> Tabela PostgreSQL

#### 1. `usuarios` (Tela: Login)
```sql
CREATE TABLE usuarios (
  id SERIAL PRIMARY KEY,
  login VARCHAR(50) UNIQUE NOT NULL,
  senha VARCHAR(255) NOT NULL,
  nome VARCHAR(100) NOT NULL,
  perfil VARCHAR(20) NOT NULL,
  garagem VARCHAR(10) DEFAULT 'Todas',
  avatar VARCHAR(5),
  acesso TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);
```
**Perfis:** admin, rh, mentor, juridico, gestor_gar

#### 2. `operadores` (Tela: Base de Dados / Excel)
```sql
CREATE TABLE operadores (
  id SERIAL PRIMARY KEY,
  re VARCHAR(10) UNIQUE NOT NULL,
  nome VARCHAR(100),
  funcao VARCHAR(50),
  garagem VARCHAR(10),
  admissao DATE,
  faltas INT DEFAULT 0,
  multas INT DEFAULT 0,
  suspensoes INT DEFAULT 0,
  atestados INT DEFAULT 0,
  acidentes INT DEFAULT 0,
  status VARCHAR(20) DEFAULT 'aguardando',
  resultado VARCHAR(20),
  data_mentoria DATE,
  comprometimento INT,
  multas_valor DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```
**status:** mentoria, aguardando
**resultado:** melhora, piora, andamento

#### 3. `sessoes_mentoria` (Tela: Mentoria)
```sql
CREATE TABLE sessoes_mentoria (
  id SERIAL PRIMARY KEY,
  re VARCHAR(10) NOT NULL,
  nome VARCHAR(100),
  data DATE NOT NULL,
  acompanhante VARCHAR(100),
  tipo_acomp VARCHAR(20),
  comprometimento INT CHECK (comprometimento BETWEEN 1 AND 5),
  causas TEXT[],
  setor VARCHAR(50),
  subsetor VARCHAR(50),
  relato TEXT,
  denuncia BOOLEAN DEFAULT FALSE,
  status VARCHAR(20) DEFAULT 'andamento',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```
**tipo_acomp:** Sozinho, Conjuge, Familiar
**status:** andamento, concluido, pendente

#### 4. `agenda` (Tela: Agenda)
```sql
CREATE TABLE agenda (
  id SERIAL PRIMARY KEY,
  re VARCHAR(10) NOT NULL,
  nome VARCHAR(100),
  data DATE NOT NULL,
  hora TIME NOT NULL,
  tipo VARCHAR(50),
  local VARCHAR(50),
  status VARCHAR(20) DEFAULT 'agendado',
  obs TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```
**tipo:** Mentoria inicial, Retorno da mentoria
**local:** Garagem 1, Garagem 3, Garagem 4
**status:** agendado, realizado, faltou

#### 5. `tratativas` (Tela: Tratativas)
```sql
CREATE TABLE tratativas (
  id SERIAL PRIMARY KEY,
  re VARCHAR(10) NOT NULL,
  nome VARCHAR(100),
  area VARCHAR(50),
  subarea VARCHAR(50),
  descricao TEXT,
  data DATE,
  prazo DATE,
  status VARCHAR(20) DEFAULT 'pendente',
  retorno TEXT,
  session_id INT REFERENCES sessoes_mentoria(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```
**area:** RH, Juridico, Psicologia, Ambulatorio, DP
**status:** pendente, andamento, concluido

#### 6. `auditoria` (Tela: Auditoria)
```sql
CREATE TABLE auditoria (
  id SERIAL PRIMARY KEY,
  usuario VARCHAR(100),
  acao TEXT NOT NULL,
  tipo VARCHAR(50),
  detalhes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```
**tipo:** Criou, Editou, Apagou, Login, Logout

#### 7. `parametros_custos` (Tela: Parametros)
```sql
CREATE TABLE parametros_custos (
  id SERIAL PRIMARY KEY,
  chave VARCHAR(50) UNIQUE NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Valores iniciais:
INSERT INTO parametros_custos (chave, valor) VALUES
  ('valorDiaMOT', 136.08),
  ('valorDiaCOB', 120.00),
  ('valorDiaFISC', 150.00),
  ('valorDiaCOORD', 180.00),
  ('valorVR', 38.28),
  ('percFGTS', 8.00),
  ('perc13', 8.33),
  ('taxaAdmMulta', 50.00);
```

#### 8. `notificacoes` (Tela: Sino de Notificacao)
```sql
CREATE TABLE notificacoes (
  id SERIAL PRIMARY KEY,
  usuario_id INT REFERENCES usuarios(id),
  titulo VARCHAR(200),
  mensagem TEXT,
  lida BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Backend necessario (a criar):

- **Node.js + Express** API REST
- **pg** (node-postgres) para conexao
- Endpoints CRUD para cada tabela
- Autenticacao JWT
- O frontend fara fetch() no lugar de localStorage

### Etapas da migracao:

1. Henrique fornece credenciais do PostgreSQL
2. Criar tabelas com os SQLs acima
3. Criar backend Node.js/Express com API REST
4. Adaptar frontend: trocar localStorage por fetch() para a API
5. Migrar usuarios hardcoded para tabela `usuarios`
6. Testar fluxo completo

---

Desenvolvido para o Programa Elevamente - Sambaiba - Uso interno.
