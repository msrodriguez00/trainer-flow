
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface PlansSearchBarProps {
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
}

const PlansSearchBar = ({ searchTerm, onSearchTermChange }: PlansSearchBarProps) => {
  return (
    <div className="mb-6 relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
      <Input
        placeholder="Buscar planes por nombre o cliente..."
        value={searchTerm}
        onChange={(e) => onSearchTermChange(e.target.value)}
        className="pl-10"
      />
    </div>
  );
};

export default PlansSearchBar;
