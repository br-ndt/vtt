import { RequestHandler } from "express";
import { NextFunction, ParamsDictionary } from "express-serve-static-core";
import { ParsedQs } from "qs";

export function getRandomIntInclusive(min: number, max: number) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function authenticatedRoute(req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.status(401).send("Not authenticated");
  }
}

export function onlyForHandshake(
  middleware: RequestHandler<
    ParamsDictionary,
    any,
    any,
    ParsedQs,
    Record<string, any>
  >
) {
  return (req, res, next: NextFunction) => {
    const isHandshake = req?._query?.sid === undefined;
    if (isHandshake) {
      middleware(req, res, next);
    } else {
      next();
    }
  };
}

export function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}
