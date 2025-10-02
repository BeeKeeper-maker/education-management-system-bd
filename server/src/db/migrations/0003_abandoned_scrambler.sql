CREATE TABLE IF NOT EXISTS "hostels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"type" varchar(20) NOT NULL,
	"total_capacity" integer NOT NULL,
	"occupied_capacity" integer DEFAULT 0 NOT NULL,
	"address" text,
	"warden_id" uuid,
	"warden_name" varchar(100),
	"warden_phone" varchar(20),
	"facilities" text,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "room_allocations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"allocation_date" timestamp NOT NULL,
	"vacate_date" timestamp,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"bed_number" varchar(10),
	"monthly_rent" integer DEFAULT 0,
	"remarks" text,
	"allocated_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "rooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hostel_id" uuid NOT NULL,
	"room_number" varchar(20) NOT NULL,
	"floor" integer NOT NULL,
	"capacity" integer NOT NULL,
	"occupied_capacity" integer DEFAULT 0 NOT NULL,
	"type" varchar(20) NOT NULL,
	"facilities" text,
	"monthly_rent" integer DEFAULT 0,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "book_issues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"book_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"issue_date" date NOT NULL,
	"due_date" date NOT NULL,
	"return_date" date,
	"status" varchar(20) DEFAULT 'issued' NOT NULL,
	"fine_amount" integer DEFAULT 0,
	"remarks" text,
	"issued_by" uuid,
	"returned_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "books" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"author" varchar(255) NOT NULL,
	"isbn" varchar(20),
	"publisher" varchar(255),
	"publication_year" integer,
	"category" varchar(100) NOT NULL,
	"language" varchar(50) DEFAULT 'English',
	"edition" varchar(50),
	"pages" integer,
	"total_quantity" integer NOT NULL,
	"available_quantity" integer NOT NULL,
	"shelf_location" varchar(50),
	"description" text,
	"cover_image" varchar(255),
	"price" integer DEFAULT 0,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "hostels" ADD CONSTRAINT "hostels_warden_id_users_id_fk" FOREIGN KEY ("warden_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "room_allocations" ADD CONSTRAINT "room_allocations_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "room_allocations" ADD CONSTRAINT "room_allocations_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "room_allocations" ADD CONSTRAINT "room_allocations_allocated_by_users_id_fk" FOREIGN KEY ("allocated_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "rooms" ADD CONSTRAINT "rooms_hostel_id_hostels_id_fk" FOREIGN KEY ("hostel_id") REFERENCES "hostels"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "book_issues" ADD CONSTRAINT "book_issues_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "books"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "book_issues" ADD CONSTRAINT "book_issues_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "book_issues" ADD CONSTRAINT "book_issues_issued_by_users_id_fk" FOREIGN KEY ("issued_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "book_issues" ADD CONSTRAINT "book_issues_returned_by_users_id_fk" FOREIGN KEY ("returned_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
