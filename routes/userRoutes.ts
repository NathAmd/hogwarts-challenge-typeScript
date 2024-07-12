// 400 : Requête mal formée.
// 401 : Authentification requise.
// 403 : Autorisation refusée.
// 404 : Ressource non trouvée.
// 500 : Erreur serveur.

import bcrypt from "bcrypt";
import ExpressBrute from "express-brute";
import { Request, Response, NextFunction } from "express"; // Import types for Request and Response

module.exports = function (app: any, mongoose: any) {
    
    // --------------------------------------------------- user
    const UserSchema = new mongoose.Schema({
        name: String,
        email: String,
        password: String,
        house: String,
        admin: Boolean
    });
    const User = mongoose.model('User', UserSchema);
    //---------------------------------------------------- lobby
    const LobbySchema = new mongoose.Schema({
        name: String,
        to: String,
        message: String,
        house:String
    });
    const Lobby = mongoose.model('Lobby', LobbySchema);

    //const bcrypt = require('bcrypt');
    const saltRounds = 10;

    //const ExpressBrute = require('express-brute');
    const store = new ExpressBrute.MemoryStore(); // (pour du dev par pour publication)
    const bruteforce = new ExpressBrute(store);

    app.post("/api/register", async(req:Request, res:Response) => {
        try {
            const email: string = req.body.email;
            const username: string = req.body.username;
            const password: string = req.body.password;

            const existingUser = await User.findOne({ $or: [{ email: email }, { name: username }] });
            if (existingUser) {
                return res.status(400).send('Email or username already taken');
            }

            const hashedPassword: string = await bcrypt.hash(password, saltRounds);

            const admin: boolean = false;
            const house: string = (["Gryffindor", "Hufflepuff", "Ravenclaw", "Slytherin"])[Math.floor(Math.random() * 3.99)];

            const newUser = new User({
                name: username,
                email: email,
                password: hashedPassword,
                house: house,
                admin: admin
            });

            await newUser.save();

            console.log("added " + email + " to DB");
            res.sendStatus(200);
        } catch (err) {
            console.error(err);
            res.status(500).send();
        }
    });

    app.post("/api/login", bruteforce.prevent, async (req:Request, res:Response) => {
        let email:String = req.body.email;
        let password:String = req.body.password;

        try {
            const user = await User.findOne({ email: email });

            if (!user) {
                return res.status(404).send();
            }

            const match: boolean = await bcrypt.compare(String(password), user.password);

            if (!match) {
                return res.status(401).send();
            }

            (req.session as any).user = user;
            return res.status(200).send(user);
        } catch (err) {
            console.log(err);
            return res.status(500).send();
        }
    });


    function Authenticated(req:Request, res:Response, next: NextFunction) {
        if ((req.session as any).user) {
            return next();
        }
        res.status(401).send('Veuillez vous connecter pour accéder à cette ressource');
    }

    app.get('/api/logout', Authenticated, (req: Request, res: Response) => {
        (req.session as any).user = null;
        res.status(200).send();
    });


    app.get('/api/lobby', Authenticated, async (req: Request, res: Response) => {
        try {
            let messages;
            if ((req.session as any).user.admin) {
                messages = await Lobby.find({});
            } else {
                messages = await Lobby.find({
                    $or: [
                        { house: (req.session as any).user.house },
                        { to: (req.session as any).user.name }
                    ]
                });
            }
            res.status(200).send(messages);
        } catch (err) {
            console.error(err);
            res.status(500).send();
        }
    });

    app.post('/api/lobby', Authenticated, (req: Request, res: Response) => {
        let to = req.body.to
        let message = req.body.message

        const newMessage = new Lobby({
            name: (req.session as any).user.name,
            to: to,
            message: message,
            house: (req.session as any).user.house
        });

        newMessage.save()
            .then(() => { console.log('Message send successfully') })
            .catch((err: any) => console.log(err));
        
        res.status(200).send()
    });


    app.get('/api/lobby/:id', Authenticated, async (req: Request, res: Response) => {
        try {
            const messageId = req.params.id;
            const message = await Lobby.findById(messageId);

            if (!message) {
                return res.status(404).send('Message not found');
            }

            res.status(200).send(message);
        } catch (err) {
            console.error(err);
            res.status(500).send();
        }
    });

    app.get('/api/user', Authenticated, async (req: Request, res: Response) => {
        try {
            let users;
            if ((req.session as any).user.admin) {
                users = await User.find({});
            } else {
                users = await User.find({ house: (req.session as any).user.house });
            }

            res.status(200).send(users);
        } catch (err) {
            console.error(err);
            res.status(500).send();
        }
    });

    app.get('/api/users/:id', Authenticated, async (req: Request, res: Response) => {
        try {
            const user = await User.findById(req.params.id);
            if (!user) {
                return res.status(404).send('User not found');
            }
            if (!(req.session as any).user.admin && (req.session as any).user.house !== user.house) {
                return res.status(403).send('Cannot get details from users in a different house');
            }
            res.status(200).send(user);
        } catch (err) {
            console.error(err);
            res.status(500).send();
        }
    });

    app.post('/api/users/:id/promote', Authenticated, async (req: Request, res: Response) => {
        try {
            const user = await User.findByIdAndUpdate(req.params.id, { admin: true }, { new: true });
            if (!user) {
                return res.status(404).send('User not found');
            }
            res.status(200).send(user);
        } catch (err) {
            console.error(err);
            res.status(500).send();
        }
    });

    app.post('/api/users/:id/demote', Authenticated, async (req: Request, res: Response) => {
        try {
            if (req.params.id === (req.session as any).user._id) {
                return res.status(400).send('Cannot demote self');
            }
            const user = await User.findByIdAndUpdate(req.params.id, { admin: false }, { new: true });
            if (!user) {
                return res.status(404).send('User not found');
            }
            res.status(200).send(user);
        } catch (err) {
            console.error(err);
            res.status(500).send();
        }
    });

    app.patch('/api/lobby/:id', Authenticated, async (req: Request, res: Response) => {
        try {
            const message = await Lobby.findById(req.params.id);
            if (!message) {
                return res.status(404).send('Message not found');
            }
            if (!(req.session as any).user.admin && (req.session as any).user.name !== message.name) {
                return res.status(403).send('Cannot edit other users\' messages');
            }
            message.message = req.body.message;
            await message.save();
            res.status(200).send(message);
        } catch (err) {
            console.error(err);
            res.status(500).send();
        }
    });

    app.delete('/api/lobby/:id', Authenticated, async (req: Request, res: Response) => {
        try {
            const message = await Lobby.findById(req.params.id);
            if (!message) {
                return res.status(404).send('Message not found');
            }
            if (!(req.session as any).user.admin && (req.session as any).user._id !== message.user) {
                return res.status(403).send('Cannot delete other users\' messages');
            }
            await message.remove();
            res.status(200).send('Message deleted');
        } catch (err) {
            console.error(err);
            res.status(500).send();
        }
    });
}