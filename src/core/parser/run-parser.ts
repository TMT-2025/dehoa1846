import { Element } from "@xmldom/xmldom";
import { FormattedRun, RichParagraph, TabStopDefinition, VertAlign } from "../ir/types.js";
import { getChildrenByLocalName, getFirstChildByLocalName, getAttributeValue, getDescendantsByLocalName } from "./xml-utils.js";

export function parseRunElement(rElement: Element, options: { sanitizeUnderline?: boolean } = {}): FormattedRun[] {
  const runs: FormattedRun[] = [];
  const rPr = getFirstChildByLocalName(rElement, "rPr");

  let isBold = false;
  let isItalic = false;
  let underlineVal: string | undefined = undefined;
  let vertAlign: VertAlign | undefined = undefined;
  let fontName: string | undefined = undefined;
  let fontSizeHalfPoints: number | undefined = undefined;
  let colorHex: string | undefined = undefined;
  let isStrike = false;

  if (rPr) {
    const bNode = getFirstChildByLocalName(rPr, "b");
    if (bNode) {
      const bVal = getAttributeValue(bNode, "val");
      isBold = bVal !== "0" && bVal !== "false";
    }

    const iNode = getFirstChildByLocalName(rPr, "i");
    if (iNode) {
      const iVal = getAttributeValue(iNode, "val");
      isItalic = iVal !== "0" && iVal !== "false";
    }

    const uNode = getFirstChildByLocalName(rPr, "u");
    if (uNode) {
      const uVal = getAttributeValue(uNode, "val");
      if (uVal && uVal !== "none") {
        underlineVal = uVal;
      }
    }

    const vertAlignNode = getFirstChildByLocalName(rPr, "vertAlign");
    if (vertAlignNode) {
      const vaVal = getAttributeValue(vertAlignNode, "val");
      if (vaVal === "subscript") vertAlign = "subscript";
      else if (vaVal === "superscript") vertAlign = "superscript";
    }

    const colorNode = getFirstChildByLocalName(rPr, "color");
    if (colorNode) {
      const cVal = getAttributeValue(colorNode, "val");
      if (cVal && cVal !== "auto") {
        colorHex = cVal;
      }
    }

    const rFontsNode = getFirstChildByLocalName(rPr, "rFonts");
    if (rFontsNode) {
      fontName = getAttributeValue(rFontsNode, "ascii") || getAttributeValue(rFontsNode, "hAnsi") || undefined;
    }

    const szNode = getFirstChildByLocalName(rPr, "sz");
    if (szNode) {
      const szVal = getAttributeValue(szNode, "val");
      if (szVal) {
        const parsed = parseInt(szVal, 10);
        if (!isNaN(parsed)) fontSizeHalfPoints = parsed;
      }
    }

    const strikeNode = getFirstChildByLocalName(rPr, "strike");
    if (strikeNode) {
      const sVal = getAttributeValue(strikeNode, "val");
      isStrike = sVal !== "0" && sVal !== "false";
    }
  }

  if (options.sanitizeUnderline) {
    underlineVal = undefined;
  }

  // Iterate over child nodes of w:r (could be w:t, w:tab, w:br)
  const children = rElement.childNodes;
  if (children) {
    for (let i = 0; i < children.length; i++) {
      const child = children.item(i);
      if (child && child.nodeType === 1) {
        const el = child as Element;
        const name = el.localName || el.nodeName.split(":").pop();

        if (name === "t") {
          const text = el.textContent || "";
          runs.push({
            text,
            bold: isBold || undefined,
            italic: isItalic || undefined,
            underline: underlineVal,
            vertAlign,
            fontName,
            fontSizeHalfPoints,
            colorHex,
            strike: isStrike || undefined
          });
        } else if (name === "tab") {
          runs.push({
            text: "\t",
            isTab: true,
            bold: isBold || undefined,
            italic: isItalic || undefined,
            underline: underlineVal
          });
        } else if (name === "br") {
          runs.push({
            text: "\n",
            isLineBreak: true
          });
        }
      }
    }
  }

  return runs;
}

export function parseParagraphElement(pElement: Element, options: { sanitizeUnderline?: boolean } = {}): RichParagraph {
  const runs: FormattedRun[] = [];
  const pPr = getFirstChildByLocalName(pElement, "pPr");

  let alignment: "left" | "center" | "right" | "justify" | undefined = undefined;
  let spacingBeforeDxa: number | undefined = undefined;
  let spacingAfterDxa: number | undefined = undefined;
  let lineSpacingDxa: number | undefined = undefined;
  const tabStops: TabStopDefinition[] = [];

  if (pPr) {
    const jcNode = getFirstChildByLocalName(pPr, "jc");
    if (jcNode) {
      const jcVal = getAttributeValue(jcNode, "val");
      if (jcVal === "center" || jcVal === "right" || jcVal === "both" || jcVal === "left") {
        alignment = jcVal === "both" ? "justify" : (jcVal as "center" | "right" | "left");
      }
    }

    const spacingNode = getFirstChildByLocalName(pPr, "spacing");
    if (spacingNode) {
      const before = getAttributeValue(spacingNode, "before");
      if (before) spacingBeforeDxa = parseInt(before, 10);
      const after = getAttributeValue(spacingNode, "after");
      if (after) spacingAfterDxa = parseInt(after, 10);
      const line = getAttributeValue(spacingNode, "line");
      if (line) lineSpacingDxa = parseInt(line, 10);
    }

    const tabsNode = getFirstChildByLocalName(pPr, "tabs");
    if (tabsNode) {
      const tabElements = getChildrenByLocalName(tabsNode, "tab");
      for (const tabEl of tabElements) {
        const pos = getAttributeValue(tabEl, "pos");
        const val = getAttributeValue(tabEl, "val") || "left";
        if (pos) {
          tabStops.push({
            positionDxa: parseInt(pos, 10),
            alignment: val === "right" ? "right" : val === "center" ? "center" : "left"
          });
        }
      }
    }
  }

  const rElements = getChildrenByLocalName(pElement, "r");
  for (const rEl of rElements) {
    const parsedRuns = parseRunElement(rEl, options);
    runs.push(...parsedRuns);
  }

  return {
    runs,
    alignment,
    spacingBeforeDxa,
    spacingAfterDxa,
    lineSpacingDxa,
    tabStops: tabStops.length > 0 ? tabStops : undefined
  };
}

export function elementHasUnderline(element: Element): boolean {
  const uElements = getDescendantsByLocalName(element, "u");
  for (const u of uElements) {
    const val = getAttributeValue(u, "val");
    if (val && val !== "none") {
      return true;
    }
  }
  return false;
}

export function elementHasColor(element: Element, colorHexPrefix: string): boolean {
  const colorElements = getDescendantsByLocalName(element, "color");
  for (const c of colorElements) {
    const val = getAttributeValue(c, "val");
    if (val && val.toUpperCase().startsWith(colorHexPrefix.toUpperCase())) {
      return true;
    }
  }
  return false;
}
