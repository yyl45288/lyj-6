import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SetupPage from "@/pages/SetupPage";
import BattlePage from "@/pages/BattlePage";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SetupPage />} />
        <Route path="/battle" element={<BattlePage />} />
      </Routes>
    </Router>
  );
}
