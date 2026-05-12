import React from 'react';
import { Loader2 } from 'lucide-react';

// Thành phần Input có Icon và Label
export const InputField = ({ label, icon: Icon, type = "text", value, onChange, placeholder, error }) => (
    <div className="mb-4 text-left">
        <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
        <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Icon size={18} />
            </div>
            <input
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required
                className={`w-full pl-10 pr-4 py-2.5 border rounded-xl outline-none transition-all ${
                    error ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                }`}
            />
        </div>
    </div>
);

// Nút bấm có hiệu ứng loading
export const Button = ({ children, loading, onClick, type = "submit" }) => (
    <button
        type={type}
        onClick={onClick}
        disabled={loading}
        className="w-full py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all disabled:opacity-50 active:scale-[0.98]"
    >
        {loading ? <Loader2 className="animate-spin" size={20} /> : children}
    </button>
);