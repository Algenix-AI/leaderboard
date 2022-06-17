import redis from "redis";
import express from "express";
import {nanoid} from "nanoid/non-secure";

const app = express();
app.use(express.json());

const getRank = async (uid) => (await client.ZREVRANK("pushups", uid)) + 1;

const client = redis.createClient({
  socket: {
    host: 'clustercfg.pushups.8yggea.memorydb.ap-southeast-1.amazonaws.com',
    port: '6379',
    tls: true
  },
  username: 'default'
});

client.on('error', (err) => console.log('Redis Client Error', err));

app.get('/leaderboard/:numberOfResults?/:pageNumber?', async (req, res, next) => {
  const numberOfResults = req.params.numberOfResults || 0;
  const pageNumber = req.params.pageNumber || 0;
  let start, end;
  if (numberOfResults === 0) { // return first 10
    start = 0;
    end = 9;
  } else {
    start = pageNumber * numberOfResults;
    end = start + numberOfResults;
  }
  try {
    const leaderboard = await client.ZRANGE("pushups", start, end);
    const rankings = await Promise.all(leaderboard.map(async (uid) => {
      return {
        uid,
        results: await client.ZSCORE("pushups", uid),
        rank: await getRank(uid)
      }
    }))
    res.send(rankings);
  } catch (err) {
    next(err);
  }
});

app.put('/user/addCumulative', async (req, res, next) => {
  try {
    const { uid, results } = req.body;
    // await client.HSET(uid, "points", points);
    await client.ZADD("pushups", { score: results, value: uid });
    const rank = await getRank(uid);
    // const points = await client.HGET(uid, "points");
    // const results = await client.ZSCORE("pushups", uid);

    res.setHeader('Content-Type', 'application/json');
    res.json({
      rank,
      uid,
      results,
      // points,
    });
  } catch (err) {
    next(err);
  }
});

app.delete('/user/delete/:uid', async (req, res) => {
  const uid = req.params.uid;
  // try {
  // await client.HDEL(uid, "points", uid);
  // } catch (err) {
  //   res.status(400);
  //   res.setHeader('Content-Type', 'application/json');
  //   res.json({
  //     error_message: "User could not deleted from hash."
  //   });
  // }
  try {
    await client.ZREM("pushups", uid);
  } catch (err) {
    res.status(400);
    res.setHeader('Content-Type', 'application/json');
    res.json({
      error_message: "Unable to delete user id: " + uid
    });
  }
  res.status(200);
  res.setHeader('Content-Type', 'application/json');
  res.json({
    success_message: 'Deleted ' + uid
  });
});

app.get('/user/addRandom', async (req, res, next) => {
  try {
    const arr = [];
    for (let i = 0; i < 30; i++) {
      const uid = nanoid();
      const results = Math.floor(Math.random() * 100);
      arr.push({ score: results, value: uid });
    }
    await client.ZADD("pushups", arr);
    res.send({
      success: true
    });
  } catch (err) {
    next(err);
  }
});

app.delete('/user/deleteAll', async (req, res) => {
  try {
    await client.ZREMRANGEBYRANK("pushups", 0, -1);
  } catch (err) {
    res.status(400);
    res.setHeader('Content-Type', 'application/json');
    res.json({
      error_message: "Unable to delete user id: " + uid
    });
  }
  res.status(200);
  res.setHeader('Content-Type', 'application/json');
  res.json({
    success_message: 'Deleted all'
  });
});

app.listen(80, async () => {
  console.log("server is running");
  await client.connect();
  console.log(await client.ping());
});
