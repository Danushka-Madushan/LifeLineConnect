import { createContext, useContext } from 'react';

interface UserPrincipal {
  userId: number;
  username: string;
  role: string;
  status: string;
}

interface AuthContextType {
  token: string | null;
  user: UserPrincipal | null;
  login: (token: string, user: UserPrincipal) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
