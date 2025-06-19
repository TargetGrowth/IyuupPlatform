import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, UserPlus, Star, Activity } from "lucide-react";

interface RecentActivitiesProps {
  activities?: Array<{
    id: number;
    type: string;
    description: string;
    time: string;
    amount?: string;
    rating?: number;
  }>;
  isLoading: boolean;
}

export default function RecentActivities({ activities, isLoading }: RecentActivitiesProps) {
  // Default mock data if no activities
  const defaultActivities = [
    {
      id: 1,
      type: "sale",
      description: 'Nova venda do curso "Marketing Digital"',
      time: "Há 2 minutos",
      amount: "+R$ 197,00",
    },
    {
      id: 2,
      type: "customer",
      description: "Novo cliente se cadastrou",
      time: "Há 15 minutos",
      email: "maria@email.com",
    },
    {
      id: 3,
      type: "review",
      description: "Nova avaliação 5 estrelas",
      time: "Há 1 hora",
      rating: 5,
    },
  ];

  const displayActivities = activities && activities.length > 0 ? activities : defaultActivities;

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "sale":
        return { icon: ShoppingCart, bg: "bg-green-100", color: "text-green-600" };
      case "customer":
        return { icon: UserPlus, bg: "bg-blue-100", color: "text-blue-600" };
      case "review":
        return { icon: Star, bg: "bg-purple-100", color: "text-purple-600" };
      default:
        return { icon: Activity, bg: "bg-gray-100", color: "text-gray-600" };
    }
  };

  if (isLoading) {
    return (
      <Card className="border border-gray-100">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-800">
            Atividades Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center">
                  <div className="bg-gray-200 p-2 rounded-full mr-4 w-10 h-10"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-48"></div>
                    <div className="h-3 bg-gray-200 rounded w-24"></div>
                  </div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-gray-100">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-800">
          Atividades Recentes
        </CardTitle>
      </CardHeader>
      <CardContent>
        {displayActivities.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Nenhuma atividade ainda
            </h3>
            <p className="text-gray-600">
              Suas atividades recentes aparecerão aqui.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayActivities.map((activity) => {
              const { icon: Icon, bg, color } = getActivityIcon(activity.type);
              
              return (
                <div key={activity.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center">
                    <div className={`${bg} p-2 rounded-full mr-4`}>
                      <Icon className={`${color} h-4 w-4`} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">
                        {activity.description}
                      </p>
                      <p className="text-sm text-gray-600">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    {activity.amount && (
                      <span className="font-semibold text-green-600">
                        {activity.amount}
                      </span>
                    )}
                    {activity.type === "customer" && (
                      <span className="text-gray-600 text-sm">
                        maria@email.com
                      </span>
                    )}
                    {activity.rating && (
                      <div className="flex text-yellow-400">
                        {[...Array(activity.rating)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-current" />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
