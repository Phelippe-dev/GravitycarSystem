import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import { API_BASE_URL } from '../api';

export type UserRole = 'SuperAdmin' | 'Admin' | 'Gerente' | 'Vendedor';

// Hierarquia de roles: SuperAdmin > Admin > Gerente > Vendedor
const ROLE_HIERARCHY: Record<UserRole, number> = {
    'SuperAdmin': 4,
    'Admin': 3,
    'Gerente': 2,
    'Vendedor': 1,
};

export interface User {
    id: string;
    nome: string;
    email: string;
    empresaId: string;
    role: UserRole;
    realRole: UserRole; // role real do JWT (não pode ser alterada)
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
    login: (token: string, role?: string) => void;
    logout: () => void;
    isAuthenticated: boolean;
    activeRole: UserRole;
    setActiveRole: (role: UserRole) => void;
    saldo: SaldoCreditos;
    refreshSaldo: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Extrai a role do JWT decodificado */
function extractRoleFromJwt(decoded: any): UserRole {
    // O claim de Role pode vir em diferentes formatos
    const roleClaim =
        decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ||
        decoded['role'] ||
        decoded['Role'];

    // Pode ser array (múltiplas roles) ou string
    const roleValue = Array.isArray(roleClaim) ? roleClaim[0] : roleClaim;

    if (roleValue && ['SuperAdmin', 'Admin', 'Gerente', 'Vendedor'].includes(roleValue)) {
        return roleValue as UserRole;
    }
    return 'Admin'; // fallback para usuários antigos sem role no JWT
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('@GravityCar:token'));
    const [saldo, setSaldo] = useState<SaldoCreditos>({ saldoConsultas: 0, consultasRealizadas: 0 });

    const [activeRole, setActiveRoleState] = useState<UserRole>(() => {
        const saved = localStorage.getItem('@GravityCar:activeRole') as UserRole;
        if (saved && ['SuperAdmin', 'Admin', 'Gerente', 'Vendedor'].includes(saved)) {
            return saved;
        }
        return 'Admin'; // default mais seguro
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
        // Só permite trocar para roles iguais ou inferiores à role real
        const realRole = user?.realRole || 'Vendedor';
        if (ROLE_HIERARCHY[newRole] > ROLE_HIERARCHY[realRole]) {
            return; // não pode escalar privilégio
        }
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

    const login = (newToken: string, role?: string) => {
        localStorage.setItem('@GravityCar:token', newToken);
        // Limpar activeRole salvo para usar a role real do novo login
        localStorage.removeItem('@GravityCar:activeRole');
        setToken(newToken);

        // Se a role veio da response do login, usar ela como activeRole inicial
        if (role && ['SuperAdmin', 'Admin', 'Gerente', 'Vendedor'].includes(role)) {
            setActiveRoleState(role as UserRole);
            localStorage.setItem('@GravityCar:activeRole', role);
        }
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
                const userEmail = decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] || decoded.email || '';
                const userName = decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || decoded.unique_name || 'Usuário';
                const empresaId = decoded['EmpresaId'] || '00000000-0000-0000-0000-000000000001';

                // Extrair a role REAL do JWT
                const jwtRole = extractRoleFromJwt(decoded);

                // Se não tem activeRole salvo, usar a role do JWT
                const savedRole = localStorage.getItem('@GravityCar:activeRole') as UserRole;
                let effectiveRole = jwtRole;
                if (savedRole && ['SuperAdmin', 'Admin', 'Gerente', 'Vendedor'].includes(savedRole)) {
                    // Só aceita a role salva se for menor ou igual à role real
                    if (ROLE_HIERARCHY[savedRole] <= ROLE_HIERARCHY[jwtRole]) {
                        effectiveRole = savedRole;
                    }
                }
                setActiveRoleState(effectiveRole);

                setUser({
                    id: userId,
                    nome: userName,
                    email: userEmail,
                    empresaId: empresaId,
                    role: effectiveRole,
                    realRole: jwtRole,
                    cargo: getCargoLabel(effectiveRole),
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
