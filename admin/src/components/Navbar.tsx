"use client"

import { Bell, Menu, Search, User, Settings, LogOut } from "lucide-react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet"
import { useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useAppDispatch, useAppSelector } from "../redux/store"
import { logoutSync } from "../redux/auth"
import axios from "axios"

interface NavbarProps {
  userName?: string;
}

export function Navbar({ userName = 'Admin User' }: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { user } = useAppSelector(state => state.auth)

  const handleLogout = () => {
    // Dispatch synchronous logout action to update Redux state
    dispatch(logoutSync());
    
    // Navigate to home page immediately
    window.location.href = '/';
  }

  const sidebarItems = [
    { title: "Dashboard", url: "/" },
    { title: "Stock", url: "/stock" },
    { title: "Marketplace", url: "/marketplace" },
    { title: "AI Chat", url: "/ai-chat" },
    { title: "Wallet", url: "/wallet" },
    { title: "Education", url: "/education" },
    { title: "Blogs", url: "/blogs" },
  ]

  // Get initials for avatar
  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    }
    return "AD"
  }

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center border-b border-[#E6EAE8] bg-white px-4 shadow-sm">
      <div className="flex w-full items-center justify-between">
        {/* Mobile menu button - only visible on mobile */}
        <div className="flex items-center md:hidden">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-[#093731]">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <div className="flex h-16 items-center border-b border-[#E6EAE8] px-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#093731] text-white">
                    <span className="text-sm font-bold">FS</span>
                  </div>
                  <span className="text-xl font-bold text-[#093731]">Fallah Smart</span>
                </div>
              </div>
              <div className="py-4">
                <nav className="space-y-1 px-2">
                  {sidebarItems.map((item) => {
                    const isActive =
                      location.pathname === item.url || (item.url !== "/" && location.pathname.startsWith(item.url))

                    return (
                      <Link
                        key={item.title}
                        to={item.url}
                        className={`flex items-center gap-3 rounded-md px-4 py-2.5 text-sm font-medium transition-colors ${
                          isActive
                            ? "bg-[#E8F5F3] text-[#093731]"
                            : "text-[#4A5F5B] hover:bg-[#F8F9F6] hover:text-[#093731]"
                        }`}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <span>{item.title}</span>
                      </Link>
                    )
                  })}
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Logo - only visible on mobile */}
        <div className="flex items-center gap-2 md:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#093731] text-white">
            <span className="text-sm font-bold">FS</span>
          </div>
          <span className="text-xl font-bold text-[#093731]">Fallah Smart</span>
        </div>

        {/* Search bar */}
        <div className="hidden flex-1 max-w-md px-4 md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4A5F5B]" />
            <Input
              type="search"
              placeholder="Search..."
              className="w-full border-[#E6EAE8] bg-[#F8F9F6] pl-10 focus-visible:ring-[#093731]"
            />
          </div>
        </div>

        {/* Right section with notification and profile */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="relative text-[#4A5F5B] hover:bg-[#E8F5F3] hover:text-[#093731]"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#DB2763]"></span>
            <span className="sr-only">Notifications</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex h-8 w-8 items-center justify-center rounded-full p-0 hover:bg-[#E8F5F3]"
              >
                <Avatar className="h-8 w-8 border border-[#E6EAE8]">
                  <AvatarImage 
                    src={user?.profilePicture ? 
                      (user.profilePicture.startsWith('http') ? 
                        user.profilePicture : 
                        `http://localhost:5000${user.profilePicture}`) : 
                      "/placeholder.svg?height=32&width=32"} 
                    alt={userName || 'Admin'} 
                  />
                  <AvatarFallback className="bg-[#093731] text-white">{getInitials()}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="flex items-center gap-4 p-3">
                <Avatar className="h-12 w-12 border border-[#E6EAE8]">
                  <AvatarImage 
                    src={user?.profilePicture ? 
                      (user.profilePicture.startsWith('http') ? 
                        user.profilePicture : 
                        `http://localhost:5000${user.profilePicture}`) : 
                      "/placeholder.svg?height=48&width=48"} 
                    alt={userName || 'Admin'} 
                  />
                  <AvatarFallback className="bg-[#093731] text-white">{getInitials()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-[#1A2F2B]">{userName}</p>
                  <p className="text-xs text-[#4A5F5B]">{user?.email || 'admin@fallahsmart.com'}</p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="flex cursor-pointer items-center gap-2 py-2" asChild>
                <Link to="/profile">
                  <User className="h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex cursor-pointer items-center gap-2 py-2">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="flex cursor-pointer items-center gap-2 py-2 text-[#DB2763]" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

