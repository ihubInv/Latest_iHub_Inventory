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
// Returns list from 2020-21 onwards to current/next financial year
export const getFinancialYears = () => {
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth()
  const years = []
  
  // Financial Year starts from 2020-21 (April 1, 2020 to March 31, 2021)
  const startFY = 2020
  
  // Determine the latest financial year
  // If current month is April (3) or later, current FY is currentYear-currentYear+1
  // If current month is before April, current FY is previousYear-currentYear
  let latestYear: number
  if (currentMonth >= 3) { // April (3) to December (11)
    latestYear = currentYear
  } else { // January (0) to March (2)
    latestYear = currentYear - 1
  }
  
  // Generate financial years from 2020-21 to latest year
  for (let year = startFY; year <= latestYear; year++) {
    years.push(`${year}-${(year + 1).toString().slice(-2)}`)
  }
  
  // Reverse to show latest first
  return years.reverse()
}

// Get current financial year
// Financial Year runs from 1st April to 31st March
// If today's date is before 1st April, select the previous Financial Year
// If today's date is on or after 1st April, select the current Financial Year
export const getCurrentFinancialYear = () => {
  const today = new Date()
  const currentYear = today.getFullYear()
  const currentMonth = today.getMonth() // 0-11 (0 = January, 3 = April)
  const currentDay = today.getDate()
  
  // April 1st is month 3 (0-indexed) and day 1
  // If we're on or after April 1st, we're in the current Financial Year
  // If we're before April 1st, we're in the previous Financial Year
  if (currentMonth > 3 || (currentMonth === 3 && currentDay >= 1)) {
    // On or after April 1st: Current FY is currentYear-currentYear+1
    return `${currentYear}-${(currentYear + 1).toString().slice(-2)}`
  } else {
    // Before April 1st: Current FY is previousYear-currentYear
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

