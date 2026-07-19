import { useState, useEffect } from "react";
import api from "../api/client";

interface Overview {
  total_sessions: number;
  total_sets: number;
  total_volume_kg: number;
  pr_count: number;
  pr_increased: boolean;
}

interface PR {
  exercise_id: string;
  exercise_name: string;
  max_weight_kg: number;
  max_reps: number;
  achieved_at: string;
  gif_url: string;
}

export default function StatsPage() {
  const [period, setPeriod] = useState("month");
  const [overview, setOverview] = useState<Overview | null>(null);
  const [prs, setPRs] = useState<PR[]>([]);
  const [bodyParts, setBodyParts] = useState<Record<string, number>>({});
  const [topExercises, setTopExercises] = useState<{ exercise_id: string; name: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/stats/overview?period=${period}`),
      api.get("/stats/personal-records?lang=zh"),
      api.get(`/stats/body-parts?period=${period}&lang=zh`),
      api.get(`/stats/top-exercises?period=${period}&lang=zh`),
    ])
      .then(([o, p, b, t]) => {
        setOverview(o.data);
        setPRs(p.data);
        setBodyParts(b.data.body_parts);
        setTopExercises(t.data.exercises);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [period]);

  const periods = [
    { key: "week", label: "本周" },
    { key: "month", label: "本月" },
    { key: "3month", label: "近3月" },
  ];

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-6 h-6 border-2 border-tangerine-300 border-t-tangerine-500 rounded-full animate-spin" />
      </div>
    );
  }

  const bpTotal = Object.values(bodyParts).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-4">
      <div className="flex gap-1 bg-white rounded-xl p-1 border border-tangerine-100/50">
        {periods.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setPeriod(key)}
            className={`flex-1 py-1.5 text-sm rounded-lg font-medium transition-all ${
              period === key
                ? "bg-tangerine-500 text-white shadow-sm"
                : "text-cocoa-500 hover:bg-tangerine-50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {overview && (
        <div className="grid grid-cols-2 gap-3">
          <div className="metric-card">
            <span className="metric-label">训练次数</span>
            <span className="metric-value">{overview.total_sessions}</span>
          </div>
          <div className="metric-card">
            <span className="metric-label">总组数</span>
            <span className="metric-value">{overview.total_sets}</span>
          </div>
          <div className="metric-card">
            <span className="metric-label">总重量</span>
            <span className="metric-value">{(overview.total_volume_kg / 1000).toFixed(1)}T</span>
          </div>
          <div className="metric-card">
            <span className="metric-label">个人记录</span>
            <span className="metric-value">{overview.pr_increased ? "↑" : ""}{prs.length}</span>
          </div>
        </div>
      )}

      {topExercises.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-sm text-cocoa-900 mb-3">常用动作</h3>
          <div className="space-y-2">
            {topExercises.slice(0, 5).map((e, i) => (
              <div key={e.exercise_id} className="flex items-center gap-2">
                <span className="w-5 text-xs font-bold text-tangerine-500">{i + 1}</span>
                <div className="flex-1 bg-tangerine-50 rounded-full h-5 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-tangerine-400 to-tangerine-500 rounded-full transition-all"
                    style={{ width: `${(e.count / topExercises[0].count) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-cocoa-500 min-w-[40px] text-right">{e.count}次</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {bpTotal > 0 && (
        <div className="card">
          <h3 className="font-semibold text-sm text-cocoa-900 mb-3">身体部位分布</h3>
          <div className="space-y-2">
            {Object.entries(bodyParts)
              .sort(([, a], [, b]) => b - a)
              .map(([bp, count]) => (
                <div key={bp} className="flex items-center gap-2">
                  <span className="text-xs text-cocoa-700 w-20 truncate">{bp}</span>
                  <div className="flex-1 bg-tangerine-50 rounded-full h-4 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-tangerine-400 to-tangerine-500 rounded-full"
                      style={{ width: `${(count / bpTotal) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-cocoa-500 min-w-[28px]">{count}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {prs.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-sm text-cocoa-900 mb-3 flex items-center gap-1">
            <span className="text-flame">🔥</span> 个人记录
          </h3>
          <div className="space-y-2">
            {prs.map((pr) => (
              <div key={pr.exercise_id} className="flex items-center gap-3">
                <img src={pr.gif_url} alt={pr.exercise_name} className="w-8 h-8 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-cocoa-900 truncate">{pr.exercise_name}</p>
                  <p className="text-xs text-cocoa-400">{pr.achieved_at}</p>
                </div>
                <span className="font-mono font-bold text-flame text-sm">
                  {pr.max_weight_kg}kg × {pr.max_reps}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!overview?.total_sessions && (
        <div className="text-center py-10 text-cocoa-400">
          <p className="text-sm">暂无数据，开始训练后这里会出现统计</p>
        </div>
      )}
    </div>
  );
}
