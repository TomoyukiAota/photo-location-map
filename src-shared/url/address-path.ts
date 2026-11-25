/**
 * The path that `url`, an address of `origin` such as "plm-app://app", stands for, decoded; undefined for an address
 * of another origin, or an escape that is not one. The query and the fragment are not of the path. The address is read
 * as a text, not with Node.js's URL, whose parts were now and then another URL's in the main process of the e2e suite
 * (src-main/file-server/app-page.ts).
 */
export function pathOfAddress(url: string, origin: string): string | undefined {
  if (!url.startsWith(`${origin}/`))
    return undefined;
  try {
    return decodeURIComponent(url.slice(origin.length + 1).replace(/[?#][\s\S]*$/, ''));
  } catch {
    return undefined;
  }
}
