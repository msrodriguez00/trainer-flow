
import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface DashboardStatsCardProps {
  title: string;
  value: number | string;
  icon: ReactNode;
}

const DashboardStatsCard = ({ title, value, icon }: DashboardStatsCardProps) => {
  return (
    <Card>
      <CardContent className="p-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
        </div>
        <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
          {icon}
        </div>
      </CardContent>
    </Card>
  );
};

export default DashboardStatsCard;
