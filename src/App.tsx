import { AppRoutes } from './routes'
import { AuthProvider } from './authentication/AuthContext'
import { LanguageProvider } from './pageText'

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </LanguageProvider>
  )
}

export default App
