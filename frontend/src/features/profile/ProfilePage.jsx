import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { clearStatus, fetchProfile, setToken, updateProfile } from "./profileSlice";
import ProfileForm from "./ProfileForm";

const ProfilePage = () => {
  const dispatch = useAppDispatch();
  const { profile, token, loading, error, successMessage } = useAppSelector((state) => state.profile);
  const [localToken, setLocalToken] = useState(token || "");

  useEffect(() => {
    if (token) {
      dispatch(fetchProfile());
    }
  }, [dispatch, token]);

  useEffect(() => {
    setLocalToken(token || "");
  }, [token]);

  const handleTokenSave = () => {
    dispatch(clearStatus());
    dispatch(setToken(localToken.trim()));
  };

  const handleUpdate = (data) => {
    dispatch(clearStatus());
    dispatch(updateProfile(data));
  };

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Thiết lập truy cập</h2>
            <p className="mt-1 text-sm text-slate-600">
              Dán JWT token để tải và chỉnh sửa hồ sơ hiện tại.
            </p>
          </div>
          <button
            onClick={handleTokenSave}
            className="inline-flex items-center justify-center rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-700"
          >
            Lưu token
          </button>
        </div>
        <textarea
          rows="3"
          value={localToken}
          onChange={(event) => setLocalToken(event.target.value)}
          className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-4 text-slate-900 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
          placeholder="Bearer token..."
        />
      </section>

      {error && (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-800">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-800">
          {successMessage}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-slate-900">Thông tin hồ sơ</h2>
            <p className="mt-2 text-sm text-slate-600">
              Xem thông tin hiện có và cập nhật các trường chính.
            </p>
          </div>
          {profile ? (
            <div className="space-y-4">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Email</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{profile.email}</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Tên</p>
                  <p className="mt-2 text-base text-slate-900">{profile.fullName || "Chưa cập nhật"}</p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Số điện thoại</p>
                  <p className="mt-2 text-base text-slate-900">{profile.phone || "Chưa cập nhật"}</p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Tuổi</p>
                  <p className="mt-2 text-base text-slate-900">{profile.age || "Chưa cập nhật"}</p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Giới tính</p>
                  <p className="mt-2 text-base text-slate-900">{profile.gender || "Chưa cập nhật"}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-slate-600">
              Nhập token và nhấn Lưu token để tải dữ liệu hồ sơ.
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-slate-900">Chỉnh sửa hồ sơ</h2>
            <p className="mt-2 text-sm text-slate-600">
              Cập nhật họ tên, tuổi, giới tính và số điện thoại của khách hàng.
            </p>
          </div>
          <ProfileForm profile={profile} onSubmit={handleUpdate} loading={loading} />
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
