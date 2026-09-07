import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import { API_BASE_URL } from '../api';

export type UserRole = 'SuperAdmin' | 'Admin' | 'Gerente' | 'Vendedor';

export interface User {
    id: string;
    nome: string;
    email: string;
    empresaId: string;
    role: UserRole;
    cargo: string;
    comissaoPercent: number;
}

export interface SaldoCreditos {
    saldoConsultas: number;
    consultasRealizadas: number;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (token: string) => void;
    logout: () => void;
    isAuthenticated: boolean;
    activeRole: UserRole;
    setActiveRole: (role: UserRole) => void;
    saldo: SaldoCreditos;
    refreshSaldo: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('@GravityCar:token'));
    const [saldo, setSaldo] = useState<SaldoCreditos>({ saldoConsultas: 0, consultasRealizadas: 0 });

    const [activeRole, setActiveRoleState] = useState<UserRole>(() => {
        const saved = localStorage.getItem('@GravityCar:activeRole') as UserRole;
        if (saved && ['SuperAdmin', 'Admin', 'Gerente', 'Vendedor'].includes(saved)) {
            return saved;
        }
        return 'SuperAdmin';
    });

    const getCargoLabel = (role: UserRole) => {
        switch (role) {
            case 'SuperAdmin': return 'Super Administrador (Master)';
            case 'Admin':      return 'Dono da Concessionária';
            case 'Gerente':    return 'Gerente';
            case 'Vendedor':   return 'Consultor de Vendas';
            default:           return 'Usuário';
        }
    };

    const setActiveRole = (newRole: UserRole) => {
        localStorage.setItem('@GravityCar:activeRole', newRole);
        setActiveRoleState(newRole);
        setUser(prev => prev ? { ...prev, role: newRole, cargo: getCargoLabel(newRole) } : null);
    };

    const refreshSaldo = useCallback(async () => {
        const tk = localStorage.getItem('@GravityCar:token');
        if (!tk) return;
        try {
            const res = await fetch(`${API_BASE_URL}/empresa/saldo`, {
                headers: { 'Authorization': `Bearer ${tk}`, 'Content-Type': 'application/json' }
            });
            if (res.ok) {
                const data = await res.json();
                setSaldo({ saldoConsultas: data.saldoConsultas ?? 0, consultasRealizadas: data.consultasRealizadas ?? 0 });
            }
        } catch { /* sem saldo no dev */ }
    }, []);

    const login = (newToken: string) => {
        localStorage.setItem('@GravityCar:token', newToken);
        setToken(newToken);
    };

    const logout = () => {
        localStorage.removeItem('@GravityCar:token');
        localStorage.removeItem('@GravityCar:activeRole');
        setToken(null);
        setUser(null);
        setSaldo({ saldoConsultas: 0, consultasRealizadas: 0 });
    };

    useEffect(() => {
        if (token) {
            try {
                const decoded: any = jwtDecode(token);
                const userId = decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || decoded.nameid || '11111111-1111-1111-1111-111111111111';
                const userEmail = decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] || decoded.email || 'phelippesilvadev@gmail.com';
                const userName = decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || decoded.unique_name || 'Phelippe Silva';
                const empresaId = decoded['EmpresaId'] || '00000000-0000-0000-0000-000000000001';

                setUser({
                    id: userId,
                    nome: userName,
                    email: userEmail,
                    empresaId: empresaId,
                    role: activeRole,
                    cargo: getCargoLabel(activeRole),
                    comissaoPercent: 2.0
                });

                // Buscar saldo ao fazer login
                refreshSaldo();
            } catch (error) {
                console.error("Invalid token:", error);
                logout();
            }
        }
    }, [token]);

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token, activeRole, setActiveRole, saldo, refreshSaldo }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};
