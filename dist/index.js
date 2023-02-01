'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const retry = require('retry');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e["default"] : e; }

const retry__default = /*#__PURE__*/_interopDefaultLegacy(retry);

const networkErrorMsgs = /* @__PURE__ */ new Set([
  "Failed to fetch",
  "NetworkError when attempting to fetch resource.",
  "The Internet connection appears to be offline.",
  "Network request failed",
  "fetch failed"
]);
class AbortError extends Error {
  constructor(message) {
    super();
    if (message instanceof Error) {
      this.originalError = message;
      ({ message } = message);
    } else {
      this.originalError = new Error(message);
      this.originalError.stack = this.stack;
    }
    this.name = "AbortError";
    this.message = message;
  }
}
const decorateErrorWithCounts = (error, attemptNumber, options) => {
  const retriesLeft = options.retries - (attemptNumber - 1);
  error.attemptNumber = attemptNumber;
  error.retriesLeft = retriesLeft;
  return error;
};
const isNetworkError = (errorMessage) => networkErrorMsgs.has(errorMessage);
const getDOMException = (errorMessage) => globalThis.DOMException === void 0 ? new Error(errorMessage) : new DOMException(errorMessage);
async function pRetry(input, options) {
  return new Promise((resolve, reject) => {
    options = {
      onFailedAttempt() {
      },
      retries: 10,
      ...options
    };
    const operation = retry__default.operation(options);
    operation.attempt(async (attemptNumber) => {
      try {
        resolve(await input(attemptNumber));
      } catch (error) {
        if (!(error instanceof Error)) {
          reject(new TypeError(`Non-error was thrown: "${error}". You should only throw errors.`));
          return;
        }
        if (error instanceof AbortError) {
          operation.stop();
          reject(error.originalError);
        } else if (error instanceof TypeError && !isNetworkError(error.message)) {
          operation.stop();
          reject(error);
        } else {
          decorateErrorWithCounts(error, attemptNumber, options);
          try {
            await options.onFailedAttempt(error);
          } catch (error2) {
            reject(error2);
            return;
          }
          if (!operation.retry(error)) {
            reject(operation.mainError());
          }
        }
      }
    });
    if (options.signal && !options.signal.aborted) {
      options.signal.addEventListener("abort", () => {
        operation.stop();
        const reason = options.signal.reason === void 0 ? getDOMException("The operation was aborted.") : options.signal.reason;
        reject(reason instanceof Error ? reason : getDOMException(reason));
      }, {
        once: true
      });
    }
  });
}

exports.AbortError = AbortError;
exports["default"] = pRetry;
