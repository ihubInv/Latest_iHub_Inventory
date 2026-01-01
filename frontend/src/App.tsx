import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Provider } from 'react-redux'
import { Toaster } from 'react-hot-toast'
import { store } from './store'
import { Layout } from './components/layout/Layout'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import LoginForm from './components/auth/LoginForm'
import RegisterForm from './components/auth/RegisterForm'
import ForgotPasswordForm from './components/auth/ForgotPasswordForm'
import ResetPasswordForm from './components/auth/ResetPasswordForm'
import AuthInitializer from './components/auth/AuthInitializer'

// Import Pages
import AdminDashboard from './pages/AdminDashboard'
import StockManagerDashboard from './pages/StockManagerDashboard'
import EmployeeDashboard from './pages/EmployeeDashboard'
import { RoleBasedDashboard } from './components/auth/RoleBasedDashboard'
import Inventory from './pages/Inventory'
import AddInventoryPage from './pages/AddInventory'
import AddCategory from './pages/AddCategory'
import IssuedItems from './pages/IssuedItems'
import Locations from './pages/Locations'
import Users from './pages/Users'
import Reports from './pages/Reports'
import Requests from './pages/Requests'
import CreateRequestPage from './pages/CreateRequest'
import Notifications from './pages/Notifications'
import IssuedItemsPage from './pages/IssuedItemsPage'
import ReturnRequests from './pages/ReturnRequests'

function App() {
  return (
    <Provider store={store}>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#374151',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            border: '1px solid #E5E7EB',
            borderRadius: '12px',
            padding: '16px',
            maxWidth: '400px',
            fontSize: '14px',
            fontWeight: '500',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
            style: {
              background: '#f0fdf4',
              color: '#166534',
              border: '1px solid #bbf7d0',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
            style: {
              background: '#fef2f2',
              color: '#991b1b',
              border: '1px solid #fecaca',
            },
          },
        }}
      />
      <AuthInitializer>
        <Router>
          <div className="App">
            <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginForm />} />
            <Route path="/register" element={<RegisterForm />} />
            <Route path="/forgot-password" element={<ForgotPasswordForm />} />
            <Route path="/reset-password" element={<ResetPasswordForm />} />
            
            {/* Protected Routes - All wrapped in Layout */}
                {/* Role-specific Dashboard Routes */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <RoleBasedDashboard />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/dashboard"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <AdminDashboard />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/stock-manager/dashboard"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <StockManagerDashboard />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/employee/dashboard"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <EmployeeDashboard />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/employee/issued-items"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <IssuedItemsPage />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
            
            <Route
              path="/inventory"
              element={
                <ProtectedRoute allowedRoles={['admin', 'stock-manager']}>
                  <Layout>
                    <Inventory />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/add-inventory"
              element={
                <ProtectedRoute allowedRoles={['admin', 'stock-manager']}>
                  <Layout>
                    <AddInventoryPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/add-category"
              element={
                <ProtectedRoute allowedRoles={['admin', 'stock-manager']}>
                  <Layout>
                    <AddCategory />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/issued-items"
              element={
                <ProtectedRoute allowedRoles={['admin', 'stock-manager']}>
                  <Layout>
                    <IssuedItems />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/locations"
              element={
                <ProtectedRoute allowedRoles={['admin', 'stock-manager']}>
                  <Layout>
                    <Locations />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/users"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Layout>
                    <Users />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/reports"
              element={
                <ProtectedRoute allowedRoles={['admin', 'stock-manager']}>
                  <Layout>
                    <Reports />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/requests"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Requests />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/return-requests"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ReturnRequests />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/create-request"
              element={
                <ProtectedRoute>
                  <Layout>
                    <CreateRequestPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Notifications />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            {/* Employee-specific request routes */}
            <Route
              path="/requests/pending"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Requests />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/requests/approved"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Requests />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/requests/rejected"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Requests />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
        </Router>
      </AuthInitializer>
    </Provider>
  )
}

export default App