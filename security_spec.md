# Security Specification & Payload-First TDD — HisaabKitab

## 1. Data Invariants
1. **Strict Ownership**: Every document in `/users/{userId}`, `/users/{userId}/months/{monthId}`, `/users/{userId}/expenses/{expenseId}`, and `/users/{userId}/groceries/{groceryId}` belongs strictly to `userId == request.auth.uid`. Cross-user reads or writes are impossible.
2. **Email Verification Required**: All mutations and list queries require `request.auth.token.email_verified == true`.
3. **Master Gate Parent Existence**: Monthly budgets, expenses, and groceries require the parent `/users/{userId}` profile document to exist on creation.
4. **No Shadow Fields**: Every collection validates both `hasAll` and `hasOnly` on write, plus `affectedKeys().hasOnly(...)` on every update.
5. **Temporal Integrity**: `createdAt` and `updatedAt` must match `request.time` on creation; `createdAt` and `userId` are immutable after creation; `updatedAt` must equal `request.time` on update.
6. **Monetary & Volumetric Bounds**: Salaries and amounts are strictly bounded numbers (`0 <= salary <= 100,000,000`, `0 < amount <= 100,000,000`), all string fields have explicit `.size()` bounds, and all IDs match `^[a-zA-Z0-9_\-]+$` with length `<= 128`.

## 2. The "Dirty Dozen" Attack Payloads (Must Return PERMISSION_DENIED)
1. **Unauthenticated Read/Write**: `request.auth == null` reading `/users/u1/expenses/e1` -> DENIED.
2. **Unverified Email Mutation**: `email_verified: false` creating `/users/u1/expenses/e1` -> DENIED.
3. **Cross-Tenant Spoofing (Path vs Payload)**: User `u2` writing to `/users/u1/expenses/e1` with `userId: "u2"` -> DENIED.
4. **Owner Impersonation in Payload**: User `u1` creating expense with `userId: "u2"` -> DENIED.
5. **Shadow / Ghost Field Injection**: User `u1` creating expense with extra `isAdmin: true` field -> DENIED by `hasOnly`.
6. **Partial Update Shadow Key**: User `u1` updating expense `createdAt` or `userId` -> DENIED by `affectedKeys().hasOnly(...)` and immutability checks.
7. **ID Poisoning**: Document ID exceeding 128 chars or containing invalid characters (`../admin`) -> DENIED by `isValidId()`.
8. **Negative Expense Amount**: Creating expense with `amount: -500` -> DENIED (`amount > 0`).
9. **Oversized String Exhaustion**: Creating expense with 500-char `title` -> DENIED (`title.size() <= 100`).
10. **Invalid Category Enum**: Creating expense with `category: "crypto"` -> DENIED.
11. **Date/Month Mismatch**: Creating expense with `monthKey: "2026-11"` and `date: "2026-10-15"` -> DENIED (`date[0:7] == monthKey`).
12. **Client-Forged Timestamp**: Creating grocery item with backdated `createdAt` not equal to `request.time` -> DENIED.
