import React from 'react';
import ReactDatePicker from 'react-datepicker';
import { Calendar } from 'lucide-react';
import 'react-datepicker/dist/react-datepicker.css';

interface DateRangePickerProps {
  startDate: Date | null;
  endDate: Date | null;
  onStartDateChange: (date: Date | null) => void;
  onEndDateChange: (date: Date | null) => void;
  startPlaceholder?: string;
  endPlaceholder?: string;
  className?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  startPlaceholder = "Start date",
  endPlaceholder = "End date",
  className = "",
  disabled = false,
  size = 'md'
}) => {
  // Get size-specific classes
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-2 text-sm';
      case 'lg':
        return 'px-5 py-4 text-lg';
      default:
        return 'px-4 py-3 text-base';
    }
  };

  const sizeClasses = getSizeClasses();
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${className}`}>
      {/* Start Date */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-1">
          <Calendar className="h-5 w-5 text-gray-400" />
        </div>
        <ReactDatePicker
          selected={startDate}
          onChange={onStartDateChange}
          selectsStart
          startDate={startDate}
          endDate={endDate}
          placeholderText={startPlaceholder}
          disabled={disabled}
          maxDate={endDate || undefined}
          isClearable
          className={`w-full pl-10 pr-4 ${sizeClasses} border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
          calendarClassName="custom-datepicker"
          popperClassName="custom-datepicker-popper"
          wrapperClassName="w-full"
        />
      </div>

      {/* End Date */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-1">
          <Calendar className="h-5 w-5 text-gray-400" />
        </div>
        <ReactDatePicker
          selected={endDate}
          onChange={onEndDateChange}
          selectsEnd
          startDate={startDate}
          endDate={endDate}
          placeholderText={endPlaceholder}
          disabled={disabled}
          minDate={startDate || undefined}
          isClearable
          className={`w-full pl-10 pr-4 ${sizeClasses} border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
          calendarClassName="custom-datepicker"
          popperClassName="custom-datepicker-popper"
          wrapperClassName="w-full"
        />
      </div>

      <style>{`
        .custom-datepicker {
          border: none !important;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
          border-radius: 16px !important;
          overflow: hidden !important;
          font-family: inherit !important;
        }
        
        .custom-datepicker-popper {
          z-index: 9999 !important;
        }
        
        .react-datepicker__header {
          background: linear-gradient(135deg, #0d559e 0%, #1a6bb8 100%) !important;
          border-bottom: none !important;
          border-radius: 16px 16px 0 0 !important;
          padding: 16px !important;
        }
        
        .react-datepicker__current-month {
          color: white !important;
          font-weight: 600 !important;
          font-size: 16px !important;
          margin-bottom: 8px !important;
        }
        
        .react-datepicker__day-names {
          margin-bottom: 8px !important;
        }
        
        .react-datepicker__day-name {
          color: rgba(255, 255, 255, 0.8) !important;
          font-weight: 500 !important;
          font-size: 12px !important;
        }
        
        .react-datepicker__navigation {
          top: 20px !important;
        }
        
        .react-datepicker__navigation--previous {
          left: 20px !important;
          border-right-color: white !important;
        }
        
        .react-datepicker__navigation--next {
          right: 20px !important;
          border-left-color: white !important;
        }
        
        .react-datepicker__day {
          border-radius: 8px !important;
          margin: 2px !important;
          width: 32px !important;
          height: 32px !important;
          line-height: 32px !important;
          font-weight: 500 !important;
          transition: all 0.2s ease !important;
        }
        
        .react-datepicker__day:hover {
          background: linear-gradient(135deg, #0d559e 0%, #1a6bb8 100%) !important;
          color: white !important;
          transform: scale(1.1) !important;
        }
        
        .react-datepicker__day--selected {
          background: linear-gradient(135deg, #0d559e 0%, #1a6bb8 100%) !important;
          color: white !important;
          font-weight: 600 !important;
        }
        
        .react-datepicker__day--in-selecting-range,
        .react-datepicker__day--in-range {
          background: linear-gradient(135deg, rgba(13, 85, 158, 0.3) 0%, rgba(26, 107, 184, 0.3) 100%) !important;
          color: #667eea !important;
        }
        
        .react-datepicker__day--range-start,
        .react-datepicker__day--range-end {
          background: linear-gradient(135deg, #0d559e 0%, #1a6bb8 100%) !important;
          color: white !important;
          font-weight: 600 !important;
        }
        
        .react-datepicker__day--today {
          background: linear-gradient(135deg, #0d559e 0%, #1a6bb8 100%) !important;
          color: white !important;
          font-weight: 600 !important;
        }
        
        .react-datepicker__month-container {
          background: white !important;
        }
        
        .react-datepicker__triangle {
          display: none !important;
        }
      `}</style>
    </div>
  );
};

export default DateRangePicker;