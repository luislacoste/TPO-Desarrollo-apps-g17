import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Feather } from '@expo/vector-icons'

export type NavItem = 'home' | 'catalog' | 'notifications' | 'profile'

interface BottomNavProps {
  active: NavItem
  onNavigate?: (item: NavItem) => void
  notificationCount?: number
}

const navItems: { id: NavItem; label: string; icon: string }[] = [
  { id: 'home', label: 'Inicio', icon: 'home' },
  { id: 'catalog', label: 'Catalogo', icon: 'grid' },
  { id: 'notifications', label: 'Alertas', icon: 'bell' },
  { id: 'profile', label: 'Perfil', icon: 'user' },
]

export default function BottomNav({ active, onNavigate, notificationCount = 0 }: BottomNavProps) {
  return (
    <View style={styles.container}>
      <View style={styles.inner}>
        {navItems.map((item) => {
          const isActive = active === item.id
          const color = isActive ? '#3E73EE' : '#737373'
          return (
            <TouchableOpacity
              key={item.id}
              style={styles.item}
              onPress={() => onNavigate?.(item.id)}
              activeOpacity={0.7}
            >
              <View style={styles.iconWrap}>
                <Feather name={item.icon as any} size={20} color={color} />
                {item.id === 'notifications' && notificationCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {notificationCount > 9 ? '9+' : String(notificationCount)}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={[styles.label, { color, fontWeight: isActive ? '600' : '500' }]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FAFAFA',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  inner: {
    flexDirection: 'row',
    height: 56,
    paddingBottom: 0,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    gap: 2,
  },
  iconWrap: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    minWidth: 16,
    height: 16,
    backgroundColor: '#E7000B',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  label: {
    fontSize: 10,
  },
})
