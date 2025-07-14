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
import { Card, CardContent } from "../../src/components/ui/card";
import { Search, Plus, User, Star, Phone, Mail } from "lucide-react";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  loyaltyPoints: number;
  tier: "Bronze" | "Silver" | "Gold" | "Platinum";
  preferences: string[];
  allergens: string[];
  favoriteOrders: any[];
  totalSpent: number;
  visitCount: number;
  lastVisit: string;
}

interface CustomerDialogProps {
  open: boolean;
  onClose: () => void;
  onSelectCustomer: (customer: Customer | null) => void;
}

const mockCustomers: Customer[] = [
  {
    id: "1",
    name: "John Doe",
    email: "john@example.com",
    phone: "+1234567890",
    loyaltyPoints: 150,
    tier: "Gold",
    preferences: ["oat_milk", "extra_shot"],
    allergens: [],
    favoriteOrders: [],
    totalSpent: 245.5,
    visitCount: 23,
    lastVisit: "2024-01-15T10:30:00Z",
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane@example.com",
    phone: "+1234567891",
    loyaltyPoints: 75,
    tier: "Silver",
    preferences: ["almond_milk", "sugar_free"],
    allergens: ["milk"],
    favoriteOrders: [],
    totalSpent: 128.75,
    visitCount: 12,
    lastVisit: "2024-01-14T15:45:00Z",
  },
  {
    id: "3",
    name: "Mike Johnson",
    email: "mike@example.com",
    phone: "+1234567892",
    loyaltyPoints: 320,
    tier: "Platinum",
    preferences: ["extra_hot", "double_shot"],
    allergens: [],
    favoriteOrders: [],
    totalSpent: 567.25,
    visitCount: 45,
    lastVisit: "2024-01-16T09:15:00Z",
  },
];

export function CustomerDialog({
  open,
  onClose,
  onSelectCustomer,
}: CustomerDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const filteredCustomers = mockCustomers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm)
  );

  const handleSelectCustomer = (customer: Customer) => {
    onSelectCustomer(customer);
    onClose();
  };

  const handleCreateCustomer = () => {
    if (!newCustomer.name || !newCustomer.email) return;

    const customer: Customer = {
      id: Date.now().toString(),
      name: newCustomer.name,
      email: newCustomer.email,
      phone: newCustomer.phone,
      loyaltyPoints: 0,
      tier: "Bronze",
      preferences: [],
      allergens: [],
      favoriteOrders: [],
      totalSpent: 0,
      visitCount: 0,
      lastVisit: new Date().toISOString(),
    };

    onSelectCustomer(customer);
    onClose();
    setNewCustomer({ name: "", email: "", phone: "" });
    setShowNewCustomerForm(false);
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "Bronze":
        return "bg-amber-100 text-amber-800";
      case "Silver":
        return "bg-gray-100 text-gray-800";
      case "Gold":
        return "bg-yellow-100 text-yellow-800";
      case "Platinum":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Customer</DialogTitle>
          <DialogDescription>
            Choose an existing customer or create a new one
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden">
          {!showNewCustomerForm ? (
            <>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by name, email, or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowNewCustomerForm(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New
                </Button>
              </div>

              <div className="space-y-2 overflow-y-auto max-h-96">
                <Button
                  variant="outline"
                  className="w-full justify-start h-auto p-4 bg-transparent"
                  onClick={() => handleSelectCustomer(null as any)}
                >
                  <User className="h-5 w-5 mr-3" />
                  <div className="text-left">
                    <div className="font-medium">Walk-in Customer</div>
                    <div className="text-sm text-gray-500">
                      No customer account
                    </div>
                  </div>
                </Button>

                {filteredCustomers.map((customer) => (
                  <Card
                    key={customer.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSelectCustomer(customer)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                            {customer.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">{customer.name}</h3>
                              <Badge className={getTierColor(customer.tier)}>
                                {customer.tier}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {customer.email}
                              </div>
                              {customer.phone && (
                                <div className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {customer.phone}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-xs text-gray-400 mt-1">
                              <span>{customer.loyaltyPoints} points</span>
                              <span>{customer.visitCount} visits</span>
                              <span>
                                ${customer.totalSpent.toFixed(2)} spent
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-sm">
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            <span>{customer.favoriteOrders.length}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div>
                <Label htmlFor="customerName">Name *</Label>
                <Input
                  id="customerName"
                  placeholder="Enter customer name"
                  value={newCustomer.name}
                  onChange={(e) =>
                    setNewCustomer((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="customerEmail">Email *</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  placeholder="Enter email address"
                  value={newCustomer.email}
                  onChange={(e) =>
                    setNewCustomer((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="customerPhone">Phone</Label>
                <Input
                  id="customerPhone"
                  type="tel"
                  placeholder="Enter phone number"
                  value={newCustomer.phone}
                  onChange={(e) =>
                    setNewCustomer((prev) => ({
                      ...prev,
                      phone: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => {
              if (showNewCustomerForm) {
                setShowNewCustomerForm(false);
                setNewCustomer({ name: "", email: "", phone: "" });
              } else {
                onClose();
              }
            }}
          >
            {showNewCustomerForm ? "Back" : "Cancel"}
          </Button>
          {showNewCustomerForm && (
            <Button
              onClick={handleCreateCustomer}
              disabled={!newCustomer.name || !newCustomer.email}
            >
              Create Customer
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
