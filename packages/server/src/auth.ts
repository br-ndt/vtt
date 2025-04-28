import bcrypt from "bcryptjs";
import { IncomingMessage } from "http";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";

export function passportAuth(
  accountList: (Express.User & { password: string })[]
) {
  return new LocalStrategy((username, password, done) => {
    const user = accountList.find((u) => u.username === username);
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

export function setupPassport(
  accountList: (Express.User & { password: string })[]
) {
  passport.use(passportAuth(accountList));

  passport.serializeUser(
    (
      _req: IncomingMessage,
      user: Express.User,
      done: (arg0: null, arg1: number) => void
    ) => {
      done(null, user.id);
    }
  );

  passport.deserializeUser((id: number, done) => {
    const user = accountList.find((u) => u.id === id);
    if (user) {
      done(null, user);
    } else {
      done(new Error("user not found"));
    }
  });
}
