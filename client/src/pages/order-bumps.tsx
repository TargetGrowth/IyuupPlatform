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
import { Plus, Edit, Trash2, ArrowUp, ArrowDown, Image, Package } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import DashboardHeader from "@/components/dashboard-header";
import DashboardSidebar from "@/components/dashboard-sidebar";

interface OrderBump {
  id: number;
  courseId: number;
  title: string;
  description?: string;
  price: string;
  image?: string;
  order: number;
  isActive: boolean;
  courseName: string;
  createdAt: string;
}

interface Course {
  id: number;
  title: string;
  price: string;
}

export default function OrderBumps() {
  const [selectedOrderBump, setSelectedOrderBump] = useState<OrderBump | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: orderBumps, isLoading: orderBumpsLoading } = useQuery({
    queryKey: ['/api/order-bumps'],
  });

  const { data: courses } = useQuery({
    queryKey: ['/api/courses'],
  });

  const createOrderBumpMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('POST', '/api/order-bumps', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/order-bumps'] });
      setIsDialogOpen(false);
      setSelectedOrderBump(null);
      toast({
        title: "Sucesso",
        description: "Order bump criado com sucesso!",
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

  const updateOrderBumpMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('PUT', `/api/order-bumps/${data.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/order-bumps'] });
      setIsDialogOpen(false);
      setSelectedOrderBump(null);
      toast({
        title: "Sucesso",
        description: "Order bump atualizado com sucesso!",
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

  const deleteOrderBumpMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('DELETE', `/api/order-bumps/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/order-bumps'] });
      toast({
        title: "Sucesso",
        description: "Order bump excluído com sucesso!",
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
      price: parseFloat(formData.get('price') as string),
      image: formData.get('image') as string,
      order: parseInt(formData.get('order') as string) || 0,
    };

    if (selectedOrderBump) {
      updateOrderBumpMutation.mutate({ ...data, id: selectedOrderBump.id });
    } else {
      createOrderBumpMutation.mutate(data);
    }
  };

  const handleEdit = (orderBump: OrderBump) => {
    setSelectedOrderBump(orderBump);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Tem certeza que deseja excluir este order bump?')) {
      deleteOrderBumpMutation.mutate(id);
    }
  };

  const moveOrderBump = async (id: number, direction: 'up' | 'down') => {
    if (!Array.isArray(orderBumps)) return;
    
    const currentIndex = orderBumps.findIndex((ob: OrderBump) => ob.id === id);
    if (currentIndex === -1) return;

    const newOrder = direction === 'up' 
      ? Math.max(0, orderBumps[currentIndex].order - 1)
      : orderBumps[currentIndex].order + 1;

    try {
      await apiRequest('PUT', `/api/order-bumps/${id}`, { order: newOrder });
      queryClient.invalidateQueries({ queryKey: ['/api/order-bumps'] });
      toast({
        title: "Sucesso",
        description: "Ordem do order bump atualizada!",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (orderBumpsLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />
        <DashboardSidebar />
        <div className="ml-64 pt-16">
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Carregando order bumps...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Order Bumps</h1>
              <p className="text-gray-600 mt-2">
                Produtos adicionais oferecidos durante o checkout para aumentar o valor médio do pedido
              </p>
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setSelectedOrderBump(null)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Order Bump
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {selectedOrderBump ? 'Editar Order Bump' : 'Novo Order Bump'}
                  </DialogTitle>
                  <DialogDescription>
                    {selectedOrderBump 
                      ? 'Atualize as informações do order bump' 
                      : 'Crie um novo produto adicional para oferecer durante o checkout'
                    }
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="courseId">Curso Principal</Label>
                      <Select name="courseId" defaultValue={selectedOrderBump?.courseId.toString()}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o curso" />
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
                      <Label htmlFor="title">Título do Produto</Label>
                      <Input
                        id="title"
                        name="title"
                        defaultValue={selectedOrderBump?.title}
                        placeholder="Ex: Ebook Complementar"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      name="description"
                      defaultValue={selectedOrderBump?.description}
                      placeholder="Descreva o produto adicional..."
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="price">Preço (R$)</Label>
                      <Input
                        id="price"
                        name="price"
                        type="number"
                        step="0.01"
                        defaultValue={selectedOrderBump?.price}
                        placeholder="29.90"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="order">Ordem de Exibição</Label>
                      <Input
                        id="order"
                        name="order"
                        type="number"
                        defaultValue={selectedOrderBump?.order || 0}
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="image">URL da Imagem (opcional)</Label>
                    <Input
                      id="image"
                      name="image"
                      type="url"
                      defaultValue={selectedOrderBump?.image}
                      placeholder="https://exemplo.com/imagem.jpg"
                    />
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">
                      {selectedOrderBump ? 'Atualizar Order Bump' : 'Criar Order Bump'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-6">
            {Array.isArray(orderBumps) && orderBumps.length > 0 ? (
              orderBumps
                .sort((a: OrderBump, b: OrderBump) => a.order - b.order)
                .map((orderBump: OrderBump) => (
                  <Card key={orderBump.id} className="border border-gray-200">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex items-start space-x-4">
                          {orderBump.image ? (
                            <img 
                              src={orderBump.image} 
                              alt={orderBump.title}
                              className="w-16 h-16 object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                              <Package className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <CardTitle className="text-xl">{orderBump.title}</CardTitle>
                            <CardDescription className="mt-1">
                              Curso: {orderBump.courseName}
                            </CardDescription>
                            <p className="text-sm text-gray-600 mt-1">
                              Ordem: {orderBump.order}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={orderBump.isActive ? "default" : "secondary"}>
                            {orderBump.isActive ? "Ativo" : "Inativo"}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-600">Preço</p>
                          <p className="text-lg font-semibold text-green-600">
                            R$ {parseFloat(orderBump.price).toFixed(2)}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-600">Criado em</p>
                          <p className="text-lg font-semibold">
                            {new Date(orderBump.createdAt).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-600">Status</p>
                          <p className="text-lg font-semibold">
                            {orderBump.isActive ? "Ativo" : "Inativo"}
                          </p>
                        </div>
                      </div>

                      {orderBump.description && (
                        <p className="text-gray-700 mb-4">{orderBump.description}</p>
                      )}

                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => moveOrderBump(orderBump.id, 'up')}
                        >
                          <ArrowUp className="w-4 h-4 mr-2" />
                          Subir
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => moveOrderBump(orderBump.id, 'down')}
                        >
                          <ArrowDown className="w-4 h-4 mr-2" />
                          Descer
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(orderBump)}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(orderBump.id)}
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
                    <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-semibold mb-2">Nenhum order bump criado</h3>
                    <p className="mb-4">
                      Crie order bumps para oferecer produtos adicionais durante o checkout e aumentar suas vendas
                    </p>
                    <Button onClick={() => setIsDialogOpen(true)}>
                      Criar primeiro order bump
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