import React from 'react';

export const Button = ({ children, className = '', variant = 'default', size = 'default', ...props }: any) => {
    let base = "inline-flex items-center justify-center rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 ";
    if (variant === 'outline') base += "border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 ";
    else if (variant === 'ghost') base += "hover:bg-slate-100 text-slate-700 ";
    else if (variant === 'secondary') base += "bg-slate-100 hover:bg-slate-200 text-slate-700 ";
    else base += "bg-purple-600 hover:bg-purple-700 text-white ";

    if (size === 'sm') base += "h-7 px-2.5 text-[10px] ";
    else base += "h-9 px-4 py-2 ";

    return <button className={`${base} ${className}`} {...props}>{children}</button>;
};

export const Input = ({ className = '', ...props }: any) => (
    <input className={`flex h-9 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1 text-sm shadow-2xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-purple-500 disabled:cursor-not-allowed disabled:opacity-50 ${className}`} {...props} />
);

export const Label = ({ className = '', ...props }: any) => (
    <label className={`text-xs font-medium text-slate-500 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`} {...props} />
);

export const Card = ({ className = '', children, ...props }: any) => (
    <div className={`rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-sm ${className}`} {...props}>{children}</div>
);

export const CardHeader = ({ className = '', children, ...props }: any) => (
    <div className={`flex flex-col space-y-1.5 p-5 pb-3 ${className}`} {...props}>{children}</div>
);

export const CardTitle = ({ className = '', children, ...props }: any) => (
    <h3 className={`text-sm font-bold leading-none tracking-tight ${className}`} {...props}>{children}</h3>
);

export const CardContent = ({ className = '', children, ...props }: any) => (
    <div className={`p-5 pt-0 ${className}`} {...props}>{children}</div>
);

export const Badge = ({ children, className = '', ...props }: any) => (
    <span
        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${className}`}
        {...props}
    >
        {children}
    </span>
);

export const Select = ({ className = '', children, ...props }: any) => (
    <select
        className={`flex h-9 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1 text-sm shadow-2xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-purple-500 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        {...props}
    >
        {children}
    </select>
);

type DialogProps = {
    open: boolean;
    onClose: () => void;
    children: React.ReactNode;
    className?: string;
};

export const Dialog = ({ open, onClose, children, className = '' }: DialogProps) => {
    if (!open) return null;
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn"
            onClick={onClose}
        >
            <div
                className={`bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md relative ${className}`}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
            >
                {children}
            </div>
        </div>
    );
};

export const DialogHeader = ({ className = '', children, ...props }: any) => (
    <div className={`px-6 pt-6 pb-2 ${className}`} {...props}>{children}</div>
);

export const DialogTitle = ({ className = '', children, ...props }: any) => (
    <h3 className={`text-lg font-bold text-slate-900 ${className}`} {...props}>{children}</h3>
);

export const DialogContent = ({ className = '', children, ...props }: any) => (
    <div className={`px-6 pb-6 space-y-4 ${className}`} {...props}>{children}</div>
);