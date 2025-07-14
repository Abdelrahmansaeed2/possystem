import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Receipt,
  Download,
  Mail,
  Printer,
  Share2,
  Star,
  Clock,
  MapPin,
  User,
  CreditCard,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface OrderItem {
  drinkId: string;
  drinkName: string;
  size: string;
  price: number;
  quantity: number;
  customizations?: string[];
  specialInstructions?: string;
  allergenWarnings?: string[];
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  loyaltyPoints: number;
  tier: "Bronze" | "Silver" | "Gold" | "Platinum";
  preferences: string[];
  allergens: string[];
  favoriteOrders: OrderItem[][];
  totalSpent: number;
  visitCount: number;
  lastVisit: string;
}

interface Order {
  id: string;
  items: OrderItem[];
  total: number;
  subtotal: number;
  tax: number;
  discount: number;
  tip: number;
  timestamp: string;
  status:
    | "pending"
    | "submitted"
    | "preparing"
    | "ready"
    | "completed"
    | "cancelled";
  customer?: Customer;
  paymentMethod?: "cash" | "card" | "digital" | "loyalty_points";
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  baristaId?: string;
  estimatedTime?: number;
  actualTime?: number;
  rating?: number;
  feedback?: string;
  orderType: "dine_in" | "takeaway" | "delivery";
  tableNumber?: number;
  deliveryAddress?: string;
  priority: "normal" | "high" | "urgent";
  source: "pos" | "mobile_app" | "qr_code" | "voice" | "online";
}

interface ReceiptDialogProps {
  open: boolean;
  onClose: () => void;
  order: Order | null;
}

export function ReceiptDialog({ open, onClose, order }: ReceiptDialogProps) {
  const { toast } = useToast();

  if (!order) return null;

  const handleDownload = () => {
    toast({
      title: "Receipt Downloaded",
      description: "Receipt has been saved to your downloads folder",
    });
  };

  const handleEmail = () => {
    toast({
      title: "Receipt Emailed",
      description: order.customer
        ? `Receipt sent to ${order.customer.email}`
        : "Please provide email address",
    });
  };

  const handlePrint = () => {
    window.print();
    toast({
      title: "Printing Receipt",
      description: "Receipt is being sent to printer",
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Receipt #${order.id.slice(-6)}`,
        text: `Order total: $${order.total.toFixed(2)}`,
        url: window.location.href,
      });
    } else {
      toast({
        title: "Share Receipt",
        description: "Receipt link copied to clipboard",
      });
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPaymentMethodIcon = (method?: string) => {
    switch (method) {
      case "card":
        return <CreditCard className="h-4 w-4" />;
      case "cash":
        return <span className="text-sm">💵</span>;
      case "digital":
        return <span className="text-sm">📱</span>;
      case "loyalty_points":
        return <Star className="h-4 w-4" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Receipt #{order.id.slice(-6)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Store Header */}
          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold">Café POS Pro</h2>
            <p className="text-sm text-gray-600">123 Coffee Street</p>
            <p className="text-sm text-gray-600">New York, NY 10001</p>
            <p className="text-sm text-gray-600">Phone: (555) 123-4567</p>
          </div>

          <Separator />

          {/* Order Info */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Order #:</span>
              <span className="font-mono">{order.id.slice(-6)}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Date & Time:</span>
              <span className="text-sm">{formatDate(order.timestamp)}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Order Type:</span>
              <div className="flex items-center gap-2">
                {order.orderType === "dine_in" && (
                  <MapPin className="h-4 w-4" />
                )}
                <Badge variant="outline" className="capitalize">
                  {order.orderType.replace("_", " ")}
                </Badge>
              </div>
            </div>

            {order.tableNumber && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Table:</span>
                <span className="font-medium">#{order.tableNumber}</span>
              </div>
            )}

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Status:</span>
              <Badge
                variant={order.status === "completed" ? "default" : "secondary"}
              >
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </Badge>
            </div>

            {order.estimatedTime && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Est. Time:</span>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">{order.estimatedTime} min</span>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Source:</span>
              <Badge variant="outline" className="capitalize">
                {order.source.replace("_", " ")}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Customer Info */}
          {order.customer && (
            <>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="font-medium">Customer Information</span>
                </div>
                <div className="ml-6 space-y-1">
                  <p className="text-sm">{order.customer.name}</p>
                  <p className="text-sm text-gray-600">
                    {order.customer.email}
                  </p>
                  <p className="text-sm text-gray-600">
                    {order.customer.phone}
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{order.customer.tier}</Badge>
                    <span className="text-xs text-gray-600">
                      {order.customer.loyaltyPoints} points
                    </span>
                  </div>
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Order Items */}
          <div className="space-y-3">
            <h3 className="font-medium">Order Items</h3>
            <div className="space-y-2">
              {order.items.map((item, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.quantity}x</span>
                        <span>{item.drinkName}</span>
                      </div>
                      <div className="text-sm text-gray-600 ml-6">
                        {item.size} - ${item.price.toFixed(2)} each
                      </div>
                      {item.customizations &&
                        item.customizations.length > 0 && (
                          <div className="text-xs text-blue-600 ml-6">
                            + {item.customizations.join(", ")}
                          </div>
                        )}
                      {item.specialInstructions && (
                        <div className="text-xs text-gray-500 ml-6 italic">
                          Note: {item.specialInstructions}
                        </div>
                      )}
                      {item.allergenWarnings &&
                        item.allergenWarnings.length > 0 && (
                          <div className="text-xs text-red-600 ml-6">
                            ⚠️ Contains: {item.allergenWarnings.join(", ")}
                          </div>
                        )}
                    </div>
                    <span className="font-medium">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                  {index < order.items.length - 1 && (
                    <div className="border-b border-gray-100 my-2" />
                  )}
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Order Totals */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">Subtotal:</span>
              <span className="text-sm">${order.subtotal.toFixed(2)}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-sm">Tax (8%):</span>
              <span className="text-sm">${order.tax.toFixed(2)}</span>
            </div>

            {order.discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span className="text-sm">Discount:</span>
                <span className="text-sm">-${order.discount.toFixed(2)}</span>
              </div>
            )}

            {order.tip > 0 && (
              <div className="flex justify-between">
                <span className="text-sm">Tip:</span>
                <span className="text-sm">${order.tip.toFixed(2)}</span>
              </div>
            )}

            <Separator />

            <div className="flex justify-between items-center font-bold text-lg">
              <span>Total:</span>
              <span>${order.total.toFixed(2)}</span>
            </div>
          </div>

          <Separator />

          {/* Payment Info */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Payment Method:</span>
              <div className="flex items-center gap-2">
                {getPaymentMethodIcon(order.paymentMethod)}
                <span className="text-sm capitalize">
                  {order.paymentMethod?.replace("_", " ") || "Cash"}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Payment Status:</span>
              <Badge
                variant={
                  order.paymentStatus === "paid" ? "default" : "destructive"
                }
              >
                {order.paymentStatus.charAt(0).toUpperCase() +
                  order.paymentStatus.slice(1)}
              </Badge>
            </div>
          </div>

          {/* Rating & Feedback */}
          {order.rating && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Rating:</span>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < (order.rating || 0)
                            ? "text-yellow-500 fill-current"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                    <span className="text-sm ml-1">{order.rating}/5</span>
                  </div>
                </div>
                {order.feedback && (
                  <div className="text-sm text-gray-600 italic">
                    "{order.feedback}"
                  </div>
                )}
              </div>
            </>
          )}

          <Separator />

          {/* Footer */}
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">
              Thank you for your business!
            </p>
            <p className="text-xs text-gray-500">
              Visit us again soon for more great coffee
            </p>
            {order.customer && (
              <p className="text-xs text-gray-500">
                Points earned: {Math.floor(order.total)} • Total points:{" "}
                {order.customer.loyaltyPoints + Math.floor(order.total)}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-4">
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button variant="outline" size="sm" onClick={handleEmail}>
              <Mail className="h-4 w-4 mr-2" />
              Email
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>

          <Button onClick={onClose} className="w-full">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
