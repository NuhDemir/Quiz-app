import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { 
  HiHome, 
  HiViewGrid, 
  HiChartBar, 
  HiCog,
  HiUser
} from 'react-icons/hi'

const BottomNavigation = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const navItems = [
    { 
      path: '/', 
      icon: HiHome, 
      label: 'Home',
      labelTr: 'Ana Sayfa'
    },
    { 
      path: '/categories', 
      icon: HiViewGrid, 
      label: 'Categories',
      labelTr: 'Kategoriler'
    },
    { 
      path: '/leaderboard', 
      icon: HiChartBar, 
      label: 'Progress',
      labelTr: 'İlerleme'
    },
    { 
      path: '/profile', 
      icon: HiUser, 
      label: 'Profile',
      labelTr: 'Profil'
    },
    { 
      path: '/settings', 
      icon: HiCog, 
      label: 'Settings',
      labelTr: 'Ayarlar'
    }
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t border-background-dark/10 dark:border-background-light/10 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md p-2 z-50">
      <div className="flex justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300 ${
                isActive 
                  ? 'text-primary bg-primary/10 scale-110' 
                  : 'text-background-dark/60 dark:text-background-light/60 hover:text-primary dark:hover:text-primary hover:bg-primary/5'
              }`}
            >
              <Icon className="text-2xl" />
              <span className="text-xs font-medium">
                {item.labelTr}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

export default BottomNavigation