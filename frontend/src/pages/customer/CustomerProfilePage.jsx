import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { fetchCurrentUser, logoutUser } from "../../features/auth/authSlice";
import axiosInstance from "../../api/axiosInstance";
import TopNavBar from "../../components/TopNavBar";

const CustomerProfilePage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user, loading } = useSelector((state) => state.auth);

    // Form edit states
    const [editMode, setEditMode] = useState(false);
    const [passwordMode, setPasswordMode] = useState(false);

    const [profileData, setProfileData] = useState({
        fullName: "",
        phone: "",
        address: "",
        dateOfBirth: ""
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });

    const [errorMsg, setErrorMsg] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);

    useEffect(() => {
        dispatch(fetchCurrentUser());
    }, [dispatch]);

    useEffect(() => {
        if (user) {
            setProfileData({
                fullName: user.fullName || "",
                phone: user.phone || "",
                address: user.address || "",
                dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split("T")[0] : ""
            });
        }
    }, [user]);

    const handleLogout = () => {
        dispatch(logoutUser());
        navigate("/login", { replace: true });
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg(null);
        setSuccessMsg(null);

        try {
            const response = await axiosInstance.put("/api/customer/profile", profileData);
            if (response.data.success) {
                setSuccessMsg("Cập nhật thông tin cá nhân thành công!");
                setEditMode(false);
                dispatch(fetchCurrentUser());
            }
        } catch (err) {
            console.error(err);
            setErrorMsg(err.response?.data?.error || "Không thể cập nhật thông tin.");
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg(null);
        setSuccessMsg(null);

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setErrorMsg("Mật khẩu mới và xác nhận mật khẩu không khớp nhau.");
            return;
        }

        try {
            const response = await axiosInstance.put("/api/customer/password", {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });
            if (response.data.success) {
                setSuccessMsg("Đổi mật khẩu thành công!");
                setPasswordMode(false);
                setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
            }
        } catch (err) {
            console.error(err);
            setErrorMsg(err.response?.data?.error || "Mật khẩu hiện tại không đúng.");
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "-";
        return new Date(dateStr).toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        });
    };

    return (
        <div className="min-h-screen bg-neutral-50 text-neutral-800 flex flex-col font-sans selection:bg-rose-500 selection:text-white">
            <style>{`
                .fiery-gradient-text {
                    background: linear-gradient(to right, #f97316, #e11d48, #d946ef);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .fiery-button {
                    background: linear-gradient(135deg, #f97316, #e11d48);
                    transition: all 0.3s ease;
                }
                .fiery-button:hover {
                    box-shadow: 0 8px 20px -4px rgba(244, 63, 94, 0.4);
                    filter: brightness(1.05);
                }
            `}</style>

            {/* TopNavBar */}
            <TopNavBar />

            {/* Page Content */}
            <main className="flex-grow max-w-4xl mx-auto px-6 py-12 w-full">
                <div className="bg-white rounded-[32px] border border-neutral-200/60 p-8 md:p-10 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-orange-500/5 to-rose-500/5 rounded-full blur-3xl pointer-events-none" />

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-neutral-100 pb-8 mb-8">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-orange-500 to-rose-500 text-white flex items-center justify-center text-2xl font-black shadow-md uppercase">
                                {user?.fullName?.charAt(0) || "U"}
                            </div>
                            <div>
                                <span className="text-orange-600 font-black text-xs uppercase tracking-wider bg-orange-50 px-2.5 py-1 rounded-md border border-orange-100">Khách hàng thành viên</span>
                                <h2 className="text-2xl font-black text-neutral-900 mt-1.5">{loading ? "Đang tải..." : user?.fullName}</h2>
                            </div>
                        </div>

                        {!editMode && !passwordMode && (
                            <div className="flex flex-wrap gap-3">
                                <button
                                    onClick={() => setEditMode(true)}
                                    className="px-5 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                                >
                                    <span className="material-symbols-outlined text-[16px]">edit</span>
                                    Cập nhật thông tin
                                </button>
                                <button
                                    onClick={() => setPasswordMode(true)}
                                    className="px-5 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                                >
                                    <span className="material-symbols-outlined text-[16px]">lock_reset</span>
                                    Đổi mật khẩu
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Alert Messages */}
                    {errorMsg && (
                        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl text-sm mb-6 flex items-center gap-2">
                            <span className="material-symbols-outlined text-lg">error</span>
                            <strong>Lỗi:</strong> {errorMsg}
                        </div>
                    )}
                    {successMsg && (
                        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-2xl text-sm mb-6 flex items-center gap-2">
                            <span className="material-symbols-outlined text-lg">check_circle</span>
                            {successMsg}
                        </div>
                    )}

                    {/* View Profile State */}
                    {!editMode && !passwordMode && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-200/50">
                                <span className="text-[10px] font-black text-neutral-400 block uppercase tracking-wider mb-1">Họ và Tên</span>
                                <span className="font-extrabold text-neutral-800">{user?.fullName || "-"}</span>
                            </div>
                            <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-200/50">
                                <span className="text-[10px] font-black text-neutral-400 block uppercase tracking-wider mb-1">Địa chỉ Email (Không được đổi)</span>
                                <span className="font-extrabold text-neutral-500">{user?.email || "-"}</span>
                            </div>
                            <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-200/50">
                                <span className="text-[10px] font-black text-neutral-400 block uppercase tracking-wider mb-1">Số điện thoại liên hệ</span>
                                <span className="font-extrabold text-neutral-800">{user?.phone || "Chưa có"}</span>
                            </div>
                            <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-200/50">
                                <span className="text-[10px] font-black text-neutral-400 block uppercase tracking-wider mb-1">Ngày sinh</span>
                                <span className="font-extrabold text-neutral-800">{formatDate(user?.dateOfBirth)}</span>
                            </div>
                            <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-200/50 md:col-span-2">
                                <span className="text-[10px] font-black text-neutral-400 block uppercase tracking-wider mb-1">Địa chỉ thường trú</span>
                                <span className="font-extrabold text-neutral-800 block whitespace-pre-wrap">{user?.address || "Chưa cập nhật"}</span>
                            </div>
                        </div>
                    )}

                    {/* Edit Profile Form */}
                    {editMode && (
                        <form onSubmit={handleProfileSubmit} className="space-y-6">
                            <h3 className="font-black text-lg text-neutral-900 flex items-center gap-1.5"><span className="material-symbols-outlined text-orange-500">edit</span> Cập nhật thông tin cá nhân</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-neutral-600 uppercase tracking-wider block">Họ và Tên</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm font-semibold text-neutral-800 outline-none focus:border-orange-500 focus:bg-white transition-all"
                                        value={profileData.fullName}
                                        onChange={(e) => setProfileData(prev => ({ ...prev, fullName: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-neutral-600 uppercase tracking-wider block">Số điện thoại</label>
                                    <input
                                        type="tel"
                                        required
                                        className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm font-semibold text-neutral-800 outline-none focus:border-orange-500 focus:bg-white transition-all"
                                        value={profileData.phone}
                                        onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-neutral-600 uppercase tracking-wider block">Ngày sinh</label>
                                    <input
                                        type="date"
                                        className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm font-semibold text-neutral-800 outline-none focus:border-orange-500 focus:bg-white transition-all"
                                        value={profileData.dateOfBirth}
                                        onChange={(e) => setProfileData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-1.5 md:col-span-2">
                                    <label className="text-xs font-black text-neutral-600 uppercase tracking-wider block">Địa chỉ thường trú</label>
                                    <textarea
                                        rows={3}
                                        className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm font-semibold text-neutral-800 outline-none focus:border-orange-500 focus:bg-white transition-all resize-none"
                                        value={profileData.address}
                                        onChange={(e) => setProfileData(prev => ({ ...prev, address: e.target.value }))}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-neutral-100">
                                <button
                                    type="submit"
                                    className="px-6 py-3.5 bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-sm rounded-xl shadow-md transition-all cursor-pointer"
                                >
                                    Lưu thay đổi
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditMode(false);
                                        setErrorMsg(null);
                                    }}
                                    className="px-6 py-3.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold text-sm rounded-xl transition-all cursor-pointer"
                                >
                                    Hủy bỏ
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Change Password Form */}
                    {passwordMode && (
                        <form onSubmit={handlePasswordSubmit} className="space-y-6">
                            <h3 className="font-black text-lg text-neutral-900 flex items-center gap-1.5"><span className="material-symbols-outlined text-orange-500">lock_reset</span> Đổi mật khẩu mới</h3>
                            <div className="space-y-4 max-w-md">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-neutral-600 uppercase tracking-wider block">Mật khẩu hiện tại (mật khẩu cũ)</label>
                                    <input
                                        type="password"
                                        required
                                        className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm font-semibold text-neutral-800 outline-none focus:border-orange-500 focus:bg-white transition-all"
                                        value={passwordData.currentPassword}
                                        onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-neutral-600 uppercase tracking-wider block">Mật khẩu mới</label>
                                    <input
                                        type="password"
                                        required
                                        className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm font-semibold text-neutral-800 outline-none focus:border-orange-500 focus:bg-white transition-all"
                                        value={passwordData.newPassword}
                                        onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-neutral-600 uppercase tracking-wider block">Nhập lại mật khẩu mới (xác nhận)</label>
                                    <input
                                        type="password"
                                        required
                                        className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm font-semibold text-neutral-800 outline-none focus:border-orange-500 focus:bg-white transition-all"
                                        value={passwordData.confirmPassword}
                                        onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-neutral-100">
                                <button
                                    type="submit"
                                    className="px-6 py-3.5 bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-sm rounded-xl shadow-md transition-all cursor-pointer"
                                >
                                    Lưu mật khẩu mới
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setPasswordMode(false);
                                        setErrorMsg(null);
                                        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
                                    }}
                                    className="px-6 py-3.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold text-sm rounded-xl transition-all cursor-pointer"
                                >
                                    Hủy bỏ
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </main>
        </div>
    );
};

export default CustomerProfilePage;
