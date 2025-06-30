import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  getAllTransactions,
  getTransactionById,
  getTransactionsByAccount,
  getAccountBalance,
  createTransaction,
  // updateTransaction,
  // deleteTransaction,
} from '../controllers';

const router = Router();

// GET /transactions - Get all transactions
router.get('/', [authenticate], getAllTransactions);

// GET /transactions/:id - Get transaction by ID
router.get('/:id', [authenticate], getTransactionById);

// GET /transactions/account/:accountId - Get transactions by account
router.get('/account/:accountId', [authenticate], getTransactionsByAccount);

// GET /transactions/account/:accountId/balance - Get account balance
router.get('/account/:accountId/balance', [authenticate], getAccountBalance);

// POST /transactions - Create new transaction
router.post('/', [authenticate], createTransaction);

// PUT /transactions/:id - Update transaction
// router.put('/:id', [authenticate], updateTransaction);

// DELETE /transactions/:id - Delete transaction
// router.delete('/:id', [authenticate], deleteTransaction);

export default router;
