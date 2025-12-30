import dotenv from 'dotenv';
dotenv.config();

import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import Usuario from '../models/Usuario.js'; // Ajusta o caminho

import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcryptjs';

passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.CALLBACK_URL,
        proxy: true
    },
    async (accessToken, refreshToken, profile, done) => {
        try {
        // Tenta encontrar o utilizador pelo e-mail ou googleId
        let user = await Usuario.findOne({ email: profile.emails[0].value });

        if (!user) {
            // Se não existir, cria um novo
            user = await Usuario.create({
            nome: profile.displayName,
            email: profile.emails[0].value,
            googleId: profile.id,
            avatar: profile.photos[0].value,
            role: 'user' // Por padrão é utilizador comum
            });
        }
        return done(null, user);
        } catch (err) {
        return done(err, null);
        }
    }
));

passport.use(new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
    try {
        const user = await Usuario.findOne({ email });
        if (!user) return done(null, false, { message: 'E-mail não encontrado.' });
        if (!user.password) return done(null, false, { message: 'Use o login social para esta conta.' });

        const eValida = await bcrypt.compare(password, user.password);
        if (!eValida) return done(null, false, { message: 'Senha incorreta.' });

        return done(null, user);
    } catch (err) {
        return done(err);
    }
}));

// Necessário para manter a sessão
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  const user = await Usuario.findById(id);
  done(null, user);
});