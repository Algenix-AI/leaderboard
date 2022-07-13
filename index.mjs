import express from "express";
import fs from 'fs';
import https from 'https';
import { nanoid } from "nanoid/non-secure";
import { randomName } from "./anonNameGen.js";
import authenticatedRoutes from "./authenticatedRoutes.mjs";
import client from "./client.mjs";

// sudo cp /home/ubuntu/leaderboard/leaderboard.service /usr/lib/systemd/system/
// see commands.sh on how to restart

//todo add 404s, if user does not exist or if rank/score do not exist
const app = express();

app.use(express.json());

// const allowedOrigins = process.env.NODE_ENV === 'production' ? [/https:\/\/form-for-average-joe.firebaseapp.com/, /https:\/\/form-for-average-joe.web.app/, /https:\/\/form-for-average-joe--staging-5vntiehb.web.app/, /https:\/\/form-for-average-joe--test-nptjlot4.web.app/] : [/.*/];
const allowedOrigins = [/.*/];
app.use(function (req, res, next) {
  const origin = req.headers.origin;
  if (allowedOrigins.some(x => x.test(origin))) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use('/', authenticatedRoutes);

const getRank = async (exercise, uid) => (await client.ZREVRANK(exercise, uid)) + 1;

const getLeaderboardDisplayProfileData = async (uid, isAnonymousRequired) => {
  const profileData = await client.json.get(uid, {
    path: ['.nickname', '.photoURL', '.anonymous', '.anonymousName']
  });
  if (!profileData) return {};
  return {
    nickname: isAnonymousRequired && profileData['.anonymous'] ? profileData['.anonymousName'] : profileData['.nickname'],
    photoURL: isAnonymousRequired && profileData['.anonymous'] ? '' : profileData['.photoURL'],
    isAnonymous: profileData['.anonymous']
  };
}

app.post('/addToLeaderboard/:leaderboardId/:uid', async (req, res, next) => {
  try {
    const exercise = req.params.exercise;
    const { uid, scoreOfLatest } = req.body;
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

app.get('/isKeyPresent/:key', async (req, res, next) => {
  try {
    const key = req.params.key;
    res.status(200);
    res.send({
      isKeyPresent: Boolean(await client.EXISTS(key))
    });
  } catch (err) {
    next(err);
  }
});

app.get('/deleteKey/:key', async (req, res, next) => {
  try {
    const key = req.params.key;
    await client.DEL(key);
    // then test api cases
  } catch (err) {
    next(err);
  }
  res.sendStatus(200);
})

app.get('/getLeaderboardName/:groupCode', async (req, res, next) => {
  const groupCode = req.params.groupCode;
  try {
    res.send({
      leaderboardName: await client.json.get(groupCode, {
        path: ['.leaderboardName']
      })
    })
  } catch (err) {
    next(err);
  }
})

app.put('/addGroupCodeToUser/:groupCode/:uid', async (req, res, next) => {
  try {
    const groupCode = req.params.groupCode;
    const uid = req.params.uid;
    const { leaderboardName } = req.body;
    const uidsLength = await client.json.ARRLEN(groupCode, '$.userUids');
    const newArray = [uid];
    if (uidsLength > 0) {
      const existingCodes = await client.json.get(groupCode, {
        path: ['.userUids']
      });
      if (!(existingCodes.includes(uid))) {
        await client.json.set(groupCode, '$.userUids', existingCodes.concat(newArray));
      }
      // else do nothing, uid is already in the array
    } else {
      await client.json.set(groupCode, '$', {
        userUids: newArray,
        leaderboardName
      });
    }
    res.sendStatus(200);
  } catch (err) {
    next(err);
  }
});

app.get('/allKeys', async (req, res) => {
  res.send(await client.KEYS('*'));
})

const getCurrentUserProfileDataPrivateLeaderboard = async (uid, results, rank) => {
  if (results === null || rank === null) {
    return null;
  } else {
    return {
      uid,
      ...(await getLeaderboardDisplayProfileData(uid, true)),
      results,
      rank
    };
  }
}

async function generatePrivateLeaderboard(exercise, start, end, leaderboardId, uid) {
  const userUids = await client.json.get(leaderboardId, {
    path: ['.userUids']
  });
  const leaderboardScores = await client.ZMSCORE(exercise, userUids);
  const keys = Array.from(leaderboardScores.keys())
    .sort((a, b) => {
      if (leaderboardScores[a] === null) {
        return 1
      } else if (leaderboardScores[b] === null) {
        return -1
      } else {
        return leaderboardScores[b] - leaderboardScores[a];
      }
    });
  const sortedLeaderboardScores = keys.map(i => leaderboardScores[i]);
  const sortedLeaderboardUids = keys.map(i => userUids[i]);
  const totalNumberOfElements = keys.length;
  const rankings = [];
  const oldValues = { oldResults: -1, rankForOldResults: 0 };
  let currentUserData;
  for (let i = start; i <= Math.min(end, totalNumberOfElements - 1); i++) {
    const profileData = getLeaderboardDisplayProfileData(sortedLeaderboardUids[i], false);
    const checkScoreForNull = sortedLeaderboardScores[i] || 0;
    const results = checkScoreForNull.toFixed(1);
    const rank = checkScoreForNull === Number(oldValues.oldResults) ? oldValues.rankForOldResults : i + 1;
    oldValues.oldResults = Number(results);
    oldValues.rankForOldResults = Number(rank);
    if (sortedLeaderboardUids[i] === uid) {
      currentUserData = getCurrentUserProfileDataPrivateLeaderboard(uid, results, rank)
    }
    rankings.push({
      uid: sortedLeaderboardUids[i],
      results,
      rank,
      ...(await profileData)
    });
  }
  return { rankings, totalNumberOfElements, currentUserData: await currentUserData };
}

const getCurrentUserProfileDataGlobalLeaderboard = async (exercise, uid) => {
  const results = await client.ZSCORE(exercise, uid);
  const rank = await getRank(exercise, uid);
  if (results === null || rank === null) {
    return null;
  } else {
    return {
      uid,
      ...(await getLeaderboardDisplayProfileData(uid, true)),
      results,
      rank
    };
  }
}

async function generateGlobalLeaderboard(exercise, start, end, uid) {
  const leaderboard = await client.ZRANGE_WITHSCORES(exercise, start, end, { REV: true });
  const oldValues = { oldResults: -1, rankForOldResults: 0 };
  const rankings = [];
  const currentUserData = getCurrentUserProfileDataGlobalLeaderboard(exercise, uid);
  for (let i = 0; i < leaderboard.length; i++) {
    const object = leaderboard[i];
    const profileData = getLeaderboardDisplayProfileData(object.value, true);
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
  return { rankings, totalNumberOfElements: await client.ZCARD(exercise), currentUserData: await currentUserData };
}

// if number of results and page number not specified, we have defaults
app.get('/:exercise/leaderboard/:leaderboardId/:numberOfResults?/:pageNumber?/:uid', async (req, res, next) => {
  const exercise = req.params.exercise;
  const leaderboardId = req.params.leaderboardId;
  const numberOfResults = Number(req.params.numberOfResults) || 10;
  const pageNumber = Number(req.params.pageNumber) || 0;
  const uid = req.params.uid;
  const start = pageNumber * numberOfResults;
  const end = (start + numberOfResults) - 1;
  try {
    if (leaderboardId === 'global') {
      res.send(await generateGlobalLeaderboard(exercise, start, end, uid));
    } else {
      res.send(await generatePrivateLeaderboard(exercise, start, end, leaderboardId, uid));
    }
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

//populate the leaderboard randomly
app.get('/:exercise/addRandomUsers', async (req, res, next) => {
  try {
    const exercise = req.params.exercise;
    const arr = [];
    for (let i = 0; i < 15; i++) {
      const uid = nanoid();
      const results = Math.floor(Math.random() * 100);
      arr.push({ score: results, value: uid });
      await client.json.set(uid, '$', {
        nickname: 'Random User #' + i,
        age: '21',
        weight: '80',
        height: '180',
        gender: '0',
        anonymous: Math.random() > 0.5,
        photoURL: '',
        anonymousName: randomName()
      });
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

app.get('/deleteAllItemsUnsafe', async (req, res, next) => {
  try {
    // const allKeys = await client.KEYS('*');
    // const x = await client.DEL(allKeys[0]);
    res.sendStatus(200);
  } catch (err) {
    next(err);
  }
})

app.post('/user/addUserStatistics/:uid', async (req, res, next) => {
  const uid = req.params.uid;
  const { userProfileStatistics } = req.body;
  try {
    await client.json.set(uid, '$', { ...userProfileStatistics, anonymousName: randomName() });
    res.sendStatus(200);
  } catch (err) {
    next(err);
  }
})

// couldn't use curl to POST JSON, so this random endpoint was created
app.get('/user/addCustomUser/', async (req, res, next) => {
  const stats = {
    "nickname": "Grass Algae",
    "age": 2,
    "weight": 3,
    "height": 3,
    "gender": "0",
    "anonymous": false,
    "photoURL": null
  }
  try {
    await client.json.set('XMugbNfdE7DZbp9i20IMoDl2981A', '$', { ...stats, anonymousName: randomName() });
    res.sendStatus(200);
  } catch (err) {
    next(err);
  }
})

app.get('/user/getUserCumulative/:exercise/:uid', async (req, res, next) => {
  const uid = req.params.uid;
  const exercise = req.params.exercise;
  try {
    const score = await client.ZSCORE(exercise, uid);
    const rank = await getRank(exercise, uid);
    res.send({ score, rank });
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

app.get('/.well-known/pki-validation/80D05B57471BE69E698D8AB8A24589D0.txt', function (req, res, next) {
  var options = {
    root: '/home/ubuntu/leaderboard',
    dotfiles: 'allow',
    headers: {
      'x-timestamp': Date.now(),
      'x-sent': true
    }
  }

  var fileName = '80D05B57471BE69E698D8AB8A24589D0.txt'
  res.sendFile(fileName, options, function (err) {
    if (err) {
      next(err)
    } else {
      console.log('Sent:', fileName)
    }
  })
});

https
  .createServer({
    key: fs.readFileSync("/home/ubuntu/leaderboard/custom.key"),
    cert: fs.readFileSync("/home/ubuntu/leaderboard/certificate.crt")
  }, app)
  .listen(3000, async () => {
    console.log('server is running');
    await client.connect();
    console.log(await client.ping());
  });
