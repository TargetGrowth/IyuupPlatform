import {
  users,
  courses,
  lessons,
  sales,
  analytics,
  paymentConfigs,
  categories,
  courseCoProducers,
  courseAffiliates,
  pendingInvitations,
  affiliateApplications,
  offers,
  coupons,
  orderBumps,
  upSells,
  salesLinks,
  kycDocuments,
  webhooks,
  webhookLogs,
  notifications,
  affiliateLinks,
  affiliateLinkClicks,
  type User,
  type InsertUser,
  type Course,
  type InsertCourse,
  type Lesson,
  type InsertLesson,
  type Sale,
  type InsertSale,
  type Analytics,
  type PaymentConfig,
  type Category,
  type InsertCategory,
  type SalesLink,
  type InsertSalesLink,
  type PendingInvitation,
  type Offer,
  type InsertOffer,
  type Coupon,
  type InsertCoupon,
  type OrderBump,
  type InsertOrderBump,
  type UpSell,
  type InsertUpSell,
  type KycDocument,
  type InsertKycDocument,
  type Webhook,
  type InsertWebhook,
  type WebhookLog,
  type Notification,
  type InsertNotification,
  type AffiliateLink,
  type InsertAffiliateLink,
  type AffiliateLinkClick,
  type InsertAffiliateLinkClick,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sum, count, and, gte, sql, getTableColumns, or, ne, isNull, isNotNull } from "drizzle-orm";
import bcrypt from "bcrypt";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUserById(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User>;
  verifyEmail(token: string): Promise<boolean>;
  updateVerificationToken(userId: number, token: string): Promise<void>;

  // Course operations
  getUserCourses(userId: number): Promise<Course[]>;
  createCourse(userId: number, course: InsertCourse): Promise<Course>;
  getCourseById(id: number): Promise<Course | undefined>;
  getCourseBySlug(slug: string): Promise<Course | undefined>;
  updateCourse(id: number, course: Partial<Course>): Promise<Course>;
  deleteCourse(id: number): Promise<void>;

  // Lesson operations
  getCourseLessons(courseId: number): Promise<Lesson[]>;
  createLesson(lesson: InsertLesson & { courseId: number }): Promise<Lesson>;
  updateLesson(id: number, lesson: Partial<Lesson>): Promise<Lesson>;
  deleteLesson(id: number): Promise<void>;

  // Sales operations
  getUserSales(userId: number): Promise<Sale[]>;
  createSale(sale: InsertSale & { courseId: number; userId: number }): Promise<Sale>;
  updateSaleStatus(paymentId: string, status: string): Promise<void>;

  // Analytics operations
  getDashboardAnalytics(userId: number): Promise<{
    balance: number;
    todaySales: number;
    monthSales: number;
    conversionRate: number;
    totalRevenue: number;
    totalSales: number;
    uniqueCustomers: number;
  }>;
  getTopProducts(userId: number): Promise<Array<{
    id: number;
    title: string;
    sales: number;
    revenue: number;
    growth: string;
    image: string;
  }>>;
  getRecentActivities(userId: number): Promise<Array<{
    id: number;
    type: string;
    description: string;
    time: string;
    amount?: string;
    rating?: number;
  }>>;
  updateAnalytics(userId: number, amount: number): Promise<void>;

  // Payment configuration
  getPaymentConfig(userId: number): Promise<PaymentConfig | undefined>;
  updatePaymentConfig(userId: number, config: Partial<PaymentConfig>): Promise<PaymentConfig>;

  // Categories
  getUserCategories(userId: number): Promise<Category[]>;
  createCategory(userId: number, category: InsertCategory): Promise<Category>;
  deleteCategory(id: number): Promise<void>;

  // Sales Links
  getUserSalesLinks(userId: number): Promise<Array<SalesLink & { courseName: string; originalPrice: string }>>;
  createSalesLink(userId: number, salesLink: InsertSalesLink): Promise<SalesLink>;
  getSalesLinkByLinkId(linkId: string): Promise<SalesLink & { course: Course } | undefined>;
  deleteSalesLink(id: number): Promise<void>;

  // Customers
  getUserCustomers(userId: number): Promise<Array<{
    id: string;
    name: string;
    email: string;
    phone: string;
    totalPurchases: number;
    totalSpent: number;
    lastPurchase: string;
    joinDate: string;
    purchasedProducts: string[];
  }>>;

  // Partnership management
  getCourseCoProducers(courseId: number): Promise<Array<any>>;
  addCourseCoProducer(courseId: number, userId: number, percentage: number): Promise<any>;
  removeCourseCoProducer(coproducerId: number): Promise<void>;
  getCourseAffiliates(courseId: number): Promise<Array<any>>;
  addCourseAffiliate(courseId: number, userId: number, commission: number): Promise<any>;
  removeCourseAffiliate(affiliateId: number): Promise<void>;

  // Pending invitations management
  createPendingInvitation(data: {
    senderUserId: number;
    recipientEmail: string;
    courseId?: number;
    type: string;
    percentage?: number;
    commission?: number;
    invitationToken: string;
    expiresAt: Date;
  }): Promise<PendingInvitation>;
  getPendingInvitations(senderUserId: number, courseId?: number): Promise<Array<PendingInvitation>>;
  updateInvitationStatus(invitationToken: string, status: string): Promise<void>;
  deletePendingInvitation(invitationId: number): Promise<void>;
  getInvitationByToken(invitationToken: string): Promise<PendingInvitation | undefined>;

  // Offers management
  getUserOffers(userId: number): Promise<Array<Offer & { courseName: string }>>;
  createOffer(userId: number, offer: InsertOffer): Promise<Offer>;
  updateOffer(id: number, offer: Partial<Offer>): Promise<Offer>;
  deleteOffer(id: number): Promise<void>;
  getOfferByLinkId(linkId: string): Promise<Offer & { course: Course } | undefined>;

  // Coupons management
  getUserCoupons(userId: number): Promise<Array<Coupon>>;
  createCoupon(userId: number, coupon: InsertCoupon): Promise<Coupon>;
  updateCoupon(id: number, coupon: Partial<Coupon>): Promise<Coupon>;
  deleteCoupon(id: number): Promise<void>;
  getCouponByCode(code: string): Promise<Coupon | undefined>;
  validateCoupon(code: string, orderValue: number, courseId?: number): Promise<{ valid: boolean; discount: number; message?: string }>;

  // Order Bumps management
  getCourseOrderBumps(courseId: number): Promise<Array<OrderBump>>;
  createOrderBump(userId: number, orderBump: InsertOrderBump): Promise<OrderBump>;
  updateOrderBump(id: number, orderBump: Partial<OrderBump>): Promise<OrderBump>;
  deleteOrderBump(id: number): Promise<void>;

  // UpSells management
  getCourseUpSells(courseId: number): Promise<Array<UpSell & { upsellCourse: Course }>>;
  createUpSell(userId: number, upSell: InsertUpSell): Promise<UpSell>;
  updateUpSell(id: number, upSell: Partial<UpSell>): Promise<UpSell>;
  deleteUpSell(id: number): Promise<void>;

  // KYC Documents
  getUserKycDocuments(userId: number): Promise<Array<KycDocument>>;
  createKycDocument(userId: number, document: InsertKycDocument): Promise<KycDocument>;
  updateKycDocumentStatus(id: number, status: string, rejectionReason?: string): Promise<void>;

  // Webhooks
  getUserWebhooks(userId: number): Promise<Array<Webhook>>;
  createWebhook(userId: number, webhook: InsertWebhook): Promise<Webhook>;
  updateWebhook(id: number, webhook: Partial<Webhook>): Promise<Webhook>;
  deleteWebhook(id: number): Promise<void>;
  triggerWebhook(webhookId: number, payload: any): Promise<void>;

  // Notifications
  getUserNotifications(userId: number): Promise<Array<Notification>>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(notificationId: number): Promise<void>;
  createAffiliateApplicationNotification(applicantUserId: number, courseId: number, applicationId: number): Promise<void>;

  // Affiliate link generation
  generateAffiliateLink(affiliateId: number, courseId: number): Promise<{ linkId: string; fullUrl: string }>;
  getAffiliateLinks(affiliateId: number): Promise<Array<{ linkId: string; courseName: string; commission: string; clicks: number; sales: number; earnings: string }>>;
  trackAffiliateLinkClick(linkId: string): Promise<void>;
  getProductByAffiliateLink(linkId: string): Promise<Course & { affiliate: { userId: number; commission: string } } | undefined>;

  // KYC Management
  submitKyc(userId: number, kycData: any, documents: { [key: string]: string }): Promise<void>;
  getUserKycDocuments(userId: number): Promise<Array<any>>;
  getAllKycDocuments(): Promise<Array<any>>;
  getPendingKycUsers(): Promise<Array<User>>;
  getKycDocumentById(documentId: number): Promise<KycDocument | undefined>;
  approveKyc(userId: number, adminId: number): Promise<void>;
  rejectKyc(userId: number, adminId: number, reason: string): Promise<void>;

  // Admin Management
  getAllUsers(): Promise<Array<User>>;
  createAdminUser(userData: any): Promise<User>;
  updateUser(userId: number, updates: Partial<User>): Promise<User>;
  updateUserHyperswitchId(userId: number, hyperswitchCustomerId: string): Promise<void>;
  checkAdminPermissions(userId: number): Promise<boolean>;
  markAllNotificationsAsRead(userId: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return user;
  }



  async verifyEmail(token: string): Promise<boolean> {
    try {
      const [user] = await db
        .update(users)
        .set({ 
          emailVerified: true, 
          verificationToken: null,
          updatedAt: new Date() 
        })
        .where(eq(users.verificationToken, token))
        .returning();
      
      return !!user;
    } catch (error) {
      console.error("Error verifying email:", error);
      return false;
    }
  }

  async updateUserHyperswitchId(userId: number, hyperswitchCustomerId: string): Promise<void> {
    await db
      .update(users)
      .set({ hyperswitchCustomerId, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  async updateVerificationToken(userId: number, token: string): Promise<void> {
    await db
      .update(users)
      .set({ 
        verificationToken: token,
        updatedAt: new Date() 
      })
      .where(eq(users.id, userId));
  }

  // Course operations
  async getUserCourses(userId: number): Promise<Course[]> {
    const coursesData = await db
      .select()
      .from(courses)
      .where(eq(courses.userId, userId))
      .orderBy(desc(courses.createdAt));

    // Get category names for each course
    const coursesWithCategories = await Promise.all(
      coursesData.map(async (course) => {
        if (course.category && /^\d+$/.test(course.category)) {
          const categoryId = parseInt(course.category);
          const [category] = await db
            .select({ name: categories.name })
            .from(categories)
            .where(eq(categories.id, categoryId));
          
          return {
            ...course,
            category: (category?.name || course.category) as string,
          };
        }
        return course;
      })
    );
    
    return coursesWithCategories;
  }

  async createCourse(userId: number, courseData: InsertCourse): Promise<Course> {
    // Generate short, friendly slug
    const slug = Math.random().toString(36).substr(2, 9);
    
    const [course] = await db
      .insert(courses)
      .values({
        userId,
        title: courseData.title,
        description: courseData.description,
        price: courseData.price.toString(),
        thumbnailUrl: courseData.thumbnailUrl,
        salesPageContent: courseData.salesPageContent,
        category: courseData.category,
        refundPeriod: courseData.refundPeriod,
        allowsAffiliates: courseData.allowsAffiliates || false,
        defaultAffiliateCommission: courseData.defaultAffiliateCommission?.toString() || "0",
        slug,
      })
      .returning();
    return course;
  }

  async getCourseById(id: number): Promise<Course | undefined> {
    const [courseData] = await db
      .select()
      .from(courses)
      .where(eq(courses.id, id));
    
    if (!courseData) return undefined;

    // Get category name if category is an ID
    if (courseData.category && /^\d+$/.test(courseData.category)) {
      const categoryId = parseInt(courseData.category);
      const [category] = await db
        .select({ name: categories.name })
        .from(categories)
        .where(eq(categories.id, categoryId));
      
      return {
        ...courseData,
        category: category?.name || courseData.category,
      } as Course;
    }
    
    return courseData;
  }

  async updateCourse(id: number, courseData: Partial<Course>): Promise<Course> {
    const [course] = await db
      .update(courses)
      .set({ ...courseData, updatedAt: new Date() })
      .where(eq(courses.id, id))
      .returning();
    return course;
  }

  async getCourseBySlug(slug: string): Promise<Course | undefined> {
    const [courseData] = await db
      .select()
      .from(courses)
      .where(eq(courses.slug, slug));
    
    if (!courseData) return undefined;

    // Get category name if category is an ID
    if (courseData.category && /^\d+$/.test(courseData.category)) {
      const categoryId = parseInt(courseData.category);
      const [category] = await db
        .select({ name: categories.name })
        .from(categories)
        .where(eq(categories.id, categoryId));
      
      return {
        ...courseData,
        category: category?.name || courseData.category,
      } as Course;
    }
    
    return courseData;
  }

  async deleteCourse(id: number): Promise<void> {
    // Delete related records first to avoid foreign key constraints
    
    // Delete order bumps
    await db.delete(orderBumps).where(eq(orderBumps.courseId, id));
    
    // Delete upsells where this course is the main product or the upsell product
    await db.delete(upSells).where(eq(upSells.mainCourseId, id));
    await db.delete(upSells).where(eq(upSells.upsellCourseId, id));
    
    // Delete offers
    await db.delete(offers).where(eq(offers.courseId, id));
    
    // Delete sales links
    // await db.delete(salesLinks).where(eq(salesLinks.courseId, id));
    
    // Delete coupons
    await db.delete(coupons).where(eq(coupons.courseId, id));
    
    // Delete course affiliates
    await db.delete(courseAffiliates).where(eq(courseAffiliates.courseId, id));
    
    // Delete course co-producers
    await db.delete(courseCoProducers).where(eq(courseCoProducers.courseId, id));
    
    // Delete pending invitations
    await db.delete(pendingInvitations).where(eq(pendingInvitations.courseId, id));
    
    // Delete affiliate applications
    await db.delete(affiliateApplications).where(eq(affiliateApplications.courseId, id));
    
    // Delete lessons
    await db.delete(lessons).where(eq(lessons.courseId, id));
    
    // Delete sales links first
    await db.delete(salesLinks).where(eq(salesLinks.courseId, id));
    
    // Delete sales (removing foreign key constraint)
    await db.delete(sales).where(eq(sales.courseId, id));
    
    // Finally delete the course itself
    await db.delete(courses).where(eq(courses.id, id));
  }

  // Lesson operations
  async getCourseLessons(courseId: number): Promise<Lesson[]> {
    return await db
      .select()
      .from(lessons)
      .where(eq(lessons.courseId, courseId))
      .orderBy(lessons.order);
  }

  async createLesson(lessonData: InsertLesson & { courseId: number }): Promise<Lesson> {
    const [lesson] = await db
      .insert(lessons)
      .values(lessonData)
      .returning();
    return lesson;
  }

  async updateLesson(id: number, lessonData: Partial<Lesson>): Promise<Lesson> {
    const [lesson] = await db
      .update(lessons)
      .set(lessonData)
      .where(eq(lessons.id, id))
      .returning();
    return lesson;
  }

  async deleteLesson(id: number): Promise<void> {
    await db.delete(lessons).where(eq(lessons.id, id));
  }

  // Sales operations
  async getUserSales(userId: number): Promise<Sale[]> {
    return await db
      .select()
      .from(sales)
      .where(eq(sales.userId, userId))
      .orderBy(desc(sales.createdAt));
  }

  async createSale(saleData: InsertSale & { courseId: number; userId: number }): Promise<Sale> {
    const [sale] = await db
      .insert(sales)
      .values({
        ...saleData,
        affiliateId: saleData.affiliateId || null,
        affiliateLinkId: saleData.affiliateLinkId || null,
        affiliateCommission: saleData.affiliateCommission || "0",
      })
      .returning();
    return sale;
  }

  async updateSaleStatus(paymentId: string, status: string): Promise<void> {
    await db
      .update(sales)
      .set({ status })
      .where(eq(sales.paymentId, paymentId));
  }

  // Analytics operations
  async getDashboardAnalytics(userId: number): Promise<{
    balance: number;
    todaySales: number;
    monthSales: number;
    conversionRate: number;
    totalRevenue: number;
    totalSales: number;
    uniqueCustomers: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get today's sales
    const [todayResult] = await db
      .select({
        total: sum(sales.amount),
        count: count(sales.id)
      })
      .from(sales)
      .where(
        and(
          eq(sales.userId, userId),
          eq(sales.status, "completed"),
          gte(sales.createdAt, today)
        )
      );

    // Get last 30 days sales
    const [monthResult] = await db
      .select({
        total: sum(sales.amount),
        count: count(sales.id)
      })
      .from(sales)
      .where(
        and(
          eq(sales.userId, userId),
          eq(sales.status, "completed"),
          gte(sales.createdAt, thirtyDaysAgo)
        )
      );

    // Get total revenue and sales
    const [totalResult] = await db
      .select({
        total: sum(sales.amount),
        count: count(sales.id)
      })
      .from(sales)
      .where(
        and(
          eq(sales.userId, userId),
          eq(sales.status, "completed")
        )
      );

    // Get unique customers
    const [uniqueCustomersResult] = await db
      .select({
        count: sql<number>`COUNT(DISTINCT ${sales.customerEmail})`
      })
      .from(sales)
      .where(eq(sales.userId, userId));

    const todayTotal = parseFloat(todayResult?.total || "0");
    const monthTotal = parseFloat(monthResult?.total || "0");
    const totalRevenue = parseFloat(totalResult?.total || "0");
    const totalSales = totalResult?.count || 0;
    const uniqueCustomers = uniqueCustomersResult?.count || 0;

    return {
      balance: totalRevenue * 0.9, // Assume 10% platform fee
      todaySales: todayTotal,
      monthSales: monthTotal,
      conversionRate: 3.2, // Static for now
      totalRevenue,
      totalSales,
      uniqueCustomers,
    };
  }

  async getTopProducts(userId: number): Promise<Array<{
    id: number;
    title: string;
    sales: number;
    revenue: number;
    growth: string;
    image: string;
  }>> {
    const result = await db
      .select({
        id: courses.id,
        title: courses.title,
        thumbnailUrl: courses.thumbnailUrl,
        totalSales: count(sales.id),
        totalRevenue: sum(sales.amount),
      })
      .from(courses)
      .leftJoin(sales, and(
        eq(sales.courseId, courses.id),
        eq(sales.status, "completed")
      ))
      .where(eq(courses.userId, userId))
      .groupBy(courses.id)
      .orderBy(desc(count(sales.id)))
      .limit(10);

    return result.map((product) => ({
      id: product.id,
      title: product.title,
      sales: product.totalSales || 0,
      revenue: parseFloat(product.totalRevenue || "0"),
      growth: "+15%", // Static for now
      image: product.thumbnailUrl || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=60&h=60",
    }));
  }

  async getRecentActivities(userId: number): Promise<Array<{
    id: number;
    type: string;
    description: string;
    time: string;
    amount?: string;
    rating?: number;
  }>> {
    const recentSales = await db
      .select({
        id: sales.id,
        courseId: sales.courseId,
        customerName: sales.customerName,
        amount: sales.amount,
        createdAt: sales.createdAt,
      })
      .from(sales)
      .where(
        and(
          eq(sales.userId, userId),
          eq(sales.status, "completed")
        )
      )
      .orderBy(desc(sales.createdAt))
      .limit(5);

    return recentSales.map((sale) => ({
      id: sale.id,
      type: "sale",
      description: `Nova venda para ${sale.customerName}`,
      time: this.getTimeAgo(sale.createdAt!),
      amount: `+R$ ${parseFloat(sale.amount).toFixed(2)}`,
    }));
  }

  private getTimeAgo(date: Date): string {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Agora";
    if (diffInMinutes < 60) return `Há ${diffInMinutes} minuto${diffInMinutes > 1 ? 's' : ''}`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Há ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `Há ${diffInDays} dia${diffInDays > 1 ? 's' : ''}`;
  }

  async updateAnalytics(userId: number, amount: number): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [existing] = await db
      .select()
      .from(analytics)
      .where(
        and(
          eq(analytics.userId, userId),
          eq(analytics.date, today)
        )
      );

    if (existing) {
      await db
        .update(analytics)
        .set({
          totalSales: sql`${analytics.totalSales} + ${amount}`,
          salesCount: sql`${analytics.salesCount} + 1`,
        })
        .where(eq(analytics.id, existing.id));
    } else {
      await db.insert(analytics).values({
        userId,
        date: today,
        totalSales: amount.toString(),
        salesCount: 1,
        conversionRate: "3.2",
        pageViews: 0,
      });
    }
  }

  // Payment configuration
  async getPaymentConfig(userId: number): Promise<PaymentConfig | undefined> {
    const [config] = await db
      .select()
      .from(paymentConfigs)
      .where(eq(paymentConfigs.userId, userId));
    return config || undefined;
  }

  async updatePaymentConfig(userId: number, configData: Partial<PaymentConfig>): Promise<PaymentConfig> {
    const existing = await this.getPaymentConfig(userId);
    
    if (existing) {
      const [config] = await db
        .update(paymentConfigs)
        .set({ ...configData, updatedAt: new Date() })
        .where(eq(paymentConfigs.userId, userId))
        .returning();
      return config;
    } else {
      const [config] = await db
        .insert(paymentConfigs)
        .values({ userId, ...configData })
        .returning();
      return config;
    }
  }

  // Categories operations
  async getUserCategories(userId: number): Promise<Category[]> {
    return await db
      .select()
      .from(categories)
      .where(eq(categories.userId, userId))
      .orderBy(categories.name);
  }

  async createCategory(userId: number, categoryData: InsertCategory): Promise<Category> {
    const [category] = await db
      .insert(categories)
      .values({ userId, ...categoryData })
      .returning();
    return category;
  }

  async deleteCategory(id: number): Promise<void> {
    await db.delete(categories).where(eq(categories.id, id));
  }

  // Sales Links operations
  async getUserSalesLinks(userId: number): Promise<Array<SalesLink & { courseName: string; originalPrice: string }>> {
    const links = await db
      .select({
        id: salesLinks.id,
        userId: salesLinks.userId,
        courseId: salesLinks.courseId,
        customTitle: salesLinks.customTitle,
        customPrice: salesLinks.customPrice,
        linkId: salesLinks.linkId,
        isActive: salesLinks.isActive,
        createdAt: salesLinks.createdAt,
        updatedAt: salesLinks.updatedAt,
        courseName: courses.title,
        originalPrice: courses.price,
      })
      .from(salesLinks)
      .leftJoin(courses, eq(salesLinks.courseId, courses.id))
      .where(eq(salesLinks.userId, userId))
      .orderBy(desc(salesLinks.createdAt));

    return links as Array<SalesLink & { courseName: string; originalPrice: string }>;
  }

  async createSalesLink(userId: number, salesLinkData: InsertSalesLink): Promise<SalesLink> {
    const linkId = Math.random().toString(36).substr(2, 9);
    
    const [salesLink] = await db
      .insert(salesLinks)
      .values({
        userId,
        ...salesLinkData,
        linkId,
      })
      .returning();
    
    return salesLink;
  }

  async getSalesLinkByLinkId(linkId: string): Promise<SalesLink & { course: Course } | undefined> {
    const [result] = await db
      .select({
        id: salesLinks.id,
        userId: salesLinks.userId,
        courseId: salesLinks.courseId,
        customTitle: salesLinks.customTitle,
        customPrice: salesLinks.customPrice,
        linkId: salesLinks.linkId,
        isActive: salesLinks.isActive,
        createdAt: salesLinks.createdAt,
        updatedAt: salesLinks.updatedAt,
        course: courses,
      })
      .from(salesLinks)
      .leftJoin(courses, eq(salesLinks.courseId, courses.id))
      .where(eq(salesLinks.linkId, linkId));

    return result as SalesLink & { course: Course } | undefined;
  }

  async deleteSalesLink(id: number): Promise<void> {
    await db.delete(salesLinks).where(eq(salesLinks.id, id));
  }

  async getUserCustomers(userId: number): Promise<Array<{
    id: string;
    name: string;
    email: string;
    phone: string;
    totalPurchases: number;
    totalSpent: number;
    lastPurchase: string;
    joinDate: string;
    purchasedProducts: string[];
  }>> {
    const customerSales = await db
      .select({
        customerEmail: sales.customerEmail,
        customerName: sales.customerName,
        amount: sales.amount,
        createdAt: sales.createdAt,
        courseTitle: courses.title,
      })
      .from(sales)
      .leftJoin(courses, eq(sales.courseId, courses.id))
      .where(eq(sales.userId, userId))
      .orderBy(sales.createdAt);

    // Group sales by customer email
    const customerMap = new Map();
    
    for (const sale of customerSales) {
      const email = sale.customerEmail;
      
      if (!customerMap.has(email)) {
        customerMap.set(email, {
          id: email,
          name: sale.customerName,
          email: email,
          phone: "", // Not captured in current schema
          totalPurchases: 0,
          totalSpent: 0,
          lastPurchase: sale.createdAt,
          joinDate: sale.createdAt,
          purchasedProducts: [],
        });
      }
      
      const customer = customerMap.get(email);
      customer.totalPurchases += 1;
      customer.totalSpent += parseFloat(sale.amount);
      
      if (sale.createdAt && customer.lastPurchase && new Date(sale.createdAt) > new Date(customer.lastPurchase)) {
        customer.lastPurchase = sale.createdAt;
      } else if (sale.createdAt && !customer.lastPurchase) {
        customer.lastPurchase = sale.createdAt;
      }
      
      if (sale.createdAt && customer.joinDate && new Date(sale.createdAt) < new Date(customer.joinDate)) {
        customer.joinDate = sale.createdAt;
      } else if (sale.createdAt && !customer.joinDate) {
        customer.joinDate = sale.createdAt;
      }
      
      if (sale.courseTitle && !customer.purchasedProducts.includes(sale.courseTitle)) {
        customer.purchasedProducts.push(sale.courseTitle);
      }
    }

    return Array.from(customerMap.values())
      .map(customer => ({
        ...customer,
        lastPurchase: customer.lastPurchase.toISOString().split('T')[0],
        joinDate: customer.joinDate.toISOString().split('T')[0],
      }))
      .sort((a, b) => new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime());
  }

  // Partnership management methods
  async getCourseCoProducers(courseId: number): Promise<Array<any>> {
    const result = await db
      .select({
        id: courseCoProducers.id,
        percentage: courseCoProducers.percentage,
        isActive: courseCoProducers.isActive,
        createdAt: courseCoProducers.createdAt,
        user: {
          id: users.id,
          fullName: users.fullName,
          email: users.email
        }
      })
      .from(courseCoProducers)
      .innerJoin(users, eq(courseCoProducers.userId, users.id))
      .where(and(eq(courseCoProducers.courseId, courseId), eq(courseCoProducers.isActive, true)));
    
    return result;
  }

  async addCourseCoProducer(courseId: number, userId: number, percentage: number): Promise<any> {
    const [coproducer] = await db
      .insert(courseCoProducers)
      .values({
        courseId,
        userId,
        percentage: percentage.toString(),
        isActive: true
      })
      .returning();
    
    return coproducer;
  }

  async removeCourseCoProducer(coproducerId: number): Promise<void> {
    await db
      .update(courseCoProducers)
      .set({ isActive: false })
      .where(eq(courseCoProducers.id, coproducerId));
  }

  async getCourseAffiliates(courseId: number): Promise<Array<any>> {
    const result = await db
      .select({
        id: courseAffiliates.id,
        commission: courseAffiliates.commission,
        isActive: courseAffiliates.isActive,
        createdAt: courseAffiliates.createdAt,
        user: {
          id: users.id,
          fullName: users.fullName,
          email: users.email
        }
      })
      .from(courseAffiliates)
      .innerJoin(users, eq(courseAffiliates.userId, users.id))
      .where(and(eq(courseAffiliates.courseId, courseId), eq(courseAffiliates.isActive, true)));
    
    return result;
  }

  async addCourseAffiliate(courseId: number, userId: number, commission: number): Promise<any> {
    const [affiliate] = await db
      .insert(courseAffiliates)
      .values({
        courseId,
        userId,
        commission: commission.toString(),
        isActive: true
      })
      .returning();
    
    return affiliate;
  }

  async removeCourseAffiliate(affiliateId: number): Promise<void> {
    await db
      .update(courseAffiliates)
      .set({ isActive: false })
      .where(eq(courseAffiliates.id, affiliateId));
  }

  // Pending invitations management methods
  async createPendingInvitation(data: {
    senderUserId: number;
    recipientEmail: string;
    courseId?: number;
    type: string;
    percentage?: number;
    commission?: number;
    invitationToken: string;
    expiresAt: Date;
  }): Promise<PendingInvitation> {
    const [invitation] = await db
      .insert(pendingInvitations)
      .values({
        senderUserId: data.senderUserId,
        recipientEmail: data.recipientEmail,
        courseId: data.courseId,
        type: data.type,
        percentage: data.percentage?.toString(),
        commission: data.commission?.toString(),
        invitationToken: data.invitationToken,
        expiresAt: data.expiresAt,
        status: "pending"
      })
      .returning();
    
    return invitation;
  }

  async getPendingInvitations(senderUserId: number, courseId?: number): Promise<Array<PendingInvitation>> {
    const conditions = [eq(pendingInvitations.senderUserId, senderUserId), eq(pendingInvitations.status, "pending")];
    
    if (courseId) {
      conditions.push(eq(pendingInvitations.courseId, courseId));
    }

    const invitations = await db
      .select()
      .from(pendingInvitations)
      .where(and(...conditions))
      .orderBy(pendingInvitations.createdAt);
    
    return invitations;
  }

  async updateInvitationStatus(invitationToken: string, status: string): Promise<void> {
    await db
      .update(pendingInvitations)
      .set({ status, updatedAt: new Date() })
      .where(eq(pendingInvitations.invitationToken, invitationToken));
  }

  async deletePendingInvitation(invitationId: number): Promise<void> {
    await db
      .delete(pendingInvitations)
      .where(eq(pendingInvitations.id, invitationId));
  }

  async getInvitationByToken(invitationToken: string): Promise<PendingInvitation | undefined> {
    const [invitation] = await db
      .select()
      .from(pendingInvitations)
      .where(eq(pendingInvitations.invitationToken, invitationToken));
    
    return invitation;
  }

  // Offers management
  async getUserOffers(userId: number): Promise<Array<Offer & { courseName: string }>> {
    const result = await db
      .select({
        id: offers.id,
        userId: offers.userId,
        courseId: offers.courseId,
        title: offers.title,
        description: offers.description,
        originalPrice: offers.originalPrice,
        salePrice: offers.salePrice,
        linkId: offers.linkId,
        validFrom: offers.validFrom,
        validUntil: offers.validUntil,
        maxUses: offers.maxUses,
        currentUses: offers.currentUses,
        isActive: offers.isActive,
        createdAt: offers.createdAt,
        updatedAt: offers.updatedAt,
        courseName: courses.title,
      })
      .from(offers)
      .leftJoin(courses, eq(offers.courseId, courses.id))
      .where(eq(offers.userId, userId))
      .orderBy(desc(offers.createdAt));
    
    return result.map(row => ({
      ...row,
      courseName: row.courseName || 'Curso não encontrado'
    })) as Array<Offer & { courseName: string }>;
  }

  async createOffer(userId: number, offerData: InsertOffer): Promise<Offer> {
    const linkId = `offer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const [offer] = await db
      .insert(offers)
      .values({ ...offerData, userId, linkId })
      .returning();
    return offer;
  }

  async updateOffer(id: number, offerData: Partial<Offer>): Promise<Offer> {
    const [offer] = await db
      .update(offers)
      .set({ ...offerData, updatedAt: new Date() })
      .where(eq(offers.id, id))
      .returning();
    return offer;
  }

  async deleteOffer(id: number): Promise<void> {
    await db.delete(offers).where(eq(offers.id, id));
  }

  async getOfferByLinkId(linkId: string): Promise<Offer & { course: Course } | undefined> {
    const result = await db
      .select()
      .from(offers)
      .leftJoin(courses, eq(offers.courseId, courses.id))
      .where(eq(offers.linkId, linkId))
      .limit(1);
    
    if (!result.length) return undefined;
    
    const [row] = result;
    return {
      ...row.offers,
      course: row.courses!,
    } as Offer & { course: Course };
  }

  // Coupons management
  async getUserCoupons(userId: number): Promise<Array<Coupon & { courseName?: string }>> {
    const result = await db
      .select()
      .from(coupons)
      .leftJoin(courses, eq(coupons.courseId, courses.id))
      .where(eq(coupons.userId, userId))
      .orderBy(desc(coupons.createdAt));
    
    return result.map(row => ({
      ...row.coupons,
      courseName: row.courses?.title,
    })) as Array<Coupon & { courseName?: string }>;
  }

  async createCoupon(userId: number, couponData: InsertCoupon): Promise<Coupon> {
    const [coupon] = await db
      .insert(coupons)
      .values({ ...couponData, userId })
      .returning();
    return coupon;
  }

  async updateCoupon(id: number, couponData: Partial<Coupon>): Promise<Coupon> {
    const [coupon] = await db
      .update(coupons)
      .set({ ...couponData, updatedAt: new Date() })
      .where(eq(coupons.id, id))
      .returning();
    return coupon;
  }

  async deleteCoupon(id: number): Promise<void> {
    await db.delete(coupons).where(eq(coupons.id, id));
  }

  async getCouponByCode(code: string): Promise<Coupon | undefined> {
    const [coupon] = await db.select().from(coupons).where(eq(coupons.code, code));
    return coupon;
  }

  async validateCoupon(code: string, orderValue: number, courseId?: number): Promise<{ valid: boolean; discount: number; message?: string; couponId?: number }> {
    const coupon = await this.getCouponByCode(code);
    
    if (!coupon) {
      return { valid: false, discount: 0, message: "Cupom não encontrado" };
    }

    if (!coupon.isActive) {
      return { valid: false, discount: 0, message: "Cupom inativo" };
    }

    // Check if coupon is linked to the correct product
    if (courseId && coupon.courseId !== courseId) {
      return { valid: false, discount: 0, message: "Este cupom não é válido para este produto" };
    }

    if (coupon.validUntil && new Date() > new Date(coupon.validUntil)) {
      return { valid: false, discount: 0, message: "Cupom expirado" };
    }

    if (coupon.usageLimit && (coupon.usedCount || 0) >= coupon.usageLimit) {
      return { valid: false, discount: 0, message: "Cupom esgotado" };
    }

    if (coupon.minOrderValue && orderValue < parseFloat(coupon.minOrderValue)) {
      return { valid: false, discount: 0, message: `Valor mínimo de pedido: R$ ${coupon.minOrderValue}` };
    }

    let discount = 0;
    if (coupon.type === 'percentage') {
      discount = (orderValue * parseFloat(coupon.value)) / 100;
      if (coupon.maxDiscount && discount > parseFloat(coupon.maxDiscount)) {
        discount = parseFloat(coupon.maxDiscount);
      }
    } else {
      discount = parseFloat(coupon.value);
    }

    return { valid: true, discount, couponId: coupon.id };
  }

  async incrementCouponUsage(couponId: number): Promise<void> {
    await db
      .update(coupons)
      .set({
        usedCount: sql`COALESCE(${coupons.usedCount}, 0) + 1`,
        updatedAt: new Date()
      })
      .where(eq(coupons.id, couponId));
  }

  // Order Bumps management
  async getCourseOrderBumps(courseId: number): Promise<Array<OrderBump>> {
    return await db.select().from(orderBumps).where(eq(orderBumps.courseId, courseId)).orderBy(orderBumps.order);
  }

  async createOrderBump(userId: number, orderBumpData: InsertOrderBump): Promise<OrderBump> {
    const [orderBump] = await db
      .insert(orderBumps)
      .values({ ...orderBumpData, userId })
      .returning();
    return orderBump;
  }

  async updateOrderBump(id: number, orderBumpData: Partial<OrderBump>): Promise<OrderBump> {
    const [orderBump] = await db
      .update(orderBumps)
      .set({ ...orderBumpData, updatedAt: new Date() })
      .where(eq(orderBumps.id, id))
      .returning();
    return orderBump;
  }

  async deleteOrderBump(id: number): Promise<void> {
    await db.delete(orderBumps).where(eq(orderBumps.id, id));
  }

  // UpSells management
  async getCourseUpSells(courseId: number): Promise<Array<UpSell & { upsellCourse: Course }>> {
    const result = await db
      .select()
      .from(upSells)
      .leftJoin(courses, eq(upSells.upsellCourseId, courses.id))
      .where(eq(upSells.mainCourseId, courseId))
      .orderBy(upSells.order);
    
    return result.map(row => ({
      ...row.upsells,
      upsellCourse: row.courses!,
    })) as Array<UpSell & { upsellCourse: Course }>;
  }

  async createUpSell(userId: number, upSellData: InsertUpSell): Promise<UpSell> {
    const [upSell] = await db
      .insert(upSells)
      .values({ ...upSellData, userId })
      .returning();
    return upSell;
  }

  async updateUpSell(id: number, upSellData: Partial<UpSell>): Promise<UpSell> {
    const [upSell] = await db
      .update(upSells)
      .set({ ...upSellData, updatedAt: new Date() })
      .where(eq(upSells.id, id))
      .returning();
    return upSell;
  }

  async deleteUpSell(id: number): Promise<void> {
    await db.delete(upSells).where(eq(upSells.id, id));
  }

  // KYC Documents
  async getUserKycDocuments(userId: number): Promise<Array<KycDocument>> {
    return await db.select().from(kycDocuments).where(eq(kycDocuments.userId, userId)).orderBy(desc(kycDocuments.createdAt));
  }

  async getKycDocumentById(id: number): Promise<KycDocument | undefined> {
    const [document] = await db.select().from(kycDocuments).where(eq(kycDocuments.id, id));
    return document;
  }

  async createKycDocument(userId: number, documentData: InsertKycDocument): Promise<KycDocument> {
    const [document] = await db
      .insert(kycDocuments)
      .values({ 
        userId,
        documentType: documentData.documentType,
        documentNumber: documentData.documentNumber || null,
        documentFile: documentData.documentFile,
        filePath: documentData.filePath || null,
        fileName: documentData.fileName || null,
        fileSize: documentData.fileSize || null,
        mimeType: documentData.mimeType || null
      })
      .returning();
    return document;
  }

  async updateKycDocumentStatus(id: number, status: string, rejectionReason?: string, verifiedBy?: number): Promise<void> {
    await db
      .update(kycDocuments)
      .set({ 
        status, 
        rejectionReason,
        verifiedAt: status === 'approved' ? new Date() : null,
        verifiedBy,
        updatedAt: new Date(),
      })
      .where(eq(kycDocuments.id, id));
  }

  // Webhooks
  async getUserWebhooks(userId: number): Promise<Array<Webhook>> {
    return await db.select().from(webhooks).where(eq(webhooks.userId, userId)).orderBy(desc(webhooks.createdAt));
  }

  async createWebhook(userId: number, webhookData: InsertWebhook): Promise<Webhook> {
    const [webhook] = await db
      .insert(webhooks)
      .values({ ...webhookData, userId })
      .returning();
    return webhook;
  }

  async updateWebhook(id: number, webhookData: Partial<Webhook>): Promise<Webhook> {
    const [webhook] = await db
      .update(webhooks)
      .set({ ...webhookData, updatedAt: new Date() })
      .where(eq(webhooks.id, id))
      .returning();
    return webhook;
  }

  async deleteWebhook(id: number): Promise<void> {
    await db.delete(webhooks).where(eq(webhooks.id, id));
  }

  async triggerWebhook(webhookId: number, payload: any): Promise<void> {
    await db.insert(webhookLogs).values({
      webhookId,
      event: payload.event,
      payload: JSON.stringify(payload),
      attemptNumber: 1,
      succeededAt: new Date(),
    });
  }

  // Notifications implementation
  async getUserNotifications(userId: number): Promise<Array<Notification>> {
    const userNotifications = await db
      .select({
        id: notifications.id,
        userId: notifications.userId,
        type: notifications.type,
        title: notifications.title,
        message: notifications.message,
        courseId: notifications.courseId,
        courseName: notifications.courseName,
        applicantName: notifications.applicantName,
        applicationId: notifications.applicationId,
        saleAmount: notifications.saleAmount,
        customerName: notifications.customerName,
        isRead: notifications.isRead,
        readAt: notifications.readAt,
        createdAt: notifications.createdAt,
        applicationStatus: affiliateApplications.status,
      })
      .from(notifications)
      .leftJoin(affiliateApplications, eq(notifications.applicationId, affiliateApplications.id))
      .where(and(
        eq(notifications.userId, userId),
        or(
          ne(notifications.type, 'affiliate_application'),
          eq(affiliateApplications.status, 'pending'),
          isNull(affiliateApplications.status)
        )
      ))
      .orderBy(desc(notifications.createdAt));
    
    return userNotifications as Array<Notification>;
  }

  async createNotification(notificationData: InsertNotification): Promise<Notification> {
    const [notification] = await db
      .insert(notifications)
      .values(notificationData)
      .returning();
    
    return notification;
  }

  async markNotificationAsRead(notificationId: number): Promise<void> {
    await db
      .update(notifications)
      .set({ 
        isRead: true,
        readAt: new Date()
      })
      .where(eq(notifications.id, notificationId));
  }

  async markAllNotificationsAsRead(userId: number): Promise<void> {
    await db
      .update(notifications)
      .set({ 
        isRead: true,
        readAt: new Date()
      })
      .where(eq(notifications.userId, userId));
  }

  async createKycApprovedNotification(userId: number): Promise<void> {
    await this.createNotification({
      userId,
      type: 'kyc_approved',
      title: 'KYC Aprovado!',
      message: 'Parabéns! Sua verificação KYC foi aprovada. Agora você pode criar e vender seus produtos.',
      isRead: false,
    });
  }

  async createKycRejectedNotification(userId: number, reason: string): Promise<void> {
    await this.createNotification({
      userId,
      type: 'kyc_rejected',
      title: 'KYC Rejeitado',
      message: `Sua verificação KYC foi rejeitada. Motivo: ${reason}. Por favor, reenvie seus documentos.`,
      isRead: false,
    });
  }

  async createSaleNotification(userId: number, sale: Sale, courseName: string): Promise<void> {
    await this.createNotification({
      userId,
      type: 'sale_made',
      title: 'Nova Venda Realizada!',
      message: `Você vendeu "${courseName}" para ${sale.customerName}`,
      saleAmount: sale.amount,
      customerName: sale.customerName,
      courseName,
      isRead: false,
    });
  }

  async createAffiliateApplicationNotification(applicantUserId: number, courseId: number, applicationId: number): Promise<void> {
    // Get course and applicant information
    const [course] = await db
      .select()
      .from(courses)
      .where(eq(courses.id, courseId));
    
    const [applicant] = await db
      .select()
      .from(users)
      .where(eq(users.id, applicantUserId));

    if (!course || !applicant) return;

    // Create notification for course owner
    await this.createNotification({
      userId: course.userId,
      type: 'affiliate_application',
      title: 'Nova solicitação de afiliação',
      message: `${applicant.fullName} solicitou afiliação para o produto "${course.title}".`,
      courseId: courseId,
      courseName: course.title,
      applicantName: applicant.fullName,
      applicationId: applicationId,
      isRead: false,
    });
  }

  // Affiliate system management
  async getAffiliateProducts(userId: number): Promise<Array<Course & { producer: { fullName: string }; isAlreadyAffiliate?: boolean; hasPendingApplication?: boolean }>> {
    const result = await db
      .selectDistinct({
        course: courses,
        producer: users,
        isAlreadyAffiliate: sql<boolean>`CASE WHEN ${courseAffiliates.id} IS NOT NULL THEN true ELSE false END`,
        hasPendingApplication: sql<boolean>`CASE WHEN ${affiliateApplications.id} IS NOT NULL AND ${affiliateApplications.status} = 'pending' THEN true ELSE false END`
      })
      .from(courses)
      .leftJoin(users, eq(courses.userId, users.id))
      .leftJoin(courseAffiliates, and(
        eq(courseAffiliates.courseId, courses.id),
        eq(courseAffiliates.userId, userId)
      ))
      .leftJoin(affiliateApplications, and(
        eq(affiliateApplications.courseId, courses.id),
        eq(affiliateApplications.applicantUserId, userId)
      ))
      .where(and(
        eq(courses.allowsAffiliates, true),
        eq(courses.isActive, true),
        sql`${courses.userId} != ${userId}` // Don't show own products
      ));

    return result.map(row => ({
      ...row.course,
      producer: { fullName: row.producer?.fullName || '' },
      isAlreadyAffiliate: row.isAlreadyAffiliate,
      hasPendingApplication: row.hasPendingApplication
    })) as Array<Course & { producer: { fullName: string }; isAlreadyAffiliate?: boolean; hasPendingApplication?: boolean }>;
  }

  async createAffiliateApplication(userId: number, courseId: number): Promise<void> {
    // Check if application already exists
    const existingApplication = await db
      .select()
      .from(affiliateApplications)
      .where(and(
        eq(affiliateApplications.applicantUserId, userId),
        eq(affiliateApplications.courseId, courseId)
      ))
      .limit(1);

    if (existingApplication.length > 0) {
      throw new Error('Você já solicitou afiliação para este produto');
    }

    // Check if already an affiliate
    const existingAffiliate = await db
      .select()
      .from(courseAffiliates)
      .where(and(
        eq(courseAffiliates.userId, userId),
        eq(courseAffiliates.courseId, courseId)
      ))
      .limit(1);

    if (existingAffiliate.length > 0) {
      throw new Error('Você já é afiliado deste produto');
    }

    const [application] = await db.insert(affiliateApplications).values({
      applicantUserId: userId,
      courseId,
    }).returning();

    // Create notification for course owner
    await this.createAffiliateApplicationNotification(userId, courseId, application.id);
  }

  async getAffiliateApplications(courseId: number): Promise<Array<any>> {
    const result = await db
      .select({
        id: affiliateApplications.id,
        status: affiliateApplications.status,
        appliedAt: affiliateApplications.appliedAt,
        applicantName: users.fullName,
        applicantEmail: users.email,
      })
      .from(affiliateApplications)
      .leftJoin(users, eq(affiliateApplications.applicantUserId, users.id))
      .where(eq(affiliateApplications.courseId, courseId));

    return result;
  }

  async approveAffiliateApplication(applicationId: number, reviewerId: number): Promise<void> {
    const [application] = await db
      .select()
      .from(affiliateApplications)
      .where(eq(affiliateApplications.id, applicationId))
      .limit(1);

    if (!application) {
      throw new Error('Solicitação não encontrada');
    }

    if (application.status === 'approved') {
      throw new Error('Esta solicitação já foi aprovada');
    }

    // Get course default commission
    const [course] = await db
      .select()
      .from(courses)
      .where(eq(courses.id, application.courseId))
      .limit(1);

    if (!course) {
      throw new Error('Produto não encontrado');
    }

    // Check if user is already an affiliate
    const existingAffiliate = await db
      .select()
      .from(courseAffiliates)
      .where(and(
        eq(courseAffiliates.courseId, application.courseId),
        eq(courseAffiliates.userId, application.applicantUserId)
      ))
      .limit(1);

    if (existingAffiliate.length > 0) {
      throw new Error('Este usuário já é afiliado deste produto');
    }

    // Add to affiliates
    await db.insert(courseAffiliates).values({
      courseId: application.courseId,
      userId: application.applicantUserId,
      commission: course.defaultAffiliateCommission || "0",
    });

    // Update application status
    await db
      .update(affiliateApplications)
      .set({
        status: 'approved',
        reviewedAt: new Date(),
        reviewedBy: reviewerId,
      })
      .where(eq(affiliateApplications.id, applicationId));

    // Mark related notification as read
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(
        eq(notifications.type, 'affiliate_application'),
        eq(notifications.applicationId, applicationId)
      ));
  }

  async rejectAffiliateApplication(applicationId: number, reviewerId: number): Promise<void> {
    const [application] = await db
      .select()
      .from(affiliateApplications)
      .where(eq(affiliateApplications.id, applicationId))
      .limit(1);

    if (!application) {
      throw new Error('Solicitação não encontrada');
    }

    if (application.status === 'rejected') {
      throw new Error('Esta solicitação já foi rejeitada');
    }

    if (application.status === 'approved') {
      throw new Error('Não é possível rejeitar uma solicitação já aprovada');
    }

    await db
      .update(affiliateApplications)
      .set({
        status: 'rejected',
        reviewedAt: new Date(),
        reviewedBy: reviewerId,
      })
      .where(eq(affiliateApplications.id, applicationId));

    // Mark related notification as read
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(
        eq(notifications.type, 'affiliate_application'),
        eq(notifications.applicationId, applicationId)
      ));
  }

  // Affiliate link generation methods
  async generateAffiliateLink(affiliateId: number, courseId: number): Promise<{ linkId: string; fullUrl: string }> {
    // Generate unique link ID
    const linkId = Math.random().toString(36).substring(2, 12);
    
    // Check if affiliate link already exists
    const existingLink = await db
      .select()
      .from(affiliateLinks)
      .where(and(
        eq(affiliateLinks.affiliateId, affiliateId),
        eq(affiliateLinks.courseId, courseId)
      ))
      .limit(1);

    if (existingLink.length > 0) {
      return {
        linkId: existingLink[0].linkId,
        fullUrl: `${process.env.FRONTEND_URL || 'http://localhost:5000'}/aff/${existingLink[0].linkId}`
      };
    }

    // Create new affiliate link
    await db.insert(affiliateLinks).values({
      affiliateId,
      courseId,
      linkId,
    });

    return {
      linkId,
      fullUrl: `${process.env.FRONTEND_URL || 'http://localhost:5000'}/aff/${linkId}`
    };
  }

  async getAffiliateLinks(affiliateId: number): Promise<Array<{ linkId: string; courseName: string; commission: string; clicks: number; sales: number; earnings: string }>> {
    const result = await db
      .select({
        linkId: affiliateLinks.linkId,
        courseName: courses.title,
        commission: courseAffiliates.commission,
        clicks: affiliateLinks.clicks,
        sales: affiliateLinks.sales,
        earnings: affiliateLinks.earnings,
      })
      .from(affiliateLinks)
      .leftJoin(courses, eq(affiliateLinks.courseId, courses.id))
      .leftJoin(courseAffiliates, eq(affiliateLinks.affiliateId, courseAffiliates.id))
      .where(eq(affiliateLinks.affiliateId, affiliateId));

    return result.map(row => ({
      linkId: row.linkId,
      courseName: row.courseName || '',
      commission: row.commission || '0',
      clicks: row.clicks || 0,
      sales: row.sales || 0,
      earnings: row.earnings || '0.00',
    }));
  }

  async trackAffiliateLinkClick(linkId: string): Promise<void> {
    // Update click count
    await db
      .update(affiliateLinks)
      .set({
        clicks: sql`${affiliateLinks.clicks} + 1`
      })
      .where(eq(affiliateLinks.linkId, linkId));

    // Record individual click - this will be properly implemented in route handler
    // await db.insert(affiliateLinkClicks).values({
    //   linkId,
    //   courseId: 0, // Will be set from request in route handler
    //   affiliateId: 0, // Will be set from request in route handler
    //   sessionId: 'unknown', // Will be set from request in route handler
    //   ipAddress: '0.0.0.0',
    //   userAgent: 'unknown',
    // });
  }

  async getProductByAffiliateLink(linkId: string): Promise<Course & { affiliate: { userId: number; commission: string } } | undefined> {
    const result = await db
      .select({
        id: courses.id,
        userId: courses.userId,
        title: courses.title,
        description: courses.description,
        price: courses.price,
        thumbnailUrl: courses.thumbnailUrl,
        salesPageContent: courses.salesPageContent,
        category: courses.category,
        refundPeriod: courses.refundPeriod,
        slug: courses.slug,
        isActive: courses.isActive,
        allowsAffiliates: courses.allowsAffiliates,
        defaultAffiliateCommission: courses.defaultAffiliateCommission,
        createdAt: courses.createdAt,
        updatedAt: courses.updatedAt,
        affiliateUserId: courseAffiliates.userId,
        affiliateCommission: courseAffiliates.commission,
      })
      .from(affiliateLinks)
      .leftJoin(courses, eq(affiliateLinks.courseId, courses.id))
      .leftJoin(courseAffiliates, eq(affiliateLinks.affiliateId, courseAffiliates.id))
      .where(eq(affiliateLinks.linkId, linkId))
      .limit(1);

    if (result.length === 0) {
      return undefined;
    }

    const row = result[0];
    return {
      id: row.id,
      userId: row.userId,
      title: row.title,
      description: row.description,
      price: row.price,
      thumbnailUrl: row.thumbnailUrl,
      salesPageContent: row.salesPageContent,
      category: row.category,
      refundPeriod: row.refundPeriod,
      slug: row.slug,
      isActive: row.isActive,
      allowsAffiliates: row.allowsAffiliates,
      defaultAffiliateCommission: row.defaultAffiliateCommission,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      affiliate: {
        userId: row.affiliateUserId || 0,
        commission: row.affiliateCommission || '0',
      }
    } as Course & { affiliate: { userId: number; commission: string } };
  }

  // KYC Management methods
  async submitKyc(userId: number, kycData: any, documents: { [key: string]: string }): Promise<void> {
    // Update user with KYC data
    await db
      .update(users)
      .set({
        ...kycData,
        kycSubmittedAt: new Date(),
        kycStatus: 'pending',
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    // Save documents with direct SQL to avoid schema issues
    for (const [docType, filePath] of Object.entries(documents)) {
      // Get document number based on document type
      let documentNumber = '';
      if (docType === 'rg') {
        documentNumber = kycData.rgNumber || kycData.cpf || 'PENDING';
      } else if (docType === 'cnh') {
        documentNumber = kycData.cnhNumber || kycData.cpf || 'PENDING';
      } else if (docType === 'cpf_doc') {
        documentNumber = kycData.cpf || 'PENDING';
      } else if (docType === 'cnpj') {
        documentNumber = kycData.cnpj || 'PENDING';
      } else {
        documentNumber = kycData.cpf || 'PENDING';
      }
      
      // Use raw SQL to avoid schema mapping issues
      await db.execute(sql`
        INSERT INTO kyc_documents (
          user_id, document_type, document_number, document_file, 
          file_path, file_name, file_size, status, created_at, updated_at
        ) VALUES (
          ${userId}, ${docType}, ${documentNumber}, ${filePath},
          ${filePath}, ${filePath.split('/').pop() || ''}, 0, 'pending',
          NOW(), NOW()
        )
      `);
    }
  }



  async getAllKycDocuments(): Promise<Array<any>> {
    const result = await db
      .select({
        id: kycDocuments.id,
        userId: kycDocuments.userId,
        documentType: kycDocuments.documentType,
        fileName: kycDocuments.fileName,
        filePath: kycDocuments.filePath,
        status: kycDocuments.status,
        rejectionReason: kycDocuments.rejectionReason,
        createdAt: kycDocuments.createdAt,
        userFullName: users.fullName,
        userEmail: users.email,
      })
      .from(kycDocuments)
      .leftJoin(users, eq(kycDocuments.userId, users.id))
      .orderBy(desc(kycDocuments.createdAt));

    return result.map(row => ({
      ...row,
      user: {
        fullName: row.userFullName,
        email: row.userEmail,
      }
    }));
  }

  async getPendingKycUsers(): Promise<Array<User>> {
    return await db
      .select()
      .from(users)
      .where(and(
        eq(users.kycStatus, 'pending'),
        sql`${users.kycSubmittedAt} IS NOT NULL`
      ))
      .orderBy(desc(users.kycSubmittedAt));
  }

  async approveKyc(userId: number, adminId: number): Promise<void> {
    await db
      .update(users)
      .set({
        kycStatus: 'approved',
        kycApprovedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    // Update all documents to approved
    await db
      .update(kycDocuments)
      .set({
        status: 'approved',
        verifiedAt: new Date(),
        verifiedBy: adminId,
        updatedAt: new Date(),
      })
      .where(eq(kycDocuments.userId, userId));

    // Create notification for KYC approval
    await this.createNotification({
      userId: userId,
      type: 'kyc_approved',
      title: 'KYC Aprovado',
      message: 'Sua verificação KYC foi aprovada! Agora você pode criar e vender cursos na plataforma.',
      isRead: false
    });
  }



  async rejectKyc(userId: number, adminId: number, reason: string): Promise<void> {
    await db
      .update(users)
      .set({
        kycStatus: 'rejected',
        kycRejectionReason: reason,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    // Update all documents to rejected
    await db
      .update(kycDocuments)
      .set({
        status: 'rejected',
        rejectionReason: reason,
        verifiedAt: new Date(),
        verifiedBy: adminId,
        updatedAt: new Date(),
      })
      .where(eq(kycDocuments.userId, userId));

    // Create notification for KYC rejection
    await this.createNotification({
      userId: userId,
      type: 'kyc_rejected',
      title: 'KYC Rejeitado',
      message: `Sua verificação KYC foi rejeitada. Motivo: ${reason}. Por favor, corrija os problemas e envie novamente.`,
      isRead: false
    });
  }

  // Admin Management methods

  async getAffiliateForSale(courseId: number, sessionId: string): Promise<{ affiliateId: number; commission: number } | null> {
    try {
      // Get the most recent affiliate link click for this session
      const clickResult = await db
        .select({
          affiliateId: affiliateLinkClicks.affiliateId,
          linkId: affiliateLinkClicks.linkId,
        })
        .from(affiliateLinkClicks)
        .where(and(
          eq(affiliateLinkClicks.courseId, courseId),
          eq(affiliateLinkClicks.sessionId, sessionId)
        ))
        .orderBy(desc(affiliateLinkClicks.createdAt))
        .limit(1);

      if (clickResult.length === 0) {
        return null;
      }

      const click = clickResult[0];

      // Get the affiliate commission for this course
      const affiliateResult = await db
        .select({
          commission: courseAffiliates.commission,
        })
        .from(courseAffiliates)
        .where(and(
          eq(courseAffiliates.courseId, courseId),
          eq(courseAffiliates.userId, click.affiliateId),
          eq(courseAffiliates.isActive, true)
        ));

      if (affiliateResult.length === 0) {
        return null;
      }

      return {
        affiliateId: click.affiliateId,
        commission: parseFloat(affiliateResult[0].commission),
      };
    } catch (error) {
      console.error('Error getting affiliate for sale:', error);
      return null;
    }
  }

  async getAllUsers(): Promise<Array<User>> {
    return await db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt));
  }

  async createAdminUser(userData: any): Promise<User> {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        password: hashedPassword,
        emailVerified: true,
        kycStatus: 'approved',
        isActive: true,
      })
      .returning();
    
    return user;
  }



  async checkAdminPermissions(userId: number): Promise<boolean> {
    const [user] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return user ? ['admin', 'super_admin'].includes(user.role || '') : false;
  }
}

export const storage = new DatabaseStorage();
