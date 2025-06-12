# Models Directory

This directory will contain your Mongoose models for MongoDB collections.

## Example Model Structure

```typescript
import { Schema, model, Document } from 'mongoose';

// Define interface for the document
interface IUser extends Document {
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

// Define schema
const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

// Create and export model
export const User = model<IUser>('User', userSchema);
```

## Best Practices

1. **Interfaces**: Define TypeScript interfaces for your documents
2. **Validation**: Use Mongoose built-in validators
3. **Indexes**: Add database indexes for performance
4. **Middleware**: Use pre/post hooks for business logic
5. **Methods**: Add instance and static methods as needed
6. **Timestamps**: Use `timestamps: true` for automatic date tracking

## File Naming Convention

- Use PascalCase for model names: `User.ts`, `Product.ts`
- Export models as named exports
- Keep one model per file
