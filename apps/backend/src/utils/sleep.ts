export const sleep = (valueMs: number): Promise<void> => {
  if (valueMs <= 0) throw new Error('Sleep value must be greater than 0');

  return new Promise((resolve) => setTimeout(resolve, valueMs));
};
