import bcrypt from "bcryptjs";
import express from "express";
import { StatusCodes } from "http-status-codes";
import nodemailer, { Transporter } from "nodemailer";
import { SentMessageInfo, Options } from "nodemailer/lib/smtp-transport";
import passport from "passport";
import { Server } from "socket.io";

import User from "../db/models/User";
import { authenticatedRoute } from "./util";

function sendVerificationEmail(
  transporter: Transporter<SentMessageInfo, Options>,
  username: string,
  email: string,
  verificationToken: string
) {
  const mailOptions = {
    from: "WonkGabe",
    to: email,
    subject: `Welcome to WonkGabe, ${username}`,
    html: `<p>Click <a href="${process.env.HOSTNAME}/auth/verify?token=${verificationToken}">here</a> to verify your email.`,
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.error(err);
    } else {
      console.log(`Email sent to ${email}: ${info.response}`);
    }
  });
}

export function createAuthRouter(io: Server) {
  const router = express.Router();
  const emailTransporter = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.GMAIL_EMAIL,
      pass: process.env.GMAIL_PASS,
    },
  });
  router.get("/current", authenticatedRoute, (req, res) => {
    res
      .status(StatusCodes.ACCEPTED)
      .json({ uuid: req.user?.uuid, username: req.user?.username });
  });

  router.post("/register", async (req, res) => {
    const { username, email, password } = req.body;
    const existingUser = await User.query().findOne({ email, username });
    if (existingUser) {
      let match = username === existingUser.username ? "username" : "email";
      res
        .status(StatusCodes.BAD_REQUEST)
        .send(`A user with this ${match} exists`);
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      const newUser = await User.query()
        .insert({
          email,
          password: hashedPassword,
          username,
        })
        .returning("*");
      sendVerificationEmail(
        emailTransporter,
        username,
        email,
        newUser.verificationToken
      );
    } catch (err) {
      console.error(err);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR);
      return;
    }

    res
      .status(StatusCodes.CREATED)
      .json({ message: "Registration successful, please check your email." });
  });

  router.get("/verify", async (req, res) => {
    const user = await User.query().findOne({
      verificationToken: req.query.token,
    });
    if (user && !user.verified) {
      try {
        await User.query().findById(user.id).update({ verified: true });
      } catch (err) {
        console.error(err);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR);
        return;
      }
      return res.status(StatusCodes.PERMANENT_REDIRECT).redirect("/");
    }
    res.status(StatusCodes.NOT_FOUND).send("Not found.");
  });

  router.post("/login", (req, res, next) => {
    passport.authenticate(
      "local",
      (err: any, user: Express.User, info: { message: any }) => {
        if (err) {
          return res.status(StatusCodes.INTERNAL_SERVER_ERROR);
        }
        if (!user) {
          return res
            .status(StatusCodes.UNAUTHORIZED)
            .json({ success: false, message: info.message });
        }

        req.login(user, (err) => {
          if (err) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR);
          }
          return res
            .status(StatusCodes.ACCEPTED)
            .json({ uuid: req.user?.uuid, username: req.user?.username });
        });
      }
    )(req, res, next);
  });

  router.get("/logout", (req, res) => {
    const sessionId = req.session.id;
    req.session.destroy(() => {
      // disconnect all Socket.IO connections linked to this session ID
      io.to(`session:${sessionId}`).disconnectSockets();
      res.status(StatusCodes.NO_CONTENT).end();
    });
  });

  return router;
}
