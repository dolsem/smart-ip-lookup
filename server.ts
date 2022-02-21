import fastify from 'fastify';
import redisPlugin from 'fastify-redis';
import { fastifyOptions, redisOptions } from './config.json';

export const server = fastify(fastifyOptions);

server.register(redisPlugin, redisOptions);
