import { Play } from "lucide-react";

interface ExerciseCardProps {
  id: string;
  name: string;
  body_part: string;
  equipment: string;
  target: string;
  gif_url: string;
  onClick: () => void;
}

export default function ExerciseCard({ name, body_part, equipment, gif_url, onClick }: ExerciseCardProps) {
  return (
    <button
      onClick={onClick}
      className="card cursor-pointer hover:shadow-tangerine-md transition-all duration-200 active:scale-[0.98] text-left w-full group"
    >
      <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-tangerine-50 mb-3">
        <img
          src={gif_url}
          alt={name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
          <Play size={28} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="white" />
        </div>
      </div>
      <h3 className="font-semibold text-sm text-cocoa-900 leading-tight mb-1 line-clamp-2">{name}</h3>
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-xs px-2 py-0.5 rounded-full bg-tangerine-100 text-tangerine-700 font-medium">
          {body_part}
        </span>
        <span className="text-xs text-cocoa-500">{equipment}</span>
      </div>
    </button>
  );
}
