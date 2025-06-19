import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface SalesChartProps {
  analytics?: any;
}

export default function SalesChart({ analytics }: SalesChartProps) {
  const [period, setPeriod] = useState<'7d' | '30d'>('30d');

  // Fetch real sales data from API
  const { data: salesData } = useQuery({
    queryKey: ['/api/sales'],
    refetchOnWindowFocus: false,
  });

  const generateChartData = (): Array<{date: string, vendas: number, fullDate: string}> => {
    const days = period === '7d' ? 7 : 30;
    const today = new Date();
    const chartData: Array<{date: string, vendas: number, fullDate: string}> = [];

    // Create date range
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      
      chartData.push({
        date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        vendas: 0,
        fullDate: dateString
      });
    }

    // Calculate real sales data by date
    if (salesData && Array.isArray(salesData)) {
      salesData.forEach((sale: any) => {
        const saleDate = new Date(sale.createdAt).toISOString().split('T')[0];
        const dataPoint = chartData.find(point => point.fullDate === saleDate);
        if (dataPoint) {
          dataPoint.vendas += parseFloat(sale.amount) || 0;
        }
      });
    }

    return chartData;
  };

  const chartData = generateChartData();

  return (
    <Card className="border border-gray-100">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-800">
            Vendas dos Últimos {period === '30d' ? '30' : '7'} Dias
          </CardTitle>
          <div className="flex space-x-2">
            <Button 
              size="sm" 
              className={period === '30d' ? "bg-primary-blue text-white" : ""}
              variant={period === '30d' ? "default" : "outline"}
              onClick={() => setPeriod('30d')}
            >
              30d
            </Button>
            <Button 
              size="sm" 
              variant={period === '7d' ? "default" : "outline"}
              className={period === '7d' ? "bg-primary-blue text-white" : ""}
              onClick={() => setPeriod('7d')}
            >
              7d
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
              <XAxis 
                dataKey="date" 
                stroke="#6b7280"
                fontSize={12}
                interval="preserveStartEnd"
              />
              <YAxis 
                stroke="#6b7280"
                fontSize={12}
                tickFormatter={(value) => `R$ ${value}`}
              />
              <Tooltip 
                formatter={(value, name) => [`R$ ${value}`, 'Vendas']}
                labelStyle={{ color: '#374151' }}
                contentStyle={{ 
                  backgroundColor: '#f9fafb', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="vendas" 
                stroke="#3b82f6" 
                strokeWidth={3}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
