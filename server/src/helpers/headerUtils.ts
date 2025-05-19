import { Request, Response } from 'express';

const HEADERS = {
  // Custom
  TOKEN_EXPIRES_AT: 'X-Token-Expires-At',
  TOKEN: 'X-Token',
  // Request headers
  IP: 'ip',
  USER_AGENT: 'user-agent',
  SEC_CH_UA: 'sec-ch-ua',
  SEC_CH_UA_PLATFORM: 'sec-ch-ua-platform',
  ACCEPT_LANGUAGE: 'accept-language',
  AUTHORIZATION: 'authorization',
};

const HeaderUtils = {
  // Constants
  NAMES: HEADERS,
  
  // Get a request header value
  getRequestHeader(req: Request, headerName: keyof typeof HEADERS | string) {
    const name = HEADERS[headerName as keyof typeof HEADERS].toLowerCase();
    return req.headers[name] || null;
  },
  
  // Set a response header
  setResponseHeader(res: Response, headerName: keyof typeof HEADERS | string, value: string) {
    const name = HEADERS[headerName as keyof typeof HEADERS];
    res.setHeader(name, value);
    return value;
  },
  
  // Check if a request header exists
  hasRequestHeader(req: Request, headerName: keyof typeof HEADERS | string) {
    const name = HEADERS[headerName as keyof typeof HEADERS].toLowerCase();
    return req.headers[name] !== undefined;
  }
};

export default HeaderUtils;