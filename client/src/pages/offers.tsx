import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, ExternalLink, Edit, Trash2, Copy } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import DashboardHeader from "@/components/dashboard-header";
import DashboardSidebar from "@/components/dashboard-sidebar";

interface Offer {
  id: number;
  courseId: number;
  title: string;
  description?: string;
  originalPrice: string;
  salePrice: string;
  linkId: string;
  validUntil?: string;
  maxUses?: number;
  currentUses: number;
  isActive: boolean;
  courseName: string;
  createdAt: string;
}

interface Course {
  id: number;
  title: string;
  price: string;
}

export default function Offers() {
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: offers, isLoading: offersLoading } = useQuery({
    queryKey: ['/api/offers'],
  });

  const { data: courses } = useQuery({
    queryKey: ['/api/courses'],
  });

  const createOfferMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('POST', '/api/offers', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/offers'] });
      setIsDialogOpen(false);
      setSelectedOffer(null);
      toast({
        title: "Sucesso",
        description: "Oferta criada com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateOfferMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('PUT', `/api/offers/${data.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/offers'] });
      setIsDialogOpen(false);
      setSelectedOffer(null);
      toast({
        title: "Sucesso",
        description: "Oferta atualizada com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteOfferMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('DELETE', `/api/offers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/offers'] });
      toast({
        title: "Sucesso",
        description: "Oferta excluída com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data = {
      courseId: parseInt(formData.get('courseId') as string),
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      originalPrice: formData.get('originalPrice') as string,
      salePrice: formData.get('salePrice') as string,
      validUntil: formData.get('validUntil') ? new Date(formData.get('validUntil') as string).toISOString() : null,
      maxUses: formData.get('maxUses') ? parseInt(formData.get('maxUses') as string) : null,
    };

    if (selectedOffer) {
      updateOfferMutation.mutate({ ...data, id: selectedOffer.id });
    } else {
      createOfferMutation.mutate(data);
    }
  };

  const handleEdit = (offer: Offer) => {
    setSelectedOffer(offer);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Tem certeza que deseja excluir esta oferta?')) {
      deleteOfferMutation.mutate(id);
    }
  };

  const copyLink = (linkId: string) => {
    const link = `${window.location.origin}/checkout/${linkId}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link copiado!",
      description: "O link da oferta foi copiado para a área de transferência.",
    });
  };

  const openLink = (linkId: string) => {
    const link = `${window.location.origin}/checkout/${linkId}`;
    window.open(link, '_blank');
  };

  if (offersLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />
        <DashboardSidebar />
        <div className="ml-64 pt-16">
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Carregando ofertas...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <DashboardSidebar />
      <div className="ml-64 pt-16">
        <div className="container mx-auto p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Ofertas Especiais</h1>
              <p className="text-gray-600 mt-2">Crie ofertas com preços promocionais para seus cursos</p>
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setSelectedOffer(null)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Oferta
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {selectedOffer ? 'Editar Oferta' : 'Nova Oferta'}
                  </DialogTitle>
                  <DialogDescription>
                    {selectedOffer ? 'Atualize os dados da oferta especial' : 'Crie uma nova oferta com preço promocional'}
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="courseId">Curso</Label>
                      <Select name="courseId" defaultValue={selectedOffer?.courseId.toString()}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um curso" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.isArray(courses) && courses.map((course: Course) => (
                            <SelectItem key={course.id} value={course.id.toString()}>
                              {course.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="title">Título da Oferta</Label>
                      <Input
                        id="title"
                        name="title"
                        defaultValue={selectedOffer?.title}
                        placeholder="Ex: Oferta Black Friday"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      name="description"
                      defaultValue={selectedOffer?.description}
                      placeholder="Descreva a oferta especial..."
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="originalPrice">Preço Original (R$)</Label>
                      <Input
                        id="originalPrice"
                        name="originalPrice"
                        type="number"
                        step="0.01"
                        defaultValue={selectedOffer?.originalPrice}
                        placeholder="297.00"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="salePrice">Preço Promocional (R$)</Label>
                      <Input
                        id="salePrice"
                        name="salePrice"
                        type="number"
                        step="0.01"
                        defaultValue={selectedOffer?.salePrice}
                        placeholder="197.00"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="validUntil">Válida até (opcional)</Label>
                      <Input
                        id="validUntil"
                        name="validUntil"
                        type="datetime-local"
                        defaultValue={selectedOffer?.validUntil ? new Date(selectedOffer.validUntil).toISOString().slice(0, 16) : ''}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="maxUses">Limite de usos (opcional)</Label>
                      <Input
                        id="maxUses"
                        name="maxUses"
                        type="number"
                        defaultValue={selectedOffer?.maxUses}
                        placeholder="100"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">
                      {selectedOffer ? 'Atualizar Oferta' : 'Criar Oferta'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-6">
            {Array.isArray(offers) && offers.length > 0 ? (
              offers.map((offer: Offer) => (
                <Card key={offer.id} className="border border-gray-200">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">{offer.title}</CardTitle>
                        <CardDescription className="mt-1">
                          Curso: {offer.courseName}
                        </CardDescription>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={offer.isActive ? "default" : "secondary"}>
                          {offer.isActive ? "Ativa" : "Inativa"}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">Preço Original</p>
                        <p className="text-lg font-semibold text-gray-400 line-through">
                          R$ {parseFloat(offer.originalPrice).toFixed(2)}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-600">Preço Promocional</p>
                        <p className="text-lg font-semibold text-green-600">
                          R$ {parseFloat(offer.salePrice).toFixed(2)}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-600">Usos</p>
                        <p className="text-lg font-semibold">
                          {offer.currentUses}{offer.maxUses ? ` / ${offer.maxUses}` : ''}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-600">Desconto</p>
                        <p className="text-lg font-semibold text-red-600">
                          {Math.round(((parseFloat(offer.originalPrice) - parseFloat(offer.salePrice)) / parseFloat(offer.originalPrice)) * 100)}% OFF
                        </p>
                      </div>
                    </div>

                    {offer.description && (
                      <p className="text-gray-700 mb-4">{offer.description}</p>
                    )}

                    {offer.validUntil && (
                      <p className="text-sm text-gray-600 mb-4">
                        Válida até: {new Date(offer.validUntil).toLocaleDateString('pt-BR')}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyLink(offer.linkId)}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copiar Link
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openLink(offer.linkId)}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Abrir Link
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(offer)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(offer.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="text-center py-12">
                <CardContent>
                  <div className="text-gray-500">
                    <Plus className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-semibold mb-2">Nenhuma oferta criada</h3>
                    <p className="mb-4">Crie sua primeira oferta especial para aumentar as vendas</p>
                    <Button onClick={() => setIsDialogOpen(true)}>
                      Criar primeira oferta
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}