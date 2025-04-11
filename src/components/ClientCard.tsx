
import { Client } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";

interface ClientCardProps {
  client: Client;
  onEdit?: (client: Client) => void;
  onDelete?: (clientId: string) => void;
}

const ClientCard = ({ client, onEdit, onDelete }: ClientCardProps) => {
  const navigate = useNavigate();

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            <img
              src={client.avatar}
              alt={client.name}
              className="h-10 w-10 rounded-full mr-3"
            />
            <div>
              <CardTitle className="text-lg">{client.name}</CardTitle>
              <p className="text-sm text-gray-500">{client.email}</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-100">
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(client)}>
                  Editar
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  className="text-red-600"
                  onClick={() => onDelete(client.id)}
                >
                  Eliminar
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex justify-end space-x-2 mt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/clients/${client.id}`)}
          >
            Ver detalles
          </Button>
          <Button
            size="sm"
            onClick={() => navigate(`/plans/new?clientId=${client.id}`)}
          >
            Crear plan
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClientCard;
