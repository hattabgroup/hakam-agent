"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

interface User {
    id: number;
    email: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string, recaptchaToken?: string) => Promise<void>;
    signup: (email: string, password: string, recaptchaToken?: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const fetchUser = async () => {
        try {
            const response = await axios.get("/api/auth/me");
            setUser(response.data);
        } catch (error) {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const interceptor = axios.interceptors.response.use(
            (response) => response,
            async (error) => {
                if (error.response?.status === 401) {
                    // Call logout API to clear the cookie
                    try {
                        await axios.post("/api/auth/logout");
                    } catch (logoutError) {
                        console.error("Failed to clear cookie on 401", logoutError);
                    }
                    setUser(null);

                    // Only redirect if we are NOT on a public page
                    const publicPages = ["/", "/login", "/signup", "/verify-email", "/verify-email-instruction", "/forgot-password", "/reset-password"];
                    const currentPath = window.location.pathname;
                    if (!publicPages.includes(currentPath)) {
                        router.push("/login");
                    }
                }
                return Promise.reject(error);
            }
        );

        fetchUser();

        return () => {
            axios.interceptors.response.eject(interceptor);
        };
    }, [router]);

    const login = async (email: string, password: string, recaptchaToken?: string) => {
        try {
            await axios.post("/api/auth/login", { email, password, recaptcha_token: recaptchaToken });
            await fetchUser();
            router.push("/dashboard");
        } catch (error: any) {
            throw new Error(error.response?.data?.detail || "Login failed");
        }
    };

    const signup = async (email: string, password: string, recaptchaToken?: string) => {
        try {
            await axios.post("/api/auth/signup", { email, password, recaptcha_token: recaptchaToken });
            // await login(email, password); // Logic changed: Email verification required
        } catch (error: any) {
            throw new Error(error.response?.data?.detail || "Signup failed");
        }
    };

    const logout = async () => {
        try {
            await axios.post("/api/auth/logout");
            setUser(null);
            router.push("/");
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
