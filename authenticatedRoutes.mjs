import express from 'express';
import admin from "firebase-admin";
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import fs from "fs";
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

router.get('/user/getUserStatistics/:idToken', async (req, res, next) => {
  const idToken = req.params.idToken;
  getAuth()
    .verifyIdToken(idToken)
    .then(async (decodedToken) => {
      const uid = decodedToken.uid;
      const results = await client.json.get(uid);
      res.status(200);
      res.send(results);
    })
    .catch((err) => {
      next(err);
    });
})

export default router;
