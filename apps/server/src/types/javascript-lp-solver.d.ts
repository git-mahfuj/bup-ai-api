declare module "javascript-lp-solver" {
  interface LPModel {
    optimize: string;
    opType: "min" | "max";
    constraints: Record<string, { min?: number; max?: number; equal?: number }>;
    variables: Record<string, Record<string, number>>;
  }

  interface LPSolution {
    feasible: boolean;
    result: number;
    bounded: boolean;
    [variableName: string]: number | boolean;
  }

  const solver: {
    Solve: (model: LPModel) => LPSolution;
  };

  export default solver;
}
