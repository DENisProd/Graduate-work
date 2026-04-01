export interface CurrentUser {
  id: string;
  name: string;
  avatarUrl?: string;
}

export interface UserStore {
  user: CurrentUser | null;
  setUser: (user: CurrentUser | null) => void;
  logout: () => void;
}
