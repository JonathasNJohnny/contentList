import { useState } from 'react'
import { AuthenticationPage } from '../authentication'
import { MainPage } from '../main/MainPage'

type CurrentPage = 'authentication' | 'main'

export function AppRoutes() {
  const [currentPage, setCurrentPage] = useState<CurrentPage>('authentication')

  if (currentPage === 'main') {
    return <MainPage />
  }

  return <AuthenticationPage onGuestMode={() => setCurrentPage('main')} />
}
