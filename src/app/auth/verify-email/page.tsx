"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { toast } from "sonner"

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [verifying, setVerifying] = useState(true)
  const [verified, setVerified] = useState(false)
  
  useEffect(() => {
    const token = searchParams.get('token')
    
    if (!token) {
      setVerifying(false)
      return
    }
    
    // Verify the token
    fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setVerified(true)
          toast.success('Email verified successfully!')
          setTimeout(() => {
            router.push('/login')
          }, 2000)
        } else {
          toast.error(data.error || 'Verification failed')
        }
      })
      .catch(() => {
        toast.error('Something went wrong')
      })
      .finally(() => {
        setVerifying(false)
      })
  }, [searchParams, router])
  
  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Verifying your email...</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Please wait while we verify your email address.</p>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  if (verified) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Email verified!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">Your email has been verified successfully. Redirecting to login...</p>
            <Link href="/login">
              <Button className="w-full">Go to Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Invalid verification link</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">The verification link is invalid or has expired.</p>
          <Link href="/register">
            <Button className="w-full">Back to Register</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}