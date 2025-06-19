import { useQuery } from "@tanstack/react-query";
import DashboardHeader from "@/components/dashboard-header";
import DashboardSidebar from "@/components/dashboard-sidebar";
import MetricsCards from "@/components/metrics-cards";
import SalesChart from "@/components/sales-chart";
import TopProducts from "@/components/top-products";
import RecentActivities from "@/components/recent-activities";
import EmailVerificationBanner from "@/components/email-verification-banner";
import { useAuth } from "@/hooks/useAuth";
import { useKyc } from "@/hooks/useKyc";
import { KycWarning } from "@/components/kyc-warning";
import { Button } from "@/components/ui/button";
import { Plus, Megaphone, BarChart3 } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const { kycStatus, hasSubmittedDocuments, needsKycSubmission } = useKyc();

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ["/api/dashboard/analytics"],
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0,
  });

  const { data: topProducts, isLoading: productsLoading } = useQuery({
    queryKey: ["/api/dashboard/top-products"],
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0,
  });

  const { data: activities, isLoading: activitiesLoading } = useQuery({
    queryKey: ["/api/dashboard/recent-activities"],
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0,
  });

  if (analyticsLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />
        <div className="flex">
          <DashboardSidebar />
          <div className="flex-1 ml-64 p-8">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              <div className="grid grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-32 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <div className="flex">
        <DashboardSidebar />
        
        <div className="flex-1 ml-64 p-8 pt-20">
          {user && <EmailVerificationBanner user={user} />}
          {user && (
            <KycWarning 
              kycStatus={kycStatus} 
              hasSubmittedDocuments={hasSubmittedDocuments} 
            />
          )}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              Bem-vindo de volta, {user?.fullName?.split(' ')[0]}!
            </h2>
            <p className="text-gray-600">
              Aqui está um resumo da performance dos seus produtos
            </p>
          </div>

          <MetricsCards analytics={analytics as any} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <SalesChart analytics={analytics as any} />
            <TopProducts 
              products={topProducts as any} 
              isLoading={productsLoading} 
            />
          </div>

          <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white p-6 h-auto flex flex-col items-center gap-3"
              onClick={() => window.location.href = '/courses/new'}
            >
              <Plus className="h-8 w-8" />
              <div className="text-center">
                <div className="font-semibold">Criar Novo Produto</div>
                <div className="text-sm opacity-90">Adicione um novo curso à sua loja</div>
              </div>
            </Button>

            <Button 
              variant="outline"
              className="p-6 h-auto flex flex-col items-center gap-3 border-2"
              onClick={() => window.location.href = '/links'}
            >
              <Megaphone className="h-8 w-8 text-orange-600" />
              <div className="text-center">
                <div className="font-semibold">Links de Vendas</div>
                <div className="text-sm text-gray-600">Gerencie seus links personalizados</div>
              </div>
            </Button>

            <Button 
              variant="outline"
              className="p-6 h-auto flex flex-col items-center gap-3 border-2"
              onClick={() => window.location.href = '/reports'}
            >
              <BarChart3 className="h-8 w-8 text-green-600" />
              <div className="text-center">
                <div className="font-semibold">Relatórios</div>
                <div className="text-sm text-gray-600">Analise suas vendas em detalhes</div>
              </div>
            </Button>
          </div>

          <RecentActivities 
            activities={activities as any} 
            isLoading={activitiesLoading} 
          />
        </div>
      </div>
    </div>
  );
}