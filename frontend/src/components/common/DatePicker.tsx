// import React from 'react';
// import ReactDatePicker from 'react-datepicker';
// import { Calendar } from 'lucide-react';
// import 'react-datepicker/dist/react-datepicker.css';

// interface DatePickerProps {
//   selected: Date | null;
//   onChange: (date: Date | null) => void;
//   placeholder?: string;
//   className?: string;
//   disabled?: boolean;
//   minDate?: Date;
//   maxDate?: Date;
//   showTimeSelect?: boolean;
//   dateFormat?: string;
//   isClearable?: boolean;
// }

// const CustomDatePicker: React.FC<DatePickerProps> = ({
//   selected,
//   onChange,
//   placeholder = "Select date",
//   className = "",
//   disabled = false,
//   minDate,
//   maxDate,
//   showTimeSelect = false,
//   dateFormat = "MM/dd/yyyy",
//   isClearable = true
// }) => {
//   return (
//     <div className="relative">
//       <div className="absolute inset-y-0 left-0 z-10 flex items-center pl-3 pointer-events-none">
//         <Calendar className="w-5 h-5 text-gray-400" />
//       </div>
//       <ReactDatePicker
//         selected={selected}
//         onChange={onChange}
//         placeholderText={placeholder}
//         disabled={disabled}
//         minDate={minDate}
//         maxDate={maxDate}
//         showTimeSelect={showTimeSelect}
//         dateFormat={dateFormat}
//         isClearable={isClearable}
//         className={`w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${className}`}
//         calendarClassName="custom-datepicker"
//         popperClassName="custom-datepicker-popper"
//         wrapperClassName="w-full"
//       />
      
//       <style jsx global>{`
//         .custom-datepicker {
//           border: none !important;
//           box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
//           border-radius: 16px !important;
//           overflow: hidden !important;
//           font-family: inherit !important;
//         }
        
//         .custom-datepicker-popper {
//           z-index: 9999 !important;
//         }
        
//         .react-datepicker__header {
//           background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
//           border-bottom: none !important;
//           border-radius: 16px 16px 0 0 !important;
//           padding: 16px !important;
//         }
        
//         .react-datepicker__current-month {
//           color: white !important;
//           font-weight: 600 !important;
//           font-size: 16px !important;
//           margin-bottom: 8px !important;
//         }
        
//         .react-datepicker__day-names {
//           margin-bottom: 8px !important;
//         }
        
//         .react-datepicker__day-name {
//           color: rgba(255, 255, 255, 0.8) !important;
//           font-weight: 500 !important;
//           font-size: 12px !important;
//         }
        
//         .react-datepicker__navigation {
//           top: 20px !important;
//         }
        
//         .react-datepicker__navigation--previous {
//           left: 20px !important;
//           border-right-color: white !important;
//         }
        
//         .react-datepicker__navigation--next {
//           right: 20px !important;
//           border-left-color: white !important;
//         }
        
//         .react-datepicker__day {
//           border-radius: 8px !important;
//           margin: 2px !important;
//           width: 32px !important;
//           height: 32px !important;
//           line-height: 32px !important;
//           font-weight: 500 !important;
//           transition: all 0.2s ease !important;
//         }
        
//         .react-datepicker__day:hover {
//           background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
//           color: white !important;
//           transform: scale(1.1) !important;
//         }
        
//         .react-datepicker__day--selected {
//           background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
//           color: white !important;
//           font-weight: 600 !important;
//         }
        
//         .react-datepicker__day--today {
//           background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%) !important;
//           color: white !important;
//           font-weight: 600 !important;
//         }
        
//         .react-datepicker__day--keyboard-selected {
//           background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
//           color: white !important;
//         }
        
//         .react-datepicker__month-container {
//           background: white !important;
//         }
        
//         .react-datepicker__triangle {
//           display: none !important;
//         }
        
//         .react-datepicker__time-container {
//           border-left: 1px solid #e5e7eb !important;
//         }
        
//         .react-datepicker__time-list-item {
//           padding: 8px 16px !important;
//           transition: all 0.2s ease !important;
//         }
        
//         .react-datepicker__time-list-item:hover {
//           background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
//           color: white !important;
//         }
        
//         .react-datepicker__time-list-item--selected {
//           background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
//           color: white !important;
//           font-weight: 600 !important;
//         }
//       `}</style>
//     </div>
//   );
// };

// export default CustomDatePicker;


import React from 'react';
import ReactDatePicker from 'react-datepicker';
import { Calendar } from 'lucide-react';
import 'react-datepicker/dist/react-datepicker.css';
import './CustomDatePicker.css'; // ✅ Import styles separately

interface DatePickerProps {
  selected: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
  showTimeSelect?: boolean;
  dateFormat?: string;
  isClearable?: boolean;
}

const CustomDatePicker: React.FC<DatePickerProps> = ({
  selected,
  onChange,
  placeholder = "Select date",
  className = "",
  disabled = false,
  minDate,
  maxDate,
  showTimeSelect = false,
  dateFormat = "dd/MM/yyyy",
  isClearable = true
}) => {
  // Parse manual date input in DD/MM/YYYY format
  const parseManualDate = (input: string): Date | null => {
    if (!input || input.trim() === '') return null;
    
    // Remove all non-digit characters and slashes, then try to parse
    const cleanInput = input.trim();
    
    // Try DD/MM/YYYY format
    const ddmmyyyy = cleanInput.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (ddmmyyyy) {
      const day = parseInt(ddmmyyyy[1], 10);
      const month = parseInt(ddmmyyyy[2], 10) - 1; // Month is 0-indexed
      const year = parseInt(ddmmyyyy[3], 10);
      
      // Validate ranges
      if (day >= 1 && day <= 31 && month >= 0 && month <= 11 && year >= 1900 && year <= 2100) {
        const date = new Date(year, month, day);
        // Verify the date is valid
        if (date.getDate() === day && date.getMonth() === month && date.getFullYear() === year) {
          // Validate against min/max dates if provided
          if (minDate && date < minDate) return null;
          if (maxDate && date > maxDate) return null;
          return date;
        }
      }
    }
    
    // Try DD-MM-YYYY format
    const ddmmyyyyDash = cleanInput.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
    if (ddmmyyyyDash) {
      const day = parseInt(ddmmyyyyDash[1], 10);
      const month = parseInt(ddmmyyyyDash[2], 10) - 1;
      const year = parseInt(ddmmyyyyDash[3], 10);
      
      if (day >= 1 && day <= 31 && month >= 0 && month <= 11 && year >= 1900 && year <= 2100) {
        const date = new Date(year, month, day);
        if (date.getDate() === day && date.getMonth() === month && date.getFullYear() === year) {
          if (minDate && date < minDate) return null;
          if (maxDate && date > maxDate) return null;
          return date;
        }
      }
    }
    
    // Try native Date parsing as fallback
    const parsed = new Date(cleanInput);
    if (!isNaN(parsed.getTime())) {
      if (minDate && parsed < minDate) return null;
      if (maxDate && parsed > maxDate) return null;
      return parsed;
    }
    
    return null;
  };

  // Handle manual input - this ensures the calendar updates when user types
  const handleManualInput = (e: any) => {
    if (e && e.target && 'value' in e.target) {
      const inputValue = (e.target as HTMLInputElement).value;
      const parsedDate = parseManualDate(inputValue);
      
      if (parsedDate) {
        // Update the date which will sync with the calendar
        onChange(parsedDate);
      } else if (inputValue === '') {
        onChange(null);
      }
    }
  };

  // Normalize selected to ensure it's always a valid Date object
  const normalizedSelected = selected instanceof Date && !isNaN(selected.getTime()) 
    ? selected 
    : null;

  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 z-10 flex items-center pl-3 pointer-events-none">
        <Calendar className="w-5 h-5 text-gray-400" />
      </div>
      <ReactDatePicker
        selected={normalizedSelected}
        onChange={onChange}
        onChangeRaw={handleManualInput}
        placeholderText={placeholder || "DD/MM/YYYY"}
        disabled={disabled}
        minDate={minDate}
        maxDate={maxDate}
        showTimeSelect={showTimeSelect}
        dateFormat={dateFormat}
        isClearable={isClearable}
        allowSameDay={true}
        strictParsing={false}
        className={`w-full h-11 pl-10 pr-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${className}`}
        calendarClassName="custom-datepicker"
        popperClassName="custom-datepicker-popper"
        wrapperClassName="w-full"
      />
    </div>
  );
};

export default CustomDatePicker;
