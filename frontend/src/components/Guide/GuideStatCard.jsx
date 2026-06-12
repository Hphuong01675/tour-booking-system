// Đường dẫn: frontend/src/components/Guide/GuideStatCard.jsx
/**
 * GuideStatCard Component
 * Card hiển thị thống kê nhỏ ở đầu trang (Tổng Tour, Sắp diễn ra)
 *
 * Props:
 *   - icon: string - Tên icon Material Symbols
 *   - title: string - Tiêu đề (VD: "Tổng Tour")
 *   - value: string | number - Giá trị hiển thị
 *   - bgColorClass: string - Lớp CSS màu nền icon
 *   - iconColor: string - Màu icon
 *   - trend: {value: number, isUp: boolean} - (Optional) Xu hướng
 *   - onClick: function - (Optional) Callback khi click
 */

import React from 'react';

const GuideStatCard = ({
  icon,
  title,
  value,
  bgColorClass = 'bg-primary/10',
  iconColor = 'text-primary',
  trend = null,
  onClick = null,
}) => {
  return (
    <div
      onClick={onClick}
      className={`
        bg-surface-container-lowest
        p-md
        rounded-xl
        shadow-sm
        border border-outline-variant/30
        flex items-center
        gap-sm
        transition-all
        duration-200
        ${onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-1' : ''}
      `}
    >
      {/* Icon Container */}
      <div
        className={`
          w-10 h-10
          rounded-full
          ${bgColorClass}
          flex items-center
          justify-center
          flex-shrink-0
        `}
      >
        <span
          className={`
            material-symbols-outlined
            ${iconColor}
            text-body-md
          `}
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          {icon}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1">
        <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
          {title}
        </p>
        <div className="flex items-baseline gap-xs mt-xs">
          <p className="font-headline-sm text-headline-sm text-on-surface font-semibold">
            {value}
          </p>

          {/* Trend Badge (Optional) */}
          {trend && (
            <span
              className={`
                font-label-sm
                text-label-sm
                px-xs
                py-0
                rounded-full
                ml-auto
                flex
                items-center
                gap-xs
                ${
                  trend.isUp
                    ? 'bg-tertiary-container/20 text-tertiary'
                    : 'bg-error-container/20 text-error'
                }
              `}
            >
              <span className="material-symbols-outlined text-[14px]">
                {trend.isUp ? 'trending_up' : 'trending_down'}
              </span>
              {Math.abs(trend.value)}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default GuideStatCard;

