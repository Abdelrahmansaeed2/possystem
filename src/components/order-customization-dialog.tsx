import { useState } from "react";
import { Button } from "../../src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../src/components/ui/dialog";
import { Label } from "../../src/components/ui/label";
import { Textarea } from "../../src/components/ui/textarea";
import { Badge } from "../../src/components/ui/badge";
import { Checkbox } from "../../src/components/ui/checkbox";
import { Plus, AlertTriangle } from "lucide-react";

interface DrinkOption {
  id: string;
  name: string;
  category: string;
  description: string;
  image: string;
  sizes: {
    size: string;
    price: number;
  }[];
  stock: number;
  lowStockThreshold: number;
  customizations: string[];
  allergens: string[];
  nutritionInfo: {
    calories: number;
    caffeine: number;
    sugar: number;
  };
  rating: number;
  isPopular: boolean;
  isNew: boolean;
  preparationTime: number;
}

interface OrderCustomizationDialogProps {
  open: boolean;
  onClose: () => void;
  drink: DrinkOption | null;
  size: string;
  price: number;
  onAddToOrder: (
    drink: DrinkOption,
    size: string,
    price: number,
    customizations?: string[],
    specialInstructions?: string
  ) => void;
}

export function OrderCustomizationDialog({
  open,
  onClose,
  drink,
  size,
  price,
  onAddToOrder,
}: OrderCustomizationDialogProps) {
  const [selectedCustomizations, setSelectedCustomizations] = useState<
    string[]
  >([]);
  const [specialInstructions, setSpecialInstructions] = useState("");

  if (!drink) return null;

  const handleCustomizationChange = (
    customization: string,
    checked: boolean
  ) => {
    if (checked) {
      setSelectedCustomizations((prev) => [...prev, customization]);
    } else {
      setSelectedCustomizations((prev) =>
        prev.filter((c) => c !== customization)
      );
    }
  };

  const handleAddToOrder = () => {
    onAddToOrder(
      drink,
      size,
      price,
      selectedCustomizations,
      specialInstructions
    );
    setSelectedCustomizations([]);
    setSpecialInstructions("");
    onClose();
  };

  const customizationPrice = selectedCustomizations.length * 0.5; // $0.50 per customization
  const totalPrice = price + customizationPrice;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Customize Your Order</DialogTitle>
          <DialogDescription>
            {drink.name} ({size}) - ${price.toFixed(2)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Drink Info */}
          <div className="flex gap-3">
            <img
              src={drink.image || "/placeholder.svg"}
              alt={drink.name}
              className="w-16 h-16 rounded-lg object-cover"
            />
            <div className="flex-1">
              <h3 className="font-medium">{drink.name}</h3>
              <p className="text-sm text-gray-600">{drink.description}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {drink.preparationTime}min prep
                </Badge>
                <span className="text-xs text-gray-500">
                  {drink.nutritionInfo.calories} cal
                </span>
              </div>
            </div>
          </div>

          {/* Allergen Warning */}
          {drink.allergens.length > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium text-red-800">
                  Allergen Warning
                </span>
              </div>
              <p className="text-sm text-red-700 mt-1">
                Contains: {drink.allergens.join(", ")}
              </p>
            </div>
          )}

          {/* Customizations */}
          {drink.customizations.length > 0 && (
            <div>
              <Label className="text-sm font-medium mb-3 block">
                Customizations (+$0.50 each)
              </Label>
              <div className="space-y-2">
                {drink.customizations.map((customization) => (
                  <div
                    key={customization}
                    className="flex items-center space-x-2"
                  >
                    <Checkbox
                      id={customization}
                      checked={selectedCustomizations.includes(customization)}
                      onCheckedChange={(checked) =>
                        handleCustomizationChange(
                          customization,
                          checked as boolean
                        )
                      }
                    />
                    <Label
                      htmlFor={customization}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {customization}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Special Instructions */}
          <div>
            <Label
              htmlFor="instructions"
              className="text-sm font-medium mb-2 block"
            >
              Special Instructions
            </Label>
            <Textarea
              id="instructions"
              placeholder="Any special requests or notes..."
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              rows={3}
            />
          </div>

          {/* Price Summary */}
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Base Price ({size}):</span>
              <span>${price.toFixed(2)}</span>
            </div>
            {selectedCustomizations.length > 0 && (
              <div className="flex justify-between text-sm">
                <span>Customizations ({selectedCustomizations.length}):</span>
                <span>${customizationPrice.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-medium border-t pt-2">
              <span>Total:</span>
              <span>${totalPrice.toFixed(2)}</span>
            </div>
          </div>

          {/* Selected Customizations Preview */}
          {selectedCustomizations.length > 0 && (
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Selected:
              </Label>
              <div className="flex flex-wrap gap-1">
                {selectedCustomizations.map((customization) => (
                  <Badge
                    key={customization}
                    variant="secondary"
                    className="text-xs"
                  >
                    {customization}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleAddToOrder}>
            <Plus className="h-4 w-4 mr-2" />
            Add to Order (${totalPrice.toFixed(2)})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
