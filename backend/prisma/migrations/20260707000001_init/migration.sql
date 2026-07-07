-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "real_name" VARCHAR(50) NOT NULL,
    "email" VARCHAR(100),
    "phone" VARCHAR(20),
    "avatar" VARCHAR(255),
    "department" VARCHAR(50),
    "role_id" TEXT NOT NULL,
    "status" INTEGER NOT NULL DEFAULT 1,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "description" VARCHAR(200),
    "permissions" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "type" VARCHAR(20) NOT NULL DEFAULT '企业',
    "city" VARCHAR(50),
    "district" VARCHAR(50),
    "address" VARCHAR(255),
    "industry" VARCHAR(50),
    "grade" VARCHAR(10) NOT NULL DEFAULT 'B',
    "health_status" VARCHAR(20) NOT NULL DEFAULT '健康',
    "credit_level" VARCHAR(10),
    "source" VARCHAR(50),
    "annual_revenue" VARCHAR(50),
    "employee_count" VARCHAR(20),
    "owner_id" TEXT NOT NULL,
    "contact_phone" VARCHAR(20),
    "contact_email" VARCHAR(100),
    "remark" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "persons" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "position" VARCHAR(50),
    "role" VARCHAR(20),
    "phone" VARCHAR(20),
    "email" VARCHAR(100),
    "influence" INTEGER DEFAULT 50,
    "relation_strength" INTEGER DEFAULT 50,
    "attitude" VARCHAR(10),
    "remark" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "persons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "power_maps" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "role_type" VARCHAR(20) NOT NULL,
    "person_id" TEXT,
    "influence" INTEGER NOT NULL DEFAULT 50,
    "attitude" VARCHAR(10) NOT NULL DEFAULT '中立',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "power_maps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "project_no" VARCHAR(20) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "customer_id" TEXT NOT NULL,
    "pm_id" TEXT NOT NULL,
    "stage" VARCHAR(20) NOT NULL DEFAULT '需求',
    "status" VARCHAR(20) NOT NULL DEFAULT '正常',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "plan_start" TIMESTAMP(3) NOT NULL,
    "plan_end" TIMESTAMP(3) NOT NULL,
    "actual_start" TIMESTAMP(3),
    "actual_end" TIMESTAMP(3),
    "description" TEXT,
    "budget" VARCHAR(50),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_nodes" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "node_name" VARCHAR(50) NOT NULL,
    "sequence" INTEGER NOT NULL DEFAULT 0,
    "plan_date" TIMESTAMP(3) NOT NULL,
    "actual_date" TIMESTAMP(3),
    "status" VARCHAR(20) NOT NULL DEFAULT '未开始',
    "owner_id" TEXT,
    "acceptance_criteria" TEXT,
    "remark" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meetings" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "location" VARCHAR(100),
    "attendees" JSONB,
    "minutes" TEXT,
    "todos" JSONB,
    "attachments" JSONB,
    "reminder" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meetings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "priority" VARCHAR(5) NOT NULL DEFAULT 'P2',
    "tags" JSONB,
    "assignee_id" TEXT,
    "column" VARCHAR(20) NOT NULL DEFAULT '待跟进',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "due_date" TIMESTAMP(3),
    "progress" INTEGER NOT NULL DEFAULT 0,
    "status" VARCHAR(20) NOT NULL DEFAULT '正常',
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ops_records" (
    "id" TEXT NOT NULL,
    "ticket_no" VARCHAR(20) NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "priority" VARCHAR(10) NOT NULL DEFAULT '中',
    "status" VARCHAR(20) NOT NULL DEFAULT '待处理',
    "project_id" TEXT,
    "customer_id" TEXT,
    "handler_id" TEXT NOT NULL,
    "description" TEXT,
    "solution" TEXT,
    "sla_deadline" TIMESTAMP(3),
    "closed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ops_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspection_plans" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "frequency" VARCHAR(20) NOT NULL,
    "cycle" INTEGER NOT NULL DEFAULT 1,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "executor_id" TEXT NOT NULL,
    "items" JSONB NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT '启用',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inspection_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assets" (
    "id" TEXT NOT NULL,
    "asset_no" VARCHAR(20) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "model" VARCHAR(100),
    "vendor" VARCHAR(50),
    "location" VARCHAR(100),
    "status" VARCHAR(20) NOT NULL DEFAULT '正常',
    "purchase_date" TIMESTAMP(3),
    "warranty_date" TIMESTAMP(3),
    "price" VARCHAR(20),
    "remark" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ops_rules" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "condition" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ops_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opportunities" (
    "id" TEXT NOT NULL,
    "opp_no" VARCHAR(20) NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "customer_id" TEXT NOT NULL,
    "amount" VARCHAR(20),
    "stage" VARCHAR(20) NOT NULL DEFAULT '线索',
    "probability" INTEGER NOT NULL DEFAULT 10,
    "expected_close_date" TIMESTAMP(3),
    "source" VARCHAR(50),
    "owner_id" TEXT NOT NULL,
    "description" TEXT,
    "competitors" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT '跟进中',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opportunities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "follow_ups" (
    "id" TEXT NOT NULL,
    "opportunity_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "content" TEXT NOT NULL,
    "next_plan" TEXT,
    "next_date" TIMESTAMP(3),
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "follow_ups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visit_plans" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "purpose" VARCHAR(100) NOT NULL,
    "visit_date" TIMESTAMP(3) NOT NULL,
    "visit_time" VARCHAR(20),
    "attendees" JSONB,
    "location" VARCHAR(200),
    "status" VARCHAR(20) NOT NULL DEFAULT '计划',
    "result" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "visit_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_materials" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "tags" JSONB,
    "content" TEXT,
    "file_url" VARCHAR(255),
    "file_size" INTEGER,
    "download_count" INTEGER NOT NULL DEFAULT 0,
    "like_count" INTEGER NOT NULL DEFAULT 0,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "knowledge_materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_plans" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "target" VARCHAR(200),
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "instructor" VARCHAR(50),
    "location" VARCHAR(100),
    "status" VARCHAR(20) NOT NULL DEFAULT '计划中',
    "material_ids" JSONB,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "training_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_quality_logs" (
    "id" TEXT NOT NULL,
    "entity_type" VARCHAR(20) NOT NULL,
    "entity_id" TEXT NOT NULL,
    "check_type" VARCHAR(50) NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 100,
    "issues" JSONB,
    "checked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "data_quality_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "change_detections" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "change_type" VARCHAR(50) NOT NULL,
    "old_value" TEXT,
    "new_value" TEXT,
    "source" VARCHAR(50),
    "status" VARCHAR(20) NOT NULL DEFAULT '未处理',
    "handled_by" TEXT,
    "handled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "change_detections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_configs" (
    "id" TEXT NOT NULL,
    "key" VARCHAR(50) NOT NULL,
    "value" TEXT NOT NULL,
    "desc" VARCHAR(200),

    CONSTRAINT "system_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operation_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "module" VARCHAR(50) NOT NULL,
    "resource" VARCHAR(100) NOT NULL,
    "detail" TEXT,
    "ip" VARCHAR(50),
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "operation_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "content" TEXT NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "roles_code_key" ON "roles"("code");

-- CreateIndex
CREATE UNIQUE INDEX "projects_project_no_key" ON "projects"("project_no");

-- CreateIndex
CREATE UNIQUE INDEX "ops_records_ticket_no_key" ON "ops_records"("ticket_no");

-- CreateIndex
CREATE UNIQUE INDEX "assets_asset_no_key" ON "assets"("asset_no");

-- CreateIndex
CREATE UNIQUE INDEX "opportunities_opp_no_key" ON "opportunities"("opp_no");

-- CreateIndex
CREATE UNIQUE INDEX "system_configs_key_key" ON "system_configs"("key");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "persons" ADD CONSTRAINT "persons_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "power_maps" ADD CONSTRAINT "power_maps_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_pm_id_fkey" FOREIGN KEY ("pm_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_nodes" ADD CONSTRAINT "project_nodes_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ops_records" ADD CONSTRAINT "ops_records_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ops_records" ADD CONSTRAINT "ops_records_handler_id_fkey" FOREIGN KEY ("handler_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_plans" ADD CONSTRAINT "inspection_plans_executor_id_fkey" FOREIGN KEY ("executor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visit_plans" ADD CONSTRAINT "visit_plans_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "change_detections" ADD CONSTRAINT "change_detections_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

