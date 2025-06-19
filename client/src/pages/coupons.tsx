import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Copy, Percent, DollarSign } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import DashboardHeader from "@/components/dashboard-header";
import DashboardSidebar from "@/components/dashboard-sidebar";

interface Coupon {
  id: number;
  courseId: number;
  code: string;
  title: string;
  type: 'percentage' | 'fixed';
  value: string;
  minOrderValue?: string;
  maxDiscount?: string;
  validUntil?: string;
  usageLimit?: number;
  usedCount: number;
  isActive: boolean;
  createdAt: string;
  courseName?: string;
}

export default function Coupons() {
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: coupons, isLoading: couponsLoading } = useQuery({
    queryKey: ['/api/coupons'],
  });

  const { data: courses = [] } = useQuery({
    queryKey: ['/api/courses'],
  });

  const createCouponMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('POST', '/api/coupons', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/coupons'] });
      setIsDialogOpen(false);
      setSelectedCoupon(null);
      toast({
        title: "Sucesso",
        description: "Cupom criado com sucesso!",
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

  const updateCouponMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('PUT', `/api/coupons/${data.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/coupons'] });
      setIsDialogOpen(false);
      setSelectedCoupon(null);
      toast({
        title: "Sucesso",
        description: "Cupom atualizado com sucesso!",
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

  const deleteCouponMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('DELETE', `/api/coupons/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/coupons'] });
      toast({
        title: "Sucesso",
        description: "Cupom excluído com sucesso!",
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
      code: formData.get('code') as string,
      title: formData.get('title') as string,
      type: formData.get('type') as string,
      value: parseFloat(formData.get('value') as string),
      minOrderValue: formData.get('minOrderValue') ? parseFloat(formData.get('minOrderValue') as string) : null,
      maxDiscount: formData.get('maxDiscount') ? parseFloat(formData.get('maxDiscount') as string) : null,
      validUntil: formData.get('validUntil') ? new Date(formData.get('validUntil') as string).toISOString() : null,
      usageLimit: formData.get('usageLimit') ? parseInt(formData.get('usageLimit') as string) : null,
    };

    if (selectedCoupon) {
      updateCouponMutation.mutate({ ...data, id: selectedCoupon.id });
    } else {
      createCouponMutation.mutate(data);
    }
  };

  const handleEdit = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Tem certeza que deseja excluir este cupom?')) {
      deleteCouponMutation.mutate(id);
    }
  };

  const copyCouponCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Código copiado!",
      description: "O código do cupom foi copiado para a área de transferência.",
    });
  };

  const getDiscountDisplay = (coupon: Coupon) => {
    if (coupon.type === 'percentage') {
      return `${parseFloat(coupon.value).toFixed(0)}%`;
    } else {
      return `R$ ${parseFloat(coupon.value).toFixed(2)}`;
    }
  };

  const generateCouponCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  if (couponsLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />
        <DashboardSidebar />
        <div className="ml-64 pt-16">
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Carregando cupons...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Cupons de Desconto</h1>
              <p className="text-gray-600 mt-2">Gerencie cupons promocionais para seus clientes</p>
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setSelectedCoupon(null)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Cupom
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {selectedCoupon ? 'Editar Cupom' : 'Novo Cupom'}
                  </DialogTitle>
                  <DialogDescription>
                    {selectedCoupon ? 'Atualize as informações do cupom' : 'Crie um novo cupom de desconto'}
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="courseId">Produto</Label>
                    <Select name="courseId" defaultValue={selectedCoupon?.courseId?.toString()} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um produto" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.isArray(courses) && courses.map((course: any) => (
                          <SelectItem key={course.id} value={course.id.toString()}>
                            {course.title} - R$ {course.price}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="code">Código do Cupom</Label>
                      <div className="flex gap-2">
                        <Input
                          id="code"
                          name="code"
                          defaultValue={selectedCoupon?.code}
                          placeholder="DESCONTO50"
                          required
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            const input = document.getElementById('code') as HTMLInputElement;
                            if (input) input.value = generateCouponCode();
                          }}
                        >
                          Gerar
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="title">Título</Label>
                      <Input
                        id="title"
                        name="title"
                        defaultValue={selectedCoupon?.title}
                        placeholder="Desconto Black Friday"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="type">Tipo de Desconto</Label>
                      <Select name="type" defaultValue={selectedCoupon?.type || 'percentage'}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">Porcentagem (%)</SelectItem>
                          <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="value">Valor do Desconto</Label>
                      <Input
                        id="value"
                        name="value"
                        type="number"
                        step="0.01"
                        defaultValue={selectedCoupon?.value}
                        placeholder="50"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="minOrderValue">Pedido Mínimo (R$) - Opcional</Label>
                      <Input
                        id="minOrderValue"
                        name="minOrderValue"
                        type="number"
                        step="0.01"
                        defaultValue={selectedCoupon?.minOrderValue}
                        placeholder="100.00"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="maxDiscount">Desconto Máximo (R$) - Opcional</Label>
                      <Input
                        id="maxDiscount"
                        name="maxDiscount"
                        type="number"
                        step="0.01"
                        defaultValue={selectedCoupon?.maxDiscount}
                        placeholder="50.00"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="validUntil">Válido até (opcional)</Label>
                      <Input
                        id="validUntil"
                        name="validUntil"
                        type="datetime-local"
                        defaultValue={selectedCoupon?.validUntil ? new Date(selectedCoupon.validUntil).toISOString().slice(0, 16) : ''}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="usageLimit">Limite de uso (opcional)</Label>
                      <Input
                        id="usageLimit"
                        name="usageLimit"
                        type="number"
                        defaultValue={selectedCoupon?.usageLimit}
                        placeholder="100"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">
                      {selectedCoupon ? 'Atualizar Cupom' : 'Criar Cupom'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-6">
            {Array.isArray(coupons) && coupons.length > 0 ? (
              coupons.map((coupon: Coupon) => (
                <Card key={coupon.id} className="border border-gray-200">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl flex items-center gap-2">
                          <span className="font-mono bg-gray-100 px-2 py-1 rounded text-sm">
                            {coupon.code}
                          </span>
                          {coupon.title}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          Cupom de desconto {coupon.type === 'percentage' ? 'percentual' : 'fixo'}
                          {coupon.courseName && (
                            <span className="block text-blue-600 font-medium mt-1">
                              Produto: {coupon.courseName}
                            </span>
                          )}
                        </CardDescription>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={coupon.isActive ? "default" : "secondary"}>
                          {coupon.isActive ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">Desconto</p>
                        <p className="text-lg font-semibold text-green-600 flex items-center">
                          {coupon.type === 'fixed' && (
                            <DollarSign className="w-4 h-4 mr-1" />
                          )}
                          {getDiscountDisplay(coupon)}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-600">Usos</p>
                        <p className="text-lg font-semibold">
                          {coupon.usedCount || 0}{coupon.usageLimit ? ` / ${coupon.usageLimit}` : ''}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-600">Pedido Mínimo</p>
                        <p className="text-lg font-semibold">
                          {coupon.minOrderValue ? `R$ ${parseFloat(coupon.minOrderValue).toFixed(2)}` : 'Sem mínimo'}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-600">Desconto Máximo</p>
                        <p className="text-lg font-semibold">
                          {coupon.maxDiscount ? `R$ ${parseFloat(coupon.maxDiscount).toFixed(2)}` : 'Sem limite'}
                        </p>
                      </div>
                    </div>

                    {coupon.validUntil && (
                      <p className="text-sm text-gray-600 mb-4">
                        Válido até: {new Date(coupon.validUntil).toLocaleDateString('pt-BR')}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyCouponCode(coupon.code)}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copiar Código
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(coupon)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(coupon.id)}
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
                    <h3 className="text-lg font-semibold mb-2">Nenhum cupom criado</h3>
                    <p className="mb-4">Crie seu primeiro cupom de desconto para aumentar as conversões</p>
                    <Button onClick={() => setIsDialogOpen(true)}>
                      Criar primeiro cupom
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