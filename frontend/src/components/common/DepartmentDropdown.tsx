import React, { useMemo } from 'react'
import {
  Building2,
  Briefcase,
  Users,
  Layers,
  Factory,
  GraduationCap,
  LineChart,
  Sparkles,
  Landmark,
} from 'lucide-react'
import AttractiveDropdown from './AttractiveDropdown'
import { EMPLOYEE_DEPARTMENTS } from '../../constants/departments'

const DEPT_ICONS = [
  Building2,
  Briefcase,
  Users,
  Layers,
  Factory,
  GraduationCap,
  LineChart,
  Sparkles,
  Landmark,
]

const STANDARD = new Set<string>([...EMPLOYEE_DEPARTMENTS])

export interface DepartmentDropdownProps {
  value: string
  onChange: (value: string) => void
  /** When true, first option clears department (value ""). */
  includeEmpty?: boolean
  emptyLabel?: string
  /** Values not in the standard list (e.g. legacy DB values) shown with a neutral style. */
  extraNames?: string[]
  placeholder?: string
  label?: string
  required?: boolean
  disabled?: boolean
  className?: string
  error?: string
  size?: 'sm' | 'md' | 'lg'
  searchable?: boolean
  variant?: 'default' | 'bordered' | 'filled'
  /** Tighter panel: ~3 rows visible, list scrolls vertically under search (e.g. register screen). */
  compactOptionsList?: boolean
  /** Single-line trigger height to match text inputs */
  compactTrigger?: boolean
}

function buildOptions(includeEmpty: boolean, emptyLabel: string, extraNames: string[]) {
  const seen = new Set<string>()
  const out: {
    value: string
    label: string
    icon: React.ReactNode
    description?: string
  }[] = []

  if (includeEmpty) {
    out.push({
      value: '',
      label: emptyLabel,
      icon: <Building2 className="w-4 h-4 text-gray-400" />,
      description: 'Not assigned to a department',
    })
    seen.add('')
  }

  const extrasSorted = [...new Set(extraNames.map((n) => n.trim()).filter(Boolean))].filter(
    (n) => !STANDARD.has(n) && !seen.has(n)
  )
  extrasSorted.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))

  for (const name of extrasSorted) {
    seen.add(name)
    out.push({
      value: name,
      label: name,
      icon: <Layers className="w-4 h-4 text-amber-600" />,
      description: 'Saved value (not in default list)',
    })
  }

  EMPLOYEE_DEPARTMENTS.forEach((name, i) => {
    const Icon = DEPT_ICONS[i % DEPT_ICONS.length]
    out.push({
      value: name,
      label: name,
      icon: <Icon className="w-4 h-4 text-[#0d559e]" />,
      description: 'Organizational department',
    })
  })

  return out
}

const COMPACT_DEPT_SCROLL =
  'max-h-[12.5rem] overflow-y-scroll overscroll-contain border-t border-slate-100 bg-white scrollbar-thin scrollbar-thumb-slate-400/80 scrollbar-track-slate-100 hover:scrollbar-thumb-slate-500 pr-1'

const DepartmentDropdown: React.FC<DepartmentDropdownProps> = ({
  value,
  onChange,
  includeEmpty = false,
  emptyLabel = 'No department',
  extraNames = [],
  placeholder = 'Select department',
  searchable = true,
  compactOptionsList = false,
  compactTrigger = false,
  ...props
}) => {
  const options = useMemo(
    () => buildOptions(includeEmpty, emptyLabel, extraNames),
    [includeEmpty, emptyLabel, extraNames]
  )

  return (
    <AttractiveDropdown
      options={options}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      icon={<Building2 className="w-4 h-4 text-gray-500" />}
      searchable={searchable}
      optionsScrollClassName={compactOptionsList ? COMPACT_DEPT_SCROLL : undefined}
      compactTrigger={compactTrigger}
      {...props}
    />
  )
}

export default DepartmentDropdown
