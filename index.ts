import process from 'process';
import { server } from './server';
import { getIp } from './get-ip';
import { token, port } from './config.json';
import knownIsps from './isp.json';

interface Params {
  token: string;
  ispAlias: string;
}

// Add our route handler with correct types
server.get(`/api/:token/get-ip/:ispAlias`, async (req, reply) => {
  const { token: suppliedToken, ispAlias } = req.params as Params;
  if (suppliedToken !== token) reply.code(404).send();
  else {
    const isp = (knownIsps as Record<string, string>)[ispAlias];
    if (!isp) reply.code(404).send();
    else {
      const ip = await getIp(req.ip, isp, suppliedToken);
      if (!ip) reply.code(400).send();
      else reply.code(200).send(ip);
    }
  }
});

// Start your server
server.listen(port, '0.0.0.0', (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
});
