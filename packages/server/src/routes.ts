import bcrypt from "bcryptjs";
import express, { Request } from "express";
import nodemailer, { Transporter } from "nodemailer";

import { authenticatedRoute } from "./util";
import passport from "passport";
import { Server } from "socket.io";
import { StatusCodes } from "http-status-codes";
import { randomUUID } from "crypto";
import { SentMessageInfo, Options } from "nodemailer/lib/smtp-transport";

let curId = 0;

function sendVerificationEmail(
  transporter: Transporter<SentMessageInfo, Options>,
  email: any,
  verificationToken: string
) {
  console.log(process.env.GMAIL_EMAIL);
  const mailOptions = {
    from: process.env.GMAIL_EMAIL,
    to: email,
    subject: "Welcome to WonkGabe",
    html: `<p>Click <a href="${process.env.HOSTNAME}/auth/verify?token=${verificationToken}">here</a> to verify your email.`,
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.log(err);
    } else {
      console.log(`Email sent to ${email}: ${info.response}`);
    }
  });
}

export function createAuthRouter(
  io: Server,
  accountList: (Express.User & { password: string })[]
) {
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
    res.status(StatusCodes.ACCEPTED).json({ ...req.user, password: undefined });
  });

  router.post("/register", async (req, res) => {
    const { username, email, password } = req.body;
    if (accountList.find((user) => user.username === username) !== undefined) {
      res
        .status(StatusCodes.BAD_REQUEST)
        .send("A user with this username exists");
    }
    if (accountList.find((user) => user.email === email) !== undefined) {
      res.status(StatusCodes.BAD_REQUEST).send("A user with this email exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    ++curId;
    const verificationToken = randomUUID().toString();
    const newUser: Express.User & { password: string } = {
      activeRoom: "lobby",
      email,
      id: curId,
      username,
      password: hashedPassword,
      verificationToken,
      verified: false,
    };
    accountList.push(newUser);

    sendVerificationEmail(emailTransporter, email, verificationToken);

    res
      .status(StatusCodes.CREATED)
      .json({ message: "Registration successful, please check your email." });
  });

  router.get("/verify", async (req, res) => {
    const user = accountList.find(
      (user) => user.verificationToken === req.query.token
    );
    console.log(user);
    if (user && !user.verified) {
      user.verified = true;
    }
    return res.status(StatusCodes.PERMANENT_REDIRECT).redirect("/");
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
            .json({ ...req.user, password: undefined });
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
