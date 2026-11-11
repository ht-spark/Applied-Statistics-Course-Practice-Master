CREATE TABLE "app_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"nickname" varchar(100) NOT NULL,
	"is_admin" boolean DEFAULT false NOT NULL,
	"_created_at" timestamptz (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"_updated_at" timestamptz (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "app_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "exam_papers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"university_id" uuid NOT NULL,
	"year" integer NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text NOT NULL,
	"total_score" integer DEFAULT 150 NOT NULL,
	"duration" integer DEFAULT 180 NOT NULL,
	"is_premium" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"_created_at" timestamptz (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"_updated_at" timestamptz (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "favorites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"_created_at" timestamptz (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"product_name" varchar(200) NOT NULL,
	"amount" numeric NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"paid_at" timestamptz (3),
	"payment_method" varchar(20) DEFAULT 'mock' NOT NULL,
	"_created_at" timestamptz (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"_updated_at" timestamptz (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_qr_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pay_method" varchar(20) NOT NULL,
	"image_url" text NOT NULL,
	"_created_at" timestamptz (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"_updated_at" timestamptz (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "payment_qr_codes_pay_method_unique" UNIQUE("pay_method")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text NOT NULL,
	"product_type" varchar(20) NOT NULL,
	"target_id" varchar(255) NOT NULL,
	"price" numeric DEFAULT '0' NOT NULL,
	"original_price" numeric DEFAULT '0' NOT NULL,
	"duration_days" integer DEFAULT 365 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"_created_at" timestamptz (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"_updated_at" timestamptz (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "question_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question_id" uuid NOT NULL,
	"option_key" varchar(10) NOT NULL,
	"content" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"_created_at" timestamptz (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"paper_id" uuid NOT NULL,
	"question_type" varchar(20) NOT NULL,
	"question_number" integer NOT NULL,
	"content" text NOT NULL,
	"correct_answer" text NOT NULL,
	"analysis" text NOT NULL,
	"score" integer DEFAULT 10 NOT NULL,
	"difficulty" integer DEFAULT 2 NOT NULL,
	"knowledge_point" varchar(200) NOT NULL,
	"_created_at" timestamptz (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"_updated_at" timestamptz (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "study_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"paper_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"user_answer" text NOT NULL,
	"is_correct" boolean,
	"score" numeric,
	"_created_at" timestamptz (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"_updated_at" timestamptz (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "universities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(200) NOT NULL,
	"short_name" varchar(50) NOT NULL,
	"location" varchar(100) NOT NULL,
	"description" text NOT NULL,
	"logo_url" varchar(500) NOT NULL,
	"is_premium" boolean DEFAULT false NOT NULL,
	"price" numeric DEFAULT '0' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"_created_at" timestamptz (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"_updated_at" timestamptz (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_entitlements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"entitlement_type" varchar(20) NOT NULL,
	"target_id" varchar(255) NOT NULL,
	"expires_at" timestamptz (3) NOT NULL,
	"order_id" uuid NOT NULL,
	"_created_at" timestamptz (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wrong_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"wrong_count" integer DEFAULT 1 NOT NULL,
	"last_wrong_answer" text NOT NULL,
	"last_wrong_at" timestamptz (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"mastered" boolean DEFAULT false NOT NULL,
	"_created_at" timestamptz (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE "exam_papers" ADD CONSTRAINT "exam_papers_university_id_fkey" FOREIGN KEY ("university_id") REFERENCES "public"."universities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_options" ADD CONSTRAINT "question_options_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_paper_id_fkey" FOREIGN KEY ("paper_id") REFERENCES "public"."exam_papers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_records" ADD CONSTRAINT "study_records_paper_id_fkey" FOREIGN KEY ("paper_id") REFERENCES "public"."exam_papers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_records" ADD CONSTRAINT "study_records_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_entitlements" ADD CONSTRAINT "user_entitlements_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wrong_questions" ADD CONSTRAINT "wrong_questions_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "app_users_email_key" ON "app_users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_exam_papers_university_id" ON "exam_papers" USING btree ("university_id");--> statement-breakpoint
CREATE UNIQUE INDEX "favorites_user_id_question_id_key" ON "favorites" USING btree ("user_id","question_id");--> statement-breakpoint
CREATE INDEX "idx_orders_user_id" ON "orders" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_qr_codes_pay_method_key" ON "payment_qr_codes" USING btree ("pay_method");--> statement-breakpoint
CREATE INDEX "idx_question_options_question_id" ON "question_options" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "idx_questions_paper_id" ON "questions" USING btree ("paper_id");--> statement-breakpoint
CREATE UNIQUE INDEX "study_records_user_id_question_id_key" ON "study_records" USING btree ("user_id","question_id");--> statement-breakpoint
CREATE INDEX "idx_study_records_user_id" ON "study_records" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_entitlements_user_id" ON "user_entitlements" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "wrong_questions_user_id_question_id_key" ON "wrong_questions" USING btree ("user_id","question_id");