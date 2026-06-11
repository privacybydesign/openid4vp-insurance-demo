import { BrowserRouter, Route, Routes } from "react-router-dom"
import { TopNav } from "@/components/TopNav"
import { Landing } from "@/pages/Landing"
import { WordKlant } from "@/pages/WordKlant"
import { Registreren } from "@/pages/Registreren"
import { Inloggen } from "@/pages/Inloggen"

export function App() {
  return (
    <BrowserRouter>
      <TopNav />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/word-klant" element={<WordKlant />} />
        <Route path="/registreren" element={<Registreren />} />
        <Route path="/inloggen" element={<Inloggen />} />
      </Routes>
    </BrowserRouter>
  )
}
