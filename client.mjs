import redis from "redis";

const client = redis.createClient({
  socket: {
    host: process.env.NODE_ENV === 'production' ? 'clustercfg.prod.8yggea.memorydb.ap-southeast-1.amazonaws.com'
                                                : 'clustercfg.pushups.8yggea.memorydb.ap-southeast-1.amazonaws.com',
    port: '6379',
    tls: true
  },
  username: 'default'
});

client.on('error', (err) => console.log('Redis Client Error', err));

export default client;
