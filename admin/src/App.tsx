import { Routes, Route } from "react-router-dom"
import RootLayout from "./components/layout/RootLayout"
import Dashboard from "./pages/Dashboard"
import Stock from "./pages/Stock"
import Marketplace from "./pages/Marketplace"
import AiChat from "./pages/AiChat"
import Wallet from "./pages/Wallet"
import Education from "./pages/Education"
import Blogs from "./pages/Blogs"

function App() {
  return (
    <Routes>
      <Route path="/" element={<RootLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="/stock" element={<Stock />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/ai-chat" element={<AiChat />} />
        <Route path="/wallet" element={<Wallet />} />
        <Route path="/education" element={<Education />} />
        <Route path="/blogs" element={<Blogs />} />
      </Route>
    </Routes>
  )
}

export default App

