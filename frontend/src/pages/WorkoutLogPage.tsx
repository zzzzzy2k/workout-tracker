import { useState, useEffect, useCallback, useRef } from "react";
import { Plus, Trash2, PenLine, Save, Check } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/client";

interface WorkoutLog {
  id: number;
  exercise_id: string;
  exercise_name: string;
  sets: number;
  reps: number;
  weight_kg: number;
  order: number;
  gif_url: string;
}

interface WorkoutSession {
  id: number;
  date: string;
  note: string | null;
  created_at: string | null;
  logs: WorkoutLog[];
}

export default function WorkoutLogPage() {
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingLog, setEditingLog] = useState<{ sessionId: number; logId: number; field: string } | null>(null);
  const navigate = useNavigate();

  const fetchToday = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/workouts/today");
      setSessions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchToday();
  }, [fetchToday]);

  const createSession = async () => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      await api.post("/workouts", { date: today, note: "" });
      fetchToday();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteSession = async (id: number) => {
    if (!confirm("确定删除这次训练记录？")) return;
    await api.delete(`/workouts/${id}`);
    fetchToday();
  };

  const addLog = async (sessionId: number) => {
    navigate(`/exercises?addTo=${sessionId}`);
  };

  const deleteLog = async (logId: number) => {
    await api.delete(`/workouts/logs/${logId}`);
    fetchToday();
  };

  const updateLog = async (logId: number, field: string, value: number) => {
    setEditingLog(null);
    try {
      await api.put(`/workouts/logs/${logId}`, { [field]: value });
      fetchToday();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-6 h-6 border-2 border-tangerine-300 border-t-tangerine-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-sm text-cocoa-500">
          {new Date().toLocaleDateString("zh-CN", { month: "long", day: "numeric", weekday: "short" })}
        </h2>
        <button onClick={createSession} className="btn-primary text-sm flex items-center gap-1.5 py-2 px-4">
          <Plus size={16} />
          新建训练
        </button>
      </div>

      {sessions.length === 0 && (
        <div className="card text-center py-10 space-y-4">
          <img src="/icon.svg" alt="logo" className="w-20 h-20 rounded-[28px] shadow-tangerine mx-auto" />
          <div>
            <h3 className="font-bold text-cocoa-900 text-base mb-1">开始你的训练之旅</h3>
            <p className="text-cocoa-400 text-sm max-w-xs mx-auto leading-relaxed">
              点击「新建训练」开始今天的记录，每完成一组就随手记下。积少成多，回头看都是你的勋章。
            </p>
          </div>
          <div className="flex gap-2 justify-center pt-1">
            <button onClick={createSession} className="btn-primary text-sm">创建今日训练</button>
            <Link to="/templates" className="btn-secondary text-sm">从模板开始</Link>
          </div>
          <div className="pt-3 border-t border-tangerine-100/50 grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-sm font-bold text-tangerine-500">1,324</p>
              <p className="text-xs text-cocoa-400">健身动作库</p>
            </div>
            <div>
              <p className="text-sm font-bold text-tangerine-500">10</p>
              <p className="text-xs text-cocoa-400">语言教学</p>
            </div>
            <div>
              <p className="text-sm font-bold text-tangerine-500">图+文</p>
              <p className="text-xs text-cocoa-400">动画演示</p>
            </div>
          </div>
        </div>
      )}

      {sessions.map((session) => (
        <div key={session.id} className="card space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm text-cocoa-900">训练记录</span>
            <button onClick={() => deleteSession(session.id)} className="p-1 text-cocoa-300 hover:text-red-400 transition-colors">
              <Trash2 size={14} />
            </button>
          </div>

          {session.logs.length === 0 && (
            <p className="text-cocoa-400 text-xs text-center py-2">点击下方按钮添加动作</p>
          )}

          {session.logs.map((log) => (
            <div key={log.id} className="flex items-center gap-3 bg-tangerine-50/50 rounded-xl p-3">
              <img src={log.gif_url} alt={log.exercise_name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-cocoa-900 truncate">{log.exercise_name}</p>
                <div className="flex gap-3 mt-1">
                  {(["sets", "reps", "weight_kg"] as const).map((field) => (
                    <span key={field} className="text-xs text-cocoa-500">
                      {field === "sets" && `${log.sets}组`}
                      {field === "reps" && `${log.reps}次`}
                      {field === "weight_kg" && `${log.weight_kg}kg`}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => setEditingLog({ sessionId: session.id, logId: log.id, field: "all" })} className="p-1.5 text-cocoa-400 hover:text-tangerine-500 transition-colors">
                  <PenLine size={13} />
                </button>
                <button onClick={() => deleteLog(log.id)} className="p-1.5 text-cocoa-300 hover:text-red-400 transition-colors">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}

          <button onClick={() => addLog(session.id)} className="w-full py-2.5 rounded-xl border-2 border-dashed border-tangerine-200 text-tangerine-500 text-sm font-medium hover:bg-tangerine-50 transition-colors flex items-center justify-center gap-1">
            <Plus size={15} /> 添加动作
          </button>

          <DiaryNote sessionId={session.id} initialNote={session.note || ""} onSaved={fetchToday} />

          {editingLog && (
            <EditLogModal
              logId={editingLog.logId}
              onSave={(logId, sets, reps, weight) => {
                Promise.all([
                  updateLog(logId, "sets", sets),
                  updateLog(logId, "reps", reps),
                  updateLog(logId, "weight_kg", weight),
                ]).finally(fetchToday);
              }}
              onClose={() => setEditingLog(null)}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function DiaryNote({ sessionId, initialNote, onSaved }: {
  sessionId: number;
  initialNote: string;
  onSaved: () => void;
}) {
  const [note, setNote] = useState(initialNote);
  const [autoSave, setAutoSave] = useState(true);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const lastNoteRef = useRef(initialNote);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const doSave = async (content: string) => {
    setSaving(true);
    try {
      await api.put(`/workouts/${sessionId}`, { note: content });
      lastNoteRef.current = content;
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      onSaved();
    } catch (err) {
      console.error(err);
      setSaving(false);
    }
  };

  const handleChange = (val: string) => {
    setNote(val);
    setSaved(false);
    if (autoSave) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => doSave(val), 800);
    }
  };

  const handleManualSave = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    doSave(note);
  };

  const isDirty = note !== lastNoteRef.current;

  return (
    <div className="pt-2 border-t border-tangerine-100/50">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <PenLine size={12} className="text-cocoa-400" />
          <span className="text-xs text-cocoa-400 font-medium">训练心得</span>
          {autoSave && saving && (
            <span className="text-xs text-tangerine-400 animate-pulse">保存中...</span>
          )}
          {autoSave && saved && (
            <span className="text-xs text-lime flex items-center gap-0.5"><Check size={10} /> 已保存</span>
          )}
          {!autoSave && isDirty && (
            <span className="text-xs text-flame">未保存</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoSave(!autoSave)}
            className="text-xs px-2 py-0.5 rounded-lg border transition-colors"
            style={{
              color: autoSave ? "var(--color-success)" : "var(--color-text-muted)",
              borderColor: autoSave ? "var(--color-success)" : "var(--color-border-tertiary)",
              backgroundColor: autoSave ? "#F0F7E6" : "transparent",
            }}
          >
            {autoSave ? "自动保存" : "手动保存"}
          </button>
          {!autoSave && isDirty && (
            <button
              onClick={handleManualSave}
              disabled={saving}
              className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-tangerine-500 text-white font-medium hover:bg-tangerine-600 transition-colors disabled:opacity-50"
            >
              <Save size={11} />
              {saving ? "保存中..." : "保存"}
            </button>
          )}
        </div>
      </div>
      <textarea
        placeholder="今天感觉怎么样？有什么想记录的..."
        value={note}
        onChange={(e) => handleChange(e.target.value)}
        rows={3}
        className="w-full px-3 py-2.5 rounded-xl bg-tangerine-50/60 border border-tangerine-100/50
                   text-sm text-cocoa-700 placeholder-cocoa-300 resize-y
                   focus:outline-none focus:ring-2 focus:ring-tangerine-300 focus:border-transparent
                   transition-all leading-relaxed"
      />
    </div>
  );
}

function EditLogModal({ logId, onSave, onClose }: {
  logId: number;
  onSave: (id: number, sets: number, reps: number, weight: number) => void;
  onClose: () => void;
}) {
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState(10);
  const [weight, setWeight] = useState(0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-cocoa-900/30" onClick={onClose}>
      <div className="bg-white rounded-2xl p-5 w-72 space-y-3 shadow-lg" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-bold text-cocoa-900">编辑训练组</h3>
        <div className="space-y-2">
          <label className="text-xs text-cocoa-500">组数</label>
          <input type="number" min={0} value={sets} onChange={(e) => setSets(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-xl border border-tangerine-100/50 text-sm focus:outline-none focus:ring-2 focus:ring-tangerine-300" />
          <label className="text-xs text-cocoa-500">次数</label>
          <input type="number" min={0} value={reps} onChange={(e) => setReps(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-xl border border-tangerine-100/50 text-sm focus:outline-none focus:ring-2 focus:ring-tangerine-300" />
          <label className="text-xs text-cocoa-500">重量 (kg)</label>
          <input type="number" min={0} step={0.5} value={weight} onChange={(e) => setWeight(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-xl border border-tangerine-100/50 text-sm focus:outline-none focus:ring-2 focus:ring-tangerine-300" />
        </div>
        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="flex-1 py-2 rounded-xl text-sm text-cocoa-500 hover:bg-tangerine-50">取消</button>
          <button onClick={() => onSave(logId, sets, reps, weight)} className="flex-1 py-2 rounded-xl bg-tangerine-500 text-white text-sm font-semibold hover:bg-tangerine-600">保存</button>
        </div>
      </div>
    </div>
  );
}
