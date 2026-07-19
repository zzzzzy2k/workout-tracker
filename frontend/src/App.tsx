import { BrowserRouter, Routes, Route, NavLink, useLocation } from "react-router-dom";
import { Dumbbell, ClipboardList, Calendar, BarChart3, LayoutTemplate } from "lucide-react";
import ExercisesPage from "./pages/ExercisesPage";
import WorkoutLogPage from "./pages/WorkoutLogPage";
import HistoryPage from "./pages/HistoryPage";
import StatsPage from "./pages/StatsPage";
import TemplatesPage from "./pages/TemplatesPage";

const navItems = [
  { to: "/", icon: ClipboardList, label: "训练" },
  { to: "/exercises", icon: Dumbbell, label: "动作库" },
  { to: "/history", icon: Calendar, label: "历史" },
  { to: "/stats", icon: BarChart3, label: "统计" },
  { to: "/templates", icon: LayoutTemplate, label: "模板" },
];

function SideNav() {
  const location = useLocation();
  return (
    <nav className="hidden md:flex flex-col gap-1 w-56 py-6 px-3 flex-shrink-0">
      <div className="flex items-center gap-3 px-4 mb-4">
        <img src="/icon.svg" alt="logo" className="w-9 h-9 rounded-2xl shadow-tangerine" />
        <div>
          <h1 className="text-base font-bold text-cocoa-900 tracking-tight leading-tight">
            Workout Tracker
          </h1>
          <p className="text-xs text-cocoa-400">记录每一次汗水</p>
        </div>
      </div>
      {navItems.map(({ to, icon: Icon, label }) => {
        const active = location.pathname === to || (to !== "/" && location.pathname.startsWith(to));
        return (
          <NavLink
            key={to}
            to={to}
            className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors duration-200"
            style={{
              color: active ? "var(--color-primary)" : "var(--color-text-muted)",
              backgroundColor: active ? "var(--color-primary-light)" : "transparent",
            }}
          >
            <Icon size={20} strokeWidth={active ? 2.5 : 2} />
            <span className="text-sm font-medium">{label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}

function BottomNav() {
  const location = useLocation();
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/95 backdrop-blur-sm border-t border-tangerine-100/50 px-3 py-2 flex justify-around z-30">
      {navItems.map(({ to, icon: Icon, label }) => {
        const active = location.pathname === to;
        return (
          <NavLink
            key={to}
            to={to}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors duration-200"
            style={{
              color: active ? "var(--color-primary)" : "var(--color-text-muted)",
              backgroundColor: active ? "var(--color-primary-light)" : "transparent",
            }}
          >
            <Icon size={20} strokeWidth={active ? 2.5 : 2} />
            <span className="text-xs font-medium">{label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}

function AppLayout() {
  return (
    <div className="h-full flex flex-col md:flex-row">
      <SideNav />
      <header className="md:hidden sticky top-0 z-10 bg-cream/90 backdrop-blur-sm border-b border-tangerine-100/50 px-5 py-3 max-w-md mx-auto w-full">
        <div className="flex items-center gap-2.5">
          <img src="/icon.svg" alt="logo" className="w-7 h-7 rounded-xl shadow-tangerine" />
          <h1 className="text-base font-bold text-cocoa-900 tracking-tight">
            Workout Tracker
          </h1>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto px-4 py-4 pb-20 md:pb-4 md:pl-0 md:pr-8 md:py-6 w-full">
        <div className="max-w-md md:max-w-4xl mx-auto">
          <Routes>
            <Route path="/" element={<WorkoutLogPage />} />
            <Route path="/exercises" element={<ExercisesPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/stats" element={<StatsPage />} />
            <Route path="/templates" element={<TemplatesPage />} />
          </Routes>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}
