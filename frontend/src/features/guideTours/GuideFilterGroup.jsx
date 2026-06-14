// Đường dẫn: frontend/src/features/guideTours/GuideFilterGroup.jsx
/**
 * GuideFilterGroup Component
 * Bộ lọc với dropdown Trạng thái, Tháng, nút Xuất báo cáo
 *
 * Props:
 *   - filters: {status, month} - Giá trị lọc hiện tại
 *   - onFilterChange: function - Callback khi bộ lọc thay đổi
 *   - onExportReport: function - Callback khi click nút Xuất báo cáo
 *   - isLoading: boolean - Trạng thái loading
 */

import React from 'react';

const GuideFilterGroup = ({
  filters = { status: 'all', month: 'all' },
  onFilterChange,
  onExportReport,
  isLoading = false,
}) => {
  // Xử lý thay đổi status
  const handleStatusChange = (e) => {
    onFilterChange({
      ...filters,
      status: e.target.value,
    });
  };

  // Xử lý thay đổi month
  const handleMonthChange = (e) => {
    onFilterChange({
      ...filters,
      month: e.target.value,
    });
  };

  // Xử lý click nút xuất báo cáo
  const handleExportClick = (e) => {
    e.preventDefault();
    if (onExportReport && !isLoading) {
      onExportReport();
    }
  };

  return (
    <div className="bg-surface-container-lowest rounded-xl p-s-md mb-s-lg flex flex-wrap gap-s-md items-center shadow-sm border border-outline-variant/10">
      {/* Filter Label */}
      <div className="flex items-center gap-s-xs px-s-md py-s-sm bg-surface-container-low rounded-lg border border-outline-variant/20">
        <span className="material-symbols-outlined text-body-md">filter_list</span>
        <span className="font-label-md text-label-md">Bộ lọc</span>
      </div>

      {/* Status Filter Dropdown */}
      <select
        value={filters.status || 'all'}
        onChange={handleStatusChange}
        disabled={isLoading}
        className={`
          bg-transparent
          border border-outline-variant
          rounded-lg
          font-body-sm
          text-body-sm
          px-s-md
          py-s-sm
          focus:ring-primary
          focus:border-primary
          transition-all
          ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <option value="all">Tất cả trạng thái</option>
        <option value="open">Đang vận hành</option>
        <option value="closed">Sắp khởi hành</option>
        <option value="cancelled">Đã hủy</option>
      </select>

      {/* Month Filter Dropdown */}
      <select
        value={filters.month || 'all'}
        onChange={handleMonthChange}
        disabled={isLoading}
        className={`
          bg-transparent
          border border-outline-variant
          rounded-lg
          font-body-sm
          text-body-sm
          px-s-md
          py-s-sm
          focus:ring-primary
          focus:border-primary
          transition-all
          ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <option value="all">Tất cả tháng</option>
        <option value="current">Tháng này</option>
        <option value="next">Tháng sau</option>
        <option value="next-3">3 tháng tới</option>
      </select>

      {/* Export Report Button */}
      <div className="ml-auto flex gap-s-sm">
        <button
          onClick={handleExportClick}
          disabled={isLoading}
          className={`
            flex items-center gap-s-xs
            px-s-md
            py-s-sm
            rounded-lg
            text-primary
            font-label-md
            transition-all
            duration-200
            ${
              isLoading
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-primary/5 active:scale-95'
            }
          `}
        >
          <span className="material-symbols-outlined text-body-md">
            {isLoading ? 'hourglass_empty' : 'download'}
          </span>
          {isLoading ? 'Đang xuất...' : 'Xuất báo cáo'}
        </button>
      </div>
    </div>
  );
};

export default GuideFilterGroup;

