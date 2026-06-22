import { Link } from "react-router-dom";
import LoginForm from "../../components/Auth/LoginForm";

const LoginPage = () => {
    return (
        <div className="bg-surface text-on-surface min-h-screen flex flex-col">
            <header className="w-full bg-white border-b border-surface-container py-4 px-6 md:px-12 flex justify-between items-center shrink-0">
                <div className="flex items-center">
                    <Link className="text-primary font-bold text-xl tracking-tight" to="/login">
                        Chip3Chip
                    </Link>
                </div>
                <div className="flex items-center gap-4">
                    <a className="font-label-md text-primary hover:underline" href="#">
                        <span className="text-[14px] font-semibold tracking-[0.7px] text-on-surface-variant bg-surface">
                            Trợ giúp
                        </span>
                    </a>
                </div>
            </header>

            <main className="flex-grow flex flex-col md:flex-row overflow-hidden">
                <div className="hidden md:block md:w-1/2 relative">
                    <img
                        alt="Breathtaking Ha Long Bay landscape"
                        className="absolute inset-0 w-full h-full object-cover"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuARaUG6peON5IT4hc9m37Uvl0Pl9fNhfANjfDibL8uoz5Sq0LWarWjTOJ3PFIAAG7wZ_6w-DBzQNi7dZWwFtzDufyuiH8asrweXkEfqn1t9-AdTXY27G7PITGGIdUmlPYeDA4PSNf6i9oO-NaSp6GOj1n7A-EjcCQN621lOgZhKREX8ZUcVfxeNktS6I_5Uyb3C6U6IJDZ7g94KoCPiPVVGMfkMk83ABZ5znJKxWvsyPX_Xxxt_eyZzloFHutvLYDr95VMlnizg-Lqd"
                    />
                    <div className="absolute inset-0 bg-black/10" />
                    <div className="absolute bottom-16 left-12 right-12 text-white">
                        <h2 className="text-4xl font-bold mb-4 drop-shadow-md">
                            Khám phá thế giới theo cách của bạn.
                        </h2>
                        <p className="text-lg opacity-90 drop-shadow-sm">
                            Bắt đầu hành trình của bạn với Chip3Chip ngay hôm nay. Hàng ngàn tour du lịch đang chờ đón bạn.
                        </p>
                    </div>
                </div>

                <div className="w-full md:w-1/2 flex items-center justify-center bg-surface">
                    <div className="w-full">
                        <LoginForm />
                    </div>
                </div>
            </main>

            <footer className="w-full py-6 px-6 md:px-12 bg-white border-t border-surface-container shrink-0">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-on-surface">Chip3Chip</span>
                        <span className="text-on-surface-variant font-body-sm">
                            © 2026 Chip3Chip. Tất cả quyền được bảo lưu.
                        </span>
                    </div>
                    <div className="flex gap-6">
                        {["Điều khoản", "Bảo mật", "Liên hệ"].map((label) => (
                            <a
                                className="font-body-sm text-on-surface-variant hover:text-primary transition-colors"
                                href="#"
                                key={label}
                            >
                                {label}
                            </a>
                        ))}
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LoginPage;
