// interfaces pour l'authentification

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    nom: string;
    prenom: string;
    email: string;
    password: string;
}

export interface TokenResponse {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
}

export interface User {
    id: number;
    nom: string;
    prenom: string;
    email: string;
    roles: string[];
}
