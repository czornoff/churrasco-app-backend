export const eAdmin = (req, res, next) => {
    if (req.isAuthenticated() && req.user.role === 'admin') {
        return next();
    }
    return res.status(403).json({ 
        message: "Acesso negado: você precisa ser um administrador." 
    });
};

export const eUser = (req, res, next) => {
    if (req.isAuthenticated() && req.user.role === 'user') {
        return next();
    }
    return res.status(403).json({ 
        message: "Acesso básico de acesso." 
    });
};