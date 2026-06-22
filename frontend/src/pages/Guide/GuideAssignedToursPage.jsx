// Đường dẫn: frontend/src/pages/guide/GuideAssignedToursPage.jsx
/**
 * GuideAssignedToursPage Component
 * Trang chính "Danh sách Tour được phân công cho Hướng dẫn viên"
 *
 * Logic:
 * - Quản lý state: tours, filters, pagination, isLoading
 * - useEffect: Gọi API mỗi khi filters thay đổi
 * - useNavigate: Điều hướng tới trang chi tiết khi click nút
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Import API
import { getAssignedTours, getGuideStats, exportToursReport, getGuideProfile } from '../../api/guideApi';

// Import Components
import GuideStatCard from '../../components/guide/GuideStatCard';

// Import Features
import GuideFilterGroup from '../../features/guideTours/GuideFilterGroup';
import GuideTourTable from '../../features/guideTours/GuideTourTable';

const GuideAssignedToursPage = () => {
  const navigate = useNavigate();

  // ==================== STATE MANAGEMENT ====================

  // Danh sách tour
  const [tours, setTours] = useState([]);

  // Bộ lọc
  const [filters, setFilters] = useState({
    status: 'all',
    month: 'all',
  });

  // Phân trang
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
  });

  // Thống kê
  const [stats, setStats] = useState({
    totalTours: 0,
    upcomingTours: 0,
  });

  // Loading states
  const [isLoadingTours, setIsLoadingTours] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Error handling
  const [error, setError] = useState(null);

  // ==================== FETCH DATA ====================

  /**
   * Gọi API lấy danh sách tour
   * Chạy mỗi khi filters hoặc pagination thay đổi
   */
  const fetchTours = async () => {
    try {
      setIsLoadingTours(true);
      setError(null);

      const response = await getAssignedTours({
        status: filters.status,
        month: filters.month,
        page: pagination.page,
        limit: pagination.limit,
      });

      setTours(response.tours || []);
      setPagination({
        page: response.page || 1,
        limit: response.limit || 10,
        total: response.total || 0,
      });
    } catch (err) {
      console.error('Failed to fetch tours:', err);
      setError('Lỗi khi tải danh sách tour');
      setTours([]);
    } finally {
      setIsLoadingTours(false);
    }
  };

  /**
   * Gọi API lấy thống kê
   * Chạy 1 lần khi component mount
   */
  const fetchStats = async () => {
    try {
      setIsLoadingStats(true);

      const response = await getGuideStats();

      setStats({
        totalTours: response.totalTours || 0,
        upcomingTours: response.upcomingTours || 0,
      });
    } catch (err) {
      console.error('Failed to fetch stats:', err);
      setStats({
        totalTours: 0,
        upcomingTours: 0,
      });
    } finally {
      setIsLoadingStats(false);
    }
  };

  // ==================== EFFECTS ====================

  // Load stats when component mounts
  // eslint-disable-next-line react-hooks/set-state-in-effect
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchStats();
  }, []);

  // Load tours when filters or pagination changes
  // eslint-disable-next-line react-hooks/set-state-in-effect
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchTours();
  }, [filters, pagination.page]);

  // ==================== HANDLERS ====================

  /**
   * Xử lý thay đổi bộ lọc
   * Reset lại trang về 1 khi thay đổi filter
   */
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPagination({ ...pagination, page: 1 }); // Reset to page 1
  };

  /**
   * Xử lý thay đổi trang
   */
  const handlePageChange = (newPage) => {
    setPagination({ ...pagination, page: newPage });
  };

  /**
   * Xử lý click vào hàng tour
   */
  const handleRowClick = (tour) => {
    // Điều hướng tới trang chi tiết tour
    navigate(`/guides/tours/${tour.id}`, { state: { tour } });
  };

  /**
   * Xử lý click nút "Xem chi tiết"
   */
  const handleDetailClick = (tour) => {
    navigate(`/guides/tours/${tour.id}`, { state: { tour } });
  };

  /**
   * Xử lý xuất báo cáo
   */
  const handleExportReport = async () => {
    try {
      setIsExporting(true);
      setError(null);

      const blob = await exportToursReport(filters);

      // Tạo link download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `tour-report-${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export report:', err);
      setError('Lỗi khi xuất báo cáo');
    } finally {
      setIsExporting(false);
    }
  };

  // ==================== RENDER ====================

  return (
        <main className="flex-grow px-margin-mobile md:px-margin-desktop py-xl max-w-[1440px] mx-auto w-full">
          {/* Error Alert */}
          {error && (
              <div className="mb-lg p-md rounded-lg bg-error-container/20 border border-error/30 flex items-start gap-md">
            <span className="material-symbols-outlined text-error flex-shrink-0 mt-0.5">
              error
            </span>
                <div>
                  <p className="font-label-md text-error font-semibold">{error}</p>
                </div>
                <button
                    onClick={() => setError(null)}
                    className="ml-auto text-error hover:opacity-75"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
          )}

          {/* Page Title & Stats */}
          <div className="mb-xl flex flex-col md:flex-row md:items-end justify-between gap-md">
            <div>
              <h2 className="font-headline-lg text-headline-lg text-on-surface mb-xs">
                Tour đang được phân công
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Chào mừng trở lại, hãy kiểm tra lịch trình vận hành của bạn.
              </p>
            </div>

            {/* Stat Cards */}
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

          {/* Filter Bar */}
          <GuideFilterGroup
              filters={filters}
              onFilterChange={handleFilterChange}
              onExportReport={handleExportReport}
              isLoading={isExporting}
          />

          {/* Tour List Table */}
          <GuideTourTable
              tours={tours}
              isLoading={isLoadingTours}
              pagination={pagination}
              onPageChange={handlePageChange}
              onRowClick={handleRowClick}
              onDetailClick={handleDetailClick}
          />
        </main>
  );
};

export default GuideAssignedToursPage;