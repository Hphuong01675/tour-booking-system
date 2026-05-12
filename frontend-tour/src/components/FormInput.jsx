import React from 'react';

const FormInput = ({ label, icon, name, type = "text", placeholder, onChange, required = true, pattern, title, value }) => (
    <div className="space-y-2">
        <label className="font-semibold text-xs uppercase tracking-wider text-gray-500 block">{label}</label>
        <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                {icon}
            </span>
            <input
                name={name}
                type={type}
                value={value}
                onChange={onChange}
                required={required}
                pattern={pattern}
                title={title}
                placeholder={placeholder}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-lg border border-gray-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
            />
        </div>
    </div>
);

export default FormInput;