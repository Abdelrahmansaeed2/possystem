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
import { Badge } from "../../src/components/ui/badge";
import { Card, CardContent } from "../../src/components/ui/card";
import { Progress } from "../../src/components/ui/progress";
import { Gift, Star, Crown, Award, Zap } from "lucide-react";

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

interface LoyaltyRewardsDialogProps {
  open: boolean;
  onClose: () => void;
  customer: Customer | null;
}

const rewards = [
  {
    id: "free-drink",
    name: "Free Drink",
    description: "Any drink up to $6 value",
    pointsCost: 100,
    icon: Gift,
    available: true,
  },
  {
    id: "free-pastry",
    name: "Free Pastry",
    description: "Any pastry or snack",
    pointsCost: 75,
    icon: Star,
    available: true,
  },
  {
    id: "double-points",
    name: "Double Points Day",
    description: "2x points on next visit",
    pointsCost: 50,
    icon: Zap,
    available: true,
  },
  {
    id: "premium-upgrade",
    name: "Premium Upgrade",
    description: "Free size upgrade + premium milk",
    pointsCost: 25,
    icon: Crown,
    available: true,
  },
];

const tierBenefits = {
  Bronze: {
    color: "bg-amber-100 text-amber-800",
    icon: Award,
    benefits: ["Earn 1 point per $1", "Birthday reward"],
    nextTier: "Silver",
    pointsNeeded: 100,
  },
  Silver: {
    color: "bg-gray-100 text-gray-800",
    icon: Star,
    benefits: [
      "Earn 1.25 points per $1",
      "Free drink on birthday",
      "Early access to new items",
    ],
    nextTier: "Gold",
    pointsNeeded: 300,
  },
  Gold: {
    color: "bg-yellow-100 text-yellow-800",
    icon: Crown,
    benefits: [
      "Earn 1.5 points per $1",
      "Free drink monthly",
      "Priority support",
    ],
    nextTier: "Platinum",
    pointsNeeded: 500,
  },
  Platinum: {
    color: "bg-purple-100 text-purple-800",
    icon: Crown,
    benefits: [
      "Earn 2 points per $1",
      "Free drinks weekly",
      "VIP events",
      "Personal barista",
    ],
    nextTier: null,
    pointsNeeded: null,
  },
};

export function LoyaltyRewardsDialog({
  open,
  onClose,
  customer,
}: LoyaltyRewardsDialogProps) {
  const [selectedReward, setSelectedReward] = useState<string | null>(null);

  if (!customer) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Loyalty Rewards</DialogTitle>
            <DialogDescription>
              Please select a customer to view their loyalty rewards
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={onClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  const tierInfo = tierBenefits[customer.tier];
  const TierIcon = tierInfo.icon;
  const progressToNextTier = tierInfo.nextTier
    ? Math.min(
        100,
        (customer.loyaltyPoints / (tierInfo.pointsNeeded || 1)) * 100
      )
    : 100;

  const redeemReward = (rewardId: string) => {
    const reward = rewards.find((r) => r.id === rewardId);
    if (reward && customer.loyaltyPoints >= reward.pointsCost) {
      // In a real app, this would update the customer's points
      console.log(`Redeemed ${reward.name} for ${reward.pointsCost} points`);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Loyalty Rewards</DialogTitle>
          <DialogDescription>
            {customer.name}'s loyalty program status and available rewards
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer Status */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                    {customer.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div>
                    <h3 className="font-semibold">{customer.name}</h3>
                    <div className="flex items-center gap-2">
                      <Badge className={tierInfo.color}>
                        <TierIcon className="h-3 w-3 mr-1" />
                        {customer.tier}
                      </Badge>
                      <span className="text-sm text-gray-600">
                        {customer.loyaltyPoints} points
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">
                    {customer.loyaltyPoints}
                  </div>
                  <div className="text-sm text-gray-500">Available Points</div>
                </div>
              </div>

              {/* Progress to Next Tier */}
              {tierInfo.nextTier && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress to {tierInfo.nextTier}</span>
                    <span>
                      {customer.loyaltyPoints}/{tierInfo.pointsNeeded} points
                    </span>
                  </div>
                  <Progress value={progressToNextTier} className="h-2" />
                </div>
              )}

              {/* Tier Benefits */}
              <div className="mt-4">
                <h4 className="font-medium mb-2">
                  Your {customer.tier} Benefits:
                </h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {tierInfo.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Available Rewards */}
          <div>
            <h3 className="font-semibold mb-4">Available Rewards</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rewards.map((reward) => {
                const RewardIcon = reward.icon;
                const canAfford = customer.loyaltyPoints >= reward.pointsCost;

                return (
                  <Card
                    key={reward.id}
                    className={`cursor-pointer transition-colors ${
                      canAfford ? "hover:bg-gray-50" : "opacity-60"
                    } ${
                      selectedReward === reward.id ? "ring-2 ring-blue-500" : ""
                    }`}
                    onClick={() => canAfford && setSelectedReward(reward.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-2 rounded-lg ${
                            canAfford ? "bg-blue-100" : "bg-gray-100"
                          }`}
                        >
                          <RewardIcon
                            className={`h-5 w-5 ${
                              canAfford ? "text-blue-600" : "text-gray-400"
                            }`}
                          />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{reward.name}</h4>
                          <p className="text-sm text-gray-600 mb-2">
                            {reward.description}
                          </p>
                          <div className="flex items-center justify-between">
                            <Badge
                              variant={canAfford ? "default" : "secondary"}
                            >
                              {reward.pointsCost} points
                            </Badge>
                            {canAfford && (
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  redeemReward(reward.id);
                                }}
                              >
                                Redeem
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <h3 className="font-semibold mb-4">Recent Activity</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <div>
                  <p className="font-medium text-green-800">Points Earned</p>
                  <p className="text-sm text-green-600">Large Latte purchase</p>
                </div>
                <Badge className="bg-green-100 text-green-800">+7 points</Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <div>
                  <p className="font-medium text-blue-800">Reward Redeemed</p>
                  <p className="text-sm text-blue-600">Free pastry</p>
                </div>
                <Badge className="bg-blue-100 text-blue-800">-75 points</Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <div>
                  <p className="font-medium text-purple-800">Tier Upgrade</p>
                  <p className="text-sm text-purple-600">
                    Promoted to {customer.tier}
                  </p>
                </div>
                <Badge className="bg-purple-100 text-purple-800">
                  🎉 Bonus
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
