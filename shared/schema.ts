import { pgTable, text, serial, integer, boolean, timestamp, decimal, json, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users/Producers table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  password: text("password").notNull(),
  bio: text("bio"),
  website: text("website"),
  emailVerified: boolean("email_verified").default(false),
  verificationToken: text("verification_token"),
  
  // KYC fields
  cpf: text("cpf"),
  cnpj: text("cnpj"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  country: text("country").default("Brasil"),
  dateOfBirth: text("date_of_birth"),
  kycStatus: text("kyc_status").default("pending"), // 'pending', 'approved', 'rejected'
  kycSubmittedAt: timestamp("kyc_submitted_at"),
  kycApprovedAt: timestamp("kyc_approved_at"),
  kycRejectionReason: text("kyc_rejection_reason"),
  
  // Admin and permissions
  role: text("role").default("user"), // 'user', 'admin', 'super_admin'
  isActive: boolean("is_active").default(true),
  
  // HyperSwitch integration
  hyperswitchCustomerId: text("hyperswitch_customer_id"),
  hyperswitchMerchantId: text("hyperswitch_merchant_id"),
  hyperswitchProfileId: text("hyperswitch_profile_id"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Courses/Products table
export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  thumbnailUrl: text("thumbnail_url"),
  salesPageContent: text("sales_page_content"),
  category: text("category"),
  refundPeriod: integer("refund_period").default(7), // days
  slug: text("slug").notNull().unique(),
  isActive: boolean("is_active").default(true),
  allowsAffiliates: boolean("allows_affiliates").default(false),
  defaultAffiliateCommission: decimal("default_affiliate_commission", { precision: 5, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Course content/lessons table
export const lessons = pgTable("lessons", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").references(() => courses.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  videoUrl: text("video_url"),
  duration: integer("duration"), // in seconds
  order: integer("order").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Sales/Orders table
export const sales = pgTable("sales", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").references(() => courses.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  customerEmail: text("customer_email").notNull(),
  customerName: text("customer_name").notNull(),
  customerAddress: text("customer_address"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  couponId: integer("coupon_id").references(() => coupons.id), // Cupom usado na venda
  couponCode: text("coupon_code"), // Código do cupom usado
  couponDiscount: decimal("coupon_discount", { precision: 10, scale: 2 }).default("0"), // Desconto aplicado
  affiliateId: integer("affiliate_id").references(() => users.id), // ID do afiliado que fez a venda
  affiliateLinkId: text("affiliate_link_id").references(() => affiliateLinks.linkId), // Link específico usado
  affiliateCommission: decimal("affiliate_commission", { precision: 10, scale: 2 }).default("0"), // Comissão do afiliado
  status: text("status").notNull().default("pending"), // pending, completed, failed
  paymentId: text("payment_id"),
  paymentMethod: text("payment_method"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Analytics table for dashboard metrics
export const analytics = pgTable("analytics", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  date: timestamp("date").notNull(),
  totalSales: decimal("total_sales", { precision: 10, scale: 2 }).default("0"),
  salesCount: integer("sales_count").default(0),
  conversionRate: decimal("conversion_rate", { precision: 5, scale: 2 }).default("0"),
  pageViews: integer("page_views").default(0),
});

// Payment configurations
export const paymentConfigs = pgTable("payment_configs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  hyperswitchApiKey: text("hyperswitch_api_key"),
  pixKey: text("pix_key"),
  bankName: text("bank_name"),
  agency: text("agency"),
  account: text("account"),
  accountType: text("account_type"),
  isActive: boolean("is_active").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User categories
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Sales links table
export const salesLinks = pgTable("sales_links", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  courseId: integer("course_id").references(() => courses.id).notNull(),
  customTitle: text("custom_title").notNull(),
  customPrice: decimal("custom_price", { precision: 10, scale: 2 }).notNull(),
  linkId: text("link_id").notNull().unique(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const courseCoProducers = pgTable("course_co_producers", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").references(() => courses.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  percentage: decimal("percentage", { precision: 5, scale: 2 }).notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const courseAffiliates = pgTable("course_affiliates", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").references(() => courses.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  commission: decimal("commission", { precision: 5, scale: 2 }).notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Public affiliate applications
export const affiliateApplications = pgTable("affiliate_applications", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").references(() => courses.id).notNull(),
  applicantUserId: integer("applicant_user_id").references(() => users.id).notNull(),
  status: text("status").default("pending"), // pending, approved, rejected
  appliedAt: timestamp("applied_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: integer("reviewed_by").references(() => users.id),
});

export const pendingInvitations = pgTable("pending_invitations", {
  id: serial("id").primaryKey(),
  senderUserId: integer("sender_user_id").references(() => users.id).notNull(),
  recipientEmail: text("recipient_email").notNull(),
  courseId: integer("course_id").references(() => courses.id),
  type: text("type").notNull(), // 'coproducer' or 'affiliate'
  percentage: decimal("percentage", { precision: 5, scale: 2 }),
  commission: decimal("commission", { precision: 5, scale: 2 }),
  invitationToken: text("invitation_token").unique().notNull(),
  status: text("status").default("pending"), // 'pending', 'accepted', 'rejected', 'expired'
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Ofertas/Promoções para produtos
export const offers = pgTable("offers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  courseId: integer("course_id").references(() => courses.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  originalPrice: decimal("original_price", { precision: 10, scale: 2 }).notNull(),
  salePrice: decimal("sale_price", { precision: 10, scale: 2 }).notNull(),
  linkId: text("link_id").notNull().unique(),
  validFrom: timestamp("valid_from").defaultNow(),
  validUntil: timestamp("valid_until"),
  maxUses: integer("max_uses"),
  currentUses: integer("current_uses").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Sistema de cupons de desconto
export const coupons = pgTable("coupons", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  courseId: integer("course_id").references(() => courses.id).notNull(),
  code: text("code").notNull().unique(),
  title: text("title").notNull(),
  type: text("type").notNull(), // 'percentage' or 'fixed'
  value: decimal("value", { precision: 10, scale: 2 }).notNull(),
  minOrderValue: decimal("min_order_value", { precision: 10, scale: 2 }),
  maxDiscount: decimal("max_discount", { precision: 10, scale: 2 }),
  validFrom: timestamp("valid_from").defaultNow(),
  validUntil: timestamp("valid_until"),
  usageLimit: integer("usage_limit"),
  usedCount: integer("used_count").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Order Bumps - ofertas complementares no checkout
export const orderBumps = pgTable("order_bumps", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  courseId: integer("course_id").references(() => courses.id).notNull(),
  orderBumpProductId: integer("order_bump_product_id").references(() => courses.id),
  title: text("title").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  image: text("image"),
  order: integer("order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// UpSells - produtos para venda adicional pós-compra
export const upSells = pgTable("upsells", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  mainCourseId: integer("main_course_id").references(() => courses.id).notNull(),
  upsellCourseId: integer("upsell_course_id").references(() => courses.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  discountPercentage: decimal("discount_percentage", { precision: 5, scale: 2 }),
  order: integer("order").default(0),
  showAfterPurchase: boolean("show_after_purchase").default(true),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Documentos KYC para verificação
export const kycDocuments = pgTable("kyc_documents", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  documentType: text("document_type").notNull(), // 'cpf_document', 'rg_document', 'proof_of_address'
  documentNumber: text("document_number"),
  documentFile: text("document_file").notNull(), // Base64 encoded file
  filePath: text("file_path"),
  fileName: text("file_name"),
  fileSize: integer("file_size"),
  mimeType: text("mime_type"), // 'image/jpeg', 'image/png', 'application/pdf'
  status: text("status").default("pending"), // 'pending', 'approved', 'rejected'
  rejectionReason: text("rejection_reason"),
  verifiedAt: timestamp("verified_at"),
  verifiedBy: integer("verified_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Sistema de WebHooks
export const webhooks = pgTable("webhooks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  event: text("event").notNull(), // 'payment_confirmed', 'payment_pending', 'product_updated'
  url: text("url").notNull(),
  secret: text("secret"),
  isActive: boolean("is_active").default(true),
  lastTriggered: timestamp("last_triggered"),
  totalCalls: integer("total_calls").default(0),
  failedCalls: integer("failed_calls").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Log de chamadas de webhooks
export const webhookLogs = pgTable("webhook_logs", {
  id: serial("id").primaryKey(),
  webhookId: integer("webhook_id").references(() => webhooks.id).notNull(),
  event: text("event").notNull(),
  payload: text("payload"),
  responseStatus: integer("response_status"),
  responseBody: text("response_body"),
  attemptNumber: integer("attempt_number").default(1),
  succeededAt: timestamp("succeeded_at"),
  failedAt: timestamp("failed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Sistema de Notificações
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  type: text("type").notNull(), // 'kyc_approved', 'kyc_rejected', 'sale_made', 'affiliate_application', etc.
  title: text("title").notNull(),
  message: text("message").notNull(),
  courseId: integer("course_id").references(() => courses.id),
  courseName: text("course_name"),
  applicantName: text("applicant_name"),
  applicationId: integer("application_id").references(() => affiliateApplications.id),
  saleAmount: decimal("sale_amount", { precision: 10, scale: 2 }),
  customerName: text("customer_name"),
  isRead: boolean("is_read").default(false),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Sistema de Links de Afiliados
export const affiliateLinks = pgTable("affiliate_links", {
  id: serial("id").primaryKey(),
  affiliateId: integer("affiliate_id").notNull().references(() => courseAffiliates.id),
  courseId: integer("course_id").notNull().references(() => courses.id),
  linkId: varchar("link_id", { length: 20 }).notNull().unique(),
  clicks: integer("clicks").default(0),
  sales: integer("sales").default(0),
  earnings: decimal("earnings", { precision: 12, scale: 2 }).default("0.00"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const affiliateLinkClicks = pgTable("affiliate_link_clicks", {
  id: serial("id").primaryKey(),
  linkId: varchar("link_id", { length: 20 }).notNull().references(() => affiliateLinks.linkId),
  affiliateId: integer("affiliate_id").notNull().references(() => users.id),
  courseId: integer("course_id").notNull().references(() => courses.id),
  sessionId: text("session_id").notNull(),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  clickedAt: timestamp("clicked_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Zod schemas
export const insertUserSchema = createInsertSchema(users).pick({
  fullName: true,
  email: true,
  phone: true,
  password: true,
  verificationToken: true,
});

export const kycSchema = createInsertSchema(users).pick({
  cpf: true,
  cnpj: true,
  address: true,
  city: true,
  state: true,
  zipCode: true,
  country: true,
  dateOfBirth: true,
}).extend({
  cpf: z.string().min(11, "CPF deve ter 11 dígitos"),
  address: z.string().min(10, "Endereço completo é obrigatório"),
  city: z.string().min(2, "Cidade é obrigatória"),
  state: z.string().min(2, "Estado é obrigatório"),
  zipCode: z.string().min(8, "CEP deve ter 8 dígitos"),
  dateOfBirth: z.string().min(10, "Data de nascimento é obrigatória"),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const insertCourseSchema = createInsertSchema(courses).pick({
  title: true,
  description: true,
  price: true,
  thumbnailUrl: true,
  salesPageContent: true,
  category: true,
  refundPeriod: true,
  allowsAffiliates: true,
  defaultAffiliateCommission: true,
}).extend({
  price: z.number().positive("Preço deve ser maior que 0"),
  refundPeriod: z.number().positive("Período de reembolso deve ser maior que 0"),
  salesPageContent: z.string().url("Deve ser uma URL válida").optional().or(z.literal("")),
  defaultAffiliateCommission: z.number().min(0).max(100, "Comissão deve estar entre 0 e 100%").optional(),
});

export const insertCategorySchema = createInsertSchema(categories).pick({
  name: true,
});

export const insertSalesLinkSchema = createInsertSchema(salesLinks).pick({
  courseId: true,
  customTitle: true,
  customPrice: true,
});

export const insertLessonSchema = createInsertSchema(lessons).pick({
  title: true,
  description: true,
  videoUrl: true,
  duration: true,
  order: true,
});

export const insertSaleSchema = createInsertSchema(sales).pick({
  customerEmail: true,
  customerName: true,
  customerAddress: true,
  amount: true,
  couponId: true,
  couponCode: true,
  couponDiscount: true,
  affiliateId: true,
  affiliateLinkId: true,
  affiliateCommission: true,
  paymentId: true,
  paymentMethod: true,
  status: true,
});

export const insertOfferSchema = createInsertSchema(offers).pick({
  courseId: true,
  title: true,
  description: true,
  originalPrice: true,
  salePrice: true,
  validUntil: true,
  maxUses: true,
});

export const insertCouponSchema = createInsertSchema(coupons).pick({
  courseId: true,
  code: true,
  title: true,
  type: true,
  value: true,
  minOrderValue: true,
  maxDiscount: true,
  validUntil: true,
  usageLimit: true,
}).extend({
  value: z.union([z.string(), z.number()]).transform(val => String(val)),
  minOrderValue: z.union([z.string(), z.number(), z.null(), z.undefined()]).transform(val => val ? String(val) : null).optional(),
  maxDiscount: z.union([z.string(), z.number(), z.null(), z.undefined()]).transform(val => val ? String(val) : null).optional(),
});



export const insertOrderBumpSchema = createInsertSchema(orderBumps).pick({
  courseId: true,
  orderBumpProductId: true,
  title: true,
  description: true,
  price: true,
  image: true,
  order: true,
}).extend({
  price: z.union([z.string(), z.number()]).transform(val => String(val)),
});

export const insertUpSellSchema = createInsertSchema(upSells).pick({
  mainCourseId: true,
  upsellCourseId: true,
  title: true,
  description: true,
  discountPercentage: true,
  order: true,
});

export const insertKycDocumentSchema = createInsertSchema(kycDocuments).pick({
  documentType: true,
  documentNumber: true,
  documentFile: true,
  filePath: true,
  fileName: true,
  fileSize: true,
  mimeType: true,
}).extend({
  documentFile: z.string().min(1, "Arquivo é obrigatório"),
  documentType: z.enum(["cpf_document", "rg_document", "proof_of_address"]),
  mimeType: z.enum(["image/jpeg", "image/png", "application/pdf"]).optional(),
});

export const insertWebhookSchema = createInsertSchema(webhooks).pick({
  event: true,
  url: true,
  secret: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginRequest = z.infer<typeof loginSchema>;

export type Course = typeof courses.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;

export type Lesson = typeof lessons.$inferSelect;
export type InsertLesson = z.infer<typeof insertLessonSchema>;

export type Sale = typeof sales.$inferSelect;
export type InsertSale = z.infer<typeof insertSaleSchema>;

export type Analytics = typeof analytics.$inferSelect;
export type PaymentConfig = typeof paymentConfigs.$inferSelect;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type SalesLink = typeof salesLinks.$inferSelect;
export type InsertSalesLink = z.infer<typeof insertSalesLinkSchema>;

export type CourseCoProducer = typeof courseCoProducers.$inferSelect;
export type CourseAffiliate = typeof courseAffiliates.$inferSelect;
export type PendingInvitation = typeof pendingInvitations.$inferSelect;

export type Offer = typeof offers.$inferSelect;
export type InsertOffer = z.infer<typeof insertOfferSchema>;

export type Coupon = typeof coupons.$inferSelect;
export type InsertCoupon = z.infer<typeof insertCouponSchema>;

export type OrderBump = typeof orderBumps.$inferSelect;
export type InsertOrderBump = z.infer<typeof insertOrderBumpSchema>;

export type UpSell = typeof upSells.$inferSelect;
export type InsertUpSell = z.infer<typeof insertUpSellSchema>;

export type KycDocument = typeof kycDocuments.$inferSelect;
export type InsertKycDocument = z.infer<typeof insertKycDocumentSchema>;

export type Webhook = typeof webhooks.$inferSelect;
export type InsertWebhook = z.infer<typeof insertWebhookSchema>;

export type WebhookLog = typeof webhookLogs.$inferSelect;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

export type AffiliateLink = typeof affiliateLinks.$inferSelect;
export type InsertAffiliateLink = typeof affiliateLinks.$inferInsert;

export type AffiliateLinkClick = typeof affiliateLinkClicks.$inferSelect;
export type InsertAffiliateLinkClick = typeof affiliateLinkClicks.$inferInsert;
