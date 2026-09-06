// Shared admin token storage. Kept separate from LoginScreen so api.ts can
// use it without a circular import (LoginScreen imports apiFetch).
const TOKEN_KEY = 'menu_admin_token';

export function getStoredToken(): string | null {
    try {
        // localStorage shared across tabs — fallback to sessionStorage for migration
        return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY);
    } catch {
        return null;
    }
}

export function setStoredToken(token: string): void {
    try {
        localStorage.setItem(TOKEN_KEY, token);
    } catch {
        // Fallback when storage is disabled (rare)
        sessionStorage.setItem(TOKEN_KEY, token);
    }
}

export function clearStoredToken(): void {
    try {
        localStorage.removeItem(TOKEN_KEY);
    } catch { }
    try {
        sessionStorage.removeItem(TOKEN_KEY);
    } catch { }
}