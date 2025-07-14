"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Mic, MicOff, Volume2, VolumeX } from "lucide-react"

interface OrderItem {
  drinkId: string
  drinkName: string
  size: string
  price: number
  quantity: number
  customizations?: string[]
  specialInstructions?: string
  allergenWarnings?: string[]
}

interface VoiceOrderDialogProps {
  open: boolean
  onClose: () => void
  onOrderProcessed: (items: OrderItem[]) => void
}

export function VoiceOrderDialog({ open, onClose, onOrderProcessed }: VoiceOrderDialogProps) {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)

  // Simulate voice recognition
  useEffect(() => {
    if (isListening) {
      const timer = setTimeout(() => {
        const mockTranscripts = [
          "I would like a large latte with oat milk and an extra shot",
          "Can I get two medium cappuccinos and one small espresso",
          "I'll have an iced americano large size with vanilla syrup",
          "One chai latte medium with almond milk please",
        ]
const randomTranscript =
  mockTranscripts[Math.floor(Math.random() * mockTranscripts.length)]!;
          setTranscript(randomTranscript)
        setIsListening(false)
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [isListening])

  const startListening = () => {
    setIsListening(true)
    setTranscript("")
    if (soundEnabled) {
      console.log("🎤 Voice recording started")
    }
  }

  const stopListening = () => {
    setIsListening(false)
    if (soundEnabled) {
      console.log("🔇 Voice recording stopped")
    }
  }

  const processVoiceOrder = async () => {
    setIsProcessing(true)

    // Simulate AI processing
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Mock processed order based on transcript
    const mockOrder: OrderItem[] = [
      {
        drinkId: "latte",
        drinkName: "Latte",
        size: "Large",
        price: 6.5,
        quantity: 1,
        customizations: ["Oat Milk", "Extra Shot"],
        specialInstructions: "",
        allergenWarnings: ["Milk"],
      },
    ]

    onOrderProcessed(mockOrder)
    setIsProcessing(false)
    setTranscript("")
    onClose()
  }

  const clearTranscript = () => {
    setTranscript("")
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            Voice Order
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Voice Controls */}
          <div className="text-center">
            <div className="mb-4">
              <Button
                size="lg"
                variant={isListening ? "destructive" : "default"}
                onClick={isListening ? stopListening : startListening}
                className="w-24 h-24 rounded-full"
                disabled={isProcessing}
              >
                {isListening ? <MicOff className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
              </Button>
            </div>
            <p className="text-sm text-gray-600">
              {isListening ? "Listening... Speak your order clearly" : "Tap the microphone to start voice ordering"}
            </p>
          </div>

          {/* Sound Toggle */}
          <div className="flex items-center justify-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setSoundEnabled(!soundEnabled)}>
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
            <span className="text-sm text-gray-600">Sound {soundEnabled ? "On" : "Off"}</span>
          </div>

          {/* Transcript Display */}
          {transcript && (
            <Card>
              <CardContent className="p-4">
                <div className="mb-2">
                  <h4 className="font-medium text-sm">Recognized Speech:</h4>
                </div>
                <p className="text-sm bg-gray-50 p-3 rounded border italic">"{transcript}"</p>
              </CardContent>
            </Card>
          )}

          {/* Processing Status */}
          {isProcessing && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4 text-center">
                <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-sm text-blue-700">Processing your order...</p>
              </CardContent>
            </Card>
          )}

          {/* Instructions */}
          <Card className="bg-gray-50">
            <CardContent className="p-4">
              <h4 className="font-medium text-sm mb-2">Voice Order Tips:</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• Speak clearly and at normal pace</li>
                <li>• Include size, drink name, and customizations</li>
                <li>• Say "and" between multiple items</li>
                <li>• Example: "Large latte with oat milk"</li>
              </ul>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent">
              Cancel
            </Button>
            {transcript && (
              <>
                <Button variant="outline" onClick={clearTranscript}>
                  Clear
                </Button>
                <Button onClick={processVoiceOrder} disabled={isProcessing} className="flex-1">
                  {isProcessing ? "Processing..." : "Add to Order"}
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}