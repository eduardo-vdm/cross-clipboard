import { Request, Response, NextFunction } from 'express';
import { DataService, TokenMetadata, ExtendedRequest, TokenResponse } from '../types';
import { getRequestFingerprint } from '../helpers/getRequestFingerprint';
import HeaderUtils from '../helpers/headerUtils';

/**
 * Creates an authentication middleware that authenticates a token and sets the fingerprint, token metadata in the request and token and expires at response headers
 * @param dataService - The data service
 * @returns The authentication middleware
 */
export const createAuthMiddleware = (dataService: DataService) => {

  /**
   * Sets the fingerprint in the request
   * @param {ExtendedRequest} req - The request object
   */
  function setRequestFingerprint (req: ExtendedRequest, fingerprint?: string) {
    if (!fingerprint) {
      fingerprint = getRequestFingerprint(req);
      if (!fingerprint) throw new Error('Failed to get fingerprint');
    }
    req.fingerprint = fingerprint;
  }

  /**
   * Sets the token metadata in the request
   * @param {ExtendedRequest} req - The request object
   * @param {TokenMetadata} metadata - The token metadata
   */
  function setRequestTokenMetadata (req: ExtendedRequest, metadata?: TokenMetadata) {
    const ip = (HeaderUtils.getRequestHeader(req, 'IP') || '') as string;
    const userAgent = (HeaderUtils.getRequestHeader(req, 'USER_AGENT') || '') as string;
    const browserBrand = (HeaderUtils.getRequestHeader(req, 'SEC_CH_UA') || '') as string;
    const osPlatform = (HeaderUtils.getRequestHeader(req, 'SEC_CH_UA_PLATFORM') || '') as string;
    const acceptLanguage = (HeaderUtils.getRequestHeader(req, 'ACCEPT_LANGUAGE') || '') as string;
    const newMetadata: TokenMetadata =  Object.assign({}, (metadata || {
      ip,
      userAgent,
      browserBrand,
      osPlatform,
      acceptLanguage
    }));
    req.tokenMetadata = newMetadata;
  }

  /**
   * Sets the token and expires at response headers
   * @param {Response} res - The response object
   * @param {TokenResult} tokenResult - The token result
   */
  function setResponseCustomHeaders (res: Response, tokenResult: { expiresAt?: Date | null, token?: string }) {
    if (tokenResult?.expiresAt) {
      HeaderUtils.setResponseHeader(res, 'TOKEN_EXPIRES_AT', tokenResult.expiresAt.toISOString());
    }
    if (tokenResult?.token) {
      HeaderUtils.setResponseHeader(res, 'TOKEN', tokenResult.token);
    }
  }

  /**
   * Gets the request token from the header
   * @param {Request} req - The request object
   * @returns The request token
     */
  function getRequestToken (req: Request) {
    const authHeader = HeaderUtils.getRequestHeader(req, 'AUTHORIZATION') || '';
    return typeof authHeader === 'string' ? authHeader.split(' ')[1] : '';
  }

  /**
   * Gets the expires at from the header
   * @param {Request} req - The request object
   * @returns The expires at
   */
  function getExpiresAt (req: Request) {
    const expiresAtValue = HeaderUtils.getRequestHeader(req, 'TOKEN_EXPIRES_AT') || '';
    return expiresAtValue ? new Date(expiresAtValue as string) : undefined;
  }

  /**
   * Authenticates a token and sets the fingerprint, token metadata in the request and token and expires at response headers
   * @param {Request} req - The request object
   * @param {Response} res - The response object
   * @param {NextFunction} next - The next function
   */   
  return async function authenticateToken(req: Request, res: Response, next: NextFunction) {
    try {
      const extendedReq = req as ExtendedRequest;
      const now = new Date();
      const token = getRequestToken(extendedReq);
      const fingerprint = getRequestFingerprint(extendedReq);
      // const expiresAt = getExpiresAt(extendedReq);
      let result: TokenResponse;

      setRequestFingerprint(extendedReq, fingerprint);
      setRequestTokenMetadata(extendedReq);
      
      // this is doing the same either the token doesn't exist or it's expired, more like a placeholder for future specific scenarios
      if (!token) {
        // if no token create one for this fingerprint
        result = await dataService.createOrRenewToken(extendedReq.fingerprint, extendedReq.tokenMetadata);
      } else {
        // try to validate the token with fingerprint: it must exist and expire in the future
        const validateResult = await dataService.validateToken(token, fingerprint);
        if (!validateResult.exists || validateResult.expired) {
          // if the token does not exist, we create a new one; if expired it'll be renewed
          result = await dataService.createOrRenewToken(extendedReq.fingerprint, extendedReq.tokenMetadata);
        } else {
          // all good, set the token and expires at for setting the custom headers next
          result = {
            expiresAt: validateResult.expiresAt,
            token
          };
        }
      }
      // set the custom headers to be consumed by the client
      setResponseCustomHeaders(res, result);
      next();
    } catch (error) {
      next(error);
    }
  };
};
