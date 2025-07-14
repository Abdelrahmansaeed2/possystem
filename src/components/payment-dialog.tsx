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
import { Input } from "../../src/components/ui/input";
import { Label } from "../../src/components/ui/label";
import { Badge } from "../../src/components/ui/badge";
import {
  CreditCard,
  Smartphone,
  DollarSign,
  Gift,
  Loader2,
} from "lucide-react";

interface PaymentDialogProps {
  open: boolean;
  onClose: () => void;
  total: number;
  onPayment: (
    method: "cash" | "card" | "digital" | "loyalty_points"
  ) => Promise<void>;
}

export function PaymentDialog({
  open,
  onClose,
  total,
  onPayment,
}: PaymentDialogProps) {
  const [selectedMethod, setSelectedMethod] = useState<
    "cash" | "card" | "digital" | "loyalty_points"
  >("card");
  const [cashAmount, setCashAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const paymentMethods = [
    {
      id: "card" as const,
      name: "Credit/Debit Card",
      icon: CreditCard,
      description: "Visa, Mastercard, Amex",
    },
    {
      id: "cash" as const,
      name: "Cash",
      icon: DollarSign,
      description: "Physical currency",
    },
    {
      id: "digital" as const,
      name: "Digital Wallet",
      icon: Smartphone,
      description: "Apple Pay, Google Pay",
    },
    {
      id: "loyalty_points" as const,
      name: "Loyalty Points",
      icon: Gift,
      description: "Redeem customer points",
    },
  ];

  const handlePayment = async () => {
    if (selectedMethod === "cash") {
      const cash = Number.parseFloat(cashAmount);
      if (!cash || cash < total) {
        return;
      }
    }

    setIsProcessing(true);
    try {
      await onPayment(selectedMethod);
    } finally {
      setIsProcessing(false);
    }
  };

  const cashChange =
    selectedMethod === "cash" && cashAmount
      ? Math.max(0, Number.parseFloat(cashAmount) - total)
      : 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Process Payment</DialogTitle>
          <DialogDescription>
            Total amount:{" "}
            <span className="font-bold text-lg">${total.toFixed(2)}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium mb-3 block">
              Payment Method
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {paymentMethods.map((method) => {
                const Icon = method.icon;
                return (
                  <Button
                    key={method.id}
                    variant={
                      selectedMethod === method.id ? "default" : "outline"
                    }
                    className="h-auto p-3 flex flex-col items-center gap-2"
                    onClick={() => setSelectedMethod(method.id)}
                  >
                    <Icon className="h-5 w-5" />
                    <div className="text-center">
                      <div className="text-xs font-medium">{method.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {method.description}
                      </div>
                    </div>
                  </Button>
                );
              })}
            </div>
          </div>

          {selectedMethod === "cash" && (
            <div className="space-y-3">
              <div>
                <Label htmlFor="cashAmount">Cash Received</Label>
                <Input
                  id="cashAmount"
                  type="number"
                  step="0.01"
                  min={total}
                  placeholder={`Minimum $${total.toFixed(2)}`}
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                />
              </div>
              {cashChange > 0 && (
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Change Due:</span>
                    <Badge variant="secondary" className="text-lg">
                      ${cashChange.toFixed(2)}
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          )}

          {selectedMethod === "card" && (
            <div className="p-4 bg-blue-50 rounded-lg text-center">
              <CreditCard className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <p className="text-sm text-blue-800">
                Insert, tap, or swipe card
              </p>
            </div>
          )}

          {selectedMethod === "digital" && (
            <div className="p-4 bg-purple-50 rounded-lg text-center">
              <Smartphone className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <p className="text-sm text-purple-800">
                Present device to NFC reader
              </p>
            </div>
          )}

          {selectedMethod === "loyalty_points" && (
            <div className="p-4 bg-amber-50 rounded-lg text-center">
              <Gift className="h-8 w-8 mx-auto mb-2 text-amber-600" />
              <p className="text-sm text-amber-800">
                Points required: {Math.ceil(total * 100)}
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button
            onClick={handlePayment}
            disabled={
              isProcessing ||
              (selectedMethod === "cash" &&
                (!cashAmount || Number.parseFloat(cashAmount) < total))
            }
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              `Process $${total.toFixed(2)}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
