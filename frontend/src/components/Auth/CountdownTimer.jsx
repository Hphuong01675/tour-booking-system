import { useState, useEffect, useCallback } from "react";

/**
 * CountdownTimer – Đếm ngược từ durationSeconds
 *
 * @param {number} durationSeconds - Thời gian đếm ngược (mặc định 300 = 5 phút)
 * @param {function} onExpire - Callback khi hết giờ
 * @param {boolean} reset - Khi prop này thay đổi → reset bộ đếm
 */
const CountdownTimer = ({ durationSeconds = 300, onExpire, reset }) => {
    const [timeLeft, setTimeLeft] = useState(durationSeconds);

    // Reset khi prop reset thay đổi
    useEffect(() => {
        setTimeLeft(durationSeconds);
    }, [reset, durationSeconds]);

    useEffect(() => {
        if (timeLeft <= 0) {
            onExpire?.();
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, onExpire]);

    const minutes = Math.floor(timeLeft / 60)
        .toString()
        .padStart(2, "0");
    const seconds = (timeLeft % 60).toString().padStart(2, "0");

    const isUrgent = timeLeft <= 60; // Đỏ khi còn dưới 1 phút

    return (
        <div className="flex items-center justify-center gap-1 text-sm" style={{ color: "#434654" }}>
            <span
                className="material-symbols-outlined"
                style={{ fontSize: "18px", color: "#737685" }}
            >
                schedule
            </span>
            <span>Mã sẽ hết hạn sau</span>
            <span
                className="font-bold tabular-nums"
                style={{
                    color: isUrgent ? "#ba1a1a" : "#a04100",
                    transition: "color 0.3s",
                }}
            >
                {minutes}:{seconds}
            </span>
        </div>
    );
};

export default CountdownTimer;
