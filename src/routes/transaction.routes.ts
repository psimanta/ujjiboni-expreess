import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  getAllTransactions,
  getTransactionById,
  getTransactionsByAccount,
  getAccountBalance,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from '../controllers';

const router = Router();

router.use(authenticate);

// GET /transactions - Get all transactions
router.get('/', getAllTransactions);

// GET /transactions/:id - Get transaction by ID
router.get('/:id', getTransactionById);

// GET /transactions/account/:accountId - Get transactions by account
router.get('/account/:accountId', getTransactionsByAccount);

// GET /transactions/account/:accountId/balance - Get account balance
router.get('/account/:accountId/balance', getAccountBalance);

// POST /transactions - Create new transaction
router.post('/', createTransaction);

// PUT /transactions/:id - Update transaction
router.put('/:id', updateTransaction);

// DELETE /transactions/:id - Delete transaction
router.delete('/:id', deleteTransaction);

export default router;
