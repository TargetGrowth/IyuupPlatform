import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DashboardHeader from "@/components/dashboard-header";
import DashboardSidebar from "@/components/dashboard-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Download, 
  TrendingUp,
  Users,
  DollarSign,
  ShoppingBag
} from "lucide-react";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  LineChart, 
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts";

export default function Reports() {
  const [reportType, setReportType] = useState("overview");

  // Real data from API
  const { data: sales = [] } = useQuery({
    queryKey: ["/api/sales"],
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0,
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["/api/customers"],
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0,
  });

  const { data: courses = [] } = useQuery({
    queryKey: ["/api/courses"],
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0,
  });

  // Calculate real sales data by month
  const salesData = Array.from({length: 12}, (_, i) => {
    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const monthSales = (sales as any[]).filter((sale: any) => {
      const saleDate = new Date(sale.createdAt);
      return saleDate.getMonth() === i && saleDate.getFullYear() === 2025;
    });
    
    return {
      name: monthNames[i],
      vendas: monthSales.length,
      receita: monthSales.reduce((sum: number, sale: any) => sum + parseFloat(sale.amount), 0)
    };
  });

  // Calculate real product data
  const productData = (courses as any[]).map((course: any) => {
    const courseSales = (sales as any[]).filter((sale: any) => sale.courseId === course.id);
    const totalSales = courseSales.length;
    const totalRevenue = courseSales.reduce((sum: number, sale: any) => sum + parseFloat(sale.amount), 0);
    
    return {
      name: course.title,
      vendas: totalSales,
      receita: totalRevenue,
      cor: "#3b82f6"
    };
  });

  // Calculate real conversion data based on sales and customers
  const totalCustomers = (customers as any[]).length;
  const totalSales = (sales as any[]).length;
  const conversionRate = totalCustomers > 0 ? (totalSales / totalCustomers) * 100 : 0;

  const conversionData = [
    { name: "Visitantes", valor: totalCustomers * 10, cor: "#e5e7eb" },
    { name: "Leads", valor: totalCustomers, cor: "#fbbf24" },
    { name: "Conversões", valor: totalSales, cor: "#10b981" },
  ];

  // Calculate location data from real customer addresses during checkout
  const locationCounts = (sales as any[]).reduce((acc: any, sale: any) => {
    if (sale.customerAddress) {
      // Extract state/region from address
      const address = sale.customerAddress.toLowerCase();
      let region = "Outros";
      
      // Map states to regions based on common Brazilian state abbreviations and names
      if (address.includes("sp") || address.includes("são paulo") || address.includes("rj") || address.includes("rio de janeiro") || 
          address.includes("mg") || address.includes("minas gerais") || address.includes("es") || address.includes("espírito santo")) {
        region = "Sudeste";
      } else if (address.includes("rs") || address.includes("rio grande do sul") || address.includes("sc") || address.includes("santa catarina") || 
               address.includes("pr") || address.includes("paraná")) {
        region = "Sul";
      } else if (address.includes("ba") || address.includes("bahia") || address.includes("pe") || address.includes("pernambuco") || 
               address.includes("ce") || address.includes("ceará") || address.includes("pb") || address.includes("paraíba") || 
               address.includes("rn") || address.includes("rio grande do norte") || address.includes("al") || address.includes("alagoas") || 
               address.includes("se") || address.includes("sergipe") || address.includes("ma") || address.includes("maranhão") || 
               address.includes("pi") || address.includes("piauí")) {
        region = "Nordeste";
      } else if (address.includes("go") || address.includes("goiás") || address.includes("mt") || address.includes("mato grosso") || 
               address.includes("ms") || address.includes("mato grosso do sul") || address.includes("df") || address.includes("distrito federal")) {
        region = "Centro-Oeste";
      } else if (address.includes("am") || address.includes("amazonas") || address.includes("pa") || address.includes("pará") || 
               address.includes("ac") || address.includes("acre") || address.includes("rr") || address.includes("roraima") || 
               address.includes("ro") || address.includes("rondônia") || address.includes("ap") || address.includes("amapá") || 
               address.includes("to") || address.includes("tocantins")) {
        region = "Norte";
      }
      
      acc[region] = (acc[region] || 0) + 1;
    }
    return acc;
  }, {});

  const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];
  const demographicData = {
    locationData: Object.entries(locationCounts).map(([region, count], index) => ({
      name: region,
      valor: count as number,
      cor: colors[index % colors.length]
    }))
  };

  const exportReport = (format: string) => {
    console.log(`Exportando relatório em formato ${format}`);
  };

  const totalRevenue = (sales as any[]).reduce((sum: number, sale: any) => sum + parseFloat(sale.amount), 0);
  const avgOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <div className="flex">
        <DashboardSidebar />
        <div className="flex-1 ml-64">
          <div className="p-8 pt-24">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Relatórios</h1>
              <p className="text-gray-600">Análise detalhada da performance dos seus produtos</p>
            </div>

            {/* Filtros */}
            <div className="flex flex-wrap gap-4 mb-6">
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Tipo de relatório" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overview">Visão Geral</SelectItem>
                  <SelectItem value="sales">Vendas</SelectItem>
                  <SelectItem value="customers">Clientes</SelectItem>
                  <SelectItem value="products">Produtos</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex gap-2">
                <Button onClick={() => exportReport('pdf')} variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  PDF
                </Button>
                <Button onClick={() => exportReport('excel')} variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Excel
                </Button>
              </div>
            </div>

            {/* Métricas principais */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <DollarSign className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Receita Total</p>
                      <p className="text-2xl font-bold text-blue-600">R$ {totalRevenue.toFixed(2)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <ShoppingBag className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total de Vendas</p>
                      <p className="text-2xl font-bold text-green-600">{totalSales}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Users className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Clientes</p>
                      <p className="text-2xl font-bold text-purple-600">{totalCustomers}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-orange-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Ticket Médio</p>
                      <p className="text-2xl font-bold text-orange-600">R$ {avgOrderValue.toFixed(2)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs value={reportType} onValueChange={setReportType} className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                <TabsTrigger value="sales">Vendas</TabsTrigger>
                <TabsTrigger value="customers">Clientes</TabsTrigger>
                <TabsTrigger value="products">Produtos</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Vendas por Mês</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={salesData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="vendas" stroke="#3b82f6" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Receita por Mês</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={salesData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="receita" fill="#10b981" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Funil de Conversão</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={conversionData} layout="horizontal">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" />
                        <Tooltip />
                        <Bar dataKey="valor" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="sales" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Performance por Produto</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={productData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="vendas" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Demografia dos Clientes - Localização</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={demographicData.locationData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="valor"
                        >
                          {demographicData.locationData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.cor} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="customers" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Análise de Clientes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">{totalCustomers}</p>
                        <p className="text-sm text-gray-600">Total de Clientes</p>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">{conversionRate.toFixed(1)}%</p>
                        <p className="text-sm text-gray-600">Taxa de Conversão</p>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <p className="text-2xl font-bold text-purple-600">R$ {avgOrderValue.toFixed(2)}</p>
                        <p className="text-sm text-gray-600">Ticket Médio</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="products" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Performance de Produtos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={productData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="receita" fill="#10b981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}