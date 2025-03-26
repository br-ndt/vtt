import bodyParser from "body-parser";
import express from "express";
import session from "express-session";
import passport from "passport";

export function setupMiddleware(
  app: express.Express,
  sessionMiddleware: express.RequestHandler
) {
  app.use(sessionMiddleware);
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(passport.initialize());
  app.use(passport.session());
}
