import { request } from 'undici';
import { server } from './server';
import { redisKeyPrefix } from './config.json';

interface IpApiResponse {
  status: string;
  message: string;
  isp: string;
}

const ISP_CACHE_KEY = `${redisKeyPrefix}:isp-cache`;
const LAST_KNOWN_IP_KEY = `${redisKeyPrefix}:last-known-ip`;

export const lastKnownIpField = (token: string, isp: string) => `${token} (${isp})`;

export const getIsp = async (ip: string) => {
  const isp = await server.redis.hget(ISP_CACHE_KEY, ip);
  if (isp) return isp;

  const url = `http://ip-api.com/json/${ip}?fields=49664`;
  const { statusCode, body } = await request(url);
  if (statusCode !== 200) throw new Error(`Request failed with status ${statusCode}: ${url}`);

  const response = await body.json() as IpApiResponse;
  if (response.status !== 'success') throw new Error(`Request failed with message "${response.message}": ${url}`);

  await server.redis.hset(ISP_CACHE_KEY, ip, response.isp);
  return response.isp;
}

export const getIp = async (requestIp: string, targetIsp: string, token: string) => {
  const lastKnownIp = await server.redis.hget(LAST_KNOWN_IP_KEY, lastKnownIpField(token, targetIsp));
  if (requestIp === lastKnownIp) return requestIp;

  const resolvedIsp = await getIsp(requestIp);
  if (resolvedIsp !== targetIsp) {
    // Request came through wrong interface, return last known ip
    return lastKnownIp;
  }
  
  await server.redis.hset(LAST_KNOWN_IP_KEY, lastKnownIpField(token, targetIsp), requestIp);
  return requestIp;
};
