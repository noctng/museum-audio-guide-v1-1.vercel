import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye, Headphones, Package, RefreshCw, Globe2, BarChart3, TrendingUp, UserCheck } from 'lucide-react';
import { ACTIVE_WINDOW_MS, PAGE_LABELS } from '@/lib/tracking';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

const LANGUAGES = [
  { code: 'en', name: 'English',    flag: '🇺🇸' },
  { code: 'vi', name: 'Tiếng Việt',  flag: '🇻🇳' },
  { code: 'zh', name: 'Tiếng Trung', flag: '🇨🇳' },
  { code: 'ru', name: 'Tiếng Nga',   flag: '🇷🇺' },
  { code: 'ko', name: 'Tiếng Hàn',   flag: '🇰🇷' },
  { code: 'ja', name: 'Tiếng Nhật',  flag: '🇯🇵' },
  { code: 'fr', name: 'Tiếng Pháp',  flag: '🇫🇷' },
  { code: 'de', name: 'Tiếng Đức',   flag: '🇩🇪' },
  { code: 'es', name: 'Tiếng Tây Ban Nha', flag: '🇪🇸' },
];

const LANG_META = Object.fromEntries(LANGUAGES.map(l => [l.code, l]));

// Màu cố định cho từng ngôn ngữ (dùng chung cho mọi chart)
const LANG_COLORS = {
  en: '#3b82f6', vi: '#f59e0b', zh: '#ef4444', ru: '#8b5cf6', ko: '#10b981',
  ja: '#ec4899', fr: '#06b6d4', de: '#84cc16', es: '#f97316',
};

const CHART_COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899', '#84cc16', '#f97316'];
const DAYS_LIMIT = 14; // biểu đồ xu hướng 14 ngày gần nhất
const REFRESH_INTERVAL = 30 * 1000; // tự tải lại mỗi 30 giây

const tooltipStyle = {
  borderRadius: 8,
  border: '1px solid #e2e8f0',
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  fontSize: 13,
};

export default function DashboardPage() {
  const [visitsByPage, setVisitsByPage] = useState({});   // Lượt truy cập theo trang { home: 12, ... }
  const [activeUsers, setActiveUsers] = useState({ total: 0, byPage: {} }); // Đang online
  const [listenEvents, setListenEvents] = useState([]);   // Danh sách lượt nghe
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [{ data: visitRows, error: visitError },
           { data: activeRows, error: activeError },
           { data: listenRows, error: listenError }] = await Promise.all([
      // Lượt truy cập theo từng trang
      supabase.from('page_visits').select('page, count'),
      // Session có ping trong 5 phút gần nhất = đang online
      supabase.from('active_sessions')
        .select('page')
        .gte('last_seen', new Date(Date.now() - ACTIVE_WINDOW_MS).toISOString()),
      // Danh sách lượt nghe
      supabase.from('listen_events')
        .select('artifact_code, language, created_at')
        .order('created_at', { ascending: false })
        .limit(50000),
    ]);

    if (visitError) setError(prev => prev || visitError.message);
    if (activeError) setError(prev => prev || activeError.message);
    if (listenError) setError(prev => prev || listenError.message);

    if (visitRows) {
      setVisitsByPage(Object.fromEntries(visitRows.map(r => [r.page, r.count || 0])));
    }
    if (activeRows) {
      const byPage = {};
      activeRows.forEach(r => { byPage[r.page] = (byPage[r.page] || 0) + 1; });
      setActiveUsers({ total: activeRows.length, byPage });
    }
    if (listenRows) setListenEvents(listenRows);
    setLastUpdated(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const timer = setInterval(fetchData, REFRESH_INTERVAL);
    return () => clearInterval(timer);
  }, [fetchData]);

  // ===== Thống kê tổng quan =====
  const stats = useMemo(() => {
    // --- Truy cập ---
    const totalVisits = Object.values(visitsByPage).reduce((s, c) => s + (c || 0), 0);

    // Danh sách các trang có dữ liệu (gộp cả tracking cũ lẫn mới)
    const pageKeys = [...new Set([
      ...Object.keys(PAGE_LABELS),
      ...Object.keys(visitsByPage),
      ...Object.keys(activeUsers.byPage),
    ])];
    const pageRows = pageKeys.map(page => ({
      page,
      label: PAGE_LABELS[page] || `Trang khác (${page})`,
      visits: visitsByPage[page] || 0,
      online: activeUsers.byPage[page] || 0,
    })).sort((a, b) => b.visits - a.visits);

    // --- Lượt nghe ---
    const totalListens = listenEvents.length;
    const byLanguage = {};   // { en: 12, vi: 8, ... }
    const byArtifact = {};   // { A001: { total, languages: {en: 3, ...} } }
    const byDay = {};        // { '2026-11-01': 5, ... }

    LANGUAGES.forEach(l => { byLanguage[l.code] = 0; });

    listenEvents.forEach(ev => {
      byLanguage[ev.language] = (byLanguage[ev.language] || 0) + 1;

      if (!byArtifact[ev.artifact_code]) {
        byArtifact[ev.artifact_code] = { artifact_code: ev.artifact_code, total: 0, languages: {} };
      }
      byArtifact[ev.artifact_code].total += 1;
      byArtifact[ev.artifact_code].languages[ev.language] =
        (byArtifact[ev.artifact_code].languages[ev.language] || 0) + 1;

      const day = (ev.created_at || '').slice(0, 10); // 'YYYY-MM-DD'
      if (day) byDay[day] = (byDay[day] || 0) + 1;
    });

    const languageList = LANGUAGES
      .map(l => ({ ...l, count: byLanguage[l.code] || 0 }))
      .sort((a, b) => b.count - a.count);

    const artifactList = Object.values(byArtifact).sort((a, b) => b.total - a.total);
    const topLanguage = languageList[0]?.count > 0 ? languageList[0] : null;
    const uniqueArtifacts = artifactList.length;

    // Xu hướng lượt nghe theo ngày (điền cả ngày không có lửa = 0)
    const trend = [];
    for (let i = DAYS_LIMIT - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      trend.push({
        date: d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
        listens: byDay[key] || 0,
      });
    }

    // Phân bố ngôn ngữ cho Pie (bỏ các ngôn ngữ 0 lượt)
    const languagePie = languageList.filter(l => l.count > 0).map(l => ({
      name: `${l.flag} ${l.name}`,
      value: l.count,
      color: LANG_COLORS[l.code],
    }));

    // Top 10 hiện vật nghe nhiều nhất
    const topArtifacts = artifactList.slice(0, 10).map(a => ({
      code: a.artifact_code,
      listens: a.total,
    }));

    return { totalVisits, pageRows, totalListens, languageList, languagePie, artifactList, topArtifacts, trend, topLanguage, uniqueArtifacts };
  }, [visitsByPage, activeUsers, listenEvents]);

  const formatTime = (d) =>
    d ? d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--:--';

  return (
    <div className="p-4 sm:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-amber-600" /> Dashboard
          </h1>
          <p className="text-sm text-slate-500">
            Thống kê lượt truy cập &amp; lượt nghe
            {lastUpdated && ` · Cập nhật lúc ${formatTime(lastUpdated)}`}
          </p>
        </div>
        <Button variant="outline" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      {error && (
        <Card className="border-red-300 bg-red-50">
          <CardContent className="p-4 text-sm text-red-700">
            Lỗi tải dữ liệu: {error}
            <br />
            <span className="text-xs">
              Nếu lỗi liên quan đến RLS, hãy chạy các file <code>supabase/tracking_fixes.sql</code> và <code>supabase/dashboard_stats.sql</code> trong Supabase SQL Editor.
            </span>
          </CardContent>
        </Card>
      )}

      {/* Thẻ tổng quan */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard
          icon={<Eye className="w-5 h-5 text-blue-600" />}
          label="Tổng lượt truy cập"
          value={stats.totalVisits.toLocaleString()}
          sub={`Trang chủ: ${(visitsByPage.home || 0).toLocaleString()}`}
        />
        <StatCard
          icon={<UserCheck className="w-5 h-5 text-green-600" />}
          label="Đang truy cập"
          value={activeUsers.total.toLocaleString()}
          sub={`Trong ${ACTIVE_WINDOW_MS / 60000} phút gần nhất`}
        />
        <StatCard
          icon={<Headphones className="w-5 h-5 text-amber-600" />}
          label="Tổng lượt nghe"
          value={stats.totalListens.toLocaleString()}
        />
        <StatCard
          icon={<Package className="w-5 h-5 text-emerald-600" />}
          label="Hiện vật được nghe"
          value={stats.uniqueArtifacts.toLocaleString()}
        />
        <StatCard
          icon={<Globe2 className="w-5 h-5 text-purple-600" />}
          label="Ngôn ngữ phổ biến nhất"
          value={stats.topLanguage ? `${stats.topLanguage.flag} ${LANG_META[stats.topLanguage.code]?.name}` : '—'}
          sub={stats.topLanguage ? `${stats.topLanguage.count.toLocaleString()} lượt nghe` : null}
        />
      </div>

      {/* Truy cập & online theo trang */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">🧭 Truy cập &amp; đang online theo trang</CardTitle>
          <p className="text-sm text-slate-500">"Đang online" = có hoạt động trong {ACTIVE_WINDOW_MS / 60000} phút gần nhất.</p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Trang</TableHead>
                <TableHead className="text-right">Tổng lượt truy cập</TableHead>
                <TableHead className="text-right">Đang online</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.pageRows.map(row => (
                <TableRow key={row.page}>
                  <TableCell className="font-medium">{row.label}</TableCell>
                  <TableCell className="text-right">{row.visits.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    {row.online > 0 ? (
                      <span className="inline-flex items-center gap-1.5 text-green-700 font-medium">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        {row.online.toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-slate-400">0</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-slate-50 font-semibold">
                <TableCell>Cộng</TableCell>
                <TableCell className="text-right">{stats.totalVisits.toLocaleString()}</TableCell>
                <TableCell className="text-right text-green-700">{activeUsers.total.toLocaleString()}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Xu hướng lượt nghe theo ngày */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-600" />
            Xu hướng lượt nghe ({DAYS_LIMIT} ngày gần nhất)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.trend} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="listensGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#64748b' }} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748b' }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [v.toLocaleString(), 'Lượt nghe']} />
                <Area
                  type="monotone"
                  dataKey="listens"
                  name="Lượt nghe"
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  fill="url(#listensGradient)"
                  dot={{ r: 3, fill: '#f59e0b' }}
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 2 chart cạnh nhau: theo ngôn ngữ + top hiện vật */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Cột lượt nghe theo ngôn ngữ (Bar) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">🎧 Lượt nghe theo ngôn ngữ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.languageList} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="code"
                    tick={{ fontSize: 13, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(code) => LANG_META[code]?.flag || code}
                  />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748b' }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(v) => [v.toLocaleString(), 'Lượt nghe']}
                    labelFormatter={(code) => `${LANG_META[code]?.flag || ''} ${LANG_META[code]?.name || code}`}
                  />
                  <Bar dataKey="count" name="Lượt nghe" radius={[6, 6, 0, 0]} maxBarSize={48}>
                    {stats.languageList.map((entry) => (
                      <Cell key={entry.code} fill={LANG_COLORS[entry.code] || '#94a3b8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Phân bố ngôn ngữ (Pie) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">🌐 Phân bố lượt nghe theo ngôn ngữ</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.languagePie.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-16">Chưa có lượt nghe nào.</p>
            ) : (
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.languagePie}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="45%"
                      innerRadius={55}
                      outerRadius={95}
                      paddingAngle={2}
                    >
                      {stats.languagePie.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} stroke="white" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} formatter={(v, n) => [v.toLocaleString(), n]} />
                    <Legend
                      layout="horizontal"
                      verticalAlign="bottom"
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: 12 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top hiện vật được nghe nhiều nhất (Bar ngang) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">🏆 Top {stats.topArtifacts.length || ''} hiện vật được nghe nhiều nhất</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.topArtifacts.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-10">Chưa có hiện vật nào được nghe.</p>
          ) : (
            <div className="w-full" style={{ height: Math.max(280, stats.topArtifacts.length * 44) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stats.topArtifacts}
                  layout="vertical"
                  margin={{ top: 8, right: 32, left: 8, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: '#64748b' }} tickLine={false} axisLine={false} />
                  <YAxis
                    type="category"
                    dataKey="code"
                    width={90}
                    tick={{ fontSize: 12, fill: '#334155' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => [v.toLocaleString(), 'Lượt nghe']} />
                  <Bar dataKey="listens" name="Lượt nghe" radius={[0, 6, 6, 0]} maxBarSize={28}>
                    {stats.topArtifacts.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chi tiết lượt nghe theo mã hiện vật */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">📦 Chi tiết lượt nghe theo mã hiện vật</CardTitle>
          <p className="text-sm text-slate-500">Sắp xếp theo tổng lượt nghe, giảm dần.</p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-slate-500">Đang tải...</p>
          ) : stats.artifactList.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-6">Chưa có hiện vật nào được nghe.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Mã hiện vật</TableHead>
                  <TableHead className="text-right">Tổng lượt nghe</TableHead>
                  <TableHead>Chi tiết theo ngôn ngữ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.artifactList.map((artifact, index) => (
                  <TableRow key={artifact.artifact_code}>
                    <TableCell className="text-slate-400">{index + 1}</TableCell>
                    <TableCell className="font-medium">{artifact.artifact_code}</TableCell>
                    <TableCell className="text-right font-semibold">{artifact.total.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5">
                        {LANGUAGES.filter(l => artifact.languages[l.code]).map(l => (
                          <span
                            key={l.code}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-xs text-slate-700"
                          >
                            <span>{l.flag}</span>
                            {l.code}: <strong>{artifact.languages[l.code]}</strong>
                          </span>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ icon, label, value, sub }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-2 text-slate-500 text-sm">
          {icon}
          {label}
        </div>
        <div className="mt-2 text-3xl font-bold text-slate-900 truncate">{value}</div>
        {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
      </CardContent>
    </Card>
  );
}
