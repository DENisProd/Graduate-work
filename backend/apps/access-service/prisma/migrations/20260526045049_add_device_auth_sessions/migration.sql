-- CreateTable
CREATE TABLE "device_auth_sessions" (
    "id" TEXT NOT NULL,
    "user_code" TEXT NOT NULL,
    "callback_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "auth_code" TEXT,
    "external_user_id" TEXT,
    "display_name" TEXT,
    "authorized_at" TIMESTAMP(3),
    "last_polled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "device_auth_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "device_auth_sessions_user_code_key" ON "device_auth_sessions"("user_code");

-- CreateIndex
CREATE INDEX "device_auth_sessions_external_user_id_idx" ON "device_auth_sessions"("external_user_id");
