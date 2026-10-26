import { QuestionOption } from "../ir/types.js";
import { OptionLayoutMode } from "./layout-engine.js";
import { TemplateProfile } from "./template-loader.js";
import { renderRunToXml, renderTabsToXml } from "./content-renderer.js";

function renderOptionPrefix(label: string, isCorrect?: boolean): string {
  // CRITICAL: <w:tab/> must be inside its own run WITH <w:u w:val="none"/> 
  // so Word NEVER underlines the tab space between options!
  const tabRun = `<w:r><w:rPr><w:rStyle w:val="YoungMixChar"/><w:u w:val="none"/></w:rPr><w:tab/></w:r>`;
  if (isCorrect) {
    return `${tabRun}<w:r><w:rPr><w:rStyle w:val="YoungMixChar"/><w:b/><w:i/><w:u w:val="single"/></w:rPr><w:t xml:space="preserve">${label}. </w:t></w:r>`;
  }
  return `${tabRun}<w:r><w:rPr><w:rStyle w:val="YoungMixChar"/><w:u w:val="none"/><w:b/></w:rPr><w:t xml:space="preserve">${label}. </w:t></w:r>`;
}

function renderOptionBodyRuns(opt: QuestionOption, isCorrect?: boolean): string {
  const runs = opt.content.paragraphs.flatMap(p => p.runs);
  if (isCorrect) {
    // Clone runs and ensure trailing whitespace at the end of the option is not underlined
    const cloned = runs.map(r => ({ ...r }));
    for (let i = cloned.length - 1; i >= 0; i--) {
      if (!cloned[i].isTab && !cloned[i].isLineBreak && cloned[i].text) {
        cloned[i].text = cloned[i].text.trimEnd();
        break;
      }
    }
    // In teacher check mode, correct answer runs get italics and underline
    return cloned.map(r => renderRunToXml({ ...r, italic: true, underline: true }, { sanitizeUnderline: false })).join("");
  }
  return runs.map(r => renderRunToXml(r, { sanitizeUnderline: true })).join("");
}

export function renderOptions(
  options: readonly QuestionOption[],
  layoutMode: OptionLayoutMode,
  profile: TemplateProfile,
  preserveAnswers?: boolean
): string {
  if (options.length !== 4) {
    throw new Error(`Expected exactly 4 options to render, found ${options.length}`);
  }

  const [optA, optB, optC, optD] = options;

  if (layoutMode === "4_COLUMNS") {
    // 1 single paragraph with 4 tab stops
    const tabStops = profile.tabs.fourColumns.map(pos => ({
      positionDxa: pos,
      alignment: "left" as const
    }));

    const tabsXml = renderTabsToXml(tabStops);

    const aXml = renderOptionPrefix("A", preserveAnswers && optA.isCorrect) + renderOptionBodyRuns(optA, preserveAnswers && optA.isCorrect);
    const bXml = renderOptionPrefix("B", preserveAnswers && optB.isCorrect) + renderOptionBodyRuns(optB, preserveAnswers && optB.isCorrect);
    const cXml = renderOptionPrefix("C", preserveAnswers && optC.isCorrect) + renderOptionBodyRuns(optC, preserveAnswers && optC.isCorrect);
    const dXml = renderOptionPrefix("D", preserveAnswers && optD.isCorrect) + renderOptionBodyRuns(optD, preserveAnswers && optD.isCorrect);

    return `<w:p><w:pPr>${tabsXml}</w:pPr>${aXml}${bXml}${cXml}${dXml}</w:p>`;
  } else if (layoutMode === "2_COLUMNS") {
    // 2 paragraphs with 2 tab stops each
    const tabStops = profile.tabs.twoColumns.map(pos => ({
      positionDxa: pos,
      alignment: "left" as const
    }));
    const tabsXml = renderTabsToXml(tabStops);

    const line1A = renderOptionPrefix("A", preserveAnswers && optA.isCorrect) + renderOptionBodyRuns(optA, preserveAnswers && optA.isCorrect);
    const line1B = renderOptionPrefix("B", preserveAnswers && optB.isCorrect) + renderOptionBodyRuns(optB, preserveAnswers && optB.isCorrect);
    const para1 = `<w:p><w:pPr>${tabsXml}</w:pPr>${line1A}${line1B}</w:p>`;

    const line2C = renderOptionPrefix("C", preserveAnswers && optC.isCorrect) + renderOptionBodyRuns(optC, preserveAnswers && optC.isCorrect);
    const line2D = renderOptionPrefix("D", preserveAnswers && optD.isCorrect) + renderOptionBodyRuns(optD, preserveAnswers && optD.isCorrect);
    const para2 = `<w:p><w:pPr>${tabsXml}</w:pPr>${line2C}${line2D}</w:p>`;

    return `${para1}\n${para2}`;
  } else {
    // 1_COLUMN: 4 separate paragraphs with 1 tab stop each
    const tabStops = profile.tabs.oneColumn.map(pos => ({
      positionDxa: pos,
      alignment: "left" as const
    }));
    const tabsXml = renderTabsToXml(tabStops);

    const labels = ["A", "B", "C", "D"];
    const paras = options.map((opt, idx) => {
      const isCorrect = preserveAnswers && opt.isCorrect;
      const prefix = renderOptionPrefix(labels[idx], isCorrect);
      const body = renderOptionBodyRuns(opt, isCorrect);
      return `<w:p><w:pPr>${tabsXml}</w:pPr>${prefix}${body}</w:p>`;
    });

    return paras.join("\n");
  }
}
