import bcrypt from "bcryptjs";
import { IncomingMessage } from "http";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import User from "../db/models/User";

export function passportAuth() {
  return new LocalStrategy(async (username, password, done) => {
    const user = await User.query().findOne({ username });
    if (!user) {
      console.log("Incorrect username");
      return done(null, false, { message: "Incorrect username" });
    }
    if (!user.verified) {
      return done(null, false, { message: "Unverified. Check your email" });
    }

    bcrypt.compare(password, user.password, (err, res) => {
      if (err) return done(err);
      if (!res) {
        console.log("Incorrect password");
        return done(null, false, { message: "Incorrect password" });
      }
      return done(null, user);
    });
  });
}

export function setupPassport() {
  passport.use(passportAuth());

  passport.serializeUser(
    (
      _req: IncomingMessage,
      user: Express.User,
      done: (arg0: null, arg1: number) => void
    ) => {
      done(null, user.id);
    }
  );

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await User.query().findById(id);
      if (user) {
        done(null, user);
      } else {
        done(new Error("user not found"));
      }
    } catch (err) {
      done(err);
    }
  });
}
