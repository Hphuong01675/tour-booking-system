// Đường dẫn: frontend/src/features/guideTours/GuideTourTable.jsx
/**
 * GuideTourTable Component
 * Render bảng danh sách tour, xử lý loading, empty state, pagination
 *
 * Props:
 *   - tours: Array<Object> - Danh sách tour
 *   - isLoading: boolean - Trạng thái loading
 *   - pagination: {page, limit, total} - Thông tin phân trang
 *   - onPageChange: function - Callback thay đổi trang
 *   - onRowClick: function - Callback click vào hàng
 *   - onDetailClick: function - Callback click nút "Xem chi tiết"
 */

import React from 'react';
import GuideStatusBadge from '../../components/Guide/GuideStatusBadge';
import { formatDate, calculatePercentage, getCapacityColor } from '../../utils/guideFormatters';

// Skeleton Loading Row
const TourRowSkeleton = () => (
  <tr className="border-b border-outline-variant/10">
    <td className="px-lg py-lg">
      <div className="flex items-center gap-md">
        <div className="w-16 h-12 rounded-lg bg-surface-container-low animate-pulse" />
        <div className="flex-1">
          <div className="h-4 bg-surface-container-low rounded animate-pulse mb-2" />
          <div className="h-3 bg-surface-container-low rounded w-2/3 animate-pulse" />
        </div>
      </div>
    </td>
    <td className="px-lg py-lg text-center">
      <div className="h-4 bg-surface-container-low rounded animate-pulse w-20 mx-auto mb-2" />
      <div className="h-3 bg-surface-container-low rounded w-16 mx-auto animate-pulse" />
    </td>
    <td className="px-lg py-lg text-center">
      <div className="h-6 bg-surface-container-low rounded-full animate-pulse w-24 mx-auto" />
    </td>
    <td className="px-lg py-lg text-center">
      <div className="h-4 bg-surface-container-low rounded animate-pulse w-12 mx-auto mb-2" />
      <div className="h-2 bg-surface-container-low rounded-full w-20 mx-auto animate-pulse" />
    </td>
    <td className="px-lg py-lg text-right">
      <div className="h-8 bg-surface-container-low rounded animate-pulse w-24 ml-auto" />
    </td>
  </tr>
);

// Empty State
const EmptyState = () => (
  <tr>
    <td colSpan="5" className="px-lg py-xl text-center">
      <div className="flex flex-col items-center gap-md py-xl">
        <span className="material-symbols-outlined text-6xl text-outline-variant">
          no_data
        </span>
        <div>
          <h3 className="font-headline-sm text-headline-sm text-on-surface mb-xs">
            Không có tour nào
          </h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Hãy thử thay đổi bộ lọc để tìm tour phù hợp.
          </p>
        </div>
      </div>
    </td>
  </tr>
);

const GuideTourTable = ({
  tours = [],
  isLoading = false,
  pagination = { page: 1, limit: 10, total: 0 },
  onPageChange,
  onRowClick,
  onDetailClick,
}) => {
  const { page = 1, limit = 10, total = 0 } = pagination;
  const totalPages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit + 1;
  const endIndex = Math.min(page * limit, total);

  // Xử lý click nút trang
  const handlePageClick = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && onPageChange) {
      onPageChange(newPage);
    }
  };

  // Sinh các nút số trang
  const renderPageButtons = () => {
    const buttons = [];
    const maxButtons = 5;

    let startPage = Math.max(1, page - Math.floor(maxButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);

    if (endPage - startPage < maxButtons - 1) {
      startPage = Math.max(1, endPage - maxButtons + 1);
    }

    // Nút "Trang trước"
    buttons.push(
      <button
        key="prev"
        onClick={() => handlePageClick(page - 1)}
        disabled={page === 1}
        className="p-2 rounded-lg hover:bg-surface-variant disabled:opacity-30"
      >
        <span className="material-symbols-outlined">chevron_left</span>
      </button>
    );

    // Nút số trang
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => handlePageClick(i)}
          className={`
            w-8 h-8 rounded-lg font-label-md transition-all
            ${
              i === page
                ? 'bg-primary text-on-primary'
                : 'hover:bg-surface-variant text-on-surface'
            }
          `}
        >
          {i}
        </button>
      );
    }

    // Nút "Trang sau"
    buttons.push(
      <button
        key="next"
        onClick={() => handlePageClick(page + 1)}
        disabled={page === totalPages}
        className="p-2 rounded-lg hover:bg-surface-variant disabled:opacity-30"
      >
        <span className="material-symbols-outlined">chevron_right</span>
      </button>
    );

    return buttons;
  };

  return (
    <div className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden border border-outline-variant/20">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          {/* Table Head */}
          <thead className="bg-surface-container-low">
            <tr>
              <th className="px-lg py-md font-label-md text-label-md text-on-surface-variant uppercase">
                Tên tour & Điểm đến
              </th>
              <th className="px-lg py-md font-label-md text-label-md text-on-surface-variant uppercase text-center">
                Ngày khởi hành
              </th>
              <th className="px-lg py-md font-label-md text-label-md text-on-surface-variant uppercase text-center">
                Trạng thái
              </th>
              <th className="px-lg py-md font-label-md text-label-md text-on-surface-variant uppercase text-center">
                Số lượng khách
              </th>
              <th className="px-lg py-md font-label-md text-label-md text-on-surface-variant uppercase text-right">
                Thao tác
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-outline-variant/10">
            {isLoading ? (
              <>
                {[...Array(3)].map((_, i) => (
                  <TourRowSkeleton key={i} />
                ))}
              </>
            ) : tours.length === 0 ? (
              <EmptyState />
            ) : (
              tours.map((tour) => {
                const percentage = calculatePercentage(tour.registered, tour.maxCapacity);
                const departureTime = tour.departureDate
                  ? new Date(tour.departureDate).toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'N/A';

                return (
                  <tr
                    key={tour.id}
                    onClick={() => onRowClick?.(tour)}
                    className="hover:bg-surface-container-lowest transition-colors group cursor-pointer"
                  >
                    {/* Tour Name & Destination */}
                    <td className="px-lg py-lg">
                      <div className="flex items-center gap-md">
                        <div className="w-16 h-12 rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            alt={tour.title}
                            src={tour.thumbnailUrl || '/placeholder.jpg'}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src = '/placeholder.jpg';
                            }}
                          />
                        </div>
                        <div>
                          <p className="font-body-md font-semibold text-on-surface">
                            {tour.title}
                          </p>
                          <p className="font-body-sm text-on-surface-variant flex items-center gap-xs">
                            <span className="material-symbols-outlined text-[16px]">
                              location_on
                            </span>
                            {tour.destination}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Departure Date & Time */}
                    <td className="px-lg py-lg text-center">
                      <p className="font-body-md text-on-surface">
                        {formatDate(tour.departureDate)}
                      </p>
                      <p className="font-label-sm text-on-surface-variant">
                        {departureTime}
                      </p>
                    </td>

                    {/* Status */}
                    <td className="px-lg py-lg text-center">
                      <GuideStatusBadge status={tour.status} />
                    </td>

                    {/* Participant Count & Progress Bar */}
                    <td className="px-lg py-lg text-center">
                      <div className="flex flex-col items-center">
                        <p className="font-body-md font-semibold text-on-surface">
                          {tour.registered}/{tour.maxCapacity}
                        </p>
                        <div className="w-20 bg-outline-variant/30 h-1.5 rounded-full mt-1 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: getCapacityColor(percentage),
                            }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Action Button */}
                    <td className="px-lg py-lg text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDetailClick?.(tour);
                        }}
                        className="px-lg py-2 bg-primary-container text-on-primary-container rounded-lg font-label-md hover:bg-primary hover:text-on-primary transition-all duration-200 active:scale-95 shadow-sm"
                      >
                        Xem chi tiết
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {tours.length > 0 && !isLoading && (
        <div className="px-lg py-md bg-surface-container-low flex flex-col sm:flex-row justify-between items-center gap-md border-t border-outline-variant/20">
          <p className="font-label-md text-label-md text-on-surface-variant">
            Hiển thị {startIndex}-{endIndex} trên {total} tour
          </p>

          <div className="flex items-center gap-sm">
            {renderPageButtons()}
          </div>
        </div>
      )}
    </div>
  );
};

export default GuideTourTable;

