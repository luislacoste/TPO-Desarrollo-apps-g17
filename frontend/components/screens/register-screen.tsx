"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MobileScreen } from "@/components/mobile-frame"
import { ArrowLeft, ArrowRight, User, Mail, MapPin, Globe, FileImage, CheckCircle, Lock, CreditCard } from "lucide-react"
import { cn } from "@/lib/utils"

interface RegisterScreenProps {
  onComplete: () => void
  onBack: () => void
}

type Step = 1 | 2 | 3 | 4 | 5

const steps = [
  { id: 1, title: 'Datos Personales', icon: User },
  { id: 2, title: 'Documento', icon: FileImage },
  { id: 3, title: 'Verificacion', icon: CheckCircle },
  { id: 4, title: 'Contrasena', icon: Lock },
  { id: 5, title: 'Medio de Pago', icon: CreditCard },
]

export function RegisterScreen({ onComplete, onBack }: RegisterScreenProps) {
  const [currentStep, setCurrentStep] = useState<Step>(1)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dni: '',
    address: '',
    country: '',
    email: '',
    documentFront: false,
    documentBack: false,
    password: '',
    confirmPassword: '',
  })
  
  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep((currentStep + 1) as Step)
    } else {
      onComplete()
    }
  }
  
  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as Step)
    } else {
      onBack()
    }
  }
  
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Nombre</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Tu nombre"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="pl-11 h-12"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Apellido</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Tu apellido"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="pl-11 h-12"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Documento Nacional de Identidad (DNI)</label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Tu DNI"
                  value={formData.dni}
                  onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                  className="pl-11 h-12"
                  inputMode="numeric"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="tu@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pl-11 h-12"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Domicilio</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Tu direccion"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="pl-11 h-12"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Pais</label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Tu pais"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="pl-11 h-12"
                />
              </div>
            </div>
          </div>
        )
      
      case 2:
        return (
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground text-center">
              Sube fotos de tu documento de identidad para verificar tu cuenta
            </p>
            
            <div className="space-y-4">
              <button
                onClick={() => setFormData({ ...formData, documentFront: true })}
                className={cn(
                  "w-full h-40 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-colors",
                  formData.documentFront 
                    ? "border-green-500 bg-green-50 text-green-600"
                    : "border-border hover:border-primary hover:bg-primary/5 text-muted-foreground"
                )}
              >
                {formData.documentFront ? (
                  <>
                    <CheckCircle className="w-10 h-10" />
                    <span className="font-medium">Frente subido</span>
                  </>
                ) : (
                  <>
                    <FileImage className="w-10 h-10" />
                    <span className="font-medium">Subir frente del documento</span>
                    <span className="text-xs">JPG, PNG hasta 5MB</span>
                  </>
                )}
              </button>
              
              <button
                onClick={() => setFormData({ ...formData, documentBack: true })}
                className={cn(
                  "w-full h-40 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-colors",
                  formData.documentBack 
                    ? "border-green-500 bg-green-50 text-green-600"
                    : "border-border hover:border-primary hover:bg-primary/5 text-muted-foreground"
                )}
              >
                {formData.documentBack ? (
                  <>
                    <CheckCircle className="w-10 h-10" />
                    <span className="font-medium">Dorso subido</span>
                  </>
                ) : (
                  <>
                    <FileImage className="w-10 h-10" />
                    <span className="font-medium">Subir dorso del documento</span>
                    <span className="text-xs">JPG, PNG hasta 5MB</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )
      
      case 3:
        return (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-24 h-24 rounded-full bg-amber-100 flex items-center justify-center mb-6">
              <CheckCircle className="w-12 h-12 text-amber-500" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">En revision</h3>
            <p className="text-muted-foreground text-sm max-w-[280px]">
              Tu documentacion esta siendo verificada. Te notificaremos cuando tu cuenta sea aprobada.
            </p>
            <div className="mt-6 p-4 bg-muted rounded-xl w-full">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Estado:</span>
                <span className="font-medium text-amber-600">Pendiente de revision</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-muted-foreground">Tiempo estimado:</span>
                <span className="font-medium text-foreground">24-48 horas</span>
              </div>
            </div>
          </div>
        )
      
      case 4:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground text-center mb-4">
              Crea una contrasena segura para tu cuenta
            </p>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Contrasena</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Minimo 8 caracteres"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="pl-11 h-12"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Confirmar contrasena</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Repite tu contrasena"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="pl-11 h-12"
                />
              </div>
            </div>
            
            <div className="space-y-2 pt-4">
              <p className="text-xs text-muted-foreground">La contrasena debe tener:</p>
              <ul className="text-xs space-y-1">
                <li className={cn("flex items-center gap-2", formData.password.length >= 8 && "text-green-600")}>
                  <span className={cn("w-1.5 h-1.5 rounded-full", formData.password.length >= 8 ? "bg-green-500" : "bg-muted-foreground")} />
                  Minimo 8 caracteres
                </li>
                <li className={cn("flex items-center gap-2", /[A-Z]/.test(formData.password) && "text-green-600")}>
                  <span className={cn("w-1.5 h-1.5 rounded-full", /[A-Z]/.test(formData.password) ? "bg-green-500" : "bg-muted-foreground")} />
                  Una letra mayuscula
                </li>
                <li className={cn("flex items-center gap-2", /[0-9]/.test(formData.password) && "text-green-600")}>
                  <span className={cn("w-1.5 h-1.5 rounded-full", /[0-9]/.test(formData.password) ? "bg-green-500" : "bg-muted-foreground")} />
                  Un numero
                </li>
              </ul>
            </div>
          </div>
        )
      
      case 5:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground text-center mb-4">
              Agrega un medio de pago para participar en subastas
            </p>
            
            <button className="w-full p-4 rounded-xl border border-border hover:border-primary transition-colors flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-foreground">Tarjeta de Credito</p>
                <p className="text-xs text-muted-foreground">Visa, Mastercard, Amex</p>
              </div>
              <ArrowRight className="w-5 h-5 ml-auto text-muted-foreground" />
            </button>
            
            <button className="w-full p-4 rounded-xl border border-border hover:border-primary transition-colors flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="text-left">
                <p className="font-semibold text-foreground">Cuenta Bancaria</p>
                <p className="text-xs text-muted-foreground">Transferencia directa</p>
              </div>
              <ArrowRight className="w-5 h-5 ml-auto text-muted-foreground" />
            </button>
            
            <button className="w-full p-4 rounded-xl border border-border hover:border-primary transition-colors flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
                <FileImage className="w-6 h-6 text-amber-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-foreground">Cheque Certificado</p>
                <p className="text-xs text-muted-foreground">Para montos elevados</p>
              </div>
              <ArrowRight className="w-5 h-5 ml-auto text-muted-foreground" />
            </button>
            
            <p className="text-xs text-center text-muted-foreground pt-4">
              Podras agregar mas medios de pago desde tu perfil
            </p>
          </div>
        )
    }
  }
  
  return (
    <MobileScreen safeAreaTop={false} safeAreaBottom={false}>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="px-4 pt-14 pb-4 bg-background border-b border-border">
          <div className="flex items-center gap-3 mb-4">
            <button 
              onClick={handlePrev}
              className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <div>
              <h1 className="font-bold text-lg text-foreground">Crear Cuenta</h1>
              <p className="text-xs text-muted-foreground">Paso {currentStep} de 5</p>
            </div>
          </div>
          
          {/* Progress Steps */}
          <div className="flex items-center gap-2">
            {steps.map((step) => (
              <div key={step.id} className="flex-1 flex flex-col items-center gap-1">
                <div className={cn(
                  "w-full h-1 rounded-full transition-colors",
                  step.id <= currentStep ? "bg-primary" : "bg-muted"
                )} />
              </div>
            ))}
          </div>
        </div>
        
        {/* Step Content */}
        <div className="flex-1 overflow-auto px-6 py-6">
          <div className="flex items-center gap-3 mb-6">
            {(() => {
              const StepIcon = steps[currentStep - 1].icon
              return (
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <StepIcon className="w-5 h-5 text-primary" />
                </div>
              )
            })()}
            <div>
              <h2 className="font-semibold text-foreground">{steps[currentStep - 1].title}</h2>
            </div>
          </div>
          
          {renderStep()}
        </div>
        
        {/* Footer */}
        <div className="p-6 border-t border-border bg-background">
          <Button
            onClick={handleNext}
            className="w-full h-12 text-base font-semibold gap-2"
          >
            {currentStep === 5 ? 'Finalizar Registro' : 'Continuar'}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </MobileScreen>
  )
}
