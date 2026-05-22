export interface CurrentUser {
  id: string;
  name: string;
  avatarUrl?: string;
}

export interface UserStore {
  user: CurrentUser | null;
  accessToken: string | null;
  setUser: (user: CurrentUser | null) => void;
  setAccessToken: (token: string | null) => void;
  logout: () => void;
}
