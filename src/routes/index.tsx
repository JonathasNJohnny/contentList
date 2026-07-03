import { useEffect, useState } from 'react'
import { AuthenticationPage, useAuth } from '../authentication'
import { VerifyEmailPage } from '../authentication/VerifyEmailPage'
import { MainPage } from '../main/MainPage'
import { ProfilePage, PublicProfilePage } from '../profile'
import { PrivateRoute } from './PrivateRoute'
import { appRoutes } from './paths'

function getCurrentPath() {
  const path = window.location.pathname || appRoutes.main

  if (path === appRoutes.authentication) {
    return appRoutes.login
  }

  return path
}

export function AppRoutes() {
  const { isAuthenticated } = useAuth()
  const [currentPath, setCurrentPath] = useState(getCurrentPath)
  const [verificationEmail, setVerificationEmail] = useState("")

  function navigate(path: string) {
    window.history.pushState({}, "", path)
    setCurrentPath(path)
  }

  function handleProfileClick() {
    navigate(isAuthenticated ? appRoutes.profile : appRoutes.login)
  }

  useEffect(() => {
    function handlePopState() {
      setCurrentPath(getCurrentPath())
    }

    window.addEventListener("popstate", handlePopState)

    return () => {
      window.removeEventListener("popstate", handlePopState)
    }
  }, [currentPath])

  if (currentPath === appRoutes.login || currentPath === appRoutes.authentication) {
    return (
      <AuthenticationPage
        onGuestMode={() => navigate(appRoutes.main)}
        onAuthenticated={() => navigate(appRoutes.main)}
        onVerifyEmailRequested={(email) => {
          setVerificationEmail(email)
          navigate(appRoutes.verifyEmail)
        }}
      />
    )
  }

  if (currentPath === appRoutes.verifyEmail) {
    return (
      <VerifyEmailPage
        initialEmail={verificationEmail}
        onBackToLogin={() => navigate(appRoutes.login)}
        onVerified={() => navigate(appRoutes.login)}
      />
    )
  }

  if (currentPath === appRoutes.profile) {
    return (
      <PrivateRoute onBlocked={() => navigate(appRoutes.login)}>
        <ProfilePage
          onCategoryClick={() => navigate(appRoutes.main)}
          onProfileClick={handleProfileClick}
          onPublicProfileClick={(name) =>
            navigate(`/profile/${encodeURIComponent(name)}`)
          }
          onLogout={() => navigate(appRoutes.login)}
        />
      </PrivateRoute>
    )
  }

  if (/^\/profile\/[^/]+\/?$/.test(currentPath)) {
    return (
      <PublicProfilePage
        onBackToMain={() => navigate(appRoutes.main)}
        onCategoryClick={() => navigate(appRoutes.main)}
        onPublicProfileClick={(name) =>
          navigate(`/profile/${encodeURIComponent(name)}`)
        }
        onProfileClick={handleProfileClick}
      />
    )
  }

  return <MainPage onProfileClick={handleProfileClick} />
}
