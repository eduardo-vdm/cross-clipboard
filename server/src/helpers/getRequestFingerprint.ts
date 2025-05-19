import { Request } from "express";
import crypto from 'crypto';

/**
 * Gets the fingerprint of the   request based on the IP address, user agent, accept language, browser brand and OS platform
 * @param {Request} req - The request object
 * @returns {string} The fingerprint of the request
 */ 
export const getRequestFingerprint = (req: Request) => {
  // Collect identifying information
  const components = [
    req.ip,
    req.headers['user-agent'] || '',
    req.headers['accept-language'] || '',
    // Optional additional factors
    req.headers['sec-ch-ua'] || '', // Browser brand (modern browsers)
    req.headers['sec-ch-ua-platform'] || '' // OS platform (modern browsers)
  ];

  // Create a hash of the collected components
  const fingerprint = crypto.createHash('sha256').update(components.join('-')).digest('hex');
  return fingerprint;
};