import { Outlet } from "react-router-dom"
import { AppSidebar } from "../AppSidebar"
import { Navbar } from "../Navbar"

function RootLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#F8F9F6]">
      <AppSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default RootLayout


