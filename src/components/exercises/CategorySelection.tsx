
import { Category } from "@/types";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface CategorySelectionProps {
  categories: { value: string; label: string }[];
  selectedCategories: Category[];
  onCategoryChange: (category: string, checked: boolean) => void;
}

export const CategorySelection = ({
  categories,
  selectedCategories,
  onCategoryChange,
}: CategorySelectionProps) => {
  return (
    <div className="grid gap-2">
      <Label>Categorías</Label>
      <div className="grid grid-cols-2 gap-2">
        {categories.map((category) => (
          <div className="flex items-center space-x-2" key={category.value}>
            <Checkbox
              id={`category-${category.value}`}
              checked={selectedCategories.includes(category.value)}
              onCheckedChange={(checked) =>
                onCategoryChange(category.value, checked === true)
              }
            />
            <Label htmlFor={`category-${category.value}`}>{category.label}</Label>
          </div>
        ))}
      </div>
    </div>
  );
};
