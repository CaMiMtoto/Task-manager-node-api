const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const authRoutes = require('../routes/authRoutes');
const User = require('../models/user');

const app = express();
app.use(express.json());
app.use(authRoutes);

let mongoServer;

beforeAll(async () => {
    mongoServer = new MongoMemoryServer();
    const mongoUri =  mongoServer.getUri();
    await mongoose.connect(mongoUri);
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

describe('POST /register', () => {
    it('registers a new user successfully', async () => {
        const res = await request(app)
            .post('/register')
            .send({
                username: 'testuser',
                password: 'testpassword'
            });

        expect(res.statusCode).toEqual(201);
        expect(res.body.user.username).toEqual('testuser');
    });

    it('fails to register a user with existing username', async () => {
        await new User({ username: 'testuser', password: 'testpassword' }).save();

        const res = await request(app)
            .post('/register')
            .send({
                username: 'testuser',
                password: 'testpassword'
            });

        expect(res.statusCode).toEqual(400);
    });
});

describe('POST /login', () => {
    it('logs in an existing user successfully', async () => {
        const user = new User({ username: 'testuser', password: 'testpassword' });
        await user.save();

        const res = await request(app)
            .post('/login')
            .send({
                username: 'testuser',
                password: 'testpassword'
            });

        expect(res.statusCode).toEqual(200);
        expect(res.body.user.username).toEqual('testuser');
    });

    it('fails to log in with incorrect username', async () => {
        const res = await request(app)
            .post('/login')
            .send({
                username: 'wronguser',
                password: 'testpassword'
            });

        expect(res.statusCode).toEqual(401);
    });

    it('fails to log in with incorrect password', async () => {
        const res = await request(app)
            .post('/login')
            .send({
                username: 'testuser',
                password: 'wrongpassword'
            });

        expect(res.statusCode).toEqual(401);
    });
});