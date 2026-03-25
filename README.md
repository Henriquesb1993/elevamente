# Elevamente — Programa Melhora do Operador

Sistema web completo para acompanhamento de operadores com baixo desempenho por meio de mentoria.

## 🚀 Como rodar localmente

```bash
npm install
npm run dev
# Acesse: http://localhost:5173
```

## 🔐 Credenciais

| Usuário | Senha | Perfil |
|---------|-------|--------|
| gestor | eleva@2025 | Gestor Geral — acesso total |
| rh | rh@2025 | RH |
| psicologia | psi@2025 | Psicologia |
| dp | dp@2025 | Departamento Pessoal |
| ambulatorio | amb@2025 | Ambulatório |
| g1 | g1@2025 | Gestor Garagem G1 |
| g2 | g2@2025 | Gestor Garagem G2 |

## 📦 Funcionalidades

- Dashboard com KPIs, gráficos e alertas em tempo real
- Lista de operadores com filtros por garagem e status
- Ficha do operador: timeline, perda financeira, PDF
- Formulário de mentoria em 4 etapas
- Agenda (visão semana/lista/calendário)
- Tratativas Kanban com retorno do setor
- Relatórios gerenciais + Excel 5 abas + PDF
- Parâmetros financeiros (11 campos por função)
- Upload de base Excel com processamento automático
- Busca global (Ctrl+K)
- Toast notifications
- Mobile responsivo

## 🛠️ Tecnologias

- React 18 + Vite
- Recharts (gráficos)
- SheetJS/XLSX (leitura de planilhas)
- jsPDF + AutoTable (exportação PDF)

## 🌐 Deploy (Vercel)

1. Faça push do código no GitHub
2. Acesse vercel.com → New Project
3. Importe o repositório elevamente
4. Framework: Vite (detecta automático)
5. Clique Deploy

## ⚠️ Nota sobre o App.jsx

O arquivo `src/App.jsx` (4.683 linhas, ~296KB) contém todo o sistema.
Faça o download do ZIP completo em Releases ou use o arquivo direto do Claude.

---
Desenvolvido para o Programa Elevamente — Uso interno.