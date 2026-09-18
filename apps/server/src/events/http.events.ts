enum SYSTEM_CUSTOM_ERROR_EVENTS {
  INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
  UNAUTHORIZED = "UNAUTHORIZED",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",

  // -- 400: bad request / validation --
  VALIDATION_ERROR = "VALIDATION_ERROR",

  // -- 404: not found --
  SCENARIO_NOT_FOUND = "SCENARIO_NOT_FOUND",

  // -- 422: semantically invalid --
  INFEASIBLE_SCENARIO = "INFEASIBLE_SCENARIO",

  // -- 500: operation failed --
  SCENARIO_CREATION_FAILED = "SCENARIO_CREATION_FAILED",
  LLM_INTERPRETATION_FAILED = "LLM_INTERPRETATION_FAILED",
  OPTIMIZATION_FAILED = "OPTIMIZATION_FAILED",
  SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
}

export const SystemCustomErrorCode: Record<SYSTEM_CUSTOM_ERROR_EVENTS, string> =
  {
    INTERNAL_SERVER_ERROR: "50000",
    UNAUTHORIZED: "40100",
    UNKNOWN_ERROR: "50001",

    VALIDATION_ERROR: "40001",

    SCENARIO_NOT_FOUND: "40401",

    INFEASIBLE_SCENARIO: "42201",

    SCENARIO_CREATION_FAILED: "50010",
    LLM_INTERPRETATION_FAILED: "50011",
    OPTIMIZATION_FAILED: "50012",
    SERVICE_UNAVAILABLE: "50300",
  };

export type SystemCustomErrorMessageDataType = {
  title?: string;
  message: string;
  code: string;
};

type SystemCustomErrorMessageType = {
  [key: string]: SystemCustomErrorMessageDataType;
};

/**
 * Lookup table for system-wide error messages.
 *
 * @description Translates internal error codes into structured objects
 * containing a display title, a detailed message, and the original code.
 *
 * @example
 * const error = SystemCustomErrorMessageByCodes[SystemCustomErrorCode.SCENARIO_NOT_FOUND];
 * return res.status(404).json(error);
 */
export const SystemCustomErrorMsgByCode: SystemCustomErrorMessageType = {
  [SystemCustomErrorCode.INTERNAL_SERVER_ERROR]: {
    title: "Unexpected Error",
    message:
      "Something went wrong on our end. Please try again later or contact support if the issue persists.",
    code: SystemCustomErrorCode.INTERNAL_SERVER_ERROR,
  },
  [SystemCustomErrorCode.UNAUTHORIZED]: {
    title: "Unauthorized",
    message: "Your session has expired or is invalid. Please log in again.",
    code: SystemCustomErrorCode.UNAUTHORIZED,
  },
  [SystemCustomErrorCode.UNKNOWN_ERROR]: {
    title: "Unknown Error",
    message:
      "An unexpected error occurred. Please try again later or contact support if the issue persists.",
    code: SystemCustomErrorCode.UNKNOWN_ERROR,
  },

  // -- 400 --
  [SystemCustomErrorCode.VALIDATION_ERROR]: {
    title: "Invalid Input",
    message: "One or more fields failed validation.",
    code: SystemCustomErrorCode.VALIDATION_ERROR,
  },

  // -- 404 --
  [SystemCustomErrorCode.SCENARIO_NOT_FOUND]: {
    title: "Scenario Not Found",
    message: "No scenario exists with the given scenario_id.",
    code: SystemCustomErrorCode.SCENARIO_NOT_FOUND,
  },

  // -- 422 --
  [SystemCustomErrorCode.INFEASIBLE_SCENARIO]: {
    title: "Infeasible Scenario",
    message:
      "The scenario cannot be scheduled without violating battery, energy, or directive constraints.",
    code: SystemCustomErrorCode.INFEASIBLE_SCENARIO,
  },

  // -- 500 --
  [SystemCustomErrorCode.SCENARIO_CREATION_FAILED]: {
    title: "Scenario Creation Failed",
    message: "The scenario could not be saved. Please try again.",
    code: SystemCustomErrorCode.SCENARIO_CREATION_FAILED,
  },
  [SystemCustomErrorCode.LLM_INTERPRETATION_FAILED]: {
    title: "Interpretation Failed",
    message: "Operator notes could not be interpreted. Please try again.",
    code: SystemCustomErrorCode.LLM_INTERPRETATION_FAILED,
  },
  [SystemCustomErrorCode.OPTIMIZATION_FAILED]: {
    title: "Optimization Failed",
    message: "A valid energy schedule could not be produced for this scenario.",
    code: SystemCustomErrorCode.OPTIMIZATION_FAILED,
  },
  [SystemCustomErrorCode.SERVICE_UNAVAILABLE]: {
    title: "Service Unavailable",
    message:
      "The service is temporarily unavailable. Please try again in a few moments.",
    code: SystemCustomErrorCode.SERVICE_UNAVAILABLE,
  },
};

/**
 * Retrieves structured error metadata (title, message, and code) for a specific error key.
 *
 * This utility is primarily used for sending error events by key not error code
 *
 * @param key - The unique identifier from `SYSTEM_CUSTOM_ERROR_EVENTS`.
 * @returns The corresponding error object containing display text and the error code.
 *
 * @example
 * // Displaying a toast message when a database error occurs
 * const errorInfo = getSystemCustomErrorMsgByKey(SYSTEM_CUSTOM_ERROR_EVENTS.SCENARIO_NOT_FOUND);
 *
 * return res.status(400).json({error: errorInfo})
 */
export const getSystemCustomErrorMsgByKey = (
  key: keyof typeof SYSTEM_CUSTOM_ERROR_EVENTS
) => {
  return SystemCustomErrorMsgByCode[SystemCustomErrorCode[key]]!;
};
