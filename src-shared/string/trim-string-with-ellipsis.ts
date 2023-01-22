export function trimStringWithEllipsis(input: string, limit: number) {
  const isTrimmed = input.length > limit;
  const output = isTrimmed
    ? input.substring(0, limit - 1) + '…'
    : input;
  return {isTrimmed, output};
}
