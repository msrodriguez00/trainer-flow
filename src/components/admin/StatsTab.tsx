
import React from "react";
import { User } from "./types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import StatsCards from "./StatsCards";

interface StatsTabProps {
  users: User[];
}

const StatsTab = ({ users }: StatsTabProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Estadísticas</CardTitle>
        <CardDescription>
          Vista general de las estadísticas de la plataforma.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <StatsCards users={users} />
      </CardContent>
    </Card>
  );
};

export default StatsTab;
