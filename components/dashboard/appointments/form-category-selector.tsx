import { ButtonGroup } from "@/components/ui/button-group";
import { Button } from "@/components/ui/button";
import { MoonIcon, CalendarIcon } from "lucide-react";
import { AppointmentCategory } from "@/types";

type CategorySelectorProps = {
  selectedCategory: AppointmentCategory;
  onCategoryChange: (category: AppointmentCategory) => void;
  disabled?: boolean;
  t: (key: string) => string;
};

/**
 * Category selector component for appointment form.
 * Allows choosing between "other" and "sleep" categories.
 */
export function CategorySelector({
  selectedCategory,
  onCategoryChange,
  disabled,
  t,
}: CategorySelectorProps) {
  return (
    <ButtonGroup className="w-full overflow-x-auto border border-border rounded-none p-0.5">
      <Button
        className="flex-1 gap-2 cursor-pointer rounded-none border-none shadow-none h-9 text-sm"
        variant={selectedCategory === "other" ? "secondary" : "ghost"}
        onClick={() => onCategoryChange("other")}
        disabled={disabled}
      >
        <CalendarIcon className="w-3.5 h-3.5" />
        {t("form.categoryOther")}
      </Button>
      <Button
        className="flex-1 gap-2 cursor-pointer rounded-none border-none shadow-none h-9 text-sm"
        variant={selectedCategory === "sleep" ? "secondary" : "ghost"}
        onClick={() => onCategoryChange("sleep")}
        disabled={disabled}
      >
        <MoonIcon className="w-3.5 h-3.5" />
        {t("form.categorySleep")}
      </Button>
    </ButtonGroup>
  );
}

