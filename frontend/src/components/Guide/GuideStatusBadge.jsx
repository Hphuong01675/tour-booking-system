// Đường dẫn: frontend/src/components/guide/GuideStatusBadge.jsx
/**
 * GuideStatusBadge Component
 * Hiển thị trạng thái tour với màu sắc và biểu tượng nhấp nháy
 *
 * Props:
 *   - status: 'open' | 'closed' | 'cancelled'
 *   - size: 'sm' | 'md' | 'lg' (default: 'md')
 *   - showLabel: boolean (default: true)
 */

import React from 'react';
import { translateStatus } from '../../utils/guideFormatters';

const GuideStatusBadge = ({ status = 'open', size = 'md', showLabel = true }) => {
  // Cấu hình màu sắc cho mỗi status
  const statusConfig = {
    open: {
      bgColor: 'bg-tertiary-container/20',
      textColor: 'text-tertiary',
      dotColor: 'bg-tertiary',
      animate: true, // animate-pulse
    },
    closed: {
      bgColor: 'bg-secondary-container/10',
      textColor: 'text-secondary',
      dotColor: 'bg-secondary',
      animate: false,
    },
    cancelled: {
      bgColor: 'bg-error-container/20',
      textColor: 'text-error',
      dotColor: 'bg-error',
      animate: false,
    },
  };

  const config = statusConfig[status] || statusConfig.open;

  // Kích cỡ badge
  const sizeClasses = {
    sm: { badge: 'px-2 py-1 text-xs', dot: 'w-1 h-1' },
    md: { badge: 'px-3 py-1 text-sm', dot: 'w-1.5 h-1.5' },
    lg: { badge: 'px-4 py-2 text-base', dot: 'w-2 h-2' },
  }[size] || { badge: 'px-3 py-1 text-sm', dot: 'w-1.5 h-1.5' };

  return (
    <span
      className={`
        inline-flex
        items-center
        gap-xs
        rounded-full
        ${sizeClasses.badge}
        ${config.bgColor}
        ${config.textColor}
        font-label-md
        transition-all
        duration-200
      `}
    >
      {/* Animated dot */}
      <span
        className={`
          ${sizeClasses.dot}
          rounded-full
          ${config.dotColor}
          flex-shrink-0
          ${config.animate ? 'animate-pulse' : ''}
        `}
      />

      {/* Label */}
      {showLabel && (
        <span className="whitespace-nowrap">
          {translateStatus(status)}
        </span>
      )}
    </span>
  );
};

export default GuideStatusBadge;

