import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import UserModel from '../models/User.js';
import axios from 'axios';

export const login = async (req, res) => {
    try {
        const user = await UserModel.findOne({ email: req.body.email });
        if (!user) {
            return req.status(404).json({
                message: 'Пользователь не найден',
            });
        }
        const isValidPassword = await bcrypt.compare(
            req.body.password,
            user._doc.passwordHash
        );
        if (!isValidPassword) {
            return res.status(400).json({
                message: 'Неверный логин или пароль',
            });
        }

        const token = jwt.sign({ _id: user._id }, 'secret123', { expiresIn: '30d' });
        const { passwordHash, ...userData } = user._doc;
        res.json({ ...userData, token });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: 'Не удалось авторизоваться',
        });
    }
};

export const register = async (req, res) => {
    try {
        const password = req.body.password;
        const salt = await bcrypt.genSaltSync(10);
        const hash = await bcrypt.hash(password, salt);

        const doc = new UserModel({
            email: req.body.email,
            fullName: req.body.fullName,
            passwordHash: hash,
            avatarUrl: req.body.avatarUrl,
        });

        const user = await doc.save();

        const token = jwt.sign({ _id: user._id }, 'secret123', { expiresIn: '30d' });

        const { passwordHash, ...userData } = user._doc;

        let botText = `Пользователь ${userData.fullName} зарегистрирован`;

        if (userData.avatarUrl) {
            botText = botText + `\n ${userData.avatarUrl}`;
        }
        await axios.post(
            `https://api.telegram.org/bot${process.env.TG_TOKEN}/sendMessage`,
            {
                chat_id: 1091130393,
                text: botText,
            }
        );

        res.json({ ...userData, token });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: 'Не удалось зарегистрироваться',
        });
    }
};

export const getMe = async (req, res) => {
    try {
        const user = await UserModel.findById(req.userId);

        if (!user) {
            res.status(404).json({
                message: 'Пользователь не найден',
            });
        }

        const { passwordHash, ...userData } = user._doc;

        res.status(200).json({
            userData,
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: 'Нет доступа',
        });
    }
};

export const update = async (req, res) => {
    try {
        const userId = req.params.id;

        if (!userId) {
            return res.status(404).json({
                message: 'Пользователь не найден',
            });
        }

        const userVerifyId = req.body._id;

        if (userId !== userVerifyId) {
            return res.status(404).json({
                message: 'я тут подумал... а не пойти бы тебе по стрелке Пирса',
            });
        }

        const updateData = {
            email: req.body.email,
            fullName: req.body.fullName,
            avatarUrl: req.body.avatarUrl,
        };

        if (req.body.password) {
            const password = req.body.password;
            const salt = await bcrypt.genSaltSync(10);
            const hash = await bcrypt.hash(password, salt);
            updateData.passwordHash = hash;
        }

        await UserModel.updateOne({ _id: userId }, updateData);
        res.json({
            success: true,
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: 'Не удалось обновить профиль',
        });
    }
};
