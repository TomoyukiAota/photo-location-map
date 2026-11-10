/** A text with one tagged part, such as a sentence with a link: what is before the tag, inside it and after it. */
export interface TagParts {
  before: string;
  inside: string;
  after: string;
}

/**
 * Splits a text at `<tag>…</tag>`: "See <pageLink>this page</pageLink>." gives "See ", "this page" and ".". A
 * translation keeps the tag around the words that are the link in its language, wherever they are in the sentence.
 * A text without the tag is all `before`, so that it is still shown, without its link.
 */
export function splitAtTag(text: string, tag: string): TagParts {
  const open = `<${tag}>`;
  const close = `</${tag}>`;
  const openIndex = text.indexOf(open);
  const closeIndex = text.indexOf(close, openIndex + open.length);
  if (openIndex === -1 || closeIndex === -1)
    return { before: text, inside: '', after: '' };
  return {
    before: text.slice(0, openIndex),
    inside: text.slice(openIndex + open.length, closeIndex),
    after: text.slice(closeIndex + close.length),
  };
}
