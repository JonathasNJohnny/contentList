import { AppRoutes } from './routes'
import { AuthProvider } from './authentication/AuthContext'

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

export default App
