"use client"

import { useState } from "react"
import { MobileFrame } from "@/components/mobile-frame"
import { SplashScreen } from "@/components/screens/splash-screen"
import { LoginScreen } from "@/components/screens/login-screen"
import { RegisterScreen } from "@/components/screens/register-screen"
import { HomeScreen } from "@/components/screens/home-screen"
import { CatalogScreen } from "@/components/screens/catalog-screen"
import { ProfileScreen } from "@/components/screens/profile-screen"
import { PaymentsScreen } from "@/components/screens/payments-screen"
import { NotificationsScreen } from "@/components/screens/notifications-screen"
import type { NavItem } from "@/components/bottom-nav"

type Screen =
  | 'splash'
  | 'login'
  | 'register'
  | 'home'
  | 'catalog'
  | 'profile'
  | 'payments'
  | 'notifications'

export default function SubastAppWireframes() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('splash')

  const handleNavigate = (navItem: NavItem) => {
    switch (navItem) {
      case 'home':
        setCurrentScreen('home')
        break
      case 'catalog':
        setCurrentScreen('catalog')
        break
      case 'notifications':
        setCurrentScreen('notifications')
        break
      case 'profile':
        setCurrentScreen('profile')
        break
    }
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case 'splash':
        return (
          <SplashScreen
            onComplete={() => setCurrentScreen('login')}
          />
        )
      case 'login':
        return (
          <LoginScreen
            onLogin={() => setCurrentScreen('home')}
            onRegister={() => setCurrentScreen('register')}
          />
        )
      case 'register':
        return (
          <RegisterScreen
            onComplete={() => setCurrentScreen('home')}
            onBack={() => setCurrentScreen('login')}
          />
        )
      case 'home':
        return (
          <HomeScreen
            activeNav="home"
            onNavigate={handleNavigate}
            onViewAuction={() => {}}
          />
        )
      case 'catalog':
        return (
          <CatalogScreen
            activeNav="catalog"
            onNavigate={handleNavigate}
            onViewAuction={() => {}}
          />
        )
      case 'profile':
        return (
          <ProfileScreen
            activeNav="profile"
            onNavigate={handleNavigate}
            onViewPayments={() => setCurrentScreen('payments')}
          />
        )
      case 'payments':
        return (
          <PaymentsScreen
            onBack={() => setCurrentScreen('profile')}
          />
        )
      case 'notifications':
        return (
          <NotificationsScreen
            activeNav="notifications"
            onNavigate={handleNavigate}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-muted">
      <MobileFrame>
        {renderScreen()}
      </MobileFrame>
    </div>
  )
}
