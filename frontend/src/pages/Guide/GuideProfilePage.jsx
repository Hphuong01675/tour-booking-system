import { useState, useEffect } from 'react';
import GuideFooter from '../../components/guide/GuideFooter';
import { getGuideProfile, updateGuideProfile, changeGuidePassword } from '../../api/guideApi';

const GuideProfilePage = () => {
  // States
  const [user, setUser] = useState(null);

  const [activeSection, setActiveSection] = useState('personal'); // 'personal' or 'security'
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    dateOfBirth: '',
    address: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [passwordErrors, setPasswordErrors] = useState({});
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Fetch actual profile from backend
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profileData = await getGuideProfile();
        setUser(profileData || null);

        let dob = '';
        if (profileData?.dateOfBirth) {
          const d = new Date(profileData.dateOfBirth);
          dob = d.toISOString().split('T')[0];
        }

        setFormData({
          fullName: profileData?.fullName || '',
          phone: profileData?.phone || '',
          dateOfBirth: dob,
          address: profileData?.address || ''
        });
      } catch (err) {
        console.error('Failed to load profile from API', err);
        // Leave user as null and formData empty so UI shows placeholders
        setUser(null);
      }
    };
    fetchProfile();
  }, []);

  // Security Form State
  const [securityForm, setSecurityForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [changePasswordSuccess, setChangePasswordSuccess] = useState(false);

  // Helper date formatting for joining date
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleSecurityInputChange = (e) => {
    const { id, value } = e.target;
    setSecurityForm(prev => ({
      ...prev,
      [id]: value
    }));
  };

  // Submit Profile Changes
  const handleSubmitProfile = async (e) => {
    e.preventDefault();
    
    setFormErrors({});
    setIsSaving(true);
    setSaveSuccess(false);
    setSaveMessage('');

    try {
      const result = await updateGuideProfile({
        fullName: formData.fullName,
        phone: formData.phone,
        dateOfBirth: formData.dateOfBirth,
        address: formData.address
      });
      const updatedUser = result.user;
      setUser(updatedUser);
      localStorage.setItem('guideProfile', JSON.stringify(updatedUser));
      setSaveMessage(result.message || 'Đã cập nhật thông tin thành công!');
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setSaveMessage('');
      }, 3000);
    } catch (err) {
      console.error('Failed to save profile via API', err);
      if (err.response?.data?.errors) {
        setFormErrors(err.response.data.errors);
      } else if (err.response?.data?.message) {
        alert(err.response.data.message);
      } else {
        alert('Có lỗi xảy ra khi lưu thông tin. Vui lòng thử lại.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Submit Password Change
  const handleSubmitPassword = async (e) => {
    e.preventDefault();

    const errors = {};
    if (!securityForm.currentPassword) {
      errors.currentPassword = 'Vui lòng nhập mật khẩu hiện tại.';
    }
    if (!securityForm.newPassword || securityForm.newPassword.length < 6) {
      errors.newPassword = 'Mật khẩu mới phải có ít nhất 6 ký tự.';
    }
    if (securityForm.newPassword !== securityForm.confirmPassword) {
      errors.confirmPassword = 'Mật khẩu xác nhận không trùng khớp!';
    }

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }

    try {
      setPasswordErrors({});
      setIsChangingPassword(true);
      setChangePasswordSuccess(false);
      await changeGuidePassword(securityForm.currentPassword, securityForm.newPassword);
      setIsChangingPassword(false);
      setChangePasswordSuccess(true);
      setSecurityForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      // Hide success message after 3 seconds
      setTimeout(() => setChangePasswordSuccess(false), 3000);
    } catch (err) {
      setIsChangingPassword(false);
      setPasswordErrors({
        currentPassword: err.response?.data?.error || 'KhĂ´ng thá»ƒ Ä‘á»•i máº­t kháº©u. Vui lĂ²ng thá»­ láº¡i.'
      });
    }
  };

  const handleAvatarChange = async () => {
    const newAvatar = prompt("Nhập URL ảnh đại diện mới:", user?.avatarUrl || '');
    if (newAvatar) {
      try {
        const result = await updateGuideProfile({ avatarUrl: newAvatar });
        const updatedUser = result.user;
        setUser(updatedUser);
        localStorage.setItem('guideProfile', JSON.stringify(updatedUser));
      } catch (err) {
        console.error('Failed to update avatar via API', err);
        alert('KhĂ´ng thá»ƒ cáº­p nháº­t áº£nh Ä‘áº¡i diá»‡n. Vui lĂ²ng thá»­ láº¡i.');
      }
    }
  };

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col">
      {/* Main Content Area */}
      <main className="flex-grow py-xl px-margin-mobile md:px-margin-desktop max-w-[1440px] mx-auto w-full">
        {/* Page Title */}
        <div className="mb-xl">
          <h2 className="font-headline-lg text-headline-lg text-on-surface">Cài đặt Hồ sơ</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Quản lý thông tin cá nhân và thiết lập bảo mật tài khoản của bạn.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg items-start">
          
          {/* Left Column: Profile Snapshot */}
          <aside className="lg:col-span-4 flex flex-col gap-lg">
            
            {/* User Card */}
            <div className="bg-surface-container-lowest p-xl rounded-xl shadow-sm border border-outline-variant/30 text-center">
              <div className="relative w-32 h-32 mx-auto mb-lg group">
                {user?.avatarUrl ? (
                  <img
                    alt="Ảnh đại diện của bạn"
                    className="w-full h-full object-cover rounded-xl shadow-md"
                    src={user.avatarUrl}
                  />
                ) : (
                  <div className="w-full h-full rounded-xl shadow-md bg-primary-fixed text-primary flex items-center justify-center font-headline-lg text-headline-lg">
                    {(user?.fullName || user?.email || '?').slice(0, 2).toUpperCase()}
                  </div>
                )}
                <button
                  onClick={handleAvatarChange}
                  className="absolute bottom-[-8px] right-[-8px] bg-primary text-on-primary p-2 rounded-full shadow-lg hover:scale-105 transition-transform active:scale-95 flex items-center justify-center"
                  title="Thay đổi ảnh đại diện"
                >
                  <span className="material-symbols-outlined text-[20px]">photo_camera</span>
                </button>
              </div>
              
              <h3 className="font-headline-sm text-headline-sm text-on-surface">{user?.fullName || '—'}</h3>
              <p className="font-body-md text-body-md text-on-surface-variant mb-md">
                Hướng dẫn viên du lịch (Guide)
              </p>
              
              <div className="inline-flex items-center gap-xs px-3 py-1 bg-green-100 text-green-700 rounded-full font-label-md text-label-md">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Đang hoạt động
              </div>
            </div>

            {/* Quick Actions sidebar */}
            <div className="bg-surface-container-lowest p-xl rounded-xl shadow-sm border border-outline-variant/30">
              <h4 className="font-label-md text-label-md text-primary mb-md uppercase tracking-wider">Hành động nhanh</h4>
              <nav className="flex flex-col gap-sm">
                <button
                  onClick={() => setActiveSection('personal')}
                  className={`flex items-center gap-md w-full p-md rounded-lg font-body-md text-body-md text-left transition-all ${
                    activeSection === 'personal'
                      ? 'bg-primary-fixed text-on-primary-fixed font-bold'
                      : 'hover:bg-surface-container-low text-on-surface-variant'
                  }`}
                >
                  <span className="material-symbols-outlined">person</span>
                  Thông tin cá nhân
                </button>
                <button
                  onClick={() => setActiveSection('security')}
                  className={`flex items-center gap-md w-full p-md rounded-lg font-body-md text-body-md text-left transition-all ${
                    activeSection === 'security'
                      ? 'bg-primary-fixed text-on-primary-fixed font-bold'
                      : 'hover:bg-surface-container-low text-on-surface-variant'
                  }`}
                >
                  <span className="material-symbols-outlined">security</span>
                  Bảo mật & Mật khẩu
                </button>
              </nav>
            </div>
          </aside>

          {/* Right Column: Form details */}
          <section className="lg:col-span-8">
            
            {/* View 1: Personal Details */}
            {activeSection === 'personal' && (
              <div className="bg-surface-container-lowest p-xl rounded-xl shadow-sm border border-outline-variant/30">
                <div className="flex justify-between items-center mb-xl border-b border-outline-variant/20 pb-xs">
                  <h4 className="font-headline-sm text-headline-sm text-on-surface">Thông tin chi tiết</h4>
                </div>

                <form onSubmit={handleSubmitProfile} className="space-y-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
                    {/* Họ và tên */}
                    <div className="space-y-xs">
                      <label className="font-label-md text-label-md text-on-surface" htmlFor="fullName">Họ và tên</label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">badge</span>
                        <input
                          id="fullName"
                          type="text"
                          value={user?.fullName || formData.fullName || ''}
                          className="w-full pl-10 pr-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-lg text-outline cursor-not-allowed font-body-md text-body-md outline-none"
                          disabled
                        />
                      </div>
                    </div>

                    {/* Vai trò */}
                    <div className="space-y-xs">
                      <label className="font-label-md text-label-md text-on-surface">Vai trò hệ thống</label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">work</span>
                        <input
                          type="text"
                          value="Hướng dẫn viên chuyên nghiệp"
                          className="w-full pl-10 pr-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-lg text-outline cursor-not-allowed font-body-md text-body-md outline-none"
                          disabled
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
                    {/* Email */}
                    <div className="space-y-xs">
                      <label className="font-label-md text-label-md text-on-surface" htmlFor="email">Email</label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">mail</span>
                        <input
                          id="email"
                          type="email"
                          value={user?.email || ''}
                          className="w-full pl-10 pr-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-lg text-outline cursor-not-allowed font-body-md text-body-md outline-none"
                          disabled
                        />
                      </div>
                    </div>

                    {/* Số điện thoại */}
                    <div className="space-y-xs">
                      <label className="font-label-md text-label-md text-on-surface" htmlFor="phone">Số điện thoại</label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">call</span>
                        <input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className={`w-full pl-10 pr-4 py-3 bg-surface border rounded-lg focus:ring-2 focus:ring-primary font-body-md text-body-md transition-all outline-none ${formErrors.phone ? 'border-error focus:border-error' : 'border-outline-variant/50 focus:border-primary'}`}
                        />
                      </div>
                      {formErrors.phone && <p className="text-error text-label-sm mt-1">{formErrors.phone}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
                    {/* Ngày sinh */}
                    <div className="space-y-xs">
                      <label className="font-label-md text-label-md text-on-surface" htmlFor="dateOfBirth">Ngày sinh</label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">calendar_today</span>
                        <input
                          id="dateOfBirth"
                          type="date"
                          value={formData.dateOfBirth}
                          onChange={handleInputChange}
                          className={`w-full pl-10 pr-4 py-3 bg-surface border rounded-lg focus:ring-2 focus:ring-primary font-body-md text-body-md transition-all outline-none ${formErrors.dateOfBirth ? 'border-error focus:border-error' : 'border-outline-variant/50 focus:border-primary'}`}
                        />
                      </div>
                      {formErrors.dateOfBirth && <p className="text-error text-label-sm mt-1">{formErrors.dateOfBirth}</p>}
                    </div>

                    {/* Ngày gia nhập */}
                    <div className="space-y-xs">
                      <label className="font-label-md text-label-md text-on-surface">Ngày gia nhập</label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">event_available</span>
                        <input
                          type="text"
                          value={formatDate(user?.createdAt)}
                          className="w-full pl-10 pr-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-lg text-outline cursor-not-allowed font-body-md text-body-md outline-none"
                          disabled
                        />
                      </div>
                    </div>
                  </div>

                  {/* Địa chỉ */}
                  <div className="space-y-xs">
                    <label className="font-label-md text-label-md text-on-surface" htmlFor="address">Địa chỉ thường trú</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">location_on</span>
                      <input
                        id="address"
                        type="text"
                        value={formData.address}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-3 bg-surface border border-outline-variant/50 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary font-body-md text-body-md transition-all outline-none"
                      />
                    </div>
                  </div>

                  {/* Submit buttons */}
                  <div className="pt-xl flex flex-col sm:flex-row items-center justify-end gap-md">
                    {saveSuccess && (
                      <span className="text-green-600 font-label-md flex items-center gap-xs">
                        <span className="material-symbols-outlined text-[20px]">check_circle</span>
                        {saveMessage || 'Đã cập nhật thông tin thành công!'}
                      </span>
                    )}
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="w-full sm:w-auto px-xl py-3 rounded-lg bg-secondary-container text-white font-label-md text-label-md hover:brightness-110 shadow-lg shadow-secondary/20 transition-all active:scale-95 flex items-center justify-center gap-sm"
                    >
                      {isSaving ? (
                        <>
                          <span className="material-symbols-outlined animate-spin">sync</span>
                          Đang lưu...
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined">save</span>
                          Cập nhật thông tin
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* View 2: Security & Password */}
            {activeSection === 'security' && (
              <div className="bg-surface-container-lowest p-xl rounded-xl shadow-sm border border-outline-variant/30">
                <div className="flex justify-between items-center mb-xl border-b border-outline-variant/20 pb-xs">
                  <h4 className="font-headline-sm text-headline-sm text-on-surface">Bảo mật tài khoản</h4>
                </div>

                <form onSubmit={handleSubmitPassword} className="space-y-lg">
                  {/* Mật khẩu cũ */}
                  <div className="space-y-xs">
                    <label className="font-label-md text-label-md text-on-surface" htmlFor="currentPassword">Mật khẩu hiện tại</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">lock</span>
                      <input
                        id="currentPassword"
                        type="password"
                        value={securityForm.currentPassword}
                        onChange={handleSecurityInputChange}
                        className={`w-full pl-10 pr-4 py-3 bg-surface border rounded-lg focus:ring-2 focus:ring-primary font-body-md text-body-md transition-all outline-none ${passwordErrors.currentPassword ? 'border-error focus:border-error' : 'border-outline-variant/50 focus:border-primary'}`}
                        placeholder="Nhập mật khẩu hiện tại..."
                      />
                    </div>
                    {passwordErrors.currentPassword && <p className="text-error text-label-sm mt-1">{passwordErrors.currentPassword}</p>}
                  </div>

                  {/* Mật khẩu mới */}
                  <div className="space-y-xs">
                    <label className="font-label-md text-label-md text-on-surface" htmlFor="newPassword">Mật khẩu mới</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">lock_open</span>
                      <input
                        id="newPassword"
                        type="password"
                        value={securityForm.newPassword}
                        onChange={handleSecurityInputChange}
                        className={`w-full pl-10 pr-4 py-3 bg-surface border rounded-lg focus:ring-2 focus:ring-primary font-body-md text-body-md transition-all outline-none ${passwordErrors.newPassword ? 'border-error focus:border-error' : 'border-outline-variant/50 focus:border-primary'}`}
                        placeholder="Nhập mật khẩu mới..."
                      />
                    </div>
                    {passwordErrors.newPassword && <p className="text-error text-label-sm mt-1">{passwordErrors.newPassword}</p>}
                  </div>

                  {/* Xác nhận mật khẩu mới */}
                  <div className="space-y-xs">
                    <label className="font-label-md text-label-md text-on-surface" htmlFor="confirmPassword">Xác nhận mật khẩu mới</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">lock_reset</span>
                      <input
                        id="confirmPassword"
                        type="password"
                        value={securityForm.confirmPassword}
                        onChange={handleSecurityInputChange}
                        className={`w-full pl-10 pr-4 py-3 bg-surface border rounded-lg focus:ring-2 focus:ring-primary font-body-md text-body-md transition-all outline-none ${passwordErrors.confirmPassword ? 'border-error focus:border-error' : 'border-outline-variant/50 focus:border-primary'}`}
                        placeholder="Nhập lại mật khẩu mới..."
                      />
                    </div>
                    {passwordErrors.confirmPassword && <p className="text-error text-label-sm mt-1">{passwordErrors.confirmPassword}</p>}
                  </div>

                  {/* Submit buttons */}
                  <div className="pt-xl flex flex-col sm:flex-row items-center justify-end gap-md">
                    {changePasswordSuccess && (
                      <span className="text-green-600 font-label-md flex items-center gap-xs">
                        <span className="material-symbols-outlined text-[20px]">check_circle</span>
                        Thay đổi mật khẩu thành công!
                      </span>
                    )}
                    <button
                      type="submit"
                      disabled={isChangingPassword}
                      className="w-full sm:w-auto px-xl py-3 rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:bg-primary-container shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-sm"
                    >
                      {isChangingPassword ? (
                        <>
                          <span className="material-symbols-outlined animate-spin">sync</span>
                          Đang đổi mật khẩu...
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined">security</span>
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
