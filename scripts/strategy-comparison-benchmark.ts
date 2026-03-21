import {
  runStrategyComparisonEngine,
  strategyComparisonResultToJson,
} from "../src/lib/poe2-item-simulator/strategyComparisonEngine";

const result = runStrategyComparisonEngine({ trials: 10000 });
process.stdout.write(`${strategyComparisonResultToJson(result, 2)}\n`);
