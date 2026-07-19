import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Search } from "lucide-react";
import api from "../api/client";
import ExerciseCard from "../components/ExerciseCard";
import ExerciseDetailDrawer from "../components/ExerciseDetailDrawer";
import FilterBar from "../components/FilterBar";

interface ExerciseBrief {
  id: string;
  name: string;
  body_part: string;
  equipment: string;
  target: string;
  gif_url: string;
  image_url: string;
}

interface ExerciseDetail extends ExerciseBrief {
  muscle_group: string;
  secondary_muscles: string[];
  instructions: string;
  instruction_steps: string[];
}

export default function ExercisesPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const addToSessionId = searchParams.get("addTo");

  const [exercises, setExercises] = useState<ExerciseBrief[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedBodyPart, setSelectedBodyPart] = useState("");
  const [selectedEquipment, setSelectedEquipment] = useState("");
  const [bodyPartOptions, setBodyPartOptions] = useState<{ value: string; label: string }[]>([]);
  const [equipmentOptions, setEquipmentOptions] = useState<{ value: string; label: string }[]>([]);

  const [selectedExercise, setSelectedExercise] = useState<ExerciseDetail | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState(false);

  const fetchFilters = useCallback(async () => {
    try {
      const { data } = await api.get("/exercises/filters");
      setBodyPartOptions(
        (data.body_parts as string[]).map((v, i) => ({
          value: v,
          label: (data.body_parts_zh as string[])[i] ?? v,
        }))
      );
      setEquipmentOptions(
        (data.equipment as string[]).map((v, i) => ({
          value: v,
          label: (data.equipment_zh as string[])[i] ?? v,
        }))
      );
    } catch (err) {
      console.error("Failed to load filters", err);
    }
  }, []);

  const fetchExercises = useCallback(async (pageNum: number, reset: boolean) => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page: pageNum, size: 24, lang: "zh" };
      if (selectedBodyPart) params.body_part = selectedBodyPart;
      if (selectedEquipment) params.equipment = selectedEquipment;
      if (search.trim()) params.search = search.trim();

      const { data } = await api.get("/exercises", { params });
      if (reset) {
        setExercises(data.items);
      } else {
        setExercises((prev) => [...prev, ...data.items]);
      }
      setTotal(data.total);
    } catch (err) {
      console.error("Failed to load exercises", err);
    } finally {
      setLoading(false);
    }
  }, [search, selectedBodyPart, selectedEquipment]);

  useEffect(() => {
    fetchFilters();
  }, [fetchFilters]);

  useEffect(() => {
    setPage(1);
    fetchExercises(1, true);
  }, [fetchExercises]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchExercises(next, false);
  };

  const openDetail = async (id: string) => {
    try {
      const { data } = await api.get(`/exercises/${id}?lang=zh`);
      setSelectedExercise(data);
      setDrawerOpen(true);
    } catch (err) {
      console.error("Failed to load detail", err);
    }
  };

  const addToSession = async (exerciseId: string) => {
    if (!addToSessionId || adding) return;
    setAdding(true);
    try {
      await api.post(`/workouts/${addToSessionId}/logs`, {
        exercise_id: exerciseId,
        sets: 3,
        reps: 10,
        weight_kg: 0,
        order: 0,
      });
      setAddedIds((prev) => new Set(prev).add(exerciseId));
    } catch (err) {
      console.error("Failed to add exercise", err);
    } finally {
      setAdding(false);
    }
  };

  const goBack = () => {
    navigate("/");
  };

  return (
    <div>
      {addToSessionId ? (
        <div className="space-y-3 mb-3">
          <div className="flex items-center gap-3 bg-tangerine-50 rounded-xl px-3 py-2">
            <button onClick={goBack} className="p-1 hover:bg-tangerine-100 rounded-lg transition-colors">
              <ArrowLeft size={18} className="text-tangerine-600" />
            </button>
            <span className="text-sm font-medium text-tangerine-700 flex-1">
              选择动作添加到训练
            </span>
          </div>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-cocoa-400" />
            <input
              type="text"
              placeholder="搜索动作..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-tangerine-100/50
                         text-sm text-cocoa-900 placeholder-cocoa-400
                         focus:outline-none focus:ring-2 focus:ring-tangerine-300 focus:border-transparent
                         transition-all"
            />
          </div>
        </div>
      ) : (
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          selectedBodyPart={selectedBodyPart}
          onBodyPartChange={setSelectedBodyPart}
          selectedEquipment={selectedEquipment}
          onEquipmentChange={setSelectedEquipment}
          bodyPartOptions={bodyPartOptions}
          equipmentOptions={equipmentOptions}
        />
      )}

      {!addToSessionId && (
        <div className="mt-4">
          <p className="text-xs text-cocoa-400 mb-2">{total} 个动作</p>
        </div>
      )}

      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {exercises.map((ex) => (
          <div key={ex.id} className="relative">
            <ExerciseCard {...ex} onClick={() => openDetail(ex.id)} />
            {addToSessionId && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  addToSession(ex.id);
                }}
                disabled={addedIds.has(ex.id) || adding}
                className={`absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-white shadow transition-all ${
                  addedIds.has(ex.id)
                    ? "bg-lime"
                    : "bg-tangerine-500 hover:bg-tangerine-600 active:scale-90"
                }`}
              >
                {addedIds.has(ex.id) ? <Check size={14} /> : <span className="text-lg leading-none">+</span>}
              </button>
            )}
          </div>
        ))}
      </div>

      {loading && (
        <div className="flex justify-center py-6">
          <div className="w-6 h-6 border-2 border-tangerine-300 border-t-tangerine-500 rounded-full animate-spin" />
        </div>
      )}

      {!loading && exercises.length < total && (
        <div className="flex justify-center py-4">
          <button onClick={loadMore} className="btn-secondary text-sm px-8">
            加载更多
          </button>
        </div>
      )}

      {!loading && exercises.length === 0 && (
        <div className="text-center py-12 text-cocoa-400">
          <p className="text-sm">没有匹配的动作</p>
        </div>
      )}

      <ExerciseDetailDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        exercise={selectedExercise}
        showAddButton={!!addToSessionId}
        onAddToSession={addToSessionId ? (id) => addToSession(id) : undefined}
        isAdded={selectedExercise ? addedIds.has(selectedExercise.id) : false}
      />
    </div>
  );
}
