import { TemplateProfile } from "./template-loader.js";
import { renderPageOfPagesFooter } from "./field-handler.js";

export function renderFooterXml(examCode: string, profile: TemplateProfile): string {
  const rightTabPos = profile.tabs.footerRightTabDxa;
  const pXml = renderPageOfPagesFooter(examCode, rightTabPos);

  return [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">',
    pXml,
    '</w:ftr>'
  ].join("\n");
}
