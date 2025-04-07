import { BarChart3, BookOpen, Home, MessageSquare, Wallet, Users, BarChart } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { useLocation, Link } from "react-router-dom"
import { useAppSelector } from "../redux/store"

const sidebarItems = [
  {
    title: "Dashboard",
    icon: Home,
    url: "/dashboard",
  },
  {
    title: "Stock",
    icon: BarChart3,
    url: "/stock",
  },

  {
    title: "AI Chat",
    icon: MessageSquare,
    url: "/ai-chat",
  },
  {
    title: "Wallet",
    icon: Wallet,
    url: "/wallet",
  },
  {
    title: "Education",
    icon: BookOpen,
    url: "/education",
  },
  {
    title: "Blogs",
    icon: BookOpen,
    url: "/blogs",
  },
]

export function AppSidebar() {
  const location = useLocation()
  const { user } = useAppSelector(state => state.auth)
  
  // Get initials for avatar
  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    }
    return "AD"
  }

  return (
    <aside className="hidden h-screen w-64 flex-shrink-0 flex-col bg-white border-r border-[#E6EAE8] md:flex">
      {/* Header with logo */}
      <div className="flex h-16 items-center border-b border-[#E6EAE8] px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#093731] text-white">
            <span className="text-sm font-bold">FS</span>
          </div>
          <span className="text-xl font-bold text-[#093731]">Fallah Smart</span>
        </div>
      </div>

      {/* Navigation menu */}
      <div className="flex-1 overflow-auto py-4">
        <div className="px-3 pb-2">
          <h3 className="mb-2 px-4 text-xs font-semibold uppercase text-[#4A5F5B]">Main Menu</h3>
          <nav className="space-y-1">
            {sidebarItems.map((item) => {
              const isActive =
                location.pathname === item.url || (item.url !== "/" && location.pathname.startsWith(item.url))

              return (
                <Link
                  key={item.title}
                  to={item.url}
                  className={`flex items-center gap-3 rounded-md px-4 py-2.5 text-sm font-medium transition-colors ${
                    isActive ? "bg-[#E8F5F3] text-[#093731]" : "text-[#4A5F5B] hover:bg-[#F8F9F6] hover:text-[#093731]"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.title}</span>
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Footer with user profile */}
      <div className="border-t border-[#E6EAE8] p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border border-[#E6EAE8]">
            <AvatarImage src="/placeholder.svg?height=40&width=40" alt="Admin" />
            <AvatarFallback className="bg-[#093731] text-white">{getInitials()}</AvatarFallback>
          </Avatar>
          <div className="overflow-hidden">
            <p className="truncate text-sm font-medium text-[#1A2F2B]">{user?.firstName} {user?.lastName}</p>
            <p className="truncate text-xs text-[#4A5F5B]">{user?.email || 'admin@fallahsmart.com'}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}

