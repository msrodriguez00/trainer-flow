
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import MainLayout from "@/components/client/layout/MainLayout";
import { TrainingPlansList } from "@/components/client/dashboard/TrainingPlansList";
import LoadingScreen from "@/components/client/common/LoadingScreen";

const ClientPlans = () => {
  const { isLoading, isClient } = useAuth();
  
  useEffect(() => {
    console.log("ClientPlans page loaded - showing plans for client");
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6">
          <h1 className="text-2xl font-bold text-gray-900">Mis Planes de Entrenamiento</h1>
          
          <div className="grid grid-cols-1 gap-6">
            <TrainingPlansList />
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ClientPlans;
