import PostModel from '../models/Post.js';
import UserModel from '../models/User.js';
import mongoose from 'mongoose';
export const getLastTags = async (req, res) => {
    try {
        const posts = await PostModel.find().limit(5).exec();

        const tags = posts
            .map((obj) => obj.tags)
            .flat()
            .slice(0, 5);
        res.json(tags);
    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: 'Не удалось получить теги',
        });
    }
};

export const getAll = async (req, res) => {
    try {
        const posts = await PostModel.find().populate('user').exec();

        res.json(posts);
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: 'Не удалось получить статьи',
        });
    }
};
export const getOne = async (req, res) => {
    try {
        const postId = req.params.id;

        const updatedDoc = await PostModel.findOneAndUpdate(
            { _id: postId },
            { $inc: { viewsCount: 1 } },
            { new: true } // Чтобы получить обновленный документ
        );

        if (!updatedDoc) {
            return res.status(404).json({
                message: 'Статья не найдена',
            });
        }

        res.json(updatedDoc);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Не удалось получить статью',
        });
    }
};

export const getProfilePosts = async (req, res) => {
    const userId = req.params.id;
    try {
        let isValid = mongoose.Types.ObjectId.isValid('5c0a7922c9d89830f4911426');
        if (!isValid) {
            return res.status(404).json({
                message: 'Статья не найдена',
            });
        }
        const posts = await PostModel.find({
            user: userId,
        });

        const user = await UserModel.findById(userId);

        if (!user) {
            return res.status(404).json({
                message: 'Пользователь не найден',
            });
        }

        res.status(200).json({ posts, user });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Не удалось получить статьи',
        });
    }
};

export const remove = async (req, res) => {
    try {
        const postId = req.params.id;

        const deletedDoc = await PostModel.findOneAndDelete({ _id: postId });

        if (!deletedDoc) {
            return res.status(404).json({
                message: 'Статья не найдена',
            });
        }

        res.json({
            success: true,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: 'Не удалось удалить статью',
        });
    }
};
export const update = async (req, res) => {
    try {
        const postId = req.params.id;

        await PostModel.updateOne(
            {
                _id: postId,
            },
            {
                title: req.body.title,
                text: req.body.text,
                imageUrl: req.body.imageUrl,
                user: req.userId,
                tags: req.body.tags,
            }
        );
        res.json({
            success: true,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: 'Не удалось обновить статью',
        });
    }
};

export const create = async (req, res) => {
    try {
        const doc = new PostModel({
            title: req.body.title,
            text: req.body.text,
            imageUrl: req.body.imageUrl,
            tags: req.body.tags,
            user: req.userId,
        });

        const post = await doc.save();
        res.json(post);
    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: 'Не удалось создать статью',
        });
    }
};
