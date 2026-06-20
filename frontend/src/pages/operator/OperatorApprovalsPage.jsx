import { useState, useEffect } from "react";
import OperatorHeader from "../../components/operator/OperatorHeader";
import OperatorFooter from "../../components/operator/OperatorFooter";
import { getOperatorProfile } from "../../api/operatorApi";

const OperatorApprovalsPage = () => {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const profileData = await getOperatorProfile();
                setUser(profileData);
            } catch (err) {
                console.error("Failed to load profile in approvals page", err);
            }
        };
        fetchProfile();
    }, []);

    return (
        <div className="bg-background text-on-background min-h-screen flex flex-col">
            <OperatorHeader currentUser={user} />

            <main className="flex-grow pt-24 pb-s-xl px-s-margin-mobile md:px-s-margin-desktop max-w-[1440px] mx-auto w-full">
                <div className="mb-s-xl">
                    <h2 className="font-headline-lg text-headline-lg text-on-surface">
                        Phê duyệt khách hàng
                    </h2>
                    <p className="font-body-md text-body-md text-on-surface-variant mt-1">
                        Xét duyệt danh sách khách hàng đăng ký đặt tour và xử lý xác nhận hồ sơ thanh toán.
                    </p>
                </div>

                {/* Table Placeholder card */}
                <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm overflow-hidden">
                    <div className="p-s-xl border-b border-outline-variant/20 flex items-center justify-between flex-wrap gap-s-md">
                        <div>
                            <h3 className="font-headline-sm text-headline-sm text-on-surface">Danh sách chờ duyệt</h3>
                            <p className="text-xs text-on-surface-variant/80 mt-0.5">Hiển thị các hồ sơ đăng ký mới nhất cần được kiểm duyệt viên xử lý.</p>
                        </div>
                        <div className="flex gap-s-sm">
                            <span className="px-3 py-1 bg-primary-fixed text-on-primary-fixed rounded-full text-xs font-semibold">8 Hồ sơ mới</span>
                        </div>
                    </div>

                    <div className="p-s-xl text-center py-s-xxl">
                        <span className="material-symbols-outlined text-[64px] text-outline-variant mb-s-md">
                            fact_check
                        </span>
                        <h3 className="font-headline-sm text-headline-sm text-on-surface mb-s-xs">
                            Hệ thống phê duyệt đang tải dữ liệu
                        </h3>
                        <p className="text-on-surface-variant/80 max-w-md mx-auto text-sm leading-relaxed">
                            Bảng thông tin chi tiết khách hàng đăng ký, trạng thái thanh toán và nút phê duyệt/hủy duyệt sẽ được tích hợp đồng bộ ở bước phát triển tiếp theo.
                        </p>
                    </div>
                </div>
            </main>

            <OperatorFooter />
        </div>
    );
};

export default OperatorApprovalsPage;
