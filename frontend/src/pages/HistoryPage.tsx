import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import api from "../api/client";

interface SessionBrief {
  id: number;
  date: string;
  note: string | null;
  exercise_count: number;
  total_sets: number;
  total_volume_kg: number;
}

export default function HistoryPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [sessions, setSessions] = useState<SessionBrief[]>([]);
  const [trainingDays, setTrainingDays] = useState<Set<string>>(new Set());
  const [selectedDay, setSelectedDay] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  useEffect(() => {
    const from = new Date(year, month, 1).toISOString().slice(0, 10);
    const to = new Date(year, month + 1, 0).toISOString().slice(0, 10);

    setLoading(true);
    api.get(`/workouts?from=${from}&to=${to}`)
      .then(({ data }) => {
        setSessions(data);
        setTrainingDays(new Set(data.map((s: SessionBrief) => s.date)));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [year, month]);

  const todayStr = new Date().toISOString().slice(0, 10);

  const daySessions = sessions.filter((s) => s.date === selectedDay);

  const calDays: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calDays.push(d);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={prevMonth} className="p-1.5 rounded-xl hover:bg-tangerine-100 transition-colors">
          <ChevronLeft size={18} className="text-cocoa-500" />
        </button>
        <h2 className="font-bold text-cocoa-900">
          {currentDate.toLocaleDateString("zh-CN", { year: "numeric", month: "long" })}
        </h2>
        <button onClick={nextMonth} className="p-1.5 rounded-xl hover:bg-tangerine-100 transition-colors">
          <ChevronRight size={18} className="text-cocoa-500" />
        </button>
      </div>

      <div className="grid grid-cols-7 text-center text-xs text-cocoa-400 font-medium">
        {["日","一","二","三","四","五","六"].map((d) => (
          <div key={d} className="py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {calDays.map((d, i) => {
          if (d === null) return <div key={`e${i}`} />;
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
          const hasTraining = trainingDays.has(dateStr);
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedDay;

          return (
            <button
              key={dateStr}
              onClick={() => setSelectedDay(isSelected ? "" : dateStr)}
              className={`aspect-square rounded-xl flex flex-col items-center justify-center text-sm transition-all relative
                ${isSelected ? "bg-tangerine-500 text-white font-bold" : "hover:bg-tangerine-50"}
                ${isToday && !isSelected ? "ring-2 ring-tangerine-400" : ""}
              `}
              style={{ color: isSelected ? "white" : "var(--color-text)" }}
            >
              {d}
              {hasTraining && !isSelected && (
                <span className="w-1.5 h-1.5 rounded-full bg-tangerine-500 absolute bottom-1.5" />
              )}
            </button>
          );
        })}
      </div>

      {loading && (
        <div className="flex justify-center py-6">
          <div className="w-5 h-5 border-2 border-tangerine-300 border-t-tangerine-500 rounded-full animate-spin" />
        </div>
      )}

      {!loading && selectedDay && (
        <div className="space-y-2">
          <h3 className="font-medium text-sm text-cocoa-500">{selectedDay}</h3>
          {daySessions.length === 0 ? (
            <p className="text-cocoa-400 text-sm">当日无训练记录</p>
          ) : (
            daySessions.map((s) => (
              <div key={s.id} className="card space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-cocoa-900">{s.note || "训练"}</span>
                </div>
                <div className="flex gap-4 text-xs text-cocoa-500">
                  <span>{s.exercise_count} 个动作</span>
                  <span>{s.total_sets} 组</span>
                  <span>{s.total_volume_kg.toLocaleString()} kg</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
