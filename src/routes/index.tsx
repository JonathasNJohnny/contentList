import { useEffect, useState } from "react";
import { AuthenticationPage, useAuth } from "../authentication";
import { VerifyEmailPage } from "../authentication/VerifyEmailPage";
import { MainPage } from "../main/MainPage";
import { ProfilePage, PublicProfilePage } from "../profile";
import { PrivateRoute } from "./PrivateRoute";
import { appRoutes } from "./paths";
import type { ContentCategory } from "../content/contentApi";

function getCurrentPath() {
  const path = window.location.pathname || appRoutes.main;

  if (path === appRoutes.authentication) {
    return appRoutes.login;
  }

  return path;
}

export function AppRoutes() {
  const { isAuthenticated } = useAuth();
  const [currentPath, setCurrentPath] = useState(getCurrentPath);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [mainCategory, setMainCategory] = useState<ContentCategory>("Animes");

  function navigate(path: string) {
    window.history.pushState({}, "", path);
    setCurrentPath(path);
  }

  function navigateToMain(category?: ContentCategory) {
    if (category) {
      setMainCategory(category);
    }

    navigate(appRoutes.main);
  }

  function handleProfileClick() {
    navigate(isAuthenticated ? appRoutes.profile : appRoutes.login);
  }

  useEffect(() => {
    function handlePopState() {
      setCurrentPath(getCurrentPath());
    }

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [currentPath]);

  if (
    currentPath === appRoutes.login ||
    currentPath === appRoutes.authentication
  ) {
    return (
      <AuthenticationPage
        onGuestMode={() => navigate(appRoutes.main)}
        onAuthenticated={() => navigate(appRoutes.main)}
        onVerifyEmailRequested={(email) => {
          setVerificationEmail(email);
          navigate(appRoutes.verifyEmail);
        }}
      />
    );
  }

  if (currentPath === appRoutes.verifyEmail) {
    return (
      <VerifyEmailPage
        initialEmail={verificationEmail}
        onBackToLogin={() => navigate(appRoutes.login)}
        onVerified={() => navigate(appRoutes.login)}
      />
    );
  }

  if (currentPath === appRoutes.profile) {
    return (
      <PrivateRoute onBlocked={() => navigate(appRoutes.login)}>
        <ProfilePage
          onCategoryClick={navigateToMain}
          onProfileClick={handleProfileClick}
          onPublicProfileClick={(name) =>
            navigate(`/profile/${encodeURIComponent(name)}`)
          }
          onLogout={() => navigate(appRoutes.login)}
        />
      </PrivateRoute>
    );
  }

  if (/^\/profile\/[^/]+\/?$/.test(currentPath)) {
    return (
      <PublicProfilePage
        onBackToMain={() => navigate(appRoutes.profile)}
        onCategoryClick={navigateToMain}
        onPublicProfileClick={(name) =>
          navigate(`/profile/${encodeURIComponent(name)}`)
        }
        onProfileClick={handleProfileClick}
      />
    );
  }

  return (
    <MainPage
      onProfileClick={handleProfileClick}
      initialCategory={mainCategory}
    />
  );
}
