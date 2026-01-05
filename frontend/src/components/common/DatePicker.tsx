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
  dateFormat = "MM/dd/yyyy",
  isClearable = true
}) => {
  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 z-10 flex items-center pl-3 pointer-events-none">
        <Calendar className="w-5 h-5 text-gray-400" />
      </div>
      <ReactDatePicker
        selected={selected}
        onChange={onChange}
        placeholderText={placeholder}
        disabled={disabled}
        minDate={minDate}
        maxDate={maxDate}
        showTimeSelect={showTimeSelect}
        dateFormat={dateFormat}
        isClearable={isClearable}
        className={`w-full h-10 pl-10 pr-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${className}`}
        calendarClassName="custom-datepicker"
        popperClassName="custom-datepicker-popper"
        wrapperClassName="w-full"
      />
    </div>
  );
};

export default CustomDatePicker;
