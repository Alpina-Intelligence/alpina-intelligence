ALTER TABLE "books" ADD COLUMN "storage_key" text NOT NULL;--> statement-breakpoint
ALTER TABLE "books" ADD CONSTRAINT "books_storage_key_unique" UNIQUE("storage_key");