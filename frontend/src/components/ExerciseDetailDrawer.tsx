import { X, Plus, Check } from "lucide-react";

interface ExerciseDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  showAddButton?: boolean;
  onAddToSession?: (id: string) => void;
  isAdded?: boolean;
  exercise?: {
    id: string;
    name: string;
    body_part: string;
    equipment: string;
    target: string;
    muscle_group: string;
    secondary_muscles: string[];
    instructions: string;
    instruction_steps: string[];
    gif_url: string;
  } | null;
}

export default function ExerciseDetailDrawer({
  open, onClose, exercise, showAddButton, onAddToSession, isAdded,
}: ExerciseDetailDrawerProps) {
  if (!open || !exercise) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-cocoa-900/30" />
      <div
        className="relative w-full max-w-sm bg-cream h-full overflow-y-auto shadow-xl animate-slideIn flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 bg-cream/95 backdrop-blur-sm p-4 flex items-center justify-between border-b border-tangerine-100/50">
          <h2 className="font-bold text-cocoa-900 truncate pr-2">{exercise.name}</h2>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-tangerine-100 transition-colors">
            <X size={18} className="text-cocoa-500" />
          </button>
        </div>

        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          <div className="rounded-2xl overflow-hidden bg-tangerine-50">
            <img src={exercise.gif_url} alt={exercise.name} className="w-full" />
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="text-xs px-2.5 py-1 rounded-full bg-tangerine-100 text-tangerine-700 font-medium">{exercise.body_part}</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-tangerine-100 text-tangerine-700 font-medium">{exercise.equipment}</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-flame/10 text-flame font-medium">{exercise.target}</span>
          </div>

          <div>
            <h3 className="font-semibold text-sm text-cocoa-900 mb-2">动作指导</h3>
            <ol className="space-y-2">
              {exercise.instruction_steps.map((step, i) => (
                <li key={i} className="flex gap-2 text-sm text-cocoa-700">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-tangerine-100 text-tangerine-600 text-xs flex items-center justify-center font-bold">{i + 1}</span>
                  <span className="leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {exercise.secondary_muscles.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm text-cocoa-900 mb-1">辅助肌群</h3>
              <p className="text-sm text-cocoa-500">{exercise.secondary_muscles.join(", ")}</p>
            </div>
          )}

          {exercise.muscle_group && (
            <div>
              <h3 className="font-semibold text-sm text-cocoa-900 mb-1">主协同肌群</h3>
              <p className="text-sm text-cocoa-500">{exercise.muscle_group}</p>
            </div>
          )}
        </div>

        {showAddButton && onAddToSession && (
          <div className="sticky bottom-0 p-4 border-t border-tangerine-100/50 bg-cream">
            <button
              onClick={() => onAddToSession(exercise.id)}
              disabled={isAdded}
              className={`w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                isAdded
                  ? "bg-lime/10 text-lime cursor-default"
                  : "bg-tangerine-500 text-white hover:bg-tangerine-600"
              }`}
            >
              {isAdded ? (
                <><Check size={16} /> 已添加到训练</>
              ) : (
                <><Plus size={16} /> 添加到训练</>
              )}
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(40px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-slideIn { animation: slideIn 300ms ease-out; }
      `}</style>
    </div>
  );
}
