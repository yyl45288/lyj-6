import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SetupPage from "@/pages/SetupPage";
import BattlePage from "@/pages/BattlePage";
import LeaderboardPage from "@/pages/LeaderboardPage";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SetupPage />} />
        <Route path="/battle" element={<BattlePage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
      </Routes>
    </Router>
  );
}
