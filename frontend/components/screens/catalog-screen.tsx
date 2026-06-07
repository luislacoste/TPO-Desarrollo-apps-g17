"use client"

import { useState } from "react"
import { MobileScreen } from "@/components/mobile-frame"
import { BottomNav, NavItem } from "@/components/bottom-nav"
import { AuctionCard } from "@/components/auction-card"
import { CategoryBadge } from "@/components/category-badge"
import { Search, SlidersHorizontal, X } from "lucide-react"
import { auctions, notifications } from "@/lib/mock-data"
import type { UserCategory } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

interface CatalogScreenProps {
  activeNav: NavItem
  onNavigate: (item: NavItem) => void
  onViewAuction: (auctionId: string) => void
}

type FilterStatus = 'all' | 'live' | 'upcoming' | 'ended'

export function CatalogScreen({ activeNav, onNavigate, onViewAuction }: CatalogScreenProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<UserCategory | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<FilterStatus>('all')
  const [showFilters, setShowFilters] = useState(false)
  
  const unreadNotifications = notifications.filter(n => !n.read).length
  const categories: UserCategory[] = ['comun', 'especial', 'plata', 'oro', 'platino']
  const statuses: { id: FilterStatus; label: string }[] = [
    { id: 'all', label: 'Todas' },
    { id: 'live', label: 'En Vivo' },
    { id: 'upcoming', label: 'Proximas' },
    { id: 'ended', label: 'Finalizadas' }
  ]
  
  const filteredAuctions = auctions.filter(auction => {
    const matchesSearch = auction.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          auction.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = !selectedCategory || auction.category === selectedCategory
    const matchesStatus = selectedStatus === 'all' || auction.status === selectedStatus
    
    return matchesSearch && matchesCategory && matchesStatus
  })
  
  return (
    <MobileScreen safeAreaTop={false}>
      <div className="h-full flex flex-col bg-background">
        {/* Header */}
        <div className="px-4 pt-14 pb-4 bg-background border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-foreground">Catalogo</h1>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "p-2 rounded-full transition-colors",
                showFilters ? "bg-primary text-primary-foreground" : "hover:bg-muted text-foreground"
              )}
            >
              <SlidersHorizontal className="w-5 h-5" />
            </button>
          </div>
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar subastas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-11 pr-10 bg-muted rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
          
          {/* Status Tabs */}
          <div className="flex gap-2 mt-4 overflow-x-auto pb-1 -mx-4 px-4">
            {statuses.map((status) => (
              <button
                key={status.id}
                onClick={() => setSelectedStatus(status.id)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                  selectedStatus === status.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {status.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* Filters Panel */}
        {showFilters && (
          <div className="px-4 py-4 bg-muted/50 border-b border-border animate-slide-up">
            <p className="text-sm font-medium text-foreground mb-3">Filtrar por categoria</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                  !selectedCategory
                    ? "bg-primary text-primary-foreground"
                    : "bg-background border border-border text-muted-foreground"
                )}
              >
                Todas
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
                >
                  <CategoryBadge 
                    category={cat} 
                    size="sm"
                    className={cn(
                      "cursor-pointer transition-all",
                      selectedCategory === cat && "ring-2 ring-primary ring-offset-2"
                    )} 
                  />
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Results Count */}
        <div className="px-4 py-3 bg-background">
          <p className="text-sm text-muted-foreground">
            {filteredAuctions.length} {filteredAuctions.length === 1 ? 'subasta encontrada' : 'subastas encontradas'}
          </p>
        </div>
        
        {/* Auction List */}
        <div className="flex-1 overflow-auto px-4 pb-8">
          {filteredAuctions.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {filteredAuctions.map((auction) => (
                <AuctionCard 
                  key={auction.id}
                  auction={auction}
                  variant="default"
                  onClick={() => onViewAuction(auction.id)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Search className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <p className="font-medium text-foreground">No se encontraron subastas</p>
              <p className="text-sm text-muted-foreground mt-1">
                Intenta con otros filtros o terminos de busqueda
              </p>
            </div>
          )}
        </div>
        
        {/* Bottom Navigation */}
        <BottomNav 
          active={activeNav} 
          onNavigate={onNavigate}
          notificationCount={unreadNotifications}
        />
      </div>
    </MobileScreen>
  )
}
