import redis from "redis";
import express from "express";
import { nanoid } from "nanoid/non-secure";
import { randomName } from "./anonNameGen.js";

const app = express();
app.use(express.json());
//todo fix CORS policy, currently wildcarded for testing
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

const getRank = async (exercise, uid) => (await client.ZREVRANK(exercise, uid)) + 1;

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

const getLeaderboardDisplayProfileData = async (uid) => {
  const profileData = await client.json.get(uid, {
    path: ['.nickname', '.photoURL', '.anonymous', '.anonymousName']
  });
  return {
    nickname: profileData['.anonymous'] ? profileData['.anonymousName'] : profileData['.nickname'],
    photoURL: profileData['.anonymous'] ? '' : profileData['.photoURL'],
  }
}

// if number of results and page number not specified, we have defaults
app.get('/:exercise/leaderboard/:numberOfResults?/:pageNumber?', async (req, res, next) => {
  const exercise = req.params.exercise;
  const numberOfResults = Number(req.params.numberOfResults) || 10;
  const pageNumber = Number(req.params.pageNumber) || 0;
  const start = pageNumber * numberOfResults;
  const end = start + numberOfResults;
  try {
    const leaderboard = await client.ZRANGE_WITHSCORES(exercise, start, end - 1, { REV: true });
    const oldValues = {oldResults: -1, rankForOldResults: 0};
    const rankings = [];
    for (let i = 0; i < leaderboard.length; i++) {
      const object = leaderboard[i];
      const profileData = getLeaderboardDisplayProfileData(object.value);
      const results = object.score.toFixed(1);
      const rank = object.score === Number(oldValues.oldResults) ? oldValues.rankForOldResults : (await getRank(exercise, object.value));
      oldValues.oldResults = Number(results);
      oldValues.rankForOldResults = Number(rank);
      rankings.push({
        uid: object.value,
        results,
        rank,
        ...(await profileData)
      });
    }
    res.send({rankings, totalNumberOfElements: await client.ZCARD(exercise)});
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
    const updatedScore = await client.ZINCRBY(exercise, parseFloat(scoreOfLatest), uid);
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

//get the user's exercise stats
app.get('/:exercise/user/:uid', async (req, res, next) => {
  try {
    const exercise = req.params.exercise;
    const uid = req.params.uid;
    const results = client.ZSCORE(exercise, uid);
    const rank = getRank(exercise, uid);
    res.status(200);
    res.send({
      uid,
      ...(await getLeaderboardDisplayProfileData(uid)),
      results: (await results).toFixed(1),
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
      await client.json.set(uid, '$', {
        nickname: 'Krab',
        age: '21',
        weight: '80',
        height: '180',
        gender: '0',
        anonymous: Math.random() > 0.5,
        totalCal: 20,
        photoURL: '',
        anonymousName: randomName()});
    }
    await client.ZADD(exercise, arr);
    res.sendStatus(200);
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
    res.sendStatus(200);
  } catch (err) {
    res.status(400);
    res.setHeader('Content-Type', 'application/json');
    res.json({
      error_message: "Unable to delete user id: " + uid
    });
  }
});

app.post('/user/addUserStatistics/:uid', async (req, res, next) => {
  const uid = req.params.uid;
  const { userProfileStatistics } = req.body;
  try {
    await client.json.set(uid, '$', {...userProfileStatistics, anonymousName: randomName()});
    res.sendStatus(200);
  } catch (err) {
    next(err);
  }
})

// couldn't use curl to POST JSON, so this random endpoint was created
app.get('/user/addCustomUser/', async (req, res, next) => {
  const stats = {"nickname":"Grass Algae","age":2,"weight":3,"height":3,"gender":"0","anonymous":false,"totalCal":2600,"photoURL":null}
  try {
    await client.json.set('XMugbNfdE7DZbp9i20IMoDl2981A', '$', {...stats, anonymousName: randomName()});
    res.sendStatus(200);
  } catch (err) {
    next(err);
  }
})

app.get('/user/getUserStatistics/:uid', async (req, res, next) => {
  const uid = req.params.uid;
  try {
    const results = await client.json.get(uid);
    res.status(200);
    res.send(results);
  } catch (err) {
    next(err);
  }
})

app.get('/user/getUserPhotoURL/:uid', async (req, res, next) => {
  const uid = req.params.uid;
  try {
    const results = await client.json.get(uid, {
      path: ['.photoURL']
    });
    res.status(200);
    res.send(results);
  } catch (err) {
    next(err);
  }
})

app.listen(3000, async () => {
  console.log("server is running");
  await client.connect();
  console.log(await client.ping());
});
