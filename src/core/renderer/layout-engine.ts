import { QuestionOption } from "../ir/types.js";
import { richContentToPlainText } from "../ir/helpers.js";

export type OptionLayoutMode = "4_COLUMNS" | "2_COLUMNS" | "1_COLUMN";

export function determineOptionLayout(options: readonly QuestionOption[]): OptionLayoutMode {
  if (!options || options.length !== 4) {
    return "1_COLUMN";
  }

  const lengths = options.map(opt => {
    return richContentToPlainText(opt.content).trim().length;
  });

  const maxLength = Math.max(...lengths);

  // Thresholds validated against Golden Reference DeSauTron.docx:
  // <= 18 characters: fits in ~2622 dxa column (4 columns on 1 line)
  // <= 45 characters: fits in ~5245 dxa column (2 columns x 2 lines)
  // > 45 characters: takes full width (1 column x 4 lines)
  if (maxLength <= 18) {
    return "4_COLUMNS";
  } else if (maxLength <= 45) {
    return "2_COLUMNS";
  } else {
    return "1_COLUMN";
  }
}
