export async function sleep(durationInMilliseconds: number) {
  await new Promise(resolve => setTimeout(resolve, durationInMilliseconds));
}
