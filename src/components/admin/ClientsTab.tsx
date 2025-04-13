
import React from "react";
import { Client, Trainer } from "./types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ClientTable from "./ClientTable";

interface ClientsTabProps {
  clients: Client[];
  trainers: Trainer[];
  loadingClients: boolean;
  onEditClient: (client: Client) => void;
}

const ClientsTab = ({
  clients,
  trainers,
  loadingClients,
  onEditClient
}: ClientsTabProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestión de Clientes</CardTitle>
        <CardDescription>
          Gestiona la asignación de entrenadores a los clientes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ClientTable
          clients={clients}
          trainers={trainers}
          loading={loadingClients}
          onEditClient={onEditClient}
        />
      </CardContent>
    </Card>
  );
};

export default ClientsTab;
