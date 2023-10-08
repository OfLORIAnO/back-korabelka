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
        console.log('Мы до сюда дошли');
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
            `https://api.telegram.org/bot5122547076:AAGcKu2C14utsEhjC5Sv76kosjyY8gtv49Y/sendMessage`,
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
