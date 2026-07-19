import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Search, X, ChevronDown, ChevronUp } from "lucide-react";
import api from "../api/client";

interface SessionBrief {
  id: number;
  date: string;
  note: string | null;
  exercise_count: number;
  total_sets: number;
  total_volume_kg: number;
}

interface LogDetail {
  id: number;
  exercise_id: string;
  exercise_name: string;
  sets: number;
  reps: number;
  weight_kg: number;
  order: number;
  gif_url: string;
}

interface SessionDetail {
  id: number;
  date: string;
  note: string | null;
  logs: LogDetail[];
}

export default function HistoryPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [sessions, setSessions] = useState<SessionBrief[]>([]);
  const [trainingDays, setTrainingDays] = useState<Set<string>>(new Set());
  const [selectedDay, setSelectedDay] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SessionBrief[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchMode, setSearchMode] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // 详情展开
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [detailData, setDetailData] = useState<SessionDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const detailCache = useRef<Map<number, SessionDetail>>(new Map());

  const toggleDetail = async (sessionId: number) => {
    if (expandedId === sessionId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(sessionId);
    // 缓存命中直接复用
    if (detailCache.current.has(sessionId)) {
      setDetailData(detailCache.current.get(sessionId)!);
      return;
    }
    setDetailLoading(true);
    try {
      const { data } = await api.get(`/workouts/${sessionId}?lang=zh`);
      detailCache.current.set(sessionId, data);
      setDetailData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

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
        const sessList = data as SessionBrief[];
        setSessions(sessList);
        setTrainingDays(new Set(sessList.map((s: SessionBrief) => s.date)));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [year, month]);

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = q.trim();
    if (!trimmed) {
      setSearchMode(false);
      setSearchResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      setSearchMode(true);
      try {
        const { data } = await api.get(`/workouts?search=${encodeURIComponent(trimmed)}`);
        setSearchResults(data);
      } catch (err) {
        console.error(err);
      } finally {
        setSearching(false);
      }
    }, 400);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchMode(false);
    setSearchResults([]);
  };

  const todayStr = new Date().toISOString().slice(0, 10);
  const daySessions = sessions.filter((s) => s.date === selectedDay);

  const calDays: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calDays.push(d);

  const matchedDates = new Set(searchResults.map((s) => s.date));

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-cocoa-400" />
        <input
          type="text"
          placeholder="搜索训练心得..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-white border border-tangerine-100/50
                     text-sm text-cocoa-900 placeholder-cocoa-400
                     focus:outline-none focus:ring-2 focus:ring-tangerine-300 focus:border-transparent
                     transition-all"
        />
        {searchQuery && (
          <button onClick={clearSearch} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-cocoa-400 hover:text-cocoa-600">
            <X size={14} />
          </button>
        )}
      </div>

      {searchMode ? (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-cocoa-400 font-medium">
              {searching ? "搜索中..." : `找到 ${searchResults.length} 条记录`}
            </span>
            <button onClick={clearSearch} className="text-xs text-tangerine-500 hover:underline">返回日历</button>
          </div>

          {searching && (
            <div className="flex justify-center py-8">
              <div className="w-5 h-5 border-2 border-tangerine-300 border-t-tangerine-500 rounded-full animate-spin" />
            </div>
          )}

          {!searching && searchResults.length === 0 && (
            <div className="text-center py-10 card">
              <p className="text-cocoa-400 text-sm">没有找到匹配的训练心得</p>
              <p className="text-cocoa-300 text-xs mt-1">试试其他关键词</p>
            </div>
          )}

          {!searching && searchResults.map((s) => (
            <div key={s.id} className="mb-3">
              <button
                onClick={() => toggleDetail(s.id)}
                className="card space-y-2 w-full text-left cursor-pointer hover:shadow-md transition-shadow relative"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-cocoa-900">{s.date}</span>
                  <span className="text-xs text-cocoa-400">{s.exercise_count} 动作 · {s.total_sets} 组</span>
                </div>
                {s.note && (
                  <p className="text-sm text-cocoa-600 leading-relaxed bg-tangerine-50/80 rounded-xl px-3 py-2.5">
                    "{s.note.length > 120 ? s.note.slice(0, 120) + "..." : s.note}"
                  </p>
                )}
                {!s.note && <p className="text-xs text-cocoa-400">无心得记录</p>}
                <div className="absolute right-3 top-3 text-cocoa-300">
                  {expandedId === s.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </button>
              {expandedId === s.id && (
                <LogsPanel loading={detailLoading} detail={detailData} />
              )}
            </div>
          ))}
        </div>
      ) : (
        <>
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
                  <div key={s.id}>
                    <button
                      onClick={() => toggleDetail(s.id)}
                      className="card space-y-1.5 w-full text-left cursor-pointer hover:shadow-md transition-shadow relative"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm text-cocoa-900">训练记录</span>
                        <div className="flex gap-4 text-xs text-cocoa-500">
                          <span>{s.exercise_count} 动作</span>
                          <span>{s.total_sets} 组</span>
                          <span>{s.total_volume_kg.toLocaleString()} kg</span>
                        </div>
                      </div>
                      {s.note && (
                        <p className="text-xs text-cocoa-500 leading-relaxed italic mt-1">
                          "{s.note.length > 80 ? s.note.slice(0, 80) + "..." : s.note}"
                        </p>
                      )}
                      <div className="absolute right-3 top-3 text-cocoa-300">
                        {expandedId === s.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </button>
                    {expandedId === s.id && (
                      <LogsPanel loading={detailLoading} detail={detailData} />
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function LogsPanel({ loading, detail }: { loading: boolean; detail: SessionDetail | null }) {
  if (loading) {
    return (
      <div className="card mt-1 flex justify-center py-4">
        <div className="w-4 h-4 border-2 border-tangerine-300 border-t-tangerine-500 rounded-full animate-spin" />
      </div>
    );
  }
  if (!detail || !detail.logs.length) {
    return (
      <div className="card mt-1">
        <p className="text-xs text-cocoa-400 text-center py-2">无练习记录</p>
      </div>
    );
  }
  return (
    <div className="card mt-1 space-y-2">
      {detail.logs.map((log, i) => (
        <div key={log.id} className="flex items-center gap-3">
          <span className="w-5 text-xs font-bold text-tangerine-400 text-right">{i + 1}</span>
          {log.gif_url && (
            <img src={log.gif_url} alt={log.exercise_name}
                 className="w-8 h-8 rounded-lg object-cover border border-tangerine-100" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-cocoa-900 truncate">{log.exercise_name}</p>
          </div>
          <div className="flex gap-3 text-xs text-cocoa-500 font-mono whitespace-nowrap">
            <span>{log.sets}组</span>
            <span>{log.reps}次</span>
            <span className="text-cocoa-700 font-semibold">{log.weight_kg}kg</span>
          </div>
        </div>
      ))}
      {detail.note && (
        <div className="border-t border-tangerine-100 pt-2 mt-2">
          <p className="text-xs text-cocoa-500 italic">💬 {detail.note}</p>
        </div>
      )}
    </div>
  );
}
