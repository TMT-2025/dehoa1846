import { EMBEDDED_BASE_TEMPLATE_BASE64 } from "./embedded-template.js";

export interface PageGeometryProfile {
  pageWidthDxa: number;       // 11906 (A4 width)
  pageHeightDxa: number;      // 16838 (A4 height)
  marginTopDxa: number;       // 567 (1 cm)
  marginBottomDxa: number;    // 567 (1 cm)
  marginLeftDxa: number;      // 1134 (2 cm)
  marginRightDxa: number;     // 567 (1 cm)
  headerMarginDxa: number;    // 283 (0.5 cm)
  footerMarginDxa: number;    // 567 (1 cm)
  contentWidthDxa: number;    // 10205 (17.99 cm)
}

export interface TabStopProfile {
  fourColumns: number[];      // [283, 2906, 5528, 8150]
  twoColumns: number[];       // [283, 5528]
  oneColumn: number[];        // [283]
  trueFalse: number[];        // [283]
  footerRightTabDxa: number;  // 10489
}

export interface HeaderTableProfile {
  colWidthsDxa: [number, number, number]; // [6123, 2041, 2041]
  borderBottomSize: number;               // 12 (1.5 pt)
  nameFieldPrompt: string;                // "Họ và tên: ............................................................................"
  idFieldPrompt: string;                  // "Số báo danh: ......."
}

export interface TypographyProfile {
  fontName: string;                       // "Times New Roman"
  fontSizeHalfPoints: number;             // 24 (12 pt)
  questionStemSpacingBeforeDxa: number;   // 60 (3 pt)
  endMarkerText: string;                  // "------ HẾT ------"
}

export interface TemplateProfile {
  profileId: string;
  name: string;
  geometry: PageGeometryProfile;
  tabs: TabStopProfile;
  headerTable: HeaderTableProfile;
  typography: TypographyProfile;
}

export const DEFAULT_TEMPLATE_PROFILE: TemplateProfile = {
  profileId: "vietnam-standard-a4",
  name: "Chuẩn thể thức thi trắc nghiệm Việt Nam (A4)",
  geometry: {
    pageWidthDxa: 11906,
    pageHeightDxa: 16838,
    marginTopDxa: 567,
    marginBottomDxa: 567,
    marginLeftDxa: 1134,
    marginRightDxa: 567,
    headerMarginDxa: 283,
    footerMarginDxa: 567,
    contentWidthDxa: 10205
  },
  tabs: {
    fourColumns: [283, 2906, 5528, 8150],
    twoColumns: [283, 5528],
    oneColumn: [283],
    trueFalse: [283],
    footerRightTabDxa: 10489
  },
  headerTable: {
    colWidthsDxa: [6123, 2041, 2041],
    borderBottomSize: 12,
    nameFieldPrompt: "Họ và tên: ............................................................................",
    idFieldPrompt: "Số báo danh: ......."
  },
  typography: {
    fontName: "Times New Roman",
    fontSizeHalfPoints: 24,
    questionStemSpacingBeforeDxa: 60,
    endMarkerText: "------ HẾT ------"
  }
};

/**
 * Loads a reference DOCX template buffer (browser & server safe)
 */
export function loadTemplateBuffer(customBuffer?: Uint8Array | Buffer): Uint8Array {
  if (customBuffer) return customBuffer;
  const binaryString = atob(EMBEDDED_BASE_TEMPLATE_BASE64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}
