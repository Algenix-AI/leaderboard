import redis from "redis";
import express from "express";
import {nanoid} from "nanoid/non-secure";

const app = express();
app.use(express.json());
//todo fix CORS policy, currently wildcarded for testing
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

const getRank = async (exercise, uid) => (await client.ZREVRANK(exercise, uid)) + 1;

const client = redis.createClient({
  socket: {
    host: 'clustercfg.pushups.8yggea.memorydb.ap-southeast-1.amazonaws.com',
    port: '6379',
    tls: true
  },
  username: 'default'
});

client.on('error', (err) => console.log('Redis Client Error', err));

// if number of results and page number not specified, we have defaults
app.get('/:exercise/leaderboard/:numberOfResults?/:pageNumber?', async (req, res, next) => {
  const exercise = req.params.exercise;
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
    const leaderboard = await client.ZRANGE_WITHSCORES(exercise, start, end, {REV: true});
    const rankings = await Promise.all(leaderboard.map(async (object) => {
      return {
        uid: object.value,
        results: object.score,
        rank: await getRank(exercise, object.value)
      }
    }))
    res.send(rankings);
  } catch (err) {
    next(err);
  }
});

//todo make this safer, if client accidentally sends the same request twice
app.post('/:exercise/addToUserCumulative', async (req, res, next) => {
  try {
    const exercise = req.params.exercise;
    const { uid, scoreOfLatest } = req.body;
    // await client.HSET(uid, "points", points);
    const updatedScore = await client.ZINCRBY(exercise, scoreOfLatest, uid);
    // const rank = await getRank(uid);
    // const points = await client.HGET(uid, "points");

    res.status(200);
    res.setHeader('Content-Type', 'application/json');
    res.json({
      // rank,
      updatedScore,
      uid,
      // cumulativeScore,
      // points,
    });
  } catch (err) {
    next(err);
  }
});

//delete the specified user
app.delete('/:exercise/deleteUser/:uid', async (req, res) => {
  const uid = req.params.uid;
  const exercise = req.params.exercise;
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
    await client.ZREM(exercise, uid);
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

//get the user's leaderboard stats
app.get('/:exercise/user/profile/:uid', async (req, res, next) => {
  try {
    const exercise = req.params.exercise;
    const uid = req.params.uid;
    const score = client.ZSCORE(exercise, uid);
    const rank = getRank(exercise, uid);
    res.status(200);
    res.send({
      score: await score,
      rank: await rank
    });
  } catch (err) {
    next(err);
  }
});

//populate the leaderboard randomly
app.get('/:exercise/addRandomUsers', async (req, res, next) => {
  try {
    const exercise = req.params.exercise;
    const arr = [];
    for (let i = 0; i < 30; i++) {
      const uid = nanoid();
      const results = Math.floor(Math.random() * 100);
      arr.push({ score: results, value: uid });
    }
    await client.ZADD(exercise, arr);
    res.send(200);
    // res.send({
    //   success: true
    // });
  } catch (err) {
    next(err);
  }
});

//todo authenticate this request
//delete all the users
app.delete('/:exercise/deleteAllUsers', async (req, res) => {
  try {
    const exercise = req.params.exercise;
    await client.ZREMRANGEBYRANK(exercise, 0, -1);
    res.send(200);
  } catch (err) {
    res.status(400);
    res.setHeader('Content-Type', 'application/json');
    res.json({
      error_message: "Unable to delete user id: " + uid
    });
  }
  // res.setHeader('Content-Type', 'application/json');
  // res.json({
  //   success_message: 'Deleted all'
  // });
});

app.post('/user/addUserStatistics/:uid', async (req, res, next) => {
  const uid = req.params.uid;
  const { userProfileStatistics } = req.body;
  console.log(uid)

  console.log("Tt")
  console.log(userProfileStatistics);
  try {
    await client.HSET('users', uid, userProfileStatistics);
    res.send(200);
  } catch (err) {
    next(err);
  }
})

app.get('/user/getUserStatistics/:uid', async (req, res, next) => {
  const uid = req.params.uid;
  try {
    const stats = await client.HGET('users', uid);
    res.status(200);
    res.send(stats);
  } catch (err) {
    next(err);
  }
})

app.listen(3000, async () => {
  console.log("server is running");
  await client.connect();
  console.log(await client.ping());
});
