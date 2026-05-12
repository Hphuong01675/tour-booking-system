import { Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";

function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-20 border-b border-slate-700 bg-slate-950/95 py-5 px-6 backdrop-blur-xl sm:px-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link to="/" className="text-2xl font-bold tracking-tight text-emerald-300">
            Tour Booking System
          </Link>
          <nav className="flex items-center gap-4 text-sm text-slate-200">
            <Link to="/" className="hover:text-white">
              Trang chủ
            </Link>
            <Link
              to="/login"
              className="rounded-full border border-emerald-400 px-4 py-2 text-emerald-100 transition hover:bg-emerald-400 hover:text-slate-950"
            >
              Đăng nhập
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 py-10 sm:px-10">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
