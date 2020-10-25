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

/**
 * Filters itemArray by filterFn asynchronously.
 * Note that filterFn must always resolve to a boolean value.
 * This function does not correctly work when rejection occurs in mapFn.
 */
export async function asyncFilter<TItem>(itemArray: TItem[], filterFn: (item: TItem) => Promise<boolean>): Promise<TItem[]> {
  const itemAndPredicateResultPair = await asyncMap(itemArray, async item => {
    const filterFnResult = await filterFn(item);
    return { item, filterFnResult };
  });
  return itemAndPredicateResultPair
    .filter(pair => pair.filterFnResult)
    .map(pair => pair.item);
}
