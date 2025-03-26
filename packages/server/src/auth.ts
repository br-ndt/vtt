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
      user: any,
      done: (arg0: null, arg1: string) => void
    ) => {
      done(null, user);
    }
  );

  passport.deserializeUser((userData: Express.User, done) => {
    const user = accountList.find((u) => u.username === userData.username);
    done(null, user);
  });
}
