import { useState, useEffect } from "react";
import { Plus, Play, Trash2, PenLine } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";

interface TemplateExercise {
  id: number;
  exercise_id: string;
  exercise_name: string;
  body_part: string;
  sets: number;
  order: number;
  gif_url: string;
}

interface Template {
  id: number;
  name: string;
  description: string | null;
  exercise_count: number;
  exercises: TemplateExercise[];
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const navigate = useNavigate();

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/templates");
      setTemplates(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const startFromTemplate = async (id: number) => {
    try {
      await api.post(`/templates/${id}/start`);
      navigate("/");
    } catch (err) {
      console.error(err);
    }
  };

  const deleteTemplate = async (id: number) => {
    if (!confirm("确定删除这个模板？")) return;
    await api.delete(`/templates/${id}`);
    fetchTemplates();
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
        <h2 className="font-semibold text-sm text-cocoa-500">{templates.length} 个模板</h2>
        <button onClick={() => setShowCreate(true)} className="btn-primary text-sm flex items-center gap-1.5 py-2 px-4">
          <Plus size={16} /> 新建模板
        </button>
      </div>

      {templates.length === 0 && (
        <div className="text-center py-10 card">
          <p className="text-cocoa-400 text-sm">还没有训练模板</p>
          <p className="text-cocoa-400 text-xs mt-1">创建模板后可以快速开始训练</p>
        </div>
      )}

      {templates.map((t) => (
        <div key={t.id} className="card space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-bold text-cocoa-900">{t.name}</h3>
              {t.description && <p className="text-xs text-cocoa-400 mt-0.5">{t.description}</p>}
              <p className="text-xs text-cocoa-400 mt-1">{t.exercise_count} 个动作</p>
            </div>
            <div className="flex gap-1">
              <button onClick={() => deleteTemplate(t.id)} className="p-1.5 text-cocoa-300 hover:text-red-400 transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          {t.exercises && t.exercises.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {t.exercises.map((e) => (
                <span key={e.id} className="text-xs px-2 py-1 rounded-full bg-tangerine-100 text-tangerine-700">
                  {e.exercise_name} ×{e.sets}
                </span>
              ))}
            </div>
          )}

          <button
            onClick={() => startFromTemplate(t.id)}
            className="btn-primary w-full text-sm flex items-center justify-center gap-1.5 py-2.5"
          >
            <Play size={15} /> 开始训练
          </button>
        </div>
      ))}

      {showCreate && <CreateTemplateModal onClose={() => setShowCreate(false)} onCreated={fetchTemplates} />}
    </div>
  );
}

function CreateTemplateModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await api.post("/templates", { name: name.trim(), description, exercises: [] });
      onCreated();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-cocoa-900/30" onClick={onClose}>
      <div className="bg-white rounded-2xl p-5 w-80 space-y-3 shadow-lg" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-bold text-cocoa-900">新建模板</h3>
        <input
          placeholder="模板名称，如：推胸日"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 rounded-xl border border-tangerine-100/50 text-sm focus:outline-none focus:ring-2 focus:ring-tangerine-300"
          autoFocus
        />
        <textarea
          placeholder="备注（可选）"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 rounded-xl border border-tangerine-100/50 text-sm focus:outline-none focus:ring-2 focus:ring-tangerine-300 resize-none"
        />
        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="flex-1 py-2 rounded-xl text-sm text-cocoa-500 hover:bg-tangerine-50">取消</button>
          <button onClick={save} disabled={saving || !name.trim()} className="flex-1 py-2 rounded-xl bg-tangerine-500 text-white text-sm font-semibold hover:bg-tangerine-600 disabled:opacity-50">
            {saving ? "保存中..." : "创建"}
          </button>
        </div>
      </div>
    </div>
  );
}
