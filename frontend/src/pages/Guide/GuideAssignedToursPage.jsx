// Đường dẫn: frontend/src/pages/Guide/GuideAssignedToursPage.jsx
/**
 * GuideAssignedToursPage Component
 * Trang chính "Danh sách Tour được phân công cho Hướng dẫn viên"
 *
 * Logic:
 * - Quản lý state: tours, filters, pagination, isLoading
 * - useEffect: Gọi API mỗi khi filters thay đổi
 * - useNavigate: Điều hướng tới trang chi tiết khi click nút
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Import API
import { getAssignedTours, getGuideStats, exportToursReport, getGuideProfile } from '../../api/guideApi';

// Import Components
import GuideStatCard from '../../components/Guide/GuideStatCard';
import GuideStatusBadge from '../../components/Guide/GuideStatusBadge';
import GuideHeader from '../../components/Guide/GuideHeader';
import GuideFooter from '../../components/Guide/GuideFooter';

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

  // Guide profile
  const [currentUser, setCurrentUser] = useState(null);

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

  // Load stats and profile when component mounts
  useEffect(() => {
    fetchStats();
    
    const loadProfile = async () => {
      try {
        const profile = await getGuideProfile();
        setCurrentUser(profile);
      } catch (err) {
        console.error('Failed to load guide profile:', err);
      }
    };
    loadProfile();
  }, []);

  // Load tours when filters or pagination changes
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
    <div className="bg-background text-on-background min-h-screen flex flex-col font-sans">
      <GuideHeader currentUser={currentUser} />
      <main className="flex-grow pt-24 pb-s-xl px-s-margin-mobile md:px-s-margin-desktop max-w-[1440px] mx-auto w-full">
        {/* Error Alert */}
        {error && (
          <div className="mb-s-lg p-s-md rounded-lg bg-error-container/20 border border-error/30 flex items-start gap-s-md">
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
        <div className="mb-s-xl flex flex-col md:flex-row md:items-end justify-between gap-s-md">
          <div>
            <h2 className="font-headline-lg text-headline-lg text-on-surface mb-s-xs">
              Tour đang được phân công
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Chào mừng trở lại, hãy kiểm tra lịch trình vận hành của bạn.
            </p>
          </div>

          {/* Stat Cards */}
          <div className="flex gap-s-sm">
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
      <GuideFooter />
    </div>
  );
};

export default GuideAssignedToursPage;

