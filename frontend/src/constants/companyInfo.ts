// Company Information Constants
export const COMPANY_INFO = {
  name: 'iHub & HCi Foundation',
  foundingYear: 2020,
  currentYear: new Date().getFullYear(),
  financialYearStart: 4, // April (0-indexed, so 3 = April)
  address: 'IIT Mandi, Kamand, HP',
  email: 'info@ihubiitmandi.in',
  phone: '+91-XXXXXXXXXX'
}

// Get valid financial years for dropdowns
export const getFinancialYears = () => {
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth()
  const years = []
  
  // If we're past April, include current FY
  const startYear = currentMonth >= COMPANY_INFO.financialYearStart ? currentYear : currentYear - 1
  
  // Generate last 10 financial years
  for (let i = 0; i < 10; i++) {
    const year = startYear - i
    years.push(`${year}-${(year + 1).toString().slice(-2)}`)
  }
  
  return years
}

// Get current financial year
export const getCurrentFinancialYear = () => {
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth()
  
  if (currentMonth >= COMPANY_INFO.financialYearStart) {
    return `${currentYear}-${(currentYear + 1).toString().slice(-2)}`
  } else {
    return `${currentYear - 1}-${currentYear.toString().slice(-2)}`
  }
}

// Validate if a date is within valid inventory dates
export const validateInventoryDate = (date: Date) => {
  const minDate = new Date(COMPANY_INFO.foundingYear, 0, 1)
  const maxDate = new Date()
  maxDate.setFullYear(maxDate.getFullYear() + 1) // Allow up to 1 year in future
  
  return date >= minDate && date <= maxDate
}

// Get valid year for inventory
export const getValidYear = (year?: number) => {
  if (!year) return COMPANY_INFO.currentYear
  if (year < COMPANY_INFO.foundingYear) return COMPANY_INFO.foundingYear
  if (year > COMPANY_INFO.currentYear + 1) return COMPANY_INFO.currentYear
  return year
}

// Get valid inventory date
export const getValidInventoryDate = (date?: Date) => {
  if (!date) return new Date()
  if (validateInventoryDate(date)) return date
  return new Date()
}

// Get years for dropdown (founding year to current year + 1)
export const getYearsForDropdown = () => {
  const years = []
  for (let i = COMPANY_INFO.currentYear + 1; i >= COMPANY_INFO.foundingYear; i--) {
    years.push(i)
  }
  return years
}

