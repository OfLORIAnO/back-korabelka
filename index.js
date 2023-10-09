import express from 'express';
import multer from 'multer';
import mongoose from 'mongoose';
import cors from 'cors';
import axios from 'axios';

import dotenv from 'dotenv';
dotenv.config();

import {
    registerValidation,
    loginValidation,
    postCreateValidation,
} from './validations.js';

import { checkAuth, handleValitaionErrors } from './utils/index.js';

import { UserController, PostController } from './controllers/index.js';

mongoose
    .connect(process.env.MONGO_URL)
    .then(() => {
        console.log('DB ok');
    })
    .catch((err) => {
        console.log('db err', err);
    });

const app = express();

const storage = multer.diskStorage({
    destination: (_, __, cb) => {
        cb(null, 'uploads');
    },
    filename: (_, file, cb) => {
        cb(null, file.originalname);
    },
});

const upload = multer({ storage });

app.use(express.json());

app.use(cors());

app.use('/uploads', express.static('uploads'));

app.post('/upload', checkAuth, upload.single('image'), (req, res) => {
    try {
        res.json({
            url: `/uploads/${req.file.originalname}`,
        });
    } catch (err) {
        console.log(err);
    }
});

app.post('/auth/login', loginValidation, handleValitaionErrors, UserController.login);
app.post(
    '/auth/register',
    registerValidation,
    handleValitaionErrors,
    UserController.register
);
app.get('/auth/me', checkAuth, UserController.getMe);

app.get('/tags', checkAuth, PostController.getLastTags);
app.get('/posts', PostController.getAll);
app.get('/post/:id', PostController.getOne);
app.post(
    '/posts',
    checkAuth,
    postCreateValidation,
    handleValitaionErrors,
    PostController.create
);
app.delete('/posts/:id', checkAuth, PostController.remove);
app.patch(
    '/posts/:id',
    checkAuth,
    postCreateValidation,
    handleValitaionErrors,
    PostController.update
);

app.get('/profile/:id', handleValitaionErrors, PostController.getProfilePosts);

app.listen(process.env.PORT, (err) => {
    if (err) {
        return console.log(err);
    }
    
    console.log(`Server is listening on port ${process.env.PORT}`);
    notifyTelegram()
});


async function notifyTelegram() {
    try {
        axios.post(`https://api.telegram.org/bot${process.env.TG_TOKEN}/sendMessage`, {
        chat_id: 1091130393,
        text: 'Видимо, мы упали, но не переживай, мы поднимаемся 😎😎😎',
    });
    } catch (error) {
        console.log('Ошибка оповещения')
    }
    
}