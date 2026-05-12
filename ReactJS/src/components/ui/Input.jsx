const Input = ({
    label,
    type = "text",
    placeholder,
    value,
    onChange,
    required = false,
    className = "",
    ...props
}) => {
    return (
        <div>
            {label && <label className="sr-only">{label}</label>}
            <input
                type={type}
                required={required}
                className={`appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm ${className}`}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                {...props}
            />
        </div>
    );
};

export default Input;
