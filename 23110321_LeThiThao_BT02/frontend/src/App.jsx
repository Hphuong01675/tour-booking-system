import ProfilePage from "./features/profile/ProfilePage";

function App() {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-200/60 sm:p-10">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-semibold text-slate-900">Tour Profile</h1>
            <p className="mt-2 text-slate-600">
              Quản lý hồ sơ người dùng cho hệ thống đặt tour du lịch.
            </p>
          </div>
          <ProfilePage />
        </div>
      </div>
    </div>
  );
}

export default App;
