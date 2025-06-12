"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const models_1 = require("../models");
const router = (0, express_1.Router)();
router.get('/', async (req, res) => {
    try {
        const { isLocked, accountHolder, page = 1, limit = 10 } = req.query;
        const query = {};
        if (typeof isLocked !== 'undefined') {
            query.isLocked = isLocked === 'true';
        }
        if (accountHolder) {
            query.accountHolder = new RegExp(accountHolder, 'i');
        }
        const skip = (Number(page) - 1) * Number(limit);
        const users = await models_1.User.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));
        const total = await models_1.User.countDocuments(query);
        res.json({
            users,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit)),
            },
        });
    }
    catch (error) {
        res.status(500).json({
            error: 'Failed to fetch users',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const user = await models_1.User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({
                error: 'User not found',
                message: `User with ID ${req.params.id} does not exist`,
            });
        }
        return res.json({ user });
    }
    catch (error) {
        return res.status(500).json({
            error: 'Failed to fetch user',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
router.post('/', async (req, res) => {
    try {
        const { name, accountHolder, isLocked = false } = req.body;
        if (!name || !accountHolder) {
            return res.status(400).json({
                error: 'Validation error',
                message: 'Name and accountHolder are required fields',
            });
        }
        const user = new models_1.User({
            name,
            accountHolder,
            isLocked,
        });
        const savedUser = await user.save();
        return res.status(201).json({
            message: 'User created successfully',
            user: savedUser,
        });
    }
    catch (error) {
        if (error instanceof Error && error.name === 'ValidationError') {
            return res.status(400).json({
                error: 'Validation error',
                message: error.message,
            });
        }
        return res.status(500).json({
            error: 'Failed to create user',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
router.put('/:id', async (req, res) => {
    try {
        const { name, accountHolder, isLocked } = req.body;
        const user = await models_1.User.findByIdAndUpdate(req.params.id, { name, accountHolder, isLocked }, { new: true, runValidators: true });
        if (!user) {
            return res.status(404).json({
                error: 'User not found',
                message: `User with ID ${req.params.id} does not exist`,
            });
        }
        return res.json({
            message: 'User updated successfully',
            user,
        });
    }
    catch (error) {
        if (error instanceof Error && error.name === 'ValidationError') {
            return res.status(400).json({
                error: 'Validation error',
                message: error.message,
            });
        }
        return res.status(500).json({
            error: 'Failed to update user',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
router.patch('/:id/lock', async (req, res) => {
    try {
        const user = await models_1.User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({
                error: 'User not found',
                message: `User with ID ${req.params.id} does not exist`,
            });
        }
        await user.lock();
        return res.json({
            message: 'User account locked successfully',
            user,
        });
    }
    catch (error) {
        return res.status(500).json({
            error: 'Failed to lock user account',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
router.patch('/:id/unlock', async (req, res) => {
    try {
        const user = await models_1.User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({
                error: 'User not found',
                message: `User with ID ${req.params.id} does not exist`,
            });
        }
        await user.unlock();
        return res.json({
            message: 'User account unlocked successfully',
            user,
        });
    }
    catch (error) {
        return res.status(500).json({
            error: 'Failed to unlock user account',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
router.delete('/:id', async (req, res) => {
    try {
        const user = await models_1.User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({
                error: 'User not found',
                message: `User with ID ${req.params.id} does not exist`,
            });
        }
        return res.json({
            message: 'User deleted successfully',
            user,
        });
    }
    catch (error) {
        return res.status(500).json({
            error: 'Failed to delete user',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
exports.default = router;
//# sourceMappingURL=users.js.map