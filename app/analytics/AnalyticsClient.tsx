"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Download,
  Filter,
  GraduationCap,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";

interface Question {
  _id: string;
  question: string;
  type: string;
  options?: string[];
}
interface Quiz {
  _id: string;
  settings: { title: string };
  questionSets?: { questions: Question[] }[];
  questions?: Question[];
}
interface Submission {
  _id: string;
  quizId: { _id: string; settings: { title: string } };
  quizTakerId: { _id: string };
  answers: {
    questionId: string;
    answer: string | string[] | boolean;
    isCorrect: boolean;
  }[];
  percentage: number;
  timeTaken: number;
  status: string;
  submittedAt: string;
}
interface Props {
  submissions: Submission[];
  quizzes: Quiz[];
  initialAnalytics?: unknown;
  initialQuizId?: string;
}
const PALETTE = ["#d73b36", "#6f7d76", "#004b37", "#ff9423"];
const time = (seconds: number) => {
  if (!seconds) return "—";
  const minutes = Math.floor(seconds / 60);
  return minutes ? minutes + "m " + (seconds % 60) + "s" : seconds + "s";
};

function getQuestions(quizzes: Quiz[]) {
  const map = new Map<string, { title: string; question: Question }>();
  quizzes.forEach((quiz) => {
    const questions = [
      ...(quiz.questions || []),
      ...(quiz.questionSets || []).flatMap((set) => set.questions || []),
    ];
    questions.forEach((question) =>
      map.set(question._id, { title: quiz.settings.title, question }),
    );
  });
  return map;
}

export default function AnalyticsClient({
  submissions,
  quizzes,
  initialQuizId,
}: Props) {
  const [range, setRange] = useState("30");
  const [quizId, setQuizId] = useState(initialQuizId || "all");
  const [metric, setMetric] = useState<"submissions" | "score">("submissions");

  const analytics = useMemo(() => {
    const days = Number(range);
    const since = new Date();
    since.setDate(since.getDate() - days);
    const filtered = submissions.filter(
      (item) =>
        (quizId === "all" || item.quizId?._id === quizId) &&
        new Date(item.submittedAt) >= since,
    );
    const completed = filtered.filter(
      (item) => item.status === "auto-graded" || item.status === "completed",
    );
    const questionMap = getQuestions(quizzes);
    const averageScore = completed.length
      ? completed.reduce((sum, item) => sum + item.percentage, 0) /
        completed.length
      : 0;
    const averageTime = completed.length
      ? completed.reduce((sum, item) => sum + item.timeTaken, 0) /
        completed.length
      : 0;
    const trend = Array.from({ length: days }, (_, index) => {
      const current = new Date();
      current.setDate(current.getDate() - (days - 1 - index));
      const key = current.toISOString().slice(0, 10);
      const values = filtered.filter(
        (item) => item.submittedAt?.slice(0, 10) === key,
      );
      return {
        date: current.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        submissions: values.length,
        score: values.length
          ? Math.round(
              values.reduce((sum, item) => sum + item.percentage, 0) /
                values.length,
            )
          : 0,
      };
    });
    const distribution = [
      { range: "0–39%", value: 0 },
      { range: "40–59%", value: 0 },
      { range: "60–79%", value: 0 },
      { range: "80–100%", value: 0 },
    ];
    completed.forEach(
      (item) =>
        distribution[
          item.percentage < 40
            ? 0
            : item.percentage < 60
              ? 1
              : item.percentage < 80
                ? 2
                : 3
        ].value++,
    );
    const tracks = new Map<
      string,
      { name: string; sum: number; count: number }
    >();
    filtered.forEach((item) => {
      const id = item.quizId?._id || "unknown";
      const value = tracks.get(id) || {
        name: item.quizId?.settings?.title || "Untitled assessment",
        sum: 0,
        count: 0,
      };
      value.sum += item.percentage;
      value.count++;
      tracks.set(id, value);
    });
    const performance = Array.from(tracks.values())
      .map((item) => ({
        name: item.name,
        average: Math.round((item.sum / item.count) * 10) / 10,
        count: item.count,
      }))
      .sort((a, b) => b.average - a.average)
      .slice(0, 5);
    const stats = new Map<
      string,
      { total: number; correct: number; answers: Map<string, number> }
    >();
    filtered.forEach((item) =>
      item.answers?.forEach((answer) => {
        const value = stats.get(answer.questionId) || {
          total: 0,
          correct: 0,
          answers: new Map(),
        };
        value.total++;
        if (answer.isCorrect) value.correct++;
        if (answer.answer !== "") {
          const label = Array.isArray(answer.answer)
            ? answer.answer.join(", ")
            : String(answer.answer);
          value.answers.set(label, (value.answers.get(label) || 0) + 1);
        }
        stats.set(answer.questionId, value);
      }),
    );
    const difficult = Array.from(stats.entries())
      .map(([id, stat]) => {
        const details = questionMap.get(id);
        const pick = Array.from(stat.answers.entries()).sort(
          (a, b) => b[1] - a[1],
        )[0];
        return {
          id,
          title: details?.title || "Assessment",
          text: details?.question.question || "Question unavailable",
          type: details?.question.type || "Question",
          accuracy: Math.round((stat.correct / stat.total) * 100),
          answer: pick?.[0] || "Not answered",
          pickRate: pick ? Math.round((pick[1] / stat.total) * 100) : 0,
          attempts: stat.total,
        };
      })
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 3);
    return {
      filtered,
      completed,
      averageScore,
      averageTime,
      trend,
      distribution,
      performance,
      difficult,
      active: new Set(filtered.map((item) => item.quizTakerId?._id)).size,
    };
  }, [submissions, quizzes, range, quizId]);

  const completion = analytics.filtered.length
    ? (analytics.completed.length / analytics.filtered.length) * 100
    : 0;
  return (
    <main className="min-h-screen bg-[#f5f7f6] px-4 pb-10 pt-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1440px]">
        <header className="mb-4 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            
            <h1 className="text-2xl font-bold tracking-tight text-[#091d15] sm:text-3xl">
              Students analytics &amp; performance
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-500">
              Real-time cohort diagnostics, attempt velocity, score patterns,
              and question-level insights.
            </p>
          </div>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#004b37] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#003b2c]"
          >
            <Download className="h-4 w-4" /> Export PDF report
          </button>
        </header>

        <section className="mb-4 rounded-xl border border-[#e5ebe8] bg-white p-3 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="flex flex-wrap gap-1">
              <span className="inline-flex items-center gap-2 rounded-lg bg-[#ecf2ef] px-3 py-2 text-xs font-semibold text-[#004b37]">
                <Filter className="h-3.5 w-3.5" /> Last {range} days
              </span>
              {["7", "30", "90"].map((value) => (
                <button
                  key={value}
                  onClick={() => setRange(value)}
                  className={
                    "rounded-lg px-3 py-2 text-xs font-semibold " +
                    (range === value
                      ? "bg-[#004b37] text-white"
                      : "text-slate-500 hover:bg-slate-50")
                  }
                >
                  {value} days
                </button>
              ))}
            </div>
            <div className="h-5 w-px bg-slate-200" />
            <select
              value={quizId}
              onChange={(event) => setQuizId(event.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600"
            >
              <option value="all">All examinations</option>
              {quizzes.map((quiz) => (
                <option key={quiz._id} value={quiz._id}>
                  {quiz.settings.title}
                </option>
              ))}
            </select>
            <span className="ml-auto flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[.12em] text-slate-500">
              <span className="h-1.5 w-1.5 rounded-full bg-[#ff9423]" />{" "}
              Telemetry synced
            </span>
          </div>
        </section>

        <section className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Metric
            icon={<TrendingUp />}
            label="Total submissions"
            value={analytics.filtered.length.toLocaleString()}
            caption={analytics.active + " active candidates"}
            tone="emerald"
          />
          <Metric
            icon={<CheckCircle2 />}
            label="Completion rate"
            value={completion.toFixed(1) + "%"}
            caption="Completed / total attempts"
            tone="mint"
          />
          <Metric
            icon={<Target />}
            label="Average score"
            value={analytics.averageScore.toFixed(1) + "%"}
            caption="Across completed attempts"
            tone="orange"
          />
          <Metric
            icon={<Clock3 />}
            label="Pacing / item"
            value={time(analytics.averageTime)}
            caption="Mean attempt time"
            tone="slate"
          />
          <Metric
            icon={<Users />}
            label="Active examinees"
            value={analytics.active.toLocaleString()}
            caption="Current selected range"
            tone="emerald"
          />
        </section>

        <section className="mb-4 rounded-xl border border-[#e5ebe8] bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#101f19]">
                Quiz attempts &amp; submission velocity
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Tracking daily completed attempts and mean cohort score.
              </p>
            </div>
            <div className="flex rounded-lg bg-[#f0f3f1] p-1">
              {(["submissions", "score"] as const).map((value) => (
                <button
                  key={value}
                  onClick={() => setMetric(value)}
                  className={
                    "rounded-md px-3 py-1.5 text-[11px] font-semibold " +
                    (metric === value
                      ? "bg-white text-[#004b37] shadow-sm"
                      : "text-slate-500")
                  }
                >
                  {value === "submissions" ? "Daily" : "Avg. score"}
                </button>
              ))}
            </div>
          </div>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.trend}>
                <defs>
                  <linearGradient
                    id="analytics-submissions"
                    x1="0"
                    x2="0"
                    y1="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#004b37" stopOpacity=".25" />
                    <stop offset="100%" stopColor="#004b37" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#edf0ee" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "#758079" }}
                  axisLine={false}
                  tickLine={false}
                  minTickGap={30}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#758079" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 10,
                    border: "1px solid #e5ebe8",
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey={metric}
                  name={
                    metric === "submissions" ? "Submissions" : "Average score"
                  }
                  stroke="#004b37"
                  fill="url(#analytics-submissions)"
                  strokeWidth={2.5}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex flex-wrap gap-5 border-t border-slate-100 pt-3 text-xs">
            <span className="text-slate-500">
              Peak daily session{" "}
              <b className="ml-1 text-[#15271f]">
                {Math.max(
                  0,
                  ...analytics.trend.map((item) => item.submissions),
                )}{" "}
                submissions
              </b>
            </span>
            <span className="text-slate-500">
              Mean cohort score{" "}
              <b className="ml-1 text-[#15271f]">
                {analytics.averageScore.toFixed(1)}%
              </b>
            </span>
          </div>
        </section>

        <section className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <article className="rounded-xl border border-[#e5ebe8] bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-[#101f19]">
                  Cohort score distribution
                </h2>
                <p className="text-xs text-slate-500">
                  Where candidate outcomes are clustering.
                </p>
              </div>
              <GraduationCap className="h-5 w-5 text-[#ff9423]" />
            </div>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.distribution}
                    dataKey="value"
                    nameKey="range"
                    innerRadius={52}
                    outerRadius={78}
                    paddingAngle={3}
                  >
                    {analytics.distribution.map((item, index) => (
                      <Cell key={item.range} fill={PALETTE[index]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {analytics.distribution.map((item, index) => (
                <div
                  key={item.range}
                  className="flex items-center justify-between rounded bg-[#f5f7f6] px-2.5 py-2 text-[11px] text-slate-600"
                >
                  <span>
                    <i
                      className="mr-1.5 inline-block h-2 w-2 rounded-full"
                      style={{ background: PALETTE[index] }}
                    />
                    {item.range}
                  </span>
                  <b className="text-[#15271f]">{item.value}</b>
                </div>
              ))}
            </div>
          </article>
          <article className="rounded-xl border border-[#e5ebe8] bg-white p-5 shadow-sm">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-[#101f19]">
                Exam performance comparison
              </h2>
              <p className="text-xs text-slate-500">
                Average score across assessed examination tracks.
              </p>
            </div>
            <div className="space-y-4">
              {analytics.performance.length ? (
                analytics.performance.map((track, index) => (
                  <div key={track.name}>
                    <div className="mb-1.5 flex justify-between gap-3 text-xs">
                      <span className="truncate font-semibold text-[#24342d]">
                        {track.name}
                      </span>
                      <span className="font-bold text-[#004b37]">
                        {track.average}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[#edf1ef]">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: track.average + "%",
                          background:
                            index === 0
                              ? "#004b37"
                              : index === 1
                                ? "#ff9423"
                                : "#849089",
                        }}
                      />
                    </div>
                    <p className="mt-1 text-[10px] text-slate-400">
                      {track.count} attempt{track.count === 1 ? "" : "s"}
                    </p>
                  </div>
                ))
              ) : (
                <p className="py-12 text-center text-sm text-slate-500">
                  No completed examination data yet.
                </p>
              )}
            </div>
            <button className="mt-5 inline-flex items-center gap-1 text-xs font-semibold text-[#a74408]">
              View exam breakdown <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </article>
        </section>

        <section className="rounded-xl border border-[#e5ebe8] bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-bold text-[#101f19]">
                <AlertTriangle className="h-4 w-4 text-[#d73b36]" /> Most
                challenging questions &amp; distractor analysis
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                High-yield diagnostics flagging the lowest cohort accuracy and
                misconceptions.
              </p>
            </div>
            <span className="hidden rounded bg-[#fff0e3] px-2 py-1 text-[10px] font-bold text-[#a4440a] sm:block">
              Failure rate &gt; 60%
            </span>
          </div>
          <div className="space-y-3">
            {analytics.difficult.length ? (
              analytics.difficult.map((item, index) => (
                <article
                  key={item.id}
                  className="grid gap-3 rounded-lg bg-[#f5f7f6] p-4 md:grid-cols-[auto_1fr_auto] md:items-center"
                >
                  <div className="rounded bg-[#ffe1de] px-2 py-1 text-center text-[10px] font-bold text-[#ba211b]">
                    {item.type.slice(0, 3).toUpperCase()}
                    <br />
                    Q.{index + 1}
                  </div>
                  <div>
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      {item.title}
                    </p>
                    <h3 className="line-clamp-1 text-sm font-semibold text-[#182922]">
                      {item.text}
                    </h3>
                    <p className="mt-1 text-[11px] text-slate-500">
                      Most selected:{" "}
                      <b className="text-[#a4440a]">{item.answer}</b> (
                      {item.pickRate}%) · {item.attempts} attempts
                    </p>
                  </div>
                  <div className="text-left md:text-right">
                    <p className="text-xl font-bold text-[#ba211b]">
                      {item.accuracy}%
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-[.12em] text-slate-400">
                      Cohort accuracy
                    </p>
                  </div>
                </article>
              ))
            ) : (
              <p className="py-10 text-center text-sm text-slate-500">
                Question diagnostic data will appear after candidates submit
                answers.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function Metric({
  icon,
  label,
  value,
  caption,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  caption: string;
  tone: "emerald" | "mint" | "orange" | "slate";
}) {
  const colors = {
    emerald: "bg-[#e7f5ed] text-[#004b37]",
    mint: "bg-[#e9f8f3] text-[#176148]",
    orange: "bg-[#fff0e4] text-[#a4440a]",
    slate: "bg-[#edf0ef] text-[#4f5d57]",
  };
  return (
    <article className="rounded-xl border border-[#e5ebe8] bg-white p-4 shadow-sm">
      <span
        className={
          "mb-3 grid h-8 w-8 place-items-center rounded-lg " + colors[tone]
        }
      >
        {icon}
      </span>
      <p className="text-[10px] font-bold uppercase tracking-[.13em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold text-[#091d15]">{value}</p>
      <p className="mt-1 text-[11px] text-slate-500">{caption}</p>
    </article>
  );
}
