import React from 'react';
import katex from 'katex';
import { TextRun } from 'docx';
import { FormattedRun } from '../core/ir/types';

export interface FormulaRun {
  text: string;
  type: 'normal' | 'sub' | 'sup';
  fontName?: string;
}

const UNICODE_SUP_MAP: Record<string, string> = {
  '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4',
  '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9',
  '⁺': '+', '⁻': '-'
};

/**
 * Pre-normalizes symbols, arrows, dots, and common representations
 */
export function normalizeFormulaText(input: string): string {
  if (!input) return '';
  return input
    // Reversible reaction arrows
    .replace(/\s*(?:<==>|<=>|<->|⇄|⇌)\s*/g, ' ⇌ ')
    // Single forward arrows
    .replace(/\s*(?:==>|-->|->|→)\s*/g, ' → ')
    // Backward arrows
    .replace(/\s*(?:<--|<-|←)\s*/g, ' ← ')
    // Space dot space -> middle dot for multiplication
    .replace(/(\S)\s+\.\s+(\S)/g, '$1 · $2')
    // Bracket dot bracket: [A]^a . [B]^b or [A].[B]
    .replace(/(\])\s*\.\s*(\[)/g, '$1 · $2')
    // Asterisk used as multiplication dot between variables or numbers
    .replace(/(\S)\s*\*\s*(\S)/g, '$1 · $2')
    // Crystal hydrates like CuSO4.5H2O
    .replace(/([A-Za-z0-9\)])\.(\d+H2O\b)/g, '$1·$2');
}

/**
 * Normalizes Unicode superscripts and common oxyanions in plain text
 */
export function normalizeUnicodeExponents(text: string): string {
  if (!text) return '';
  return text
    // Replace polyatomic ions written with Unicode superscripts e.g. NO³⁻, NO3⁻, SO⁴²⁻, SO4²⁻, CO³²⁻, CO3²⁻, PO⁴³⁻, PO4³⁻
    .replace(/([A-Z][a-z]?[A-Za-z]*?)[³3][⁻\-]/g, '$1_3^-')
    .replace(/([A-Z][a-z]?[A-Za-z]*?)[²2][⁻\-]/g, '$1_2^-')
    .replace(/([A-Z][a-z]?[A-Za-z]*?)[⁴4][²2][⁻\-]/g, '$1_4^2-')
    .replace(/([A-Z][a-z]?[A-Za-z]*?)[³3][²2][⁻\-]/g, '$1_3^2-')
    .replace(/([A-Z][a-z]?[A-Za-z]*?)[⁴4][³3][⁻\-]/g, '$1_4^3-')
    .replace(/([A-Z][a-z]?[A-Za-z]*?)[⁴4][⁺\+]/g, '$1_4^+')
    // Replace 10⁻⁴, 10^-4, 10¹², etc.
    .replace(/10([⁻⁺]?[⁰¹²³⁴⁵⁶⁷⁸⁹]+)/g, (_, exp) => {
      let asciiExp = '';
      for (const ch of exp) {
        asciiExp += UNICODE_SUP_MAP[ch] || ch;
      }
      return `10^${asciiExp}`;
    })
    // Monatomic ions with Unicode: Fe²⁺, Fe³⁺, Cu²⁺, Al³⁺, Na⁺, Cl⁻, OH⁻
    .replace(/([A-Z][a-z]?|OH)([²³⁴⁵⁶⁷⁸⁹]?[⁺⁻])/g, (_, elem, charge) => {
      let asciiCharge = '';
      for (const ch of charge) {
        asciiCharge += UNICODE_SUP_MAP[ch] || ch;
      }
      return `${elem}^${asciiCharge}`;
    });
}

/**
 * Attempts to parse an equilibrium or rate equation fraction (e.g. Kc = ([A]^a . [B]^b) / ([C]^c . [D]^d))
 * into standard LaTeX fraction format for KaTeX rendering
 */
export function tryFormatFractionToLatex(text: string): string | null {
  if (!text || !text.includes('/')) return null;

  const normalized = normalizeFormulaText(text).trim();

  // Pattern: [prefix = ] (numerator) / (denominator)
  const fracRegex = /^(.*?\bK[cCpaAbBwWhH]\s*=\s*)?\s*\(\s*([^()]+)\s*\)\s*\/\s*\(\s*([^()]+)\s*\)$/;
  const match = normalized.match(fracRegex);
  if (match) {
    let prefix = match[1] || '';
    prefix = prefix.replace(/\bK([cCpaAbBwWhH])\b/g, 'K_{$1}');
    const num = match[2].trim().replace(/\s*·\s*/g, ' \\cdot ');
    const den = match[3].trim().replace(/\s*·\s*/g, ' \\cdot ');
    return `${prefix}\\frac{${num}}{${den}}`;
  }

  // Also support simple bracketed fraction: [C]^c [D]^d / [A]^a [B]^b
  const simpleFracRegex = /^(.*?\bK[cCpaAbBwWhH]\s*=\s*)?([\[\]a-zA-Z0-9\^ ·]+)\s*\/\s*([\[\]a-zA-Z0-9\^ ·]+)$/;
  const matchSimple = normalized.match(simpleFracRegex);
  if (matchSimple && (matchSimple[2].includes('[') || matchSimple[2].includes('^'))) {
    let prefix = matchSimple[1] || '';
    prefix = prefix.replace(/\bK([cCpaAbBwWhH])\b/g, 'K_{$1}');
    const num = matchSimple[2].trim().replace(/\s*·\s*/g, ' \\cdot ');
    const den = matchSimple[3].trim().replace(/\s*·\s*/g, ' \\cdot ');
    return `${prefix}\\frac{${num}}{${den}}`;
  }

  return null;
}

/**
 * Converts LaTeX formula syntax to plain readable text with standard symbols for DOCX/plain text export
 */
export function latexToPlainText(latex: string): string {
  if (!latex) return '';
  return latex
    .replace(/\$\$/g, '')
    .replace(/\$/g, '')
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1) / ($2)')
    .replace(/\\cdot/g, '·')
    .replace(/\\times/g, '×')
    .replace(/\\rightleftharpoons|\\leftrightharpoons/g, '⇌')
    .replace(/\\rightarrow/g, '→')
    .replace(/\\leftarrow/g, '←')
    .replace(/\\Delta/g, 'Δ')
    .replace(/\\circ/g, '°')
    .replace(/\\text\{([^}]+)\}/g, '$1')
    .replace(/\\mathrm\{([^}]+)\}/g, '$1')
    .replace(/\\mathbf\{([^}]+)\}/g, '$1')
    .replace(/[{}]/g, '');
}

/**
 * Tokenizes text with mathematical and chemical expressions into structured runs
 */
export function parseFormulaText(input: string): FormulaRun[] {
  if (!input) return [];

  // Strip LaTeX wrapping if present for token parsing
  let text = input;
  if (text.includes('\\frac') || text.includes('\\cdot') || text.startsWith('$')) {
    text = latexToPlainText(text);
  }

  text = normalizeFormulaText(text);
  text = normalizeUnicodeExponents(text);

  const runs: FormulaRun[] = [];
  let i = 0;
  const n = text.length;

  const pushRun = (type: 'normal' | 'sub' | 'sup', str: string, fontName?: string) => {
    if (!str) return;
    if (runs.length > 0 && runs[runs.length - 1].type === type && runs[runs.length - 1].fontName === fontName) {
      runs[runs.length - 1].text += str;
    } else {
      runs.push({ type, text: str, fontName });
    }
  };

  while (i < n) {
    // 1. Enthalpy terms: ΔrH°298, ΔfH°298, \Delta_r H^0_{298}, ΔrH298
    const enthalpyMatch = text.substring(i).match(/^(?:Δ|\\Delta_?)([rf])H(?:\^?0|\^?o|°)?_?(\d+)?/);
    if (enthalpyMatch) {
      pushRun('normal', 'Δ');
      pushRun('sub', enthalpyMatch[1]);
      pushRun('normal', 'H');
      pushRun('sup', '°');
      if (enthalpyMatch[2]) {
        pushRun('sub', enthalpyMatch[2]);
      }
      i += enthalpyMatch[0].length;
      continue;
    }

    // 2. Standard electrode potential: E°cell, E°
    const eCellMatch = text.substring(i).match(/^(E)(?:\^?0|\^?o|°)(?:_?(cell\b|[a-zA-Z0-9\/]+))?/);
    if (eCellMatch) {
      pushRun('normal', 'E');
      pushRun('sup', '°');
      if (eCellMatch[2]) {
        pushRun('sub', eCellMatch[2]);
      }
      i += eCellMatch[0].length;
      continue;
    }

    // 3. Equilibrium/Rate constants: Kc, KC, Kp, KP, Ka, KA, Kb, KB, Kw, KW, Kh
    const kMatch = text.substring(i).match(/^(K)([cCpaAbBwWhH]|sp|eq)(?=[^a-zA-Z]|$)/);
    if (kMatch) {
      pushRun('normal', 'K');
      pushRun('sub', kMatch[2]);
      i += kMatch[0].length;
      continue;
    }

    // 4. Common chemical variables: C_M, m_dd, V_dd, m_ct, n_khi
    const chemVarMatch = text.substring(i).match(/^([CmVn])_([a-zA-Z%]+)(?=[^a-zA-Z\d]|$)/);
    if (chemVarMatch) {
      pushRun('normal', chemVarMatch[1]);
      pushRun('sub', chemVarMatch[2]);
      i += chemVarMatch[0].length;
      continue;
    }

    // 5. Scientific notation: 10^x or 10^-x
    const sciMatch = text.substring(i).match(/^10\^(-?\d+)/);
    if (sciMatch) {
      pushRun('normal', '10');
      pushRun('sup', sciMatch[1]);
      i += sciMatch[0].length;
      continue;
    }

    // 6. Caret superscripts: ^a, ^b, ^{...}, ^(-3), ^-3, ^2, ^o, ^+, ^-, ^2+, ^2-
    if (text[i] === '^') {
      const caretMatch = text.substring(i).match(/^\^(?:\{([^}]+)\}|\(([^)]+)\)|([1-4]?[+-]|-?\d+|[a-zA-Z°]+))/);
      if (caretMatch) {
        const val = caretMatch[1] || caretMatch[2] || caretMatch[3];
        pushRun('sup', (val === 'o' || val === '0') ? '°' : val);
        i += caretMatch[0].length;
        continue;
      }
    }

    // 7. Underscore subscripts: _a, _{...}, _(...)
    if (text[i] === '_') {
      const underMatch = text.substring(i).match(/^_(?:\{([^}]+)\}|\(([^)]+)\)|([a-zA-Z0-9]+))/);
      if (underMatch) {
        const val = underMatch[1] || underMatch[2] || underMatch[3];
        pushRun('sub', val);
        i += underMatch[0].length;
        continue;
      }
    }

    // 8. Degree: t^o, t°, °C, ^oC
    const degMatch = text.substring(i).match(/^([tT])(?:\^o|°)|^°C|^\^oC/);
    if (degMatch) {
      if (degMatch[1]) {
        pushRun('normal', degMatch[1]);
        pushRun('sup', '°');
      } else {
        pushRun('normal', '°C');
      }
      i += degMatch[0].length;
      continue;
    }

    // 9. Electron subshells: 1s2, 2s2, 2p6, 3s2, 3p6, 3d10, 4f14
    const eConfigMatch = text.substring(i).match(/^(\b\d*[spdf])(\d+)(?=[^a-zA-Z\d]|$)/);
    if (eConfigMatch) {
      pushRun('normal', eConfigMatch[1]);
      pushRun('sup', eConfigMatch[2]);
      i += eConfigMatch[0].length;
      continue;
    }

    // 10. Oxyanions with multi-digit charge: SO42-, CO32-, PO43-, Cr2O72-, ZnO22-
    const oxyMultiMatch = text.substring(i).match(/^([A-Z][a-z]?(?:\d*[A-Z][a-z]?)*?)(\d)([2-4][+-])(?=[^a-zA-Z0-9]|$)/);
    if (oxyMultiMatch) {
      const prefix = oxyMultiMatch[1];
      const sub = oxyMultiMatch[2];
      const charge = oxyMultiMatch[3];
      let pIdx = 0;
      while (pIdx < prefix.length) {
        const elemSub = prefix.substring(pIdx).match(/^([A-Z][a-z]?)(\d*)/);
        if (elemSub) {
          pushRun('normal', elemSub[1]);
          if (elemSub[2]) pushRun('sub', elemSub[2]);
          pIdx += elemSub[0].length;
        } else {
          pushRun('normal', prefix[pIdx]);
          pIdx++;
        }
      }
      pushRun('sub', sub);
      pushRun('sup', charge);
      i += oxyMultiMatch[0].length;
      continue;
    }

    // 11. Polyatomic ions with single-sign charge: NO3-, NO2-, MnO4-, ClO4-, ClO3-, ClO2-, ClO-, NH4+, H3O+, HCO3-, HSO4-, H2PO4-
    const polySingleMatch = text.substring(i).match(/^([A-Z][a-z]?(?:\d*[A-Z][a-z]?)*[OHSNCIP])(\d)([+-])(?=[^a-zA-Z0-9]|$)/);
    if (polySingleMatch) {
      const prefix = polySingleMatch[1];
      const sub = polySingleMatch[2];
      const charge = polySingleMatch[3];
      let pIdx = 0;
      while (pIdx < prefix.length) {
        const elemSub = prefix.substring(pIdx).match(/^([A-Z][a-z]?)(\d*)/);
        if (elemSub) {
          pushRun('normal', elemSub[1]);
          if (elemSub[2]) pushRun('sub', elemSub[2]);
          pIdx += elemSub[0].length;
        } else {
          pushRun('normal', prefix[pIdx]);
          pIdx++;
        }
      }
      pushRun('sub', sub);
      pushRun('sup', charge);
      i += polySingleMatch[0].length;
      continue;
    }

    // 12. Monatomic ions or 0-subscript polyatomic ions: Fe2+, Fe3+, Al3+, Cu2+, Zn2+, Ca2+, Ba2+, Na+, Cl-, OH-, H+
    const monatomicIonMatch = text.substring(i).match(/^([A-Z][a-z]?|OH|\]|\))([1-4][+-]|[+-])(?=[^a-zA-Z0-9]|$)/);
    if (monatomicIonMatch && !['+ ', '- '].includes(monatomicIonMatch[2])) {
      pushRun('normal', monatomicIonMatch[1]);
      pushRun('sup', monatomicIonMatch[2]);
      i += monatomicIonMatch[0].length;
      continue;
    }

    // 13. Regular chemical formula subscripts: H2, SO4, O2, (OH)2, [Ag(NH3)2], CO2
    const chemSubMatch = text.substring(i).match(/^([A-Z][a-z]?|\)|\])(\d+)(?=[^a-zA-Z\d]|$|[A-Z\(\[])/);
    if (chemSubMatch) {
      pushRun('normal', chemSubMatch[1]);
      pushRun('sub', chemSubMatch[2]);
      i += chemSubMatch[0].length;
      continue;
    }

    // 14. Chemical and mathematical reaction arrows (Cambria Math for crisp printing):
    // e.g. →, ⇌, ⇄, ←, ↑, ↓, ⇒, ⇔
    const arrowMatch = text.substring(i).match(/^[→⇌⇄←↑↓⇒⇔]/);
    if (arrowMatch) {
      pushRun('normal', arrowMatch[0], 'Cambria Math');
      i += arrowMatch[0].length;
      continue;
    }

    // Regular character
    pushRun('normal', text[i]);
    i++;
  }

  return runs;
}

/**
 * Checks if a string contains arrow characters
 */
export const isArrowText = (text: string): boolean => /[→⇌⇄←↑↓⇒⇔]/.test(text);

/**
 * Formats a text string into docx TextRun elements with superscripts and subscripts
 * and explicit Cambria Math font for reaction arrows to prevent print distortion
 */
export function formatFormulaToDocxRuns(text: string, baseOptions: any = {}): TextRun[] {
  if (!text) return [];
  const runs = parseFormulaText(text);
  if (runs.length === 0) {
    return [new TextRun({ ...baseOptions, text })];
  }

  return runs.map(run => {
    const isArrow = run.fontName === 'Cambria Math' || isArrowText(run.text);
    const font = isArrow ? 'Cambria Math' : (run.fontName || baseOptions.font);
    const runOptions: any = { ...baseOptions, text: run.text };
    if (font) {
      runOptions.font = font;
    }

    if (run.type === 'sup') {
      return new TextRun({ ...runOptions, superScript: true });
    } else if (run.type === 'sub') {
      return new TextRun({ ...runOptions, subScript: true });
    }
    return new TextRun(runOptions);
  });
}

/**
 * Formats a text string into YoungMix Intermediate Representation FormattedRuns
 * with Cambria Math font metadata for arrows
 */
export function formatFormulaToIRRuns(text: string, base: Partial<FormattedRun> = {}): FormattedRun[] {
  if (!text) return [];
  const runs = parseFormulaText(text);
  if (runs.length === 0) {
    return [{ ...base, text }];
  }

  return runs.map(run => {
    const isArrow = run.fontName === 'Cambria Math' || isArrowText(run.text);
    const fontName = isArrow ? 'Cambria Math' : (run.fontName || base.fontName);
    if (run.type === 'sup') {
      return { ...base, text: run.text, vertAlign: "superscript", ...(fontName ? { fontName } : {}) };
    } else if (run.type === 'sub') {
      return { ...base, text: run.text, vertAlign: "subscript", ...(fontName ? { fontName } : {}) };
    }
    return { ...base, text: run.text, ...(fontName ? { fontName } : {}) };
  });
}

/**
 * React Component for rendering mathematical and chemical formulas
 */
export const FormulaRenderer: React.FC<{ text: string; className?: string }> = ({ text, className = '' }) => {
  if (!text) return null;

  // 1. Check if the text contains LaTeX dollar blocks ($...$ or $$...$$)
  if (text.includes('$')) {
    const parts = text.split(/(\$\$[\s\S]+?\$\$|\$[^\$]+?\$)/g);
    return (
      <span className={className}>
        {parts.map((part, idx) => {
          if (part.startsWith('$$') && part.endsWith('$$')) {
            const math = part.slice(2, -2);
            try {
              const html = katex.renderToString(math, { displayMode: true, throwOnError: false });
              return <span key={idx} dangerouslySetInnerHTML={{ __html: html }} className="my-1 block text-center" />;
            } catch {
              return <span key={idx}>{part}</span>;
            }
          } else if (part.startsWith('$') && part.endsWith('$')) {
            const math = part.slice(1, -1);
            try {
              const html = katex.renderToString(math, { displayMode: false, throwOnError: false });
              return <span key={idx} dangerouslySetInnerHTML={{ __html: html }} className="inline-block mx-0.5" />;
            } catch {
              return <span key={idx}>{part}</span>;
            }
          }
          return <React.Fragment key={idx}>{renderPlainFormulaNodes(part)}</React.Fragment>;
        })}
      </span>
    );
  }

  // 2. Check if the text is an equation fraction (e.g. Kc = ([A]^a . [B]^b) / ([C]^c . [D]^d))
  const fracLatex = tryFormatFractionToLatex(text);
  if (fracLatex) {
    try {
      const html = katex.renderToString(fracLatex, { displayMode: false, throwOnError: false });
      return <span className={`inline-flex items-center ${className}`} dangerouslySetInnerHTML={{ __html: html }} />;
    } catch {
      // Fallback to plain runs if KaTeX fails
    }
  }

  // 3. Render structured chemical/math runs with <sup> and <sub>
  return <span className={className}>{renderPlainFormulaNodes(text)}</span>;
};

function renderPlainFormulaNodes(text: string): React.ReactNode {
  if (!text) return null;
  const runs = parseFormulaText(text);
  if (runs.length === 0) return <span>{text}</span>;

  return runs.map((run, idx) => {
    if (run.type === 'sup') {
      return (
        <sup key={idx} className="text-[0.78em] leading-none inline-block font-semibold align-super text-indigo-950">
          {run.text}
        </sup>
      );
    }
    if (run.type === 'sub') {
      return (
        <sub key={idx} className="text-[0.78em] leading-none inline-block font-semibold align-sub text-indigo-950">
          {run.text}
        </sub>
      );
    }
    if (run.fontName === 'Cambria Math' || isArrowText(run.text)) {
      return (
        <span key={idx} style={{ fontFamily: '"Cambria Math", "STIXGeneral", serif' }} className="mx-0.5 inline-block font-normal">
          {run.text}
        </span>
      );
    }
    return <React.Fragment key={idx}>{run.text}</React.Fragment>;
  });
}
