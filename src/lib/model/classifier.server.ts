import modelJson from "./model.json";
import { analyze, type TrainedModel } from "./classifier";

const model = modelJson as unknown as TrainedModel;

export function runTrainedModel(source: string) {
  return analyze(model, source);
}
