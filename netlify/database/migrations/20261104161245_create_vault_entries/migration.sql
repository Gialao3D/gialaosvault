CREATE TABLE "vault_entries" (
	"id" serial PRIMARY KEY,
	"title" text NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"secret" text DEFAULT '' NOT NULL,
	"link" text DEFAULT '' NOT NULL,
	"pinned" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
