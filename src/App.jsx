import React from "react";

import { useState, useRef, useCallback, useEffect } from "react";

// ─── USERS / PERFIS ───────────────────────────────────────────────────────────
const USERS = [
  { id:1,  login:"HENRIQUE123",    senha:"HENRIQUE123",    nome:"Henrique",             perfil:"admin",      garagem:"Todas", avatar:"HE", acesso:["dashboard","operadores","ficha","mentoria","agenda","tratativas","relatorios","parametros","base","auditoria"] },
  { id:2,  login:"JURIDICO",       senha:"JUR123@",        nome:"Jurídico",             perfil:"juridico",   garagem:"Todas", avatar:"JU", acesso:["operadores","ficha","tratativas","relatorios"] },
  { id:3,  login:"RH",             senha:"RH2026@",        nome:"Equipe de RH",         perfil:"rh",         garagem:"Todas", avatar:"RH", acesso:["operadores","ficha","mentoria","agenda","tratativas","relatorios"] },
  { id:4,  login:"MENTOR",         senha:"MENTOR@2026",    nome:"Mentor",               perfil:"mentor",     garagem:"Todas", avatar:"MT", acesso:["dashboard","operadores","ficha","mentoria","agenda","tratativas"] },
  { id:5,  login:"ALVARO",         senha:"ALVARO123",      nome:"Álvaro",               perfil:"gestor_gar", garagem:"Todas", avatar:"AL", acesso:["dashboard","operadores","ficha","mentoria","agenda","tratativas","relatorios"] },
  { id:6,  login:"REGINALDO",      senha:"REGINALDO123@",  nome:"Reginaldo",            perfil:"gestor_gar", garagem:"Todas", avatar:"RE", acesso:["dashboard","operadores","ficha","mentoria","agenda","tratativas","relatorios"] },
  { id:7,  login:"MARCOS",         senha:"MARCOSELOI123",  nome:"Marcos Elói",          perfil:"gestor_gar", garagem:"Todas", avatar:"ME", acesso:["dashboard","operadores","ficha","mentoria","agenda","tratativas","relatorios"] },
];

const PERFIL_LABELS = {
  admin:      { label:"Administrador",      color:"#00D4FF", bg:"#00D4FF18" },
  juridico:   { label:"Jurídico",           color:"#F59E0B", bg:"#F59E0B18" },
  rh:         { label:"RH",                 color:"#0091FF", bg:"#0091FF18" },
  mentor:     { label:"Mentor",             color:"#10B981", bg:"#10B98118" },
  gestor_gar: { label:"Gestor",             color:"#F97316", bg:"#F9731618" },
};

// ─── AUDIT LOG ────────────────────────────────────────────────────────────────
const AUDIT_KEY = "elevamente_audit_v1";
function addAuditLog(user, acao, tipo, detalhes="") {
  try {
    const logs = JSON.parse(localStorage.getItem(AUDIT_KEY)||"[]");
    logs.unshift({
      id: Date.now(),
      usuario: user?.nome || "Sistema",
      perfil:  user?.perfil || "–",
      acao,
      tipo,      // "Criou" | "Editou" | "Excluiu" | "Acessou" | "Upload"
      detalhes,
      dataHora: new Date().toLocaleString("pt-BR"),
    });
    localStorage.setItem(AUDIT_KEY, JSON.stringify(logs.slice(0,500)));
  } catch(e) { /* silent */ }
}
function getAuditLogs() {
  try { return JSON.parse(localStorage.getItem(AUDIT_KEY)||"[]"); } catch { return []; }
}

// ─── THEME SYSTEM ─────────────────────────────────────────────────────────────
const THEMES = {
  dark: {
    bg:"#0A0F1E", surface:"#111827", card:"#151E2E", border:"#1E2D42",
    accent:"#00D4FF", accent2:"#0091FF", gold:"#F59E0B", green:"#10B981",
    red:"#EF4444", orange:"#F97316", purple:"#8B5CF6", text:"#E2E8F0", muted:"#64748B",
    label:"🌙 Dark",
  },
  normal: {
    bg:"#0F172A", surface:"#1E293B", card:"#1E2D42", border:"#334155",
    accent:"#38BDF8", accent2:"#0EA5E9", gold:"#FBBF24", green:"#34D399",
    red:"#F87171", orange:"#FB923C", purple:"#A78BFA", text:"#F1F5F9", muted:"#94A3B8",
    label:"🌤 Normal",
  },
  light: {
    bg:"#F8FAFC", surface:"#FFFFFF", card:"#FFFFFF", border:"#E2E8F0",
    accent:"#0284C7", accent2:"#0369A1", gold:"#D97706", green:"#059669",
    red:"#DC2626", orange:"#EA580C", purple:"#7C3AED", text:"#0F172A", muted:"#64748B",
    label:"🤍 Light",
  },
};

const STORAGE_KEY = "elevamente_v1";
async function saveState(state) {
  try { await window.storage?.set(STORAGE_KEY, JSON.stringify(state)); } catch(e){ /* silent */ }
}
async function loadState() {
  try {
    const r = await window.storage?.get(STORAGE_KEY);
    return r?.value ? JSON.parse(r.value) : null;
  } catch(e){ return null; }
}

// ─── Load SheetJS dynamically ────────────────────────────────────────────────
let XLSX = null;
function loadXLSX() {
  return new Promise((resolve, reject) => {
    if (XLSX) { resolve(XLSX); return; }
    if (window.XLSX) { XLSX = window.XLSX; resolve(XLSX); return; }
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
    s.onload = () => { XLSX = window.XLSX; resolve(XLSX); };
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

// ─── Load jsPDF dynamically ───────────────────────────────────────────────────
let jsPDFLib = null;
function loadJsPDF() {
  return new Promise((resolve, reject) => {
    if (jsPDFLib) { resolve(jsPDFLib); return; }
    if (window.jspdf?.jsPDF) { jsPDFLib = window.jspdf.jsPDF; resolve(jsPDFLib); return; }
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
    s.onload = () => {
      const s2 = document.createElement("script");
      s2.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js";
      s2.onload = () => { jsPDFLib = window.jspdf?.jsPDF || window.jsPDF; resolve(jsPDFLib); };
      s2.onerror = reject;
      document.head.appendChild(s2);
    };
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, ReferenceLine, LabelList, Legend,
} from "recharts";

// ─── PALETTE (dynamic — updated by theme) ────────────────────────────────────
let _themeName = "dark";
try { _themeName = localStorage.getItem("elevamente_theme") || "dark"; } catch {}
let C = { ...THEMES[_themeName] || THEMES.dark };
const PIE_COLORS = [C.accent, C.accent2, C.purple, C.gold, C.muted];

// ─── EVENT MAP ──────────────────────────────────────────────────────────────
const EV_LABELS = {
  "]":"Recolhida p/ conta", "~":"Orientação gerencial", "4":"Lic. maternidade",
  "8":"Horas abonadas", "E":"Dia não remunerado", "F":"Falta", "G":"Falta justificada",
  "M":"Multa", "N":"Paternidade", "O":"Reclamação", "S":"Suspensão",
  "T":"Atestado", "Z":"Folga extra", "+":"Mentoria",
};
const EV_BAD = ["F","M","S","O"]; // eventos negativos

// ─── HELPERS ────────────────────────────────────────────────────────────────
const normalizeKey = (k) => String(k||"").trim().toUpperCase()
  .normalize("NFD").replace(/[\u0300-\u036f]/g,"");

const findCol = (row, ...candidates) => {
  const nk = normalizeKey;
  for (const c of candidates) {
    const found = Object.keys(row).find(k => nk(k).includes(nk(c)));
    if (found !== undefined) return found;
  }
  return null;
};

const toDateStr = (v) => {
  if (!v) return "";
  if (typeof v === "number") {
    try { return XLSX.SSF.format("dd/mm/yy", v); } catch { return String(v); }
  }
  return String(v).trim();
};

const avatarColor = (re) => {
  const colors = [C.accent,C.accent2,C.purple,C.gold,C.green,C.orange];
  const n = parseInt(String(re).replace(/\D/g,"")) || 0;
  return colors[n % colors.length];
};
const initials = (nome) => String(nome||"?").split(" ").slice(0,2).map(n=>n[0]||"").join("").toUpperCase();
const fmt = (b) => b>1048576?`${(b/1048576).toFixed(1)} MB`:`${Math.round(b/1024)} KB`;

// ─── EXCEL PROCESSOR ────────────────────────────────────────────────────────
function processExcel(workbook) {
  const sheets = workbook.SheetNames;
  const get = (name) => {
    const sn = sheets.find(s => s.toUpperCase().includes(name.toUpperCase()));
    if (!sn) return [];
    return XLSX.utils.sheet_to_json(workbook.Sheets[sn], { defval:"" });
  };

  const prontuario  = get("PRONTUARIO");
  const multas      = get("MULTA");
  const acidentes   = get("ACIDENTE");
  const quadro      = get("QUADRO");
  const presenca    = get("PRESENCA") || get("PRESENÇA") || get("ELEVAMENTE");
  const formulario  = get("FORMULARIO") || get("FORMULÁRIO") || get("MENTORIA");

  // ── Build operator map from QUADRO_FUNC ─────────────────────────────────
  // ── Set of REs marked ELEVAMENTE = SIM ──────────────────────────────────
  // If column doesn't exist in any row, assumes ALL should be included (backwards compat)
  const elevaSet = new Set();
  let hasElevaCol = false;
  quadro.forEach(row => {
    const elCol = findCol(row,"ELEVAMENTE","ELEVA","PROGRAMA");
    if (elCol) hasElevaCol = true;
  });
  if (hasElevaCol) {
    quadro.forEach(row => {
      const reCol = findCol(row,"NOREG","RE","REGISTRO","CHAPA","MATRICULA");
      const elCol = findCol(row,"ELEVAMENTE","ELEVA","PROGRAMA");
      const re    = reCol ? String(row[reCol]).trim() : null;
      const val   = elCol ? String(row[elCol]).trim().toUpperCase() : "";
      if (re && val === "SIM") elevaSet.add(re);
    });
  }

  const opMap = {};
  quadro.forEach(row => {
    const reCol  = findCol(row,"NOREG","RE","REGISTRO","CHAPA","MATRICULA");
    const nmCol  = findCol(row,"NOME","FUNCIONARIO","NAME");
    const fnCol  = findCol(row,"FUNCAO","CARGO","CHAPA");
    const grCol  = findCol(row,"GARAGEM","SETOR","LOCAL");
    const adCol  = findCol(row,"ADMISSAO","ADMISSÃO","DATA ADM","ENTRADA");
    const re = reCol ? String(row[reCol]).trim() : null;
    if (!re) return;
    // Se a coluna ELEVAMENTE existe, só inclui quem tem SIM
    if (hasElevaCol && !elevaSet.has(re)) return;
    opMap[re] = {
      re,
      nome:     nmCol ? String(row[nmCol]).trim() : "–",
      funcao:   fnCol ? String(row[fnCol]).trim() : "–",
      garagem:  grCol ? String(row[grCol]).trim() : "–",
      admissao: adCol ? toDateStr(row[adCol]) : "–",
    };
  });

  // ── If QUADRO empty, build from PRONTUARIO ───────────────────────────────
  if (!Object.keys(opMap).length) {
    prontuario.forEach(row => {
      const reCol = findCol(row,"NOREG","RE","REGISTRO","CHAPA","MATRICULA");
      const nmCol = findCol(row,"NOME","FUNCIONARIO");
      const fnCol = findCol(row,"CHAPA","FUNCAO","CARGO");
      const re = reCol ? String(row[reCol]).trim() : null;
      if (!re || opMap[re]) return;
      opMap[re] = {
        re,
        nome:    nmCol ? String(row[nmCol]).trim() : "–",
        funcao:  fnCol ? String(row[fnCol]).trim() : "–",
        garagem: "–",
        admissao:"–",
      };
    });
  }

  // ── Count events per operator ────────────────────────────────────────────
  const evCount = {}; // re -> { F:0, M:0, S:0, T:0, O:0, ... }
  const evTimeline = {}; // re -> [ {data, ev, historico} ]

  prontuario.forEach(row => {
    const reCol = findCol(row,"NOREG","RE","REGISTRO","CHAPA","MATRICULA");
    const evCol = findCol(row,"EV","EVENTO","COD","CODIGO");
    const dtCol = findCol(row,"DATA","DT","DATE");
    const hiCol = findCol(row,"HISTORICO","HISTÓRICO","DESC","OBS");
    const re = reCol ? String(row[reCol]).trim() : null;
    const ev = evCol ? String(row[evCol]).trim() : null;
    if (!re || !ev) return;
    if (!evCount[re]) evCount[re] = {};
    evCount[re][ev] = (evCount[re][ev]||0)+1;
    if (!evTimeline[re]) evTimeline[re] = [];
    evTimeline[re].push({
      data: dtCol ? toDateStr(row[dtCol]) : "–",
      ev,
      label: EV_LABELS[ev] || ev,
      historico: hiCol ? String(row[hiCol]).trim() : "",
    });
  });

  // ── Multas per operator ──────────────────────────────────────────────────
  const multasCount = {};
  const multasDetMap = {}; // re -> [{data, linha, descricao, enquadramento, valor}]
  multas.forEach(row => {
    const reCol  = findCol(row,"NREG","RE","REGISTRO","N.REG","NOREG","MATRICULA","NO_REG","CHAPA");
    const dtCol  = findCol(row,"DATA","DT","DATE","DATA_INFRACAO","DATAINFRACAO","DATAMULTA");
    const lnCol  = findCol(row,"LINHA","PREFIXO","VEICULO","CARRO","PLACA");
    const dsCol  = findCol(row,"DESCRICAO","DESCRICÃO","DESC","INFRACAO","INFRAÇÃO","HISTORICO","OBS","MOTIVO","TIPO");
    const enCol  = findCol(row,"ENQUADRAMENTO","COD","CODIGO","CODINFRACAO","AIT","AUTO");
    const vlCol  = findCol(row,"VALOR","MULTA","VALORmulta","VALORMULTA","VL_MULTA","VLMULTA");
    const re = reCol ? String(row[reCol]).trim() : null;
    if (!re) return;
    multasCount[re] = (multasCount[re]||0)+1;
    if (!multasDetMap[re]) multasDetMap[re] = [];
    multasDetMap[re].push({
      data:          dtCol ? toDateStr(row[dtCol]) : "–",
      linha:         lnCol ? String(row[lnCol]).trim() : "–",
      descricao:     dsCol ? String(row[dsCol]).trim() : "–",
      enquadramento: enCol ? String(row[enCol]).trim() : "–",
      valor:         vlCol ? (parseFloat(String(row[vlCol]).replace(/[^\d,.]/g,"").replace(",",".")) || 0) : 0,
    });
  });

  // ── Acidentes per operator (only "responsável") ──────────────────────────
  const acidCount = {};
  acidentes.forEach(row => {
    const reCol = findCol(row,"RE","REGISTRO","NOREG","MATRICULA");
    const paCol = findCol(row,"PARECER","RESPONSAVEL","RESULTADO");
    const re = reCol ? String(row[reCol]).trim() : null;
    const pa = paCol ? String(row[paCol]).toLowerCase() : "";
    if (!re) return;
    if (pa.includes("respons")) acidCount[re] = (acidCount[re]||0)+1;
  });

  // ── Mentoria dates from LISTA PRESENÇA ─────────────────────────────────
  const mentoriaDate = {};
  presenca.forEach(row => {
    const reCol = findCol(row,"RE","REGISTRO","NOREG","MATRICULA");
    const dtCol = findCol(row,"DATA","DT","DATE");
    const re = reCol ? String(row[reCol]).trim() : null;
    if (!re || mentoriaDate[re]) return; // first mentoria date
    mentoriaDate[re] = dtCol ? toDateStr(row[dtCol]) : "–";
  });

  // ── Comprometimento / result from FORMULÁRIO ────────────────────────────
  const formData = {};
  formulario.forEach(row => {
    const reCol = findCol(row,"RE","OPERADOR","REGISTRO","MATRICULA");
    const cmCol = findCol(row,"COMPROMETIMENTO","NIVEL","NOTA","SCORE");
    const stCol = findCol(row,"SETOR","ENCAMINH");
    const re = reCol ? String(row[reCol]).trim() : null;
    if (!re) return;
    const comp = cmCol ? Number(row[cmCol]) : null;
    formData[re] = { comprometimento: comp, setor: stCol ? String(row[stCol]).trim() : "–" };
  });

  // ── Build final operator list ────────────────────────────────────────────
  // Se a coluna ELEVAMENTE existe, só considera REs que estão no programa
  // Se não existe, considera todos os REs encontrados nos eventos (comportamento original)
  const allREs = new Set(
    hasElevaCol
      ? [...elevaSet] // só quem tem ELEVAMENTE=SIM
      : [
          ...Object.keys(opMap),
          ...Object.keys(evCount),
          ...Object.keys(multasCount),
          ...Object.keys(acidCount),
        ]
  );

  const operators = [...allREs].map(re => {
    const base   = opMap[re] || { re, nome:"–", funcao:"–", garagem:"–", admissao:"–" };
    const ec     = evCount[re] || {};
    const faltas = (ec["F"]||0);
    const multas2= (ec["M"]||0) + (multasCount[re]||0);
    const susp   = (ec["S"]||0);
    const atест  = (ec["T"]||0);
    const acid   = acidCount[re]||0;
    const hasMen = !!mentoriaDate[re];
    const comp   = formData[re]?.comprometimento || null;

    // Determine resultado based on comprometimento + trend
    let resultado = null;
    if (hasMen) {
      if (comp !== null) {
        resultado = comp >= 4 ? "melhora" : comp <= 2 ? "piora" : "andamento";
      } else {
        resultado = "andamento";
      }
    }

    return {
      ...base,
      faltas, multas: multas2, suspensoes: susp, atestados: atест, acidentes: acid,
      status:         hasMen ? "mentoria" : "aguardando",
      resultado,
      dataMentoria:   mentoriaDate[re] || null,
      comprometimento: comp,
      timeline:       evTimeline[re] || [],
      multasDetalhes: multasDetMap[re] || [],
    };
  }).filter(o => o.re && o.re !== "undefined" && o.re !== "");

  // ── KPIs ────────────────────────────────────────────────────────────────
  const total          = operators.length;
  const emMentoria     = operators.filter(o=>o.status==="mentoria").length;
  const melhoraram     = operators.filter(o=>o.resultado==="melhora").length;
  const pioraram       = operators.filter(o=>o.resultado==="piora").length;
  const aguardando     = operators.filter(o=>o.status==="aguardando").length;
  const taxaMelhora    = emMentoria>0 ? Math.round((melhoraram/emMentoria)*100) : 0;

  // ── Events by month ─────────────────────────────────────────────────────
  const evByMonth = {};
  prontuario.forEach(row => {
    const dtCol = findCol(row,"DATA-MES","DATAMES","DATA","DT");
    const evCol = findCol(row,"EV","EVENTO");
    const dt = dtCol ? String(row[dtCol]).trim() : "";
    const ev = evCol ? String(row[evCol]).trim() : "";
    if (!dt || !ev) return;
    // Normalize date to YYYY-MM regardless of format
    let mes = "";
    if(/^\d{4}-\d{2}/.test(dt)) {
      mes = dt.substring(0,7); // already YYYY-MM
    } else if(/^\d{2}\/\d{2}\/\d{4}/.test(dt)) {
      mes = dt.substring(6,10)+"-"+dt.substring(3,5); // dd/mm/yyyy -> YYYY-MM
    } else if(/^\d{2}\/\d{2}\/\d{2}/.test(dt)) {
      mes = "20"+dt.substring(6,8)+"-"+dt.substring(3,5); // dd/mm/yy -> YYYY-MM
    } else {
      mes = dt.substring(0,7);
    }
    if(!mes||mes.length<7) return;
    if (!evByMonth[mes]) evByMonth[mes] = { mes, faltas:0, multas:0, acidentes:0, mentorias:0 };
    if (ev==="F") evByMonth[mes].faltas++;
    if (ev==="M") evByMonth[mes].multas++;
    if (ev==="+") evByMonth[mes].mentorias++;
  });
  acidentes.forEach(row => {
    const dtCol = findCol(row,"DATA","DT");
    const dt = dtCol ? toDateStr(row[dtCol]).substring(0,7) : "";
    if (!dt) return;
    if (!evByMonth[dt]) evByMonth[dt] = { mes:dt, faltas:0, multas:0, acidentes:0, mentorias:0 };
    evByMonth[dt].acidentes++;
  });
  const eventosMes = Object.values(evByMonth)
    .sort((a,b)=>a.mes.localeCompare(b.mes))
    .slice(-6)
    .map(e=>({ ...e, mes: e.mes.substring(5,7)+"/"+e.mes.substring(2,4) }));

  // ── Causas (from formulário se disponível) ──────────────────────────────
  const causasMap = {};
  formulario.forEach(row => {
    const cCol = findCol(row,"CAUSA","MOTIVO","IDENTIFICAD");
    const c = cCol ? String(row[cCol]).trim() : null;
    if (!c || c==="") return;
    causasMap[c] = (causasMap[c]||0)+1;
  });
  const causas = Object.entries(causasMap)
    .sort((a,b)=>b[1]-a[1]).slice(0,5)
    .map(([name,value])=>({ name, value }));

  // ── Sheet summary ────────────────────────────────────────────────────────
  const sheetSummary = sheets.map(s => ({
    name: s,
    rows: XLSX.utils.sheet_to_json(workbook.Sheets[s]).length,
  }));

  return { operators, kpis:{ total, emMentoria, melhoraram, pioraram, aguardando, taxaMelhora },
           eventosMes, causas, sheetSummary };
}

// ─── STATIC MOCK (used before upload) ───────────────────────────────────────
const MOCK = {
  operators: [
    { re:"RE5319",nome:"Carlos A. Mendes",   funcao:"Motorista", garagem:"G3",admissao:"12/03/18",faltas:8, multas:3,suspensoes:0,atestados:2,acidentes:1,status:"mentoria",resultado:"melhora",  dataMentoria:"10/Jan/25",comprometimento:4,timeline:[] },
    { re:"RE4201",nome:"Marcos P. Lima",     funcao:"Motorista", garagem:"G1",admissao:"15/06/17",faltas:18,multas:7,suspensoes:1,atestados:1,acidentes:2,status:"mentoria",resultado:"piora",    dataMentoria:"22/Jan/25",comprometimento:2,timeline:[] },
    { re:"RE3887",nome:"João S. Oliveira",   funcao:"Motorista", garagem:"G2",admissao:"05/07/19",faltas:6, multas:2,suspensoes:0,atestados:3,acidentes:0,status:"mentoria",resultado:"melhora",  dataMentoria:"05/Fev/25",comprometimento:5,timeline:[] },
    { re:"RE5507",nome:"Paulo B. Rodrigues", funcao:"Motorista", garagem:"G1",admissao:"22/01/20",faltas:9, multas:4,suspensoes:0,atestados:1,acidentes:0,status:"mentoria",resultado:"melhora",  dataMentoria:"18/Fev/25",comprometimento:4,timeline:[] },
    { re:"RE6014",nome:"Rafael T. Santos",   funcao:"Motorista", garagem:"G4",admissao:"02/02/20",faltas:12,multas:5,suspensoes:1,atestados:0,acidentes:1,status:"mentoria",resultado:"piora",    dataMentoria:"12/Fev/25",comprometimento:1,timeline:[] },
    { re:"RE7801",nome:"Felipe A. Nascimento",funcao:"Cobrador",garagem:"G2",admissao:"18/09/21",faltas:14,multas:6,suspensoes:0,atestados:2,acidentes:0,status:"mentoria",resultado:"piora",    dataMentoria:"01/Mar/25",comprometimento:2,timeline:[] },
    { re:"RE3341",nome:"Sandro P. Ferreira", funcao:"Motorista", garagem:"G2",admissao:"27/11/19",faltas:11,multas:3,suspensoes:0,atestados:1,acidentes:0,status:"mentoria",resultado:"andamento",dataMentoria:"15/Mar/25",comprometimento:3,timeline:[] },
    { re:"RE6602",nome:"Odair C. Magalhães", funcao:"Cobrador",  garagem:"G1",admissao:"13/08/20",faltas:9, multas:2,suspensoes:0,atestados:0,acidentes:1,status:"mentoria",resultado:"andamento",dataMentoria:"17/Mar/25",comprometimento:3,timeline:[] },
    { re:"RE1023",nome:"Ezequiel D. Fonseca",funcao:"Motorista", garagem:"G4",admissao:"14/02/22",faltas:10,multas:4,suspensoes:0,atestados:2,acidentes:0,status:"aguardando",resultado:null,dataMentoria:null,comprometimento:null,timeline:[] },
    { re:"RE3388",nome:"Natalino P. Brito",  funcao:"Cobrador",  garagem:"G2",admissao:"30/06/20",faltas:8, multas:2,suspensoes:0,atestados:1,acidentes:1,status:"aguardando",resultado:null,dataMentoria:null,comprometimento:null,timeline:[] },
    { re:"RE5671",nome:"Rosivaldo C. Moura", funcao:"Motorista", garagem:"G3",admissao:"12/08/19",faltas:12,multas:5,suspensoes:1,atestados:0,acidentes:0,status:"aguardando",resultado:null,dataMentoria:null,comprometimento:null,timeline:[] },
    { re:"RE7744",nome:"Gilvan F. Torres",   funcao:"Motorista", garagem:"G1",admissao:"25/01/21",faltas:9, multas:3,suspensoes:0,atestados:2,acidentes:0,status:"aguardando",resultado:null,dataMentoria:null,comprometimento:null,timeline:[] },
  ],
  kpis:{ total:38, emMentoria:24, melhoraram:14, pioraram:4, aguardando:14, taxaMelhora:68 },
  eventosMes:[
    { mes:"Out/24",faltas:18,multas:12,acidentes:2,mentorias:3 },
    { mes:"Nov/24",faltas:22,multas:15,acidentes:1,mentorias:5 },
    { mes:"Dez/24",faltas:14,multas:10,acidentes:3,mentorias:8 },
    { mes:"Jan/25",faltas:19,multas:8, acidentes:1,mentorias:11 },
    { mes:"Fev/25",faltas:11,multas:6, acidentes:0,mentorias:14 },
    { mes:"Mar/25",faltas:8, multas:4, acidentes:1,mentorias:16 },
  ],
  causas:[
    { name:"Problemas familiares",value:34 },{ name:"Saúde / bem-estar",value:28 },
    { name:"Financeiro",value:19 },{ name:"Conflito interno",value:12 },{ name:"Outros",value:7 },
  ],
  sheetSummary:[],
};

// ─── STYLES ──────────────────────────────────────────────────────────────────
const styles = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
body{background:${C.bg};color:${C.text};font-family:'Inter',sans-serif;font-size:16px;line-height:1.5;overflow-x:hidden;font-variant-numeric:tabular-nums;-webkit-font-smoothing:antialiased}
h1,h2,h3{font-family:'Inter',sans-serif;font-weight:700}
h1{font-size:28px}h2{font-size:24px}h3{font-size:20px}
.app{display:flex;min-height:100vh}
.sidebar{width:240px;min-height:100vh;background:${C.surface};border-right:1px solid ${C.border};
  display:flex;flex-direction:column;position:fixed;left:0;top:0;z-index:100;transition:width .3s}
.sidebar.col{width:64px}
.lw{padding:20px 16px;display:flex;align-items:center;gap:10px;border-bottom:1px solid ${C.border}}
.li{width:36px;height:36px;border-radius:10px;flex-shrink:0;
  background:linear-gradient(135deg,${C.accent},${C.accent2});
  display:flex;align-items:center;justify-content:center;
  font-family:'Inter',sans-serif;font-weight:800;font-size:18px;color:#000}
.lt{font-family:'Inter',sans-serif;font-weight:700;font-size:15px;color:${C.text};white-space:nowrap}
.ls{font-size:10px;color:${C.muted}}
.nav{padding:12px 8px;flex:1;display:flex;flex-direction:column;gap:2px}
.ni{display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:10px;cursor:pointer;
  transition:all .2s;color:${C.muted};white-space:nowrap;overflow:hidden;font-size:13.5px;font-weight:500}
.ni:hover{background:${C.border};color:${C.text}}
.ni.on{background:linear-gradient(135deg,${C.accent}18,${C.accent2}18);color:${C.accent};border:1px solid ${C.accent}30}
.ni .ic{font-size:17px;flex-shrink:0;width:20px;text-align:center}
.sidebar.col .nl,.sidebar.col .lt,.sidebar.col .ls,.sidebar.col .ns{display:none}
.ns{padding:10px 20px 4px;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px;color:${C.muted}}
.sft{padding:12px 8px;border-top:1px solid ${C.border}}
.uc{display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:10px;cursor:pointer}
.av{width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,${C.purple},${C.accent2});
  display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;flex-shrink:0}
.main{margin-left:240px;flex:1;padding:28px 32px 60px;transition:margin-left .3s}
.main.col{margin-left:64px}
.topbar{display:flex;align-items:center;justify-content:space-between;margin-bottom:28px;flex-wrap:wrap;gap:12px}
.tbl{display:flex;align-items:center;gap:16px}
.tbr{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.tog{background:${C.card};border:1px solid ${C.border};color:${C.muted};width:36px;height:36px;
  border-radius:8px;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center}
.tog:hover{color:${C.accent}}
.pt{font-family:'Inter',sans-serif;font-size:22px;font-weight:700}
.ps{font-size:13px;color:${C.muted};margin-top:2px}
.dchip{background:${C.card};border:1px solid ${C.border};border-radius:8px;padding:6px 14px;font-size:13px;color:${C.muted};white-space:nowrap}
.bb{position:relative;background:${C.card};border:1px solid ${C.border};color:${C.muted};
  width:36px;height:36px;border-radius:8px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:17px}
.bdg{position:absolute;top:-4px;right:-4px;background:${C.red};color:white;font-size:9px;
  font-weight:700;width:16px;height:16px;border-radius:50%;display:flex;align-items:center;justify-content:center}
.g2{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px}
.gkpi{display:grid;grid-template-columns:repeat(6,1fr);gap:16px;margin-bottom:24px}
.card{background:${C.card};border:1px solid ${C.border};border-radius:16px;padding:20px;position:relative;overflow:hidden}
.card::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,${C.accent}30,transparent)}
.ct{font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:${C.muted};margin-bottom:14px;display:flex;align-items:center;gap:8px}
.ctd{width:6px;height:6px;border-radius:50%;background:${C.accent};flex-shrink:0}
.kc{background:${C.card};border:1px solid ${C.border};border-radius:14px;padding:16px;position:relative;overflow:hidden;cursor:pointer;transition:all .2s}
.kc:hover{border-color:${C.accent}40;transform:translateY(-2px)}
.ki{font-size:22px;margin-bottom:10px}
.kv{font-family:'Inter',sans-serif;font-size:28px;font-weight:800;line-height:1;margin-bottom:4px}
.kl{font-size:11.5px;color:${C.muted};font-weight:500}
.kd{font-size:11px;margin-top:6px;display:flex;align-items:center;gap:4px}
.kc .gl{position:absolute;bottom:-20px;right:-20px;width:80px;height:80px;border-radius:50%;opacity:.08}
.tw{overflow-x:auto}
table{width:100%;border-collapse:collapse;font-size:13px}
th{text-align:left;padding:8px 14px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.8px;color:${C.muted};border-bottom:1px solid ${C.border};white-space:nowrap}
td{padding:11px 14px;border-bottom:1px solid ${C.border}20;vertical-align:middle}
tr:hover td{background:${C.border}20;cursor:pointer}
tr:last-child td{border-bottom:none}
.re-tag{font-family:monospace;font-size:12px;background:${C.border};padding:3px 8px;border-radius:6px;color:${C.accent};font-weight:600}
.pill{display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600}
.abt{background:${C.accent}15;color:${C.accent};border:1px solid ${C.accent}30;border-radius:7px;padding:5px 12px;font-size:12px;cursor:pointer;font-weight:500;white-space:nowrap;transition:all .2s}
.abt:hover{background:${C.accent}30}
.tr2{display:flex;gap:4px;margin-bottom:16px;background:${C.bg};border-radius:10px;padding:4px}
.tb{flex:1;padding:7px 12px;border-radius:7px;font-size:12px;font-weight:500;cursor:pointer;text-align:center;color:${C.muted};border:none;background:transparent}
.tb.on{background:${C.card};color:${C.accent};border:1px solid ${C.accent}30}
.ctt{background:${C.surface};border:1px solid ${C.border};border-radius:10px;padding:10px 14px;font-size:12px}
.ctt .lb{font-weight:600;margin-bottom:6px;color:${C.text}}
.ctt .rw2{display:flex;align-items:center;gap:6px;color:${C.muted};margin-top:3px}
.ctt .dot{width:8px;height:8px;border-radius:50%}
/* operadores */
.search-bar{display:flex;gap:10px;margin-bottom:20px;flex-wrap:wrap;align-items:center}
.search-input{flex:1;min-width:200px;background:${C.card};border:1px solid ${C.border};color:${C.text};padding:10px 16px;border-radius:10px;font-size:13px;font-family:'Inter',sans-serif;outline:none}
.search-input:focus{border-color:${C.accent}50}
.search-input::placeholder{color:${C.muted}}
.filter-sel{background:${C.card};border:1px solid ${C.border};color:${C.text};padding:10px 14px;border-radius:10px;font-size:13px;font-family:'Inter',sans-serif;outline:none;cursor:pointer}
.filter-sel option{background:${C.surface}}
.op-tabs{display:flex;gap:8px;margin-bottom:20px;flex-wrap:wrap}
.op-tab{padding:8px 16px;border-radius:20px;font-size:13px;font-weight:600;cursor:pointer;border:1px solid ${C.border};background:transparent;color:${C.muted};transition:all .2s;white-space:nowrap}
.op-tab.on{background:${C.accent}18;border-color:${C.accent}40;color:${C.accent}}
.op-tab-cnt{display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:50%;font-size:10px;font-weight:700;margin-left:6px}
.op-card{background:${C.card};border:1px solid ${C.border};border-radius:14px;padding:14px 18px;display:flex;align-items:center;gap:14px;transition:all .2s;cursor:pointer;margin-bottom:10px}
.op-card:hover{border-color:${C.accent}30;background:${C.surface}}
.op-avatar{width:42px;height:42px;border-radius:12px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;font-family:'Inter',sans-serif}
.op-info{flex:1;min-width:0}
.op-nome{font-size:14px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.op-sub{font-size:12px;color:${C.muted};margin-top:2px}
.op-stats{display:flex;gap:14px;align-items:center}
.op-stat{text-align:center}
.op-stat-v{font-family:'Inter',sans-serif;font-size:16px;font-weight:800}
.op-stat-l{font-size:10px;color:${C.muted}}
.op-actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
/* excel upload */
.upload-zone{border:2px dashed ${C.border};border-radius:16px;padding:40px;text-align:center;transition:all .3s;cursor:pointer;background:${C.card}}
.upload-zone:hover,.upload-zone.drag{border-color:${C.accent};background:${C.accent}08}
.upload-zone.has-file{border-color:${C.green};background:${C.green}08;cursor:default}
.file-chip{display:inline-flex;align-items:center;gap:10px;background:${C.green}18;border:1px solid ${C.green}40;border-radius:10px;padding:10px 16px;margin-top:14px}
.file-name{font-size:13px;font-weight:600;color:${C.green}}
.file-size{font-size:11px;color:${C.muted}}
.del-btn{background:${C.red}20;color:${C.red};border:1px solid ${C.red}30;border-radius:6px;padding:4px 10px;font-size:12px;cursor:pointer;font-weight:600}
.del-btn:hover{background:${C.red}40}
.base-info{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:20px}
.bi-card{background:${C.card};border:1px solid ${C.border};border-radius:12px;padding:14px}
.bi-val{font-family:'Inter',sans-serif;font-size:20px;font-weight:800;color:${C.accent}}
.bi-lbl{font-size:11px;color:${C.muted};margin-top:3px}
.aba-row{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px}
.aba-chip{display:flex;align-items:center;gap:6px;padding:6px 12px;border-radius:8px;font-size:12px;font-weight:600;background:${C.border}50;color:${C.muted};border:1px solid transparent;cursor:pointer}
.aba-chip.on{background:${C.accent}18;color:${C.accent};border-color:${C.accent}30}
.data-source-banner{display:flex;align-items:center;gap:10px;padding:10px 16px;background:${C.green}10;border:1px solid ${C.green}30;border-radius:10px;margin-bottom:20px;font-size:13px}
.mock-banner{display:flex;align-items:center;gap:10px;padding:10px 16px;background:${C.gold}10;border:1px solid ${C.gold}30;border-radius:10px;margin-bottom:20px;font-size:13px}
.loading-overlay{position:fixed;inset:0;background:#000a;z-index:999;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:16px}
.spinner{width:48px;height:48px;border:4px solid ${C.border};border-top-color:${C.accent};border-radius:50%;animation:spin .8s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
.fu{animation:fadeUp .45s ease forwards}
.d1{animation-delay:.04s}.d2{animation-delay:.08s}.d3{animation-delay:.12s}
.d4{animation-delay:.18s}.d5{animation-delay:.24s}.d6{animation-delay:.30s}
.rw{display:flex;align-items:center;justify-content:center;position:relative}
.rc{position:absolute;text-align:center}
.rp{font-family:'Inter',sans-serif;font-size:28px;font-weight:800;color:${C.green}}
.rl{font-size:10px;color:${C.muted}}
@media(max-width:1280px){.gkpi{grid-template-columns:repeat(3,1fr)}}
@media(max-width:900px){.g2{grid-template-columns:1fr}}

/* ── MOBILE RESPONSIVE ── */
@media(max-width:768px){
  .sidebar{width:0;overflow:hidden;border:none}
  .sidebar.mob-open{width:240px;box-shadow:4px 0 24px #000a}
  .main{margin-left:0!important;padding:16px 14px}
  .mob-overlay{display:block!important}
  .gkpi{grid-template-columns:repeat(2,1fr)!important;gap:10px}
  .g2{grid-template-columns:1fr!important}
  .tgrid{grid-template-columns:repeat(2,1fr)!important}
  .ficha-grid{grid-template-columns:repeat(3,1fr)!important}
  .ficha-tabs{overflow-x:auto;flex-wrap:nowrap;-webkit-overflow-scrolling:touch}
  .ficha-tab{white-space:nowrap;flex:0 0 auto;padding:8px 12px;font-size:12px}
  .op-card{flex-wrap:wrap}
  .op-stats{display:none}
  .op-actions{width:100%;margin-top:8px;justify-content:flex-end}
  .topbar{flex-wrap:wrap;gap:8px}
  .tbr .dchip{display:none}
  .pt{font-size:18px}
  .base-info{grid-template-columns:repeat(2,1fr)!important}
  .tw table{font-size:11px}
  .tw td,.tw th{padding:7px 8px}
  .mob-hide{display:none!important}
  .mentoria-lista-card{flex-wrap:wrap}
  .step-label{display:none}
  .form-grid-2{grid-template-columns:1fr!important}
  .men-kpi-grid{grid-template-columns:repeat(2,1fr)!important}
}
@media(max-width:480px){
  .gkpi{grid-template-columns:1fr 1fr!important}
  .main{padding:12px 10px}
  .ficha-grid{grid-template-columns:repeat(3,1fr)!important}
  .kv{font-size:22px!important}
}
.mob-overlay{display:none;position:fixed;inset:0;background:#000a;z-index:99}
.mob-menu-btn{display:none;background:${C.card};border:1px solid ${C.border};color:${C.muted};
  width:36px;height:36px;border-radius:8px;cursor:pointer;font-size:18px;
  align-items:center;justify-content:center;flex-shrink:0}
@media(max-width:768px){.mob-menu-btn{display:flex}}
::-webkit-scrollbar{width:5px;height:5px}
::-webkit-scrollbar-thumb{background:${C.border};border-radius:3px}

/* ── FICHA ── */
.ficha-header{background:${C.card};border:1px solid ${C.border};border-radius:16px;
  padding:24px 28px;margin-bottom:20px;position:relative;overflow:hidden}
.ficha-header::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;
  background:linear-gradient(90deg,${C.accent},${C.accent2},${C.purple})}
.ficha-avatar{width:64px;height:64px;border-radius:16px;display:flex;align-items:center;
  justify-content:center;font-size:22px;font-weight:800;font-family:'Inter',sans-serif;flex-shrink:0}
.ficha-nome{font-family:'Inter',sans-serif;font-size:22px;font-weight:800;margin-bottom:4px}
.ficha-sub{font-size:13px;color:${C.muted};display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.ficha-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:14px;margin-top:20px;padding-top:20px;border-top:1px solid ${C.border}}
.fg-item{text-align:center}
.fg-val{font-family:'Inter',sans-serif;font-size:20px;font-weight:800}
.fg-lbl{font-size:11px;color:${C.muted};margin-top:2px}

.ficha-tabs{display:flex;gap:4px;margin-bottom:20px;background:${C.surface};border-radius:12px;padding:5px}
.ficha-tab{flex:1;padding:9px 16px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;
  text-align:center;color:${C.muted};border:none;background:transparent;transition:all .2s;white-space:nowrap}
.ficha-tab.on{background:${C.card};color:${C.accent};border:1px solid ${C.accent}30}

.timeline{position:relative;padding-left:28px}
.timeline::before{content:'';position:absolute;left:8px;top:0;bottom:0;width:2px;background:${C.border}}
.tl-item{position:relative;margin-bottom:18px}
.tl-dot{position:absolute;left:-24px;top:4px;width:12px;height:12px;border-radius:50%;border:2px solid ${C.bg};flex-shrink:0}
.tl-date{font-size:11px;color:${C.muted};margin-bottom:3px}
.tl-ev{display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:7px;font-size:12px;font-weight:600;margin-bottom:4px}
.tl-hist{font-size:12px;color:${C.muted};line-height:1.5}
.tl-mention{background:${C.gold}18;border:1px solid ${C.gold}30;border-radius:10px;padding:3px 8px;font-size:11px;color:${C.gold};font-weight:600}

.comp-stars{display:flex;gap:4px}
.star{font-size:18px;opacity:.3}
.star.on{opacity:1}

.enc-card{background:${C.bg};border:1px solid ${C.border};border-radius:12px;padding:16px;margin-bottom:12px}
.enc-header{display:flex;align-items:center;gap:10px;margin-bottom:10px}
.enc-icon{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0}
.enc-area{font-weight:700;font-size:14px}
.enc-data{font-size:11px;color:${C.muted};margin-top:2px}
.enc-desc{font-size:13px;color:${C.muted};line-height:1.6;margin-bottom:10px}
.enc-retorno{background:${C.card};border:1px solid ${C.border};border-radius:8px;padding:10px 14px;font-size:12px;color:${C.muted};border-left:3px solid ${C.green}}

.back-btn{display:inline-flex;align-items:center;gap:8px;padding:8px 16px;background:${C.card};
  border:1px solid ${C.border};border-radius:9px;font-size:13px;cursor:pointer;color:${C.muted};
  margin-bottom:20px;transition:all .2s;font-weight:500}
.back-btn:hover{color:${C.accent};border-color:${C.accent}40}

.comp-bar{height:8px;background:${C.border};border-radius:4px;overflow:hidden;margin-top:6px}
.comp-fill{height:100%;border-radius:4px;transition:width .8s ease}

/* ── TOAST NOTIFICATIONS ── */
.toast-container{position:fixed;bottom:24px;right:24px;z-index:9999;display:flex;flex-direction:column;gap:8px;pointer-events:none}
.toast{display:flex;align-items:center;gap:10px;padding:12px 18px;border-radius:12px;font-size:13px;font-weight:600;
  pointer-events:all;box-shadow:0 8px 32px #00000060;animation:toastIn .3s ease;min-width:240px;max-width:360px}
.toast.success{background:${C.green};color:#000}
.toast.error{background:${C.red};color:#fff}
.toast.info{background:${C.accent};color:#000}
.toast.warning{background:${C.gold};color:#000}
@keyframes toastIn{from{opacity:0;transform:translateY(20px) scale(.95)}to{opacity:1;transform:translateY(0) scale(1)}}
@keyframes toastOut{from{opacity:1;transform:translateY(0)}to{opacity:0;transform:translateY(10px)}}

/* ── ONBOARDING CARD ── */
.onboard-card{background:linear-gradient(135deg,${C.accent}10,${C.accent2}08);border:1px solid ${C.accent}30;
  border-radius:16px;padding:20px 24px;margin-bottom:24px;position:relative;overflow:hidden}
.onboard-card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,${C.accent},${C.accent2},${C.purple})}
.onboard-step{display:flex;align-items:center;gap:10px;padding:6px 0}
.onboard-num{width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;
  font-size:10px;font-weight:800;font-family:'Inter',sans-serif;flex-shrink:0}

/* ── QUICK STATS BAR ── */
.stat-bar-row{display:flex;gap:3px;height:8px;border-radius:4px;overflow:hidden;margin-top:8px}

/* ── EMPTY STATE ── */
.empty-state{text-align:center;padding:48px 0;opacity:.55}
.empty-state .emoji{font-size:48px;margin-bottom:12px}
.empty-state .title{font-family:'Inter',sans-serif;font-size:16px;font-weight:700;margin-bottom:6px}
.empty-state .sub{font-size:13px;color:${C.muted}}
`;

// ─── TOAST SYSTEM ────────────────────────────────────────────────────────────
let _toastSetter = null;
function useToast() {
  const [toasts, setToasts] = useState([]);
  _toastSetter = setToasts;
  const dismiss = (id) => setToasts(t=>t.filter(x=>x.id!==id));
  return { toasts, dismiss };
}
function toast(msg, type="success", duration=3000) {
  if (!_toastSetter) return;
  const id = Date.now();
  _toastSetter(t=>[...t, {id, msg, type}]);
  setTimeout(()=>_toastSetter(t=>t.filter(x=>x.id!==id)), duration);
}

const ToastContainer = () => {
  const { toasts, dismiss } = useToast();
  const icons = { success:"✓", error:"✕", info:"ℹ", warning:"⚠" };
  return (
    <div className="toast-container">
      {toasts.map(t=>(
        <div key={t.id} className={`toast ${t.type}`} onClick={()=>dismiss(t.id)}>
          <span style={{fontSize:16}}>{icons[t.type]||"•"}</span>
          <span style={{flex:1}}>{t.msg}</span>
        </div>
      ))}
    </div>
  );
};

// ─── COMPONENTS ──────────────────────────────────────────────────────────────
// ─── GLOBAL SEARCH ────────────────────────────────────────────────────────────
const GlobalSearch = ({ operators, sessions, tratativas, onNavigate, onVerFicha }) => {
  const [open, setOpen]   = useState(false);
  const [q, setQ]         = useState("");
  const inputRef          = useRef();

  // keyboard shortcut Ctrl+K / Cmd+K
  useEffect(()=>{
    const handler = (e) => {
      if ((e.ctrlKey||e.metaKey) && e.key==="k") { e.preventDefault(); setOpen(o=>!o); setQ(""); }
      if (e.key==="Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return ()=>window.removeEventListener("keydown", handler);
  },[]);

  useEffect(()=>{ if(open) setTimeout(()=>inputRef.current?.focus(),50); },[open]);

  if (!open) return (
    <button onClick={()=>{ setOpen(true); setQ(""); }}
      style={{display:"flex",alignItems:"center",gap:8,padding:"6px 12px",background:C.border+"60",
        border:`1px solid ${C.border}`,borderRadius:8,color:C.muted,fontSize:12,cursor:"pointer",
        fontFamily:"'Inter',sans-serif",transition:"all .2s"}}
      title="Busca global (Ctrl+K)">
      🔍 <span className="mob-hide">Buscar...</span>
      <span style={{fontSize:10,background:C.border,padding:"1px 5px",borderRadius:4,marginLeft:2}} className="mob-hide">Ctrl+K</span>
    </button>
  );

  const lq = q.toLowerCase();
  const results = q.length < 2 ? [] : [
    ...operators.filter(o=>o.re.toLowerCase().includes(lq)||o.nome.toLowerCase().includes(lq))
      .slice(0,5).map(o=>({ type:"operador", icon:"👤", label:o.nome, sub:`${o.re} · ${o.funcao} · ${o.garagem}`, action:()=>{ onVerFicha(o); setOpen(false); } })),
    ...sessions.filter(s=>s.re.toLowerCase().includes(lq)||s.nome.toLowerCase().includes(lq)||(s.causas||[]).join(" ").toLowerCase().includes(lq))
      .slice(0,3).map(s=>({ type:"mentoria", icon:"💬", label:`Mentoria: ${s.nome}`, sub:`${s.data} · ${(s.causas||[]).join(", ")||"–"}`, action:()=>{ onNavigate("mentoria"); setOpen(false); } })),
    ...tratativas.filter(t=>t.re.toLowerCase().includes(lq)||t.nome.toLowerCase().includes(lq)||t.area.toLowerCase().includes(lq))
      .slice(0,3).map(t=>({ type:"tratativa", icon:"🔁", label:`Tratativa: ${t.area}`, sub:`${t.re} · ${t.nome} · ${t.status}`, action:()=>{ onNavigate("tratativas"); setOpen(false); } })),
  ];

  return (
    <div style={{position:"fixed",inset:0,background:"#000c",zIndex:9000,display:"flex",alignItems:"flex-start",justifyContent:"center",paddingTop:80}}
      onClick={()=>setOpen(false)}>
      <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,width:"100%",maxWidth:540,
        boxShadow:"0 24px 80px #00000080",overflow:"hidden"}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",alignItems:"center",gap:12,padding:"14px 18px",borderBottom:`1px solid ${C.border}`}}>
          <span style={{fontSize:18}}>🔍</span>
          <input ref={inputRef} style={{flex:1,background:"none",border:"none",color:C.text,fontSize:15,fontFamily:"'Inter',sans-serif",outline:"none"}}
            placeholder="Buscar operador, RE, mentoria, tratativa..." value={q} onChange={e=>setQ(e.target.value)}/>
          <button onClick={()=>setOpen(false)} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:13}}>ESC</button>
        </div>
        {q.length<2 && (
          <div style={{padding:"20px 18px",color:C.muted,fontSize:13}}>
            <div style={{marginBottom:10,fontSize:11,textTransform:"uppercase",letterSpacing:1,fontWeight:700}}>Acesso rápido</div>
            {[{icon:"👥",l:"Lista de Operadores",p:"operadores"},{icon:"💬",l:"Nova Mentoria",p:"mentoria"},
              {icon:"📅",l:"Agenda",p:"agenda"},{icon:"🔁",l:"Tratativas",p:"tratativas"},
              {icon:"📊",l:"Relatórios",p:"relatorios"},{icon:"⚙️",l:"Parâmetros",p:"parametros"}]
              .map(x=>(
              <div key={x.p} onClick={()=>{ onNavigate(x.p); setOpen(false); }}
                style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",borderRadius:8,cursor:"pointer",
                  transition:"all .15s"}}
                onMouseEnter={e=>e.currentTarget.style.background=C.border}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <span>{x.icon}</span><span style={{fontSize:13}}>{x.l}</span>
              </div>
            ))}
          </div>
        )}
        {q.length>=2 && (
          <div style={{maxHeight:360,overflowY:"auto"}}>
            {results.length===0
              ? <div style={{padding:"32px 0",textAlign:"center",color:C.muted,fontSize:13}}>Nenhum resultado para "{q}"</div>
              : results.map((r,i)=>(
                <div key={i} onClick={r.action}
                  style={{display:"flex",alignItems:"center",gap:12,padding:"12px 18px",cursor:"pointer",
                    borderBottom:`1px solid ${C.border}20`,transition:"all .15s"}}
                  onMouseEnter={e=>e.currentTarget.style.background=C.border+"60"}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <span style={{fontSize:20,flexShrink:0}}>{r.icon}</span>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:600,fontSize:13}}>{r.label}</div>
                    <div style={{fontSize:11,color:C.muted,marginTop:2}}>{r.sub}</div>
                  </div>
                  <span style={{fontSize:10,color:C.muted,background:C.border,padding:"2px 6px",borderRadius:4,flexShrink:0,textTransform:"capitalize"}}>{r.type}</span>
                </div>
              ))
            }
          </div>
        )}
        <div style={{padding:"8px 18px",borderTop:`1px solid ${C.border}`,display:"flex",gap:16,fontSize:10,color:C.muted}}>
          <span>↑↓ navegar</span><span>↵ abrir</span><span>ESC fechar</span><span style={{marginLeft:"auto"}}>Ctrl+K para abrir</span>
        </div>
      </div>
    </div>
  );
};

const CT = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="ctt">
      <div className="lb">{label}</div>
      {payload.map((p,i)=>(
        <div className="rw2" key={i}><div className="dot" style={{ background:p.color }}/>{p.name}: <strong style={{ color:p.color }}>{p.value}</strong></div>
      ))}
    </div>
  );
};
const Ring = ({ value, size=116 }) => {
  const s=8, r=(size-s*2)/2, circ=2*Math.PI*r, off=circ-(value/100)*circ;
  return (
    <div className="rw" style={{ width:size, height:size }}>
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.border} strokeWidth={s}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.green} strokeWidth={s}
          strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round"
          style={{ transform:"rotate(-90deg)",transformOrigin:"center",transition:"stroke-dashoffset 1s ease" }}/>
      </svg>
      <div className="rc"><div className="rp">{value}%</div><div className="rl">melhora</div></div>
    </div>
  );
};

const STATUS_LABEL = {
  mentoria:   { label:"Em Mentoria", color:C.accent,  bg:`${C.accent}18` },
  aguardando: { label:"Aguardando",  color:C.orange,  bg:`${C.orange}18` },
};
const RESULTADO_LABEL = {
  melhora:   { label:"Melhora",      color:C.green, bg:`${C.green}18`,  icon:"↑" },
  piora:     { label:"Piora",        color:C.red,   bg:`${C.red}18`,    icon:"↓" },
  andamento: { label:"Em avaliação", color:C.gold,  bg:`${C.gold}18`,   icon:"→" },
};

const NAV = [
  { id:"dashboard",  label:"Dashboard",        icon:"◉",  section:"principal" },
  { id:"operadores", label:"Operadores",        icon:"👥", section:"principal" },
  { id:"ficha",      label:"Ficha do Operador", icon:"📋", section:"principal" },
  { id:"mentoria",   label:"Mentoria",          icon:"💬", section:"acompanhamento" },
  { id:"agenda",     label:"Agenda",            icon:"📅", section:"acompanhamento" },
  { id:"tratativas", label:"Tratativas",        icon:"🔁", section:"gestão" },
  { id:"relatorios", label:"Relatórios",        icon:"📊", section:"gestão" },
  { id:"auditoria",  label:"Auditoria",         icon:"🔍", section:"gestão" },
  { id:"parametros", label:"Parâmetros",        icon:"⚙️", section:"sistema" },
  { id:"base",       label:"Base de Dados",     icon:"🗃️", section:"sistema" },
];

// ─── DASHBOARD ───────────────────────────────────────────────────────────────
const DashboardPage = ({ data, isReal, onNav, agenda, tratativas }) => {
  const { kpis, eventosMes, causas, operators } = data;
  const [chartTab, setChartTab] = useState("eventos");

  const kpiCards = [
    { icon:"👥", value:kpis.total,        label:"Total Operadores",  color:C.accent,  delta:`base ${isReal?"real":"mock"}`,      up:null  },
    { icon:"🎯", value:kpis.emMentoria,   label:"Em Mentoria",       color:C.accent2, delta:`de ${kpis.total} totais`,            up:null  },
    { icon:"📈", value:kpis.melhoraram,   label:"Melhoraram",        color:C.green,   delta:`de ${kpis.emMentoria} em mentoria`, up:true  },
    { icon:"📉", value:kpis.pioraram,     label:"Pioraram",          color:C.red,     delta:`de ${kpis.emMentoria} em mentoria`, up:false },
    { icon:"⏳", value:kpis.aguardando,   label:"Aguardam Mentoria", color:C.orange,  delta:`${kpis.total} − ${kpis.emMentoria} = ${kpis.aguardando}`, up:null },
    { icon:"✅", value:`${kpis.taxaMelhora}%`, label:"Taxa de Melhora", color:C.gold, delta:`${kpis.melhoraram} de ${kpis.emMentoria} pós mentoria`, up:kpis.taxaMelhora>=50 },
  ];

  const piChartData = causas.length ? causas : MOCK.causas;

  return (
    <>
      {isReal
        ? <div className="data-source-banner">✅ <strong>Dados reais carregados.</strong> Todos os indicadores abaixo refletem sua base de dados.</div>
        : <div className="onboard-card">
            <div style={{display:"flex",alignItems:"flex-start",gap:16,flexWrap:"wrap"}}>
              <div style={{flex:1}}>
                <div style={{fontFamily:"'Inter',sans-serif",fontSize:15,fontWeight:800,color:C.accent,marginBottom:4}}>
                  🚀 Bem-vindo ao Elevamente!
                </div>
                <div style={{fontSize:12,color:C.muted,marginBottom:12}}>Siga os passos abaixo para ativar os dados reais do sistema:</div>
                {[
                  {n:1,done:true,  txt:"Fazer login no sistema",                          act:null},
                  {n:2,done:false, txt:"Carregar a base Excel (menu 'Base de Dados')",    act:"base"},
                  {n:3,done:false, txt:"Configurar parâmetros financeiros (Parâmetros)",  act:"parametros"},
                  {n:4,done:false, txt:"Registrar primeira sessão de mentoria",           act:"mentoria"},
                  {n:5,done:false, txt:"Agendar próximas mentorias na Agenda",            act:"agenda"},
                ].map(s=>(
                  <div className="onboard-step" key={s.n}>
                    <div className="onboard-num" style={{background:s.done?C.green:`${C.accent}20`,color:s.done?"#000":C.accent,border:`1px solid ${s.done?C.green:C.accent}40`}}>
                      {s.done?"✓":s.n}
                    </div>
                    <div style={{fontSize:12,color:s.done?C.muted:C.text,textDecoration:s.done?"line-through":"none",flex:1}}>{s.txt}</div>
                    {!s.done && s.act && (
                      <button className="abt" style={{fontSize:11,padding:"3px 10px"}} onClick={()=>onNav(s.act)}>Ir →</button>
                    )}
                  </div>
                ))}
              </div>
              <button onClick={()=>onNav("base")} style={{padding:"10px 20px",borderRadius:10,border:"none",cursor:"pointer",
                background:`linear-gradient(135deg,${C.accent},${C.accent2})`,color:"#000",fontFamily:"'Inter',sans-serif",
                fontSize:13,fontWeight:800,whiteSpace:"nowrap",alignSelf:"center"}}>
                📊 Carregar Base
              </button>
            </div>
            <div style={{fontSize:11,color:C.muted,marginTop:10,fontStyle:"italic"}}>
              Os dados abaixo são de demonstração. Eles serão substituídos pelos dados reais após o upload da planilha.
            </div>
          </div>
      }
      <div className="gkpi">
        {kpiCards.map((k,i)=>(
          <div className={`kc fu d${Math.min(i+1,6)}`} key={k.label} style={{ borderTop:`2px solid ${k.color}40` }}>
            <div className="ki">{k.icon}</div>
            <div className="kv" style={{ color:k.color }}>{k.value}</div>
            <div className="kl">{k.label}</div>
            {k.delta && <div className="kd" style={{ color:k.up===true?C.green:k.up===false?C.red:C.muted }}>
              {k.up===true?"↑":k.up===false?"↓":"→"} {k.delta}</div>}
            <div className="gl" style={{ background:k.color }}/>
          </div>
        ))}
      </div>

      <div className="g2 fu d3">
        <div className="card">
          <div className="ct"><span className="ctd"/>Eventos por Mês</div>
          <div className="tr2">
            {["eventos","geral"].map(t=>(
              <button key={t} className={`tb ${chartTab===t?"on":""}`} onClick={()=>setChartTab(t)}>
                {t==="eventos"?"Ocorrências":"Antes vs Depois"}
              </button>
            ))}
          </div>
          {chartTab==="eventos" ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={eventosMes.length?eventosMes:MOCK.eventosMes} barSize={9}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
                <XAxis dataKey="mes" tick={{ fill:C.muted,fontSize:11 }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fill:C.muted,fontSize:11 }} axisLine={false} tickLine={false}/>
                <Tooltip content={<CT/>}/>
                <Bar dataKey="faltas"    fill={C.red}    radius={[4,4,0,0]} name="Faltas"/>
                <Bar dataKey="multas"    fill={C.orange} radius={[4,4,0,0]} name="Multas"/>
                <Bar dataKey="acidentes" fill={C.purple} radius={[4,4,0,0]} name="Acidentes"/>
                <Bar dataKey="mentorias" fill={C.green}  radius={[4,4,0,0]} name="Mentorias"/>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={MOCK.eventosMes}>
                <defs>
                  <linearGradient id="gA" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.red} stopOpacity={.3}/><stop offset="95%" stopColor={C.red} stopOpacity={0}/></linearGradient>
                  <linearGradient id="gB" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.green} stopOpacity={.3}/><stop offset="95%" stopColor={C.green} stopOpacity={0}/></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
                <XAxis dataKey="mes" tick={{ fill:C.muted,fontSize:11 }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fill:C.muted,fontSize:11 }} axisLine={false} tickLine={false}/>
                <Tooltip content={<CT/>}/>
                <Area dataKey="faltas"    fill="url(#gA)" stroke={C.red}   strokeWidth={2} name="Faltas"/>
                <Area dataKey="mentorias" fill="url(#gB)" stroke={C.green} strokeWidth={2} name="Mentorias"/>
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="card" style={{ display:"flex",flexDirection:"column" }}>
          <div className="ct"><span className="ctd"/>Causas Identificadas {!causas.length&&!isReal&&<span style={{ fontSize:10,color:C.muted }}>(demo)</span>}</div>
          <div style={{ display:"flex",gap:16,flex:1,alignItems:"center" }}>
            <ResponsiveContainer width={155} height={155}>
              <PieChart>
                <Pie data={piChartData} cx="50%" cy="50%" innerRadius={42} outerRadius={70} paddingAngle={3} dataKey="value">
                  {piChartData.map((_,i)=><Cell key={i} fill={PIE_COLORS[i]}/>)}
                </Pie>
                <Tooltip content={<CT/>}/>
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex:1,display:"flex",flexDirection:"column",gap:8 }}>
              {piChartData.map((c,i)=>(
                <div key={c.name} style={{ display:"flex",alignItems:"center",gap:8 }}>
                  <div style={{ width:8,height:8,borderRadius:"50%",background:PIE_COLORS[i],flexShrink:0 }}/>
                  <div style={{ flex:1,fontSize:12,color:C.muted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{c.name}</div>
                  <div style={{ fontFamily:"'Inter',sans-serif",fontSize:13,fontWeight:700,color:PIE_COLORS[i] }}>{c.value}{isReal?"":"%" }</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="g2 fu d4">
        <div className="card">
          <div className="ct" style={{ justifyContent:"space-between",display:"flex" }}>
            <span style={{ display:"flex",alignItems:"center",gap:8 }}><span className="ctd"/>Operadores em Atenção</span>
            <button className="abt" onClick={()=>onNav("operadores")}>Ver todos</button>
          </div>
          <div className="tw">
            <table>
              <thead><tr><th>#</th><th>RE</th><th>Operador</th><th>F</th><th>M</th><th>Status</th><th>Resultado</th></tr></thead>
              <tbody>
                {operators.filter(o=>o.resultado==="piora"||o.resultado==="andamento"||o.status==="aguardando")
                  .slice(0,6).map((op,i)=>{
                  const stl=STATUS_LABEL[op.status];
                  const res=op.resultado?RESULTADO_LABEL[op.resultado]:null;
                  return (
                    <tr key={op.re+i}>
                      <td style={{ color:C.muted,fontWeight:600 }}>{i+1}</td>
                      <td><span className="re-tag">{op.re}</span></td>
                      <td style={{ fontWeight:500,fontSize:12 }}>{op.nome}</td>
                      <td style={{ color:op.faltas>=10?C.red:op.faltas>=5?C.orange:C.muted,fontWeight:700 }}>{op.faltas}</td>
                      <td style={{ color:op.multas>=5?C.red:op.multas>=3?C.orange:C.muted,fontWeight:700 }}>{op.multas}</td>
                      <td><span className="pill" style={{ color:stl.color,background:stl.bg }}>● {stl.label}</span></td>
                      <td>{res&&<span className="pill" style={{ color:res.color,background:res.bg }}>{res.icon} {res.label}</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card" style={{ display:"flex",gap:20,alignItems:"center" }}>
          <Ring value={kpis.taxaMelhora}/>
          <div>
            <div style={{ fontFamily:"'Inter',sans-serif",fontSize:16,fontWeight:700,marginBottom:8 }}>Taxa de Melhora</div>
            <div style={{ color:C.muted,fontSize:13,lineHeight:1.8 }}>
              <span style={{ color:C.green,fontWeight:600 }}>{kpis.melhoraram} de {kpis.emMentoria}</span> operadores<br/>
              que passaram pela mentoria<br/>apresentaram melhora.
            </div>
            <div style={{ marginTop:12,display:"flex",gap:8,flexWrap:"wrap" }}>
              {[
                {c:C.green, l:"Melhoraram",   n:kpis.melhoraram},
                {c:C.gold,  l:"Em avaliação", n:kpis.emMentoria-kpis.melhoraram-kpis.pioraram},
                {c:C.red,   l:"Pioraram",     n:kpis.pioraram},
              ].map(x=>(
                <div key={x.l} style={{ background:`${x.c}18`,border:`1px solid ${x.c}30`,borderRadius:8,padding:"4px 10px",fontSize:12,color:x.c,fontWeight:600 }}>{x.n} {x.l}</div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Agenda de Hoje + Tratativas Urgentes ── */}
      <div className="g2 fu d5">
        {/* Agenda de Hoje — dados reais */}
        <div className="card">
          <div className="ct" style={{ justifyContent:"space-between",display:"flex" }}>
            <span style={{ display:"flex",alignItems:"center",gap:8 }}>
              <span className="ctd"/>📅 Agenda de Hoje
            </span>
            <button className="abt" onClick={()=>onNav("agenda")}>Ver agenda</button>
          </div>
          {(()=>{
            const agHoje = (agenda||[]).filter(a=>a.data===fmtDate(new Date())).sort((a,b)=>a.hora.localeCompare(b.hora));
            if (!agHoje.length) return (
              <div style={{ padding:"24px 0",textAlign:"center",color:C.muted,fontSize:13 }}>
                <div style={{ fontSize:28,marginBottom:8 }}>📭</div>
                Nenhum agendamento para hoje
              </div>
            );
            return agHoje.map((a,i)=>{
              const tp = TIPO_COLORS[a.tipo]||{color:C.accent,icon:"📅"};
              const st = STATUS_AGENDA[a.status]||{label:a.status,color:C.muted};
              const ac = avatarColor(a.re);
              return (
                <div key={a.id} style={{ display:"flex",gap:12,padding:"10px 0",
                  borderBottom:i<agHoje.length-1?`1px solid ${C.border}20`:"none",alignItems:"center" }}>
                  <div style={{ fontFamily:"'Inter',sans-serif",fontWeight:800,fontSize:13,color:tp.color,minWidth:44 }}>{a.hora}</div>
                  <div style={{ width:32,height:32,borderRadius:8,background:`${ac}20`,color:ac,display:"flex",
                    alignItems:"center",justifyContent:"center",fontFamily:"'Inter',sans-serif",fontWeight:800,fontSize:11,flexShrink:0 }}>
                    {initials(a.nome)}
                  </div>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ fontSize:12,fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{a.nome}</div>
                    <div style={{ fontSize:11,color:tp.color,marginTop:1 }}>{tp.icon} {a.tipo}</div>
                  </div>
                  <span style={{ fontSize:10,fontWeight:600,padding:"2px 7px",borderRadius:5,
                    color:st.color,background:`${st.color}18`,whiteSpace:"nowrap" }}>
                    {st.label}
                  </span>
                </div>
              );
            });
          })()}
        </div>

        {/* Tratativas pendentes/urgentes */}
        <div className="card">
          <div className="ct" style={{ justifyContent:"space-between",display:"flex" }}>
            <span style={{ display:"flex",alignItems:"center",gap:8 }}>
              <span className="ctd"/>🔁 Tratativas Pendentes
            </span>
            <button className="abt" onClick={()=>onNav("tratativas")}>Ver todas</button>
          </div>
          {(()=>{
            const pending = (tratativas||[]).filter(t=>t.status!=="concluido")
              .sort((a,b)=>{const o={urgente:0,alta:1,media:2,baixa:3}; return (o[a.prioridade]||2)-(o[b.prioridade]||2);})
              .slice(0,5);
            if (!pending.length) return (
              <div style={{ padding:"24px 0",textAlign:"center",color:C.muted,fontSize:13 }}>
                <div style={{ fontSize:28,marginBottom:8 }}>✅</div>
                Todas as tratativas estão concluídas!
              </div>
            );
            return pending.map((t,i)=>{
              const ac=AREA_COLORS[t.area]||C.accent;
              const pr=PRIOR_MAP[t.prioridade]||{label:"Média",color:C.gold};
              const st=TRAT_ST_MAP[t.status]||{label:t.status,color:C.muted};
              return (
                <div key={t.id} style={{ display:"flex",gap:10,padding:"10px 0",
                  borderBottom:i<pending.length-1?`1px solid ${C.border}20`:"none",alignItems:"flex-start" }}>
                  <div style={{ fontSize:18,flexShrink:0 }}>{AREA_ICONS[t.area]||"🔁"}</div>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ display:"flex",gap:6,alignItems:"center",flexWrap:"wrap",marginBottom:2 }}>
                      <span className="re-tag" style={{ fontSize:10,padding:"1px 5px" }}>{t.re}</span>
                      <span style={{ fontSize:12,fontWeight:600 }}>{t.area}{t.subarea?` / ${t.subarea}`:""}</span>
                    </div>
                    <div style={{ fontSize:11,color:C.muted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{t.descricao}</div>
                  </div>
                  <div style={{ display:"flex",flexDirection:"column",gap:3,flexShrink:0,alignItems:"flex-end" }}>
                    <span style={{ fontSize:10,fontWeight:600,padding:"2px 6px",borderRadius:4,color:pr.color,background:`${pr.color}18` }}>
                      {pr.label}
                    </span>
                    <span style={{ fontSize:10,fontWeight:600,padding:"2px 6px",borderRadius:4,color:st.color,background:`${st.color}18` }}>
                      {st.label}
                    </span>
                  </div>
                </div>
              );
            });
          })()}
        </div>
      </div>
    </>
  );
};

// ─── OPERADORES LIST ─────────────────────────────────────────────────────────
const OperadoresPage = ({ operators, onVerFicha }) => {
  const [tab, setTab]         = useState("todos");
  const [busca, setBusca]     = useState("");
  const [garagem, setGaragem] = useState("todas");

  const garagens = [...new Set(operators.map(o=>o.garagem).filter(Boolean))].sort();

  const tabs = [
    { id:"todos",      label:"Todos",        count:operators.length },
    { id:"mentoria",   label:"Em Mentoria",  count:operators.filter(o=>o.status==="mentoria").length },
    { id:"melhora",    label:"Melhoraram",   count:operators.filter(o=>o.resultado==="melhora").length },
    { id:"piora",      label:"Pioraram",     count:operators.filter(o=>o.resultado==="piora").length },
    { id:"andamento",  label:"Avaliação",    count:operators.filter(o=>o.resultado==="andamento").length },
    { id:"aguardando", label:"Aguardando",   count:operators.filter(o=>o.status==="aguardando").length },
  ];

  const lista = operators.filter(op => {
    const bOk = !busca || op.nome.toLowerCase().includes(busca.toLowerCase()) || op.re.toLowerCase().includes(busca.toLowerCase());
    const gOk = garagem==="todas" || op.garagem===garagem;
    const tOk = tab==="todos" ? true
               : tab==="mentoria"   ? op.status==="mentoria"
               : tab==="aguardando" ? op.status==="aguardando"
               : op.resultado===tab;
    return bOk && gOk && tOk;
  });

  return (
    <div className="fu d1">
      <div className="search-bar">
        <input className="search-input" placeholder="🔍  Buscar nome ou RE…" value={busca} onChange={e=>setBusca(e.target.value)}/>
        <select className="filter-sel" value={garagem} onChange={e=>setGaragem(e.target.value)}>
          <option value="todas">Todas as Garagens</option>
          {garagens.map(g=><option key={g} value={g}>{g}</option>)}
        </select>
        <button className="abt" style={{ padding:"10px 16px" }}>⬇ Exportar</button>
      </div>
      <div className="op-tabs">
        {tabs.map(t=>(
          <button key={t.id} className={`op-tab ${tab===t.id?"on":""}`} onClick={()=>setTab(t.id)}>
            {t.label}
            <span className="op-tab-cnt" style={{ background:tab===t.id?`${C.accent}30`:C.border, color:tab===t.id?C.accent:C.muted }}>{t.count}</span>
          </button>
        ))}
      </div>
      <div style={{ fontSize:12,color:C.muted,marginBottom:14 }}>
        Exibindo <strong style={{ color:C.text }}>{lista.length}</strong> operador{lista.length!==1?"es":""}
      </div>
      {lista.map((op,i)=>{
        const ac  = avatarColor(op.re);
        const stl = STATUS_LABEL[op.status];
        const res = op.resultado ? RESULTADO_LABEL[op.resultado] : null;
        return (
          <div className="op-card" key={op.re+i} onClick={()=>onVerFicha && onVerFicha(op)}>
            <div className="op-avatar" style={{ background:`${ac}20`,color:ac,border:`1px solid ${ac}30` }}>{initials(op.nome)}</div>
            <div className="op-info">
              <div className="op-nome">{op.nome}</div>
              <div className="op-sub">
                <span className="re-tag" style={{ fontSize:11,padding:"2px 6px" }}>{op.re}</span>
                &nbsp;{op.funcao} · {op.garagem} · Adm: {op.admissao}
              </div>
            </div>
            <div className="op-stats">
              {[{v:op.faltas,l:"Faltas",c:op.faltas>=10?C.red:op.faltas>=5?C.orange:C.muted},
                {v:op.multas,l:"Multas",c:op.multas>=5?C.red:op.multas>=3?C.orange:C.muted},
                {v:op.acidentes,l:"Acid.",c:op.acidentes>=2?C.red:op.acidentes>=1?C.orange:C.muted}]
               .map(s=>(
                <div className="op-stat" key={s.l}>
                  <div className="op-stat-v" style={{ color:s.c }}>{s.v}</div>
                  <div className="op-stat-l">{s.l}</div>
                </div>
              ))}
            </div>
            <div className="op-actions">
              <span className="pill" style={{ color:stl.color,background:stl.bg }}>● {stl.label}</span>
              {res && <span className="pill" style={{ color:res.color,background:res.bg }}>{res.icon} {res.label}</span>}
              {op.dataMentoria && <span style={{ fontSize:11,color:C.muted,whiteSpace:"nowrap" }}>📅 {op.dataMentoria}</span>}
              <button className="abt" onClick={e=>{e.stopPropagation();onVerFicha&&onVerFicha(op);}}>Ver Ficha</button>
            </div>
          </div>
        );
      })}
      {lista.length===0 && (
        <div style={{ textAlign:"center",padding:"60px 0",opacity:.5 }}>
          <div style={{ fontSize:40,marginBottom:10 }}>🔍</div>
          <div style={{ fontFamily:"'Inter',sans-serif",fontSize:16 }}>Nenhum operador encontrado</div>
        </div>
      )}
    </div>
  );
};

// ─── BASE DE DADOS PAGE ───────────────────────────────────────────────────────
const BasePage = ({ fileName, fileSize, sheetSummary, onUpload, onDelete, isReal }) => {
  const [drag, setDrag] = useState(false);
  const inputRef = useRef();

  const handleFile = (f) => {
    if (!f) return;
    if (!f.name.match(/\.(xlsx|xls)$/i)) { alert("Envie um arquivo Excel (.xlsx ou .xls)"); return; }
    onUpload(f);
  };
  const onDrop = useCallback(e=>{e.preventDefault();setDrag(false);handleFile(e.dataTransfer.files[0]);}, []);

  return (
    <div className="fu d1">
      <div className="card" style={{ marginBottom:20 }}>
        <div className="ct"><span className="ctd"/>Importação de Base de Dados (Excel)</div>
        {!isReal ? (
          <div className={`upload-zone ${drag?"drag":""}`}
            onClick={()=>inputRef.current.click()}
            onDragOver={e=>{e.preventDefault();setDrag(true)}}
            onDragLeave={()=>setDrag(false)}
            onDrop={onDrop}>
            <div style={{ fontSize:48,marginBottom:12 }}>📊</div>
            <div style={{ fontFamily:"'Inter',sans-serif",fontSize:16,fontWeight:700,marginBottom:6 }}>Clique ou arraste o arquivo Excel aqui</div>
            <div style={{ fontSize:13,color:C.muted }}>Formatos aceitos: .xlsx, .xls · Múltiplas abas processadas automaticamente</div>
            <input ref={inputRef} type="file" accept=".xlsx,.xls" style={{ display:"none" }} onChange={e=>handleFile(e.target.files[0])}/>
          </div>
        ) : (
          <div className="upload-zone has-file">
            <div style={{ fontSize:48,marginBottom:12 }}>✅</div>
            <div style={{ fontFamily:"'Inter',sans-serif",fontSize:16,fontWeight:700,color:C.green,marginBottom:6 }}>Base de dados carregada e processada!</div>
            <div className="file-chip">
              <span style={{ fontSize:20 }}>📊</span>
              <div><div className="file-name">{fileName}</div><div className="file-size">{fmt(fileSize)}</div></div>
              <button className="del-btn" onClick={onDelete}>🗑 Deletar base</button>
            </div>
            <div style={{ marginTop:10,fontSize:12,color:C.muted }}>Para atualizar: delete a base atual e faça upload da versão nova.</div>
          </div>
        )}

        {isReal && sheetSummary.length>0 && (
          <div className="base-info" style={{ gridTemplateColumns:`repeat(${Math.min(sheetSummary.length,4)},1fr)` }}>
            {sheetSummary.slice(0,8).map(s=>(
              <div className="bi-card" key={s.name}>
                <div className="bi-val">{s.rows}</div>
                <div className="bi-lbl" style={{ fontWeight:600 }}>linhas</div>
                <div style={{ fontSize:11,color:C.muted,marginTop:4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{s.name}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Estrutura esperada */}
      <div className="card">
        <div className="ct"><span className="ctd"/>Abas Esperadas na Planilha</div>
        <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12 }}>
          {[
            { aba:"QUERY_PRONTUARIO", desc:"Histórico de eventos (faltas, multas, suspensões...)", campos:"NoREG, CHAPA, NOME, DATA, EV, HISTORICO" },
            { aba:"QUERY_MULTAS",     desc:"Infrações de trânsito com valor e enquadramento",       campos:"Data infração, N.REG, Linha, Descrição, Valor" },
            { aba:"ACIDENTES",        desc:"Acidentes — filtrado por parecer 'responsável'",        campos:"Data, RE, Descrição, Parecer" },
            { aba:"QUADRO_FUNC",      desc:"Dados cadastrais dos funcionários — inclua coluna ELEVAMENTE (SIM/NÃO) para filtrar quem está no programa",     campos:"RE, Nome, Função, Garagem, Admissão, ELEVAMENTE" },
            { aba:"LISTA PRESENÇA",   desc:"Presenças em mentorias e cursos Elevamente",            campos:"Data, RE, Nome, Evento, Presença" },
            { aba:"FORM. MENTORIA",   desc:"Respostas do formulário de mentoria",                   campos:"Data, RE, Acompanhante, Causa, Comprometimento" },
          ].map(x=>(
            <div key={x.aba} style={{ background:C.bg,borderRadius:10,padding:14 }}>
              <div style={{ fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:.5,color:C.accent,marginBottom:6 }}>{x.aba}</div>
              <div style={{ fontSize:12,color:C.text,marginBottom:4 }}>{x.desc}</div>
              <div style={{ fontSize:11,color:C.muted }}>{x.campos}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop:16,padding:14,background:`${C.gold}10`,border:`1px solid ${C.gold}25`,borderRadius:10,fontSize:12 }}>
          💡 <strong style={{ color:C.gold }}>Dica:</strong> Os nomes das abas e colunas não precisam ser exatos — o sistema detecta automaticamente por similaridade. Mas quanto mais próximo do padrão, melhor a detecção.
        </div>
      </div>
    </div>
  );
};

// ─── PARÂMETROS FINANCEIROS PADRÃO ────────────────────────────────────────────
const CUSTOS_PADRAO = {
  // Valor diário por função (salário mensal ÷ 30)
  valorDiaMOT:    136.08,   // Motorista
  valorDiaCOB:    120.00,   // Cobrador
  valorDiaFISC:   150.00,   // Fiscal
  valorDiaCOORD:  180.00,   // Coordenador
  // Benefícios
  valorVR:         38.28,   // Vale Refeição diário
  valorVT:         12.00,   // Vale Transporte (economia p/ empresa em falta)
  // Custos operacionais
  valorHoraExtra:  25.00,   // Hora extra do substituto por falta
  horasSubst:       8,      // Horas de substituição por dia de falta
  taxaAdmMulta:    50.00,   // Custo administrativo por auto de infração
  // Encargos (% sobre valor do dia)
  percFGTS:         8.00,   // FGTS sobre dias de férias perdidos
  perc13:           8.33,   // 13º proporcional perdido por falta (1/12 meses)
};

// Retorna valor diário correto pela função do operador
function getValorDia(funcao, custos) {
  const f = (funcao||"").toUpperCase();
  if (f.includes("COB"))   return custos.valorDiaCOB   || custos.valorDiaMOT;
  if (f.includes("FISC"))  return custos.valorDiaFISC  || custos.valorDiaMOT;
  if (f.includes("COORD")) return custos.valorDiaCOORD || custos.valorDiaMOT;
  return custos.valorDiaMOT || 136.08;
}

// ─── FINANCIAL HELPERS ────────────────────────────────────────────────────────
const calcDSR = (f) => Math.round(f * 0.70);
const calcFeriasPerdidas = (f) => f<=5?0:f<=14?6:f<=23?12:f<=32?18:30;
const fmtBRL = (v) => (v||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});

function calcPerdaFinanceira(op, custos) {
  const valorDiario = getValorDia(op.funcao, custos);
  const { valorVR, valorVT, valorHoraExtra, horasSubst, taxaAdmMulta, percFGTS, perc13 } = custos;
  const faltas    = op.faltas    || 0;
  const atestados = op.atestados || 0;
  const suspensoes= op.suspensoes|| 0;
  const multasQtd = op.multas    || 0;
  const multasVal = op.multasValor || 0;
  const dsr       = calcDSR(faltas);
  const ferPerd   = calcFeriasPerdidas(faltas);
  const valorAbono= parseFloat((valorDiario/3).toFixed(2));
  const custSubst = (valorHoraExtra||0) * (horasSubst||8);
  const vfgts     = parseFloat(((percFGTS||0)/100 * valorDiario * ferPerd).toFixed(2));
  const v13       = parseFloat(((perc13||0)/100 * valorDiario * faltas).toFixed(2));

  const itens = [
    { desc:"Faltas — desconto do dia",                                   qtd:faltas,    un:"Dia (função)",   valorUn:valorDiario,         total:faltas*valorDiario,       tipo:"falta"   },
    { desc:"DSR por faltas (máx. 4/mês)",                                qtd:dsr,       un:"Dia (DSR)",      valorUn:valorDiario,         total:dsr*valorDiario,          tipo:"dsr"     },
    { desc:`Férias perdidas (${faltas} faltas → perde ${ferPerd} dias)`, qtd:ferPerd,   un:"Dia (férias)",   valorUn:valorDiario,         total:ferPerd*valorDiario,      tipo:"ferias"  },
    { desc:"Abono de férias (1/3) sobre dias perdidos",                  qtd:ferPerd,   un:"1/3 do dia",     valorUn:valorAbono,          total:ferPerd*valorAbono,       tipo:"abono"   },
    { desc:"Atestados — perda VR",                                       qtd:atestados, un:"VR/dia",         valorUn:valorVR||0,          total:atestados*(valorVR||0),   tipo:"vr"      },
    { desc:"Faltas — perda VT (economia empresa)",                       qtd:faltas,    un:"VT/dia",         valorUn:valorVT||0,          total:faltas*(valorVT||0),      tipo:"vt"      },
    { desc:"Custo de substituição (horas extras)",                        qtd:faltas,    un:"Subst/dia",      valorUn:custSubst,           total:faltas*custSubst,         tipo:"subst"   },
    { desc:"Suspensões — dias parados (custo produtivo)",                qtd:suspensoes,un:"Dia (suspenso)", valorUn:valorDiario,         total:suspensoes*valorDiario,   tipo:"suspensao"},
    { desc:`13º proporcional perdido pelas faltas (${perc13||0}%/falta)`,qtd:faltas,    un:"% do dia",       valorUn:v13>0?v13/faltas:0,  total:v13,                      tipo:"13o"     },
    { desc:`FGTS sobre férias perdidas (${percFGTS||0}%)`,               qtd:ferPerd,   un:"% do dia",       valorUn:ferPerd>0?vfgts/ferPerd:0, total:vfgts,             tipo:"fgts"    },
  ];
  if (multasVal > 0) itens.push({
    desc:"Multas SPTrans — valor das infrações",  qtd:multasQtd,  un:"Auto",  valorUn:multasQtd>0?multasVal/multasQtd:0, total:multasVal, tipo:"multa"
  });
  if (multasQtd > 0 && (taxaAdmMulta||0) > 0) itens.push({
    desc:"Custo administrativo por auto de infração", qtd:multasQtd, un:"Auto", valorUn:taxaAdmMulta, total:multasQtd*taxaAdmMulta, tipo:"admulta"
  });

  const totalGeral = itens.reduce((a,x)=>a+(x.total||0),0);
  return { itens, totalGeral, dsr, ferPerd, valorDiario };
}

// ─── MOCK DATA FOR FICHA ─────────────────────────────────────────────────────
const RELATOS_MOCK = {
  "RE5319": [
    { data:"10/Jan/25", acompanhante:"Esposa",  comprometimento:4, causa:"Problemas familiares — conflito conjugal afetando concentração no trabalho.", setor:"Psicologia", relato:"Operador demonstrou abertura para conversa. Relatou brigas frequentes em casa desde novembro. Esposa presente concordou em buscar apoio psicológico do casal.", denuncia:false },
    { data:"10/Fev/25", acompanhante:"Sozinho", comprometimento:4, causa:"Acompanhamento pós mentoria — evolução positiva.", setor:"–",         relato:"Operador retornou para acompanhamento. Relata melhora no ambiente familiar após sessões com psicólogo. Comprometimento mantido.", denuncia:false },
    { data:"10/Mar/25", acompanhante:"Esposa",  comprometimento:5, causa:"Encerramento do ciclo — melhora consolidada.",                         setor:"–",         relato:"Resultado positivo. Faltas reduziram de 4/semana para 0. Esposa confirmou melhora no clima familiar. Operador agradeceu o programa.", denuncia:false },
  ],
  "RE4201": [
    { data:"22/Jan/25", acompanhante:"Sozinho", comprometimento:2, causa:"Dívidas financeiras — empréstimo consignado comprometendo renda.",      setor:"RH",        relato:"Operador resistente no início. Revelou dívidas que comprometem 70% do salário. Nega problemas pessoais além do financeiro. Encaminhado para RH para orientação de crédito.", denuncia:false },
    { data:"22/Fev/25", acompanhante:"Sozinho", comprometimento:1, causa:"Piora do quadro — dívidas acumuladas, postura defensiva.",              setor:"Jurídico",  relato:"Operador não implementou nenhuma das orientações. Novo empréstimo contraído. Postura hostil durante a mentoria. Caso encaminhado para análise jurídica.", denuncia:false },
  ],
  "RE3887": [
    { data:"05/Fev/25", acompanhante:"Mãe",    comprometimento:5, causa:"Problemas de saúde — diagnóstico de ansiedade não tratada.",            setor:"Ambulatório",relato:"Mãe participativa. Operador relatou crises de ansiedade frequentes que causam faltas. Nunca buscou tratamento por falta de tempo/dinheiro. Encaminhado ao ambulatório da empresa.", denuncia:false },
  ],
};

const ENCAMINHAMENTOS_MOCK = {
  "RE5319": [
    { area:"Psicologia", icon:"🧠", data:"10/Jan/25", status:"concluido", descricao:"Terapia de casal — 8 sessões", retorno:"Casal completou as sessões. Psicólogo reporta melhora significativa na comunicação. Alta em 15/Mar/25.", cor:C.purple },
  ],
  "RE4201": [
    { area:"RH",        icon:"👔", data:"22/Jan/25", status:"concluido", descricao:"Orientação sobre renegociação de dívidas consignadas", retorno:"Orientação realizada em 30/Jan. Operador não seguiu as recomendações.", cor:C.accent2 },
    { area:"Jurídico",  icon:"⚖️", data:"22/Fev/25", status:"andamento", descricao:"Análise de comportamento disciplinar reincidente",    retorno:"Processo em análise. Aguarda parecer final.", cor:C.orange },
  ],
  "RE3887": [
    { area:"Ambulatório",icon:"🏥",data:"05/Fev/25", status:"concluido", descricao:"Avaliação e tratamento de ansiedade",                retorno:"Operador iniciou tratamento com ansiolítico. Evolução positiva relatada em retorno de 01/Mar.", cor:C.green },
  ],
};

// Gera timeline de eventos mockada para operadores sem dados reais
const buildMockTimeline = (op) => {
  const evs = [];
  const now = new Date();
  for (let i = op.faltas; i > 0; i--) {
    const d = new Date(now); d.setDate(d.getDate() - i * 7 - Math.floor(Math.random()*5));
    evs.push({ data:d.toLocaleDateString("pt-BR"), ev:"F", label:"Falta", historico:"Falta sem justificativa" });
  }
  for (let i = op.multas; i > 0; i--) {
    const d = new Date(now); d.setDate(d.getDate() - i * 9 - Math.floor(Math.random()*4));
    evs.push({ data:d.toLocaleDateString("pt-BR"), ev:"M", label:"Multa", historico:"Infração de trânsito registrada" });
  }
  for (let i = op.suspensoes||0; i > 0; i--) {
    const d = new Date(now); d.setDate(d.getDate() - i * 14);
    evs.push({ data:d.toLocaleDateString("pt-BR"), ev:"S", label:"Suspensão", historico:"Suspensão disciplinar" });
  }
  if (op.dataMentoria) {
    const [d2,m2,y2] = op.dataMentoria.split(/[/]/).map(Number);
    const md = new Date(2000+y2, m2-1, d2);
    evs.push({ data:op.dataMentoria, ev:"+", label:"Mentoria", historico:"Participação no programa Elevamente" });
  }
  return evs.sort((a,b) => {
    const pa = a.data.split("/").reverse().join(""), pb = b.data.split("/").reverse().join("");
    return pa.localeCompare(pb);
  });
};

const EV_COLOR = { "F":C.red, "M":C.orange, "S":C.red, "T":C.muted, "O":C.orange,
  "G":C.muted, "+":C.green, "~":C.accent2, "]":C.muted, "E":C.muted, "Z":C.green, "N":C.muted };

const buildEvolutionData = (timeline, dataMentoria) => {
  if (!timeline.length) return [];
  const parseDate = (s) => {
    const p = s.split("/"); if (p.length<3) return null;
    return new Date(p[2].length===2?2000+parseInt(p[2]):parseInt(p[2]), parseInt(p[1])-1, parseInt(p[0]));
  };
  const mentDate = dataMentoria ? parseDate(dataMentoria) : null;
  if (!mentDate) return [];
  const weeks = {};
  timeline.forEach(ev => {
    const d = parseDate(ev.data);
    if (!d) return;
    const diff = Math.round((d - mentDate) / (7*24*3600*1000));
    const key = diff===0 ? "M" : diff<0 ? `${diff}` : `+${diff}`;
    if (!weeks[key]) weeks[key] = { sem:key, f:0, m:0, s:0 };
    if (ev.ev==="F") weeks[key].f++;
    if (ev.ev==="M") weeks[key].m++;
    if (ev.ev==="S") weeks[key].s++;
  });
  const order = (k) => k==="M"?0:parseInt(k);
  return Object.values(weeks).sort((a,b)=>order(a.sem)-order(b.sem));
};

// ─── PDF GENERATORS ───────────────────────────────────────────────────────────
async function gerarPDFFicha(op, perda, evTipoList, totalEvs, evMesList, multasDet, multasVal, relatos, encamins, custos) {
  const JsPDF = await loadJsPDF();
  const doc = new JsPDF({ orientation:"portrait", unit:"mm", format:"a4" });
  const W = doc.internal.pageSize.getWidth();
  let y = 14;

  const addTitle = (txt, size=11, color=[0,60,120]) => {
    doc.setFontSize(size); doc.setTextColor(...color); doc.setFont(undefined,"bold");
    doc.text(txt, 14, y); y+=6;
  };
  const addLine = (label, value, indent=14) => {
    doc.setFontSize(9); doc.setFont(undefined,"bold"); doc.setTextColor(60,60,60);
    doc.text(label+":", indent, y);
    doc.setFont(undefined,"normal"); doc.setTextColor(0,0,0);
    doc.text(String(value||"-"), indent+50, y); y+=5;
  };
  const addSection = (title) => {
    y+=3;
    doc.setFillColor(230,240,255); doc.rect(14, y-4, W-28, 7, "F");
    doc.setFontSize(10); doc.setFont(undefined,"bold"); doc.setTextColor(0,60,120);
    doc.text("■ "+title, 16, y); y+=7;
  };
  const checkPage = (need=20) => { if(y+need > doc.internal.pageSize.getHeight()-14){ doc.addPage(); y=14; }};

  // Header
  doc.setFillColor(10,40,80); doc.rect(0,0,W,22,"F");
  doc.setFontSize(14); doc.setFont(undefined,"bold"); doc.setTextColor(255,255,255);
  doc.text("PERFIL DO OPERADOR - Relatorio Gerencial", 14, 10);
  doc.setFontSize(9); doc.setFont(undefined,"normal"); doc.setTextColor(180,210,255);
  doc.text(`RE ${op.re}  ·  ${op.nome}  ·  Gerado em ${new Date().toLocaleString("pt-BR")}  ·  Uso restrito - Diretoria`, 14, 17);
  y = 28;

  // Identificacao
  addSection("IDENTIFICACAO DO OPERADOR");
  const info = [["RE (NoREG)",op.re],["Funcao",op.funcao],["Nome",op.nome],["Garagem",op.garagem],["Admissao",op.admissao],["Status",op.status]];
  doc.autoTable({ startY:y, head:[["Campo","Valor","Campo","Valor"]], body:[
    [info[0][0],info[0][1],info[1][0],info[1][1]],
    [info[2][0],info[2][1],info[3][0],info[3][1]],
    [info[4][0],info[4][1],info[5][0],info[5][1]],
  ], theme:"grid", headStyles:{fillColor:[0,60,120],textColor:255,fontSize:8}, bodyStyles:{fontSize:9}, margin:{left:14,right:14}, tableWidth:W-28 });
  y = doc.lastAutoTable.finalY + 6;

  // Leitura gerencial
  checkPage(20);
  addSection("PERFIL DO OPERADOR - LEITURA GERENCIAL");
  const pontosAtencao=[];
  if((op.faltas||0)>=10) pontosAtencao.push(`faltas (${op.faltas} dia(s))`);
  if(multasVal>0) pontosAtencao.push(`multas (${multasDet.length} auto(s), total ${fmtBRL(multasVal)})`);
  if((op.suspensoes||0)>=1) pontosAtencao.push(`suspensoes (${op.suspensoes})`);
  if((op.acidentes||0)>=1) pontosAtencao.push(`acidentes com responsabilidade`);
  if(!op.dataMentoria) pontosAtencao.push("ausencia de mentorias registradas");
  const leitura = `Operador com tempo de casa referenciado. Foram identificados ${totalEvs} evento(s) na base de prontuarios${evTipoList.length?`, com distribuicao: ${evTipoList.map(e=>`${e.ev}=${e.qtd}`).join("; ")}.`:"."} ${pontosAtencao.length?"Pontos de atencao: "+pontosAtencao.join(", ")+".":""} Perda financeira estimada: ${fmtBRL(perda.totalGeral)}.`;
  doc.setFontSize(9); doc.setFont(undefined,"normal"); doc.setTextColor(40,40,40);
  const split = doc.splitTextToSize(leitura, W-28);
  doc.text(split, 14, y); y+=split.length*4.5+4;

  // Eventos por tipo
  checkPage(30);
  addSection("EVENTOS POR TIPO (EV) - CONTAGEM");
  doc.autoTable({ startY:y,
    head:[["EV","Descricao do EV","Quantidade"]],
    body:[...evTipoList.map(e=>[e.ev, e.label||e.ev, e.qtd]),["","TOTAL GERAL",totalEvs]],
    theme:"striped", headStyles:{fillColor:[0,60,120],textColor:255,fontSize:9},
    bodyStyles:{fontSize:9}, margin:{left:14,right:14}, tableWidth:W-28,
    foot:[["","TOTAL GERAL",totalEvs]], footStyles:{fontStyle:"bold",fillColor:[230,240,255]} });
  y = doc.lastAutoTable.finalY + 6;

  // Eventos por mes
  if(evMesList.length>0){
    checkPage(40);
    addSection("EVENTOS POR MES/ANO");
    doc.autoTable({ startY:y, head:[["Mes/Ano","F","M","S","T","Total"]],
      body:[...evMesList.map(m=>[m.mes,m.F||0,m.M||0,m.S||0,m.T||0,m.total||0]),
        ["TOTAL GERAL",evMesList.reduce((a,m)=>a+(m.F||0),0),evMesList.reduce((a,m)=>a+(m.M||0),0),evMesList.reduce((a,m)=>a+(m.S||0),0),evMesList.reduce((a,m)=>a+(m.T||0),0),totalEvs]],
      theme:"striped", headStyles:{fillColor:[0,60,120],textColor:255,fontSize:9},
      bodyStyles:{fontSize:9}, margin:{left:14,right:14}, tableWidth:W-28 });
    y = doc.lastAutoTable.finalY + 6;
  }

  // Multas
  checkPage(30);
  addSection("AUTOS DE INFRACAO - BASE DE MULTAS");
  if(multasDet.length===0){
    doc.setFontSize(9); doc.setTextColor(80,80,80);
    doc.text("Nao ha autos de infracao registrados.", 14, y); y+=8;
  } else {
    doc.autoTable({ startY:y, head:[["Data","Linha","Descricao","Enquadramento","Valor (R$)"]],
      body:[...multasDet.map(m=>[m.data,m.linha,m.descricao,m.enquadramento,fmtBRL(m.valor)]),
        ["","","","Total em multas:",fmtBRL(multasVal)]],
      theme:"grid", headStyles:{fillColor:[0,60,120],textColor:255,fontSize:8},
      bodyStyles:{fontSize:8.5}, margin:{left:14,right:14}, tableWidth:W-28 });
    y = doc.lastAutoTable.finalY + 6;
  }

  // Perda financeira
  doc.addPage(); y=14;
  addSection("PERDA FINANCEIRA");
  doc.autoTable({ startY:y,
    head:[["Descricao","Qtd.","Item","Valor Un. (R$)","Total Perda (R$)"]],
    body:[...perda.itens.map(i=>[i.desc,i.qtd,i.un,fmtBRL(i.valorUn),fmtBRL(i.total)]),
      ["","","","TOTAL GERAL:",fmtBRL(perda.totalGeral)]],
    theme:"grid", headStyles:{fillColor:[0,60,120],textColor:255,fontSize:8},
    bodyStyles:{fontSize:8.5}, margin:{left:14,right:14}, tableWidth:W-28,
    footStyles:{fontStyle:"bold"} });
  y = doc.lastAutoTable.finalY + 6;

  // Regra ferias
  checkPage(20);
  doc.setFontSize(8); doc.setTextColor(80,80,80); doc.setFont(undefined,"italic");
  doc.text("Regra (faltas × ferias): Ate 5→30d · 6-14→24d (perde 6) · 15-23→18d (perde 12) · 24-32→12d (perde 18) · 33+→0d (perde 30).", 14, y); y+=8;

  // Parametros usados
  checkPage(20);
  addSection("PARAMETROS UTILIZADOS NO CALCULO");
  doc.autoTable({ startY:y, head:[["Parametro","Valor"]],
    body:[
      ["Valor diario ("+op.funcao+")", fmtBRL(perda.valorDiario)],
      ["Vale Refeicao (VR/dia)", fmtBRL(custos.valorVR)],
      ["Vale Transporte (VT/dia)", fmtBRL(custos.valorVT||0)],
      ["Hora extra substituto", fmtBRL(custos.valorHoraExtra||0)],
      ["FGTS sobre ferias (%)", (custos.percFGTS||0)+"%"],
      ["13º proporcional (%)", (custos.perc13||0)+"%"],
    ], theme:"striped", headStyles:{fillColor:[0,60,120],textColor:255,fontSize:8},
    bodyStyles:{fontSize:9}, margin:{left:14,right:14}, tableWidth:W-28 });
  y = doc.lastAutoTable.finalY + 6;

  // Mentorias
  if(relatos.length>0){
    doc.addPage(); y=14;
    addSection("RELATORIO DE MENTORIAS");
    relatos.forEach((r,i)=>{
      checkPage(30);
      doc.setFontSize(9); doc.setFont(undefined,"bold"); doc.setTextColor(0,60,120);
      doc.text(`Sessao ${i+1} - ${r.data} · ${r.tipoAcomp||"Sozinho"}: ${r.acompanhante||"-"} · Comprometimento: ${r.comprometimento}/5`, 14, y); y+=5;
      doc.setFont(undefined,"bold"); doc.setTextColor(60,60,60); doc.text("Causa:", 14, y);
      doc.setFont(undefined,"normal"); doc.setTextColor(0,0,0);
      const cs=doc.splitTextToSize(r.causa||"-", W-28); doc.text(cs,14,y+4); y+=cs.length*4+6;
      checkPage(20);
      doc.setFont(undefined,"bold"); doc.setTextColor(60,60,60); doc.text("Relato:", 14, y);
      doc.setFont(undefined,"normal"); doc.setTextColor(0,0,0);
      const rs=doc.splitTextToSize(r.relato||"-", W-28); doc.text(rs,14,y+4); y+=rs.length*4+8;
    });
  }

  // Footer every page
  const pageCount = doc.internal.getNumberOfPages();
  for(let i=1;i<=pageCount;i++){
    doc.setPage(i);
    doc.setFontSize(7); doc.setTextColor(150,150,150); doc.setFont(undefined,"normal");
    doc.text(`Gerado em ${new Date().toLocaleString("pt-BR")} - Sistema: Elevamente (IA)`, 14, doc.internal.pageSize.getHeight()-8);
    doc.text(`Pagina ${i} de ${pageCount}`, W-30, doc.internal.pageSize.getHeight()-8);
    doc.text("Uso restrito - Diretoria", W/2, doc.internal.pageSize.getHeight()-8, {align:"center"});
  }

  doc.save(`Ficha_${op.re}_${op.nome.split(" ")[0]}_${new Date().toLocaleDateString("pt-BR").replace(/\//g,"-")}.pdf`);
}

async function gerarPDFRelatorio(data, sessions, tratativas, custos) {
  const JsPDF = await loadJsPDF();
  const doc = new JsPDF({ orientation:"landscape", unit:"mm", format:"a4" });
  const W = doc.internal.pageSize.getWidth();
  let y = 14;
  const ops = data.operators||[];
  const checkPage = (need=20) => { if(y+need > doc.internal.pageSize.getHeight()-14){ doc.addPage(); y=14; }};

  // Header
  doc.setFillColor(10,40,80); doc.rect(0,0,W,22,"F");
  doc.setFontSize(16); doc.setFont(undefined,"bold"); doc.setTextColor(255,255,255);
  doc.text("ELEVAMENTE - Relatorio Gerencial", 14, 12);
  doc.setFontSize(9); doc.setFont(undefined,"normal"); doc.setTextColor(180,210,255);
  doc.text(`Gerado em ${new Date().toLocaleString("pt-BR")}  ·  Uso restrito - Diretoria`, 14, 19);
  y=28;

  // KPIs
  const total=ops.length, emM=ops.filter(o=>o.status==="mentoria").length;
  const melh=ops.filter(o=>o.resultado==="melhora").length, pior=ops.filter(o=>o.resultado==="piora").length;
  const taxa=emM>0?Math.round(melh/emM*100):0;
  const perdaTotal=ops.reduce((acc,op)=>{const f=op.faltas||0,at=op.atestados||0,vd=getValorDia(op.funcao,custos),dsr=Math.round(f*0.70),fp=f<=5?0:f<=14?6:f<=23?12:f<=32?18:30;return acc+(f*vd)+(dsr*vd)+(fp*vd)+(fp*(vd/3))+(at*(custos.valorVR||0))+(op.multasValor||0);},0);

  doc.autoTable({ startY:y, head:[["Indicador","Valor","Indicador","Valor"]],
    body:[
      ["Total Operadores",total,"Em Mentoria",emM],
      ["Melhoraram",melh,"Pioraram",pior],
      ["Taxa de Melhora",taxa+"%","Total Sessoes",sessions.length],
      ["Perda Total Estimada",fmtBRL(perdaTotal),"Total Tratativas",tratativas.length],
    ], theme:"grid", headStyles:{fillColor:[0,60,120],textColor:255,fontSize:9},
    bodyStyles:{fontSize:10,fontStyle:"bold"}, margin:{left:14,right:14}, tableWidth:W-28 });
  y=doc.lastAutoTable.finalY+8;

  // Ranking
  doc.addPage(); y=14;
  doc.setFontSize(12); doc.setFont(undefined,"bold"); doc.setTextColor(0,60,120);
  doc.text("■ Ranking de Operadores por Risco", 14, y); y+=7;
  const ranking=[...ops].map(op=>{const score=(op.faltas||0)*3+(op.multas||0)*2+(op.suspensoes||0)*5+(op.acidentes||0)*4;return{...op,score};}).sort((a,b)=>b.score-a.score).slice(0,15);
  doc.autoTable({ startY:y, head:[["#","RE","Nome","Garagem","Funcao","Faltas","Multas","Susp","Acid","Score","Status","Perda Est. (R$)"]],
    body:ranking.map((op,i)=>{const f=op.faltas||0,at=op.atestados||0,vd=getValorDia(op.funcao,custos),dsr=Math.round(f*0.70),fp=f<=5?0:f<=14?6:f<=23?12:f<=32?18:30;const perda=f*vd+dsr*vd+fp*vd+fp*(vd/3)+at*(custos.valorVR||0)+(op.multasValor||0);return[i+1,op.re,op.nome,op.garagem,op.funcao,op.faltas||0,op.multas||0,op.suspensoes||0,op.acidentes||0,op.score,op.status,fmtBRL(perda)];}),
    theme:"striped", headStyles:{fillColor:[0,60,120],textColor:255,fontSize:8},
    bodyStyles:{fontSize:8}, margin:{left:14,right:14}, tableWidth:W-28 });
  y=doc.lastAutoTable.finalY+8;

  // Tratativas por setor
  doc.addPage(); y=14;
  doc.setFontSize(13); doc.setFont(undefined,"bold"); doc.setTextColor(0,60,120);
  doc.text("■ TRATATIVAS - Resumo por Setor", 14, y); y+=9;

  // Resumo por area
  const setoresStats = Object.values(
    tratativas.reduce((acc,t)=>{
      if(!acc[t.area]) acc[t.area]={area:t.area,total:0,pendente:0,andamento:0,concluido:0};
      acc[t.area].total++;
      acc[t.area][t.status]=(acc[t.area][t.status]||0)+1;
      return acc;
    },{})
  );
  doc.autoTable({
    startY:y,
    head:[["Setor","Total","Pendentes","Em Andamento","Concluidas","% Conclusao"]],
    body:setoresStats.map(s=>[
      s.area,
      s.total,
      s.pendente||0,
      s.andamento||0,
      s.concluido||0,
      s.total>0?Math.round(((s.concluido||0)/s.total)*100)+"%" :"0%"
    ]),
    theme:"grid",
    headStyles:{fillColor:[0,60,120],textColor:255,fontSize:9,fontStyle:"bold"},
    bodyStyles:{fontSize:9},
    columnStyles:{0:{fontStyle:"bold"},5:{fontStyle:"bold"}},
    margin:{left:14,right:14}, tableWidth:W-28
  });
  y = doc.lastAutoTable.finalY+10;
  checkPage(20);

  // Totais gerais
  const totPend = tratativas.filter(t=>t.status==="pendente").length;
  const totAnd  = tratativas.filter(t=>t.status==="andamento").length;
  const totConc = tratativas.filter(t=>t.status==="concluido").length;
  doc.setFontSize(10); doc.setFont(undefined,"normal"); doc.setTextColor(50,50,50);
  doc.text(`Total geral: ${tratativas.length}  |  Pendentes: ${totPend}  |  Em Andamento: ${totAnd}  |  Concluidas: ${totConc}`, 14, y); y+=10;

  // Tabela detalhada
  checkPage(30);
  doc.setFontSize(11); doc.setFont(undefined,"bold"); doc.setTextColor(0,60,120);
  doc.text("■ TRATATIVAS - Detalhamento Completo", 14, y); y+=7;
  doc.autoTable({
    startY:y,
    head:[["RE","Nome","Area","Subarea","Data","Prazo","Prioridade","Status","Retorno"]],
    body:tratativas.map(t=>[
      t.re, t.nome, t.area, t.subarea||"-", t.data,
      t.prazo||"-", t.prioridade, t.status, t.retorno?"Sim":"Nao"
    ]),
    theme:"striped",
    headStyles:{fillColor:[0,60,120],textColor:255,fontSize:7,fontStyle:"bold"},
    bodyStyles:{fontSize:7.5},
    didParseCell:(data)=>{
      if(data.column.index===7){
        if(data.cell.raw==="concluido"){data.cell.styles.textColor=[16,185,129];data.cell.styles.fontStyle="bold";}
        if(data.cell.raw==="pendente"){data.cell.styles.textColor=[239,68,68];}
        if(data.cell.raw==="andamento"){data.cell.styles.textColor=[245,158,11];}
      }
    },
    margin:{left:14,right:14}, tableWidth:W-28
  });

  const pageCount=doc.internal.getNumberOfPages();
  for(let i=1;i<=pageCount;i++){
    doc.setPage(i); doc.setFontSize(7); doc.setTextColor(150,150,150);
    doc.text(`Elevamente · Pagina ${i} de ${pageCount}`, W/2, doc.internal.pageSize.getHeight()-6, {align:"center"});
  }
  doc.save(`Elevamente_Relatorio_${new Date().toLocaleDateString("pt-BR").replace(/\//g,"-")}.pdf`);
}

// ─── MOCK MULTAS DETAIL ───────────────────────────────────────────────────────
const MULTAS_DETAIL_MOCK = {
  "RE5319":[
    {data:"27/02/25",linha:"967A",descricao:"Cinto de seguranca inoperante",enquadramento:"M40",valor:225.00},
    {data:"11/03/25",linha:"967A",descricao:"Farol vermelho",enquadramento:"GR37",valor:900.00},
    {data:"13/03/25",linha:"967A",descricao:"Cinto de seguranca inoperante",enquadramento:"M40",valor:225.00},
    {data:"14/03/25",linha:"967A",descricao:"Cinto de seguranca inoperante",enquadramento:"M40",valor:225.00},
  ],
  "RE4201":[
    {data:"05/03/25",linha:"203",descricao:"Avanco de sinal vermelho",enquadramento:"Art.208",valor:293.47},
    {data:"12/03/25",linha:"203",descricao:"Uso de celular ao volante",enquadramento:"Art.252-I",valor:293.47},
  ],
};

// ─── FICHA PAGE ───────────────────────────────────────────────────────────────
const FichaPage = ({ op, onBack, globalCustos, onSaveCustos }) => {
  const [tab, setTab]               = useState("resumo");
  const [custos, setCustos]         = useState(globalCustos || CUSTOS_PADRAO);
  const [editCustos, setEditCustos] = useState(false);
  const fichaRef                    = useRef();

  // keep in sync if globalCustos changes
  useEffect(()=>{ if(globalCustos) setCustos(globalCustos); },[globalCustos]);

  if (!op) return (
    <div style={{textAlign:"center",padding:"60px 0",opacity:.5}}>
      <div style={{fontSize:48,marginBottom:12}}>📋</div>
      <div style={{fontFamily:"'Inter',sans-serif",fontSize:18,fontWeight:700}}>Nenhum operador selecionado</div>
      <div style={{color:C.muted,fontSize:13,marginTop:6}}>Acesse a lista de operadores e clique em "Ver Ficha"</div>
      <button className="abt" style={{marginTop:16}} onClick={onBack}>← Ver Operadores</button>
    </div>
  );

  const ac        = avatarColor(op.re);
  const stl       = STATUS_LABEL[op.status];
  const res       = op.resultado ? RESULTADO_LABEL[op.resultado] : null;
  const relatos   = RELATOS_MOCK[op.re]  || [];
  const encamins  = ENCAMINHAMENTOS_MOCK[op.re] || [];
  const multasDet = op.multasDetalhes || MULTAS_DETAIL_MOCK[op.re] || [];
  const multasVal = multasDet.reduce((a,m)=>a+(m.valor||0),0);
  const opEnriched= {...op, multasValor: multasVal};
  const timeline  = op.timeline?.length ? op.timeline : buildMockTimeline(op);
  const evChart   = buildEvolutionData(timeline, op.dataMentoria);
  const perda     = calcPerdaFinanceira(opEnriched, custos);
  const compColor = !op.comprometimento?C.muted:op.comprometimento>=4?C.green:op.comprometimento>=3?C.gold:C.red;

  // Admission time
  const admDate = op.admissao ? (()=>{const p=op.admissao.split("/");return p.length===3?new Date(p[2].length===2?2000+parseInt(p[2]):parseInt(p[2]),parseInt(p[1])-1,parseInt(p[0])):null;})() : null;
  const tempoCasa = admDate ? ((new Date()-admDate)/(365.25*24*3600*1000)).toFixed(1)+" anos" : "-";

  // Events aggregations
  const evTipo={};
  timeline.forEach(ev=>{if(!evTipo[ev.ev])evTipo[ev.ev]={ev:ev.ev,label:ev.label||EV_LABELS[ev.ev]||ev.ev,qtd:0};evTipo[ev.ev].qtd++;});
  const evTipoList=Object.values(evTipo).sort((a,b)=>b.qtd-a.qtd);
  const totalEvs=evTipoList.reduce((a,e)=>a+e.qtd,0);

  const evByMes={};
  timeline.forEach(ev=>{
    const parts=ev.data.split("/");if(parts.length<3)return;
    const key=`${parts[1].padStart(2,"0")}/${parts[2].slice(-2)}`;
    if(!evByMes[key])evByMes[key]={mes:key,F:0,M:0,S:0,T:0,total:0};
    if(["F","M","S","T"].includes(ev.ev)){evByMes[key][ev.ev]=(evByMes[key][ev.ev]||0)+1;}
    evByMes[key].total++;
  });
  const evMesList=Object.entries(evByMes).sort((a,b)=>a[0].localeCompare(b[0])).map(([,v])=>v);

  // Auto narrative
  const pontosAtencao=[];
  if(op.faltas>=10)pontosAtencao.push(`faltas (${op.faltas} dia(s) + ${perda.dsr} DSR)`);
  if(multasVal>0)pontosAtencao.push(`multas SPTrans (${multasDet.length} auto(s), total ${fmtBRL(multasVal)})`);
  if((op.suspensoes||0)>=1)pontosAtencao.push(`suspensoes (${op.suspensoes})`);
  if(op.acidentes>=1)pontosAtencao.push(`acidentes com responsabilidade (${op.acidentes})`);
  if(!op.dataMentoria)pontosAtencao.push("ausencia de mentorias registradas");
  const leituraGerencial=`Operador com tempo de casa de ${tempoCasa}. Foram identificados ${totalEvs} evento(s) na base de prontuarios${evTipoList.length?`, com distribuicao: ${evTipoList.map(e=>`${e.ev}=${e.qtd}`).join("; ")}.`:"."} ${pontosAtencao.length?"Pontos de atencao: "+pontosAtencao.join(", ")+".":""} Perda financeira estimada: ${fmtBRL(perda.totalGeral)}.`;

  const CT2=({active,payload,label})=>{
    if(!active||!payload?.length)return null;
    return(<div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 14px",fontSize:12}}>
      <div style={{fontWeight:600,marginBottom:6}}>{label==="M"?"Data da Mentoria":label}</div>
      {payload.map((p,i)=>(<div key={i} style={{display:"flex",alignItems:"center",gap:6,color:C.muted,marginTop:3}}>
        <div style={{width:8,height:8,borderRadius:"50%",background:p.color}}/>{p.name}: <strong style={{color:p.color}}>{p.value}</strong>
      </div>))}
    </div>);
  };

  const TABS=[
    {id:"resumo",    label:"📊 Resumo & Eventos"},
    {id:"financeiro",label:"💰 Perda Financeira"},
    {id:"multas",    label:`⚖️ Multas${multasDet.length>0?" ("+multasDet.length+")":""}`,},
    {id:"timeline",  label:"📅 Timeline"},
    {id:"mentoria",  label:"💬 Mentoria"},
    {id:"tratativas",label:"🔁 Tratativas"},
  ];

  return (
    <div className="fu d1" ref={fichaRef}>
      <style>{`@media print{.sidebar,.topbar,.back-btn,.ficha-tabs,.no-print{display:none!important}.main{margin-left:0!important;padding:12px!important}body{background:white!important;color:#111!important}.card,.ficha-header{background:white!important;border:1px solid #ddd!important;color:#111!important;break-inside:avoid}.card::before{display:none!important}td,th{color:#111!important}}`}</style>

      {/* Top actions */}
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20,flexWrap:"wrap"}} className="no-print">
        <button className="back-btn" style={{margin:0}} onClick={onBack}>← Voltar</button>
        <div style={{flex:1}}/>
        <button className="abt" style={{padding:"8px 16px",background:editCustos?`${C.gold}15`:"",borderColor:editCustos?C.gold:""}}
          onClick={()=>{setEditCustos(e=>!e);setTmpCustos(custos);}}>
          ⚙️ Custos Base {editCustos?"▲":"▼"}
        </button>
        <button style={{background:`${C.purple}18`,color:C.purple,border:`1px solid ${C.purple}40`,borderRadius:8,
          padding:"8px 18px",fontSize:13,fontWeight:600,cursor:"pointer"}}
          onClick={async()=>{try{await gerarPDFFicha(op,perda,evTipoList,totalEvs,evMesList,multasDet,multasVal,relatos,encamins,custos);}catch(e){alert("Erro ao gerar PDF: "+e.message);}}}>
          📄 Gerar PDF
        </button>
      </div>

      {/* Custos config - mini panel redirects to Parametros */}
      {editCustos&&(
        <div className="card no-print" style={{marginBottom:16,borderColor:C.gold,background:`${C.gold}06`}}>
          <div className="ct"><span style={{width:6,height:6,borderRadius:"50%",background:C.gold,flexShrink:0}}/>⚙️ Parametros Financeiros em Uso</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:12}}>
            {[
              {l:"MOT/dia",  v:fmtBRL(custos.valorDiaMOT  ||0)},
              {l:"COB/dia",  v:fmtBRL(custos.valorDiaCOB  ||0)},
              {l:"FISC/dia", v:fmtBRL(custos.valorDiaFISC ||0)},
              {l:"COORD/dia",v:fmtBRL(custos.valorDiaCOORD||0)},
              {l:"VR/dia",   v:fmtBRL(custos.valorVR      ||0)},
              {l:"VT/dia",   v:fmtBRL(custos.valorVT      ||0)},
              {l:"H.Extra",  v:fmtBRL(custos.valorHoraExtra||0)},
              {l:"Tx.Adm",   v:fmtBRL(custos.taxaAdmMulta ||0)},
            ].map(x=>(
              <div key={x.l} style={{background:C.bg,borderRadius:8,padding:"8px 10px",textAlign:"center"}}>
                <div style={{fontSize:10,color:C.muted,marginBottom:2}}>{x.l}</div>
                <div style={{fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:13,color:C.gold}}>{x.v}</div>
              </div>
            ))}
          </div>
          <div style={{fontSize:11,color:C.muted,borderTop:`1px solid ${C.border}`,paddingTop:8,display:"flex",alignItems:"center",gap:8}}>
            💡 Valor diario usado nesta ficha: <strong style={{color:C.accent}}>{fmtBRL(perda.valorDiario)}</strong> ({op.funcao})
            &nbsp;·&nbsp; Para alterar, acesse <strong style={{color:C.gold}}>⚙️ Parametros</strong> no menu lateral.
            <button className="abt" style={{marginLeft:"auto",padding:"5px 12px",fontSize:11}} onClick={()=>setEditCustos(false)}>✕</button>
          </div>
        </div>
      )}

      {/* ── HEADER ── */}
      <div className="ficha-header" style={{marginBottom:16}}>
        <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:2,color:C.muted,marginBottom:10}}>
          PERFIL DO OPERADOR - Relatorio Gerencial (Diretoria) · {op.re}
        </div>
        <div style={{display:"flex",gap:20,alignItems:"flex-start",flexWrap:"wrap"}}>
          <div className="ficha-avatar" style={{background:`${ac}20`,color:ac,border:`2px solid ${ac}40`,width:64,height:64,borderRadius:16,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Inter',sans-serif",fontWeight:800,fontSize:22,flexShrink:0}}>
            {initials(op.nome)}
          </div>
          <div style={{flex:1,minWidth:200}}>
            <div style={{fontFamily:"'Inter',sans-serif",fontSize:22,fontWeight:800,marginBottom:6}}>{op.nome}</div>
            <div style={{display:"flex",gap:12,flexWrap:"wrap",fontSize:13,color:C.muted,marginBottom:10}}>
              <span className="re-tag">{op.re}</span>
              <span>📌 {op.funcao}</span>
              <span>🚌 Garagem {op.garagem}</span>
              <span>📅 Admissao: {op.admissao}</span>
              <span>⏱ {tempoCasa}</span>
            </div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              <span className="pill" style={{color:stl.color,background:stl.bg}}>● {stl.label}</span>
              {res&&<span className="pill" style={{color:res.color,background:res.bg}}>{res.icon} {res.label}</span>}
              {op.dataMentoria
                ?<span style={{fontSize:12,color:C.muted,display:"flex",alignItems:"center",gap:4}}>🎯 Mentoria: <strong style={{color:C.gold}}>{op.dataMentoria}</strong></span>
                :<span style={{fontSize:12,background:`${C.orange}18`,border:`1px solid ${C.orange}30`,borderRadius:6,padding:"2px 10px",color:C.orange}}>⚠️ Sem mentoria registrada</span>
              }
            </div>
          </div>
          {/* Comprometimento */}
          {op.comprometimento&&(
            <div style={{textAlign:"center",background:C.bg,borderRadius:12,padding:"14px 18px",minWidth:90}}>
              <div style={{fontFamily:"'Inter',sans-serif",fontSize:26,fontWeight:800,color:compColor}}>{op.comprometimento}/5</div>
              <div style={{fontSize:10,color:C.muted,marginBottom:6}}>Comprometimento</div>
              <div style={{display:"flex",gap:2,justifyContent:"center"}}>
                {[1,2,3,4,5].map(i=><span key={i} style={{fontSize:14,color:i<=op.comprometimento?C.gold:"#2a3a4a"}}>★</span>)}
              </div>
            </div>
          )}
          {/* Perda financeira destaque */}
          <div style={{textAlign:"center",background:`${C.red}10`,border:`1px solid ${C.red}30`,borderRadius:12,padding:"14px 18px",minWidth:120}}>
            <div style={{fontFamily:"'Inter',sans-serif",fontSize:20,fontWeight:800,color:C.red}}>{fmtBRL(perda.totalGeral)}</div>
            <div style={{fontSize:10,color:C.muted,marginTop:4,lineHeight:1.4}}>Perda financeira<br/>estimada</div>
          </div>
        </div>

        {/* 5 stats */}
        <div className="ficha-grid">
          {[
            {v:op.faltas,       l:"Faltas",      c:op.faltas>=10?C.red:op.faltas>=5?C.orange:C.muted},
            {v:op.multas,       l:"Multas",      c:op.multas>=5?C.red:op.multas>=3?C.orange:C.muted},
            {v:op.suspensoes||0,l:"Suspensoes",  c:(op.suspensoes||0)>=2?C.red:(op.suspensoes||0)>=1?C.orange:C.muted},
            {v:op.atestados||0, l:"Atestados",   c:C.muted},
            {v:op.acidentes,    l:"Acidentes",   c:op.acidentes>=2?C.red:op.acidentes>=1?C.orange:C.muted},
          ].map(s=>(
            <div className="fg-item" key={s.l}>
              <div className="fg-val" style={{color:s.c}}>{s.v}</div>
              <div className="fg-lbl">{s.l}</div>
            </div>
          ))}
        </div>

        {/* Leitura gerencial */}
        <div style={{marginTop:16,padding:"12px 16px",background:C.bg,borderRadius:10,fontSize:12.5,lineHeight:1.8,color:C.muted,borderLeft:`3px solid ${C.accent}`}}>
          <strong style={{color:C.accent,fontSize:11,textTransform:"uppercase",letterSpacing:.8}}>■ Leitura Gerencial · </strong>
          {leituraGerencial}
        </div>
      </div>

      {/* TABS */}
      <div className="ficha-tabs no-print">
        {TABS.map(t=><button key={t.id} className={`ficha-tab ${tab===t.id?"on":""}`} onClick={()=>setTab(t.id)}>{t.label}</button>)}
      </div>

      {/* ══ RESUMO & EVENTOS ══ */}
      {tab==="resumo"&&(
        <div>
          <div className="g2" style={{marginBottom:20}}>
            <div className="card">
              <div className="ct"><span className="ctd"/>Evolucao Semanal (a partir da mentoria)</div>
              {evChart.length>0?(
                <><ResponsiveContainer width="100%" height={190}>
                  <LineChart data={evChart} margin={{left:-10,right:10}}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
                    <XAxis dataKey="sem" tick={{fill:C.muted,fontSize:11}} axisLine={false} tickLine={false}/>
                    <YAxis tick={{fill:C.muted,fontSize:11}} axisLine={false} tickLine={false} allowDecimals={false}/>
                    <Tooltip content={<CT2/>}/>
                    <ReferenceLine x="M" stroke={C.gold} strokeDasharray="4 3" strokeWidth={1.5} label={{value:"Mentoria",position:"insideTopRight",fill:C.gold,fontSize:10}}/>
                    <Line dataKey="f" stroke={C.red}    strokeWidth={2.5} dot={{fill:C.red,r:4,strokeWidth:0}}    name="Faltas"  activeDot={{r:6}}/>
                    <Line dataKey="m" stroke={C.orange} strokeWidth={2.5} dot={{fill:C.orange,r:4,strokeWidth:0}} name="Multas" activeDot={{r:6}}/>
                  </LineChart>
                </ResponsiveContainer>
                <div style={{textAlign:"center",marginTop:6,fontSize:11,color:C.muted}}>Semanas antes (−) e depois (+) da data da mentoria</div></>
              ):(
                <div style={{height:190,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:8,color:C.muted}}>
                  <div style={{fontSize:32}}>📊</div>
                  <div style={{fontSize:13}}>{op.dataMentoria?"Dados insuficientes":"Operador ainda nao passou pela mentoria"}</div>
                </div>
              )}
            </div>
            <div className="card">
              <div className="ct"><span className="ctd"/>■ Eventos por Tipo (EV) - Contagem</div>
              <div className="tw">
                <table>
                  <thead><tr><th>EV</th><th>Descricao do EV</th><th style={{textAlign:"right"}}>Quantidade</th></tr></thead>
                  <tbody>
                    {evTipoList.map(e=>{
                      const cor=EV_COLOR[e.ev]||C.muted;
                      return(<tr key={e.ev}>
                        <td><span style={{fontFamily:"monospace",fontWeight:700,color:cor,background:`${cor}18`,padding:"2px 8px",borderRadius:5,fontSize:12}}>{e.ev}</span></td>
                        <td style={{fontSize:12}}>{e.label}</td>
                        <td style={{textAlign:"right"}}>
                          <div style={{display:"flex",alignItems:"center",gap:8,justifyContent:"flex-end"}}>
                            <div style={{width:60,height:5,background:C.border,borderRadius:3,overflow:"hidden"}}>
                              <div style={{width:`${totalEvs?Math.round(e.qtd/totalEvs*100):0}%`,height:"100%",background:cor,borderRadius:3}}/>
                            </div>
                            <span style={{fontFamily:"'Inter',sans-serif",fontWeight:800,color:cor,minWidth:24}}>{e.qtd}</span>
                          </div>
                        </td>
                      </tr>);
                    })}
                    <tr style={{borderTop:`2px solid ${C.border}`}}>
                      <td colSpan={2} style={{fontWeight:700,paddingTop:10}}>TOTAL GERAL</td>
                      <td style={{textAlign:"right",fontFamily:"'Inter',sans-serif",fontWeight:800,color:C.accent,fontSize:16,paddingTop:10}}>{totalEvs}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Eventos por mes */}
          <div className="card">
            <div className="ct"><span className="ctd"/>■ Eventos por Mes/Ano</div>
            {evMesList.length>0?(
              <>
                <ResponsiveContainer width="100%" height={170}>
                  <BarChart data={evMesList} barSize={11}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
                    <XAxis dataKey="mes" tick={{fill:C.muted,fontSize:11}} axisLine={false} tickLine={false}/>
                    <YAxis tick={{fill:C.muted,fontSize:11}} axisLine={false} tickLine={false}/>
                    <Tooltip content={<CT2/>}/>
                    <Bar dataKey="F" fill={C.red}    radius={[3,3,0,0]} name="Faltas"/>
                    <Bar dataKey="M" fill={C.orange} radius={[3,3,0,0]} name="Multas"/>
                    <Bar dataKey="S" fill={C.purple} radius={[3,3,0,0]} name="Suspensoes"/>
                    <Bar dataKey="T" fill={C.muted}  radius={[3,3,0,0]} name="Atestados"/>
                  </BarChart>
                </ResponsiveContainer>
                <div className="tw" style={{marginTop:12}}>
                  <table>
                    <thead><tr><th>Mes/Ano</th><th style={{textAlign:"center",color:C.red}}>F</th><th style={{textAlign:"center",color:C.orange}}>M</th><th style={{textAlign:"center",color:C.purple}}>S</th><th style={{textAlign:"center"}}>T</th><th style={{textAlign:"right"}}>Total</th></tr></thead>
                    <tbody>
                      {evMesList.map((m,i)=>(
                        <tr key={i}>
                          <td style={{fontWeight:500}}>{m.mes}</td>
                          <td style={{textAlign:"center",color:m.F>0?C.red:C.muted,fontWeight:m.F>0?700:400}}>{m.F||0}</td>
                          <td style={{textAlign:"center",color:m.M>0?C.orange:C.muted,fontWeight:m.M>0?700:400}}>{m.M||0}</td>
                          <td style={{textAlign:"center",color:m.S>0?C.purple:C.muted,fontWeight:m.S>0?700:400}}>{m.S||0}</td>
                          <td style={{textAlign:"center",color:C.muted}}>{m.T||0}</td>
                          <td style={{textAlign:"right",fontFamily:"'Inter',sans-serif",fontWeight:700}}>{m.total}</td>
                        </tr>
                      ))}
                      <tr style={{borderTop:`2px solid ${C.border}`,fontWeight:700}}>
                        <td>TOTAL GERAL</td>
                        <td style={{textAlign:"center",color:C.red,fontFamily:"'Inter',sans-serif",fontWeight:800}}>{evMesList.reduce((a,m)=>a+(m.F||0),0)}</td>
                        <td style={{textAlign:"center",color:C.orange,fontFamily:"'Inter',sans-serif",fontWeight:800}}>{evMesList.reduce((a,m)=>a+(m.M||0),0)}</td>
                        <td style={{textAlign:"center",color:C.purple,fontFamily:"'Inter',sans-serif",fontWeight:800}}>{evMesList.reduce((a,m)=>a+(m.S||0),0)}</td>
                        <td style={{textAlign:"center",color:C.muted,fontFamily:"'Inter',sans-serif",fontWeight:800}}>{evMesList.reduce((a,m)=>a+(m.T||0),0)}</td>
                        <td style={{textAlign:"right",color:C.accent,fontFamily:"'Inter',sans-serif",fontSize:15,fontWeight:800}}>{totalEvs}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </>
            ):(
              <div style={{padding:"24px 0",textAlign:"center",color:C.muted,fontSize:13}}>Nenhum dado disponivel</div>
            )}
          </div>
        </div>
      )}

      {/* ══ PERDA FINANCEIRA ══ */}
      {tab==="financeiro"&&(
        <div>
          <div style={{background:`${C.red}10`,border:`1px solid ${C.red}30`,borderRadius:14,padding:"18px 22px",marginBottom:20,display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"}}>
            <div style={{fontSize:36}}>💸</div>
            <div style={{flex:1}}>
              <div style={{fontFamily:"'Inter',sans-serif",fontSize:14,fontWeight:700,color:C.red,marginBottom:3}}>■ Perda Financeira Total Estimada</div>
              <div style={{fontSize:12,color:C.muted}}>Calculado com base nos eventos registrados. Valores aproximados - utilize os custos reais do contrato coletivo.</div>
            </div>
            <div style={{fontFamily:"'Inter',sans-serif",fontSize:32,fontWeight:800,color:C.red,whiteSpace:"nowrap"}}>{fmtBRL(perda.totalGeral)}</div>
          </div>

          {/* Custos utilizados */}
          <div style={{display:"flex",gap:12,marginBottom:20,flexWrap:"wrap"}}>
            {[{l:"Valor Diario",v:fmtBRL(custos.valorDiario),c:C.accent},{l:"VR / Dia",v:fmtBRL(custos.valorVR),c:C.green},{l:"1/3 Ferias",v:fmtBRL(custos.valorDiario/3),c:C.gold}].map(x=>(
              <div key={x.l} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 16px",flex:1,minWidth:90}}>
                <div style={{fontSize:11,color:C.muted,marginBottom:2}}>{x.l}</div>
                <div style={{fontFamily:"'Inter',sans-serif",fontSize:18,fontWeight:800,color:x.c}}>{x.v}</div>
              </div>
            ))}
            <button className="abt no-print" style={{padding:"10px 16px",alignSelf:"center"}} onClick={()=>setEditCustos(true)}>⚙️ Editar custos</button>
          </div>

          {/* Tabela detalhada */}
          <div className="card" style={{marginBottom:20}}>
            <div className="ct"><span className="ctd"/>Detalhamento da Perda Financeira</div>
            <div className="tw">
              <table>
                <thead><tr><th>Descricao</th><th style={{textAlign:"center"}}>Qtd.</th><th>Item</th><th style={{textAlign:"right"}}>Valor Un.</th><th style={{textAlign:"right"}}>Total Perda</th></tr></thead>
                <tbody>
                  {perda.itens.map((item,i)=>(
                    <tr key={i}>
                      <td style={{fontSize:13}}>{item.desc}</td>
                      <td style={{textAlign:"center",fontFamily:"'Inter',sans-serif",fontWeight:700,color:item.qtd===0?C.muted:item.tipo==="falta"?C.red:item.tipo==="multa"?C.orange:C.text}}>{item.qtd}</td>
                      <td style={{fontSize:12,color:C.muted}}>{item.un}</td>
                      <td style={{textAlign:"right",fontSize:12,color:C.muted}}>{fmtBRL(item.valorUn)}</td>
                      <td style={{textAlign:"right",fontFamily:"'Inter',sans-serif",fontWeight:700,color:item.total===0?C.muted:C.red}}>{fmtBRL(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{borderTop:`2px solid ${C.border}`}}>
                    <td colSpan={4} style={{fontFamily:"'Inter',sans-serif",fontWeight:800,fontSize:14,paddingTop:14}}>TOTAL GERAL</td>
                    <td style={{textAlign:"right",fontFamily:"'Inter',sans-serif",fontWeight:800,fontSize:20,color:C.red,paddingTop:14}}>{fmtBRL(perda.totalGeral)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Regra ferias */}
          <div className="card">
            <div className="ct"><span className="ctd"/>Regra de Ferias por Faltas</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10,marginBottom:14}}>
              {[{min:0,max:5,ferias:30,perda:0},{min:6,max:14,ferias:24,perda:6},{min:15,max:23,ferias:18,perda:12},{min:24,max:32,ferias:12,perda:18},{min:33,max:999,ferias:0,perda:30}].map((f,i)=>{
                const ativo=op.faltas>=f.min&&op.faltas<=f.max;
                return(<div key={i} style={{background:ativo?`${C.red}18`:C.bg,border:`1px solid ${ativo?C.red:C.border}`,borderRadius:10,padding:"12px 14px",textAlign:"center",transition:"all .3s"}}>
                  <div style={{fontSize:11,color:ativo?C.red:C.muted,fontWeight:600,marginBottom:4}}>{f.max>=999?`≥ ${f.min}`:`${f.min}-${f.max}`} faltas</div>
                  <div style={{fontFamily:"'Inter',sans-serif",fontSize:22,fontWeight:800,color:ativo?C.red:C.muted}}>{f.ferias}d</div>
                  <div style={{fontSize:10,color:ativo?C.red:C.muted,marginTop:2}}>{f.perda===0?"Ferias integrais":`Perde ${f.perda} dias`}</div>
                  {ativo&&<div style={{marginTop:6,fontSize:10,fontWeight:700,color:C.red}}>← ATUAL</div>}
                </div>);
              })}
            </div>
            <div style={{fontSize:12,color:C.muted,padding:"10px 14px",background:C.bg,borderRadius:8}}>
              Regra (faltas × ferias): Ate 5→30d · 6-14→24d (perde 6) · 15-23→18d (perde 12) · 24-32→12d (perde 18) · 33+→0d (perde 30). &nbsp;
              Operador possui <strong style={{color:op.faltas>=33?C.red:op.faltas>=15?C.orange:C.gold}}>{op.faltas} falta(s)</strong> → perde <strong style={{color:C.red}}>{perda.ferPerd} dias de ferias</strong>.
            </div>
          </div>
        </div>
      )}

      {/* ══ MULTAS ══ */}
      {tab==="multas"&&(
        <div>
          <div className="card" style={{marginBottom:16}}>
            <div className="ct"><span className="ctd"/>■ Reclamacoes (EV=O)</div>
            {timeline.filter(e=>e.ev==="O").length===0
              ?<div style={{color:C.muted,fontSize:13,padding:"12px 0"}}>✓ Nao ha ocorrencias de reclamacoes de municipe (EV=O) para este operador no periodo.</div>
              :<div className="tw"><table>
                <thead><tr><th>Data</th><th>Descricao</th></tr></thead>
                <tbody>{timeline.filter(e=>e.ev==="O").map((e,i)=><tr key={i}><td style={{color:C.muted,fontSize:12}}>{e.data}</td><td>{e.historico}</td></tr>)}</tbody>
              </table></div>
            }
          </div>
          <div className="card">
            <div className="ct" style={{justifyContent:"space-between",display:"flex"}}>
              <span style={{display:"flex",alignItems:"center",gap:8}}><span className="ctd"/>■ Autos de Infracao - Base de Multas</span>
              {multasVal>0&&<span style={{fontFamily:"'Inter',sans-serif",fontWeight:800,color:C.red,fontSize:15}}>Total: {fmtBRL(multasVal)}</span>}
            </div>
            {multasDet.length===0
              ?<div style={{color:C.muted,fontSize:13,padding:"12px 0"}}>✓ Nenhum auto de infracao registrado para este operador.</div>
              :<div className="tw"><table>
                <thead><tr><th>Data da Infracao</th><th>Linha</th><th>Descricao</th><th>Enquadramento</th><th style={{textAlign:"right"}}>Valor (R$)</th></tr></thead>
                <tbody>
                  {multasDet.map((m,i)=>(
                    <tr key={i}>
                      <td style={{color:C.muted,fontSize:12}}>{m.data}</td>
                      <td style={{fontFamily:"monospace",color:C.accent}}>{m.linha}</td>
                      <td style={{fontSize:12}}>{m.descricao}</td>
                      <td style={{fontSize:12,color:C.orange}}>{m.enquadramento}</td>
                      <td style={{textAlign:"right",fontFamily:"'Inter',sans-serif",fontWeight:700,color:C.red}}>{fmtBRL(m.valor)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot><tr style={{borderTop:`2px solid ${C.border}`}}>
                  <td colSpan={4} style={{fontWeight:700,paddingTop:10}}>Total em multas</td>
                  <td style={{textAlign:"right",fontFamily:"'Inter',sans-serif",fontWeight:800,color:C.red,fontSize:16,paddingTop:10}}>{fmtBRL(multasVal)}</td>
                </tr></tfoot>
              </table></div>
            }
          </div>
        </div>
      )}

      {/* ══ TIMELINE ══ */}
      {tab==="timeline"&&(
        <div className="card">
          <div className="ct"><span className="ctd"/>Historico de Eventos · {timeline.length} registros</div>
          {timeline.length===0&&<div style={{textAlign:"center",padding:"40px 0",color:C.muted}}>Nenhum evento registrado</div>}
          <div className="timeline">
            {[...timeline].reverse().map((ev,i)=>{
              const color=EV_COLOR[ev.ev]||C.muted, isMent=ev.ev==="+";
              return(<div className="tl-item" key={i}>
                <div className="tl-dot" style={{background:color}}/>
                <div className="tl-date">{ev.data}</div>
                <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                  <div className="tl-ev" style={{color,background:`${color}18`,border:`1px solid ${color}30`}}>{isMent?"🎯":ev.ev} {ev.label}</div>
                  {isMent&&<span className="tl-mention">Programa Elevamente</span>}
                </div>
                {ev.historico&&<div className="tl-hist">{ev.historico}</div>}
              </div>);
            })}
          </div>
        </div>
      )}

      {/* ══ MENTORIA ══ */}
      {tab==="mentoria"&&(
        <div>
          {relatos.length===0&&(
            <div className="card" style={{textAlign:"center",padding:"48px 0"}}>
              <div style={{fontSize:40,marginBottom:10}}>💬</div>
              <div style={{fontFamily:"'Inter',sans-serif",fontSize:16,fontWeight:700}}>{op.status==="aguardando"?"Operador ainda nao passou pela mentoria":"Nenhum relato registrado"}</div>
              <div style={{color:C.muted,fontSize:13,marginTop:6}}>{op.status==="aguardando"?"Agende uma mentoria para iniciar o acompanhamento.":"Os relatos aparecerao aqui apos o preenchimento do formulario."}</div>
            </div>
          )}
          {relatos.map((r,i)=>(
            <div className="card" key={i} style={{marginBottom:16,borderLeft:`3px solid ${i===0?C.accent:i===relatos.length-1?C.green:C.gold}`}}>
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14,flexWrap:"wrap"}}>
                <div style={{fontFamily:"'Inter',sans-serif",fontSize:14,fontWeight:700,color:C.accent}}>Sessao {i+1}</div>
                <div style={{fontSize:12,color:C.muted}}>📅 {r.data}</div>
                {r.acompanhante!=="Sozinho"&&<div style={{fontSize:12,background:`${C.accent2}15`,border:`1px solid ${C.accent2}30`,borderRadius:6,padding:"2px 8px",color:C.accent2}}>👥 {r.acompanhante}</div>}
                <div style={{marginLeft:"auto",display:"flex",gap:3,alignItems:"center"}}>
                  {[1,2,3,4,5].map(s=><span key={s} style={{fontSize:15,color:s<=r.comprometimento?C.gold:"#2a3a4a"}}>★</span>)}
                  <span style={{fontSize:12,color:C.muted,marginLeft:4}}>{r.comprometimento}/5</span>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
                <div style={{background:C.bg,borderRadius:10,padding:"12px 14px"}}>
                  <div style={{fontSize:10,color:C.muted,marginBottom:4,textTransform:"uppercase",letterSpacing:.5}}>Causa identificada</div>
                  <div style={{fontSize:13,lineHeight:1.6}}>{r.causa}</div>
                </div>
                <div style={{background:C.bg,borderRadius:10,padding:"12px 14px"}}>
                  <div style={{fontSize:10,color:C.muted,marginBottom:4,textTransform:"uppercase",letterSpacing:.5}}>Encaminhado para</div>
                  <div style={{fontSize:13,fontWeight:600,color:r.setor==="-"?C.muted:C.accent}}>{r.setor}</div>
                </div>
              </div>
              <div style={{background:C.bg,borderRadius:10,padding:"12px 14px"}}>
                <div style={{fontSize:10,color:C.muted,marginBottom:4,textTransform:"uppercase",letterSpacing:.5}}>Relato da sessao</div>
                <div style={{fontSize:13,lineHeight:1.7}}>{r.relato}</div>
              </div>
              {r.denuncia&&<div style={{background:`${C.red}10`,border:`1px solid ${C.red}30`,borderRadius:8,padding:"10px 14px",fontSize:12,color:C.red,marginTop:10}}>⚠️ <strong>Denuncia registrada nesta sessao.</strong></div>}
            </div>
          ))}
        </div>
      )}

      {/* ══ TRATATIVAS ══ */}
      {tab==="tratativas"&&(
        <div>
          {encamins.length===0&&(
            <div className="card" style={{textAlign:"center",padding:"48px 0"}}>
              <div style={{fontSize:40,marginBottom:10}}>🔁</div>
              <div style={{fontFamily:"'Inter',sans-serif",fontSize:16,fontWeight:700}}>Nenhuma tratativa registrada</div>
            </div>
          )}
          {encamins.map((e,i)=>{
            const st={concluido:{label:"Concluido",color:C.green,bg:`${C.green}18`},andamento:{label:"Em andamento",color:C.gold,bg:`${C.gold}18`},pendente:{label:"Pendente",color:C.red,bg:`${C.red}18`}}[e.status];
            return(<div className="enc-card" key={i}>
              <div className="enc-header">
                <div className="enc-icon" style={{background:`${e.cor}20`,border:`1px solid ${e.cor}30`}}>{e.icon}</div>
                <div style={{flex:1}}><div className="enc-area">{e.area}</div><div className="enc-data">📅 {e.data}</div></div>
                <span className="pill" style={{color:st.color,background:st.bg}}>● {st.label}</span>
              </div>
              <div className="enc-desc">📋 {e.descricao}</div>
              {e.retorno&&<div className="enc-retorno"><div style={{fontSize:11,color:C.green,fontWeight:600,marginBottom:4,textTransform:"uppercase",letterSpacing:.5}}>✓ Retorno do setor</div><div style={{fontSize:13}}>{e.retorno}</div></div>}
            </div>);
          })}
          <div style={{textAlign:"center",marginTop:16}}><button className="abt" style={{padding:"10px 24px",fontSize:13}}>+ Registrar Nova Tratativa</button></div>
        </div>
      )}

      {/* Rodape */}
      <div style={{marginTop:24,padding:"12px 0",borderTop:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",fontSize:11,color:C.muted}} className="no-print">
        <span>Gerado em {new Date().toLocaleString("pt-BR")} · Sistema Elevamente</span>
        <span style={{fontStyle:"italic"}}>Uso restrito - Diretoria</span>
      </div>
    </div>
  );
};

// ─── MOCK SESSIONS STORE ─────────────────────────────────────────────────────
const SESSIONS_INIT = [
  { id:1, re:"RE5319", nome:"Carlos A. Mendes",   data:"10/01/25", acompanhante:"Esposa",  tipoAcomp:"Conjuge",  comprometimento:4, causas:["Problemas familiares"], setor:"Psicologia", subsetor:"Psicologo",  relato:"Relata brigas frequentes em casa. Esposa confirmou. Encaminhado para terapia de casal.", denuncia:false, status:"concluido" },
  { id:2, re:"RE4201", nome:"Marcos P. Lima",     data:"22/01/25", acompanhante:"Sozinho", tipoAcomp:"Sozinho",  comprometimento:2, causas:["Financeiro"],          setor:"RH",          subsetor:"Orientacao", relato:"Operador resistente. Dividas consignadas. Recusou orientacao de credito.",              denuncia:false, status:"andamento" },
  { id:3, re:"RE3887", nome:"Joao S. Oliveira",   data:"05/02/25", acompanhante:"Mae",     tipoAcomp:"Familiar", comprometimento:5, causas:["Saude / bem-estar"],   setor:"Ambulatorio", subsetor:"Medico",     relato:"Crises de ansiedade. Nunca buscou tratamento. Encaminhado ao ambulatorio.",            denuncia:false, status:"concluido" },
];

const CAUSAS_OPTIONS = ["Problemas familiares","Saude / bem-estar","Financeiro","Conflito interno com colega","Conflito com lideranca","Uso de substancias","Problema juridico","Luto / perda","Outros"];
const SETORES_MAP = {
  "RH":                    ["RH Geral","DP","Medico","Psicologo"],
  "Juridico":              ["Analise","Mediacao","Processo interno"],
  "Planejamento":          ["Planejamento Operacional","Analise de dados","Gestao de escala"],
  "Gerente Operacional":   ["Gerente G1","Gerente G2","Gerente G3","Gerente G4"],
};
const AREA_ICONS_MAP = {
  "RH":"👔", "Juridico":"⚖️", "Planejamento":"📋", "Gerente Operacional":"👨‍💼",
};

// ─── MENTORIA PAGE ─────────────────────────────────────────────────────────────
const MentoriaPage = ({ operators, sessions, onSave }) => {
  const STEPS = ["Identificacao","Relato & Causas","Encaminhamento","Confirmacao"];
  const [step, setStep]       = useState(0);
  const [viewMode, setViewMode] = useState("lista"); // lista | novo
  const [form, setForm]       = useState({
    re:"", nome:"", data:new Date().toLocaleDateString("pt-BR"),
    acompanhante:"", tipoAcomp:"Sozinho", comprometimento:0,
    causas:[], setor:"", subsetor:"", relato:"", denuncia:false,
  });
  const [saved, setSaved]     = useState(false);
  const [filterRe, setFilterRe] = useState("");

  const upd = (k,v) => setForm(f=>({...f,[k]:v}));

  const toggleCausa = (c) => {
    setForm(f=>({ ...f, causas: f.causas.includes(c) ? f.causas.filter(x=>x!==c) : [...f.causas,c] }));
  };

  const handleReSelect = (re) => {
    const op = operators.find(o=>o.re===re);
    if (op) upd("nome", op.nome);
    upd("re", re);
    setOpSearch("");
    setOpDropOpen(false);
  };

  const [opSearch, setOpSearch]       = useState("");
  const [opDropOpen, setOpDropOpen]   = useState(false);
  const [outrosText, setOutrosText]   = useState("");

  const handleSubmit = () => {
    const newSession = { ...form, id: Date.now(), status:"andamento" };
    onSave(newSession);
    setSaved(true);
    toast(`Sessao de mentoria registrada para ${form.nome||form.re}!`, "success");
    setTimeout(()=>{ setSaved(false); setViewMode("lista"); setStep(0);
      setForm({ re:"", nome:"", data:new Date().toLocaleDateString("pt-BR"),
        acompanhante:"", tipoAcomp:"Sozinho", comprometimento:0, causas:[], setor:"", subsetor:"", relato:"", denuncia:false }); }, 1800);
  };

  const exportExcel = async () => {
    try {
      const xlsxLib = await loadXLSX();
      // Build rows
      const rows = allSessions.map(s => ({
        "RE": s.re,
        "Nome": s.nome,
        "Data da Sessao": s.data,
        "Tipo Acompanhante": s.tipoAcomp,
        "Acompanhante": s.acompanhante || "Sozinho",
        "Comprometimento (1-5)": s.comprometimento,
        "Causas Identificadas": (s.causas||[]).join("; "),
        "Relato": s.relato,
        "Setor Encaminhado": s.setor || "-",
        "Subsetor": s.subsetor || "-",
        "Denuncia": s.denuncia ? "Sim" : "Nao",
        "Status": s.status,
      }));

      const ws = xlsxLib.utils.json_to_sheet(rows);
      // Column widths
      ws["!cols"] = [
        {wch:10},{wch:28},{wch:14},{wch:18},{wch:20},
        {wch:22},{wch:36},{wch:60},{wch:14},{wch:18},{wch:10},{wch:12}
      ];

      const wb = xlsxLib.utils.book_new();
      xlsxLib.utils.book_append_sheet(wb, ws, "Sessoes Mentoria");

      // Summary sheet
      const causasAll = allSessions.flatMap(s=>s.causas||[]);
      const causasCount = {};
      causasAll.forEach(c=>{ causasCount[c]=(causasCount[c]||0)+1; });
      const summaryRows = [
        ["RESUMO GERAL",""],
        ["Total de sessoes", allSessions.length],
        ["Alto comprometimento (4-5★)", allSessions.filter(s=>s.comprometimento>=4).length],
        ["Baixo comprometimento (1-2★)", allSessions.filter(s=>s.comprometimento<=2).length],
        ["",""],
        ["CAUSAS IDENTIFICADAS","Qtd"],
        ...Object.entries(causasCount).sort((a,b)=>b[1]-a[1]).map(([k,v])=>[k,v]),
        ["",""],
        ["ENCAMINHAMENTOS POR SETOR","Qtd"],
        ...Object.entries(allSessions.reduce((acc,s)=>{if(s.setor&&s.setor!=="-")acc[s.setor]=(acc[s.setor]||0)+1;return acc;},{}))
          .sort((a,b)=>b[1]-a[1]).map(([k,v])=>[k,v]),
      ];
      const wsSumm = xlsxLib.utils.aoa_to_sheet(summaryRows);
      wsSumm["!cols"] = [{wch:36},{wch:10}];
      xlsxLib.utils.book_append_sheet(wb, wsSumm, "Resumo");

      const date = new Date().toLocaleDateString("pt-BR").replace(/\//g,"-");
      xlsxLib.writeFile(wb, `Elevamente_Mentorias_${date}.xlsx`);
    } catch(e) {
      console.error(e);
      alert("Erro ao exportar: "+e.message);
    }
  };

  const allSessions = [...sessions].reverse();
  const filtered = filterRe ? allSessions.filter(s=>s.re.toLowerCase().includes(filterRe.toLowerCase())||s.nome.toLowerCase().includes(filterRe.toLowerCase())) : allSessions;

  const ST_MAP = { concluido:{label:"Concluido",color:C.green,bg:`${C.green}18`}, andamento:{label:"Em andamento",color:C.gold,bg:`${C.gold}18`}, pendente:{label:"Pendente",color:C.red,bg:`${C.red}18`} };

  const subsetores = SETORES_MAP[form.setor] || [];
  const canNext = step===0?(form.re&&form.data):step===1?(form.causas.length>0&&form.relato.length>10):step===2?(form.setor):true;

  return (
    <div className="fu d1">
      {/* Header com toggle */}
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20,flexWrap:"wrap"}}>
        <div style={{fontFamily:"'Inter',sans-serif",fontSize:18,fontWeight:700}}>
          {viewMode==="lista"?"Sessoes Registradas":"Nova Sessao de Mentoria"}
        </div>
        <div style={{flex:1}}/>
        {viewMode==="lista"
          ? <div style={{display:"flex",gap:8}}>
              <button className="abt" style={{padding:"9px 16px",fontSize:13,background:`${C.gold}15`,borderColor:C.gold,color:C.gold}}
                onClick={exportExcel}>⬇ Excel</button>
              <button className="abt" style={{padding:"9px 20px",fontSize:13,background:`${C.green}18`,borderColor:C.green,color:C.green}}
                onClick={()=>{setViewMode("novo");setStep(0);}}>+ Nova Mentoria</button>
            </div>
          : <button className="abt" onClick={()=>{setViewMode("lista");setStep(0);}}>← Voltar a lista</button>
        }
      </div>

      {/* ── LISTA DE SESSOES ── */}
      {viewMode==="lista" && (
        <div>
          {/* Resumo rapido */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:20}} className="men-kpi-grid">
            {[
              {v:allSessions.length,       l:"Total de sessoes",    c:C.accent},
              {v:allSessions.filter(s=>s.comprometimento>=4).length, l:"Alto comprometimento (4-5★)", c:C.green},
              {v:allSessions.filter(s=>s.comprometimento<=2).length, l:"Baixo comprometimento (1-2★)", c:C.red},
              {v:[...new Set(allSessions.flatMap(s=>s.causas))].length, l:"Causas identificadas", c:C.gold},
            ].map(x=>(
              <div key={x.l} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"14px 18px"}}>
                <div style={{fontFamily:"'Inter',sans-serif",fontSize:26,fontWeight:800,color:x.c}}>{x.v}</div>
                <div style={{fontSize:11,color:C.muted,marginTop:3}}>{x.l}</div>
              </div>
            ))}
          </div>

          <input style={{background:C.card,border:`1px solid ${C.border}`,color:C.text,padding:"10px 16px",
            borderRadius:10,fontSize:13,fontFamily:"'Inter',sans-serif",width:"100%",outline:"none",marginBottom:16}}
            placeholder="🔍  Filtrar por RE ou nome..." value={filterRe} onChange={e=>setFilterRe(e.target.value)}/>

          {filtered.map(s=>{
            const ac=avatarColor(s.re), st=ST_MAP[s.status]||ST_MAP.andamento;
            return(
              <div key={s.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,
                padding:"16px 20px",marginBottom:10,transition:"all .2s"}}
                onMouseEnter={e=>e.currentTarget.style.borderColor=`${C.accent}40`}
                onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
                <div style={{display:"flex",alignItems:"flex-start",gap:14,flexWrap:"wrap"}}>
                  <div style={{width:42,height:42,borderRadius:12,background:`${ac}20`,color:ac,border:`1px solid ${ac}30`,
                    display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Inter',sans-serif",fontWeight:800,fontSize:14,flexShrink:0}}>
                    {initials(s.nome)}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",marginBottom:6}}>
                      <span style={{fontWeight:700,fontSize:14}}>{s.nome}</span>
                      <span className="re-tag" style={{fontSize:11}}>{s.re}</span>
                      <span style={{fontSize:12,color:C.muted}}>📅 {s.data}</span>
                      <span className="pill" style={{color:st.color,background:st.bg,fontSize:11}}>● {st.label}</span>
                    </div>
                    <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:8}}>
                      <span style={{fontSize:12,color:C.muted}}>👥 {s.tipoAcomp}: <strong style={{color:C.text}}>{s.acompanhante||"Sozinho"}</strong></span>
                      <span style={{fontSize:12,color:C.muted}}>🎯 Setor: <strong style={{color:C.accent}}>{s.setor||"-"}</strong>{s.subsetor&&` / ${s.subsetor}`}</span>
                    </div>
                    <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8}}>
                      {s.causas.map(c=><span key={c} style={{fontSize:11,background:`${C.purple}18`,border:`1px solid ${C.purple}30`,borderRadius:6,padding:"2px 8px",color:C.purple}}>{c}</span>)}
                    </div>
                    <div style={{fontSize:12,color:C.muted,lineHeight:1.6,background:C.bg,borderRadius:8,padding:"8px 12px"}}>
                      {s.relato}
                    </div>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                    <div style={{display:"flex",gap:2}}>{[1,2,3,4,5].map(i=><span key={i} style={{fontSize:16,color:i<=s.comprometimento?C.gold:"#2a3a4a"}}>★</span>)}</div>
                    <div style={{fontSize:10,color:C.muted}}>comprometimento</div>
                    {s.denuncia&&<span style={{fontSize:10,color:C.red,fontWeight:700,marginTop:4}}>⚠️ DENUNCIA</span>}
                  </div>
                </div>
              </div>
            );
          })}

          {filtered.length===0&&(
            <div style={{textAlign:"center",padding:"60px 0",opacity:.5}}>
              <div style={{fontSize:40,marginBottom:10}}>📋</div>
              <div style={{fontFamily:"'Inter',sans-serif",fontSize:16}}>Nenhuma sessao encontrada</div>
            </div>
          )}
        </div>
      )}

      {/* ── FORMULARIO NOVO ── */}
      {viewMode==="novo" && (
        <div>
          {/* Stepper */}
          <div style={{display:"flex",gap:0,marginBottom:28,background:C.surface,borderRadius:14,padding:6}}>
            {STEPS.map((s,i)=>(
              <div key={s} style={{flex:1,textAlign:"center",padding:"10px 8px",borderRadius:10,cursor:"pointer",transition:"all .2s",
                background:i===step?C.card:"transparent",
                borderBottom:i===step?`2px solid ${C.accent}`:"2px solid transparent"}}
                onClick={()=>i<step&&setStep(i)}>
                <div style={{fontFamily:"'Inter',sans-serif",fontSize:18,fontWeight:800,
                  color:i<step?C.green:i===step?C.accent:C.muted}}>{i<step?"✓":i+1}</div>
                <div style={{fontSize:12,fontWeight:600,color:i===step?C.accent:C.muted,marginTop:2}}>{s}</div>
              </div>
            ))}
          </div>

          {/* STEP 0 - Identificacao */}
          {step===0&&(
            <div className="card">
              <div className="ct"><span className="ctd"/>Identificacao do Operador e Sessao</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}} className="form-grid-2">
                <div style={{position:"relative"}}>
                  <label style={{fontSize:12,color:C.muted,display:"block",marginBottom:6}}>RE do Operador *</label>
                  <input
                    style={{background:C.bg,border:`1px solid ${form.re?C.accent:C.border}`,color:C.text,padding:"10px 14px",
                      borderRadius:9,fontSize:13,fontFamily:"'Inter',sans-serif",width:"100%",outline:"none"}}
                    placeholder="Digite o RE ou nome para buscar..."
                    value={opSearch || (form.re ? `${form.re} - ${form.nome}` : "")}
                    onChange={e=>{ setOpSearch(e.target.value); setOpDropOpen(true); upd("re",""); upd("nome",""); }}
                    onFocus={()=>setOpDropOpen(true)}
                  />
                  {opDropOpen && (opSearch.length>=1 || !form.re) && (()=>{
                    const q = opSearch.toLowerCase();
                    const opts = operators.filter(o=>
                      !q || o.re.toLowerCase().includes(q) || o.nome.toLowerCase().includes(q)
                    ).slice(0,8);
                    if (!opts.length) return null;
                    return(
                      <div style={{position:"absolute",top:"100%",left:0,right:0,zIndex:200,
                        background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,
                        boxShadow:"0 8px 24px #00000060",maxHeight:240,overflowY:"auto",marginTop:4}}>
                        {opts.map(op=>{
                          const ac=avatarColor(op.re);
                          return(
                            <div key={op.re}
                              onMouseDown={()=>handleReSelect(op.re)}
                              style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",cursor:"pointer",transition:"all .15s"}}
                              onMouseEnter={e=>e.currentTarget.style.background=C.border}
                              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                              <div style={{width:32,height:32,borderRadius:8,background:`${ac}20`,color:ac,
                                display:"flex",alignItems:"center",justifyContent:"center",
                                fontWeight:700,fontSize:11,flexShrink:0}}>{initials(op.nome)}</div>
                              <div style={{flex:1}}>
                                <div style={{fontSize:13,fontWeight:600}}>{op.nome}</div>
                                <div style={{fontSize:11,color:C.muted}}>{op.re} · {op.funcao} · Garagem {op.garagem}</div>
                              </div>
                              <span style={{fontSize:10,background:`${C.border}`,borderRadius:5,padding:"2px 6px",color:C.muted}}>{op.status}</span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                  {form.re && (
                    <div style={{marginTop:6,padding:"6px 10px",background:`${C.accent}15`,border:`1px solid ${C.accent}30`,
                      borderRadius:7,fontSize:12,color:C.accent,display:"flex",alignItems:"center",gap:6}}>
                      ✓ <strong>{form.re}</strong> - {form.nome}
                    </div>
                  )}
                </div>
                <div>
                  <label style={{fontSize:12,color:C.muted,display:"block",marginBottom:6}}>Data da Sessao *</label>
                  <input style={{background:C.bg,border:`1px solid ${C.border}`,color:C.text,padding:"10px 14px",borderRadius:9,fontSize:13,fontFamily:"'Inter',sans-serif",width:"100%",outline:"none"}}
                    value={form.data} onChange={e=>upd("data",e.target.value)} placeholder="dd/mm/aa"/>
                </div>
                <div>
                  <label style={{fontSize:12,color:C.muted,display:"block",marginBottom:6}}>Tipo de Acompanhante</label>
                  <select style={{background:C.bg,border:`1px solid ${C.border}`,color:C.text,padding:"10px 14px",borderRadius:9,fontSize:13,fontFamily:"'Inter',sans-serif",width:"100%",outline:"none"}}
                    value={form.tipoAcomp} onChange={e=>upd("tipoAcomp",e.target.value)}>
                    {["Sozinho","Conjuge","Familiar","Responsavel legal","Outro"].map(t=><option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{fontSize:12,color:C.muted,display:"block",marginBottom:6}}>Nome do Acompanhante</label>
                  <input style={{background:C.bg,border:`1px solid ${C.border}`,color:C.text,padding:"10px 14px",borderRadius:9,fontSize:13,fontFamily:"'Inter',sans-serif",width:"100%",outline:"none"}}
                    value={form.acompanhante} onChange={e=>upd("acompanhante",e.target.value)}
                    placeholder="Deixe em branco se sozinho" disabled={form.tipoAcomp==="Sozinho"}/>
                </div>
              </div>
              {form.nome&&(
                <div style={{marginTop:16,padding:"12px 16px",background:C.bg,borderRadius:10,fontSize:13,display:"flex",alignItems:"center",gap:12}}>
                  <div style={{width:36,height:36,borderRadius:10,background:`${avatarColor(form.re)}20`,color:avatarColor(form.re),
                    display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontFamily:"'Inter',sans-serif",flexShrink:0}}>
                    {initials(form.nome)}
                  </div>
                  <div>
                    <div style={{fontWeight:600}}>{form.nome}</div>
                    <div style={{fontSize:11,color:C.muted}}>Operador selecionado · {form.re}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 1 - Relato & Causas */}
          {step===1&&(
            <div>
              <div className="card" style={{marginBottom:16}}>
                <div className="ct"><span className="ctd"/>Causas Identificadas * <span style={{color:C.muted,textTransform:"none",fontSize:11}}>(selecione uma ou mais)</span></div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  {CAUSAS_OPTIONS.map(c=>{
                    const on=form.causas.includes(c);
                    return(<button key={c} onClick={()=>toggleCausa(c)} style={{padding:"8px 16px",borderRadius:20,
                      fontSize:13,fontWeight:600,cursor:"pointer",border:`1px solid ${on?C.accent:C.border}`,
                      background:on?`${C.accent}18`:"transparent",color:on?C.accent:C.muted,transition:"all .2s"}}>
                      {on?"✓ ":""}{c}
                    </button>);
                  })}
                </div>
                {/* Campo texto quando "Outros" esta selecionado */}
                {form.causas.includes("Outros") && (
                  <div style={{marginTop:12}}>
                    <label style={{fontSize:12,color:C.muted,display:"block",marginBottom:4}}>Descreva a causa (Outros) *</label>
                    <input
                      style={{background:C.bg,border:`1px solid ${C.accent}50`,color:C.text,padding:"9px 12px",
                        borderRadius:8,fontSize:13,fontFamily:"'Inter',sans-serif",width:"100%",outline:"none"}}
                      placeholder="Descreva a causa identificada..."
                      value={outrosText}
                      onChange={e=>{setOutrosText(e.target.value);upd("outrosDetalhe",e.target.value);}}
                    />
                  </div>
                )}
              </div>

              <div className="card" style={{marginBottom:16}}>
                <div className="ct"><span className="ctd"/>Nivel de Comprometimento do Operador</div>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  {[1,2,3,4,5].map(i=>(
                    <button key={i} onClick={()=>upd("comprometimento",i)}
                      style={{width:44,height:44,borderRadius:10,border:`1px solid ${i<=form.comprometimento?C.gold:C.border}`,
                      background:i<=form.comprometimento?`${C.gold}18`:"transparent",fontSize:22,cursor:"pointer",transition:"all .2s"}}>
                      {i<=form.comprometimento?"★":"☆"}
                    </button>
                  ))}
                  <span style={{fontSize:13,color:C.muted,marginLeft:8}}>
                    {["","Muito baixo","Baixo","Medio","Alto","Muito alto"][form.comprometimento]||"Selecione"}
                  </span>
                </div>
              </div>

              <div className="card">
                <div className="ct"><span className="ctd"/>Relato da Sessao *</div>
                <textarea style={{background:C.bg,border:`1px solid ${C.border}`,color:C.text,padding:"12px 14px",
                  borderRadius:10,fontSize:13,fontFamily:"'Inter',sans-serif",width:"100%",outline:"none",
                  resize:"vertical",minHeight:140,lineHeight:1.7}}
                  placeholder="Descreva o que foi relatado pelo operador e/ou acompanhante durante a sessao, comportamento observado, informacoes relevantes..."
                  value={form.relato} onChange={e=>upd("relato",e.target.value)}/>
                <div style={{marginTop:12,display:"flex",alignItems:"center",gap:12}}>
                  <input type="checkbox" id="den" checked={form.denuncia} onChange={e=>upd("denuncia",e.target.checked)}
                    style={{width:16,height:16,cursor:"pointer",accentColor:C.red}}/>
                  <label htmlFor="den" style={{fontSize:13,cursor:"pointer",color:form.denuncia?C.red:C.muted}}>
                    ⚠️ Registrar denuncia nesta sessao
                  </label>
                </div>
                {form.denuncia&&(
                  <div style={{marginTop:10,padding:"10px 14px",background:`${C.red}10`,border:`1px solid ${C.red}30`,borderRadius:8,fontSize:12,color:C.red}}>
                    Uma denuncia sera associada a esta sessao. O caso sera encaminhado ao setor competente automaticamente.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2 - Encaminhamento */}
          {step===2&&(
            <div className="card">
              <div className="ct"><span className="ctd"/>Encaminhamento para Setor *</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
                <div>
                  <label style={{fontSize:12,color:C.muted,display:"block",marginBottom:6}}>Setor responsavel *</label>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                    {Object.keys(SETORES_MAP).map(s=>{
                      const on=form.setor===s;
                      const icons={RH:"👔",Psicologia:"🧠",DP:"📁",Ambulatorio:"🏥",Juridico:"⚖️"};
                      return(<button key={s} onClick={()=>upd("setor",s)} style={{padding:"10px 16px",borderRadius:10,
                        border:`1px solid ${on?C.accent:C.border}`,background:on?`${C.accent}18`:"transparent",
                        color:on?C.accent:C.muted,fontSize:13,fontWeight:600,cursor:"pointer",transition:"all .2s",display:"flex",alignItems:"center",gap:6}}>
                        {icons[s]} {s}
                      </button>);
                    })}
                    <button onClick={()=>upd("setor","-")} style={{padding:"10px 16px",borderRadius:10,
                      border:`1px solid ${form.setor==="-"?C.muted:C.border}`,background:"transparent",
                      color:C.muted,fontSize:13,cursor:"pointer"}}>
                      Sem encaminhamento
                    </button>
                  </div>
                </div>
                {form.setor&&form.setor!=="-"&&subsetores.length>0&&(
                  <div>
                    <label style={{fontSize:12,color:C.muted,display:"block",marginBottom:6}}>Subnivel / Especialidade</label>
                    <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                      {subsetores.map(s=>{
                        const on=form.subsetor===s;
                        return(<button key={s} onClick={()=>upd("subsetor",s)} style={{padding:"8px 14px",borderRadius:8,
                          border:`1px solid ${on?C.accent2:C.border}`,background:on?`${C.accent2}18`:"transparent",
                          color:on?C.accent2:C.muted,fontSize:12,fontWeight:600,cursor:"pointer",transition:"all .2s"}}>
                          {on?"✓ ":""}{s}
                        </button>);
                      })}
                    </div>
                  </div>
                )}
              </div>
              {form.setor&&form.setor!=="-"&&(
                <div style={{padding:"12px 16px",background:`${C.green}08`,border:`1px solid ${C.green}25`,borderRadius:10,fontSize:13,color:C.muted}}>
                  ✓ Sera criada uma tratativa para <strong style={{color:C.accent}}>{form.setor}</strong>{form.subsetor&&` → ${form.subsetor}`} vinculada a esta sessao.
                </div>
              )}
            </div>
          )}

          {/* STEP 3 - Confirmacao */}
          {step===3&&(
            <div>
              {saved?(
                <div style={{textAlign:"center",padding:"60px 0"}}>
                  <div style={{fontSize:64,marginBottom:16}}>✅</div>
                  <div style={{fontFamily:"'Inter',sans-serif",fontSize:22,fontWeight:800,color:C.green,marginBottom:8}}>Sessao registrada!</div>
                  <div style={{color:C.muted,fontSize:14}}>Redirecionando para a lista...</div>
                </div>
              ):(
                <div className="card">
                  <div className="ct"><span className="ctd"/>Confirmar Registro da Sessao</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}} className="form-grid-2">
                    {[
                      {l:"Operador",        v:`${form.re} - ${form.nome}`},
                      {l:"Data",            v:form.data},
                      {l:"Acompanhante",    v:form.tipoAcomp==="Sozinho"?"Sozinho":`${form.tipoAcomp}: ${form.acompanhante}`},
                      {l:"Comprometimento", v:`${"★".repeat(form.comprometimento)}${"☆".repeat(5-form.comprometimento)} (${form.comprometimento}/5)`},
                      {l:"Causas",          v:form.causas.join(", ")||"-"},
                      {l:"Encaminhamento",  v:form.setor&&form.setor!=="-"?`${form.setor}${form.subsetor?" → "+form.subsetor:""}`:  "Sem encaminhamento"},
                    ].map(x=>(
                      <div key={x.l} style={{background:C.bg,borderRadius:10,padding:"12px 14px"}}>
                        <div style={{fontSize:11,color:C.muted,marginBottom:3}}>{x.l}</div>
                        <div style={{fontSize:13,fontWeight:600}}>{x.v}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{background:C.bg,borderRadius:10,padding:"12px 14px",marginBottom:16}}>
                    <div style={{fontSize:11,color:C.muted,marginBottom:4}}>Relato</div>
                    <div style={{fontSize:13,lineHeight:1.7,color:C.text}}>{form.relato}</div>
                  </div>
                  {form.denuncia&&<div style={{padding:"10px 14px",background:`${C.red}10`,border:`1px solid ${C.red}30`,borderRadius:8,fontSize:12,color:C.red,marginBottom:16}}>⚠️ Esta sessao possui uma <strong>denuncia registrada</strong>.</div>}
                  <button onClick={handleSubmit} style={{width:"100%",padding:"14px",background:`linear-gradient(135deg,${C.accent},${C.accent2})`,
                    color:"#000",border:"none",borderRadius:10,fontFamily:"'Inter',sans-serif",fontSize:15,fontWeight:800,cursor:"pointer",letterSpacing:.5}}>
                    ✓ CONFIRMAR E SALVAR SESSAO
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Nav buttons */}
          {!saved&&(
            <div style={{display:"flex",justifyContent:"space-between",marginTop:20}}>
              <button className="abt" onClick={()=>setStep(s=>Math.max(0,s-1))} style={{opacity:step===0?.3:1,pointerEvents:step===0?"none":"auto"}}>← Anterior</button>
              {step<STEPS.length-1
                ? <button onClick={()=>canNext&&setStep(s=>s+1)} style={{padding:"10px 28px",borderRadius:10,
                    background:canNext?`linear-gradient(135deg,${C.accent},${C.accent2})`:`${C.border}`,
                    color:canNext?"#000":C.muted,border:"none",fontFamily:"'Inter',sans-serif",fontSize:13,fontWeight:700,cursor:canNext?"pointer":"not-allowed",transition:"all .2s"}}>
                    Proximo →
                  </button>
                : null
              }
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── COMING SOON ──────────────────────────────────────────────────────────────
// ─── TRATATIVAS INIT DATA ─────────────────────────────────────────────────────
const TRATATIVAS_INIT = [
  { id:1,  re:"RE5319", nome:"Carlos A. Mendes",    area:"Psicologia", subarea:"Psicologo",            data:"10/01/25", prazo:"10/02/25", status:"concluido",  prioridade:"alta",   descricao:"Terapia de casal - 8 sessoes agendadas.", retorno:"Casal completou as sessoes. Alta em 15/Mar/25." },
  { id:2,  re:"RE4201", nome:"Marcos P. Lima",      area:"RH",         subarea:"Orientacao",           data:"22/01/25", prazo:"22/02/25", status:"concluido",  prioridade:"media",  descricao:"Orientacao sobre renegociacao de dividas consignadas.", retorno:"Orientacao realizada. Operador nao seguiu as recomendacoes." },
  { id:3,  re:"RE3887", nome:"Joao S. Oliveira",    area:"Ambulatorio",subarea:"Medico",               data:"05/02/25", prazo:"05/03/25", status:"concluido",  prioridade:"alta",   descricao:"Avaliacao e tratamento de ansiedade.", retorno:"Operador iniciou tratamento. Evolucao positiva." },
  { id:4,  re:"RE4201", nome:"Marcos P. Lima",      area:"Juridico",   subarea:"Analise",              data:"22/02/25", prazo:"22/03/25", status:"andamento",  prioridade:"alta",   descricao:"Analise de comportamento disciplinar reincidente.", retorno:"" },
  { id:5,  re:"RE6014", nome:"Rafael T. Santos",    area:"DP",         subarea:"Orientacao disciplinar",data:"21/03/25",prazo:"04/04/25", status:"pendente",   prioridade:"urgente",descricao:"Registro de acidente com responsabilidade - providencias disciplinares.", retorno:"" },
  { id:6,  re:"RE7801", nome:"Felipe A. Nascimento",area:"Juridico",   subarea:"Mediacao",             data:"22/03/25", prazo:"05/04/25", status:"pendente",   prioridade:"media",  descricao:"Analise de reclamacao formal de municipe.", retorno:"" },
  { id:7,  re:"RE5507", nome:"Paulo B. Rodrigues",  area:"RH",         subarea:"Beneficios",           data:"18/02/25", prazo:"18/03/25", status:"concluido",  prioridade:"baixa",  descricao:"Revisao de beneficios - solicitacao de vale transporte extra.", retorno:"Beneficio concedido e atualizado no sistema." },
];

const AREA_ICONS = { RH:"👔", Psicologia:"🧠", DP:"📁", Ambulatorio:"🏥", Juridico:"⚖️" };
const AREA_COLORS= { RH:C.accent2, Psicologia:C.purple, DP:C.gold, Ambulatorio:C.green, Juridico:C.orange };
const PRIOR_MAP  = {
  urgente: { label:"Urgente", color:C.red,    bg:`${C.red}18`    },
  alta:    { label:"Alta",    color:C.orange, bg:`${C.orange}18` },
  media:   { label:"Media",   color:C.gold,   bg:`${C.gold}18`   },
  baixa:   { label:"Baixa",   color:C.muted,  bg:`${C.border}50` },
};
const TRAT_ST_MAP = {
  pendente:  { label:"Pendente",      color:C.red,   bg:`${C.red}18`   },
  andamento: { label:"Em andamento",  color:C.gold,  bg:`${C.gold}18`  },
  concluido: { label:"Concluido",     color:C.green, bg:`${C.green}18` },
};

// ─── TRATATIVAS PAGE ──────────────────────────────────────────────────────────
const TratativasPage = ({ tratativas, onUpdate, onAdd, operators, sessions }) => {
  const [tab, setTab]         = useState("kanban"); // kanban | lista
  const [filtArea, setFiltArea] = useState("todas");
  const [filtStatus, setFiltStatus] = useState("todos");
  const [filtRe, setFiltRe]   = useState("");
  const [showModal, setShowModal] = useState(false);
  const [detalhes, setDetalhes]   = useState(null);
  const [modalStatus, setModalStatus] = useState(null); // tracks live status inside modal
  const [retornoText, setRetornoText] = useState("");
  const [newForm, setNewForm] = useState({ re:"", nome:"", area:"RH", subarea:"", prazo:"", prioridade:"media", descricao:"" });

  const areas = ["todas", ...Object.keys(AREA_ICONS)];

  const filtered = tratativas.filter(t => {
    const aOk = filtArea==="todas" || t.area===filtArea;
    const sOk = filtStatus==="todos" || t.status===filtStatus;
    const rOk = !filtRe || t.re.toLowerCase().includes(filtRe.toLowerCase()) || t.nome.toLowerCase().includes(filtRe.toLowerCase());
    return aOk && sOk && rOk;
  });

  // KPIs
  const total     = tratativas.length;
  const pendentes = tratativas.filter(t=>t.status==="pendente").length;
  const andamento = tratativas.filter(t=>t.status==="andamento").length;
  const concluido = tratativas.filter(t=>t.status==="concluido").length;
  const urgentes  = tratativas.filter(t=>t.prioridade==="urgente"&&t.status!=="concluido").length;

  const handleStatusChange = (id, newStatus) => {
    onUpdate(tratativas.map(t => t.id===id ? {...t, status:newStatus} : t));
    setModalStatus(newStatus); // update live highlight inside modal
  };

  const handleRetornoSave = () => {
    onUpdate(tratativas.map(t => t.id===detalhes.id ? {...t, retorno:retornoText, status:"concluido"} : t));
    toast(`Tratativa de ${detalhes.area} concluida!`, "success");
    setDetalhes(null);
    setRetornoText("");
  };

  const handleAdd = () => {
    const op = operators.find(o=>o.re===newForm.re);
    const t = { ...newForm, id: Date.now(), nome: op?.nome||newForm.re, data: new Date().toLocaleDateString("pt-BR"), status:"pendente", retorno:"" };
    onAdd(t);
    toast(`Nova tratativa criada para ${t.nome}!`, "info");
    setShowModal(false);
    setNewForm({ re:"", nome:"", area:"RH", subarea:"", prazo:"", prioridade:"media", descricao:"" });
  };

  const exportExcel = async () => {
    try {
      const xlsxLib = await loadXLSX();
      const rows = tratativas.map(t=>({
        "RE": t.re, "Nome": t.nome, "Area": t.area, "Subarea": t.subarea||"-",
        "Data": t.data, "Prazo": t.prazo||"-", "Prioridade": t.prioridade,
        "Status": t.status, "Descricao": t.descricao, "Retorno do Setor": t.retorno||"-",
      }));
      const ws = xlsxLib.utils.json_to_sheet(rows);
      ws["!cols"] = [{wch:10},{wch:26},{wch:14},{wch:22},{wch:12},{wch:12},{wch:10},{wch:12},{wch:50},{wch:50}];
      const wb = xlsxLib.utils.book_new();
      xlsxLib.utils.book_append_sheet(wb, ws, "Tratativas");
      xlsxLib.writeFile(wb, `Elevamente_Tratativas_${new Date().toLocaleDateString("pt-BR").replace(/\//g,"-")}.xlsx`);
    } catch(e) { alert("Erro: "+e.message); }
  };

  const TCard = ({t}) => {
    const pr = PRIOR_MAP[t.prioridade]||PRIOR_MAP.media;
    const st = TRAT_ST_MAP[t.status];
    const ac = AREA_COLORS[t.area]||C.accent;
    return (
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"14px 16px",
        marginBottom:10,cursor:"pointer",transition:"all .2s",borderLeft:`3px solid ${ac}`}}
        onMouseEnter={e=>e.currentTarget.style.borderColor=`${ac}80`}
        onMouseLeave={e=>e.currentTarget.style.borderLeft=`3px solid ${ac}`}
        onClick={()=>{ setDetalhes(t); setRetornoText(t.retorno||""); setModalStatus(t.status); }}>
        <div style={{display:"flex",alignItems:"flex-start",gap:10,marginBottom:8}}>
          <div style={{fontSize:20,flexShrink:0}}>{AREA_ICONS[t.area]}</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontWeight:600,fontSize:13,marginBottom:2}}>{t.descricao.length>55?t.descricao.slice(0,55)+"…":t.descricao}</div>
            <div style={{fontSize:11,color:C.muted}}><span className="re-tag" style={{fontSize:10,padding:"1px 5px"}}>{t.re}</span> {t.nome}</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
          <span className="pill" style={{color:pr.color,background:pr.bg,fontSize:10}}>▲ {pr.label}</span>
          {t.prazo&&<span style={{fontSize:10,color:C.muted}}>📅 {t.prazo}</span>}
          <div style={{marginLeft:"auto",display:"flex",gap:4}}>
            {["pendente","andamento","concluido"].map(s=>(
              <button key={s} onClick={e=>{e.stopPropagation();handleStatusChange(t.id,s);}}
                style={{padding:"2px 7px",borderRadius:5,fontSize:10,fontWeight:600,cursor:"pointer",border:`1px solid ${t.status===s?TRAT_ST_MAP[s].color:C.border}`,
                  background:t.status===s?TRAT_ST_MAP[s].bg:"transparent",color:t.status===s?TRAT_ST_MAP[s].color:C.muted}}>
                {s==="pendente"?"⏳":s==="andamento"?"🔄":"✓"}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fu d1">
      {/* ── Modal detalhes ── */}
      {detalhes&&(
        <div style={{position:"fixed",inset:0,background:"#000c",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}
          onClick={()=>setDetalhes(null)}>
          <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:18,padding:28,width:"100%",maxWidth:580,maxHeight:"90vh",overflowY:"auto"}}
            onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
              <div style={{fontSize:28}}>{AREA_ICONS[detalhes.area]}</div>
              <div style={{flex:1}}>
                <div style={{fontFamily:"'Inter',sans-serif",fontSize:17,fontWeight:700}}>{detalhes.area}{detalhes.subarea?` → ${detalhes.subarea}`:""}</div>
                <div style={{fontSize:12,color:C.muted}}>{detalhes.re} · {detalhes.nome}</div>
              </div>
              <button onClick={()=>setDetalhes(null)} style={{background:"none",border:"none",color:C.muted,fontSize:20,cursor:"pointer"}}>✕</button>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
              {[{l:"Data",v:detalhes.data},{l:"Prazo",v:detalhes.prazo||"-"},{l:"Prioridade",v:PRIOR_MAP[detalhes.prioridade]?.label},{l:"Status",v:TRAT_ST_MAP[modalStatus]?.label}]
                .map(x=><div key={x.l} style={{background:C.bg,borderRadius:9,padding:"10px 12px"}}>
                  <div style={{fontSize:10,color:C.muted,marginBottom:2}}>{x.l}</div>
                  <div style={{fontSize:13,fontWeight:600}}>{x.v}</div>
                </div>)}
            </div>

            <div style={{background:C.bg,borderRadius:10,padding:"12px 14px",marginBottom:16}}>
              <div style={{fontSize:10,color:C.muted,marginBottom:4,textTransform:"uppercase",letterSpacing:.5}}>Descricao</div>
              <div style={{fontSize:13,lineHeight:1.7}}>{detalhes.descricao}</div>
            </div>

            {/* Formulario da mentoria relacionada */}
            {(()=>{
              const sess = sessions?.filter(s=>s.re===detalhes.re);
              if(!sess||!sess.length) return null;
              return(
                <div style={{marginBottom:16,background:C.bg,borderRadius:10,padding:"14px 16px",border:`1px solid ${C.accent}25`}}>
                  <div style={{fontSize:11,color:C.accent,fontWeight:700,marginBottom:10,textTransform:"uppercase",letterSpacing:.5}}>
                    💬 Formulario de Mentoria ({sess.length} sessao{sess.length>1?"oes":""})
                  </div>
                  {sess.slice(0,2).map((s,i)=>(
                    <div key={i} style={{marginBottom:8,paddingBottom:8,borderBottom:i<sess.length-1?`1px solid ${C.border}`:"none"}}>
                      <div style={{display:"flex",gap:10,marginBottom:4,flexWrap:"wrap"}}>
                        <span style={{fontSize:12,color:C.muted}}>📅 {s.data}</span>
                        <span style={{fontSize:12,color:C.muted}}>👥 {s.tipoAcomp}: {s.acompanhante||"Sozinho"}</span>
                        <span style={{fontSize:12}}>
                          {[1,2,3,4,5].map(n=><span key={n} style={{color:n<=s.comprometimento?C.gold:"#333",fontSize:13}}>{n<=s.comprometimento?"★":"☆"}</span>)}
                          <span style={{color:C.muted,fontSize:11,marginLeft:4}}>{s.comprometimento}/5</span>
                        </span>
                      </div>
                      <div style={{fontSize:12,marginBottom:4}}>
                        <strong style={{color:C.muted}}>Causas: </strong>
                        {(s.causas||[]).join(", ")||"-"}
                        {s.outrosDetalhe&&<span style={{color:C.muted}}> ({s.outrosDetalhe})</span>}
                      </div>
                      <div style={{fontSize:12,color:C.muted,lineHeight:1.5}}>{s.relato}</div>
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* Ficha rapida do operador */}
            {(()=>{
              const op = operators?.find(o=>o.re===detalhes.re);
              if(!op) return null;
              return(
                <div style={{marginBottom:16,background:C.bg,borderRadius:10,padding:"14px 16px",border:`1px solid ${C.border}`}}>
                  <div style={{fontSize:11,color:C.muted,fontWeight:700,marginBottom:10,textTransform:"uppercase",letterSpacing:.5}}>
                    📋 Ficha do Operador
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                    {[
                      {l:"Nome",       v:op.nome},
                      {l:"Funcao",     v:op.funcao},
                      {l:"Garagem",    v:op.garagem},
                      {l:"Admissao",   v:op.admissao},
                      {l:"Faltas",     v:op.faltas, c:op.faltas>=10?C.red:op.faltas>=5?C.orange:C.green},
                      {l:"Multas",     v:op.multas, c:op.multas>=5?C.red:op.multas>=3?C.orange:C.green},
                    ].map(x=>(
                      <div key={x.l} style={{background:C.surface,borderRadius:7,padding:"8px 10px"}}>
                        <div style={{fontSize:10,color:C.muted,marginBottom:2}}>{x.l}</div>
                        <div style={{fontSize:13,fontWeight:600,color:x.c||C.text}}>{x.v||"-"}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Retorno do setor */}
            <div style={{marginBottom:16}}>
              <div style={{fontSize:11,color:C.muted,marginBottom:6,textTransform:"uppercase",letterSpacing:.5,fontWeight:600}}>
                {detalhes.retorno?"✓ Retorno do Setor (registrado)":"📝 Registrar Retorno do Setor"}
              </div>
              <textarea style={{background:C.bg,border:`1px solid ${detalhes.retorno?C.green:C.border}`,color:C.text,
                padding:"10px 12px",borderRadius:9,fontSize:13,fontFamily:"'Inter',sans-serif",
                width:"100%",outline:"none",resize:"vertical",minHeight:90,lineHeight:1.7}}
                placeholder="Descreva o que foi realizado pelo setor, resultado, observacoes..."
                value={retornoText} onChange={e=>setRetornoText(e.target.value)}/>
            </div>

            {/* Status buttons */}
            <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
              {["pendente","andamento","concluido"].map(s=>{
                const st=TRAT_ST_MAP[s];
                return(<button key={s} onClick={()=>handleStatusChange(detalhes.id,s)}
                  style={{flex:1,padding:"9px",borderRadius:9,border:`1px solid ${modalStatus===s?st.color:C.border}`,
                  background:modalStatus===s?st.bg:"transparent",color:modalStatus===s?st.color:C.muted,
                  fontSize:12,fontWeight:600,cursor:"pointer",transition:"all .2s"}}>
                  {s==="pendente"?"⏳ Pendente":s==="andamento"?"🔄 Em andamento":"✓ Concluido"}
                </button>);
              })}
            </div>

            <div style={{display:"flex",gap:8}}>
              <button onClick={handleRetornoSave} style={{flex:1,padding:"11px",background:`linear-gradient(135deg,${C.green},${C.accent2})`,
                color:"#fff",border:"none",borderRadius:10,fontFamily:"'Inter',sans-serif",fontSize:14,fontWeight:700,cursor:"pointer"}}>
                💾 Salvar Retorno e Concluir
              </button>
              <button onClick={()=>setDetalhes(null)} className="abt" style={{padding:"11px 18px"}}>Fechar</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal nova tratativa ── */}
      {showModal&&(
        <div style={{position:"fixed",inset:0,background:"#000c",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}
          onClick={()=>setShowModal(false)}>
          <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:18,padding:28,width:"100%",maxWidth:520}}
            onClick={e=>e.stopPropagation()}>
            <div style={{fontFamily:"'Inter',sans-serif",fontSize:18,fontWeight:700,marginBottom:20}}>+ Nova Tratativa</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}} className="form-grid-2">
              <div>
                <div style={{fontSize:11,color:C.muted,marginBottom:4}}>Operador *</div>
                <select style={{background:C.bg,border:`1px solid ${C.border}`,color:C.text,padding:"9px 12px",borderRadius:8,fontSize:13,fontFamily:"'Inter',sans-serif",width:"100%",outline:"none"}}
                  value={newForm.re} onChange={e=>{const op=operators.find(o=>o.re===e.target.value);setNewForm(f=>({...f,re:e.target.value,nome:op?.nome||""}));}}>
                  <option value="">Selecione...</option>
                  {operators.map(o=><option key={o.re} value={o.re}>{o.re} - {o.nome}</option>)}
                </select>
              </div>
              <div>
                <div style={{fontSize:11,color:C.muted,marginBottom:4}}>Area *</div>
                <select style={{background:C.bg,border:`1px solid ${C.border}`,color:C.text,padding:"9px 12px",borderRadius:8,fontSize:13,fontFamily:"'Inter',sans-serif",width:"100%",outline:"none"}}
                  value={newForm.area} onChange={e=>setNewForm(f=>({...f,area:e.target.value,subarea:""}))}>
                  {Object.keys(AREA_ICONS).map(a=><option key={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <div style={{fontSize:11,color:C.muted,marginBottom:4}}>Subnivel</div>
                <select style={{background:C.bg,border:`1px solid ${C.border}`,color:C.text,padding:"9px 12px",borderRadius:8,fontSize:13,fontFamily:"'Inter',sans-serif",width:"100%",outline:"none"}}
                  value={newForm.subarea} onChange={e=>setNewForm(f=>({...f,subarea:e.target.value}))}>
                  <option value="">Selecione...</option>
                  {(SETORES_MAP[newForm.area]||[]).map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <div style={{fontSize:11,color:C.muted,marginBottom:4}}>Prazo</div>
                <input style={{background:C.bg,border:`1px solid ${C.border}`,color:C.text,padding:"9px 12px",borderRadius:8,fontSize:13,fontFamily:"'Inter',sans-serif",width:"100%",outline:"none"}}
                  placeholder="dd/mm/aa" value={newForm.prazo} onChange={e=>setNewForm(f=>({...f,prazo:e.target.value}))}/>
              </div>
            </div>
            <div style={{marginBottom:12}}>
              <div style={{fontSize:11,color:C.muted,marginBottom:4}}>Prioridade</div>
              <div style={{display:"flex",gap:8}}>
                {Object.entries(PRIOR_MAP).map(([k,v])=>(
                  <button key={k} onClick={()=>setNewForm(f=>({...f,prioridade:k}))}
                    style={{flex:1,padding:"7px",borderRadius:8,border:`1px solid ${newForm.prioridade===k?v.color:C.border}`,
                    background:newForm.prioridade===k?v.bg:"transparent",color:newForm.prioridade===k?v.color:C.muted,
                    fontSize:12,fontWeight:600,cursor:"pointer"}}>
                    {v.label}
                  </button>
                ))}
              </div>
            </div>
            <div style={{marginBottom:16}}>
              <div style={{fontSize:11,color:C.muted,marginBottom:4}}>Descricao *</div>
              <textarea style={{background:C.bg,border:`1px solid ${C.border}`,color:C.text,padding:"10px 12px",borderRadius:8,fontSize:13,fontFamily:"'Inter',sans-serif",width:"100%",outline:"none",resize:"vertical",minHeight:80}}
                value={newForm.descricao} onChange={e=>setNewForm(f=>({...f,descricao:e.target.value}))} placeholder="Descreva a acao a ser tomada..."/>
            </div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={handleAdd} disabled={!newForm.re||!newForm.descricao}
                style={{flex:1,padding:"11px",background:newForm.re&&newForm.descricao?`linear-gradient(135deg,${C.accent},${C.accent2})`:`${C.border}`,
                color:newForm.re&&newForm.descricao?"#000":C.muted,border:"none",borderRadius:10,fontFamily:"'Inter',sans-serif",fontSize:14,fontWeight:700,cursor:"pointer"}}>
                ✓ Criar Tratativa
              </button>
              <button onClick={()=>setShowModal(false)} className="abt" style={{padding:"11px 18px"}}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20,flexWrap:"wrap"}}>
        <div style={{fontFamily:"'Inter',sans-serif",fontSize:18,fontWeight:700}}>Gestao de Tratativas</div>
        <div style={{flex:1}}/>
        <button className="abt" style={{padding:"8px 14px",background:`${C.gold}15`,borderColor:C.gold,color:C.gold}} onClick={exportExcel}>⬇ Excel</button>
        <button className="abt" style={{padding:"8px 18px",background:`${C.green}18`,borderColor:C.green,color:C.green}} onClick={()=>setShowModal(true)}>+ Nova Tratativa</button>
        {/* toggle view */}
        <div style={{display:"flex",background:C.surface,borderRadius:9,padding:3,gap:3}}>
          {[{id:"kanban",icon:"⬛",l:"Kanban"},{id:"lista",icon:"≡",l:"Lista"}].map(v=>(
            <button key={v.id} onClick={()=>setTab(v.id)} style={{padding:"6px 14px",borderRadius:7,border:"none",cursor:"pointer",fontSize:12,fontWeight:600,
              background:tab===v.id?C.card:"transparent",color:tab===v.id?C.accent:C.muted,transition:"all .2s"}}>
              {v.icon} {v.l}
            </button>
          ))}
        </div>
      </div>

      {/* ── KPIs ── */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12,marginBottom:20}} className="men-kpi-grid">
        {[
          {v:total,     l:"Total",           c:C.accent},
          {v:urgentes,  l:"Urgentes",         c:C.red},
          {v:pendentes, l:"Pendentes",         c:C.orange},
          {v:andamento, l:"Em andamento",      c:C.gold},
          {v:concluido, l:"Concluidas",         c:C.green},
        ].map(x=>(
          <div key={x.l} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"14px 16px",
            borderTop:`2px solid ${x.c}40`,cursor:"pointer"}} onClick={()=>setFiltStatus(x.l==="Total"?"todos":x.l==="Urgentes"?"urgente":x.l==="Pendentes"?"pendente":x.l==="Em andamento"?"andamento":"concluido")}>
            <div style={{fontFamily:"'Inter',sans-serif",fontSize:24,fontWeight:800,color:x.c}}>{x.v}</div>
            <div style={{fontSize:11,color:C.muted,marginTop:2}}>{x.l}</div>
          </div>
        ))}
      </div>

      {/* ── Dashboard grafico por area ── */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:20}}>
        <div className="card">
          <div className="ct"><span className="ctd"/>Tratativas por Area</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={Object.entries(
                tratativas.reduce((acc,t)=>{acc[t.area]=(acc[t.area]||0)+1;return acc;},{})
              ).map(([name,value])=>({name,value}))}
              cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                {tratativas.reduce((acc,t)=>{if(!acc.includes(t.area))acc.push(t.area);return acc;},[]).map((_,i)=>(
                  <Cell key={i} fill={[C.accent,C.accent2,C.purple,C.gold,C.green,C.orange][i%6]}/>
                ))}
              </Pie>
              <Tooltip contentStyle={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:8}}/>
              <Legend/>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <div className="ct"><span className="ctd"/>Status por Area</div>
          <div style={{display:"flex",flexDirection:"column",gap:10,padding:"8px 0"}}>
            {Object.entries(
              tratativas.reduce((acc,t)=>{
                if(!acc[t.area])acc[t.area]={area:t.area,pendente:0,andamento:0,concluido:0};
                acc[t.area][t.status]=(acc[t.area][t.status]||0)+1;
                return acc;
              },{})
            ).map(([area,stats])=>{
              const tot=(stats.pendente||0)+(stats.andamento||0)+(stats.concluido||0);
              const pct=tot?Math.round((stats.concluido/tot)*100):0;
              const ac=AREA_COLORS[area]||C.accent;
              return(
                <div key={area} style={{display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontSize:14}}>{AREA_ICONS_MAP[area]||"📋"}</span>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}>
                      <span style={{fontWeight:600}}>{area}</span>
                      <span style={{color:C.muted,fontSize:11}}>
                        ✓{stats.concluido||0} · ⏳{stats.pendente||0} · 🔄{stats.andamento||0}
                      </span>
                    </div>
                    <div style={{height:6,background:C.border,borderRadius:3,overflow:"hidden"}}>
                      <div style={{width:`${pct}%`,height:"100%",background:ac,borderRadius:3,transition:"width .8s ease"}}/>
                    </div>
                  </div>
                  <span style={{fontSize:12,fontWeight:700,color:ac,minWidth:32,textAlign:"right"}}>{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Filtros ── */}
      <div style={{display:"flex",gap:10,marginBottom:20,flexWrap:"wrap",alignItems:"center"}}>
        <input style={{background:C.card,border:`1px solid ${C.border}`,color:C.text,padding:"9px 14px",borderRadius:10,fontSize:13,fontFamily:"'Inter',sans-serif",flex:1,minWidth:160,outline:"none"}}
          placeholder="🔍 Buscar RE ou nome..." value={filtRe} onChange={e=>setFiltRe(e.target.value)}/>
        <select style={{background:C.card,border:`1px solid ${C.border}`,color:C.text,padding:"9px 12px",borderRadius:10,fontSize:13,fontFamily:"'Inter',sans-serif",outline:"none"}}
          value={filtArea} onChange={e=>setFiltArea(e.target.value)}>
          {areas.map(a=><option key={a} value={a}>{a==="todas"?"Todas as areas":a}</option>)}
        </select>
        <select style={{background:C.card,border:`1px solid ${C.border}`,color:C.text,padding:"9px 12px",borderRadius:10,fontSize:13,fontFamily:"'Inter',sans-serif",outline:"none"}}
          value={filtStatus} onChange={e=>setFiltStatus(e.target.value)}>
          {[{v:"todos",l:"Todos status"},{v:"pendente",l:"Pendente"},{v:"andamento",l:"Em andamento"},{v:"concluido",l:"Concluido"}].map(s=><option key={s.v} value={s.v}>{s.l}</option>)}
        </select>
        <span style={{fontSize:12,color:C.muted}}>{filtered.length} tratativa{filtered.length!==1?"s":""}</span>
      </div>

      {/* ── KANBAN VIEW ── */}
      {tab==="kanban"&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16}}>
          {[
            {status:"pendente",  label:"⏳ Pendente",      color:C.red},
            {status:"andamento", label:"🔄 Em andamento",  color:C.gold},
            {status:"concluido", label:"✓ Concluido",      color:C.green},
          ].map(col=>{
            const items = filtered.filter(t=>t.status===col.status);
            return(
              <div key={col.status}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12,paddingBottom:8,borderBottom:`2px solid ${col.color}40`}}>
                  <span style={{fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:14}}>{col.label}</span>
                  <span style={{background:`${col.color}20`,color:col.color,borderRadius:"50%",width:22,height:22,
                    display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700}}>{items.length}</span>
                </div>
                {items.length===0&&(
                  <div style={{textAlign:"center",padding:"32px 0",color:C.muted,fontSize:12,background:C.bg,borderRadius:10,border:`1px dashed ${C.border}`}}>
                    Nenhuma tratativa
                  </div>
                )}
                {items.map(t=><TCard key={t.id} t={t}/>)}
              </div>
            );
          })}
        </div>
      )}

      {/* ── LISTA VIEW ── */}
      {tab==="lista"&&(
        <div className="card">
          <div className="tw">
            <table>
              <thead>
                <tr>
                  <th>RE</th><th>Operador</th><th>Area</th><th>Descricao</th>
                  <th>Prazo</th><th>Prioridade</th><th>Status</th><th>Retorno</th><th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(t=>{
                  const pr=PRIOR_MAP[t.prioridade]||PRIOR_MAP.media;
                  const st=TRAT_ST_MAP[t.status];
                  const ac=AREA_COLORS[t.area]||C.accent;
                  return(
                    <tr key={t.id} onClick={()=>{setDetalhes(t);setRetornoText(t.retorno||"");setModalStatus(t.status);}}>
                      <td><span className="re-tag">{t.re}</span></td>
                      <td style={{fontSize:12,fontWeight:500}}>{t.nome}</td>
                      <td>
                        <span style={{display:"flex",alignItems:"center",gap:5,fontSize:12,fontWeight:600,color:ac}}>
                          {AREA_ICONS[t.area]} {t.area}{t.subarea?<span style={{color:C.muted,fontWeight:400}}>/{t.subarea}</span>:""}
                        </span>
                      </td>
                      <td style={{fontSize:12,color:C.muted,maxWidth:200}}>{t.descricao.length>50?t.descricao.slice(0,50)+"…":t.descricao}</td>
                      <td style={{fontSize:12,color:C.muted,whiteSpace:"nowrap"}}>{t.prazo||"-"}</td>
                      <td><span className="pill" style={{color:pr.color,background:pr.bg,fontSize:10}}>▲ {pr.label}</span></td>
                      <td><span className="pill" style={{color:st.color,background:st.bg,fontSize:10}}>● {st.label}</span></td>
                      <td style={{fontSize:11,color:t.retorno?C.green:C.muted,maxWidth:140}}>
                        {t.retorno?t.retorno.slice(0,40)+"…":"-"}
                      </td>
                      <td><button className="abt" onClick={e=>{e.stopPropagation();setDetalhes(t);setRetornoText(t.retorno||"");setModalStatus(t.status);}}>Ver</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length===0&&<div style={{textAlign:"center",padding:"40px",color:C.muted,fontSize:13}}>Nenhuma tratativa encontrada</div>}
        </div>
      )}
    </div>
  );
};

// ─── RELATORIOS PAGE ──────────────────────────────────────────────────────────
const RelatoriosPage = ({ data, sessions, tratativas, custos }) => {
  const [tab, setTab] = useState("visao");
  const ops = data.operators || [];

  // ── KPIs gerais ──────────────────────────────────────────────────────────
  const total       = ops.length;
  const emMentoria  = ops.filter(o=>o.status==="mentoria").length;
  const aguardando  = ops.filter(o=>o.status==="aguardando").length;
  const melhoraram  = ops.filter(o=>o.resultado==="melhora").length;
  const pioraram    = ops.filter(o=>o.resultado==="piora").length;
  const avaliacao   = ops.filter(o=>o.resultado==="andamento").length;
  const taxaMelhora = emMentoria>0?Math.round((melhoraram/emMentoria)*100):0;

  // ── Perda total estimada ─────────────────────────────────────────────────
  const perdaTotal = ops.reduce((acc,op)=>{
    const faltas=op.faltas||0, atestados=op.atestados||0;
    const dsr=Math.round(faltas*0.70), ferP=faltas<=5?0:faltas<=14?6:faltas<=23?12:faltas<=32?18:30;
    const vd=custos.valorDiario, vr=custos.valorVR;
    const multasVal=(op.multasValor||0);
    return acc+(faltas*vd)+(dsr*vd)+(ferP*vd)+(ferP*(vd/3))+(atestados*vr)+multasVal;
  },0);

  // ── Ranking operadores por risco ─────────────────────────────────────────
  const ranking = [...ops].map(op=>{
    const score = (op.faltas||0)*3 + (op.multas||0)*2 + (op.suspensoes||0)*5 + (op.acidentes||0)*4;
    return { ...op, score };
  }).sort((a,b)=>b.score-a.score).slice(0,10);

  // ── Causas das mentorias ─────────────────────────────────────────────────
  const causasMap={};
  sessions.forEach(s=>(s.causas||[]).forEach(c=>{ causasMap[c]=(causasMap[c]||0)+1; }));
  const causasRank=Object.entries(causasMap).sort((a,b)=>b[1]-a[1]).map(([name,value])=>({name,value}));
  const totalCausas=causasRank.reduce((a,c)=>a+c.value,0);

  // ── Tratativas por area ──────────────────────────────────────────────────
  const tratByArea={};
  tratativas.forEach(t=>{
    if(!tratByArea[t.area])tratByArea[t.area]={area:t.area,total:0,concluido:0,pendente:0,andamento:0};
    tratByArea[t.area].total++;
    tratByArea[t.area][t.status]++;
  });
  const tratAreaList=Object.values(tratByArea).sort((a,b)=>b.total-a.total);

  // ── Comprometimento medio ────────────────────────────────────────────────
  const sessionsComComp=sessions.filter(s=>s.comprometimento>0);
  const compMedio=sessionsComComp.length?Math.round(sessionsComComp.reduce((a,s)=>a+s.comprometimento,0)/sessionsComComp.length*10)/10:0;

  // ── Evolucao mensal (sessions por mes) ───────────────────────────────────
  const sessoesPorMes={};
  sessions.forEach(s=>{
    const parts=s.data.split("/"); if(parts.length<3)return;
    const key=`${parts[1].padStart(2,"0")}/${parts[2].slice(-2)}`;
    sessoesPorMes[key]=(sessoesPorMes[key]||0)+1;
  });
  const evMensal=Object.entries(sessoesPorMes).sort((a,b)=>a[0].localeCompare(b[0])).map(([k,v])=>({mes:k,sessoes:v}));

  const CT3=({active,payload,label})=>{
    if(!active||!payload?.length)return null;
    return(<div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 14px",fontSize:12}}>
      <div style={{fontWeight:600,marginBottom:4}}>{label}</div>
      {payload.map((p,i)=>(<div key={i} style={{display:"flex",alignItems:"center",gap:6,color:C.muted,marginTop:3}}>
        <div style={{width:8,height:8,borderRadius:"50%",background:p.color}}/>{p.name}: <strong style={{color:p.color}}>{p.value}</strong>
      </div>))}
    </div>);
  };

  // ── PDF Export (print) ───────────────────────────────────────────────────
  const handlePDF = async () => {
    try { await gerarPDFRelatorio(data, sessions, tratativas, custos); }
    catch(e){ alert("Erro ao gerar PDF: "+e.message); }
  };

  // ── Excel Export completo ────────────────────────────────────────────────
  const handleExcelCompleto = async () => {
    try {
      const xlsxLib = await loadXLSX();
      const wb = xlsxLib.utils.book_new();

      // Aba 1 - Visao Geral
      const geral = [
        ["ELEVAMENTE - RELATORIO GERENCIAL",""],
        ["Gerado em", new Date().toLocaleString("pt-BR")],
        ["",""],
        ["INDICADOR","VALOR"],
        ["Total de operadores", total],
        ["Em mentoria", emMentoria],
        ["Aguardando mentoria", aguardando],
        ["Melhoraram", melhoraram],
        ["Pioraram", pioraram],
        ["Em avaliacao", avaliacao],
        ["Taxa de melhora (%)", taxaMelhora+"%"],
        ["Perda financeira total estimada (R$)", perdaTotal.toLocaleString("pt-BR",{style:"currency",currency:"BRL"})],
        ["Comprometimento medio (1-5)", compMedio],
        ["Total de sessoes de mentoria", sessions.length],
        ["Total de tratativas", tratativas.length],
        ["Tratativas concluidas", tratativas.filter(t=>t.status==="concluido").length],
        ["Tratativas pendentes", tratativas.filter(t=>t.status==="pendente").length],
      ];
      const wsGeral = xlsxLib.utils.aoa_to_sheet(geral);
      wsGeral["!cols"]=[{wch:40},{wch:24}];
      xlsxLib.utils.book_append_sheet(wb, wsGeral, "Visao Geral");

      // Aba 2 - Ranking Operadores
      const rankRows = [["#","RE","Nome","Garagem","Funcao","Faltas","Multas","Suspensoes","Acidentes","Score Risco","Status","Resultado","Perda Estimada (R$)"]];
      ranking.forEach((op,i)=>{
        const faltas=op.faltas||0,atestados=op.atestados||0,dsr=Math.round(faltas*0.70);
        const ferP=faltas<=5?0:faltas<=14?6:faltas<=23?12:faltas<=32?18:30;
        const vd=custos.valorDiario,vr=custos.valorVR;
        const perda=faltas*vd+dsr*vd+ferP*vd+ferP*(vd/3)+atestados*vr+(op.multasValor||0);
        rankRows.push([i+1,op.re,op.nome,op.garagem,op.funcao,op.faltas||0,op.multas||0,op.suspensoes||0,op.acidentes||0,op.score,op.status,op.resultado||"-",perda.toLocaleString("pt-BR",{minimumFractionDigits:2})]);
      });
      const wsRank=xlsxLib.utils.aoa_to_sheet(rankRows);
      wsRank["!cols"]=[{wch:4},{wch:10},{wch:28},{wch:10},{wch:14},{wch:8},{wch:8},{wch:12},{wch:10},{wch:12},{wch:14},{wch:14},{wch:22}];
      xlsxLib.utils.book_append_sheet(wb, wsRank, "Ranking Operadores");

      // Aba 3 - Sessoes Mentoria
      const sesRows=[["RE","Nome","Data","Acompanhante","Comprometimento","Causas","Setor","Relato","Denuncia","Status"]];
      sessions.forEach(s=>sesRows.push([s.re,s.nome,s.data,s.tipoAcomp==="Sozinho"?"Sozinho":`${s.tipoAcomp}: ${s.acompanhante||""}`,s.comprometimento,(s.causas||[]).join("; "),s.setor||"-",s.relato,s.denuncia?"Sim":"Nao",s.status]));
      const wsSes=xlsxLib.utils.aoa_to_sheet(sesRows);
      wsSes["!cols"]=[{wch:10},{wch:28},{wch:12},{wch:20},{wch:16},{wch:36},{wch:14},{wch:60},{wch:10},{wch:12}];
      xlsxLib.utils.book_append_sheet(wb, wsSes, "Sessoes Mentoria");

      // Aba 4 - Tratativas
      const tratRows=[["RE","Nome","Area","Subarea","Data","Prazo","Prioridade","Status","Descricao","Retorno"]];
      tratativas.forEach(t=>tratRows.push([t.re,t.nome,t.area,t.subarea||"-",t.data,t.prazo||"-",t.prioridade,t.status,t.descricao,t.retorno||"-"]));
      const wsTrat=xlsxLib.utils.aoa_to_sheet(tratRows);
      wsTrat["!cols"]=[{wch:10},{wch:26},{wch:14},{wch:20},{wch:12},{wch:12},{wch:12},{wch:14},{wch:50},{wch:50}];
      xlsxLib.utils.book_append_sheet(wb, wsTrat, "Tratativas");

      // Aba 5 - Causas
      const cauRows=[["Causa","Qtd Ocorrencias","% do Total"]];
      causasRank.forEach(c=>cauRows.push([c.name,c.value,totalCausas?Math.round(c.value/totalCausas*100)+"%":"-"]));
      const wsCau=xlsxLib.utils.aoa_to_sheet(cauRows);
      wsCau["!cols"]=[{wch:36},{wch:18},{wch:14}];
      xlsxLib.utils.book_append_sheet(wb, wsCau, "Causas Identificadas");

      const date=new Date().toLocaleDateString("pt-BR").replace(/\//g,"-");
      xlsxLib.writeFile(wb, `Elevamente_Relatorio_Completo_${date}.xlsx`);
    } catch(e){ alert("Erro ao exportar: "+e.message); }
  };

  const TABS=[
    {id:"visao",    label:"📊 Visao Geral"},
    {id:"ranking",  label:"🏆 Ranking"},
    {id:"causas",   label:"🔍 Causas"},
    {id:"tratativas",label:"🔁 Tratativas"},
    {id:"evolucao", label:"📈 Evolucao"},
  ];

  return (
    <div className="fu d1">
      <style>{`@media print{.sidebar,.topbar,.rel-tabs,.no-print{display:none!important}.main{margin-left:0!important;padding:12px!important}body{background:white!important;color:#111!important}.card,.rel-kpi-card{background:white!important;border:1px solid #ddd!important;color:#111!important;break-inside:avoid}.card::before{display:none!important}td,th{color:#111!important}.rel-print-title{display:block!important}}`}</style>

      {/* Header */}
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20,flexWrap:"wrap"}} className="no-print">
        <div>
          <div style={{fontFamily:"'Inter',sans-serif",fontSize:18,fontWeight:700}}>Relatorios Gerenciais</div>
          <div style={{fontSize:12,color:C.muted,marginTop:2}}>Gerado em {new Date().toLocaleString("pt-BR")}</div>
        </div>
        <div style={{flex:1}}/>
        <button className="abt" style={{padding:"8px 18px",background:`${C.gold}15`,borderColor:C.gold,color:C.gold}} onClick={handleExcelCompleto}>
          ⬇ Excel Completo
        </button>
        <button style={{background:`${C.purple}18`,color:C.purple,border:`1px solid ${C.purple}40`,borderRadius:8,
          padding:"8px 18px",fontSize:13,fontWeight:600,cursor:"pointer"}} onClick={handlePDF}>
          📄 Gerar PDF
        </button>
      </div>

      {/* Titulo para print */}
      <div style={{display:"none",marginBottom:20}} className="rel-print-title">
        <div style={{fontFamily:"'Inter',sans-serif",fontSize:22,fontWeight:800}}>ELEVAMENTE - Relatorio Gerencial</div>
        <div style={{fontSize:12,color:"#666"}}>Gerado em {new Date().toLocaleString("pt-BR")} · Uso restrito - Diretoria</div>
      </div>

      {/* TABS */}
      <div style={{display:"flex",gap:4,marginBottom:20,background:C.surface,borderRadius:12,padding:5,overflowX:"auto"}} className="rel-tabs no-print">
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,padding:"9px 14px",borderRadius:8,fontSize:13,fontWeight:600,
            cursor:"pointer",textAlign:"center",border:"none",whiteSpace:"nowrap",transition:"all .2s",
            background:tab===t.id?C.card:"transparent",color:tab===t.id?C.accent:C.muted,
            borderBottom:tab===t.id?`2px solid ${C.accent}`:"2px solid transparent"}}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ══ VISAO GERAL ══ */}
      {tab==="visao"&&(
        <div>
          {/* KPIs grade */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:20}} className="men-kpi-grid">
            {[
              {icon:"👥",v:total,        l:"Total Operadores",      c:C.accent  },
              {icon:"🎯",v:emMentoria,   l:"Em Mentoria",           c:C.accent2 },
              {icon:"⏳",v:aguardando,   l:"Aguardando Mentoria",   c:C.orange  },
              {icon:"✅",v:taxaMelhora+"%",l:"Taxa de Melhora",     c:C.green   },
            ].map(x=>(
              <div key={x.l} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"18px 20px",borderTop:`3px solid ${x.c}40`}}>
                <div style={{fontSize:22,marginBottom:8}}>{x.icon}</div>
                <div style={{fontFamily:"'Inter',sans-serif",fontSize:28,fontWeight:800,color:x.c,lineHeight:1}}>{x.v}</div>
                <div style={{fontSize:12,color:C.muted,marginTop:4}}>{x.l}</div>
              </div>
            ))}
          </div>

          <div className="g2" style={{marginBottom:20}}>
            {/* Resultado das mentorias */}
            <div className="card">
              <div className="ct"><span className="ctd"/>Resultado das Mentorias</div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={[{name:"Melhoraram",value:melhoraram},{name:"Em avaliacao",value:avaliacao},{name:"Pioraram",value:pioraram},{name:"Aguardando",value:aguardando}]}
                    cx="50%" cy="50%" innerRadius={52} outerRadius={85} paddingAngle={3} dataKey="value">
                    {[C.green,C.gold,C.red,C.orange].map((c,i)=><Cell key={i} fill={c}/>)}
                  </Pie>
                  <Tooltip content={<CT3/>}/>
                </PieChart>
              </ResponsiveContainer>
              <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap",marginTop:8}}>
                {[{l:"Melhoraram",v:melhoraram,c:C.green},{l:"Avaliacao",v:avaliacao,c:C.gold},{l:"Pioraram",v:pioraram,c:C.red},{l:"Aguardando",v:aguardando,c:C.orange}]
                  .map(x=><div key={x.l} style={{textAlign:"center"}}>
                    <div style={{fontFamily:"'Inter',sans-serif",fontSize:18,fontWeight:800,color:x.c}}>{x.v}</div>
                    <div style={{fontSize:11,color:C.muted}}>{x.l}</div>
                  </div>)}
              </div>
            </div>

            {/* Metricas financeiras + operacionais */}
            <div className="card">
              <div className="ct"><span className="ctd"/>Metricas Gerais</div>
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                {[
                  {l:"Perda financeira total estimada", v:`R$ ${perdaTotal.toLocaleString("pt-BR",{minimumFractionDigits:2})}`, c:C.red, bar:100},
                  {l:"Comprometimento medio nas sessoes", v:`${compMedio} / 5`, c:compMedio>=4?C.green:compMedio>=3?C.gold:C.red, bar:compMedio/5*100},
                  {l:"Total de sessoes de mentoria", v:sessions.length, c:C.accent, bar:Math.min(sessions.length/30*100,100)},
                  {l:"Tratativas concluidas", v:`${tratativas.filter(t=>t.status==="concluido").length} / ${tratativas.length}`, c:C.green, bar:tratativas.length?tratativas.filter(t=>t.status==="concluido").length/tratativas.length*100:0},
                  {l:"Tratativas pendentes (urgencia)", v:tratativas.filter(t=>t.status!=="concluido"&&t.prioridade==="urgente").length, c:C.red, bar:50},
                ].map(x=>(
                  <div key={x.l}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                      <span style={{fontSize:12,color:C.muted}}>{x.l}</span>
                      <span style={{fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:13,color:x.c}}>{x.v}</span>
                    </div>
                    <div style={{height:5,background:C.border,borderRadius:3,overflow:"hidden"}}>
                      <div style={{width:`${Math.min(x.bar,100)}%`,height:"100%",background:x.c,borderRadius:3,transition:"width 1s ease"}}/>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sessoes por mes */}
          {evMensal.length>0&&(
            <div className="card">
              <div className="ct"><span className="ctd"/>Sessoes de Mentoria por Mes</div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={evMensal} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
                  <XAxis dataKey="mes" tick={{fill:C.muted,fontSize:11}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fill:C.muted,fontSize:11}} axisLine={false} tickLine={false} allowDecimals={false}/>
                  <Tooltip content={<CT3/>}/>
                  <Bar dataKey="sessoes" fill={C.accent} radius={[6,6,0,0]} name="Sessoes"/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* ══ RANKING ══ */}
      {tab==="ranking"&&(
        <div>
          <div style={{padding:"12px 16px",background:`${C.orange}10`,border:`1px solid ${C.orange}25`,borderRadius:10,marginBottom:16,fontSize:12,color:C.muted}}>
            📊 <strong style={{color:C.orange}}>Score de risco</strong> = Faltas×3 + Multas×2 + Suspensoes×5 + Acidentes×4. Quanto maior, mais atencao necessaria.
          </div>
          <div className="card">
            <div className="ct"><span className="ctd"/>🏆 Ranking de Operadores por Risco</div>
            <div className="tw">
              <table>
                <thead>
                  <tr><th>#</th><th>RE</th><th>Operador</th><th>Garagem</th><th className="mob-hide">F</th><th className="mob-hide">M</th><th className="mob-hide">S</th><th className="mob-hide">Acid.</th><th>Score</th><th>Status</th><th>Perda Est.</th></tr>
                </thead>
                <tbody>
                  {ranking.map((op,i)=>{
                    const ac=avatarColor(op.re);
                    const faltas=op.faltas||0,atestados=op.atestados||0,dsr=Math.round(faltas*0.70);
                    const ferP=faltas<=5?0:faltas<=14?6:faltas<=23?12:faltas<=32?18:30;
                    const perda=faltas*custos.valorDiario+dsr*custos.valorDiario+ferP*custos.valorDiario+ferP*(custos.valorDiario/3)+atestados*custos.valorVR+(op.multasValor||0);
                    const stl=STATUS_LABEL[op.status]||{label:op.status,color:C.muted,bg:C.border};
                    const scoreColor=op.score>=30?C.red:op.score>=15?C.orange:C.gold;
                    return(
                      <tr key={op.re+i}>
                        <td style={{fontFamily:"'Inter',sans-serif",fontWeight:800,fontSize:15,color:i<3?[C.gold,C.muted,C.orange][i]:C.muted}}>
                          {i===0?"🥇":i===1?"🥈":i===2?"🥉":i+1}
                        </td>
                        <td><span className="re-tag">{op.re}</span></td>
                        <td>
                          <div style={{display:"flex",alignItems:"center",gap:8}}>
                            <div style={{width:30,height:30,borderRadius:8,background:`${ac}20`,color:ac,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,fontFamily:"'Inter',sans-serif",flexShrink:0}}>{initials(op.nome)}</div>
                            <span style={{fontSize:12,fontWeight:500}}>{op.nome}</span>
                          </div>
                        </td>
                        <td style={{color:C.muted,fontSize:12}}>{op.garagem}</td>
                        <td className="mob-hide" style={{color:op.faltas>=10?C.red:op.faltas>=5?C.orange:C.muted,fontWeight:700,textAlign:"center"}}>{op.faltas||0}</td>
                        <td className="mob-hide" style={{color:op.multas>=5?C.red:op.multas>=3?C.orange:C.muted,fontWeight:700,textAlign:"center"}}>{op.multas||0}</td>
                        <td className="mob-hide" style={{color:(op.suspensoes||0)>=1?C.red:C.muted,fontWeight:700,textAlign:"center"}}>{op.suspensoes||0}</td>
                        <td className="mob-hide" style={{color:(op.acidentes||0)>=1?C.orange:C.muted,fontWeight:700,textAlign:"center"}}>{op.acidentes||0}</td>
                        <td>
                          <div style={{display:"flex",alignItems:"center",gap:8}}>
                            <div style={{width:50,height:6,background:C.border,borderRadius:3,overflow:"hidden"}}>
                              <div style={{width:`${Math.min(op.score/50*100,100)}%`,height:"100%",background:scoreColor,borderRadius:3}}/>
                            </div>
                            <span style={{fontFamily:"'Inter',sans-serif",fontWeight:800,color:scoreColor,fontSize:14}}>{op.score}</span>
                          </div>
                        </td>
                        <td><span className="pill" style={{color:stl.color,background:stl.bg,fontSize:10}}>● {stl.label}</span></td>
                        <td style={{fontFamily:"'Inter',sans-serif",fontWeight:700,color:C.red,fontSize:12}}>
                          R$ {perda.toLocaleString("pt-BR",{minimumFractionDigits:2})}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══ CAUSAS ══ */}
      {tab==="causas"&&(
        <div className="g2">
          <div className="card">
            <div className="ct"><span className="ctd"/>Causas mais frequentes nas mentorias</div>
            {causasRank.length===0
              ?<div style={{padding:"40px 0",textAlign:"center",color:C.muted,fontSize:13}}>Nenhuma causa identificada ainda.</div>
              :<>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={causasRank} layout="vertical" margin={{left:10}}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false}/>
                    <XAxis type="number" tick={{fill:C.muted,fontSize:11}} axisLine={false} tickLine={false}/>
                    <YAxis dataKey="name" type="category" tick={{fill:C.muted,fontSize:11}} axisLine={false} tickLine={false} width={140}/>
                    <Tooltip content={<CT3/>}/>
                    <Bar dataKey="value" name="Ocorrencias" radius={[0,6,6,0]}>
                      {causasRank.map((_,i)=><Cell key={i} fill={[C.accent,C.accent2,C.purple,C.gold,C.orange][i%5]}/>)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div style={{marginTop:12}}>
                  {causasRank.map((c,i)=>(
                    <div key={c.name} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:`1px solid ${C.border}20`}}>
                      <div style={{width:8,height:8,borderRadius:"50%",background:[C.accent,C.accent2,C.purple,C.gold,C.orange][i%5],flexShrink:0}}/>
                      <div style={{flex:1,fontSize:13}}>{c.name}</div>
                      <div style={{fontFamily:"'Inter',sans-serif",fontWeight:800,fontSize:14,color:[C.accent,C.accent2,C.purple,C.gold,C.orange][i%5]}}>{c.value}</div>
                      <div style={{fontSize:11,color:C.muted,width:36,textAlign:"right"}}>{totalCausas?Math.round(c.value/totalCausas*100):0}%</div>
                    </div>
                  ))}
                </div>
              </>
            }
          </div>

          <div className="card">
            <div className="ct"><span className="ctd"/>Nivel de comprometimento nas sessoes</div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {[5,4,3,2,1].map(n=>{
                const cnt=sessions.filter(s=>s.comprometimento===n).length;
                const pct=sessions.length?Math.round(cnt/sessions.length*100):0;
                const col=n>=4?C.green:n===3?C.gold:C.red;
                return(<div key={n} style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:28,textAlign:"right",fontSize:13,fontWeight:700,color:col}}>{"★".repeat(n)}</div>
                  <div style={{flex:1,height:18,background:C.border,borderRadius:4,overflow:"hidden"}}>
                    <div style={{width:`${pct}%`,height:"100%",background:col,borderRadius:4,transition:"width 1s ease",display:"flex",alignItems:"center",justifyContent:"flex-end",paddingRight:6}}>
                      {pct>10&&<span style={{fontSize:10,fontWeight:700,color:"#fff"}}>{pct}%</span>}
                    </div>
                  </div>
                  <div style={{width:24,fontSize:12,color:C.muted}}>{cnt}</div>
                </div>);
              })}
            </div>
            <div style={{marginTop:16,padding:"12px 14px",background:C.bg,borderRadius:10,textAlign:"center"}}>
              <div style={{fontFamily:"'Inter',sans-serif",fontSize:32,fontWeight:800,color:compMedio>=4?C.green:compMedio>=3?C.gold:C.red}}>{compMedio}</div>
              <div style={{fontSize:12,color:C.muted}}>Comprometimento medio geral</div>
            </div>
          </div>
        </div>
      )}

      {/* ══ TRATATIVAS ══ */}
      {tab==="tratativas"&&(
        <div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:20}} className="men-kpi-grid">
            {[
              {l:"Total de tratativas",  v:tratativas.length,                                  c:C.accent},
              {l:"Concluidas",           v:tratativas.filter(t=>t.status==="concluido").length,  c:C.green},
              {l:"Pendentes / Andamento",v:tratativas.filter(t=>t.status!=="concluido").length, c:C.orange},
            ].map(x=>(
              <div key={x.l} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"16px 20px",borderTop:`3px solid ${x.c}40`}}>
                <div style={{fontFamily:"'Inter',sans-serif",fontSize:28,fontWeight:800,color:x.c}}>{x.v}</div>
                <div style={{fontSize:12,color:C.muted,marginTop:3}}>{x.l}</div>
              </div>
            ))}
          </div>

          <div className="g2">
            <div className="card">
              <div className="ct"><span className="ctd"/>Tratativas por Area</div>
              {tratAreaList.map(t=>{
                const ac=AREA_COLORS[t.area]||C.accent;
                const pct=Math.round(t.concluido/t.total*100);
                return(
                  <div key={t.area} style={{marginBottom:14}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
                      <span style={{fontSize:18}}>{AREA_ICONS[t.area]}</span>
                      <span style={{fontWeight:600,fontSize:13}}>{t.area}</span>
                      <span style={{marginLeft:"auto",fontSize:12,color:C.muted}}>{t.concluido}/{t.total}</span>
                      <span style={{fontFamily:"'Inter',sans-serif",fontWeight:800,color:ac,fontSize:13}}>{pct}%</span>
                    </div>
                    <div style={{height:8,background:C.border,borderRadius:4,overflow:"hidden"}}>
                      <div style={{width:`${pct}%`,height:"100%",background:ac,borderRadius:4}}/>
                    </div>
                    <div style={{display:"flex",gap:8,marginTop:5}}>
                      {[{l:"Pendente",v:t.pendente||0,c:C.red},{l:"Andamento",v:t.andamento||0,c:C.gold},{l:"Concluido",v:t.concluido||0,c:C.green}]
                        .map(s=><span key={s.l} style={{fontSize:10,color:s.c,background:`${s.c}15`,borderRadius:5,padding:"2px 6px"}}>{s.l}: {s.v}</span>)}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="card">
              <div className="ct"><span className="ctd"/>Distribuicao por Status</div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={[
                    {name:"Concluido",   value:tratativas.filter(t=>t.status==="concluido").length},
                    {name:"Em andamento",value:tratativas.filter(t=>t.status==="andamento").length},
                    {name:"Pendente",    value:tratativas.filter(t=>t.status==="pendente").length},
                  ]} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                    {[C.green,C.gold,C.red].map((c,i)=><Cell key={i} fill={c}/>)}
                  </Pie>
                  <Tooltip content={<CT3/>}/>
                </PieChart>
              </ResponsiveContainer>
              <div style={{display:"flex",gap:16,justifyContent:"center",marginTop:8}}>
                {[{l:"Concluido",c:C.green},{l:"Andamento",c:C.gold},{l:"Pendente",c:C.red}].map(x=>(
                  <div key={x.l} style={{display:"flex",alignItems:"center",gap:5,fontSize:12}}>
                    <div style={{width:10,height:10,borderRadius:"50%",background:x.c}}/>
                    <span style={{color:C.muted}}>{x.l}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ EVOLUCAO ══ */}
      {tab==="evolucao"&&(
        <div>
          <div className="g2" style={{marginBottom:20}}>
            <div className="card">
              <div className="ct"><span className="ctd"/>Sessoes de Mentoria ao Longo do Tempo</div>
              {evMensal.length>0?(
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={evMensal}>
                    <defs>
                      <linearGradient id="gS" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={C.accent} stopOpacity={.3}/><stop offset="95%" stopColor={C.accent} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
                    <XAxis dataKey="mes" tick={{fill:C.muted,fontSize:11}} axisLine={false} tickLine={false}/>
                    <YAxis tick={{fill:C.muted,fontSize:11}} axisLine={false} tickLine={false} allowDecimals={false}/>
                    <Tooltip content={<CT3/>}/>
                    <Area dataKey="sessoes" fill="url(#gS)" stroke={C.accent} strokeWidth={2.5} name="Sessoes"/>
                  </AreaChart>
                </ResponsiveContainer>
              ):<div style={{height:220,display:"flex",alignItems:"center",justifyContent:"center",color:C.muted}}>Nenhum dado disponivel</div>}
            </div>

            <div className="card">
              <div className="ct"><span className="ctd"/>Operadores por Status de Resultado</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={[
                  {status:"Melhoraram",   qtd:melhoraram, fill:C.green  },
                  {status:"Em avaliacao", qtd:avaliacao,  fill:C.gold   },
                  {status:"Pioraram",     qtd:pioraram,   fill:C.red    },
                  {status:"Aguardando",   qtd:aguardando, fill:C.orange },
                ]} barSize={40}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
                  <XAxis dataKey="status" tick={{fill:C.muted,fontSize:11}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fill:C.muted,fontSize:11}} axisLine={false} tickLine={false} allowDecimals={false}/>
                  <Tooltip content={<CT3/>}/>
                  <Bar dataKey="qtd" name="Qtd" radius={[6,6,0,0]}>
                    {[C.green,C.gold,C.red,C.orange].map((c,i)=><Cell key={i} fill={c}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Perda por operador top 5 */}
          <div className="card">
            <div className="ct"><span className="ctd"/>Top 5 - Maior Perda Financeira Estimada</div>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              {ranking.slice(0,5).map((op,i)=>{
                const faltas=op.faltas||0,atestados=op.atestados||0,dsr=Math.round(faltas*0.70);
                const ferP=faltas<=5?0:faltas<=14?6:faltas<=23?12:faltas<=32?18:30;
                const perda=faltas*custos.valorDiario+dsr*custos.valorDiario+ferP*custos.valorDiario+ferP*(custos.valorDiario/3)+atestados*custos.valorVR+(op.multasValor||0);
                const maxPerda=ranking[0]?(()=>{const o=ranking[0];const f=o.faltas||0,at=o.atestados||0,d=Math.round(f*0.70),fp=f<=5?0:f<=14?6:f<=23?12:f<=32?18:30;return f*custos.valorDiario+d*custos.valorDiario+fp*custos.valorDiario+fp*(custos.valorDiario/3)+at*custos.valorVR+(o.multasValor||0);})():1;
                const ac=avatarColor(op.re);
                return(
                  <div key={op.re+i} style={{display:"flex",alignItems:"center",gap:12}}>
                    <div style={{width:36,height:36,borderRadius:10,background:`${ac}20`,color:ac,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Inter',sans-serif",fontWeight:800,fontSize:13,flexShrink:0}}>{initials(op.nome)}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                        <span style={{fontSize:12,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{op.nome}</span>
                        <span style={{fontFamily:"'Inter',sans-serif",fontWeight:800,color:C.red,fontSize:13,flexShrink:0,marginLeft:8}}>
                          R$ {perda.toLocaleString("pt-BR",{minimumFractionDigits:2})}
                        </span>
                      </div>
                      <div style={{height:6,background:C.border,borderRadius:3,overflow:"hidden"}}>
                        <div style={{width:`${maxPerda>0?Math.round(perda/maxPerda*100):0}%`,height:"100%",background:C.red,borderRadius:3}}/>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Rodape */}
      <div style={{marginTop:24,padding:"12px 0",borderTop:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",fontSize:11,color:C.muted}} className="no-print">
        <span>Elevamente · Relatorio gerado em {new Date().toLocaleString("pt-BR")}</span>
        <span style={{fontStyle:"italic"}}>Uso restrito - Diretoria</span>
      </div>
    </div>
  );
};

// ─── PARAMETROS PAGE ──────────────────────────────────────────────────────────
const ParametrosPage = ({ custos, onSave }) => {
  const [form, setForm] = useState({ ...custos });
  const [saved, setSaved] = useState(false);

  const upd = (k,v) => setForm(f=>({ ...f, [k]: parseFloat(v)||0 }));

  const handleSave = () => {
    onSave(form);
    setSaved(true);
    toast("Parametros financeiros salvos com sucesso!", "success");
    setTimeout(()=>setSaved(false), 2500);
  };

  const handleReset = () => setForm({ ...CUSTOS_PADRAO });

  // Preview de calculo para um operador exemplo com os parametros atuais
  const PREVIEW = { faltas:10, atestados:3, multas:2, suspensoes:1, acidentes:0, multasValor:586.94 };
  const previewMOT  = calcPerdaFinanceira({ ...PREVIEW, funcao:"Motorista",    multasValor:586.94 }, form);
  const previewCOB  = calcPerdaFinanceira({ ...PREVIEW, funcao:"Cobrador",     multasValor:0      }, form);
  const previewFISC = calcPerdaFinanceira({ ...PREVIEW, funcao:"Fiscal",       multasValor:0      }, form);

  const inputStyle = {
    background:C.bg, border:`1px solid ${C.border}`, color:C.text,
    padding:"10px 14px", borderRadius:9, fontSize:14, fontFamily:"'Inter',sans-serif",
    width:"100%", outline:"none", transition:"border-color .2s",
  };

  const Section = ({ title, icon, children }) => (
    <div className="card" style={{ marginBottom:16 }}>
      <div className="ct"><span className="ctd"/>{icon} {title}</div>
      {children}
    </div>
  );

  const Field = ({ label, k, hint, prefix="R$" }) => (
    <div>
      <div style={{ fontSize:12, color:C.muted, marginBottom:4, fontWeight:500 }}>{label}</div>
      <div style={{ position:"relative", display:"flex", alignItems:"center" }}>
        <span style={{ position:"absolute", left:12, fontSize:12, color:C.muted, pointerEvents:"none" }}>{prefix}</span>
        <input style={{ ...inputStyle, paddingLeft: prefix ? 30 : 14 }}
          type="number" step="0.01" min="0" value={form[k]}
          onChange={e=>upd(k,e.target.value)}
          onFocus={e=>e.target.style.borderColor=C.accent}
          onBlur={e=>e.target.style.borderColor=C.border}/>
      </div>
      {hint && <div style={{ fontSize:11, color:C.muted, marginTop:3, fontStyle:"italic" }}>{hint}</div>}
    </div>
  );

  return (
    <div className="fu d1">
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:24, flexWrap:"wrap" }}>
        <div>
          <div style={{ fontFamily:"'Inter',sans-serif", fontSize:20, fontWeight:800 }}>⚙️ Parametros Financeiros</div>
          <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>Configure os valores base para o calculo de perda financeira dos operadores.</div>
        </div>
        <div style={{ flex:1 }}/>
        <button className="abt" style={{ padding:"8px 16px", color:C.muted, borderColor:C.border }} onClick={handleReset}>↺ Restaurar padroes</button>
        <button onClick={handleSave} style={{ padding:"10px 24px", borderRadius:10, border:"none", cursor:"pointer", fontFamily:"'Inter',sans-serif", fontSize:14, fontWeight:800,
          background: saved ? `linear-gradient(135deg,${C.green},${C.accent2})` : `linear-gradient(135deg,${C.accent},${C.accent2})`, color:"#000", transition:"all .3s" }}>
          {saved ? "✓ Salvo!" : "💾 Salvar Parametros"}
        </button>
      </div>

      {/* Aviso */}
      <div style={{ background:`${C.gold}10`, border:`1px solid ${C.gold}30`, borderRadius:12, padding:"12px 18px", marginBottom:20, fontSize:13, color:C.muted, display:"flex", alignItems:"flex-start", gap:10 }}>
        <span style={{ fontSize:20 }}>💡</span>
        <div>
          <strong style={{ color:C.gold }}>Como obter os valores corretos:</strong> Valor dia = salario base mensal ÷ 30. Os valores padrao sao baseados no relatorio real do operador RE5319 (MOT = R$ 136,08/dia · VR = R$ 38,28).
          Altere para os valores do seu contrato coletivo de trabalho.
        </div>
      </div>

      <div className="g2" style={{ marginBottom:0 }}>
        <div>
          {/* Valor dia por funcao */}
          <Section title="Valor Diario por Funcao" icon="💼">
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }} className="form-grid-2">
              <Field k="valorDiaMOT"   label="Valor Dia - Motorista (MOT)"    hint="Salario base MOT ÷ 30 dias" />
              <Field k="valorDiaCOB"   label="Valor Dia - Cobrador (COB)"     hint="Salario base COB ÷ 30 dias" />
              <Field k="valorDiaFISC"  label="Valor Dia - Fiscal (FISC)"      hint="Salario base FISC ÷ 30 dias"/>
              <Field k="valorDiaCOORD" label="Valor Dia - Coordenador (COORD)" hint="Salario base COORD ÷ 30 dias"/>
            </div>
          </Section>

          {/* Beneficios */}
          <Section title="Beneficios Diarios" icon="🎟️">
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }} className="form-grid-2">
              <Field k="valorVR" label="Vale Refeicao (VR) por dia"  hint="Valor do ticket refeicao diario" />
              <Field k="valorVT" label="Vale Transporte (VT) por dia" hint="Valor do VT diario (perdido em faltas)" />
            </div>
          </Section>

          {/* Custos operacionais */}
          <Section title="Custos Operacionais" icon="🔧">
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }} className="form-grid-2">
              <Field k="valorHoraExtra" label="Hora extra do substituto (R$)" hint="Custo/hora do motorista substituto" />
              <div>
                <div style={{ fontSize:12, color:C.muted, marginBottom:4, fontWeight:500 }}>Horas de substituicao por dia</div>
                <input style={{ ...inputStyle, paddingLeft:14 }} type="number" step="1" min="0" value={form.horasSubst}
                  onChange={e=>setForm(f=>({...f,horasSubst:parseInt(e.target.value)||0}))}
                  onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.border}/>
                <div style={{ fontSize:11, color:C.muted, marginTop:3, fontStyle:"italic" }}>Quantas horas/dia a substituicao cobre</div>
              </div>
              <Field k="taxaAdmMulta" label="Taxa administrativa por auto de infracao" hint="Custo interno p/ processar cada multa" />
            </div>
          </Section>
        </div>

        <div>
          {/* Encargos */}
          <Section title="Encargos sobre Dias Perdidos" icon="📊">
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:16 }} className="form-grid-2">
              <div>
                <div style={{ fontSize:12, color:C.muted, marginBottom:4, fontWeight:500 }}>FGTS sobre ferias perdidas (%)</div>
                <div style={{ position:"relative", display:"flex", alignItems:"center" }}>
                  <input style={{ ...inputStyle, paddingRight:30 }} type="number" step="0.01" min="0" max="100" value={form.percFGTS}
                    onChange={e=>upd("percFGTS",e.target.value)}
                    onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.border}/>
                  <span style={{ position:"absolute", right:12, fontSize:12, color:C.muted }}>%</span>
                </div>
                <div style={{ fontSize:11, color:C.muted, marginTop:3, fontStyle:"italic" }}>Aliquota FGTS sobre dias de ferias perdidos</div>
              </div>
              <div>
                <div style={{ fontSize:12, color:C.muted, marginBottom:4, fontWeight:500 }}>13º proporcional perdido por falta (%)</div>
                <div style={{ position:"relative", display:"flex", alignItems:"center" }}>
                  <input style={{ ...inputStyle, paddingRight:30 }} type="number" step="0.01" min="0" max="100" value={form.perc13}
                    onChange={e=>upd("perc13",e.target.value)}
                    onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.border}/>
                  <span style={{ position:"absolute", right:12, fontSize:12, color:C.muted }}>%</span>
                </div>
                <div style={{ fontSize:11, color:C.muted, marginTop:3, fontStyle:"italic" }}>1 mes = 8,33% (1/12 do 13º salario)</div>
              </div>
            </div>

            {/* Formula explicada */}
            <div style={{ background:C.bg, borderRadius:10, padding:"14px 16px", fontSize:12, lineHeight:1.9, color:C.muted }}>
              <div style={{ fontWeight:700, color:C.text, marginBottom:6, fontSize:13 }}>📐 Componentes do calculo financeiro:</div>
              {[
                { item:"Faltas × valor dia",             ex:"10 × R$136,08 = R$1.360,80",  cor:C.red    },
                { item:"DSR (≈70% das faltas) × valor dia",ex:"7 × R$136,08 = R$952,56",  cor:C.orange },
                { item:"Ferias perdidas × valor dia",    ex:"6 dias × R$136,08 = R$816,48", cor:C.gold   },
                { item:"Abono 1/3 sobre ferias perdidas",ex:"6 × R$45,36 = R$272,16",      cor:C.gold   },
                { item:"Atestados × VR diario",          ex:"3 × R$38,28 = R$114,84",       cor:C.muted  },
                { item:"Faltas × VT diario",             ex:"10 × R$12,00 = R$120,00",      cor:C.muted  },
                { item:"Faltas × (H.extra × horas/dia)", ex:"10 × R$200,00 = R$2.000,00",   cor:C.purple },
                { item:"Suspensoes × valor dia",         ex:"1 × R$136,08 = R$136,08",      cor:C.purple },
                { item:"13º proporcional (% × dia × faltas)", ex:"8,33% × R$136,08 × 10",  cor:C.muted  },
                { item:"FGTS sobre ferias (% × dia × dias)", ex:"8% × R$136,08 × 6",       cor:C.muted  },
                { item:"Valor das multas + taxa adm.",   ex:"R$586,94 + (2 × R$50)",        cor:C.red    },
              ].map((x,i)=>(
                <div key={i} style={{ display:"flex", alignItems:"baseline", gap:8, padding:"2px 0" }}>
                  <span style={{ width:6, height:6, borderRadius:"50%", background:x.cor, flexShrink:0, marginTop:5, display:"inline-block" }}/>
                  <span style={{ flex:1 }}>{x.item}</span>
                  <span style={{ color:x.cor, fontFamily:"monospace", fontSize:11, flexShrink:0 }}>{x.ex}</span>
                </div>
              ))}
            </div>
          </Section>

          {/* Preview de perda estimada com valores atuais */}
          <Section title="Preview - Perda Estimada (Exemplo: 10 faltas, 3 atestados, 2 multas)" icon="💸">
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
              {[
                { fn:"Motorista",    perda:previewMOT.totalGeral,  cor:C.accent  },
                { fn:"Cobrador",     perda:previewCOB.totalGeral,  cor:C.accent2 },
                { fn:"Fiscal",       perda:previewFISC.totalGeral, cor:C.purple  },
              ].map(x=>(
                <div key={x.fn} style={{ background:C.bg, border:`1px solid ${x.cor}30`, borderRadius:10, padding:"14px", textAlign:"center" }}>
                  <div style={{ fontSize:11, color:C.muted, marginBottom:6 }}>{x.fn}</div>
                  <div style={{ fontFamily:"'Inter',sans-serif", fontSize:18, fontWeight:800, color:x.cor }}>
                    {fmtBRL(x.perda)}
                  </div>
                  <div style={{ fontSize:10, color:C.muted, marginTop:4 }}>por operador</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize:11, color:C.muted, marginTop:10, fontStyle:"italic", textAlign:"center" }}>
              Os valores do preview atualizam em tempo real conforme voce edita os parametros
            </div>
          </Section>
        </div>
      </div>

      {/* Tabela referencia */}
      <div className="card" style={{ marginTop:4 }}>
        <div className="ct"><span className="ctd"/>📋 Parametros Salvos Atualmente</div>
        <div className="tw">
          <table>
            <thead><tr><th>Parametro</th><th>Descricao</th><th style={{ textAlign:"right" }}>Valor Atual</th><th style={{ textAlign:"right" }}>Padrao</th></tr></thead>
            <tbody>
              {[
                { k:"valorDiaMOT",   l:"Valor dia Motorista",          d:"Salario diario MOT",              pad:136.08, pref:"R$" },
                { k:"valorDiaCOB",   l:"Valor dia Cobrador",           d:"Salario diario COB",              pad:120.00, pref:"R$" },
                { k:"valorDiaFISC",  l:"Valor dia Fiscal",             d:"Salario diario FISC",             pad:150.00, pref:"R$" },
                { k:"valorDiaCOORD", l:"Valor dia Coordenador",        d:"Salario diario COORD",            pad:180.00, pref:"R$" },
                { k:"valorVR",       l:"Vale Refeicao",                d:"VR diario (perdido em atestados)",pad:38.28,  pref:"R$" },
                { k:"valorVT",       l:"Vale Transporte",              d:"VT diario (perdido em faltas)",   pad:12.00,  pref:"R$" },
                { k:"valorHoraExtra",l:"Hora extra substituto",        d:"Custo/hora do substituto",        pad:25.00,  pref:"R$" },
                { k:"horasSubst",    l:"Horas substituicao/dia",       d:"Horas cobertas por falta",        pad:8,      pref:"h"  },
                { k:"taxaAdmMulta",  l:"Taxa administrativa por multa",d:"Custo interno/auto de infracao",  pad:50.00,  pref:"R$" },
                { k:"percFGTS",      l:"FGTS sobre ferias perdidas",   d:"% sobre dias de ferias perdidos", pad:8.00,   pref:"%"  },
                { k:"perc13",        l:"13º proporcional",             d:"% perdido por falta (1/12)",      pad:8.33,   pref:"%"  },
              ].map(x=>{
                const atual = form[x.k]??0;
                const changed = Math.abs(atual - x.pad) > 0.001;
                return(
                  <tr key={x.k}>
                    <td style={{ fontFamily:"monospace", fontSize:11, color:C.accent }}>{x.k}</td>
                    <td style={{ fontSize:12 }}>{x.l}<br/><span style={{ fontSize:11, color:C.muted }}>{x.d}</span></td>
                    <td style={{ textAlign:"right", fontFamily:"'Inter',sans-serif", fontWeight:700, color:changed?C.gold:C.text }}>
                      {x.pref==="R$"?fmtBRL(atual):`${atual} ${x.pref}`}
                      {changed && <span style={{ fontSize:10, color:C.gold, marginLeft:4 }}>✎</span>}
                    </td>
                    <td style={{ textAlign:"right", fontSize:12, color:C.muted }}>
                      {x.pref==="R$"?fmtBRL(x.pad):`${x.pad} ${x.pref}`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Save bottom */}
      <div style={{ textAlign:"center", marginTop:20, marginBottom:8 }}>
        <button onClick={handleSave} style={{ padding:"14px 48px", borderRadius:12, border:"none", cursor:"pointer",
          fontFamily:"'Inter',sans-serif", fontSize:16, fontWeight:800, letterSpacing:.5,
          background: saved ? `linear-gradient(135deg,${C.green},${C.accent2})` : `linear-gradient(135deg,${C.accent},${C.accent2})`,
          color:"#000", transition:"all .3s", boxShadow:`0 4px 20px ${C.accent}40` }}>
          {saved ? "✓ Parametros Salvos com Sucesso!" : "💾 Salvar Parametros"}
        </button>
        <div style={{ fontSize:11, color:C.muted, marginTop:8 }}>Os parametros sao aplicados a todos os calculos financeiros do sistema.</div>
      </div>
    </div>
  );
};

// ─── AGENDA DATA INIT ─────────────────────────────────────────────────────────
const hoje = new Date();
const dd = (d) => String(d).padStart(2,"0");
const fmtDate = (d) => `${dd(d.getDate())}/${dd(d.getMonth()+1)}/${String(d.getFullYear()).slice(-2)}`;
const addDays = (d,n) => { const r=new Date(d); r.setDate(r.getDate()+n); return r; };

const AGENDA_INIT = [
  // Esta semana
  { id:1,  re:"RE5319", nome:"Carlos A. Mendes",    tipo:"Mentoria inicial",    hora:"09:00", data:fmtDate(hoje),           durMin:60,  status:"confirmado", obs:"Acompanhante: esposa", local:"Sala RH"   },
  { id:2,  re:"RE4201", nome:"Marcos P. Lima",      tipo:"Acompanhamento",      hora:"10:30", data:fmtDate(hoje),           durMin:45,  status:"confirmado", obs:"",                    local:"RH"        },
  { id:3,  re:"RE6014", nome:"Rafael T. Santos",    tipo:"Mentoria inicial",    hora:"14:00", data:fmtDate(hoje),           durMin:60,  status:"pendente",   obs:"Aguarda confirmacao", local:"Sala 1"    },
  { id:4,  re:"RE3887", nome:"Joao S. Oliveira",    tipo:"Retorno psicologo",   hora:"16:00", data:fmtDate(hoje),           durMin:30,  status:"confirmado", obs:"",                    local:"Psicologia"},
  { id:5,  re:"RE5507", nome:"Paulo B. Rodrigues",  tipo:"Acompanhamento",      hora:"08:30", data:fmtDate(addDays(hoje,1)),durMin:45,  status:"confirmado", obs:"",                    local:"RH"        },
  { id:6,  re:"RE7801", nome:"Felipe A. Nascimento",tipo:"Mentoria inicial",    hora:"11:00", data:fmtDate(addDays(hoje,1)),durMin:60,  status:"pendente",   obs:"Primeira vez",        local:"Sala RH"   },
  { id:7,  re:"RE3341", nome:"Sandro P. Ferreira",  tipo:"Acompanhamento",      hora:"14:30", data:fmtDate(addDays(hoje,2)),durMin:45,  status:"confirmado", obs:"",                    local:"RH"        },
  { id:8,  re:"RE1023", nome:"Ezequiel D. Fonseca", tipo:"Mentoria inicial",    hora:"09:00", data:fmtDate(addDays(hoje,3)),durMin:60,  status:"agendado",   obs:"Novo no programa",    local:"Sala RH"   },
  { id:9,  re:"RE6602", nome:"Odair C. Magalhaes",  tipo:"Retorno ambulatorio", hora:"15:00", data:fmtDate(addDays(hoje,3)),durMin:30,  status:"confirmado", obs:"",                    local:"Ambulatorio"},
  { id:10, re:"RE5671", nome:"Rosivaldo C. Moura",  tipo:"Mentoria inicial",    hora:"10:00", data:fmtDate(addDays(hoje,5)),durMin:60,  status:"agendado",   obs:"",                    local:"Sala RH"   },
  { id:11, re:"RE2934", nome:"Andre M. Costa",      tipo:"Acompanhamento",      hora:"13:00", data:fmtDate(addDays(hoje,5)),durMin:45,  status:"confirmado", obs:"Evolucao positiva",   local:"RH"        },
  { id:12, re:"RE4201", nome:"Marcos P. Lima",      tipo:"Retorno juridico",    hora:"16:30", data:fmtDate(addDays(hoje,7)),durMin:30,  status:"agendado",   obs:"",                    local:"Juridico"  },
];

const TIPO_COLORS = {
  "Mentoria inicial":   { color:"#00D4FF", bg:"#00D4FF18", icon:"🎯" },
  "Acompanhamento":     { color:"#10B981", bg:"#10B98118", icon:"📋" },
  "Retorno psicologo":  { color:"#8B5CF6", bg:"#8B5CF618", icon:"🧠" },
  "Retorno ambulatorio":{ color:"#10B981", bg:"#10B98118", icon:"🏥" },
  "Retorno juridico":   { color:"#F97316", bg:"#F9731618", icon:"⚖️" },
  "Retorno RH":         { color:"#0091FF", bg:"#0091FF18", icon:"👔" },
};
const STATUS_AGENDA = {
  confirmado: { label:"Confirmado", color:"#10B981", bg:"#10B98118" },
  pendente:   { label:"Pendente",   color:"#F59E0B", bg:"#F59E0B18" },
  agendado:   { label:"Agendado",   color:"#00D4FF", bg:"#00D4FF18" },
  realizado:  { label:"Realizado",  color:"#64748B", bg:"#64748B18" },
  faltou:     { label:"Faltou",     color:"#EF4444", bg:"#EF444418" },
};

// ─── AGENDA PAGE ──────────────────────────────────────────────────────────────
const AgendaPage = ({ agenda, onUpdate, onAdd, operators }) => {
  const [view, setView]           = useState("semana"); // semana | lista | calendario
  const [calYear,  setCalYear]    = useState(new Date().getFullYear());
  const [calMonth, setCalMonth]   = useState(new Date().getMonth()); // 0-indexed
  const [calSelDay,setCalSelDay]  = useState(null); // "YYYY-MM-DD"
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem]   = useState(null);
  const [filtStatus, setFiltStatus] = useState("todos");
  const [filtTipo, setFiltTipo]   = useState("todos");
  const [form, setForm] = useState({ re:"", nome:"", tipo:"Mentoria inicial", hora:"09:00", data:fmtDate(hoje), durMin:60, status:"agendado", obs:"", local:"Sala RH" });

  const upd = (k,v) => setForm(f=>({...f,[k]:v}));

  const openNew = () => { setEditItem(null); setForm({ re:"", nome:"", tipo:"Mentoria inicial", hora:"09:00", data:fmtDate(hoje), durMin:60, status:"agendado", obs:"", local:"Sala RH" }); setShowModal(true); };
  const openEdit = (item) => { setEditItem(item); setForm({...item}); setShowModal(true); };

  const exportExcel = async () => {
    try {
      const xlsxLib = await loadXLSX();
      const toExport = datesSorted.flatMap(d=>(byDate[d]||[]));
      const rows = toExport.map(a=>({
        "Data":         a.data,
        "Hora":         a.hora,
        "RE":           a.re,
        "Operador":     a.nome,
        "Tipo":         a.tipo,
        "Local":        a.local||"-",
        "Duracao (min)":a.durMin,
        "Status":       STATUS_AGENDA[a.status]?.label||a.status,
        "Observacao":   a.obs||"-",
      }));
      const ws = xlsxLib.utils.json_to_sheet(rows);
      ws["!cols"]=[{wch:12},{wch:8},{wch:10},{wch:28},{wch:22},{wch:16},{wch:14},{wch:14},{wch:40}];
      const wb = xlsxLib.utils.book_new();
      xlsxLib.utils.book_append_sheet(wb,ws,"Agenda");
      // Summary
      const sumRows=[
        ["RESUMO DA AGENDA",""],
        ["Total agendado",agenda.length],
        ["Realizados",agenda.filter(a=>a.status==="realizado").length],
        ["Pendentes",agenda.filter(a=>a.status==="pendente").length],
        ["Faltaram",agenda.filter(a=>a.status==="faltou").length],
        ["",""],
        ["Por tipo","Qtd"],
        ...[...new Set(agenda.map(a=>a.tipo))].map(t=>[t,agenda.filter(a=>a.tipo===t).length]),
      ];
      const wsS=xlsxLib.utils.aoa_to_sheet(sumRows);
      wsS["!cols"]=[{wch:30},{wch:10}];
      xlsxLib.utils.book_append_sheet(wb,wsS,"Resumo");
      xlsxLib.writeFile(wb,`Elevamente_Agenda_${new Date().toLocaleDateString("pt-BR").replace(/\//g,"-")}.xlsx`);
    } catch(e){ alert("Erro ao exportar: "+e.message); }
  };

  const handleSave = () => {
    const op = operators.find(o=>o.re===form.re);
    const entry = { ...form, nome: op?.nome||form.nome||form.re, id: editItem?.id||Date.now() };
    if (editItem) { onUpdate(agenda.map(a=>a.id===editItem.id?entry:a)); toast("Agendamento atualizado!", "info"); }
    else { onAdd(entry); toast(`${entry.tipo} agendado para ${entry.nome}!`, "success"); }
    setShowModal(false);
  };

  const handleStatus = (id, st) => onUpdate(agenda.map(a=>a.id===id?{...a,status:st}:a));
  const handleDelete = (id) => onUpdate(agenda.filter(a=>a.id!==id));

  // Filter
  const filtered = agenda.filter(a=>{
    const sOk = filtStatus==="todos" || a.status===filtStatus;
    const tOk = filtTipo==="todos"   || a.tipo===filtTipo;
    return sOk && tOk;
  });

  // Group by date
  const byDate = {};
  filtered.forEach(a=>{ if(!byDate[a.data])byDate[a.data]=[];  byDate[a.data].push(a); });
  Object.values(byDate).forEach(arr=>arr.sort((a,b)=>a.hora.localeCompare(b.hora)));
  const datesSorted = Object.keys(byDate).sort((a,b)=>{
    const pa=a.split("/").reverse().join(""), pb=b.split("/").reverse().join(""); return pa.localeCompare(pb);
  });

  // Week days from today
  const weekDays = Array.from({length:7},(_,i)=>{
    const d=addDays(hoje,i);
    return { date:fmtDate(d), label:d.toLocaleDateString("pt-BR",{weekday:"short"}), num:dd(d.getDate()), isToday:i===0 };
  });

  // KPIs
  const total    = agenda.length;
  const hoje_str = fmtDate(hoje);
  const deHoje   = agenda.filter(a=>a.data===hoje_str);
  const pendentes= agenda.filter(a=>a.status==="pendente").length;
  const realizados=agenda.filter(a=>a.status==="realizado").length;
  const faltaram = agenda.filter(a=>a.status==="faltou").length;

  const tiposUniq = [...new Set(agenda.map(a=>a.tipo))];

  const CardItem = ({a, compact=false}) => {
    const tp = TIPO_COLORS[a.tipo] || {color:C.accent,bg:`${C.accent}18`,icon:"📅"};
    const st = STATUS_AGENDA[a.status] || STATUS_AGENDA.agendado;
    const ac = avatarColor(a.re);
    return (
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,
        padding:compact?"10px 14px":"14px 18px",marginBottom:8,cursor:"pointer",
        transition:"all .2s",borderLeft:`3px solid ${tp.color}`}}
        onMouseEnter={e=>e.currentTarget.style.boxShadow=`0 2px 12px ${tp.color}20`}
        onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}
        onClick={()=>openEdit(a)}>
        <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
          {/* Hora */}
          <div style={{fontFamily:"'Inter',sans-serif",fontWeight:800,fontSize:compact?13:15,
            color:tp.color,minWidth:44,flexShrink:0}}>{a.hora}</div>
          {/* Avatar */}
          <div style={{width:compact?30:36,height:compact?30:36,borderRadius:8,background:`${ac}20`,color:ac,
            display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Inter',sans-serif",
            fontWeight:800,fontSize:compact?11:13,flexShrink:0}}>{initials(a.nome)}</div>
          {/* Info */}
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
              <span style={{fontWeight:600,fontSize:compact?12:13,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{a.nome}</span>
              <span className="re-tag" style={{fontSize:10,padding:"1px 5px"}}>{a.re}</span>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8,marginTop:3,flexWrap:"wrap"}}>
              <span style={{fontSize:11,color:tp.color,background:tp.bg,padding:"2px 8px",borderRadius:5,fontWeight:600}}>{tp.icon} {a.tipo}</span>
              {a.local && <span style={{fontSize:11,color:C.muted}}>📍 {a.local}</span>}
              <span style={{fontSize:11,color:C.muted}}>⏱ {a.durMin}min</span>
            </div>
            {a.obs && <div style={{fontSize:11,color:C.muted,marginTop:3,fontStyle:"italic"}}>{a.obs}</div>}
          </div>
          {/* Status + acoes */}
          <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
            <span className="pill" style={{color:st.color,background:st.bg,fontSize:10}}>● {st.label}</span>
            {!compact && (
              <div style={{display:"flex",gap:4}}>
                {a.status!=="realizado" && <button onClick={e=>{e.stopPropagation();handleStatus(a.id,"realizado");}}
                  style={{padding:"3px 8px",borderRadius:6,border:`1px solid ${C.green}`,background:`${C.green}15`,color:C.green,fontSize:10,cursor:"pointer",fontWeight:600}}>✓</button>}
                {a.status!=="faltou" && <button onClick={e=>{e.stopPropagation();handleStatus(a.id,"faltou");}}
                  style={{padding:"3px 8px",borderRadius:6,border:`1px solid ${C.red}`,background:`${C.red}15`,color:C.red,fontSize:10,cursor:"pointer",fontWeight:600}}>✗</button>}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fu d1">
      {/* ── Modal agendar/editar ── */}
      {showModal && (
        <div style={{position:"fixed",inset:0,background:"#000c",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}
          onClick={()=>setShowModal(false)}>
          <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:18,padding:28,width:"100%",maxWidth:520,maxHeight:"90vh",overflowY:"auto"}}
            onClick={e=>e.stopPropagation()}>
            <div style={{fontFamily:"'Inter',sans-serif",fontSize:17,fontWeight:700,marginBottom:20}}>
              {editItem?"✏️ Editar Agendamento":"📅 Novo Agendamento"}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}} className="form-grid-2">
              <div>
                <div style={{fontSize:11,color:C.muted,marginBottom:4}}>Operador *</div>
                <select style={{background:C.bg,border:`1px solid ${C.border}`,color:C.text,padding:"9px 12px",borderRadius:8,fontSize:13,fontFamily:"'Inter',sans-serif",width:"100%",outline:"none"}}
                  value={form.re} onChange={e=>{const op=operators.find(o=>o.re===e.target.value);upd("re",e.target.value);if(op)upd("nome",op.nome);}}>
                  <option value="">Selecione...</option>
                  {operators.map(o=><option key={o.re} value={o.re}>{o.re} - {o.nome}</option>)}
                </select>
              </div>
              <div>
                <div style={{fontSize:11,color:C.muted,marginBottom:4}}>Tipo de encontro *</div>
                <select style={{background:C.bg,border:`1px solid ${C.border}`,color:C.text,padding:"9px 12px",borderRadius:8,fontSize:13,fontFamily:"'Inter',sans-serif",width:"100%",outline:"none"}}
                  value={form.tipo} onChange={e=>upd("tipo",e.target.value)}>
                  {["Mentoria inicial","Acompanhamento","Retorno psicologo","Retorno ambulatorio","Retorno juridico","Retorno RH"].map(t=><option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <div style={{fontSize:11,color:C.muted,marginBottom:4}}>Data *</div>
                <input style={{background:C.bg,border:`1px solid ${C.border}`,color:C.text,padding:"9px 12px",borderRadius:8,fontSize:13,fontFamily:"'Inter',sans-serif",width:"100%",outline:"none"}}
                  placeholder="dd/mm/aa" value={form.data} onChange={e=>upd("data",e.target.value)}/>
              </div>
              <div>
                <div style={{fontSize:11,color:C.muted,marginBottom:4}}>Horario *</div>
                <input style={{background:C.bg,border:`1px solid ${C.border}`,color:C.text,padding:"9px 12px",borderRadius:8,fontSize:13,fontFamily:"'Inter',sans-serif",width:"100%",outline:"none"}}
                  type="time" value={form.hora} onChange={e=>upd("hora",e.target.value)}/>
              </div>
              <div>
                <div style={{fontSize:11,color:C.muted,marginBottom:4}}>Duracao (minutos)</div>
                <select style={{background:C.bg,border:`1px solid ${C.border}`,color:C.text,padding:"9px 12px",borderRadius:8,fontSize:13,fontFamily:"'Inter',sans-serif",width:"100%",outline:"none"}}
                  value={form.durMin} onChange={e=>upd("durMin",parseInt(e.target.value))}>
                  {[30,45,60,90,120].map(d=><option key={d} value={d}>{d} min</option>)}
                </select>
              </div>
              <div>
                <div style={{fontSize:11,color:C.muted,marginBottom:4}}>Local</div>
                <select style={{background:C.bg,border:`1px solid ${C.border}`,color:C.text,padding:"9px 12px",borderRadius:8,fontSize:13,fontFamily:"'Inter',sans-serif",width:"100%",outline:"none"}}
                  value={form.local} onChange={e=>upd("local",e.target.value)}>
                  {["Sala RH","RH","Sala 1","Sala 2","Psicologia","Ambulatorio","Juridico","Online","Externo"].map(l=><option key={l}>{l}</option>)}
                </select>
              </div>
            </div>
            <div style={{marginBottom:12}}>
              <div style={{fontSize:11,color:C.muted,marginBottom:4}}>Status</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {Object.entries(STATUS_AGENDA).map(([k,v])=>(
                  <button key={k} onClick={()=>upd("status",k)} style={{padding:"6px 14px",borderRadius:8,border:`1px solid ${form.status===k?v.color:C.border}`,
                    background:form.status===k?v.bg:"transparent",color:form.status===k?v.color:C.muted,fontSize:12,fontWeight:600,cursor:"pointer"}}>
                    {v.label}
                  </button>
                ))}
              </div>
            </div>
            <div style={{marginBottom:16}}>
              <div style={{fontSize:11,color:C.muted,marginBottom:4}}>Observacao</div>
              <textarea style={{background:C.bg,border:`1px solid ${C.border}`,color:C.text,padding:"9px 12px",borderRadius:8,fontSize:13,
                fontFamily:"'Inter',sans-serif",width:"100%",outline:"none",resize:"vertical",minHeight:60}}
                placeholder="Acompanhante, orientacoes especiais..." value={form.obs} onChange={e=>upd("obs",e.target.value)}/>
            </div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={handleSave} disabled={!form.re||!form.data||!form.hora}
                style={{flex:1,padding:"11px",background:form.re&&form.data&&form.hora?`linear-gradient(135deg,${C.accent},${C.accent2})`:`${C.border}`,
                  color:form.re&&form.data&&form.hora?"#000":C.muted,border:"none",borderRadius:10,fontFamily:"'Inter',sans-serif",fontSize:14,fontWeight:700,cursor:"pointer"}}>
                {editItem?"💾 Salvar alteracoes":"📅 Confirmar agendamento"}
              </button>
              {editItem && <button onClick={()=>{handleDelete(editItem.id);setShowModal(false);}}
                style={{padding:"11px 16px",background:`${C.red}18`,color:C.red,border:`1px solid ${C.red}30`,borderRadius:10,fontSize:13,cursor:"pointer",fontWeight:600}}>🗑</button>}
              <button onClick={()=>setShowModal(false)} className="abt" style={{padding:"11px 16px"}}>✕</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20,flexWrap:"wrap"}}>
        <div>
          <div style={{fontFamily:"'Inter',sans-serif",fontSize:18,fontWeight:700}}>Agenda de Mentorias</div>
          <div style={{fontSize:12,color:C.muted,marginTop:2}}>{new Date().toLocaleDateString("pt-BR",{weekday:"long",day:"2-digit",month:"long",year:"numeric"})}</div>
        </div>
        <div style={{flex:1}}/>
        <div style={{display:"flex",background:C.surface,borderRadius:9,padding:3,gap:3}}>
          {[{id:"semana",l:"Semana"},{id:"lista",l:"Lista"},{id:"calendario",l:"Calendario"}].map(v=>(
            <button key={v.id} onClick={()=>setView(v.id)} style={{padding:"6px 14px",borderRadius:7,border:"none",cursor:"pointer",fontSize:12,fontWeight:600,
              background:view===v.id?C.card:"transparent",color:view===v.id?C.accent:C.muted,transition:"all .2s"}}>
              {v.l}
            </button>
          ))}
        </div>
        <button className="abt" style={{padding:"9px 16px",background:`${C.gold}15`,borderColor:C.gold,color:C.gold}} onClick={exportExcel}>
          ⬇ Excel
        </button>
        <button onClick={openNew} style={{padding:"9px 20px",borderRadius:10,border:"none",cursor:"pointer",
          background:`linear-gradient(135deg,${C.accent},${C.accent2})`,color:"#000",fontFamily:"'Inter',sans-serif",fontSize:13,fontWeight:700}}>
          + Agendar
        </button>
      </div>

      {/* ── KPIs ── */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12,marginBottom:20}} className="men-kpi-grid">
        {[
          {v:total,       l:"Total agendado",  c:C.accent},
          {v:deHoje.length,l:"Hoje",           c:C.accent2},
          {v:pendentes,   l:"Pendentes",       c:C.gold},
          {v:realizados,  l:"Realizados",      c:C.green},
          {v:faltaram,    l:"Faltaram",        c:C.red},
        ].map(x=>(
          <div key={x.l} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"14px 16px",borderTop:`2px solid ${x.c}40`}}>
            <div style={{fontFamily:"'Inter',sans-serif",fontSize:24,fontWeight:800,color:x.c}}>{x.v}</div>
            <div style={{fontSize:11,color:C.muted,marginTop:2}}>{x.l}</div>
          </div>
        ))}
      </div>

      {/* ── Filtros ── */}
      <div style={{display:"flex",gap:10,marginBottom:18,flexWrap:"wrap",alignItems:"center"}}>
        <select style={{background:C.card,border:`1px solid ${C.border}`,color:C.text,padding:"8px 12px",borderRadius:9,fontSize:12,fontFamily:"'Inter',sans-serif",outline:"none"}}
          value={filtStatus} onChange={e=>setFiltStatus(e.target.value)}>
          <option value="todos">Todos os status</option>
          {Object.entries(STATUS_AGENDA).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
        </select>
        <select style={{background:C.card,border:`1px solid ${C.border}`,color:C.text,padding:"8px 12px",borderRadius:9,fontSize:12,fontFamily:"'Inter',sans-serif",outline:"none"}}
          value={filtTipo} onChange={e=>setFiltTipo(e.target.value)}>
          <option value="todos">Todos os tipos</option>
          {tiposUniq.map(t=><option key={t}>{t}</option>)}
        </select>
        <span style={{fontSize:12,color:C.muted}}>{filtered.length} compromisso{filtered.length!==1?"s":""}</span>
      </div>

      {/* ══ VISAO SEMANA ══ */}
      {view==="semana" && (
        <div>
          {/* Strip 7 dias */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:8,marginBottom:20}}>
            {weekDays.map(d=>{
              const items=byDate[d.date]||[];
              return(
                <div key={d.date} style={{background:d.isToday?`${C.accent}15`:C.card,border:`1px solid ${d.isToday?C.accent:C.border}`,
                  borderRadius:12,padding:"10px 8px",textAlign:"center",cursor:"pointer",transition:"all .2s"}}
                  onClick={()=>setFiltStatus("todos")}>
                  <div style={{fontSize:10,color:d.isToday?C.accent:C.muted,fontWeight:600,textTransform:"uppercase",marginBottom:4}}>{d.label}</div>
                  <div style={{fontFamily:"'Inter',sans-serif",fontSize:20,fontWeight:800,color:d.isToday?C.accent:C.text,marginBottom:6}}>{d.num}</div>
                  {items.length>0
                    ? <div style={{fontFamily:"'Inter',sans-serif",fontSize:14,fontWeight:700,color:d.isToday?C.accent:C.accent2}}>{items.length}</div>
                    : <div style={{fontSize:11,color:C.muted}}>-</div>}
                  {items.length>0&&<div style={{fontSize:9,color:C.muted}}>item{items.length!==1?"s":""}</div>}
                </div>
              );
            })}
          </div>

          {/* Hoje em destaque */}
          {deHoje.length>0 && (
            <div className="card" style={{marginBottom:20,borderColor:`${C.accent}40`}}>
              <div className="ct" style={{marginBottom:12}}>
                <span className="ctd"/>
                <span style={{color:C.accent}}>🔵 Hoje - {new Date().toLocaleDateString("pt-BR",{weekday:"long",day:"2-digit",month:"long"})}</span>
                <span style={{marginLeft:"auto",fontSize:11,color:C.muted}}>{deHoje.length} compromisso{deHoje.length!==1?"s":""}</span>
              </div>
              {deHoje.sort((a,b)=>a.hora.localeCompare(b.hora)).map(a=><CardItem key={a.id} a={a}/>)}
            </div>
          )}

          {/* Proximos dias */}
          {datesSorted.filter(d=>d!==hoje_str).map(d=>(
            <div key={d} style={{marginBottom:16}}>
              <div style={{fontSize:12,fontWeight:700,color:C.muted,marginBottom:8,display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:4,height:4,borderRadius:"50%",background:C.muted}}/>
                {d}
                <span style={{color:C.border}}>·</span>
                <span>{byDate[d].length} item{byDate[d].length!==1?"s":""}</span>
              </div>
              {byDate[d].map(a=><CardItem key={a.id} a={a} compact/>)}
            </div>
          ))}
          {datesSorted.length===0&&<div style={{textAlign:"center",padding:"48px 0",opacity:.5}}><div style={{fontSize:40,marginBottom:10}}>📅</div><div style={{fontFamily:"'Inter',sans-serif",fontSize:16}}>Nenhum agendamento encontrado</div></div>}
        </div>
      )}

      {/* ══ LISTA COMPLETA ══ */}
      {view==="lista" && (
        <div className="card">
          <div className="tw">
            <table>
              <thead>
                <tr><th>Data</th><th>Hora</th><th>RE</th><th>Operador</th><th>Tipo</th><th>Local</th><th>Duracao</th><th>Status</th><th>Obs</th><th></th></tr>
              </thead>
              <tbody>
                {datesSorted.flatMap(d=>byDate[d]).map(a=>{
                  const tp=TIPO_COLORS[a.tipo]||{color:C.accent,bg:`${C.accent}18`,icon:"📅"};
                  const st=STATUS_AGENDA[a.status]||STATUS_AGENDA.agendado;
                  const ac=avatarColor(a.re);
                  return(
                    <tr key={a.id} onClick={()=>openEdit(a)} style={{cursor:"pointer"}}>
                      <td style={{fontSize:12,color:a.data===hoje_str?C.accent:C.muted,fontWeight:a.data===hoje_str?700:400}}>
                        {a.data===hoje_str?"Hoje":a.data}
                      </td>
                      <td style={{fontFamily:"'Inter',sans-serif",fontWeight:700,color:tp.color,fontSize:13}}>{a.hora}</td>
                      <td><span className="re-tag">{a.re}</span></td>
                      <td>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <div style={{width:28,height:28,borderRadius:7,background:`${ac}20`,color:ac,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Inter',sans-serif",fontWeight:800,fontSize:10,flexShrink:0}}>{initials(a.nome)}</div>
                          <span style={{fontSize:12,fontWeight:500}}>{a.nome}</span>
                        </div>
                      </td>
                      <td><span style={{fontSize:11,color:tp.color,background:tp.bg,padding:"2px 8px",borderRadius:5,fontWeight:600,whiteSpace:"nowrap"}}>{tp.icon} {a.tipo}</span></td>
                      <td style={{fontSize:12,color:C.muted}}>{a.local}</td>
                      <td style={{fontSize:12,color:C.muted,whiteSpace:"nowrap"}}>{a.durMin}min</td>
                      <td><span className="pill" style={{color:st.color,background:st.bg,fontSize:10}}>● {st.label}</span></td>
                      <td style={{fontSize:11,color:C.muted,maxWidth:140,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.obs||"-"}</td>
                      <td>
                        <div style={{display:"flex",gap:4}}>
                          <button onClick={e=>{e.stopPropagation();handleStatus(a.id,"realizado");}}
                            style={{padding:"3px 7px",borderRadius:5,border:`1px solid ${C.green}`,background:`${C.green}15`,color:C.green,fontSize:10,cursor:"pointer"}}>✓</button>
                          <button onClick={e=>{e.stopPropagation();handleStatus(a.id,"faltou");}}
                            style={{padding:"3px 7px",borderRadius:5,border:`1px solid ${C.red}`,background:`${C.red}15`,color:C.red,fontSize:10,cursor:"pointer"}}>✗</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length===0&&<div style={{textAlign:"center",padding:"40px",color:C.muted,fontSize:13}}>Nenhum agendamento encontrado</div>}
        </div>
      )}

      {/* ══ CALENDARIO MENSAL ══ */}
      {view==="calendario" && (
        <div className="card">
          {/* Calendar header with navigation */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
            <button onClick={()=>{ const d=new Date(calYear,calMonth-1,1); setCalYear(d.getFullYear()); setCalMonth(d.getMonth()); }}
              style={{background:C.border,border:"none",color:C.text,padding:"4px 12px",borderRadius:7,cursor:"pointer",fontSize:16,fontWeight:700}}>‹</button>
            <div style={{fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:15,color:C.text}}>
              {new Date(calYear,calMonth,1).toLocaleDateString("pt-BR",{month:"long",year:"numeric"}).replace(/^\w/,c=>c.toUpperCase())}
            </div>
            <button onClick={()=>{ const d=new Date(calYear,calMonth+1,1); setCalYear(d.getFullYear()); setCalMonth(d.getMonth()); }}
              style={{background:C.border,border:"none",color:C.text,padding:"4px 12px",borderRadius:7,cursor:"pointer",fontSize:16,fontWeight:700}}>›</button>
          </div>
          {/* Dias da semana header */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4,marginBottom:8}}>
            {["Dom","Seg","Ter","Qua","Qui","Sex","Sab"].map(d=>(
              <div key={d} style={{textAlign:"center",fontSize:11,fontWeight:700,color:C.muted,padding:"4px 0"}}>{d}</div>
            ))}
          </div>
          {/* Celulas do calendario */}
          {(()=>{
            const startDay=new Date(calYear,calMonth,1).getDay();
            const daysInMonth=new Date(calYear,calMonth+1,0).getDate();
            const cells=[];
            for(let i=0;i<startDay;i++) cells.push(null);
            for(let d=1;d<=daysInMonth;d++) cells.push(d);
            while(cells.length%7!==0) cells.push(null);
            const rows=[];
            for(let i=0;i<cells.length;i+=7) rows.push(cells.slice(i,i+7));
            return rows.map((row,ri)=>(
              <div key={ri} style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4,marginBottom:4}}>
                {row.map((day,ci)=>{
                  if(!day) return <div key={ci}/>;
                  const dateStr=fmtDate(new Date(calYear,calMonth,day));
                  const items=(byDate[dateStr]||[]);
                  const isToday=(day===hoje.getDate()&&calMonth===hoje.getMonth()&&calYear===hoje.getFullYear());
                  const isSel=calSelDay===dateStr;
                  const hasItems=items.length>0;
                  return(
                    <div key={ci}
                      onClick={()=>{ setCalSelDay(isSel?null:dateStr); if(hasItems){setView("lista");}else{setCalSelDay(dateStr);openNew();} }}
                      style={{minHeight:64,background:isSel?`${C.accent}25`:isToday?`${C.accent}15`:C.bg,
                        border:`1px solid ${isSel?C.accent:isToday?C.accent:hasItems?C.accent+"40":C.border}`,
                        borderRadius:8,padding:"6px",cursor:"pointer",transition:"all .2s"}}
                      onMouseEnter={e=>e.currentTarget.style.background=`${C.accent}20`}
                      onMouseLeave={e=>e.currentTarget.style.background=isSel?`${C.accent}25`:isToday?`${C.accent}15`:C.bg}>
                      <div style={{fontFamily:"'Inter',sans-serif",fontWeight:isToday||isSel?800:500,fontSize:13,
                        color:isToday||isSel?C.accent:C.text,marginBottom:4}}>{day}</div>
                      {items.slice(0,3).map(a=>{
                        const tp=TIPO_COLORS[a.tipo]||{color:C.accent};
                        return(<div key={a.id} style={{fontSize:9,fontWeight:600,color:tp.color,background:`${tp.color}18`,
                          borderRadius:3,padding:"1px 4px",marginBottom:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                          {a.hora} {a.nome.split(" ")[0]}
                        </div>);
                      })}
                      {items.length>3&&<div style={{fontSize:9,color:C.muted,fontWeight:600}}>+{items.length-3}</div>}
                    </div>
                  );
                })}
              </div>
            ));
          })()}
          {/* Legenda */}
          <div style={{display:"flex",gap:12,flexWrap:"wrap",marginTop:16,paddingTop:12,borderTop:`1px solid ${C.border}`}}>
            {Object.entries(TIPO_COLORS).map(([k,v])=>(
              <div key={k} style={{display:"flex",alignItems:"center",gap:5,fontSize:11}}>
                <div style={{width:10,height:10,borderRadius:2,background:v.color}}/><span style={{color:C.muted}}>{k}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── AUDITORIA PAGE ──────────────────────────────────────────────────────────
const AuditoriaPage = ({ auditLogs, user }) => {
  const [filtUser, setFiltUser] = useState("todos");
  const [filtTipo, setFiltTipo] = useState("todos");
  const [filtSearch, setFiltSearch] = useState("");

  const usuarios = [...new Set(auditLogs.map(l=>l.usuario))];
  const tipos    = [...new Set(auditLogs.map(l=>l.tipo))];

  const filtered = auditLogs.filter(l=>{
    const uOk = filtUser==="todos" || l.usuario===filtUser;
    const tOk = filtTipo==="todos" || l.tipo===filtTipo;
    const sOk = !filtSearch || l.acao.toLowerCase().includes(filtSearch.toLowerCase()) ||
                l.usuario.toLowerCase().includes(filtSearch.toLowerCase());
    return uOk && tOk && sOk;
  });

  const tipoColor = {
    "Criou":    C.green,  "Editou":   C.gold,  "Excluiu": C.red,
    "Acessou":  C.muted,  "Upload":   C.accent, "Login":   C.accent2,
  };

  const exportAudit = async () => {
    try {
      const xlsxLib = await loadXLSX();
      const rows = filtered.map(l=>({
        "Data/Hora": l.dataHora, "Usuario": l.usuario, "Perfil": l.perfil,
        "Tipo": l.tipo, "Acao": l.acao, "Detalhes": l.detalhes||"",
      }));
      const ws = xlsxLib.utils.json_to_sheet(rows);
      ws["!cols"] = [{wch:20},{wch:16},{wch:14},{wch:12},{wch:50},{wch:40}];
      const wb = xlsxLib.utils.book_new();
      xlsxLib.utils.book_append_sheet(wb, ws, "Auditoria");
      xlsxLib.writeFile(wb, `Auditoria_Elevamente_${new Date().toLocaleDateString("pt-BR").replace(/\//g,"-")}.xlsx`);
    } catch(e) { alert("Erro: "+e.message); }
  };

  return (
    <div className="fu d1">
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20,flexWrap:"wrap"}}>
        <div>
          <div style={{fontFamily:"'Inter',sans-serif",fontSize:20,fontWeight:700}}>🔍 Auditoria do Sistema</div>
          <div style={{fontSize:13,color:C.muted,marginTop:2}}>Registro completo de todas as acoes realizadas</div>
        </div>
        <div style={{flex:1}}/>
        <button className="abt" style={{background:`${C.gold}15`,borderColor:C.gold,color:C.gold,padding:"8px 16px"}}
          onClick={exportAudit}>⬇ Exportar Excel</button>
        <button className="abt" style={{background:`${C.red}15`,borderColor:C.red,color:C.red,padding:"8px 16px"}}
          onClick={()=>{ if(window.confirm("Limpar historico de auditoria?")){ localStorage.removeItem("elevamente_audit_v1"); window.location.reload(); }}}>
          🗑 Limpar
        </button>
      </div>

      {/* Stats rapidos */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}} className="men-kpi-grid">
        {[
          {l:"Total de acoes",  v:auditLogs.length,                              c:C.accent},
          {l:"Usuarios ativos", v:new Set(auditLogs.map(l=>l.usuario)).size,      c:C.green},
          {l:"Criacoes",        v:auditLogs.filter(l=>l.tipo==="Criou").length,    c:C.accent2},
          {l:"Modificacoes",    v:auditLogs.filter(l=>l.tipo==="Editou").length,   c:C.gold},
        ].map(x=>(
          <div key={x.l} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"14px 18px",borderTop:`2px solid ${x.c}40`}}>
            <div style={{fontFamily:"'Inter',sans-serif",fontSize:24,fontWeight:800,color:x.c,fontVariantNumeric:"tabular-nums"}}>{x.v}</div>
            <div style={{fontSize:12,color:C.muted,marginTop:3}}>{x.l}</div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
        <input style={{background:C.card,border:`1px solid ${C.border}`,color:C.text,padding:"9px 14px",
          borderRadius:10,fontSize:13,fontFamily:"'Inter',sans-serif",flex:1,minWidth:200,outline:"none"}}
          placeholder="🔍 Buscar acao ou usuario..." value={filtSearch} onChange={e=>setFiltSearch(e.target.value)}/>
        <select style={{background:C.card,border:`1px solid ${C.border}`,color:C.text,padding:"9px 12px",borderRadius:10,fontSize:13,fontFamily:"'Inter',sans-serif",outline:"none"}}
          value={filtUser} onChange={e=>setFiltUser(e.target.value)}>
          <option value="todos">Todos usuarios</option>
          {usuarios.map(u=><option key={u} value={u}>{u}</option>)}
        </select>
        <select style={{background:C.card,border:`1px solid ${C.border}`,color:C.text,padding:"9px 12px",borderRadius:10,fontSize:13,fontFamily:"'Inter',sans-serif",outline:"none"}}
          value={filtTipo} onChange={e=>setFiltTipo(e.target.value)}>
          <option value="todos">Todos os tipos</option>
          {tipos.map(t=><option key={t} value={t}>{t}</option>)}
        </select>
        <span style={{fontSize:12,color:C.muted}}>{filtered.length} registro{filtered.length!==1?"s":""}</span>
      </div>

      {/* Tabela */}
      <div className="card">
        <div className="tw">
          <table>
            <thead>
              <tr>
                <th>Data/Hora</th><th>Usuario</th><th>Perfil</th>
                <th>Tipo</th><th>Acao</th><th>Detalhes</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length===0 && (
                <tr><td colSpan={6} style={{textAlign:"center",padding:"40px",color:C.muted}}>
                  Nenhum registro encontrado
                </td></tr>
              )}
              {filtered.map((l,i)=>{
                const cor = tipoColor[l.tipo]||C.muted;
                return(
                  <tr key={l.id||i}>
                    <td style={{fontSize:12,color:C.muted,whiteSpace:"nowrap"}}>{l.dataHora}</td>
                    <td style={{fontWeight:600,fontSize:13}}>{l.usuario}</td>
                    <td style={{fontSize:12,color:C.muted}}>{l.perfil}</td>
                    <td>
                      <span style={{display:"inline-flex",alignItems:"center",padding:"2px 10px",borderRadius:20,
                        fontSize:11,fontWeight:700,color:cor,background:`${cor}18`,border:`1px solid ${cor}30`}}>
                        {l.tipo}
                      </span>
                    </td>
                    <td style={{fontSize:13,maxWidth:280}}>{l.acao}</td>
                    <td style={{fontSize:12,color:C.muted,maxWidth:200}}>{l.detalhes||"-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {auditLogs.length===0&&(
        <div style={{textAlign:"center",padding:"60px 0",opacity:.5}}>
          <div style={{fontSize:48,marginBottom:12}}>📋</div>
          <div style={{fontFamily:"'Inter',sans-serif",fontSize:16,fontWeight:700}}>Nenhuma acao registrada ainda</div>
          <div style={{color:C.muted,fontSize:13,marginTop:6}}>As acoes aparecerao aqui conforme o sistema for utilizado</div>
        </div>
      )}
    </div>
  );
};

const ComingSoon = ({ title }) => (
  <div style={{ display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"60vh",gap:16,opacity:.6 }}>
    <div style={{ fontSize:56 }}>🚧</div>
    <div style={{ fontFamily:"'Inter',sans-serif",fontSize:22,fontWeight:700 }}>{title}</div>
    <div style={{ color:C.muted,fontSize:14 }}>Sera implementado na proxima fase</div>
  </div>
);

// ─── LOGIN PAGE ───────────────────────────────────────────────────────────────
const LoginPage = ({ onLogin }) => {
  const [login, setLogin]   = useState("");
  const [senha, setSenha]   = useState("");
  const [erro, setErro]     = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async () => {
    setErro(""); setLoading(true);
    await new Promise(r=>setTimeout(r,600));
    const user = USERS.find(u=>u.login.toUpperCase()===login.trim().toUpperCase()&&u.senha===senha.trim());
    if (user) onLogin(user);
    else setErro("Login ou senha incorretos.");
    setLoading(false);
  };

  const inputStyle = {
    background:"#0D1626", border:"1px solid #1E2D42", color:"#E2E8F0",
    padding:"12px 16px", borderRadius:10, fontSize:14, fontFamily:"'Inter',sans-serif",
    width:"100%", outline:"none", transition:"border-color .2s",
  };

  return (
    <div style={{minHeight:"100vh",background:"#0A0F1E",display:"flex",alignItems:"center",justifyContent:"center",padding:20,
      backgroundImage:`radial-gradient(ellipse at 20% 50%, #00D4FF08 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, #0091FF08 0%, transparent 60%)`}}>
      <div style={{width:"100%",maxWidth:420}}>
        {/* Logo */}
        <div style={{textAlign:"center",marginBottom:36}}>
          <div style={{width:64,height:64,borderRadius:18,background:"linear-gradient(135deg,#00D4FF,#0091FF)",
            display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px",
            fontFamily:"'Inter',sans-serif",fontWeight:800,fontSize:32,color:"#000",
            boxShadow:"0 8px 32px #00D4FF30"}}>E</div>
          <div style={{fontFamily:"'Inter',sans-serif",fontSize:26,fontWeight:800,color:"#E2E8F0",marginBottom:4}}>Elevamente</div>
          <div style={{fontSize:13,color:"#64748B"}}>Programa Melhora do Operador</div>
        </div>

        {/* Card */}
        <div style={{background:"#111827",border:"1px solid #1E2D42",borderRadius:20,padding:32,
          boxShadow:"0 20px 60px #00000060",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,#00D4FF,#0091FF,#8B5CF6)"}}/>

          <div style={{fontFamily:"'Inter',sans-serif",fontSize:18,fontWeight:700,marginBottom:6,color:"#E2E8F0"}}>Entrar no sistema</div>
          <div style={{fontSize:13,color:"#64748B",marginBottom:24}}>Acesso restrito - colaboradores autorizados</div>

          {/* Login */}
          <div style={{marginBottom:14}}>
            <div style={{fontSize:12,color:"#64748B",marginBottom:6,fontWeight:500}}>Usuario</div>
            <input style={inputStyle} placeholder="ex: gestor, rh, psicologia..." value={login}
              onChange={e=>setLogin(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSubmit()}
              onFocus={e=>e.target.style.borderColor="#00D4FF"} onBlur={e=>e.target.style.borderColor="#1E2D42"}/>
          </div>

          {/* Senha */}
          <div style={{marginBottom:20}}>
            <div style={{fontSize:12,color:"#64748B",marginBottom:6,fontWeight:500}}>Senha</div>
            <div style={{position:"relative"}}>
              <input style={{...inputStyle,paddingRight:44}} type={showPass?"text":"password"} placeholder="••••••••"
                value={senha} onChange={e=>setSenha(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSubmit()}
                onFocus={e=>e.target.style.borderColor="#00D4FF"} onBlur={e=>e.target.style.borderColor="#1E2D42"}/>
              <button onClick={()=>setShowPass(s=>!s)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",
                background:"none",border:"none",color:"#64748B",cursor:"pointer",fontSize:16,padding:4}}>
                {showPass?"🙈":"👁️"}
              </button>
            </div>
          </div>

          {/* Erro */}
          {erro && <div style={{background:"#EF444418",border:"1px solid #EF444430",borderRadius:8,padding:"10px 14px",
            fontSize:13,color:"#EF4444",marginBottom:16}}>⚠️ {erro}</div>}

          {/* Botao */}
          <button onClick={handleSubmit} disabled={loading||!login||!senha}
            style={{width:"100%",padding:"13px",borderRadius:11,border:"none",cursor:loading||!login||!senha?"not-allowed":"pointer",
              background:login&&senha?"linear-gradient(135deg,#00D4FF,#0091FF)":"#1E2D42",
              color:login&&senha?"#000":"#64748B",fontFamily:"'Inter',sans-serif",fontSize:15,fontWeight:800,
              transition:"all .2s",opacity:loading?0.7:1}}>
            {loading?"Verificando...":"Entrar →"}
          </button>

          {/* Perfis disponiveis */}
          <div style={{marginTop:24,padding:"14px 16px",background:"#0A0F1E",borderRadius:10,border:"1px solid #1E2D42"}}>
            <div style={{fontSize:11,fontWeight:700,color:"#64748B",textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Perfis de acesso</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {USERS.map(u=>{
                const pf=PERFIL_LABELS[u.perfil]||{label:u.perfil,color:"#64748B",bg:"#64748B18"};
                return(<div key={u.id} style={{fontSize:11,fontWeight:600,padding:"3px 10px",borderRadius:6,
                  color:pf.color,background:pf.bg,border:`1px solid ${pf.color}30`}}>
                  {u.login}
                </div>);
              })}
            </div>
            <div style={{fontSize:10,color:"#64748B",marginTop:8,fontStyle:"italic"}}>Solicite a senha ao administrador do sistema.</div>
          </div>
        </div>

        <div style={{textAlign:"center",marginTop:20,fontSize:11,color:"#64748B"}}>
          Elevamente · Programa de Melhora do Operador · {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
};

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser]             = useState(null);   // logged-in user
  const [storageLoaded, setStorageLoaded] = useState(false);
  const [col, setCol]               = useState(false);
  const [mobOpen, setMobOpen]       = useState(false);
  const [active, setActive]         = useState("dashboard");
  const [selectedOp, setSelectedOp] = useState(null);
  const [custos, setCustos]         = useState(CUSTOS_PADRAO);
  const [sessions, setSessions]     = useState(SESSIONS_INIT);
  const [tratativas, setTratativas] = useState(TRATATIVAS_INIT);
  const [agenda, setAgenda]         = useState(AGENDA_INIT);
  const [loading, setLoading]       = useState(false);
  const [data, setData]             = useState(MOCK);
  const [isReal, setIsReal]         = useState(false);
  const [fileName, setFileName]     = useState(null);
  const [fileSize, setFileSize]     = useState(0);
  const [searchQ, setSearchQ]       = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [themeName, setThemeName]   = useState(_themeName);
  const [auditLogs, setAuditLogs]   = useState(getAuditLogs);

  // ── Apply theme globally ────────────────────────────────────────────────────
  useEffect(()=>{
    Object.assign(C, THEMES[themeName] || THEMES.dark);
    try { localStorage.setItem("elevamente_theme", themeName); } catch {}
    // force re-render by updating CSS vars on :root
    const root = document.documentElement;
    const t = THEMES[themeName]||THEMES.dark;
    root.style.setProperty("--bg",      t.bg);
    root.style.setProperty("--surface", t.surface);
    root.style.setProperty("--card",    t.card);
    root.style.setProperty("--border",  t.border);
    root.style.setProperty("--accent",  t.accent);
    root.style.setProperty("--text",    t.text);
    root.style.setProperty("--muted",   t.muted);
    document.body.style.background = t.bg;
    document.body.style.color      = t.text;
  },[themeName]);

  const handleThemeChange = (name) => { setThemeName(name); };

  // ── Audit wrapper ───────────────────────────────────────────────────────────
  const audit = (acao, tipo, detalhes="") => {
    addAuditLog(user, acao, tipo, detalhes);
    setAuditLogs(getAuditLogs());
  };
  const [showAlerts, setShowAlerts] = useState(false);
  const searchRef = useRef();

  // ── Close alerts/search on outside click ─────────────────────────────────────
  useEffect(()=>{
    if (!showAlerts && !showSearch) return;
    const handler = (e) => {
      if (!e.target.closest(".bb") && !e.target.closest("[data-alerts]")) setShowAlerts(false);
    };
    document.addEventListener("click", handler);
    return ()=>document.removeEventListener("click", handler);
  },[showAlerts]);

  // ── Load from storage on mount ──────────────────────────────────────────────
  useEffect(()=>{
    loadState().then(saved=>{
      if (saved) {
        if(saved.sessions)   setSessions(saved.sessions);
        if(saved.tratativas) setTratativas(saved.tratativas);
        if(saved.agenda)     setAgenda(saved.agenda);
        if(saved.custos)     setCustos(saved.custos);
      }
      // ── Restore Excel data if previously uploaded ──────────────────────────
      try {
        const savedExcel = localStorage.getItem("elevamente_excel_data");
        const savedName  = localStorage.getItem("elevamente_excel_name");
        const savedSize  = localStorage.getItem("elevamente_excel_size");
        if (savedExcel && savedName) {
          const parsed = JSON.parse(savedExcel);
          setData(parsed);
          setIsReal(true);
          setFileName(savedName + " (restaurado)");
          setFileSize(Number(savedSize)||0);
        }
      } catch(e) { /* silent */ }
      setStorageLoaded(true);
    });
  },[]);

  // ── Auto-save whenever key state changes ─────────────────────────────────────
  useEffect(()=>{
    if (!storageLoaded) return;
    saveState({ sessions, tratativas, agenda, custos });
  },[sessions, tratativas, agenda, custos, storageLoaded]);

  // ── Helpers to wrap setters with auto-save ──────────────────────────────────
  const setSess     = v => setSessions(v);
  const setTrat     = v => setTratativas(v);
  const setAgd      = v => setAgenda(v);
  const setCust     = v => setCustos(v);

  const today = new Date().toLocaleDateString("pt-BR",{weekday:"long",day:"2-digit",month:"long"});
  const sections = [...new Set(NAV.map(n=>n.section))];
  const titles = { dashboard:"Dashboard",operadores:"Operadores",ficha:"Ficha do Operador",
    mentoria:"Mentoria",agenda:"Agenda",tratativas:"Tratativas",relatorios:"Relatorios",
    auditoria:"Auditoria do Sistema",parametros:"Parametros Financeiros",base:"Base de Dados" };
  const handleUpload = async (file) => {
    setLoading(true);
    try {
      const xlsxLib = await loadXLSX();
      const buf  = await file.arrayBuffer();
      const wb   = xlsxLib.read(buf, { type:"array" });
      XLSX = xlsxLib;
      const result = processExcel(wb);
      setData(result);
      setIsReal(true);
      setFileName(file.name);
      setFileSize(file.size);
      // ── Persist Excel data to localStorage ──────────────────────────────────
      try {
        localStorage.setItem("elevamente_excel_name", file.name);
        localStorage.setItem("elevamente_excel_size", String(file.size));
        localStorage.setItem("elevamente_excel_data", JSON.stringify({
          operators: result.operators,
          kpis:      result.kpis,
          eventosMes:result.eventosMes,
          causas:    result.causas,
          sheetSummary: result.sheetSummary,
          savedAt:   new Date().toLocaleString("pt-BR"),
        }));
      } catch(e) { console.warn("localStorage cheio, dados nao persistidos:", e); }
      // ─────────────────────────────────────────────────────────────────────────
      audit("Upload de base Excel: " + file.name, "Upload");
      setActive("dashboard");
    } catch(err) {
      console.error(err);
      alert("Erro ao processar o arquivo: " + err.message);
    }
    setLoading(false);
  };

  const handleDelete = () => {
    setData(MOCK);
    setIsReal(false);
    setFileName(null);
    setFileSize(0);
  };

  return (
    <>
      <style>{styles}</style>

      {/* ── LOGIN GATE ── */}
      {!user && <LoginPage onLogin={u=>{setUser(u);setActive(u.acesso[0]||"dashboard");addAuditLog(u,"Login no sistema","Login");}}/>}

      {/* ── TOAST NOTIFICATIONS ── */}
      <ToastContainer/>

      {loading && (
        <div className="loading-overlay">
          <div className="spinner"/>
          <div style={{ color:C.text,fontFamily:"'Inter',sans-serif",fontWeight:700 }}>Processando planilha…</div>
          <div style={{ color:C.muted,fontSize:13 }}>Lendo abas e calculando indicadores</div>
        </div>
      )}
      {/* Mobile overlay */}
      {mobOpen && <div className="mob-overlay" onClick={()=>setMobOpen(false)}/>}

      {user && <div className="app">
        <nav className={`sidebar ${col?"col":""} ${mobOpen?"mob-open":""}`}>
          <div className="lw">
            <div className="li">E</div>
            <div><div className="lt">Elevamente</div><div className="ls">Melhora do Operador</div></div>
          </div>
          <div className="nav">
            {sections.map(sec=>{
              const visibleItems = NAV.filter(n=>n.section===sec && (!user||user.acesso.includes(n.id)));
              if(!visibleItems.length) return null;
              return(
                <div key={sec}>
                  <div className="ns">{sec}</div>
                  {visibleItems.map(n=>(
                    <div key={n.id} className={`ni ${active===n.id?"on":""}`} onClick={()=>{setActive(n.id);setMobOpen(false);}}>
                      <span className="ic">{n.icon}</span>
                      <span className="nl">{n.label}</span>
                      {n.id==="base" && isReal && <span style={{ marginLeft:"auto",width:8,height:8,borderRadius:"50%",background:C.green,flexShrink:0 }}/>}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
          <div className="sft">
            <div className="uc" style={{flexDirection:"column",alignItems:"flex-start",gap:6}}>
              <div style={{display:"flex",alignItems:"center",gap:10,width:"100%"}}>
                <div className="av" style={{background:`linear-gradient(135deg,${(PERFIL_LABELS[user?.perfil]||{color:"#00D4FF"}).color},#0091FF)`}}>
                  {user?.avatar||"?"}
                </div>
                <div style={{overflow:"hidden",flex:1}}>
                  <div style={{fontSize:12,fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{user?.nome}</div>
                  <div style={{fontSize:10,color:C.muted}}>{(PERFIL_LABELS[user?.perfil]||{label:"-"}).label}{user?.garagem!=="Todas"?` · ${user.garagem}`:""}</div>
                </div>
              </div>
              <button onClick={()=>{audit("Logout do sistema","Login");setUser(null);setActive("dashboard");}}
                style={{width:"100%",padding:"6px",borderRadius:7,background:`${C.red}15`,color:C.red,border:`1px solid ${C.red}25`,
                  fontSize:11,fontWeight:600,cursor:"pointer",textAlign:"center"}}>
                ⎋ Sair
              </button>
            </div>
          </div>
        </nav>

        <main className={`main ${col?"col":""}`} style={{position:"relative"}}>
          <div className="topbar">
            <div className="tbl">
              {/* Mobile hamburger */}
              <button className="mob-menu-btn" onClick={()=>setMobOpen(o=>!o)}>☰</button>
              <button className="tog" onClick={()=>setCol(c=>!c)}>{col?"→":"←"}</button>
              <div>
                <div className="pt">{titles[active]}</div>
                <div className="ps">Programa Elevamente · Acompanhamento de Operadores</div>
              </div>
            </div>
            <div className="tbr">
              {/* Global search */}
              {showSearch
                ? <div style={{display:"flex",alignItems:"center",gap:6,background:C.card,border:`1px solid ${C.accent}50`,borderRadius:10,padding:"4px 4px 4px 14px",minWidth:220}}>
                    <input ref={searchRef} autoFocus style={{background:"transparent",border:"none",color:C.text,fontSize:13,fontFamily:"'Inter',sans-serif",outline:"none",flex:1,minWidth:0}}
                      placeholder="Buscar operador, RE..." value={searchQ}
                      onChange={e=>setSearchQ(e.target.value)}
                      onKeyDown={e=>{
                        if(e.key==="Escape"){setShowSearch(false);setSearchQ("");}
                        if(e.key==="Enter"&&searchQ.trim()){setActive("operadores");setShowSearch(false);}
                      }}/>
                    <button onClick={()=>{setShowSearch(false);setSearchQ("");}} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:16,padding:"4px 8px"}}>✕</button>
                  </div>
                : <button className="bb" onClick={()=>{setShowSearch(true);setTimeout(()=>searchRef.current?.focus(),50);}} title="Busca global (operador/RE)">
                    🔍
                  </button>
              }

              {/* Search results dropdown */}
              {showSearch && searchQ.trim() && (()=>{
                const q = searchQ.toLowerCase();
                const results = data.operators.filter(o=>
                  o.re.toLowerCase().includes(q)||o.nome.toLowerCase().includes(q)
                ).slice(0,6);
                if(!results.length) return null;
                return (
                  <div style={{position:"absolute",top:64,right:20,zIndex:300,background:C.surface,border:`1px solid ${C.border}`,
                    borderRadius:12,padding:8,minWidth:300,boxShadow:"0 8px 32px #00000060"}}>
                    {results.map(op=>{
                      const ac=avatarColor(op.re);
                      return(
                        <div key={op.re} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",borderRadius:8,cursor:"pointer",transition:"all .15s"}}
                          onMouseEnter={e=>e.currentTarget.style.background=C.border}
                          onMouseLeave={e=>e.currentTarget.style.background="transparent"}
                          onClick={()=>{setSelectedOp(op);setActive("ficha");setShowSearch(false);setSearchQ("");}}>
                          <div style={{width:32,height:32,borderRadius:8,background:`${ac}20`,color:ac,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Inter',sans-serif",fontWeight:800,fontSize:11,flexShrink:0}}>{initials(op.nome)}</div>
                          <div style={{flex:1}}>
                            <div style={{fontSize:13,fontWeight:600}}>{op.nome}</div>
                            <div style={{fontSize:11,color:C.muted}}>{op.re} · {op.funcao} · {op.garagem}</div>
                          </div>
                          <span style={{fontSize:10,color:op.resultado==="melhora"?C.green:op.resultado==="piora"?C.red:C.muted}}>
                            {op.resultado?"↑"===op.resultado[0]?"↑":"→":op.status==="aguardando"?"⏳":"●"} {op.resultado||op.status}
                          </span>
                        </div>
                      );
                    })}
                    <div style={{borderTop:`1px solid ${C.border}`,marginTop:6,paddingTop:6,textAlign:"center"}}>
                      <button className="abt" style={{fontSize:11}} onClick={()=>{setActive("operadores");setShowSearch(false);}}>Ver todos os resultados</button>
                    </div>
                  </div>
                );
              })()}

              <div className="dchip mob-hide">{today}</div>

              {/* Theme switcher */}
              <div style={{display:"flex",gap:2,background:C.surface,borderRadius:8,padding:3,border:`1px solid ${C.border}`}} className="mob-hide">
                {Object.entries(THEMES).map(([key,t])=>(
                  <button key={key} onClick={()=>handleThemeChange(key)}
                    title={t.label}
                    style={{padding:"4px 10px",borderRadius:6,border:"none",cursor:"pointer",fontSize:12,fontWeight:600,transition:"all .2s",
                      background:themeName===key?C.accent:"transparent",
                      color:themeName===key?"#000":C.muted}}>
                    {t.label.split(" ")[0]}
                  </button>
                ))}
              </div>

              <button className="abt" style={{ padding:"7px 14px",gap:6,display:"flex",alignItems:"center" }} onClick={()=>setActive("base")}>
                <span style={{ width:8,height:8,borderRadius:"50%",background:isReal?C.green:C.orange,display:"inline-block" }}/>
                <span className="mob-hide">{isReal?"Base: "+fileName?.split(".")[0]:"Carregar Base"}</span>
              </button>

              {/* Alerts drawer button */}
              {(()=>{
                const pendTrat = tratativas.filter(t=>t.status!=="concluido").length;
                const agHoje   = agenda.filter(a=>a.data===fmtDate(new Date())&&a.status!=="realizado"&&a.status!=="faltou").length;
                const urgentes = tratativas.filter(t=>t.prioridade==="urgente"&&t.status!=="concluido").length;
                const total    = pendTrat + agHoje;
                return (
                  <>
                    <button className="bb" onClick={()=>setShowAlerts(a=>!a)}
                      title={`${urgentes} urgentes · ${pendTrat} tratativas · ${agHoje} hoje`}
                      style={{borderColor:urgentes>0?`${C.red}50`:""}}>
                      🔔{total>0&&<span className="bdg" style={{background:urgentes>0?C.red:C.orange}}>{total>99?"99+":total}</span>}
                    </button>

                    {/* Alerts drawer */}
                    {showAlerts && (
                      <div style={{position:"absolute",top:64,right:8,zIndex:300,background:C.surface,
                        border:`1px solid ${C.border}`,borderRadius:16,padding:16,width:340,
                        boxShadow:"0 8px 40px #00000080",maxHeight:"80vh",overflowY:"auto"}}>
                        <div style={{fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:15,marginBottom:12,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                          <span>🔔 Alertas do Sistema</span>
                          <button onClick={()=>setShowAlerts(false)} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:18}}>✕</button>
                        </div>

                        {/* Urgentes */}
                        {urgentes>0 && <>
                          <div style={{fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:1,color:C.red,marginBottom:6}}>⚡ Urgentes</div>
                          {tratativas.filter(t=>t.prioridade==="urgente"&&t.status!=="concluido").map(t=>(
                            <div key={t.id} style={{background:`${C.red}10`,border:`1px solid ${C.red}25`,borderRadius:10,padding:"10px 12px",marginBottom:6,cursor:"pointer"}}
                              onClick={()=>{setActive("tratativas");setShowAlerts(false);}}>
                              <div style={{fontSize:12,fontWeight:600,color:C.red,marginBottom:2}}>{AREA_ICONS[t.area]} {t.area}{t.subarea?` / ${t.subarea}`:""}</div>
                              <div style={{fontSize:11,color:C.muted}}>{t.re} · {t.nome}</div>
                              <div style={{fontSize:11,color:C.muted,marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.descricao}</div>
                            </div>
                          ))}
                        </>}

                        {/* Hoje */}
                        {agHoje>0 && <>
                          <div style={{fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:1,color:C.accent,margin:"10px 0 6px"}}>📅 Agendamentos Hoje</div>
                          {agenda.filter(a=>a.data===fmtDate(new Date())&&a.status!=="realizado"&&a.status!=="faltou")
                            .sort((a,b)=>a.hora.localeCompare(b.hora)).map(a=>{
                            const tp=TIPO_COLORS[a.tipo]||{color:C.accent,icon:"📅"};
                            return(
                              <div key={a.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 12px",marginBottom:6,cursor:"pointer",display:"flex",gap:10,alignItems:"center"}}
                                onClick={()=>{setActive("agenda");setShowAlerts(false);}}>
                                <div style={{fontFamily:"'Inter',sans-serif",fontWeight:800,fontSize:13,color:tp.color,minWidth:44}}>{a.hora}</div>
                                <div>
                                  <div style={{fontSize:12,fontWeight:600}}>{a.nome}</div>
                                  <div style={{fontSize:11,color:C.muted}}>{tp.icon} {a.tipo}</div>
                                </div>
                              </div>
                            );
                          })}
                        </>}

                        {/* Pendentes geral */}
                        {pendTrat>0 && <>
                          <div style={{fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:1,color:C.orange,margin:"10px 0 6px"}}>🔁 Tratativas Pendentes</div>
                          {tratativas.filter(t=>t.status==="pendente"&&t.prioridade!=="urgente").slice(0,4).map(t=>(
                            <div key={t.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 12px",marginBottom:6,cursor:"pointer"}}
                              onClick={()=>{setActive("tratativas");setShowAlerts(false);}}>
                              <div style={{fontSize:12,fontWeight:600,marginBottom:2}}>{AREA_ICONS[t.area]} {t.area}</div>
                              <div style={{fontSize:11,color:C.muted}}>{t.re} · {t.descricao.slice(0,50)}{t.descricao.length>50?"…":""}</div>
                            </div>
                          ))}
                          {pendTrat>4&&<div style={{textAlign:"center",marginTop:4}}><button className="abt" style={{fontSize:11}} onClick={()=>{setActive("tratativas");setShowAlerts(false);}}>+{pendTrat-4} mais</button></div>}
                        </>}

                        {total===0 && (
                          <div style={{textAlign:"center",padding:"24px 0",color:C.muted}}>
                            <div style={{fontSize:32,marginBottom:8}}>✅</div>
                            <div style={{fontSize:13}}>Tudo em dia! Sem alertas pendentes.</div>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>

          {/* ── garagem-filtered operators for gestor_gar ── */}
          {(()=>{
            const filteredOps = user?.garagem && user.garagem!=="Todas"
              ? { ...data, operators: data.operators.filter(o=>o.garagem===user.garagem) }
              : data;
            const filteredAgenda = user?.garagem && user.garagem!=="Todas"
              ? agenda.filter(a=>filteredOps.operators.some(o=>o.re===a.re))
              : agenda;
            const filteredTrat = user?.garagem && user.garagem!=="Todas"
              ? tratativas.filter(t=>filteredOps.operators.some(o=>o.re===t.re))
              : tratativas;
            const ops = filteredOps.operators;

            return <>
          {active==="dashboard"   && <DashboardPage data={filteredOps} isReal={isReal} onNav={setActive} agenda={filteredAgenda} tratativas={filteredTrat}/>}
          {active==="operadores"  && <OperadoresPage operators={ops} onVerFicha={(op)=>{ setSelectedOp(op); setActive("ficha"); }}/>}
          {active==="ficha"       && <FichaPage op={selectedOp} onBack={()=>setActive("operadores")} globalCustos={custos} onSaveCustos={setCust}/>}
          {active==="mentoria"    && <MentoriaPage operators={ops} sessions={sessions} onSave={s=>{
  setSess(prev=>[...prev,s]);
  audit("Nova sessao de mentoria: "+s.nome+" ("+s.re+")", "Criou");
  if(s.setor && s.setor.trim() !== "" && s.setor !== "–"){
    const t={
      id:Date.now()+1, re:s.re, nome:s.nome,
      area:s.setor, subarea:s.subsetor||"",
      descricao:s.relato||"Encaminhado via mentoria em "+s.data,
      data:s.data, prazo:"", prioridade:"normal",
      status:"pendente", retorno:"", sessionId:s.id,
    };
    setTrat(prev=>[...prev,t]);
    audit("Tratativa criada via mentoria: "+s.setor+" - "+s.re, "Criou");
  }
}}/>}
          {active==="agenda"      && <AgendaPage agenda={filteredAgenda} onUpdate={setAgd} onAdd={a=>setAgd(prev=>[...prev,a])} operators={ops}/>}
          {active==="tratativas"  && <TratativasPage tratativas={filteredTrat} onUpdate={setTrat} onAdd={t=>{setTrat(prev=>[...prev,t]);audit("Nova tratativa: "+t.area+" - "+t.re, "Criou");}} operators={ops} sessions={sessions}/>}
          {active==="relatorios"  && <RelatoriosPage data={filteredOps} sessions={sessions} tratativas={filteredTrat} custos={custos}/>}
          {active==="auditoria"   && <AuditoriaPage auditLogs={auditLogs} user={user}/>}
          {active==="parametros"  && <ParametrosPage custos={custos} onSave={setCust}/>}
          {active==="base"        && <BasePage fileName={fileName} fileSize={fileSize} sheetSummary={data.sheetSummary||[]} onUpload={handleUpload} onDelete={handleDelete} isReal={isReal}/>}
          {!["dashboard","operadores","ficha","mentoria","agenda","tratativas","relatorios","auditoria","parametros","base"].includes(active) && <ComingSoon title={titles[active]}/>}
            </>;
          })()}
        </main>

        {/* ── USER STATUS BAR (bottom) ── */}
        {user && (
          <div style={{position:"fixed",bottom:0,left:col?64:240,right:0,zIndex:50,
            background:C.surface,borderTop:`1px solid ${C.border}`,
            padding:"5px 20px",display:"flex",alignItems:"center",gap:12,fontSize:12,
            transition:"left .3s"}}>
            <div style={{width:20,height:20,borderRadius:"50%",
              background:`linear-gradient(135deg,${(PERFIL_LABELS[user.perfil]||{color:C.accent}).color},${C.accent2})`,
              display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,color:"#000",flexShrink:0}}>
              {user.avatar}
            </div>
            <span style={{fontWeight:600,color:C.text}}>{user.nome}</span>
            <span style={{color:C.muted}}>·</span>
            <span style={{color:C.muted}}>{(PERFIL_LABELS[user.perfil]||{label:"Usuario"}).label}</span>
            <div style={{flex:1}}/>
            <span style={{color:C.muted}}>
              {new Date().toLocaleString("pt-BR",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"})}
            </span>
            <span style={{padding:"1px 8px",borderRadius:4,background:`${C.green}20`,color:C.green,fontSize:10,fontWeight:600}}>
              ● Online
            </span>
          </div>
        )}
      </div>}
    </>
  );
}
