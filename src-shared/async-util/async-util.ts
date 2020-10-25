// Modified based on https://qiita.com/janus_wel/items/1dc491d866f49af76e98
export async function asyncMap<TInput, TOutput>(array: TInput[], operation: (item: TInput) => Promise<TOutput>): Promise<TOutput[]> {
  return await Promise.all(array.map(async item => await operation(item)));
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
