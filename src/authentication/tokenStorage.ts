const authTokenKey = "contentList.authToken";

export function saveToken(token: string) {
  localStorage.setItem(authTokenKey, token);
}

export function getToken() {
  return localStorage.getItem(authTokenKey);
}

export function removeToken() {
  localStorage.removeItem(authTokenKey);
}

export function getAuthorizationHeader(token = getToken()): Record<string, string> {
  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}
