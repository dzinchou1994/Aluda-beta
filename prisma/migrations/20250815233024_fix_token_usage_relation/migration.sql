-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TokenUsage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "actorType" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "periodKey" TEXT NOT NULL,
    "tokens" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_TokenUsage" ("actorId", "actorType", "createdAt", "id", "period", "periodKey", "tokens", "updatedAt") SELECT "actorId", "actorType", "createdAt", "id", "period", "periodKey", "tokens", "updatedAt" FROM "TokenUsage";
DROP TABLE "TokenUsage";
ALTER TABLE "new_TokenUsage" RENAME TO "TokenUsage";
CREATE UNIQUE INDEX "TokenUsage_actorType_actorId_period_periodKey_key" ON "TokenUsage"("actorType", "actorId", "period", "periodKey");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
