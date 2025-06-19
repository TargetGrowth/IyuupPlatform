import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Courses from "@/pages/courses";
import CreateCourse from "@/pages/create-course";
import Sales from "@/pages/sales";
import Billing from "@/pages/billing";
import Links from "@/pages/links";

import Coupons from "@/pages/coupons";
import AffiliateProducts from "@/pages/affiliate-products";
import KycVerification from "@/pages/kyc-verification";
import AdminPanel from "@/pages/admin-panel";

import Withdrawals from "@/pages/withdrawals";
import Customers from "@/pages/customers";
import Settings from "@/pages/settings";
import Reports from "@/pages/reports";
import Checkout from "@/pages/checkout";
import CheckoutSuccess from "@/pages/checkout-success";
import EmailVerification from "@/pages/email-verification";
import NotFound from "@/pages/not-found";
import Forbidden from "@/pages/forbidden";
import TestHyperSwitch from "@/pages/test-hyperswitch";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-blue"></div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/" component={isAuthenticated ? Dashboard : Landing} />
      <Route path="/login" component={Landing} />
      <Route path="/dashboard" component={isAuthenticated ? Dashboard : Landing} />
      <Route path="/courses" component={isAuthenticated ? Courses : Landing} />
      <Route path="/courses/new" component={isAuthenticated ? CreateCourse : Landing} />
      <Route path="/courses/:id/edit" component={isAuthenticated ? CreateCourse : Landing} />
      <Route path="/sales" component={isAuthenticated ? Sales : Landing} />
      <Route path="/billing" component={isAuthenticated ? Billing : Landing} />
      <Route path="/links" component={isAuthenticated ? Links : Landing} />

      <Route path="/coupons" component={isAuthenticated ? Coupons : Landing} />
      <Route path="/affiliate-products" component={isAuthenticated ? AffiliateProducts : Landing} />
      <Route path="/kyc-verification" component={isAuthenticated ? KycVerification : Landing} />
      <Route path="/admin" component={isAuthenticated ? AdminPanel : Landing} />
      <Route path="/withdrawals" component={isAuthenticated ? Withdrawals : Landing} />
      <Route path="/customers" component={isAuthenticated ? Customers : Landing} />
      <Route path="/settings" component={isAuthenticated ? Settings : Landing} />
      <Route path="/reports" component={isAuthenticated ? Reports : Landing} />
      <Route path="/verify-email" component={EmailVerification} />
      <Route path="/checkout/success" component={CheckoutSuccess} />
      <Route path="/checkout/:linkId" component={Checkout} />
      <Route path="/product/:slug" component={Checkout} />
      <Route path="/test-hyperswitch" component={isAuthenticated ? TestHyperSwitch : Landing} />
      <Route path="/forbidden" component={Forbidden} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
