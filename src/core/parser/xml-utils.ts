import { Element, Node } from "@xmldom/xmldom";

export function getChildrenByLocalName(parent: Node, localName: string): Element[] {
  const result: Element[] = [];
  const children = parent.childNodes;
  if (!children) return result;
  
  for (let i = 0; i < children.length; i++) {
    const child = children.item(i);
    if (child && child.nodeType === 1) { // Node.ELEMENT_NODE
      const el = child as Element;
      const name = el.localName || el.nodeName.split(":").pop();
      if (name === localName) {
        result.push(el);
      }
    }
  }
  return result;
}

export function getFirstChildByLocalName(parent: Node, localName: string): Element | null {
  const children = parent.childNodes;
  if (!children) return null;
  
  for (let i = 0; i < children.length; i++) {
    const child = children.item(i);
    if (child && child.nodeType === 1) {
      const el = child as Element;
      const name = el.localName || el.nodeName.split(":").pop();
      if (name === localName) {
        return el;
      }
    }
  }
  return null;
}

export function getAttributeValue(element: Element, attrLocalName: string): string | null {
  // Check direct attribute, e.g. "w:val" or "val"
  for (let i = 0; i < element.attributes.length; i++) {
    const attr = element.attributes.item(i);
    if (attr) {
      const name = attr.localName || attr.name.split(":").pop();
      if (name === attrLocalName) {
        return attr.value;
      }
    }
  }
  return null;
}

export function getElementTextContent(element: Element): string {
  let text = "";
  const tElements = getDescendantsByLocalName(element, "t");
  for (const t of tElements) {
    text += t.textContent || "";
  }
  return text;
}

export function getDescendantsByLocalName(parent: Node, localName: string): Element[] {
  const result: Element[] = [];
  function recurse(node: Node) {
    const children = node.childNodes;
    if (!children) return;
    for (let i = 0; i < children.length; i++) {
      const child = children.item(i);
      if (child && child.nodeType === 1) {
        const el = child as Element;
        const name = el.localName || el.nodeName.split(":").pop();
        if (name === localName) {
          result.push(el);
        }
        recurse(child);
      }
    }
  }
  recurse(parent);
  return result;
}
