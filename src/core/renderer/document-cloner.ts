import JSZip from "jszip";

export async function cloneAndAssembleDocx(
  templateBuffer: Buffer | Uint8Array,
  documentXmlContent: string,
  footerXmlContent: string
): Promise<Uint8Array> {
  const zip = await JSZip.loadAsync(templateBuffer);

  // 1. Replace word/document.xml
  zip.file("word/document.xml", documentXmlContent);

  // 2. Replace or add word/footer1.xml
  zip.file("word/footer1.xml", footerXmlContent);

  // 3. Ensure word/_rels/document.xml.rels has relationship to footer1.xml
  const relsFile = zip.file("word/_rels/document.xml.rels");
  if (relsFile) {
    let relsXml = await relsFile.async("string");
    if (!relsXml.includes('Target="footer1.xml"')) {
      // Inject relationship
      const relEntry = '<Relationship Id="rId7" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/>';
      relsXml = relsXml.replace("</Relationships>", `${relEntry}</Relationships>`);
      zip.file("word/_rels/document.xml.rels", relsXml);
    }
  }

  // 4. Ensure [Content_Types].xml includes footer override
  const contentTypesFile = zip.file("[Content_Types].xml");
  if (contentTypesFile) {
    let ctXml = await contentTypesFile.async("string");
    if (!ctXml.includes('PartName="/word/footer1.xml"')) {
      const overrideEntry = '<Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>';
      ctXml = ctXml.replace("</Types>", `${overrideEntry}</Types>`);
      zip.file("[Content_Types].xml", ctXml);
    }
  }

  // 5. Generate output buffer
  const outputBuffer = await zip.generateAsync({
    type: "uint8array",
    compression: "DEFLATE",
    compressionOptions: { level: 6 }
  });

  return outputBuffer;
}
