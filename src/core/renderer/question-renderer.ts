import { ExamQuestion } from "../ir/types.js";
import { TemplateProfile } from "./template-loader.js";
import { determineOptionLayout } from "./layout-engine.js";
import { renderOptions } from "./option-renderer.js";
import { renderTrueFalseSubItems } from "./true-false-renderer.js";
import { renderRunToXml, renderParagraphToXml } from "./content-renderer.js";

export function renderQuestionStem(
  question: ExamQuestion,
  displayIndex: number,
  profile: TemplateProfile
): string {
  const paragraphs = question.stem.paragraphs;
  if (paragraphs.length === 0) {
    return `<w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Câu ${displayIndex}. </w:t></w:r></w:p>`;
  }

  // Clone runs of the first paragraph
  const firstP = paragraphs[0];
  const runs = [...firstP.runs];

  // Re-index the prefix: replace "Câu X. " with "Câu {displayIndex}. "
  if (runs.length > 0) {
    const firstRunText = runs[0].text;
    const match = firstRunText.match(/^Câu\s+\d+[\.:\s]*/i);
    if (match) {
      runs[0] = {
        ...runs[0],
        text: `Câu ${displayIndex}. ` + firstRunText.substring(match[0].length),
        bold: true
      };
    } else {
      // Prepend Câu {displayIndex}.
      runs.unshift({
        text: `Câu ${displayIndex}. `,
        bold: true
      });
    }
  }

  const firstPXml = renderParagraphToXml(
    { ...firstP, runs },
    {
      spacingBeforeDxa: firstP.spacingBeforeDxa ?? profile.typography.questionStemSpacingBeforeDxa
    }
  );

  // Render any remaining stem paragraphs (if multi-paragraph stem)
  const remainingXml = paragraphs
    .slice(1)
    .map(p => renderParagraphToXml(p))
    .join("\n");

  return remainingXml ? `${firstPXml}\n${remainingXml}` : firstPXml;
}

export function renderQuestion(
  question: ExamQuestion,
  displayIndex: number,
  profile: TemplateProfile
): string {
  const stemXml = renderQuestionStem(question, displayIndex, profile);

  if (question.type === "MULTIPLE_CHOICE" && question.options) {
    const layout = determineOptionLayout(question.options);
    const optionsXml = renderOptions(question.options, layout, profile);
    return `${stemXml}\n${optionsXml}`;
  } else if (question.type === "TRUE_FALSE" && question.subItems) {
    const subItemsXml = renderTrueFalseSubItems(question.subItems, profile);
    return `${stemXml}\n${subItemsXml}`;
  } else if (question.type === "SHORT_ANSWER") {
    // In student exam, only stem is rendered
    return stemXml;
  }

  return stemXml;
}
