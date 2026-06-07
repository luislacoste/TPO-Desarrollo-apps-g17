"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react"
import { MobileScreen } from "@/components/mobile-frame"

interface LoginScreenProps {
  onLogin: () => void
  onRegister: () => void
}

export function LoginScreen({ onLogin, onRegister }: LoginScreenProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const handleLogin = async () => {
    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsLoading(false)
    onLogin()
  }
  
  return (
    <MobileScreen safeAreaTop={false} safeAreaBottom={false}>
      <div className="h-full flex flex-col">
        {/* Header Section */}
        <div className="flex-1 flex flex-col items-center justify-center px-8 pt-16 bg-gradient-to-b from-primary/5 to-transparent">
          <div className="w-40 h-40 mb-6">
            <img src="/icono-png.png" alt="SubastAR logo" className="w-full h-full object-contain drop-shadow-lg" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Bienvenido</h1>
          <p className="text-muted-foreground text-sm mt-1 text-center">
            Inicia sesion para acceder a las subastas
          </p>
        </div>
        
        {/* Form Section */}
        <div className="flex-1 px-6 pt-8 pb-8">
          <div className="space-y-4">
            {/* Email Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-11 h-12"
                />
              </div>
            </div>
            
            {/* Password Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Contrasena</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Tu contrasena"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-11 pr-11 h-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            
            {/* Forgot Password */}
            <div className="flex justify-end">
              <button className="text-sm text-primary font-medium hover:underline">
                Olvidaste tu contrasena?
              </button>
            </div>
            
            {/* Login Button */}
            <Button
              onClick={handleLogin}
              disabled={isLoading || !email || !password}
              className="w-full h-12 text-base font-semibold gap-2"
            >
              {isLoading ? (
                <span className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Iniciar Sesion
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>

          {/* Register Link */}
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              No tienes cuenta?{" "}
              <button 
                onClick={onRegister}
                className="text-primary font-semibold hover:underline"
              >
                Registrate
              </button>
            </p>
          </div>
        </div>
      </div>
    </MobileScreen>
  )
}
