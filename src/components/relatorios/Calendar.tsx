import React from 'react';
import { DayPicker, type DayPickerProps } from 'react-day-picker';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export type CalendarProps = DayPickerProps;

export const Calendar: React.FC<CalendarProps> = ({
  className = '',
  classNames,
  showOutsideDays = true,
  ...props
}) => {
  return (
    <DayPicker
      locale={ptBR}
      showOutsideDays={showOutsideDays}
      className={`p-3 ${className}`}
      classNames={{
        months: 'flex flex-col sm:flex-row gap-4',
        month: 'space-y-3',
        month_caption: 'flex justify-center pt-1 relative items-center',
        caption_label: 'text-sm font-semibold text-slate-800 capitalize',
        nav: 'flex items-center gap-1',
        button_previous:
          'absolute left-1 h-7 w-7 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600',
        button_next:
          'absolute right-1 h-7 w-7 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600',
        month_grid: 'w-full border-collapse',
        weekdays: 'flex',
        weekday: 'text-slate-400 rounded-md w-9 font-medium text-[0.7rem] text-center',
        week: 'flex w-full mt-1',
        day: 'relative p-0 text-center text-sm focus-within:relative focus-within:z-20',
        day_button:
          'h-9 w-9 p-0 font-normal rounded-lg hover:bg-slate-100 aria-selected:opacity-100 transition-colors',
        range_start: 'rounded-l-lg',
        range_end: 'rounded-r-lg',
        selected:
          'bg-brand-500 text-white hover:bg-brand-600 hover:text-white focus:bg-brand-500 focus:text-white',
        today: 'bg-slate-100 text-slate-900 font-semibold',
        outside: 'text-slate-300 opacity-50',
        disabled: 'text-slate-300 opacity-40',
        range_middle: 'bg-brand-50 text-brand-700 rounded-none',
        hidden: 'invisible',
        ...classNames
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === 'left' ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )
      }}
      {...props}
    />
  );
};
