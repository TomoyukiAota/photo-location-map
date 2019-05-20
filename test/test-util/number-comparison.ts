export function nearlyEqual(right: number, left: number,
                            tolerance: number = Number.EPSILON): boolean {
  const diff = Math.abs(right - left);

  if (diff <= tolerance)
    return true;

  return right === left;
}
