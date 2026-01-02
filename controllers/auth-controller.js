import passport from 'passport';

/**
 * @description Callback após a autenticação do Google. Redireciona para o frontend.
 */
export const googleCallback = (req, res) => {
    // Se a autenticação for bem-sucedida, o Passport adiciona o usuário à requisição (req.user)
    // e a sessão é estabelecida. Apenas redirecionamos.
    res.redirect(process.env.FRONTEND_URL || 'http://localhost:3000'); 
};

/**
 * @description Verifica e retorna o status de autenticação e os dados do usuário.
 */
export const getUsuarioStatus = (req, res) => {
    if (req.user) {
        res.json(req.user);
    } else {
        res.status(401).json({ message: 'Não autenticado' });
    }
};

/**
 * @description Realiza o logout do usuário.
 */
export const logout = (req, res, next) => {
    const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
    req.logout((err) => {
        if (err) {
            return next(err); // Passa o erro para o error handler global
        }
        req.session.destroy(() => {
            res.clearCookie('connect.sid'); 
            res.redirect(`${FRONTEND_URL}/?logout=success`);
        });
    });
};

/**
 * @description Realiza o login manual com usuário e senha.
 */
export const loginManual = (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            return next(err); // Passa o erro para o error handler global
        }
        if (!user) {
            return res.status(401).json({ message: info.message || "Credenciais inválidas" });
        }
        req.logIn(user, (err) => {
            if (err) {
                return next(err); // Passa o erro para o error handler global
            }
            return res.json(user);
        });
    })(req, res, next);
};
