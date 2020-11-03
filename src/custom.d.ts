declare namespace Express {
    export interface Request {
        user: {
            id: string;
            username: string;
            avatar: string;
            discriminator: string;
        } | null;
    }
}
