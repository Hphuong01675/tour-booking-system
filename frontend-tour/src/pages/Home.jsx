import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
    const navigate = useNavigate();
    const [isScrolled, setIsScrolled] = useState(false);

    // Hiệu ứng Header đổi màu khi cuộn
    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Hàm cuộn mượt đến các Section
    const scrollToSection = (id) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="min-h-screen bg-[#f9f9fc] font-inter text-[#1a1c1e] selection:bg-[#003ec7]/20">

            {/* --- TOP NAVBAR --- */}
            <header className={`fixed top-0 w-full z-[100] transition-all duration-300 ${
                isScrolled ? 'bg-white/90 backdrop-blur-md shadow-sm py-3' : 'bg-transparent py-5'
            }`}>
                <nav className="max-w-7xl mx-auto px-6 md:px-10 flex justify-between items-center">
                    <div className="flex items-center gap-12">
                        <span className={`text-2xl font-black font-jakarta tracking-tighter cursor-pointer transition-colors ${isScrolled ? 'text-[#003ec7]' : 'text-white'}`}
                              onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
                            TravelSync
                        </span>
                        <div className="hidden md:flex items-center gap-8">
                            <button onClick={() => scrollToSection('destinations')} className={`text-sm font-bold transition-colors ${isScrolled ? 'text-[#434656] hover:text-[#003ec7]' : 'text-white/80 hover:text-white'}`}>Destinations</button>
                            <button onClick={() => scrollToSection('tours')} className={`text-sm font-bold transition-colors ${isScrolled ? 'text-[#434656] hover:text-[#003ec7]' : 'text-white/80 hover:text-white'}`}>Tours</button>
                            <button onClick={() => scrollToSection('pricing')} className={`text-sm font-bold transition-colors ${isScrolled ? 'text-[#434656] hover:text-[#003ec7]' : 'text-white/80 hover:text-white'}`}>Pricing</button>
                            <button onClick={() => scrollToSection('about')} className={`text-sm font-bold transition-colors ${isScrolled ? 'text-[#434656] hover:text-[#003ec7]' : 'text-white/80 hover:text-white'}`}>About</button>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/login')} className={`text-sm font-bold transition-colors ${isScrolled ? 'text-[#434656]' : 'text-white'}`}>Log In</button>
                        <button onClick={() => navigate('/register')} className="bg-[#003ec7] text-white px-6 py-2.5 rounded-xl font-bold hover:bg-[#0052ff] shadow-lg transition-all active:scale-95">
                            Sign Up
                        </button>
                    </div>
                </nav>
            </header>

            {/* --- HERO SECTION --- */}
            <section id="destinations" className="relative h-screen flex items-center overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <img className="w-full h-full object-cover scale-105" src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1920&q=80" alt="Hero" />
                    <div className="absolute inset-0 bg-black/40 bg-gradient-to-r from-black/70 to-transparent"></div>
                </div>
                <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10 w-full">
                    <div className="max-w-2xl text-white">
                        <h1 className="text-5xl md:text-7xl font-[800] font-jakarta leading-[1.15] mb-6">Kháp phá thế giới, <br/><span className="text-[#b7c4ff]">quản lý hành trình</span></h1>
                        <p className="text-lg md:text-xl text-white/90 mb-10 leading-relaxed drop-shadow-md">Giải pháp quản lý tour chuyên nghiệp dành cho các công ty lữ hành hiện đại. Tối ưu hóa quy trình, nâng cao trải nghiệm khách hàng.</p>
                        <div className="flex gap-4">
                            <button className="bg-[#fe6b00] text-white px-8 py-4 rounded-xl font-bold text-lg flex items-center gap-2 hover:brightness-110 active:scale-95 shadow-xl shadow-orange-600/20 transition-all">
                                Bắt đầu ngay <span className="material-symbols-outlined">arrow_forward</span>
                            </button>
                            <button onClick={() => scrollToSection('about')} className="glass-effect text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/20 transition-all border border-white/30">
                                Tìm hiểu thêm
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- ABOUT SECTION --- */}
            <section id="about" className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-6 md:px-10 grid lg:grid-cols-2 gap-16 items-center">
                    <div className="relative">
                        <img className="rounded-[2.5rem] shadow-2xl aspect-square object-cover" src="https://images.unsplash.com/photo-1530789253388-582c481c54b0?auto=format&fit=crop&w=800" alt="About" />
                        <div className="absolute -bottom-8 -right-8 bg-[#fe6b00] text-white p-8 rounded-[2rem] shadow-xl hidden md:block">
                            <p className="text-4xl font-extrabold mb-1">10+ Năm</p>
                            <p className="text-sm opacity-90 font-medium">Kinh nghiệm đồng hành cùng lữ hành.</p>
                        </div>
                    </div>
                    <div>
                        <span className="text-[#a04100] font-black uppercase text-xs tracking-widest mb-4 block">Về chúng tôi</span>
                        <h2 className="text-4xl md:text-5xl font-extrabold text-[#003ec7] font-jakarta mb-6 leading-tight">Sứ mệnh nâng tầm ngành du lịch Việt</h2>
                        <p className="text-[#434656] text-lg leading-relaxed mb-8">Tại TravelSync, chúng tôi tin rằng công nghệ là chìa khóa để mở ra những trải nghiệm du lịch tuyệt vời hơn. Hệ sinh thái của chúng tôi giúp các đơn vị vận hành chuyên nghiệp hơn.</p>
                        <div className="space-y-4">
                            {['Tối ưu hóa vận hành 40%', 'Kết nối mạng lưới toàn cầu'].map((text, i) => (
                                <div key={i} className="flex gap-4 items-center">
                                    <div className="w-8 h-8 bg-[#dde1ff] rounded-full flex items-center justify-center text-[#003ec7] flex-shrink-0">
                                        <span className="material-symbols-outlined text-sm font-bold">check</span>
                                    </div>
                                    <p className="font-bold text-[#1a1c1e] text-lg">{text}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* --- TOURS SECTION --- */}
            <section id="tours" className="py-24 bg-[#f9f9fc]">
                <div className="max-w-7xl mx-auto px-6 md:px-10 text-center">
                    <h2 className="text-4xl md:text-5xl font-black text-[#003ec7] font-jakarta mb-4">Các tour nổi bật</h2>
                    <p className="text-[#434656] mb-12 text-lg">Khám phá những hành trình được yêu thích nhất trong mùa này.</p>
                    <div className="grid md:grid-cols-3 gap-8">
                        <TourCard title="Vịnh Hạ Long" price="3.500.000đ" img="https://images.unsplash.com/photo-1524230507669-5ff97982bb5e?auto=format&fit=crop&w=600" />
                        <TourCard title="Đảo Phú Quốc" price="4.200.000đ" img="https://images.unsplash.com/photo-1589779267444-401d6f0641bb?auto=format&fit=crop&w=600" />
                        <TourCard title="Thị trấn Sa Pa" price="2.800.000đ" img="https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&w=600" />
                    </div>
                </div>
            </section>

            {/* --- TESTIMONIALS SECTION --- */}
            <section id="testimonials" className="py-24 bg-[#eeeef0]">
                <div className="max-w-7xl mx-auto px-6 md:px-10">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-black text-[#003ec7] font-jakarta mb-4 uppercase tracking-tighter">Cảm nhận từ đối tác</h2>
                        <p className="text-[#434656] max-w-xl mx-auto text-lg">Những câu chuyện thành công từ các đơn vị lữ hành đã tin tưởng sử dụng TravelSync.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <TestimonialCard
                            name="Chị Minh Anh"
                            role="Giám đốc, Vietnam Adventures"
                            content="TravelSync đã hoàn toàn thay đổi cách chúng tôi vận hành. Việc quản lý lịch trình hướng dẫn viên trở nên đơn giản hơn bao giờ hết, giảm thiểu sai sót đáng kể."
                            img="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&h=200&q=80"
                        />
                        <TestimonialCard
                            name="Anh Hoàng Nam"
                            role="CEO, TravelConnect"
                            content="Hệ thống báo cáo chi tiết và trực quan giúp tôi có cái nhìn tổng thể về hiệu quả kinh doanh hàng tháng. Một công cụ không thể thiếu cho các startup du lịch."
                            img="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&h=200&q=80"
                        />
                        <TestimonialCard
                            name="Chị Thu Trang"
                            role="Trưởng phòng Op, SunTours"
                            content="Dịch vụ hỗ trợ 24/7 thực sự ấn tượng. Đội ngũ chuyên gia luôn giải quyết các thắc mắc của chúng tôi một cách nhanh chóng và cực kỳ chuyên nghiệp."
                            img="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&h=200&q=80"
                        />
                    </div>
                </div>
            </section>

            {/* --- PRICING/FEATURES SECTION --- */}
            <section id="pricing" className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-6 md:px-10 text-center">
                    <h2 className="text-4xl md:text-5xl font-black text-[#003ec7] font-jakarta mb-16 uppercase tracking-tighter">Tại sao chọn TravelSync?</h2>
                    <div className="grid md:grid-cols-3 gap-8 text-left">
                        <Feature icon="dashboard_customize" title="Dễ dàng quản lý" color="bg-[#dde1ff] text-[#003ec7]" />
                        <Feature icon="travel_explore" title="Tour đa dạng" color="bg-[#ffdbcc] text-[#a04100]" />
                        <Feature icon="support_agent" title="Hỗ trợ 24/7" color="bg-[#c2e8ff] text-[#005471]" />
                    </div>
                </div>
            </section>

            {/* --- CONTACT & FOOTER --- */}
            <footer className="bg-white border-t border-[#c3c5d9]/50 py-16">
                <div className="max-w-7xl mx-auto px-6 md:px-10 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="text-left">
                        <span className="text-2xl font-black text-[#003ec7] font-jakarta">TravelSync</span>
                        <p className="text-[#737688] text-sm mt-2 max-w-xs">Kiến tạo những hành trình đáng nhớ thông qua công nghệ quản lý hiện đại.</p>
                    </div>
                    <p className="text-[#737688] text-sm">© 2026 TravelSync Management. All rights reserved.</p>
                    <div className="flex gap-6">
                        {['Privacy', 'Terms', 'Help'].map(item => (
                            <button key={item} className="text-xs font-bold text-[#434656] uppercase hover:text-[#003ec7] tracking-widest">{item}</button>
                        ))}
                    </div>
                </div>
            </footer>

            <style dangerouslySetInnerHTML={{ __html: `
                .glass-effect { background: rgba(255, 255, 255, 0.15); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }
                h1, h2 { text-wrap: balance; }
            ` }} />
        </div>
    );
};

// --- SUB-COMPONENTS ---

const TourCard = ({ title, price, img }) => (
    <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 group border border-[#c3c5d9]/20">
        <div className="h-64 overflow-hidden relative">
            <img className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" src={img} alt={title} />
            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-4 py-1 rounded-full text-[#003ec7] font-bold text-xs shadow-sm">Phổ biến</div>
        </div>
        <div className="p-8 text-left">
            <h4 className="text-2xl font-bold mb-6 font-jakarta text-[#1a1c1e]">{title}</h4>
            <div className="flex justify-between items-center border-t border-[#c3c5d9]/30 pt-6">
                <div>
                    <p className="text-[10px] text-[#737688] font-bold uppercase tracking-widest">Giá từ</p>
                    <p className="text-[#003ec7] font-black text-xl">{price}</p>
                </div>
                <div className="w-12 h-12 bg-[#dde1ff] rounded-full flex items-center justify-center text-[#003ec7] hover:bg-[#003ec7] hover:text-white transition-colors cursor-pointer">
                    <span className="material-symbols-outlined">chevron_right</span>
                </div>
            </div>
        </div>
    </div>
);

const TestimonialCard = ({ name, role, content, img }) => (
    <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-[#c3c5d9]/30 flex flex-col justify-between hover:shadow-xl transition-all duration-300 group">
        <div>
            <div className="flex gap-1 text-[#fe6b00] mb-8">
                {[...Array(5)].map((_, i) => (
                    <span key={i} className="material-symbols-outlined fill-[1]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                ))}
            </div>
            <p className="text-[#434656] italic mb-10 leading-relaxed font-medium text-lg">"{content}"</p>
        </div>
        <div className="flex items-center gap-5">
            <img className="w-14 h-14 rounded-full object-cover shadow-inner ring-4 ring-[#dde1ff]/30" src={img} alt={name} />
            <div>
                <h5 className="font-bold text-[#1a1c1e] text-lg font-jakarta">{name}</h5>
                <p className="text-xs text-[#737688] font-bold uppercase tracking-widest">{role}</p>
            </div>
        </div>
    </div>
);

const Feature = ({ icon, title, color }) => (
    <div className="p-10 rounded-[2.5rem] border border-[#c3c5d9]/30 hover:shadow-2xl transition-all duration-300 bg-white group">
        <div className={`w-16 h-16 ${color} rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500`}>
            <span className="material-symbols-outlined text-4xl">{icon}</span>
        </div>
        <h3 className="text-2xl font-bold mb-4 font-jakarta text-[#1a1c1e]">{title}</h3>
        <p className="text-[#434656] leading-relaxed font-medium">Điều phối lịch trình, quản lý hướng dẫn viên và dữ liệu khách hàng chuyên nghiệp chỉ với vài thao tác.</p>
    </div>
);

export default Home;