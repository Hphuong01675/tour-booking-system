import { Link } from "react-router-dom";

const heroImage =
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2070";

export default function Home() {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 shadow-2xl shadow-black/40 backdrop-blur-3xl">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-20"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      <div className="absolute top-6 left-6 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute bottom-12 right-6 h-52 w-52 rounded-full bg-white/10 blur-3xl" />
      <div className="relative space-y-12">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-6 text-white">
            <span className="inline-flex rounded-full bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-300">
              Khởi hành ngay hôm nay
            </span>
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Travel Tour - Hành trình mới cho trải nghiệm du lịch
            </h1>
            <p className="max-w-xl text-slate-300 sm:text-lg">
              Thưởng thức giao diện đẳng cấp, đăng nhập nhanh chóng và quản lý tour chuẩn xác trên hệ thống React hiện đại.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-full bg-emerald-400 px-6 py-3 text-sm font-semibold text-slate-950 shadow-xl shadow-emerald-500/20 transition hover:bg-emerald-300"
              >
                Đăng nhập ngay
              </Link>
              <a
                href="#benefits"
                className="inline-flex items-center justify-center rounded-full border border-slate-700 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:border-emerald-400 hover:text-white"
              >
                Tìm hiểu ưu điểm
              </a>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-8 shadow-xl shadow-black/40">
            <h2 className="text-2xl font-semibold text-white">Tour nổi bật</h2>
            <ul className="mt-6 space-y-4 text-slate-300">
              {[
                {
                  title: "Tour miền Bắc 4N3Đ",
                  description: "Khám phá Hà Nội, Hạ Long và Ninh Bình với guide chuyên nghiệp.",
                },
                {
                  title: "Tour Đà Nẵng - Hội An",
                  description: "Bãi biển xanh, ẩm thực đường phố và phố cổ lãng mạn.",
                },
                {
                  title: "Tour Sài Gòn - Cần Giờ",
                  description: "Trải nghiệm thành phố hiện đại và kỳ nghỉ sinh thái.",
                },
              ].map((item) => (
                <li key={item.title} className="rounded-3xl border border-slate-700 bg-slate-950/40 p-5">
                  <p className="font-semibold text-white">{item.title}</p>
                  <p className="mt-2 text-sm">{item.description}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div id="benefits" className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Thiết kế Glassmorphism",
              description: "Trang login và trang chủ được thiết kế gần giống giao diện Travel Login đẹp mắt.",
            },
            {
              title: "Kết nối backend",
              description: "React frontend gọi API qua proxy Vite đến backend Node.js.",
            },
            {
              title: "Khởi động đồng bộ",
              description: "Chạy cả frontend và backend bằng một lệnh duy nhất từ thư mục gốc.",
            },
          ].map((item) => (
            <div key={item.title} className="rounded-3xl border border-slate-700 bg-slate-900/80 p-8">
              <h3 className="text-xl font-semibold text-white">{item.title}</h3>
              <p className="mt-3 text-slate-300">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
