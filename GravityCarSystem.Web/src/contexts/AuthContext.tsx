import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

export type UserRole = 'SuperAdmin' | 'Admin' | 'Vendedor';

export interface User {
    id: string;
    nome: string;
    email: string;
    empresaId: string;
    role: UserRole;
    cargo: string;
    comissaoPercent: number;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (token: string) => void;
    logout: () => void;
    isAuthenticated: boolean;
    activeRole: UserRole;
    setActiveRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('@GravityCar:token'));
    
    const [activeRole, setActiveRoleState] = useState<UserRole>(() => {
        const saved = localStorage.getItem('@GravityCar:activeRole') as UserRole;
        if (saved && (saved === 'SuperAdmin' || saved === 'Admin' || saved === 'Vendedor')) {
            return saved;
        }
        return 'SuperAdmin'; // Padrão é o Desenvolvedor/Master (Você)
    });

    const getCargoLabel = (role: UserRole) => {
        switch (role) {
            case 'SuperAdmin': return 'Super Administrador (Master)';
            case 'Admin': return 'Dono da Concessionária';
            case 'Vendedor': return 'Consultor de Vendas';
            default: return 'Administrador';
        }
    };

    const setActiveRole = (newRole: UserRole) => {
        localStorage.setItem('@GravityCar:activeRole', newRole);
        setActiveRoleState(newRole);
        setUser(prev => prev ? {
            ...prev,
            role: newRole,
            cargo: getCargoLabel(newRole)
        } : null);
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
                    comissaoPercent: 2.0 // 2% de comissão padrão do vendedor
                });
            } catch (error) {
                console.error("Invalid token:", error);
                logout();
            }
        }
    }, [token, activeRole]);

    const login = (newToken: string) => {
        localStorage.setItem('@GravityCar:token', newToken);
        setToken(newToken);
    };

    const logout = () => {
        localStorage.removeItem('@GravityCar:token');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ 
            user, 
            token, 
            login, 
            logout, 
            isAuthenticated: !!token,
            activeRole,
            setActiveRole
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
