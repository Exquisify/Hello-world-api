import sanitizeHtml from "sanitize‐html";

/**
 * sanitizeHTML
 *  - Strips any disallowed tags/attributes to prevent XSS.
 *  - Outputs a “safe” HTML string.
 */
export function sanitizeHTML(dirtyHtml: string): string {
  return sanitizeHtml(dirtyHtml, {
    // Only allow a minimal set of tags/attributes.
    allowedTags: [
      "b",
      "i",
      "em",
      "strong",
      "a",
      "p",
      "ul",
      "ol",
      "li",
      "br",
      "span",
      "blockquote",
      "code",
      "pre",
    ],
    allowedAttributes: {
      a: ["href", "name", "target"],
      span: ["style"],
      code: ["class"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    // Disallow all inline event handlers, scripts, etc.
    allowedSchemesByTag: {
      img: ["http", "https"],
    },
    // Force‐strip any unknown tags/attributes
    nonTextTags: ["style", "script", "iframe", "object", "embed"],
  });
}


export function escapeText(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
