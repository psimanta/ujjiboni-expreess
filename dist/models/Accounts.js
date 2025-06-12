"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Account = void 0;
const mongoose_1 = require("mongoose");
const accountSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, 'Account name is required'],
        trim: true,
        maxlength: [100, 'Account name cannot exceed 100 characters'],
    },
    accountHolder: {
        type: String,
        required: [true, 'Account holder name is required'],
        trim: true,
        maxlength: [100, 'Account holder name cannot exceed 100 characters'],
    },
    isLocked: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
    toJSON: {
        transform: (doc, ret) => {
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
            return ret;
        },
    },
    toObject: {
        transform: (doc, ret) => {
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
            return ret;
        },
    },
});
accountSchema.methods.lock = function () {
    this.isLocked = true;
    return this.save();
};
accountSchema.methods.unlock = function () {
    this.isLocked = false;
    return this.save();
};
accountSchema.statics.findByAccountHolder = function (accountHolder) {
    return this.find({ accountHolder: new RegExp(accountHolder, 'i') });
};
accountSchema.statics.findUnlocked = function () {
    return this.find({ isLocked: false });
};
accountSchema.statics.findLocked = function () {
    return this.find({ isLocked: true });
};
exports.Account = (0, mongoose_1.model)('Account', accountSchema);
//# sourceMappingURL=Accounts.js.map