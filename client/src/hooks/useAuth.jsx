/**
 * Authentification localStorage — démo sans serveur
 * Fonctionne offline, suffit pour pitcher / tester avec de vrais restos
 */

import { createContext, useContext, useState } from 'react';

const USERS_KEY   = 'restopilot_users';
const SESSION_KEY = 'restopilot_session';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const s = localStorage.getItem(SESSION_KEY);
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  });

  /** Renvoie true si l'utilisateur a terminé l'onboarding */
  function hasOnboarded(userId) {
    return localStorage.getItem(`restopilot_onboarded_${userId}`) === 'true';
  }

  function markOnboarded(userId) {
    localStorage.setItem(`restopilot_onboarded_${userId}`, 'true');
  }

  function register(email, password, name) {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('Cet email est déjà utilisé.');
    }
    const newUser = {
      id: Date.now().toString(),
      email: email.toLowerCase().trim(),
      password,
      name: name.trim(),
      createdAt: new Date().toISOString(),
    };
    users.push(newUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));

    const session = { id: newUser.id, email: newUser.email, name: newUser.name };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    setUser(session);
    return session;
  }

  function login(email, password) {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const found = users.find(
      u => u.email.toLowerCase() === email.toLowerCase().trim() && u.password === password
    );
    if (!found) throw new Error('Email ou mot de passe incorrect.');

    const session = { id: found.id, email: found.email, name: found.name };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    setUser(session);
    return session;
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, hasOnboarded, markOnboarded }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
