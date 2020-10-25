// For asyncMap and asyncFilter, see https://qiita.com/janus_wel/items/1dc491d866f49af76e98


/**
 * Maps inputArray to outputArray using mapFn asynchronously.
 * Note that mapFn must always resolve.
 * This function does not correctly work when rejection occurs in mapFn.
 */
export async function asyncMap<TInput, TOutput>(inputArray: TInput[], mapFn: (item: TInput) => Promise<TOutput>): Promise<TOutput[]> {
  const outputPromiseArray = inputArray.map(async item => await mapFn(item));
  return await Promise.all(outputPromiseArray);
}

// Modified based on https://qiita.com/janus_wel/items/1dc491d866f49af76e98
export async function asyncFilter<TItem>(array: TItem[], predicate: (item: TItem) => Promise<boolean>) {
  const evaluateds = await asyncMap(array, async item => {
    const shouldExist = await predicate(item);
    return { item, shouldExist };
  });
  return evaluateds
    .filter(evaluated => evaluated.shouldExist)
    .map(evaluated => evaluated.item);
}
