import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { sales, courseAffiliates, affiliateLinks, affiliateLinkClicks } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { insertUserSchema, loginSchema, insertCourseSchema, insertLessonSchema, insertCategorySchema } from "@shared/schema";
import { z } from "zod";
import { hyperSwitchService } from "./hyperswitchService";

// Function to calculate payment splits for co-creators and affiliates
async function calculatePaymentSplits(courseId: number, amount: number, sessionId: string) {
  const splits = [];
  
  try {
    // Get course co-producers
    const coProducers = await storage.getCourseCoProducers(courseId);
    
    // Get affiliate who referred this sale (if any)
    const affiliate = await storage.getAffiliateForSale(courseId, sessionId);
    
    let totalSplitAmount = 0;
    
    // Add co-producer splits
    for (const coProducer of coProducers) {
      const splitAmount = Math.round((amount * coProducer.revenueShare / 100) * 100); // Convert to cents
      splits.push({
        type: 'fixed' as const,
        amount: splitAmount,
        account: `coproducer_${coProducer.coProducerId}`,
        reference: `Course ${courseId} co-producer share`,
      });
      totalSplitAmount += splitAmount;
    }
    
    // Add affiliate split if exists
    if (affiliate) {
      const affiliateAmount = Math.round((amount * affiliate.commission / 100) * 100); // Convert to cents
      splits.push({
        type: 'fixed' as const,
        amount: affiliateAmount,
        account: `affiliate_${affiliate.affiliateId}`,
        reference: `Course ${courseId} affiliate commission`,
      });
      totalSplitAmount += affiliateAmount;
    }
    
    // The remaining amount goes to the main course creator automatically
    
    return splits;
  } catch (error) {
    console.error('Error calculating payment splits:', error);
    return [];
  }
}

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Middleware to verify JWT token
const authenticateToken = async (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await storage.getUserById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid token" });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      // Generate verification token
      const verificationToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      // Create user with verification token
      const user = await storage.createUser({
        fullName: userData.fullName,
        email: userData.email,
        phone: userData.phone,
        password: hashedPassword,
        verificationToken,
      });

      // Send verification email
      const { sendVerificationEmail, sendRegistrationWelcomeEmail } = await import('./emailService');
      await sendVerificationEmail({
        userEmail: user.email,
        userName: user.fullName,
        verificationToken,
      });

      // Send welcome email
      await sendRegistrationWelcomeEmail({
        userEmail: user.email,
        userName: user.fullName,
      });

      // Generate JWT token
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });

      res.json({
        token,
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          emailVerified: user.emailVerified,
        },
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(400).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });

      res.json({
        token,
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          emailVerified: user.emailVerified,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(400).json({ message: "Login failed" });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req: any, res) => {
    try {
      const user = await storage.getUserById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        emailVerified: user.emailVerified,
        role: user.role,
        kycStatus: user.kycStatus,
        kycSubmittedAt: user.kycSubmittedAt,
        kycRejectionReason: user.kycRejectionReason,
        cpf: user.cpf,
        cnpj: user.cnpj,
        address: user.address,
        city: user.city,
        state: user.state,
        zipCode: user.zipCode,
        country: user.country,
        dateOfBirth: user.dateOfBirth,
        bio: user.bio,
        website: user.website,
      });
    } catch (error) {
      console.error("Error fetching user data:", error);
      res.status(500).json({ message: "Failed to fetch user data" });
    }
  });

  // Email verification route
  app.get("/api/verify-email/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const success = await storage.verifyEmail(token);
      
      if (success) {
        res.json({ message: "Email verified successfully" });
      } else {
        res.status(400).json({ message: "Invalid or expired verification token" });
      }
    } catch (error) {
      console.error("Email verification error:", error);
      res.status(500).json({ message: "Email verification failed" });
    }
  });

  // Resend verification email
  app.post("/api/resend-verification", authenticateToken, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (user.emailVerified) {
        return res.status(400).json({ message: "Email already verified" });
      }

      // Generate new verification token
      const verificationToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      await storage.updateVerificationToken(user.id, verificationToken);

      // Send verification email
      const { sendVerificationEmail } = await import('./emailService');
      await sendVerificationEmail({
        userEmail: user.email,
        userName: user.fullName,
        verificationToken,
      });

      res.json({ message: "Verification email sent" });
    } catch (error) {
      console.error("Resend verification error:", error);
      res.status(500).json({ message: "Failed to resend verification email" });
    }
  });

  app.patch("/api/profile", authenticateToken, async (req: any, res) => {
    try {
      const { fullName, email, phone, bio, website } = req.body;
      const updatedUser = await storage.updateUser(req.user.id, {
        fullName,
        email,
        phone,
        bio,
        website,
      });
      res.json(updatedUser);
    } catch (error) {
      console.error("Profile update error:", error);
      res.status(400).json({ message: "Failed to update profile" });
    }
  });

  app.patch("/api/auth/password", authenticateToken, async (req: any, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      const user = await storage.getUserById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await storage.updateUser(req.user.id, { password: hashedPassword });
      
      res.json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Password update error:", error);
      res.status(400).json({ message: "Failed to update password" });
    }
  });

  // Dashboard analytics
  app.get("/api/dashboard/analytics", authenticateToken, async (req: any, res) => {
    try {
      const analytics = await storage.getDashboardAnalytics(req.user.id);
      res.json(analytics);
    } catch (error) {
      console.error("Analytics error:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Categories routes
  app.get("/api/categories", authenticateToken, async (req: any, res) => {
    try {
      const categories = await storage.getUserCategories(req.user.id);
      res.json(categories);
    } catch (error) {
      console.error("Categories fetch error:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", authenticateToken, async (req: any, res) => {
    try {
      const categoryData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(req.user.id, categoryData);
      res.json(category);
    } catch (error) {
      console.error("Category creation error:", error);
      res.status(400).json({ message: "Failed to create category" });
    }
  });

  app.delete("/api/categories/:id", authenticateToken, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCategory(id);
      res.json({ message: "Category deleted successfully" });
    } catch (error) {
      console.error("Category deletion error:", error);
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // Courses routes
  app.get("/api/courses", authenticateToken, async (req: any, res) => {
    try {
      const courses = await storage.getUserCourses(req.user.id);
      res.json(courses);
    } catch (error) {
      console.error("Courses fetch error:", error);
      res.status(500).json({ message: "Failed to fetch courses" });
    }
  });

  app.post("/api/courses", authenticateToken, async (req: any, res) => {
    try {
      // Check KYC status before allowing course creation
      const user = await storage.getUserById(req.user.id);
      if (!user || user.kycStatus !== 'approved') {
        return res.status(403).json({ 
          message: "KYC approval required to create products", 
          kycStatus: user?.kycStatus || 'pending',
          requiresKyc: true 
        });
      }

      // Map frontend fields to backend schema
      const mappedData = {
        title: req.body.title,
        description: req.body.description,
        price: req.body.price,
        thumbnailUrl: req.body.thumbnailUrl || "",
        salesPageContent: req.body.salesPageContent || "",
        category: req.body.category,
        refundPeriod: req.body.refundPeriod,
        allowsAffiliates: req.body.allowsAffiliates || false,
        defaultAffiliateCommission: req.body.defaultAffiliateCommission || 0,
      };
      
      const courseData = insertCourseSchema.parse(mappedData);
      const course = await storage.createCourse(req.user.id, courseData);
      res.json(course);
    } catch (error) {
      console.error("Course creation error:", error);
      res.status(400).json({ message: "Failed to create course" });
    }
  });

  app.get("/api/courses/:id", authenticateToken, async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const course = await storage.getCourseById(courseId);
      
      if (!course || course.userId !== req.user.id) {
        return res.status(404).json({ message: "Course not found" });
      }

      res.json(course);
    } catch (error) {
      console.error("Course fetch error:", error);
      res.status(500).json({ message: "Failed to fetch course" });
    }
  });

  app.put("/api/courses/:id", authenticateToken, async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const courseData = insertCourseSchema.parse(req.body);
      
      // Verify course ownership
      const existingCourse = await storage.getCourseById(courseId);
      if (!existingCourse || existingCourse.userId !== req.user.id) {
        return res.status(404).json({ message: "Course not found" });
      }

      // Convert price to string for database storage
      const updateData = {
        title: courseData.title,
        description: courseData.description,
        price: courseData.price.toString(),
        thumbnailUrl: courseData.thumbnailUrl,
        salesPageContent: courseData.salesPageContent,
        category: courseData.category,
        refundPeriod: courseData.refundPeriod,
        allowsAffiliates: courseData.allowsAffiliates,
        defaultAffiliateCommission: courseData.defaultAffiliateCommission?.toString() || "0"
      };

      const updatedCourse = await storage.updateCourse(courseId, updateData);
      res.json(updatedCourse);
    } catch (error) {
      console.error("Course update error:", error);
      res.status(400).json({ message: "Failed to update course" });
    }
  });

  app.patch("/api/courses/:id", authenticateToken, async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.id);
      
      // Verify course ownership
      const existingCourse = await storage.getCourseById(courseId);
      if (!existingCourse || existingCourse.userId !== req.user.id) {
        return res.status(404).json({ message: "Course not found" });
      }

      const updatedCourse = await storage.updateCourse(courseId, req.body);
      res.json(updatedCourse);
    } catch (error) {
      console.error("Course patch error:", error);
      res.status(400).json({ message: "Failed to update course" });
    }
  });

  app.delete("/api/courses/:id", authenticateToken, async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.id);
      
      // Verify course ownership
      const existingCourse = await storage.getCourseById(courseId);
      if (!existingCourse || existingCourse.userId !== req.user.id) {
        return res.status(404).json({ message: "Course not found" });
      }

      await storage.deleteCourse(courseId);
      res.json({ message: "Course deleted successfully" });
    } catch (error) {
      console.error("Course delete error:", error);
      res.status(400).json({ message: "Failed to delete course" });
    }
  });

  // Lessons routes
  app.post("/api/courses/:courseId/lessons", authenticateToken, async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const lessonData = insertLessonSchema.parse(req.body);
      
      // Verify course ownership
      const course = await storage.getCourseById(courseId);
      if (!course || course.userId !== req.user.id) {
        return res.status(404).json({ message: "Course not found" });
      }

      const lesson = await storage.createLesson({
        ...lessonData,
        courseId,
      });
      
      res.json(lesson);
    } catch (error) {
      console.error("Lesson creation error:", error);
      res.status(400).json({ message: "Failed to create lesson" });
    }
  });

  // Sales routes
  app.get("/api/sales", authenticateToken, async (req: any, res) => {
    try {
      const sales = await storage.getUserSales(req.user.id);
      res.json(sales);
    } catch (error) {
      console.error("Sales fetch error:", error);
      res.status(500).json({ message: "Failed to fetch sales" });
    }
  });

  // Top products
  app.get("/api/dashboard/top-products", authenticateToken, async (req: any, res) => {
    try {
      const topProducts = await storage.getTopProducts(req.user.id);
      res.json(topProducts);
    } catch (error) {
      console.error("Top products error:", error);
      res.status(500).json({ message: "Failed to fetch top products" });
    }
  });

  // Recent activities
  app.get("/api/dashboard/recent-activities", authenticateToken, async (req: any, res) => {
    try {
      const activities = await storage.getRecentActivities(req.user.id);
      res.json(activities);
    } catch (error) {
      console.error("Recent activities error:", error);
      res.status(500).json({ message: "Failed to fetch recent activities" });
    }
  });

  // Payment webhook (for Hyperswitch)
  app.post("/api/webhook/payment", async (req, res) => {
    try {
      // Handle Hyperswitch webhook
      const { payment_id, status, amount, metadata } = req.body;
      
      if (status === "succeeded") {
        await storage.updateSaleStatus(payment_id, "completed");
        // Update analytics
        await storage.updateAnalytics(metadata.userId, amount);
      } else if (status === "failed") {
        await storage.updateSaleStatus(payment_id, "failed");
      }

      res.json({ received: true });
    } catch (error) {
      console.error("Webhook error:", error);
      res.status(500).json({ message: "Webhook processing failed" });
    }
  });

  // Sales Links routes
  app.get("/api/sales-links", authenticateToken, async (req: any, res) => {
    try {
      const salesLinks = await storage.getUserSalesLinks(req.user.id);
      res.json(salesLinks);
    } catch (error) {
      console.error("Sales links error:", error);
      res.status(500).json({ message: "Failed to fetch sales links" });
    }
  });

  app.post("/api/sales-links", authenticateToken, async (req: any, res) => {
    try {
      const salesLink = await storage.createSalesLink(req.user.id, req.body);
      res.json(salesLink);
    } catch (error) {
      console.error("Create sales link error:", error);
      res.status(400).json({ message: "Failed to create sales link" });
    }
  });

  app.delete("/api/sales-links/:id", authenticateToken, async (req: any, res) => {
    try {
      await storage.deleteSalesLink(parseInt(req.params.id));
      res.json({ message: "Sales link deleted successfully" });
    } catch (error) {
      console.error("Delete sales link error:", error);
      res.status(400).json({ message: "Failed to delete sales link" });
    }
  });

  // Public checkout route by link ID
  app.get("/api/checkout/:linkId", async (req, res) => {
    try {
      const salesLink = await storage.getSalesLinkByLinkId(req.params.linkId);
      if (!salesLink) {
        return res.status(404).json({ message: "Link not found" });
      }
      res.json(salesLink);
    } catch (error) {
      console.error("Checkout link error:", error);
      res.status(500).json({ message: "Failed to fetch checkout data" });
    }
  });

  // Public product route by slug for direct access
  app.get("/api/product/:slug", async (req, res) => {
    try {
      const course = await storage.getCourseBySlug(req.params.slug);
      if (!course) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json({
        course,
        customTitle: course.title,
        customPrice: course.price,
        linkId: course.slug
      });
    } catch (error) {
      console.error("Product error:", error);
      res.status(500).json({ message: "Failed to fetch product data" });
    }
  });

  // Get user customers
  app.get("/api/customers", authenticateToken, async (req: any, res) => {
    try {
      const customers = await storage.getUserCustomers(req.user.id);
      res.json(customers);
    } catch (error) {
      console.error("Customers error:", error);
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  // Payment processing endpoint for Hyperswitch integration
  app.post("/api/payments/process", async (req: any, res) => {
    try {
      const { amount, currency, customer, paymentMethod, productId, linkId, couponCode } = req.body;

      // Validate required fields
      if (!amount || !currency || !customer || !paymentMethod) {
        return res.status(400).json({ error: "Missing required payment data" });
      }

      // Here you would integrate with Hyperswitch API
      // This is a structure ready for Hyperswitch integration
      const paymentData = {
        amount: amount, // amount in cents
        currency: currency,
        payment_method: {
          type: paymentMethod.type,
          ...(paymentMethod.type === 'credit_card' && {
            card: {
              number: paymentMethod.card.number,
              exp_month: paymentMethod.card.expiryMonth,
              exp_year: paymentMethod.card.expiryYear,
              cvc: paymentMethod.card.cvv,
              cardholder_name: paymentMethod.card.holderName,
            }
          })
        },
        billing: {
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          address: {
            line1: `${customer.address.street}, ${customer.address.number}`,
            line2: customer.address.complement || "",
            city: customer.address.city,
            state: customer.address.state,
            postal_code: customer.address.zipCode,
            country: customer.address.country,
          }
        },
        customer: {
          id: customer.email, // Use email as customer ID
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
        },
        metadata: {
          product_id: productId.toString(),
          link_id: linkId || "",
          platform: "iyuup"
        }
      };

      // TODO: Replace with actual Hyperswitch API call
      // const hyperswitchResponse = await fetch('https://api.hyperswitch.io/payments', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${process.env.HYPERSWITCH_API_KEY}`
      //   },
      //   body: JSON.stringify(paymentData)
      // });

      // For now, simulate payment processing
      const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Determine initial status based on payment method
      const initialStatus = paymentMethod.type === 'pix' ? 'pending' : 'completed';
      
      // Get course details to find the course owner
      const course = await storage.getCourseById(productId);
      if (!course) {
        return res.status(404).json({ error: "Product not found" });
      }

      // Format customer address for storage
      const customerAddress = `${customer.address.street}, ${customer.address.number}${customer.address.complement ? ', ' + customer.address.complement : ''}, ${customer.address.neighborhood}, ${customer.address.city}, ${customer.address.state}, ${customer.address.zipCode}`;

      // Handle coupon usage if provided
      let couponId = null;
      let couponDiscount = "0";
      if (couponCode) {
        const coupon = await storage.getCouponByCode(couponCode);
        if (coupon) {
          couponId = coupon.id;
          // Calculate discount amount
          const orderValue = amount / 100; // Convert back to dollars
          const discountValidation = await storage.validateCoupon(couponCode, orderValue, productId);
          if (discountValidation.valid) {
            couponDiscount = discountValidation.discount.toString();
            // Increment coupon usage counter
            await storage.incrementCouponUsage(coupon.id);
          }
        }
      }

      // Create sale record with pending status initially
      const sale = await storage.createSale({
        courseId: productId,
        userId: course.userId, // Use course owner's ID
        customerName: customer.name,
        customerEmail: customer.email,
        customerAddress: customerAddress,
        amount: (amount / 100).toString(), // Convert back to dollars
        paymentId: paymentId,
        paymentMethod: paymentMethod.type,
        couponId: couponId,
        couponCode: couponCode || null,
        couponDiscount: couponDiscount,
      });

      // Update sale status and analytics for non-PIX payments
      if (initialStatus === 'completed') {
        await storage.updateSaleStatus(paymentId, 'completed');
        await storage.updateAnalytics(course.userId, parseFloat(sale.amount));
      }

      // Simulate different payment responses based on method
      let responseData;
      if (paymentMethod.type === 'pix') {
        responseData = {
          status: "pending",
          payment_id: paymentId,
          pix_code: "00020126580014BR.GOV.BCB.PIX013611111111111-1111-1111-1111-11111111111152040000530398654041.005802BR5925Nome do Recebedor da Co6009SAO PAULO62070503***6304",
          qr_code_url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
        };
      } else {
        responseData = {
          status: "succeeded",
          payment_id: paymentId,
          transaction_id: `txn_${paymentId}`,
        };
      }

      res.json(responseData);
    } catch (error) {
      console.error("Payment processing error:", error);
      res.status(500).json({ error: "Internal server error during payment processing" });
    }
  });

  // Update sale status endpoint
  app.put('/api/sales/:saleId/status', authenticateToken, async (req: any, res) => {
    try {
      const { saleId } = req.params;
      const { status } = req.body;
      const userId = req.user.id;

      // Verify the sale belongs to the authenticated user
      const [sale] = await db.select().from(sales).where(eq(sales.id, parseInt(saleId)));
      if (!sale || sale.userId !== userId) {
        return res.status(404).json({ message: "Sale not found" });
      }

      // Update sale status only if paymentId exists
      if (sale.paymentId) {
        await storage.updateSaleStatus(sale.paymentId, status);
      }

      // Update analytics if changing to completed
      if (status === 'completed' && sale.status !== 'completed') {
        await storage.updateAnalytics(userId, parseFloat(sale.amount));
      }

      res.json({ message: "Sale status updated successfully" });
    } catch (error) {
      console.error("Error updating sale status:", error);
      res.status(500).json({ message: "Failed to update sale status" });
    }
  });

  // User search endpoint
  app.get('/api/users/search', authenticateToken, async (req: any, res) => {
    try {
      const { email } = req.query;
      if (!email) {
        return res.status(400).json({ message: "Email parameter is required" });
      }

      const user = await storage.getUserByEmail(email as string);
      if (user) {
        // Return user without sensitive data
        res.json({
          id: user.id,
          fullName: user.fullName,
          email: user.email
        });
      } else {
        res.status(404).json({ message: "User not found" });
      }
    } catch (error) {
      console.error("Error searching user:", error);
      res.status(500).json({ message: "Failed to search user" });
    }
  });

  // Co-producer endpoints
  app.get('/api/courses/:courseId/coproducers', authenticateToken, async (req: any, res) => {
    try {
      const { courseId } = req.params;
      const coproducers = await storage.getCourseCoProducers(parseInt(courseId));
      res.json(coproducers);
    } catch (error) {
      console.error("Error fetching co-producers:", error);
      res.status(500).json({ message: "Failed to fetch co-producers" });
    }
  });

  app.post('/api/courses/:courseId/coproducers', authenticateToken, async (req: any, res) => {
    try {
      const { courseId } = req.params;
      const { userId, percentage } = req.body;
      const coproducer = await storage.addCourseCoProducer(parseInt(courseId), userId, percentage);
      res.json(coproducer);
    } catch (error) {
      console.error("Error adding co-producer:", error);
      res.status(500).json({ message: "Failed to add co-producer" });
    }
  });

  app.delete('/api/courses/:courseId/coproducers/:coproducerId', authenticateToken, async (req: any, res) => {
    try {
      const { coproducerId } = req.params;
      await storage.removeCourseCoProducer(parseInt(coproducerId));
      res.json({ message: "Co-producer removed successfully" });
    } catch (error) {
      console.error("Error removing co-producer:", error);
      res.status(500).json({ message: "Failed to remove co-producer" });
    }
  });

  // Affiliate endpoints
  app.get('/api/courses/:courseId/affiliates', authenticateToken, async (req: any, res) => {
    try {
      const { courseId } = req.params;
      const affiliates = await storage.getCourseAffiliates(parseInt(courseId));
      res.json(affiliates);
    } catch (error) {
      console.error("Error fetching affiliates:", error);
      res.status(500).json({ message: "Failed to fetch affiliates" });
    }
  });

  app.post('/api/courses/:courseId/affiliates', authenticateToken, async (req: any, res) => {
    try {
      const { courseId } = req.params;
      const { userId, commission } = req.body;
      const affiliate = await storage.addCourseAffiliate(parseInt(courseId), userId, commission);
      res.json(affiliate);
    } catch (error) {
      console.error("Error adding affiliate:", error);
      res.status(500).json({ message: "Failed to add affiliate" });
    }
  });

  app.delete('/api/courses/:courseId/affiliates/:affiliateId', authenticateToken, async (req: any, res) => {
    try {
      const { affiliateId } = req.params;
      await storage.removeCourseAffiliate(parseInt(affiliateId));
      res.json({ message: "Affiliate removed successfully" });
    } catch (error) {
      console.error("Error removing affiliate:", error);
      res.status(500).json({ message: "Failed to remove affiliate" });
    }
  });

  // Settings update endpoint
  app.put('/api/auth/profile', authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { fullName, email, phone } = req.body;
      
      const updatedUser = await storage.updateUser(userId, {
        fullName,
        email,
        phone
      });
      
      res.json({
        id: updatedUser.id,
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        phone: updatedUser.phone
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Send invitation endpoint
  app.post('/api/invitations/send', authenticateToken, async (req: any, res) => {
    try {
      const { email, type, percentage, commission, courseId } = req.body;
      const senderUser = req.user;

      if (!email || !type) {
        return res.status(400).json({ message: "Email and type are required" });
      }

      // Generate unique invitation token
      const invitationToken = crypto.randomBytes(32).toString('hex');
      
      // Set expiration date (7 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      // Store invitation in database
      const invitation = await storage.createPendingInvitation({
        senderUserId: senderUser.id,
        recipientEmail: email,
        courseId: courseId,
        type: type,
        percentage: percentage,
        commission: commission,
        invitationToken: invitationToken,
        expiresAt: expiresAt
      });

      // Get course name if courseId is provided
      let courseName = undefined;
      if (courseId) {
        const course = await storage.getCourseById(courseId);
        courseName = course?.title;
      }

      // Send email using SendGrid
      const { sendInvitationEmail } = await import('./emailService');
      const emailSent = await sendInvitationEmail({
        senderName: senderUser.fullName,
        senderEmail: senderUser.email,
        recipientEmail: email,
        type: type,
        percentage: percentage,
        commission: commission,
        invitationToken: invitationToken,
        courseName: courseName
      });

      if (!emailSent) {
        console.warn('Email sending failed, but invitation was stored in database');
      }

      res.json({ 
        message: "Invitation sent successfully",
        invitationId: invitation.id,
        emailSent: emailSent
      });
    } catch (error) {
      console.error("Error sending invitation:", error);
      res.status(500).json({ message: "Failed to send invitation" });
    }
  });

  // Get pending invitations endpoint
  app.get('/api/courses/:courseId/pending-invitations', authenticateToken, async (req: any, res) => {
    try {
      const { courseId } = req.params;
      const userId = req.user.id;
      const pendingInvitations = await storage.getPendingInvitations(userId, parseInt(courseId));
      res.json(pendingInvitations);
    } catch (error) {
      console.error("Error fetching pending invitations:", error);
      res.status(500).json({ message: "Failed to fetch pending invitations" });
    }
  });

  // Cancel pending invitation endpoint
  app.delete('/api/invitations/:invitationId', authenticateToken, async (req: any, res) => {
    try {
      const { invitationId } = req.params;
      await storage.deletePendingInvitation(parseInt(invitationId));
      res.json({ message: "Invitation cancelled successfully" });
    } catch (error) {
      console.error("Error cancelling invitation:", error);
      res.status(500).json({ message: "Failed to cancel invitation" });
    }
  });

  // Payment configuration endpoints
  app.get('/api/payment-config', authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const config = await storage.getPaymentConfig(userId);
      res.json(config || {});
    } catch (error) {
      console.error("Error fetching payment config:", error);
      res.status(500).json({ message: "Failed to fetch payment configuration" });
    }
  });

  app.patch('/api/payment-config', authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const config = await storage.updatePaymentConfig(userId, req.body);
      res.json(config);
    } catch (error) {
      console.error("Error updating payment config:", error);
      res.status(500).json({ message: "Failed to update payment configuration" });
    }
  });

  // Withdrawals endpoint
  app.get('/api/withdrawals', authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.id;
      // Get completed sales for withdrawal calculation
      const sales = await storage.getUserSales(userId);
      const completedSales = sales.filter(sale => sale.status === 'completed');
      
      // Calculate available balance
      const totalRevenue = completedSales.reduce((sum, sale) => sum + parseFloat(sale.amount), 0);
      const commission = totalRevenue * 0.1; // 10% platform fee (consistent with dashboard)
      const availableBalance = totalRevenue - commission;

      // No withdrawal history yet - this would be a separate table in production
      const withdrawals: any[] = [];

      const response = {
        availableBalance,
        totalRevenue,
        commission,
        withdrawals
      };

      res.json(response);
    } catch (error) {
      console.error("Error fetching withdrawals:", error);
      res.status(500).json({ message: "Failed to fetch withdrawals" });
    }
  });

  // Offers routes
  app.get('/api/offers', authenticateToken, async (req: any, res) => {
    try {
      const offers = await storage.getUserOffers(req.user.id);
      res.json(offers);
    } catch (error) {
      console.error("Error fetching offers:", error);
      res.status(500).json({ message: "Failed to fetch offers" });
    }
  });

  app.post('/api/offers', authenticateToken, async (req: any, res) => {
    try {
      const { insertOfferSchema } = await import("@shared/schema");
      const validatedData = insertOfferSchema.parse(req.body);
      const offer = await storage.createOffer(req.user.id, validatedData);
      res.status(201).json(offer);
    } catch (error) {
      console.error("Error creating offer:", error);
      res.status(500).json({ message: "Failed to create offer" });
    }
  });

  app.put('/api/offers/:id', authenticateToken, async (req: any, res) => {
    try {
      const offerId = parseInt(req.params.id);
      const offer = await storage.updateOffer(offerId, req.body);
      res.json(offer);
    } catch (error) {
      console.error("Error updating offer:", error);
      res.status(500).json({ message: "Failed to update offer" });
    }
  });

  app.delete('/api/offers/:id', authenticateToken, async (req: any, res) => {
    try {
      const offerId = parseInt(req.params.id);
      await storage.deleteOffer(offerId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting offer:", error);
      res.status(500).json({ message: "Failed to delete offer" });
    }
  });

  app.get('/api/offers/link/:linkId', async (req, res) => {
    try {
      const offer = await storage.getOfferByLinkId(req.params.linkId);
      if (!offer) {
        return res.status(404).json({ message: "Offer not found" });
      }
      res.json(offer);
    } catch (error) {
      console.error("Error fetching offer by link:", error);
      res.status(500).json({ message: "Failed to fetch offer" });
    }
  });

  // Coupons routes
  app.get('/api/coupons', authenticateToken, async (req: any, res) => {
    try {
      const coupons = await storage.getUserCoupons(req.user.id);
      res.json(coupons);
    } catch (error) {
      console.error("Error fetching coupons:", error);
      res.status(500).json({ message: "Failed to fetch coupons" });
    }
  });

  app.post('/api/coupons', authenticateToken, async (req: any, res) => {
    try {
      const { insertCouponSchema } = await import("@shared/schema");
      const validatedData = insertCouponSchema.parse(req.body);
      const coupon = await storage.createCoupon(req.user.id, validatedData);
      res.status(201).json(coupon);
    } catch (error) {
      console.error("Error creating coupon:", error);
      res.status(500).json({ message: "Failed to create coupon" });
    }
  });

  app.put('/api/coupons/:id', authenticateToken, async (req: any, res) => {
    try {
      const couponId = parseInt(req.params.id);
      const coupon = await storage.updateCoupon(couponId, req.body);
      res.json(coupon);
    } catch (error) {
      console.error("Error updating coupon:", error);
      res.status(500).json({ message: "Failed to update coupon" });
    }
  });

  app.delete('/api/coupons/:id', authenticateToken, async (req: any, res) => {
    try {
      const couponId = parseInt(req.params.id);
      await storage.deleteCoupon(couponId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting coupon:", error);
      res.status(500).json({ message: "Failed to delete coupon" });
    }
  });

  app.post('/api/coupons/validate', async (req, res) => {
    try {
      const { code, orderValue, courseId } = req.body;
      const validation = await storage.validateCoupon(code, orderValue, courseId);
      res.json(validation);
    } catch (error) {
      console.error("Error validating coupon:", error);
      res.status(500).json({ message: "Failed to validate coupon" });
    }
  });

  // Order Bumps routes
  app.get('/api/order-bumps', authenticateToken, async (req: any, res) => {
    try {
      // Get all order bumps for the user across all courses
      const userCourses = await storage.getUserCourses(req.user.id);
      let allOrderBumps: any[] = [];
      
      for (const course of userCourses) {
        const courseOrderBumps = await storage.getCourseOrderBumps(course.id);
        allOrderBumps = allOrderBumps.concat(courseOrderBumps.map(ob => ({
          ...ob,
          courseName: course.title
        })));
      }
      
      res.json(allOrderBumps);
    } catch (error) {
      console.error("Error fetching order bumps:", error);
      res.status(500).json({ message: "Failed to fetch order bumps" });
    }
  });

  app.get('/api/courses/:courseId/order-bumps', async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const orderBumps = await storage.getCourseOrderBumps(courseId);
      res.json(orderBumps);
    } catch (error) {
      console.error("Error fetching order bumps:", error);
      res.status(500).json({ message: "Failed to fetch order bumps" });
    }
  });

  app.post('/api/order-bumps', authenticateToken, async (req: any, res) => {
    try {
      const { insertOrderBumpSchema } = await import("@shared/schema");
      const validatedData = insertOrderBumpSchema.parse(req.body);
      const orderBump = await storage.createOrderBump(req.user.id, validatedData);
      res.status(201).json(orderBump);
    } catch (error) {
      console.error("Error creating order bump:", error);
      res.status(500).json({ message: "Failed to create order bump" });
    }
  });

  app.put('/api/order-bumps/:id', authenticateToken, async (req: any, res) => {
    try {
      const orderBumpId = parseInt(req.params.id);
      const orderBump = await storage.updateOrderBump(orderBumpId, req.body);
      res.json(orderBump);
    } catch (error) {
      console.error("Error updating order bump:", error);
      res.status(500).json({ message: "Failed to update order bump" });
    }
  });

  app.delete('/api/order-bumps/:id', authenticateToken, async (req: any, res) => {
    try {
      const orderBumpId = parseInt(req.params.id);
      await storage.deleteOrderBump(orderBumpId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting order bump:", error);
      res.status(500).json({ message: "Failed to delete order bump" });
    }
  });



  // UpSells routes
  app.get('/api/courses/:courseId/upsells', authenticateToken, async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const upSells = await storage.getCourseUpSells(courseId);
      res.json(upSells);
    } catch (error) {
      console.error("Error fetching upsells:", error);
      res.status(500).json({ message: "Failed to fetch upsells" });
    }
  });

  app.post('/api/upsells', authenticateToken, async (req: any, res) => {
    try {
      const { insertUpSellSchema } = await import("@shared/schema");
      const validatedData = insertUpSellSchema.parse(req.body);
      const upSell = await storage.createUpSell(req.user.id, validatedData);
      res.status(201).json(upSell);
    } catch (error) {
      console.error("Error creating upsell:", error);
      res.status(500).json({ message: "Failed to create upsell" });
    }
  });

  app.put('/api/upsells/:id', authenticateToken, async (req: any, res) => {
    try {
      const upSellId = parseInt(req.params.id);
      const upSell = await storage.updateUpSell(upSellId, req.body);
      res.json(upSell);
    } catch (error) {
      console.error("Error updating upsell:", error);
      res.status(500).json({ message: "Failed to update upsell" });
    }
  });

  app.delete('/api/upsells/:id', authenticateToken, async (req: any, res) => {
    try {
      const upSellId = parseInt(req.params.id);
      await storage.deleteUpSell(upSellId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting upsell:", error);
      res.status(500).json({ message: "Failed to delete upsell" });
    }
  });

  // KYC Documents routes
  app.get('/api/kyc-documents', authenticateToken, async (req: any, res) => {
    try {
      const documents = await storage.getUserKycDocuments(req.user.id);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching KYC documents:", error);
      res.status(500).json({ message: "Failed to fetch KYC documents" });
    }
  });

  app.post('/api/kyc-documents', authenticateToken, async (req: any, res) => {
    try {
      const { insertKycDocumentSchema } = await import("@shared/schema");
      const validatedData = insertKycDocumentSchema.parse(req.body);
      const document = await storage.createKycDocument(req.user.id, validatedData);
      res.status(201).json(document);
    } catch (error) {
      console.error("Error creating KYC document:", error);
      res.status(500).json({ message: "Failed to create KYC document" });
    }
  });

  app.put('/api/kyc-documents/:id/status', authenticateToken, async (req: any, res) => {
    try {
      const documentId = parseInt(req.params.id);
      const { status, rejectionReason } = req.body;
      await storage.updateKycDocumentStatus(documentId, status, rejectionReason);
      res.json({ message: "Document status updated successfully" });
    } catch (error) {
      console.error("Error updating KYC document status:", error);
      res.status(500).json({ message: "Failed to update document status" });
    }
  });

  // Notifications routes
  app.get('/api/notifications', authenticateToken, async (req: any, res) => {
    try {
      const notifications = await storage.getUserNotifications(req.user.id);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.patch('/api/notifications/:id/read', authenticateToken, async (req: any, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      await storage.markNotificationAsRead(notificationId);
      res.json({ message: "Notification marked as read" });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.patch('/api/affiliate-applications/:id/approve', authenticateToken, async (req: any, res) => {
    try {
      const applicationId = parseInt(req.params.id);
      await storage.approveAffiliateApplication(applicationId, req.user.id);
      res.json({ message: "Application approved successfully" });
    } catch (error: any) {
      console.error("Error approving affiliate application:", error);
      res.status(400).json({ message: error.message || "Failed to approve application" });
    }
  });

  app.patch('/api/affiliate-applications/:id/reject', authenticateToken, async (req: any, res) => {
    try {
      const applicationId = parseInt(req.params.id);
      await storage.rejectAffiliateApplication(applicationId, req.user.id);
      res.json({ message: "Application rejected successfully" });
    } catch (error: any) {
      console.error("Error rejecting affiliate application:", error);
      res.status(400).json({ message: error.message || "Failed to reject application" });
    }
  });

  // Affiliate links routes
  app.post('/api/affiliate-links/generate', authenticateToken, async (req: any, res) => {
    try {
      const { courseId } = req.body;
      
      // Find the affiliate record for this user and course
      const affiliate = await db
        .select()
        .from(courseAffiliates)
        .where(and(
          eq(courseAffiliates.userId, req.user.id),
          eq(courseAffiliates.courseId, courseId)
        ))
        .limit(1);

      if (affiliate.length === 0) {
        return res.status(403).json({ message: "Você não é afiliado deste produto" });
      }

      const linkData = await storage.generateAffiliateLink(affiliate[0].id, courseId);
      res.json(linkData);
    } catch (error: any) {
      console.error("Error generating affiliate link:", error);
      res.status(500).json({ message: "Failed to generate affiliate link" });
    }
  });

  app.get('/api/affiliate-links', authenticateToken, async (req: any, res) => {
    try {
      // Get all affiliate records for this user
      const affiliates = await db
        .select()
        .from(courseAffiliates)
        .where(eq(courseAffiliates.userId, req.user.id));

      const allLinks = [];
      for (const affiliate of affiliates) {
        const links = await storage.getAffiliateLinks(affiliate.id);
        allLinks.push(...links);
      }

      res.json(allLinks);
    } catch (error: any) {
      console.error("Error fetching affiliate links:", error);
      res.status(500).json({ message: "Failed to fetch affiliate links" });
    }
  });

  app.get('/aff/:linkId', async (req, res) => {
    try {
      const { linkId } = req.params;
      
      // Track the click
      await storage.trackAffiliateLinkClick(linkId);
      
      // Get the product information
      const product = await storage.getProductByAffiliateLink(linkId);
      
      if (!product) {
        return res.status(404).json({ message: "Link não encontrado" });
      }

      // Redirect to the product page with affiliate tracking
      res.redirect(`/product/${product.slug}?aff=${linkId}`);
    } catch (error: any) {
      console.error("Error processing affiliate link:", error);
      res.status(500).json({ message: "Erro ao processar link de afiliado" });
    }
  });

  // KYC Routes
  app.post("/api/kyc/submit", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { kycData, documents } = req.body;
      
      await storage.submitKyc(userId, kycData, documents);
      res.json({ message: "KYC submitted successfully" });
    } catch (error: any) {
      console.error("Error submitting KYC:", error);
      res.status(500).json({ message: error.message || "Failed to submit KYC" });
    }
  });

  app.get("/api/kyc/documents", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const documents = await storage.getUserKycDocuments(userId);
      res.json(documents);
    } catch (error: any) {
      console.error("Error fetching KYC documents:", error);
      res.status(500).json({ message: error.message || "Failed to fetch documents" });
    }
  });

  // Admin middleware
  const requireAdmin = async (req: any, res: any, next: any) => {
    try {
      const isAdmin = await storage.checkAdminPermissions(req.user.id);
      if (!isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      next();
    } catch (error) {
      res.status(500).json({ message: "Failed to verify admin permissions" });
    }
  };

  // Middleware to check if user has approved KYC
  const requireApprovedKyc = async (req: any, res: any, next: any) => {
    try {
      const user = await storage.getUserById(req.user.id);
      if (!user || user.kycStatus !== 'approved') {
        return res.status(403).json({ 
          message: "KYC approval required to perform this action", 
          kycStatus: user?.kycStatus || 'pending',
          requiresKyc: true 
        });
      }
      next();
    } catch (error) {
      res.status(500).json({ message: "Error checking KYC status" });
    }
  };

  app.get("/api/admin/kyc/pending", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const pendingUsers = await storage.getPendingKycUsers();
      res.json(pendingUsers);
    } catch (error: any) {
      console.error("Error fetching pending KYC:", error);
      res.status(500).json({ message: error.message || "Failed to fetch pending KYC" });
    }
  });

  app.get("/api/admin/users", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: error.message || "Failed to fetch users" });
    }
  });

  app.get("/api/admin/kyc/documents", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const documents = await storage.getAllKycDocuments();
      res.json(documents);
    } catch (error: any) {
      console.error("Error fetching KYC documents:", error);
      res.status(500).json({ message: error.message || "Failed to fetch documents" });
    }
  });

  app.patch("/api/admin/kyc/:userId/approve", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const adminId = req.user.id;
      
      // Get user data for HyperSwitch customer creation
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Approve KYC in our system
      await storage.approveKyc(userId, adminId);
      
      // Create notification for KYC approval
      await storage.createKycApprovedNotification(userId);
      
      // Create customer in HyperSwitch after KYC approval
      try {
        const hyperswitchCustomerId = `user_${userId}_${Date.now()}`;
        await hyperSwitchService.createCustomer({
          customer_id: hyperswitchCustomerId,
          name: user.fullName,
          email: user.email,
          phone: user.phone,
          description: `Approved KYC customer - User ID: ${userId} - Approved at: ${new Date().toISOString()}`,
        });

        // Update user with HyperSwitch customer ID
        await storage.updateUserHyperswitchId(userId, hyperswitchCustomerId);
        
        console.log(`HyperSwitch customer created for user ${userId}: ${hyperswitchCustomerId}`);
      } catch (hyperswitchError) {
        console.error("Failed to create HyperSwitch customer:", hyperswitchError);
        // Don't fail the KYC approval if HyperSwitch customer creation fails
        // KYC is already approved, HyperSwitch customer can be created later
      }

      res.json({ message: "KYC approved successfully and HyperSwitch customer created" });
    } catch (error: any) {
      console.error("Error approving KYC:", error);
      res.status(500).json({ message: error.message || "Failed to approve KYC" });
    }
  });

  app.patch("/api/admin/kyc/:userId/reject", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const adminId = req.user.id;
      const { reason } = req.body;
      
      await storage.rejectKyc(userId, adminId, reason);
      
      // Create notification for KYC rejection
      await storage.createKycRejectedNotification(userId, reason);
      
      res.json({ message: "KYC rejected successfully" });
    } catch (error: any) {
      console.error("Error rejecting KYC:", error);
      res.status(500).json({ message: error.message || "Failed to reject KYC" });
    }
  });

  app.post("/api/admin/users/create", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const userData = req.body;
      const user = await storage.createAdminUser(userData);
      res.json(user);
    } catch (error: any) {
      console.error("Error creating admin user:", error);
      res.status(500).json({ message: error.message || "Failed to create admin user" });
    }
  });

  app.patch("/api/admin/users/:userId", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const updates = req.body;
      
      const user = await storage.updateUser(userId, updates);
      res.json(user);
    } catch (error: any) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: error.message || "Failed to update user" });
    }
  });

  app.get("/api/admin/documents/:documentId/view", async (req: any, res) => {
    try {
      const documentId = parseInt(req.params.documentId);
      const document = await storage.getKycDocumentById(documentId);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      // Generate a realistic document preview using SVG
      const documentTypeLabel = document.documentType === 'cpf_doc' ? 'Documento CPF' : 
                               document.documentType === 'rg' ? 'RG' :
                               document.documentType === 'cnh' ? 'CNH' :
                               document.documentType === 'comprovante_residencia' ? 'Comprovante de Residência' :
                               document.documentType.toUpperCase();

      const svg = `
        <svg width="600" height="400" xmlns="http://www.w3.org/2000/svg">
          <rect width="600" height="400" fill="#f8f9fa" stroke="#e9ecef" stroke-width="2"/>
          <rect x="20" y="20" width="560" height="60" fill="#007bff" rx="5"/>
          <text x="300" y="50" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="white" text-anchor="middle">
            ${documentTypeLabel}
          </text>
          
          <rect x="40" y="120" width="520" height="200" fill="white" stroke="#dee2e6" stroke-width="1" rx="5"/>
          
          <text x="60" y="150" font-family="Arial, sans-serif" font-size="14" fill="#495057">
            Documento: ${document.fileName}
          </text>
          <text x="60" y="180" font-family="Arial, sans-serif" font-size="14" fill="#495057">
            Tipo: ${documentTypeLabel}
          </text>
          <text x="60" y="210" font-family="Arial, sans-serif" font-size="14" fill="#495057">
            Status: ${document.status === 'pending' ? 'Pendente' : document.status === 'approved' ? 'Aprovado' : 'Rejeitado'}
          </text>
          <text x="60" y="240" font-family="Arial, sans-serif" font-size="14" fill="#495057">
            Enviado em: ${document.createdAt ? new Date(document.createdAt).toLocaleDateString('pt-BR') : 'N/A'}
          </text>
          
          ${document.documentNumber ? `
            <text x="60" y="280" font-family="Arial, sans-serif" font-size="14" fill="#495057">
              Número: ${document.documentNumber}
            </text>
          ` : ''}
          
          <rect x="200" y="280" width="200" height="30" fill="#e9ecef" rx="3"/>
          <text x="300" y="300" font-family="Arial, sans-serif" font-size="12" fill="#6c757d" text-anchor="middle">
            [Conteúdo do Documento]
          </text>
          
          <text x="300" y="360" font-family="Arial, sans-serif" font-size="12" fill="#6c757d" text-anchor="middle">
            Visualização simulada - Sistema real servirá arquivo original
          </text>
        </svg>
      `;

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Documento KYC - ${documentTypeLabel}</title>
          <meta charset="UTF-8">
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 0; 
              padding: 20px; 
              background: #f8f9fa; 
              color: #212529;
            }
            .container { 
              max-width: 800px; 
              margin: 0 auto; 
              background: white; 
              padding: 30px; 
              border-radius: 8px; 
              box-shadow: 0 4px 6px rgba(0,0,0,0.1); 
            }
            .header { 
              text-align: center;
              border-bottom: 2px solid #007bff; 
              padding-bottom: 20px; 
              margin-bottom: 30px; 
            }
            .header h1 {
              color: #007bff;
              margin: 0 0 10px 0;
            }
            .document-viewer {
              text-align: center;
              margin: 30px 0;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin: 30px 0;
            }
            .info-item {
              background: #f8f9fa;
              padding: 15px;
              border-radius: 8px;
              border-left: 4px solid #007bff;
            }
            .info-label {
              font-weight: bold;
              color: #495057;
              margin-bottom: 5px;
            }
            .info-value {
              color: #212529;
            }
            .status-badge {
              display: inline-block;
              padding: 6px 12px;
              border-radius: 20px;
              font-size: 14px;
              font-weight: bold;
            }
            .status-pending { background: #fff3cd; color: #856404; }
            .status-approved { background: #d4edda; color: #155724; }
            .status-rejected { background: #f8d7da; color: #721c24; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Visualização de Documento KYC</h1>
              <p>Sistema de verificação de identidade</p>
            </div>
            
            <div class="document-viewer">
              ${svg}
            </div>
            
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Tipo de Documento</div>
                <div class="info-value">${documentTypeLabel}</div>
              </div>
              
              <div class="info-item">
                <div class="info-label">Nome do Arquivo</div>
                <div class="info-value">${document.fileName}</div>
              </div>
              
              <div class="info-item">
                <div class="info-label">Status</div>
                <div class="info-value">
                  <span class="status-badge status-${document.status}">
                    ${document.status === 'pending' ? 'Pendente' : 
                      document.status === 'approved' ? 'Aprovado' : 'Rejeitado'}
                  </span>
                </div>
              </div>
              
              <div class="info-item">
                <div class="info-label">Data de Envio</div>
                <div class="info-value">
                  ${document.createdAt ? new Date(document.createdAt).toLocaleDateString('pt-BR') : 'N/A'}
                </div>
              </div>
              
              ${document.documentNumber ? `
                <div class="info-item">
                  <div class="info-label">Número do Documento</div>
                  <div class="info-value">${document.documentNumber}</div>
                </div>
              ` : ''}
              
              <div class="info-item">
                <div class="info-label">Caminho do Arquivo</div>
                <div class="info-value">${document.filePath || 'N/A'}</div>
              </div>
            </div>
            
            ${document.rejectionReason ? `
              <div class="info-item" style="margin-top: 20px; border-left-color: #dc3545;">
                <div class="info-label">Motivo da Rejeição</div>
                <div class="info-value" style="color: #dc3545;">${document.rejectionReason}</div>
              </div>
            ` : ''}
          </div>
        </body>
        </html>
      `;
      
      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } catch (error: any) {
      console.error("Error viewing document:", error);
      res.status(500).json({ message: error.message || "Failed to view document" });
    }
  });

  // Affiliate Link Tracking Route
  app.get('/api/affiliate/:linkId', async (req, res) => {
    try {
      const { linkId } = req.params;
      const { redirect } = req.query;
      
      // Get affiliate link details
      const linkResult = await db
        .select({
          affiliateId: affiliateLinks.affiliateId,
          courseId: affiliateLinks.courseId,
        })
        .from(affiliateLinks)
        .leftJoin(courseAffiliates, eq(affiliateLinks.affiliateId, courseAffiliates.id))
        .where(eq(affiliateLinks.linkId, linkId));

      if (linkResult.length === 0) {
        return res.status(404).json({ message: 'Link not found' });
      }

      const link = linkResult[0];
      const sessionId = (req as any).sessionID || (req as any).session?.id || `session_${Date.now()}_${Math.random()}`;

      // Track the click
      await db.insert(affiliateLinkClicks).values({
        linkId,
        affiliateId: link.affiliateId,
        courseId: link.courseId,
        sessionId,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      // Update click count
      await db
        .update(affiliateLinks)
        .set({ clicks: sql`${affiliateLinks.clicks} + 1` })
        .where(eq(affiliateLinks.linkId, linkId));

      // Redirect to course page or specified URL
      const redirectUrl = redirect ? String(redirect) : `/course/${link.courseId}`;
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('Error tracking affiliate link:', error);
      res.status(500).json({ message: 'Failed to track link' });
    }
  });

  // HyperSwitch Payment Routes
  app.post('/api/payments/create-intent', authenticateToken, async (req: any, res) => {
    try {
      const { amount, currency = 'USD', courseId, customerInfo, metadata } = req.body;
      const userId = req.user.id;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ message: 'Valid amount is required' });
      }

      // Get course details and splits
      const course = await storage.getCourseById(courseId);
      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }

      // Get session ID from request (used for affiliate tracking)
      const sessionId = (req as any).sessionID || (req as any).session?.id || `session_${Date.now()}_${Math.random()}`;
      
      // Calculate payment splits for co-creators and affiliates
      const splits = await calculatePaymentSplits(courseId, amount, sessionId);

      // Create customer in payment system if needed
      const customerId = `user_${userId}_${Date.now()}`;
      
      try {
        await hyperSwitchService.createCustomer({
          customer_id: customerId,
          name: customerInfo?.name,
          email: customerInfo?.email,
          phone: customerInfo?.phone,
          description: `Customer for course ${courseId}`,
        });
      } catch (customerError) {
        console.log('Customer may already exist or creation failed:', customerError);
      }

      // Create payment intent with splits
      const paymentIntent = await hyperSwitchService.createPaymentIntent({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        customer_id: customerId,
        description: `Payment for course ${courseId}`,
        metadata: {
          userId,
          courseId,
          sessionId,
          ...metadata,
        },
        splits: splits.length > 0 ? splits : undefined,
        return_url: `${req.protocol}://${req.get('host')}/checkout-success`,
      });

      res.json({
        paymentId: paymentIntent.payment_id,
        clientSecret: paymentIntent.client_secret,
        publishableKey: process.env.HYPERSWITCH_PUBLISHABLE_KEY,
      });
    } catch (error: any) {
      console.error('Error creating payment intent:', error);
      res.status(500).json({ message: error.message || 'Failed to create payment intent' });
    }
  });

  app.post('/api/payments/confirm', authenticateToken, async (req: any, res) => {
    try {
      const { paymentId, paymentMethod, courseId, customerInfo, amount, couponCode } = req.body;
      const userId = req.user.id;

      if (!paymentId || !paymentMethod) {
        return res.status(400).json({ message: 'Payment ID and payment method are required' });
      }

      // Confirm payment with HyperSwitch
      const result = await hyperSwitchService.confirmPayment({
        payment_id: paymentId,
        payment_method: paymentMethod,
        return_url: `${req.protocol}://${req.get('host')}/checkout-success`,
      });

      // If payment is successful, create sale record
      if (result.status === 'succeeded' || result.status === 'requires_capture') {
        // Get session ID and affiliate information for this sale
        const sessionId = (req as any).sessionID || (req as any).session?.id || `session_${Date.now()}_${Math.random()}`;
        const affiliate = await storage.getAffiliateForSale(parseInt(courseId), sessionId);
        
        const affiliateCommission = affiliate ? (amount * affiliate.commission / 100) : 0;

        // Handle coupon usage if provided
        let couponId = null;
        if (couponCode) {
          const coupon = await storage.getCouponByCode(couponCode);
          if (coupon) {
            couponId = coupon.id;
            // Increment coupon usage counter
            await storage.incrementCouponUsage(coupon.id);
          }
        }

        await storage.createSale({
          courseId: parseInt(courseId),
          userId,
          customerEmail: customerInfo.email,
          customerName: customerInfo.name,
          customerAddress: customerInfo.address,
          amount: amount.toString(),
          affiliateId: affiliate?.affiliateId,
          affiliateCommission: affiliateCommission.toString(),
          status: 'completed',
          paymentId: paymentId,
          paymentMethod: paymentMethod.type || 'card',
          couponId: couponId,
          couponCode: couponCode || null,
        });

        // Update affiliate earnings if applicable
        if (affiliate) {
          await db
            .update(affiliateLinks)
            .set({
              sales: sql`${affiliateLinks.sales} + 1`,
              earnings: sql`${affiliateLinks.earnings} + ${affiliateCommission}`,
            })
            .where(and(
              eq(affiliateLinks.courseId, parseInt(courseId)),
              eq(affiliateLinks.affiliateId, affiliate.affiliateId)
            ));
        }

        // Update analytics
        await storage.updateAnalytics(userId, parseFloat(amount));

        // Create notification for sale completion
        const course = await storage.getCourseById(parseInt(courseId));
        if (course) {
          await storage.createNotification({
            userId: course.userId,
            type: 'sale_completed',
            title: 'Nova Venda Realizada',
            message: `Você vendeu o curso "${course.title}" por R$ ${amount.toFixed(2)} para ${customerInfo.name}`,
            isRead: false
          });
        }

        // Trigger webhooks
        const userWebhooks = await storage.getUserWebhooks(userId);
        for (const webhook of userWebhooks) {
          if (webhook.event === 'payment_confirmed' && webhook.isActive) {
            await storage.triggerWebhook(webhook.id, {
              event: 'payment_confirmed',
              payment_id: paymentId,
              amount,
              course_id: courseId,
              customer_email: customerInfo.email,
              customer_name: customerInfo.name,
              payment_method: paymentMethod.type || 'card',
              timestamp: new Date().toISOString(),
            });
          }
        }
      }

      res.json(result);
    } catch (error: any) {
      console.error('Error confirming payment:', error);
      res.status(500).json({ message: error.message || 'Failed to confirm payment' });
    }
  });

  app.get('/api/payments/:paymentId', authenticateToken, async (req: any, res) => {
    try {
      const { paymentId } = req.params;
      const payment = await hyperSwitchService.retrievePayment(paymentId);
      res.json(payment);
    } catch (error: any) {
      console.error('Error retrieving payment:', error);
      res.status(500).json({ message: error.message || 'Failed to retrieve payment' });
    }
  });

  app.post('/api/payments/:paymentId/capture', authenticateToken, async (req: any, res) => {
    try {
      const { paymentId } = req.params;
      const { amount } = req.body;
      
      const result = await hyperSwitchService.capturePayment(paymentId, amount);
      res.json(result);
    } catch (error: any) {
      console.error('Error capturing payment:', error);
      res.status(500).json({ message: error.message || 'Failed to capture payment' });
    }
  });

  app.post('/api/payments/:paymentId/refund', authenticateToken, async (req: any, res) => {
    try {
      const { paymentId } = req.params;
      const { amount, reason } = req.body;
      
      const result = await hyperSwitchService.refundPayment(paymentId, {
        amount,
        reason,
        metadata: { refunded_by: req.user.id },
      });
      
      // Update sale status
      await storage.updateSaleStatus(paymentId, 'refunded');
      
      res.json(result);
    } catch (error: any) {
      console.error('Error refunding payment:', error);
      res.status(500).json({ message: error.message || 'Failed to refund payment' });
    }
  });

  // Webhooks routes
  app.get('/api/webhooks', authenticateToken, async (req: any, res) => {
    try {
      const webhooks = await storage.getUserWebhooks(req.user.id);
      res.json(webhooks);
    } catch (error) {
      console.error("Error fetching webhooks:", error);
      res.status(500).json({ message: "Failed to fetch webhooks" });
    }
  });

  app.post('/api/webhooks', authenticateToken, async (req: any, res) => {
    try {
      const { insertWebhookSchema } = await import("@shared/schema");
      const validatedData = insertWebhookSchema.parse(req.body);
      const webhook = await storage.createWebhook(req.user.id, validatedData);
      res.status(201).json(webhook);
    } catch (error) {
      console.error("Error creating webhook:", error);
      res.status(500).json({ message: "Failed to create webhook" });
    }
  });

  app.put('/api/webhooks/:id', authenticateToken, async (req: any, res) => {
    try {
      const webhookId = parseInt(req.params.id);
      const webhook = await storage.updateWebhook(webhookId, req.body);
      res.json(webhook);
    } catch (error) {
      console.error("Error updating webhook:", error);
      res.status(500).json({ message: "Failed to update webhook" });
    }
  });

  app.delete('/api/webhooks/:id', authenticateToken, async (req: any, res) => {
    try {
      const webhookId = parseInt(req.params.id);
      await storage.deleteWebhook(webhookId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting webhook:", error);
      res.status(500).json({ message: "Failed to delete webhook" });
    }
  });

  // Affiliate system routes
  app.get('/api/affiliate-products', authenticateToken, async (req: any, res) => {
    try {
      const products = await storage.getAffiliateProducts(req.user.id);
      res.json(products);
    } catch (error) {
      console.error("Error fetching affiliate products:", error);
      res.status(500).json({ message: "Failed to fetch affiliate products" });
    }
  });

  app.post('/api/affiliate-applications', authenticateToken, async (req: any, res) => {
    try {
      const { courseId } = req.body;
      await storage.createAffiliateApplication(req.user.id, courseId);
      res.status(201).json({ message: "Application submitted successfully" });
    } catch (error: any) {
      console.error("Error creating affiliate application:", error);
      res.status(400).json({ message: error.message || "Failed to submit application" });
    }
  });

  app.get('/api/courses/:courseId/affiliate-applications', authenticateToken, async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      
      // Verify course ownership
      const course = await storage.getCourseById(courseId);
      if (!course || course.userId !== req.user.id) {
        return res.status(404).json({ message: "Course not found" });
      }

      const applications = await storage.getAffiliateApplications(courseId);
      res.json(applications);
    } catch (error) {
      console.error("Error fetching affiliate applications:", error);
      res.status(500).json({ message: "Failed to fetch applications" });
    }
  });

  app.post('/api/affiliate-applications/:id/approve', authenticateToken, async (req: any, res) => {
    try {
      const applicationId = parseInt(req.params.id);
      await storage.approveAffiliateApplication(applicationId, req.user.id);
      res.json({ message: "Application approved successfully" });
    } catch (error: any) {
      console.error("Error approving affiliate application:", error);
      res.status(400).json({ message: error.message || "Failed to approve application" });
    }
  });

  app.post('/api/affiliate-applications/:id/reject', authenticateToken, async (req: any, res) => {
    try {
      const applicationId = parseInt(req.params.id);
      await storage.rejectAffiliateApplication(applicationId, req.user.id);
      res.json({ message: "Application rejected successfully" });
    } catch (error: any) {
      console.error("Error rejecting affiliate application:", error);
      res.status(400).json({ message: error.message || "Failed to reject application" });
    }
  });

  // Public webhook endpoints for payment processors
  app.post('/webhook/hyperswitch/payment', async (req, res) => {
    try {
      const { event_type, payment_id, status, amount, currency, customer_email, metadata } = req.body;
      
      console.log('Hyperswitch webhook received:', { event_type, payment_id, status });
      
      // Update payment status in database
      if (payment_id) {
        await storage.updateSaleStatus(payment_id, status);
        
        // Trigger user webhooks based on event
        if (status === 'succeeded' && metadata?.user_id) {
          const userWebhooks = await storage.getUserWebhooks(parseInt(metadata.user_id));
          
          for (const webhook of userWebhooks) {
            if (webhook.event === 'payment_confirmed' && webhook.isActive) {
              await storage.triggerWebhook(webhook.id, {
                event: 'payment_confirmed',
                payment_id,
                amount: amount / 100, // Convert from cents
                currency,
                customer_email,
                timestamp: new Date().toISOString()
              });
            }
          }
        }
      }
      
      res.status(200).json({ received: true });
    } catch (error) {
      console.error('Hyperswitch webhook error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  });

  app.post('/webhook/pix/notification', async (req, res) => {
    try {
      const { txid, status, valor, pagador, timestamp } = req.body;
      
      console.log('PIX webhook received:', { txid, status, valor });
      
      // Update payment status
      if (txid) {
        await storage.updateSaleStatus(txid, status);
        
        // Find user and trigger webhooks
        const sales = await storage.getUserSales(1); // You'll need to determine user from txid
        const userSale = sales.find(sale => sale.paymentId === txid);
        
        if (userSale && status === 'approved') {
          const userWebhooks = await storage.getUserWebhooks(userSale.userId);
          
          for (const webhook of userWebhooks) {
            if (webhook.event === 'payment_confirmed' && webhook.isActive) {
              await storage.triggerWebhook(webhook.id, {
                event: 'payment_confirmed',
                transaction_id: txid,
                amount: valor,
                customer_email: pagador?.email,
                payment_method: 'pix',
                timestamp
              });
            }
          }
        }
      }
      
      res.status(200).json({ received: true });
    } catch (error) {
      console.error('PIX webhook error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  });

  app.post('/webhook/boleto/notification', async (req, res) => {
    try {
      const { id, status, amount, payer_email, due_date } = req.body;
      
      console.log('Boleto webhook received:', { id, status, amount });
      
      // Update payment status
      if (id) {
        await storage.updateSaleStatus(id, status);
        
        // Trigger user webhooks
        if (status === 'paid') {
          // You'll need to implement user lookup by payment ID
          const userWebhooks = await storage.getUserWebhooks(1); // Placeholder
          
          for (const webhook of userWebhooks) {
            if (webhook.event === 'payment_confirmed' && webhook.isActive) {
              await storage.triggerWebhook(webhook.id, {
                event: 'payment_confirmed',
                boleto_id: id,
                amount,
                customer_email: payer_email,
                payment_method: 'boleto',
                due_date,
                timestamp: new Date().toISOString()
              });
            }
          }
        }
      }
      
      res.status(200).json({ received: true });
    } catch (error) {
      console.error('Boleto webhook error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  });

  // Generic webhook endpoint for testing
  app.post('/webhook/test', async (req, res) => {
    try {
      console.log('Test webhook received:', req.body);
      res.status(200).json({ 
        received: true, 
        timestamp: new Date().toISOString(),
        data: req.body 
      });
    } catch (error) {
      console.error('Test webhook error:', error);
      res.status(500).json({ error: 'Test webhook failed' });
    }
  });

  // Webhook for course updates
  app.post('/webhook/course/updated', async (req, res) => {
    try {
      const { course_id, user_id, action, course_data } = req.body;
      
      console.log('Course update webhook:', { course_id, user_id, action });
      
      if (user_id) {
        const userWebhooks = await storage.getUserWebhooks(user_id);
        
        for (const webhook of userWebhooks) {
          if (webhook.event === 'product_updated' && webhook.isActive) {
            await storage.triggerWebhook(webhook.id, {
              event: 'product_updated',
              course_id,
              action, // 'created', 'updated', 'deleted'
              course_data,
              timestamp: new Date().toISOString()
            });
          }
        }
      }
      
      res.status(200).json({ received: true });
    } catch (error) {
      console.error('Course webhook error:', error);
      res.status(500).json({ error: 'Course webhook failed' });
    }
  });

  // Webhook for affiliate commissions
  app.post('/webhook/affiliate/commission', async (req, res) => {
    try {
      const { affiliate_id, sale_id, commission_amount, course_id } = req.body;
      
      console.log('Affiliate commission webhook:', { affiliate_id, sale_id, commission_amount });
      
      if (affiliate_id) {
        const userWebhooks = await storage.getUserWebhooks(affiliate_id);
        
        for (const webhook of userWebhooks) {
          if (webhook.event === 'commission_earned' && webhook.isActive) {
            await storage.triggerWebhook(webhook.id, {
              event: 'commission_earned',
              sale_id,
              commission_amount,
              course_id,
              timestamp: new Date().toISOString()
            });
          }
        }
      }
      
      res.status(200).json({ received: true });
    } catch (error) {
      console.error('Affiliate webhook error:', error);
      res.status(500).json({ error: 'Affiliate webhook failed' });
    }
  });

  // HyperSwitch Configuration Test (Public endpoint)
  app.get('/api/test/hyperswitch-config', async (req: any, res) => {
    try {
      // Test basic configuration without making external calls
      const hasApiKey = !!process.env.HYPERSWITCH_API_KEY;
      const hasPublicKey = !!process.env.HYPERSWITCH_PUBLISHABLE_KEY;
      
      if (!hasApiKey || !hasPublicKey) {
        return res.json({
          success: false,
          message: 'HyperSwitch configuration incomplete',
          config: {
            api_key_configured: hasApiKey,
            publishable_key_configured: hasPublicKey
          }
        });
      }

      // Try to create a test customer to verify API connectivity
      const testCustomer = {
        customer_id: `test_customer_${Date.now()}`,
        name: 'Test Customer',
        email: 'test@example.com',
        description: 'Test customer for integration verification'
      };

      const customerResult = await hyperSwitchService.createCustomer(testCustomer);
      
      console.log('HyperSwitch test successful - Customer created:', customerResult.customer_id);
      
      res.json({
        success: true,
        message: 'HyperSwitch integration is working correctly',
        config: {
          api_key_configured: true,
          publishable_key_configured: true,
          api_connectivity: true
        },
        test_customer: {
          customer_id: customerResult.customer_id,
          created: true
        }
      });
    } catch (error: any) {
      console.error('HyperSwitch test failed:', error);
      res.status(500).json({
        success: false,
        message: 'HyperSwitch integration test failed',
        error: error.message,
        details: error.response?.data || null,
        config: {
          api_key_configured: !!process.env.HYPERSWITCH_API_KEY,
          publishable_key_configured: !!process.env.HYPERSWITCH_PUBLISHABLE_KEY,
          api_connectivity: false
        }
      });
    }
  });

  // Notifications API endpoints
  app.post('/api/notifications/mark-read', authenticateToken, async (req: any, res) => {
    try {
      const { notificationId } = req.body;
      await storage.markNotificationAsRead(notificationId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.post('/api/notifications/mark-all-read', authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.id;
      await storage.markAllNotificationsAsRead(userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
