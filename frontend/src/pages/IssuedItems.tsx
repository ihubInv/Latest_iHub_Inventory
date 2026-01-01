import React from 'react'
import { useSelector } from 'react-redux'
import type { RootState } from '../store'
import IssuedItemManagement from '../components/issued/IssuedItemManagement'
import EmployeeIssuedItems from '../components/issued/EmployeeIssuedItems'

const IssuedItems: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth)
  
  // Show employee view for employees, admin view for others
  if (user?.role === 'employee') {
    return <EmployeeIssuedItems />
  }
  
  return <IssuedItemManagement />
}

export default IssuedItems

