/**
 * Transaction Logger Utility
 * Provides structured, consistent logging for blockchain transaction lifecycle
 * Every log includes: timestamp, transactionId, stage, and contextual data
 */

const LogStages = {
  INITIALIZED: 'INITIALIZED',
  PENDING: 'PENDING',
  TRANSACTION_ROUND: 'TRANSACTION_ROUND',
  SUCCESS: 'SUCCESS',
  FAILURE: 'FAILURE'
};

/**
 * Format a structured log entry
 * @param {string} stage - LogStages value
 * @param {string} transactionId - Unique transaction identifier
 * @param {object} data - Contextual data for this stage
 */
export const logTransaction = (stage, transactionId, data = {}) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    transactionId,
    stage,
    ...data
  };

  // Color-code console output by stage
  const colors = {
    [LogStages.INITIALIZED]: '%c[INIT]',
    [LogStages.PENDING]: '%c[PENDING]',
    [LogStages.TRANSACTION_ROUND]: '%c[VERIFY]',
    [LogStages.SUCCESS]: '%c[SUCCESS]',
    [LogStages.FAILURE]: '%c[FAILURE]'
  };

  const colorStyles = {
    [LogStages.INITIALIZED]: 'color: #3498db; font-weight: bold;',
    [LogStages.PENDING]: 'color: #f39c12; font-weight: bold;',
    [LogStages.TRANSACTION_ROUND]: 'color: #9b59b6; font-weight: bold;',
    [LogStages.SUCCESS]: 'color: #27ae60; font-weight: bold;',
    [LogStages.FAILURE]: 'color: #e74c3c; font-weight: bold;'
  };

  console.log(
    `${colors[stage]} Transaction Lifecycle`,
    colorStyles[stage],
    logEntry
  );

  return logEntry;
};

/**
 * Log transaction initialization
 */
export const logInitialized = (transactionId, { userId, amount, token, walletAddress, poolAddress, poolType }) => {
  return logTransaction(LogStages.INITIALIZED, transactionId, {
    userId,
    amount,
    token,
    walletAddress: `${walletAddress?.slice(0, 6)}...${walletAddress?.slice(-4)}`,
    poolAddress: `${poolAddress?.slice(0, 6)}...${poolAddress?.slice(-4)}`,
    poolType,
    message: 'User clicked deposit/pay button'
  });
};

/**
 * Log pending transaction creation
 */
export const logPending = (transactionId, { status, chain, expectedAmount, poolType }) => {
  return logTransaction(LogStages.PENDING, transactionId, {
    status,
    chain,
    expectedAmount,
    poolType,
    message: 'PendingTransaction record created in database'
  });
};

/**
 * Log verification round during polling
 */
export const logTransactionRound = (transactionId, { roundNumber, txHash, blockNumber, confirmations, currentStatus, expectedAmount }) => {
  return logTransaction(LogStages.TRANSACTION_ROUND, transactionId, {
    roundNumber,
    txHash: `${txHash?.slice(0, 10)}...${txHash?.slice(-8)}`,
    blockNumber,
    confirmations,
    currentStatus,
    expectedAmount,
    message: `Verification round ${roundNumber} - checking blockchain`
  });
};

/**
 * Log successful transaction
 */
export const logSuccess = (transactionId, { txHash, creditedAmount, finalConfirmations, status, poolType }) => {
  return logTransaction(LogStages.SUCCESS, transactionId, {
    txHash: `${txHash?.slice(0, 10)}...${txHash?.slice(-8)}`,
    creditedAmount,
    finalConfirmations,
    status,
    poolType,
    message: 'Transaction verified and credited to user'
  });
};

/**
 * Log transaction failure
 */
export const logFailure = (transactionId, { txHash, failureReason, status, poolType, attemptedRounds }) => {
  return logTransaction(LogStages.FAILURE, transactionId, {
    txHash: txHash ? `${txHash?.slice(0, 10)}...${txHash?.slice(-8)}` : 'N/A',
    failureReason,
    status,
    poolType,
    attemptedRounds,
    message: 'Transaction verification failed'
  });
};

export default {
  LogStages,
  logTransaction,
  logInitialized,
  logPending,
  logTransactionRound,
  logSuccess,
  logFailure
};