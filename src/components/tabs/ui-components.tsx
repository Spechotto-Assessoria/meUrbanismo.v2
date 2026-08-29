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