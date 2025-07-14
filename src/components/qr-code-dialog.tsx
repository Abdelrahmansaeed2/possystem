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
import { QrCode, Smartphone, Copy, Check } from "lucide-react";

interface QRCodeDialogProps {
  open: boolean;
  onClose: () => void;
}

export function QRCodeDialog({ open, onClose }: QRCodeDialogProps) {
  const [copied, setCopied] = useState(false);

  // In a real app, this would be a unique URL for the current session
  const orderUrl = "https://cafe-pos.app/order/abc123";
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    orderUrl
  )}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(orderUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>QR Code Ordering</DialogTitle>
          <DialogDescription>
            Let customers scan this QR code to place their order from their
            phone
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* QR Code */}
          <div className="flex flex-col items-center space-y-4">
            <div className="p-4 bg-white border-2 border-gray-200 rounded-lg">
              <img
                src={qrCodeUrl || "/placeholder.svg"}
                alt="QR Code for mobile ordering"
                className="w-48 h-48"
              />
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <QrCode className="h-5 w-5 text-blue-600" />
                <span className="font-medium">Mobile Ordering</span>
              </div>
              <p className="text-sm text-gray-600">
                Scan with camera app or QR code reader
              </p>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-3">
            <h4 className="font-medium">Features:</h4>
            <div className="grid grid-cols-2 gap-2">
              <Badge variant="secondary" className="justify-center py-2">
                <Smartphone className="h-3 w-3 mr-1" />
                Mobile Friendly
              </Badge>
              <Badge variant="secondary" className="justify-center py-2">
                💳 Secure Payment
              </Badge>
              <Badge variant="secondary" className="justify-center py-2">
                ⚡ Quick Order
              </Badge>
              <Badge variant="secondary" className="justify-center py-2">
                📱 No App Required
              </Badge>
            </div>
          </div>

          {/* URL Sharing */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Share Link:</h4>
            <div className="flex gap-2">
              <div className="flex-1 p-2 bg-gray-50 rounded text-sm font-mono text-gray-600 truncate">
                {orderUrl}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
                className="shrink-0 bg-transparent"
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Instructions */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">How it works:</h4>
            <ol className="text-sm text-blue-800 space-y-1">
              <li>1. Customer scans QR code with their phone</li>
              <li>2. They browse menu and place order</li>
              <li>3. Payment is processed securely</li>
              <li>4. Order appears in your POS system</li>
              <li>5. Customer receives order confirmation</li>
            </ol>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={() => window.print()}>Print QR Code</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
