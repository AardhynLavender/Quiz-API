import NodeCache from "node-cache";
// import { useAdapter } from "@type-cashable/node-cache-adapter";
import { Request, Response, NextFunction } from "express";
import { Send } from "express-serve-static-core";
type ResBody = any; // from express-serve-static-core

const STD_TTL = 60; // seconds
const CHECK_PERIOD = 310;
const cache = new NodeCache({ stdTTL: STD_TTL, checkperiod: CHECK_PERIOD });

interface CachedResponse extends Response {
  originalSend: Send<ResBody, this>;
  json: (body: ResBody) => ResBody | void;
}

const cacheRoute = (req: Request, res: CachedResponse, next: NextFunction) => {
  const key = req.url + req.headers.authorization;
  const cachedRes = cache.get(key);

  if (req.method !== "GET" && cachedRes) {
    cache.del(key);
    return next();
  } else if (cachedRes) {
    return res.json(cachedRes);
  } else {
    res.originalSend = res.json;
    res.json = (body) => {
      cache.set(key, body);
      res.originalSend(body);
    };
    return next();
  }
};

export default cacheRoute;
