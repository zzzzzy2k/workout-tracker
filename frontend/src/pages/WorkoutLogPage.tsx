import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, PenLine, Dumbbell, ClipboardList } from "lucide-react";
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

  const updateNote = async (sessionId: number, note: string) => {
    await api.put(`/workouts/${sessionId}`, { note });
    fetchToday();
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
        <div className="card text-center py-10 space-y-3">
          <Dumbbell size={40} className="text-tangerine-300 mx-auto" />
          <p className="text-cocoa-400 text-sm">今天还没有训练记录</p>
          <div className="flex gap-2 justify-center">
            <button onClick={createSession} className="btn-primary text-sm">手动添加动作</button>
            <Link to="/templates" className="btn-secondary text-sm">从模板开始</Link>
          </div>
        </div>
      )}

      {sessions.map((session) => (
        <div key={session.id} className="card space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              {session.note ? (
                <input
                  className="font-semibold text-cocoa-900 bg-transparent border-none outline-none w-full"
                  defaultValue={session.note}
                  onBlur={(e) => updateNote(session.id, e.target.value)}
                />
              ) : (
                <button
                  onClick={() => updateNote(session.id, "训练")}
                  className="text-cocoa-400 text-sm flex items-center gap-1 hover:text-tangerine-500 transition-colors"
                >
                  <PenLine size={12} /> 添加备注
                </button>
              )}
            </div>
            <button onClick={() => deleteSession(session.id)} className="p-1 text-cocoa-300 hover:text-red-400 transition-colors">
              <Trash2 size={14} />
            </button>
          </div>

          {session.logs.length === 0 && (
            <p className="text-cocoa-400 text-xs text-center py-4">点击下方添加动作</p>
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
