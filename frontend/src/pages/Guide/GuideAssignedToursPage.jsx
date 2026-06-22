/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';

import { getAssignedTours, getGuideStats } from '../../api/guideApi';
import GuideStatCard from '../../components/guide/GuideStatCard';
import GuideFilterGroup from '../../features/guideTours/GuideFilterGroup';
import GuideTourTable from '../../features/guideTours/GuideTourTable';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const WEEKDAY_SHORT = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

const STATUS_META = {
  open:      { label: 'Đang diễn ra', bar: '#1a56db', badge: '#1e40af', dot: '#1a56db' },
  upcoming:  { label: 'Sắp diễn ra',  bar: '#0e7490', badge: '#0369a1', dot: '#0e7490' },
  closed:    { label: 'Đã hoàn thành',bar: '#9ca3af', badge: '#6b7280', dot: '#9ca3af' },
  cancelled: { label: 'Đã hủy',       bar: '#ef4444', badge: '#dc2626', dot: '#ef4444' },
};

const resolveStatus = (tour) => {
  const s = (tour.status || '').toLowerCase();
  if (s === 'open') {
    if (tour.departureDate && new Date(tour.departureDate) > new Date()) return 'upcoming';
    return 'open';
  }
  if (s === 'closed' || s === 'completed') return 'closed';
  if (s === 'cancelled') return 'cancelled';
  return 'open';
};

const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();

const getTourRange = (tour, year, month) => {
  if (!tour.departureDate && !tour.returnDate) return null;
  const dep = tour.departureDate ? new Date(tour.departureDate) : null;
  const ret = tour.returnDate    ? new Date(tour.returnDate)    : dep;
  const first = new Date(year, month, 1);
  const last  = new Date(year, month, getDaysInMonth(year, month));
  const start = dep || ret;
  if (start > last || ret < first) return null;
  const cs = start < first ? first : start;
  const ce = ret   > last  ? last  : ret;
  return { startDay: cs.getDate(), endDay: ce.getDate() };
};

// ─── Schedule Gantt Modal ─────────────────────────────────────────────────────
const ScheduleGanttModal = ({ tours, onClose, onTourClick }) => {
  const today = new Date();
  const [year,  setYear]  = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [filter, setFilter] = useState('all');

  const daysInMonth = getDaysInMonth(year, month);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const goBack = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  };
  const goNext = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  };
  const goToday = () => { setYear(today.getFullYear()); setMonth(today.getMonth()); };

  const monthLabel = new Date(year, month, 1)
    .toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })
    .replace(/^./, c => c.toUpperCase());

  const FILTER_OPTS = [
    { key: 'all',      label: 'Tất cả' },
    { key: 'upcoming', label: 'Sắp diễn ra' },
    { key: 'open',     label: 'Đang diễn ra' },
    { key: 'closed',   label: 'Đã hoàn thành' },
  ];

  const visible = tours
    .filter(t => {
      const s = resolveStatus(t);
      if (filter !== 'all' && s !== filter) return false;
      return getTourRange(t, year, month) !== null;
    });

  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();
  const todayDay = today.getDate();

  const LABEL_COL = 230; // px width of left name column

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ width: 'min(98vw, 1200px)', maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Modal Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="flex items-center gap-2 text-slate-700">
            <span className="material-symbols-outlined text-blue-600">calendar_month</span>
            <h3 className="font-bold text-base">Lịch trình dẫn tour</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* ── Controls bar ── */}
        <div className="flex flex-wrap items-center gap-3 px-6 py-3 border-b border-slate-100 bg-white shrink-0">
          {/* Month nav */}
          <div className="flex items-center gap-1 font-semibold text-slate-700">
            <button
              onClick={goBack}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 transition"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            <span className="px-1 text-sm min-w-[130px] text-center">{monthLabel}</span>
            <button
              onClick={goNext}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 transition"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>

          <button
            onClick={goToday}
            className="text-xs font-semibold px-3 py-1 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-600 transition"
          >
            Hôm nay
          </button>

          <div className="hidden sm:block w-px h-5 bg-slate-200" />

          {/* Status filter */}
          <div className="flex items-center gap-1">
            <span className="text-xs font-medium text-slate-500 mr-1">Trạng thái:</span>
            {FILTER_OPTS.map(opt => (
              <button
                key={opt.key}
                onClick={() => setFilter(opt.key)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  filter === opt.key
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Gantt Grid ── */}
        <div className="overflow-auto flex-1">
          <div style={{ minWidth: LABEL_COL + daysInMonth * 34 }}>

            {/* Column header row */}
            <div
              className="grid border-b border-slate-200 bg-slate-50 sticky top-0 z-20"
              style={{ gridTemplateColumns: `${LABEL_COL}px repeat(${daysInMonth}, 1fr)` }}
            >
              <div className="px-4 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wide border-r border-slate-200 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">sort</span>
                Tên Tour &amp; Mã
              </div>
              {days.map(d => {
                const dow = new Date(year, month, d).getDay();
                const isSun = dow === 0;
                const isSat = dow === 6;
                const isToday = isCurrentMonth && d === todayDay;
                return (
                  <div
                    key={d}
                    className={`text-center py-1 border-r border-slate-100 last:border-r-0 ${isToday ? 'bg-blue-50' : ''}`}
                  >
                    <div className={`text-[9px] font-bold leading-tight ${isSun || isSat ? 'text-red-400' : 'text-slate-400'}`}>
                      {WEEKDAY_SHORT[dow]}
                    </div>
                    <div className={`text-[11px] font-bold leading-tight mx-auto ${
                      isToday
                        ? 'w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center'
                        : isSun || isSat ? 'text-red-400' : 'text-slate-600'
                    }`}>
                      {d}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Empty state */}
            {visible.length === 0 && (
              <div className="py-20 text-center text-slate-400">
                <span className="material-symbols-outlined text-5xl block mb-2 text-slate-300">event_busy</span>
                <p className="text-sm font-medium">Không có tour nào trong tháng này.</p>
                <p className="text-xs mt-1 text-slate-300">Thử điều hướng sang tháng khác</p>
              </div>
            )}

            {/* Tour rows */}
            {visible.map((tour, idx) => {
              const status = resolveStatus(tour);
              const meta   = STATUS_META[status] || STATUS_META.open;
              const range  = getTourRange(tour, year, month);

              const nights = tour.departureDate && tour.returnDate
                ? Math.round((new Date(tour.returnDate) - new Date(tour.departureDate)) / 86400000)
                : 0;
              const barLabel = nights > 0
                ? `${nights + 1} Ngày ${nights} Đêm`
                : (tour.scheduleCode || '');

              return (
                <div
                  key={tour.assignmentId || tour.id}
                  className={`grid relative border-b border-slate-100 group transition-colors hover:bg-blue-50/30 ${
                    idx % 2 === 1 ? 'bg-slate-50/40' : 'bg-white'
                  }`}
                  style={{ gridTemplateColumns: `${LABEL_COL}px repeat(${daysInMonth}, 1fr)`, minHeight: 54 }}
                >
                  {/* Tour name column */}
                  <div
                    className="px-3 py-2 border-r border-slate-200 flex flex-col justify-center sticky left-0 bg-inherit z-10"
                    style={{ background: idx % 2 === 1 ? '#f8fafc' : '#fff' }}
                  >
                    <p
                      className="text-[12px] font-bold text-slate-700 line-clamp-1 cursor-pointer hover:text-blue-600 transition leading-tight"
                      onClick={() => { onClose(); onTourClick?.(tour); }}
                    >
                      {tour.title}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                      <span className="text-[10px] font-bold bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded leading-tight">
                        {tour.scheduleCode || '—'}
                      </span>
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded leading-tight"
                        style={{ background: meta.dot + '20', color: meta.badge }}
                      >
                        {meta.label}
                      </span>
                    </div>
                  </div>

                  {/* Day cells (background stripes only) */}
                  {days.map(d => {
                    const dow = new Date(year, month, d).getDay();
                    const isToday   = isCurrentMonth && d === todayDay;
                    const isWeekend = dow === 0 || dow === 6;
                    return (
                      <div
                        key={d}
                        className={`border-r border-slate-100 last:border-r-0 ${
                          isToday   ? 'bg-blue-50/70' :
                          isWeekend ? 'bg-slate-50/80' : ''
                        }`}
                      />
                    );
                  })}

                  {/* Tour bar */}
                  {range && (
                    <div
                      className="absolute top-1/2 -translate-y-1/2 z-20 rounded-md flex items-center px-2 cursor-pointer hover:brightness-90 transition select-none shadow-sm"
                      style={{
                        left:   `calc(${LABEL_COL}px + ((${range.startDay - 1}) / ${daysInMonth}) * calc(100% - ${LABEL_COL}px))`,
                        width:  `calc(((${range.endDay - range.startDay + 1}) / ${daysInMonth}) * calc(100% - ${LABEL_COL}px))`,
                        height: 28,
                        backgroundColor: meta.bar,
                        minWidth: 32,
                      }}
                      onClick={() => { onClose(); onTourClick?.(tour); }}
                      title={`${tour.title} – ${barLabel}`}
                    >
                      <span className="text-[10px] font-bold text-white truncate leading-none">
                        {barLabel}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Legend ── */}
        <div className="flex flex-wrap gap-4 px-6 py-3 border-t border-slate-100 bg-slate-50 shrink-0">
          {Object.entries(STATUS_META).map(([key, m]) => (
            <div key={key} className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full" style={{ background: m.dot }} />
              <span className="text-[11px] font-semibold text-slate-600">{m.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const GuideAssignedToursPage = () => {
  const navigate = useNavigate();

  const [tours, setTours] = useState([]);
  const [filters, setFilters] = useState({ status: 'all', month: 'all' });
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [stats, setStats] = useState({ totalTours: 0, upcomingTours: 0 });
  const [isLoadingTours, setIsLoadingTours] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [error, setError] = useState(null);

  const fetchTours = async () => {
    try {
      setIsLoadingTours(true);
      setError(null);
      const response = await getAssignedTours({
        status: filters.status,
        month:  filters.month,
        page:   pagination.page,
        limit:  pagination.limit,
      });
      setTours(response.tours || []);
      setPagination(p => ({ ...p, page: response.page || 1, limit: response.limit || 10, total: response.total || 0 }));
    } catch (err) {
      console.error('Failed to fetch tours:', err);
      setError('Lỗi khi tải danh sách tour');
      setTours([]);
    } finally {
      setIsLoadingTours(false);
    }
  };

  const fetchStats = async () => {
    try {
      setIsLoadingStats(true);
      const response = await getGuideStats();
      setStats({ totalTours: response.totalTours || 0, upcomingTours: response.upcomingTours || 0 });
    } catch {
      setStats({ totalTours: 0, upcomingTours: 0 });
    } finally {
      setIsLoadingStats(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);
  useEffect(() => { fetchTours(); }, [filters, pagination.page]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPagination(p => ({ ...p, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination(p => ({ ...p, page: newPage }));
  };

  const handleRowClick = (tour) => navigate(`/guides/tours/${tour.id}`, { state: { tour } });
  const handleDetailClick = (tour) => navigate(`/guides/tours/${tour.id}`, { state: { tour } });

  return (
    <main className="flex-grow px-margin-mobile md:px-margin-desktop py-xl max-w-[1440px] mx-auto w-full">
      {error && (
        <div className="mb-lg p-md rounded-lg bg-error-container/20 border border-error/30 flex items-start gap-md">
          <span className="material-symbols-outlined text-error flex-shrink-0 mt-0.5">error</span>
          <p className="font-label-md text-error font-semibold">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-error hover:opacity-75">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      )}

      <div className="mb-xl flex flex-col md:flex-row md:items-end justify-between gap-md">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface mb-xs">
            Tour đang được phân công
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Chào mừng trở lại, hãy kiểm tra lịch trình vận hành của bạn.
          </p>
        </div>
        <div className="flex gap-sm">
          <GuideStatCard
            icon="tour"
            title="Tổng Tour"
            value={isLoadingStats ? '...' : stats.totalTours}
            bgColorClass="bg-primary/10"
            iconColor="text-primary"
          />
          <GuideStatCard
            icon="pending_actions"
            title="Sắp diễn ra"
            value={isLoadingStats ? '...' : stats.upcomingTours}
            bgColorClass="bg-secondary-container/10"
            iconColor="text-secondary"
          />
        </div>
      </div>

      <GuideFilterGroup
        filters={filters}
        onFilterChange={handleFilterChange}
        onScheduleClick={() => setShowScheduleModal(true)}
        isLoading={isLoadingTours}
      />

      <GuideTourTable
        tours={tours}
        isLoading={isLoadingTours}
        pagination={pagination}
        onPageChange={handlePageChange}
        onRowClick={handleRowClick}
        onDetailClick={handleDetailClick}
      />

      {showScheduleModal && (
        <ScheduleGanttModal
          tours={tours}
          onClose={() => setShowScheduleModal(false)}
          onTourClick={(tour) => {
            setShowScheduleModal(false);
            handleDetailClick(tour);
          }}
        />
      )}
    </main>
  );
};

export default GuideAssignedToursPage;
