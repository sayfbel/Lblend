import axios from 'axios';

const API_URL = 'http://localhost:5000/api/';

const register = (username, email, password, role) => {
    return axios.post(API_URL + 'register', {
        username,
        email,
        password,
        role
    });
};

const login = (email, password) => {
    return axios.post(API_URL + 'login', {
        email,
        password
    }).then((response) => {
        if (response.data.accessToken) {
            localStorage.setItem('user', JSON.stringify(response.data));
        }
        return response.data;
    });
};

const logout = () => {
    localStorage.clear();
    sessionStorage.clear();
};

const getCurrentUser = () => {
    return JSON.parse(localStorage.getItem('user'));
};

const AuthService = {
    register,
    login,
    logout,
    getCurrentUser
};

export default AuthService;
