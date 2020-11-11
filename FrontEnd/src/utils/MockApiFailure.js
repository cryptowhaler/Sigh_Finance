function buildMockApiFailure(message, code, statusCode) {
  return {
    status: statusCode,
    data: { status: false,
            data: { errors: [message,], },
            code,
            type: 'ClientError',
    },
  };
}


export const Timeout = buildMockApiFailure('Request timed out.', 'ERR408', 408);
export const Unauthorized = buildMockApiFailure('Seems like you are not authorized to access this functionality.', 'ERR401', 401);
export const WalletNotConnected = buildMockApiFailure('No Wallet detected. Please connect your wallet with SIGH Finance.', 'ERR401', 401);
export const InternalServerError = buildMockApiFailure('We encountered some error. Please refresh the website.', 'ERR500', 500);
export const SomeError = buildMockApiFailure('Unexpected Error.', 'ERR500', 500);
