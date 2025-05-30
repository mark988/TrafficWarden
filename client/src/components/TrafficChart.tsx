import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface TrafficChartProps {
  hours: number;
}

export default function TrafficChart({ hours }: TrafficChartProps) {
  const { data: chartData, isLoading } = useQuery({
    queryKey: ["/api/dashboard/traffic-chart", { hours }],
  });

  if (isLoading) {
    return (
      <div className="h-[300px] flex items-center justify-center">
        <div className="animate-pulse">
          <div className="h-[300px] w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (!chartData || !chartData.datasets) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
        暂无流量数据
      </div>
    );
  }

  // Transform data for Recharts
  const transformedData = chartData.labels.map((label: string, index: number) => ({
    time: label,
    inbound: chartData.datasets[0].data[index],
    outbound: chartData.datasets[1].data[index],
  }));

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={transformedData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="time" 
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              color: "hsl(var(--card-foreground))",
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="inbound"
            stroke="hsl(var(--chart-1))"
            strokeWidth={2}
            dot={false}
            name="入站流量 (Mbps)"
            activeDot={{ r: 4, fill: "hsl(var(--chart-1))" }}
          />
          <Line
            type="monotone"
            dataKey="outbound"
            stroke="hsl(var(--chart-2))"
            strokeWidth={2}
            dot={false}
            name="出站流量 (Mbps)"
            activeDot={{ r: 4, fill: "hsl(var(--chart-2))" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
