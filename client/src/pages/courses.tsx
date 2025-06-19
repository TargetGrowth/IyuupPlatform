import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import DashboardHeader from "@/components/dashboard-header";
import DashboardSidebar from "@/components/dashboard-sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Eye, Search, Copy, ExternalLink, ShoppingCart, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Course } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { useKyc } from "@/hooks/useKyc";
import { KycWarning } from "@/components/kyc-warning";

export default function Courses() {
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { kycStatus, hasSubmittedDocuments, needsKycSubmission } = useKyc();

  const { data: courses, isLoading } = useQuery({
    queryKey: ["/api/courses"],
  });

  const deleteCourseMutation = useMutation({
    mutationFn: async (courseId: number) => {
      return await apiRequest("DELETE", `/api/courses/${courseId}`);
    },
    onSuccess: () => {
      toast({
        title: "Produto excluído!",
        description: "O produto foi excluído com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/analytics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/top-products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/recent-activities"] });
      setDeleteDialogOpen(false);
      setCourseToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir produto",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDeleteCourse = (course: Course) => {
    setCourseToDelete(course);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (courseToDelete) {
      deleteCourseMutation.mutate(courseToDelete.id);
    }
  };

  const copyProductLink = (slug: string) => {
    const productUrl = `${window.location.origin}/product/${slug}`;
    navigator.clipboard.writeText(productUrl);
    toast({
      title: "Link copiado!",
      description: "O link do produto foi copiado para a área de transferência.",
    });
  };

  const copyCheckoutLink = (courseId: number) => {
    const course = Array.isArray(courses) && courses.find((c: Course) => c.id === courseId);
    if (course) {
      const checkoutUrl = `${window.location.origin}/product/${course.slug}`;
      navigator.clipboard.writeText(checkoutUrl);
      toast({
        title: "Link de checkout copiado!",
        description: "O link de checkout foi copiado para a área de transferência.",
      });
    }
  };

  const filteredCourses = Array.isArray(courses) ? courses.filter((course: Course) => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || 
                         (filterStatus === "active" && course.isActive) ||
                         (filterStatus === "inactive" && !course.isActive);
    return matchesSearch && matchesStatus;
  }) : [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />
        <div className="flex">
          <DashboardSidebar />
          <div className="flex-1 ml-64 p-8">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-64 bg-gray-200 rounded"></div>
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
        
        <div className="flex-1 ml-64 pt-20 p-8">
          {/* KYC Warning */}
          {user && (
            <KycWarning 
              kycStatus={kycStatus} 
              hasSubmittedDocuments={hasSubmittedDocuments} 
            />
          )}

          <div className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-800 mb-2">Meus Produtos</h2>
                <p className="text-gray-600">Gerencie seus produtos e conteúdos digitais</p>
              </div>
              
              <Link href="/courses/new">
                <Button className="bg-primary-blue hover:bg-blue-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Produto
                </Button>
              </Link>
            </div>

            {/* Filtros e Busca */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar produtos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os produtos</SelectItem>
                  <SelectItem value="active">Produtos ativos</SelectItem>
                  <SelectItem value="inactive">Produtos inativos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {filteredCourses && filteredCourses.length === 0 ? (
            <Card className="text-center py-16">
              <CardContent>
                <div className="max-w-md mx-auto">
                  <div className="bg-primary-blue/10 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                    <Plus className="h-12 w-12 text-primary-blue" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    {!Array.isArray(courses) || courses.length === 0 ? "Nenhum produto criado ainda" : "Nenhum produto encontrado"}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {!Array.isArray(courses) || courses.length === 0 
                      ? "Comece criando seu primeiro produto e transforme seu conhecimento em renda."
                      : "Tente ajustar os filtros para encontrar seus produtos."
                    }
                  </p>
                  {(!Array.isArray(courses) || courses.length === 0) && (
                    <Link href="/courses/new">
                      <Button className="bg-primary-blue hover:bg-blue-700">
                        <Plus className="mr-2 h-4 w-4" />
                        Criar Primeiro Produto
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses?.map((course: Course) => (
                <Card key={course.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="aspect-video bg-gradient-to-br from-primary-blue/20 to-secondary-orange/20 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                      {course.thumbnailUrl ? (
                        <img 
                          src={course.thumbnailUrl} 
                          alt={course.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Eye className="h-12 w-12 text-gray-400" />
                      )}
                    </div>
                    <CardTitle className="text-lg line-clamp-2">{course.title}</CardTitle>
                    <p className="text-gray-600 text-sm line-clamp-2">
                      {course.description}
                    </p>
                    {course.category && (
                      <Badge variant="outline" className="w-fit">
                        {course.category}
                      </Badge>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center text-lg font-semibold text-green-600">
                        R$ {parseFloat(course.price).toFixed(2)}
                      </div>
                      <Badge variant={course.isActive ? "default" : "secondary"}>
                        {course.isActive ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => navigate(`/courses/${course.id}/edit`)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => course.salesPageContent && window.open(course.salesPageContent as string, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Ver Página
                        </Button>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => copyProductLink(course.slug)}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copiar Link
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => copyCheckoutLink(course.id)}
                        >
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Checkout
                        </Button>
                      </div>
                      
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        className="w-full"
                        onClick={() => handleDeleteCourse(course)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir Produto
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o produto "{courseToDelete?.title}"? 
              Esta ação não pode ser desfeita e removerá permanentemente:
              <br /><br />
              • O produto e todas suas informações
              • Vendas e estatísticas relacionadas
              • Links de checkout existentes
              • Ofertas e promoções associadas
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setDeleteDialogOpen(false);
                setCourseToDelete(null);
              }}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              disabled={deleteCourseMutation.isPending}
            >
              {deleteCourseMutation.isPending ? "Excluindo..." : "Excluir Produto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
