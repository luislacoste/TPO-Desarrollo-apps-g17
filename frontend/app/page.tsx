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
import { AuctionLiveScreen } from "@/components/screens/auction-live-screen"
import { ItemDetailScreen } from "@/components/screens/item-detail-screen"
import { SettingsScreen } from "@/components/screens/settings-screen"
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
  | 'auction-live'
  | 'item-detail'
  | 'settings'

export default function SubastAppWireframes() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('splash')
  const [selectedAuctionId, setSelectedAuctionId] = useState<string>('')
  const [selectedItemId, setSelectedItemId] = useState<string>('')
  const [prevScreen, setPrevScreen] = useState<Screen>('home')
  const [userName, setUserName] = useState<string>('')

  const handleNavigate = (navItem: NavItem) => {
    switch (navItem) {
      case 'home': setCurrentScreen('home'); break
      case 'catalog': setCurrentScreen('catalog'); break
      case 'notifications': setCurrentScreen('notifications'); break
      case 'profile': setCurrentScreen('profile'); break
    }
  }

  const handleViewAuction = (auctionId: string, from: Screen) => {
    setSelectedAuctionId(auctionId)
    setPrevScreen(from)
    setCurrentScreen('auction-live')
  }

  const handleViewItem = (itemId: string) => {
    setSelectedItemId(itemId)
    setCurrentScreen('item-detail')
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case 'splash':
        return <SplashScreen onComplete={() => setCurrentScreen('login')} />

      case 'login':
        return (
          <LoginScreen
            onLogin={() => { setUserName('Carlos'); setCurrentScreen('home') }}
            onRegister={() => setCurrentScreen('register')}
          />
        )

      case 'register':
        return (
          <RegisterScreen
            onComplete={(name: string) => { setUserName(name); setCurrentScreen('home') }}
            onBack={() => setCurrentScreen('login')}
          />
        )

      case 'home':
        return (
          <HomeScreen
            activeNav="home"
            onNavigate={handleNavigate}
            onViewAuction={(id) => handleViewAuction(id, 'home')}
            userName={userName}
          />
        )

      case 'catalog':
        return (
          <CatalogScreen
            activeNav="catalog"
            onNavigate={handleNavigate}
            onViewAuction={(id) => handleViewAuction(id, 'catalog')}
          />
        )

      case 'profile':
        return (
          <ProfileScreen
            activeNav="profile"
            onNavigate={handleNavigate}
            onViewPayments={() => setCurrentScreen('payments')}
            onSettings={() => setCurrentScreen('settings')}
          />
        )

      case 'payments':
        return <PaymentsScreen onBack={() => setCurrentScreen('profile')} />

      case 'settings':
        return <SettingsScreen onBack={() => setCurrentScreen('profile')} />

      case 'notifications':
        return (
          <NotificationsScreen
            activeNav="notifications"
            onNavigate={handleNavigate}
          />
        )

      case 'auction-live':
        return (
          <AuctionLiveScreen
            auctionId={selectedAuctionId}
            onBack={() => setCurrentScreen(prevScreen)}
            onViewItem={handleViewItem}
          />
        )

      case 'item-detail':
        return (
          <ItemDetailScreen
            itemId={selectedItemId}
            onBack={() => setCurrentScreen('auction-live')}
            onGoHome={() => setCurrentScreen('home')}
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
