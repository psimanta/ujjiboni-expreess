import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import {
  getAllAccounts,
  getAccountById,
  createAccount,
  // updateAccount,
  // lockAccount,
  // unlockAccount,
  // deleteAccount,
} from '../controllers';

const router = Router();

// GET /accounts - Get all accounts
router.get('/', [authenticate], getAllAccounts);

// GET /accounts/:id - Get account by ID
router.get('/:id', [authenticate], getAccountById);

// POST /accounts - Create new account
router.post('/', [authenticate], createAccount);

// PUT /accounts/:id - Update account
// router.put('/:id', updateAccount);

// // PATCH /accounts/:id/lock - Lock account
// router.patch('/:id/lock', lockAccount);

// // PATCH /accounts/:id/unlock - Unlock account
// router.patch('/:id/unlock', unlockAccount);

// // DELETE /accounts/:id - Delete account
// router.delete('/:id', deleteAccount);

export default router;
