import express from 'express';
import admin from "firebase-admin";
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import fs from "fs";
import { randomName } from "./anonNameGen.js";
import client from "./client.mjs";

//in leaderboard.service, the line FIREBASE_AUTH_EMULATOR_HOST="localhost:9099" enables any auth request made from the emulator https://firebase.google.com/docs/emulator-suite/connect_auth#instrumentauth

const router = express.Router();

// a more secure way to import serviceAccount is to export it as an env variable
// export GOOGLE_APPLICATION_CREDENTIALS="./serviceAccount.json"
// initializeApp({
//   credential: applicationDefault(),
// });

const serviceAccount = JSON.parse(fs.readFileSync('/home/ubuntu/leaderboard/serviceAccount.json', { encoding: 'utf8' }));

initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const verifyToken = async (idToken) => {
  return await getAuth()
    .verifyIdToken(idToken)
}

router.get('/user/getUserStatistics/:idToken', async (req, res, next) => {
  try {
    const decodedToken = await verifyToken(req.params.idToken);
    const uid = decodedToken.uid;
    const results = await client.json.get(uid);
    res.status(200);
    res.send(results);
  } catch (err) {
    next(err);
  }
})

router.get('/user/getUserPhotoURL/:idToken', async (req, res, next) => {
  try {
    const decodedToken = await verifyToken(req.params.idToken);
    const uid = decodedToken.uid;
    const results = await client.json.get(uid, {
      path: ['.photoURL']
    });
    res.status(200);
    res.send(results);
  } catch (err) {
    next(err);
  }
})

router.post('/user/addUserStatistics/:idToken', async (req, res, next) => {
  try {
    const decodedToken = await verifyToken(req.params.idToken);
    const uid = decodedToken.uid;
    const { userProfileStatistics } = req.body;
    await client.json.set(uid, '$', { ...userProfileStatistics, anonymousName: randomName() });
    res.sendStatus(200);
  } catch (err) {
    next(err);
  }
})

//todo make this safer, if client accidentally sends the same request twice
router.post('/:exercise/addToUserCumulative/:idToken', async (req, res, next) => {
  try {
    const decodedToken = await verifyToken(req.params.idToken);
    const uid = decodedToken.uid;
    const exercise = req.params.exercise;
    const { scoreOfLatest } = req.body;
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

router.put('/addGroupCodeToUser/:groupCode/:idToken', async (req, res, next) => {
  try {
    const decodedToken = await verifyToken(req.params.idToken);
    const uid = decodedToken.uid;
    const groupCode = req.params.groupCode;
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

router.get('/getLeaderboardName/:groupCode/:idToken', async (req, res, next) => {
  try {
    await verifyToken(req.params.idToken);
    res.send({
      leaderboardName: await client.json.get(req.params.groupCode, {
        path: ['.leaderboardName']
      })
    })
  } catch (err) {
    next(err);
  }
})

export default router;
