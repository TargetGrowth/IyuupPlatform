import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const courseSchema = z.object({
  title: z.string().min(3, "Título deve ter pelo menos 3 caracteres"),
  description: z.string().min(10, "Descrição deve ter pelo menos 10 caracteres"),
  price: z.string().min(1, "Preço é obrigatório"),
  thumbnailUrl: z.string().url("URL da imagem deve ser válida").optional().or(z.literal("")),
});

type CourseForm = z.infer<typeof courseSchema>;

interface CourseFormProps {
  onSuccess?: () => void;
}

export default function CourseForm({ onSuccess }: CourseFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CourseForm>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: "",
      description: "",
      price: "",
      thumbnailUrl: "",
    },
  });

  const createCourseMutation = useMutation({
    mutationFn: async (data: CourseForm) => {
      // Convert price to number
      const courseData = {
        ...data,
        price: parseFloat(data.price),
        thumbnailUrl: data.thumbnailUrl || null,
      };
      
      const response = await apiRequest("POST", "/api/courses", courseData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Curso criado com sucesso!",
        description: "Seu novo curso foi adicionado à plataforma.",
      });
      // Invalidate all related queries to refresh dashboard data
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/analytics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/top-products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/recent-activities"] });
      form.reset();
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar curso",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CourseForm) => {
    createCourseMutation.mutate(data);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <Label htmlFor="title">Título do Curso</Label>
        <Input
          id="title"
          {...form.register("title")}
          placeholder="Ex: Curso de Marketing Digital"
          className="mt-1"
        />
        {form.formState.errors.title && (
          <p className="text-sm text-red-600 mt-1">
            {form.formState.errors.title.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          {...form.register("description")}
          placeholder="Descreva o que os alunos aprenderão neste curso..."
          className="mt-1"
          rows={4}
        />
        {form.formState.errors.description && (
          <p className="text-sm text-red-600 mt-1">
            {form.formState.errors.description.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="price">Preço (R$)</Label>
        <Input
          id="price"
          type="number"
          step="0.01"
          min="0"
          {...form.register("price")}
          placeholder="197.00"
          className="mt-1"
        />
        {form.formState.errors.price && (
          <p className="text-sm text-red-600 mt-1">
            {form.formState.errors.price.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="thumbnailUrl">Imagem de Capa (opcional)</Label>
        <Input
          id="thumbnailUrl"
          type="url"
          {...form.register("thumbnailUrl")}
          placeholder="https://exemplo.com/imagem.jpg"
          className="mt-1"
        />
        {form.formState.errors.thumbnailUrl && (
          <p className="text-sm text-red-600 mt-1">
            {form.formState.errors.thumbnailUrl.message}
          </p>
        )}
      </div>

      <div className="flex gap-4">
        <Button
          type="submit"
          className="flex-1 bg-primary-blue hover:bg-blue-700"
          disabled={createCourseMutation.isPending}
        >
          {createCourseMutation.isPending ? "Criando..." : "Criar Curso"}
        </Button>
      </div>
    </form>
  );
}
