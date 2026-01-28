import { createContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        if (localStorage.getItem('token')) {
            axios.defaults.headers.common['x-auth-token'] = localStorage.getItem('token');
        } else {
            delete axios.defaults.headers.common['x-auth-token'];
            setLoading(false);
            return;
        }

        try {
            const res = await axios.get('http://localhost:5000/api/auth/me');
            setUser(res.data);
            setIsAuthenticated(true);
            return res.data;
        } catch (err) {
            localStorage.removeItem('token');
            setIsAuthenticated(false);
            setUser(null);
        }
        setLoading(false);
    };

    const register = async (formData) => {
        try {
            const res = await axios.post('http://localhost:5000/api/auth/register', formData);
            localStorage.setItem('token', res.data.token);
            await loadUser();
            return { success: true };
        } catch (err) {
            return { success: false, msg: err.response?.data?.msg || 'Registration failed' };
        }
    };

    const login = async (formData) => {
        try {
            const res = await axios.post('http://localhost:5000/api/auth/login', formData);
            localStorage.setItem('token', res.data.token);
            const user = await loadUser();
            return { success: true, user };
        } catch (err) {
            return { success: false, msg: err.response?.data?.msg || 'Login failed' };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        setIsAuthenticated(false);
        delete axios.defaults.headers.common['x-auth-token'];
    };

    return (
        <AuthContext.Provider value={{ user, loading, isAuthenticated, register, login, logout, loadUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
