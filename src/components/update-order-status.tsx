"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface UpdateOrderStatusProps {
  orderId: string
  currentStatus: string
}

const orderStatuses = [
  { value: "PENDING", label: "Pending" },
  { value: "PROCESSING", label: "Processing" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
]

export function UpdateOrderStatus({ orderId, currentStatus }: UpdateOrderStatusProps) {
  const router = useRouter()
  const [status, setStatus] = useState(currentStatus)
  const [updating, setUpdating] = useState(false)

  async function handleUpdate() {
    if (status === currentStatus) return
    
    setUpdating(true)
    
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to update status")
      }
      
      toast.success("Order status updated")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong")
      setStatus(currentStatus)
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="flex items-center gap-4">
      <Select value={status} onValueChange={setStatus} disabled={updating}>
        <SelectTrigger className="w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {orderStatuses.map((s) => (
            <SelectItem key={s.value} value={s.value}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Button 
        onClick={handleUpdate} 
        disabled={status === currentStatus || updating}
      >
        {updating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Updating...
          </>
        ) : (
          "Update Status"
        )}
      </Button>
    </div>
  )
}