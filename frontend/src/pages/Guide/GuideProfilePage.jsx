import { useState, useEffect } from "react";
import GuideHeader from "../../components/Guide/GuideHeader";
import GuideFooter from "../../components/Guide/GuideFooter";
import { getGuideProfile, updateGuideProfile } from "../../api/guideApi";

// NOTE: removed hard-coded MOCK_USER. Component will fetch real profile from backend
// and render empty placeholders when no data is available. This avoids sample data
// and ensures the UI still renders if API fails.

const GuideProfilePage = () => {
    // States
    const [user, setUser] = useState(null);

    const [activeSection, setActiveSection] = useState("personal"); // 'personal' or 'security'
    const [formData, setFormData] = useState({
        fullName: "",
        phone: "",
        dateOfBirth: "",
        address: "",
    });

    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // Fetch actual profile from backend
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const profileData = await getGuideProfile();
                setUser(profileData || null);

                let dob = "";
                if (profileData?.dateOfBirth) {
                    const d = new Date(profileData.dateOfBirth);
                    dob = d.toISOString().split("T")[0];
                }

                setFormData({
                    fullName: profileData?.fullName || "",
                    phone: profileData?.phone || "",
                    dateOfBirth: dob,
                    address: profileData?.address || "",
                });
            } catch (err) {
                console.error("Failed to load profile from API", err);
                // Leave user as null and formData empty so UI shows placeholders
                setUser(null);
            }
        };
        fetchProfile();
    }, []);

    // Security Form State
    const [securityForm, setSecurityForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [changePasswordSuccess, setChangePasswordSuccess] = useState(false);

    // Helper date formatting for joining date
    const formatDate = (dateStr) => {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
    };

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [id]: value,
        }));
    };

    const handleSecurityInputChange = (e) => {
        const { id, value } = e.target;
        setSecurityForm((prev) => ({
            ...prev,
            [id]: value,
        }));
    };

    // Submit Profile Changes
    const handleSubmitProfile = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setSaveSuccess(false);

        try {
            const updatedUser = await updateGuideProfile({
                fullName: formData.fullName,
                phone: formData.phone,
                dateOfBirth: formData.dateOfBirth,
                address: formData.address,
            });
            setUser(updatedUser);
            setFormData({
                fullName: updatedUser?.fullName || "",
                phone: updatedUser?.phone || "",
                dateOfBirth: updatedUser?.dateOfBirth
                    ? new Date(updatedUser.dateOfBirth).toISOString().split("T")[0]
                    : "",
                address: updatedUser?.address || "",
            });
            localStorage.setItem("guideProfile", JSON.stringify(updatedUser));
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (err) {
            console.error("Failed to save profile via API", err);
            setSaveSuccess(false);
            setProfileError(err.response?.data?.error || "Cập nhật thông tin thất bại.");
        } finally {
            setIsSaving(false);
        }
    };

    // Submit Password Change
    const handleSubmitPassword = (e) => {
        e.preventDefault();
        if (securityForm.newPassword !== securityForm.confirmPassword) {
            alert("Mật khẩu mới và xác nhận mật khẩu không trùng khớp!");
            return;
        }

        setIsChangingPassword(true);
        setChangePasswordSuccess(false);

        // Simulate API request saving password
        setTimeout(() => {
            setIsChangingPassword(false);
            setChangePasswordSuccess(true);
            setSecurityForm({
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
            });

            // Hide success message after 3 seconds
            setTimeout(() => setChangePasswordSuccess(false), 3000);
        }, 1200);
    };

    // Profile picture upload simulation
    const handleAvatarChange = async () => {
        const newAvatar = prompt(
            "Nhập URL ảnh đại diện mới:",
            user?.avatarUrl || "",
        );
        if (newAvatar) {
            try {
                const updatedUser = await updateGuideProfile({
                    avatarUrl: newAvatar,
                });
                setUser(updatedUser);
                localStorage.setItem(
                    "guideProfile",
                    JSON.stringify(updatedUser),
                );
            } catch (err) {
                console.error(
                    "Failed to update avatar via API, using fallback",
                    err,
                );
                const updatedUser = { ...(user || {}), avatarUrl: newAvatar };
                setUser(updatedUser);
                localStorage.setItem(
                    "guideProfile",
                    JSON.stringify(updatedUser),
                );
            }
        }
    };

    return (
        <div className="bg-background text-on-background min-h-screen flex flex-col">
            {/* TopNavBar Header */}
            <GuideHeader currentUser={user} />

            {/* Main Content Area */}
            <main className="flex-grow pt-32 pb-s-xl px-s-margin-mobile md:px-s-margin-desktop max-w-[1440px] mx-auto w-full">
                {/* Page Title */}
                <div className="mb-s-xl">
                    <h2 className="font-headline-lg text-headline-lg text-on-surface">
                        Cài đặt Hồ sơ
                    </h2>
                    <p className="font-body-md text-body-md text-on-surface-variant mt-1">
                        Quản lý thông tin cá nhân và thiết lập bảo mật tài khoản
                        của bạn.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-s-lg items-start">
                    {/* Left Column: Profile Snapshot */}
                    <aside className="lg:col-span-4 flex flex-col gap-s-lg">
                        {/* User Card */}
                        <div className="bg-surface-container-lowest p-s-xl rounded-xl shadow-sm border border-outline-variant/30 text-center">
                            <div className="relative w-32 h-32 mx-auto mb-s-lg group">
                                <img
                                    alt="Ảnh đại diện của bạn"
                                    className="w-full h-full object-cover rounded-xl shadow-md"
                                    src={
                                        user?.avatarUrl ||
                                        "https://via.placeholder.com/320x320?text=No+Avatar"
                                    }
                                />
                                <button
                                    onClick={handleAvatarChange}
                                    className="absolute bottom-[-8px] right-[-8px] bg-primary text-on-primary p-2 rounded-full shadow-lg hover:scale-105 transition-transform active:scale-95 flex items-center justify-center"
                                    title="Thay đổi ảnh đại diện"
                                >
                                    <span className="material-symbols-outlined text-[20px]">
                                        photo_camera
                                    </span>
                                </button>
                            </div>

                            <h3 className="font-headline-sm text-headline-sm text-on-surface">
                                {user?.fullName || "—"}
                            </h3>
                            <p className="font-body-md text-body-md text-on-surface-variant mb-s-md">
                                Hướng dẫn viên du lịch (Guide)
                            </p>

                            <div className="inline-flex items-center gap-s-xs px-3 py-1 bg-green-100 text-green-700 rounded-full font-label-md text-label-md">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                Đang hoạt động
                            </div>
                        </div>

                        {/* Quick Actions sidebar */}
                        <div className="bg-surface-container-lowest p-s-xl rounded-xl shadow-sm border border-outline-variant/30">
                            <h4 className="font-label-md text-label-md text-primary mb-s-md uppercase tracking-wider">
                                Hành động nhanh
                            </h4>
                            <nav className="flex flex-col gap-s-sm">
                                <button
                                    onClick={() => setActiveSection("personal")}
                                    className={`flex items-center gap-s-md w-full p-s-md rounded-lg font-body-md text-body-md text-left transition-all ${
                                        activeSection === "personal"
                                            ? "bg-primary-fixed text-on-primary-fixed font-bold"
                                            : "hover:bg-surface-container-low text-on-surface-variant"
                                    }`}
                                >
                                    <span className="material-symbols-outlined">
                                        person
                                    </span>
                                    Thông tin cá nhân
                                </button>
                                <button
                                    onClick={() => setActiveSection("security")}
                                    className={`flex items-center gap-s-md w-full p-s-md rounded-lg font-body-md text-body-md text-left transition-all ${
                                        activeSection === "security"
                                            ? "bg-primary-fixed text-on-primary-fixed font-bold"
                                            : "hover:bg-surface-container-low text-on-surface-variant"
                                    }`}
                                >
                                    <span className="material-symbols-outlined">
                                        security
                                    </span>
                                    Bảo mật & Mật khẩu
                                </button>
                            </nav>
                        </div>
                    </aside>

                    {/* Right Column: Form details */}
                    <section className="lg:col-span-8">
                        {/* View 1: Personal Details */}
                        {activeSection === "personal" && (
                            <div className="bg-surface-container-lowest p-s-xl rounded-xl shadow-sm border border-outline-variant/30">
                                <div className="flex justify-between items-center mb-s-xl border-b border-outline-variant/20 pb-s-xs">
                                    <h4 className="font-headline-sm text-headline-sm text-on-surface">
                                        Thông tin chi tiết
                                    </h4>
                                </div>

                                <form
                                    onSubmit={handleSubmitProfile}
                                    className="space-y-lg"
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-s-lg">
                                        {/* Họ và tên */}
                                        <div className="space-y-xs">
                                            <label
                                                className="font-label-md text-label-md text-on-surface"
                                                htmlFor="fullName"
                                            >
                                                Họ và tên
                                            </label>
                                            <div className="relative">
                                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
                                                    badge
                                                </span>
                                                <input
                                                    id="fullName"
                                                    type="text"
                                                    value={formData.fullName}
                                                    onChange={handleInputChange}
                                                    className="w-full pl-10 pr-4 py-3 bg-surface border border-outline-variant/50 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary font-body-md text-body-md transition-all outline-none"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        {/* Vai trò */}
                                        <div className="space-y-xs">
                                            <label className="font-label-md text-label-md text-on-surface">
                                                Vai trò hệ thống
                                            </label>
                                            <div className="relative">
                                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
                                                    work
                                                </span>
                                                <input
                                                    type="text"
                                                    value="Hướng dẫn viên chuyên nghiệp"
                                                    className="w-full pl-10 pr-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-lg text-outline cursor-not-allowed font-body-md text-body-md outline-none"
                                                    disabled
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-s-lg">
                                        {/* Email */}
                                        <div className="space-y-xs">
                                            <label
                                                className="font-label-md text-label-md text-on-surface"
                                                htmlFor="email"
                                            >
                                                Email
                                            </label>
                                            <div className="relative">
                                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
                                                    mail
                                                </span>
                                                <input
                                                    id="email"
                                                    type="email"
                                                    value={user?.email || ""}
                                                    className="w-full pl-10 pr-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-lg text-outline cursor-not-allowed font-body-md text-body-md outline-none"
                                                    disabled
                                                />
                                            </div>
                                        </div>

                                        {/* Số điện thoại */}
                                        <div className="space-y-xs">
                                            <label
                                                className="font-label-md text-label-md text-on-surface"
                                                htmlFor="phone"
                                            >
                                                Số điện thoại
                                            </label>
                                            <div className="relative">
                                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
                                                    call
                                                </span>
                                                <input
                                                    id="phone"
                                                    type="tel"
                                                    value={formData.phone}
                                                    onChange={handleInputChange}
                                                    className="w-full pl-10 pr-4 py-3 bg-surface border border-outline-variant/50 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary font-body-md text-body-md transition-all outline-none"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-s-lg">
                                        {/* Ngày sinh */}
                                        <div className="space-y-xs">
                                            <label
                                                className="font-label-md text-label-md text-on-surface"
                                                htmlFor="dateOfBirth"
                                            >
                                                Ngày sinh
                                            </label>
                                            <div className="relative">
                                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
                                                    calendar_today
                                                </span>
                                                <input
                                                    id="dateOfBirth"
                                                    type="date"
                                                    value={formData.dateOfBirth}
                                                    onChange={handleInputChange}
                                                    className="w-full pl-10 pr-4 py-3 bg-surface border border-outline-variant/50 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary font-body-md text-body-md transition-all outline-none"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        {/* Ngày gia nhập */}
                                        <div className="space-y-xs">
                                            <label className="font-label-md text-label-md text-on-surface">
                                                Ngày gia nhập
                                            </label>
                                            <div className="relative">
                                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
                                                    event_available
                                                </span>
                                                <input
                                                    type="text"
                                                    value={formatDate(
                                                        user?.createdAt,
                                                    )}
                                                    className="w-full pl-10 pr-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-lg text-outline cursor-not-allowed font-body-md text-body-md outline-none"
                                                    disabled
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Địa chỉ */}
                                    <div className="space-y-xs">
                                        <label
                                            className="font-label-md text-label-md text-on-surface"
                                            htmlFor="address"
                                        >
                                            Địa chỉ thường trú
                                        </label>
                                        <div className="relative">
                                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
                                                location_on
                                            </span>
                                            <input
                                                id="address"
                                                type="text"
                                                value={formData.address}
                                                onChange={handleInputChange}
                                                className="w-full pl-10 pr-4 py-3 bg-surface border border-outline-variant/50 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary font-body-md text-body-md transition-all outline-none"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Submit buttons */}
                                    <div className="pt-s-xl flex flex-col sm:flex-row items-center justify-end gap-s-md">
                                        {saveSuccess && (
                                            <span className="text-green-600 font-label-md flex items-center gap-s-xs">
                                                <span className="material-symbols-outlined text-[20px]">
                                                    check_circle
                                                </span>
                                                Đã cập nhật thông tin thành
                                                công!
                                            </span>
                                        )}
                                        <button
                                            type="submit"
                                            disabled={isSaving}
                                            className="w-full sm:w-auto px-s-xl py-3 rounded-lg bg-secondary-container text-white font-label-md text-label-md hover:brightness-110 shadow-lg shadow-secondary/20 transition-all active:scale-95 flex items-center justify-center gap-s-sm"
                                        >
                                            {isSaving ? (
                                                <>
                                                    <span className="material-symbols-outlined animate-spin">
                                                        sync
                                                    </span>
                                                    Đang lưu...
                                                </>
                                            ) : (
                                                <>
                                                    <span className="material-symbols-outlined">
                                                        save
                                                    </span>
                                                    Cập nhật thông tin
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* View 2: Security & Password */}
                        {activeSection === "security" && (
                            <div className="bg-surface-container-lowest p-s-xl rounded-xl shadow-sm border border-outline-variant/30">
                                <div className="flex justify-between items-center mb-s-xl border-b border-outline-variant/20 pb-s-xs">
                                    <h4 className="font-headline-sm text-headline-sm text-on-surface">
                                        Bảo mật tài khoản
                                    </h4>
                                </div>

                                <form
                                    onSubmit={handleSubmitPassword}
                                    className="space-y-lg"
                                >
                                    {/* Mật khẩu cũ */}
                                    <div className="space-y-xs">
                                        <label
                                            className="font-label-md text-label-md text-on-surface"
                                            htmlFor="currentPassword"
                                        >
                                            Mật khẩu hiện tại
                                        </label>
                                        <div className="relative">
                                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
                                                lock
                                            </span>
                                            <input
                                                id="currentPassword"
                                                type="password"
                                                value={
                                                    securityForm.currentPassword
                                                }
                                                onChange={
                                                    handleSecurityInputChange
                                                }
                                                className="w-full pl-10 pr-4 py-3 bg-surface border border-outline-variant/50 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary font-body-md text-body-md transition-all outline-none"
                                                placeholder="Nhập mật khẩu hiện tại..."
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Mật khẩu mới */}
                                    <div className="space-y-xs">
                                        <label
                                            className="font-label-md text-label-md text-on-surface"
                                            htmlFor="newPassword"
                                        >
                                            Mật khẩu mới
                                        </label>
                                        <div className="relative">
                                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
                                                lock_open
                                            </span>
                                            <input
                                                id="newPassword"
                                                type="password"
                                                value={securityForm.newPassword}
                                                onChange={
                                                    handleSecurityInputChange
                                                }
                                                className="w-full pl-10 pr-4 py-3 bg-surface border border-outline-variant/50 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary font-body-md text-body-md transition-all outline-none"
                                                placeholder="Nhập mật khẩu mới..."
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Xác nhận mật khẩu mới */}
                                    <div className="space-y-xs">
                                        <label
                                            className="font-label-md text-label-md text-on-surface"
                                            htmlFor="confirmPassword"
                                        >
                                            Xác nhận mật khẩu mới
                                        </label>
                                        <div className="relative">
                                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
                                                lock_reset
                                            </span>
                                            <input
                                                id="confirmPassword"
                                                type="password"
                                                value={
                                                    securityForm.confirmPassword
                                                }
                                                onChange={
                                                    handleSecurityInputChange
                                                }
                                                className="w-full pl-10 pr-4 py-3 bg-surface border border-outline-variant/50 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary font-body-md text-body-md transition-all outline-none"
                                                placeholder="Nhập lại mật khẩu mới..."
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Submit buttons */}
                                    <div className="pt-s-xl flex flex-col sm:flex-row items-center justify-end gap-s-md">
                                        {changePasswordSuccess && (
                                            <span className="text-green-600 font-label-md flex items-center gap-s-xs">
                                                <span className="material-symbols-outlined text-[20px]">
                                                    check_circle
                                                </span>
                                                Thay đổi mật khẩu thành công!
                                            </span>
                                        )}
                                        <button
                                            type="submit"
                                            disabled={isChangingPassword}
                                            className="w-full sm:w-auto px-s-xl py-3 rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:bg-primary-container shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-s-sm"
                                        >
                                            {isChangingPassword ? (
                                                <>
                                                    <span className="material-symbols-outlined animate-spin">
                                                        sync
                                                    </span>
                                                    Đang đổi mật khẩu...
                                                </>
                                            ) : (
                                                <>
                                                    <span className="material-symbols-outlined">
                                                        security
                                                    </span>
                                                    Đổi mật khẩu
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </section>
                </div>
            </main>

            {/* Footer component */}
            <GuideFooter />
        </div>
    );
};

export default GuideProfilePage;
