export const getRandomIntInclusive = (minInclusive: number, maxInclusive: number): number => {
  const minimum = Math.ceil(minInclusive);
  const maximum = Math.floor(maxInclusive);
  if (minimum > maximum) {
    throw new Error(`Invalid random range: ${minInclusive}..${maxInclusive}`);
  }
  const span = maximum - minimum + 1;
  return minimum + Math.floor(Math.random() * span);
};

export interface IWeightedChoice<T> {
  candidate: T;
  weight: number;
}

export const pickWeightedRandom = <T,>(choices: ReadonlyArray<IWeightedChoice<T>>): T => {
  const validChoices = choices.filter((choice) => choice.weight > 0);
  if (validChoices.length === 0) {
    throw new Error("No valid weighted choices (all weights are <= 0).");
  }

  const totalWeight = validChoices.reduce((sum, choice) => sum + choice.weight, 0);
  const randomPoint = Math.random() * totalWeight;

  let cumulativeWeight = 0;
  for (const choice of validChoices) {
    cumulativeWeight += choice.weight;
    if (randomPoint < cumulativeWeight) {
      return choice.candidate;
    }
  }

  // Fallback for floating point edge cases.
  return validChoices[validChoices.length - 1].candidate;
};

