import { Router } from 'express';
import { DataService, TokenMetadata } from '../types';
import { getRequestFingerprint } from '../helpers/getRequestFingerprint';
import { asyncHandler } from '../helpers/asyncHandler';

export const createAuthRouter = (dataService: DataService) => {
  const router = Router();

  router.post('/auth', asyncHandler(async (req, res) => {
    const fingerprint = getRequestFingerprint(req);
    const metadata: TokenMetadata = {
      ip: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
      browserBrand: req.headers['sec-ch-ua'] || '',
      osPlatform: req.headers['sec-ch-ua-platform'] || '',
      acceptLanguage: req.headers['accept-language'] || ''
    };

    const result = await dataService.createOrRenewToken(fingerprint, metadata);
    // TODO: change this to only return them in the header like in the auth middleware, we still have to refactor this flow
    res.json(result);
  }));

  return router;
};
