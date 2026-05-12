import React from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="bg-slate-900 text-slate-400 py-12 mt-auto">
            <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
                <div className="text-left">
                    <h3 className="text-white font-black text-2xl mb-4 tracking-tighter">TravelSync</h3>
                    <p className="max-w-xs leading-relaxed mb-6">
                        Giải pháp quản lý và đặt tour du lịch chuyên nghiệp dành cho người Việt.
                    </p>
                    <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-blue-600 transition-colors cursor-pointer">
                            <span className="text-white font-bold text-lg">f</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-4 text-left md:text-right">
                    <p className="flex items-center md:justify-end gap-2 text-sm font-semibold text-slate-200">
                        Số 1 Võ Văn Ngân, Thủ Đức, TP. Hồ Chí Minh <MapPin size={16} className="text-blue-500" />
                    </p>
                    <p className="flex items-center md:justify-end gap-2 text-sm">
                        Hotline: 1900 xxxx <Phone size={16} className="text-blue-500" />
                    </p>
                    <p className="flex items-center md:justify-end gap-2 text-sm">
                        Email: contact@travelsync.com <Mail size={16} className="text-blue-500" />
                    </p>
                    <div className="pt-4 border-t border-slate-800">
                        © 2026 TravelSync Management. All rights reserved.
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;