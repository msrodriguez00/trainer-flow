
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface EmptySearchResultsProps {
  searchTerm: string;
}

const EmptySearchResults = ({ searchTerm }: EmptySearchResultsProps) => {
  const navigate = useNavigate();
  
  return (
    <div className="text-center py-20">
      <h3 className="text-lg font-medium text-gray-900">
        No se encontraron planes
      </h3>
      <p className="text-gray-500 mt-1">
        Intenta con otra búsqueda
      </p>
      {!searchTerm && (
        <Button className="mt-4" onClick={() => navigate("/plans/new")}>
          Crear primer plan
        </Button>
      )}
    </div>
  );
};

export default EmptySearchResults;
