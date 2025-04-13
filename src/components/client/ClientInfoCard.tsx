
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Mail, Phone, Calendar } from "lucide-react";
import { Client } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface ClientInfoCardProps {
  client: Client;
}

const ClientInfoCard: React.FC<ClientInfoCardProps> = ({ client }) => {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Información del Cliente</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center mb-6">
          <Avatar className="h-24 w-24 mb-4">
            {client.avatar ? (
              <AvatarImage src={client.avatar} alt={client.name} />
            ) : (
              <AvatarFallback className="text-lg">
                {getInitials(client.name)}
              </AvatarFallback>
            )}
          </Avatar>
          <h2 className="text-xl font-semibold">{client.name}</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-start">
            <Mail className="h-5 w-5 mr-3 text-gray-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-500">Email</p>
              <p>{client.email}</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <Calendar className="h-5 w-5 mr-3 text-gray-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-500">Cliente desde</p>
              <p>{formatDistanceToNow(new Date(client.created_at), { 
                addSuffix: true,
                locale: es
              })}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClientInfoCard;
