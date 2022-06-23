import express from "express";
import https from 'https';
import fs from 'fs';

const app = express();
app.use(express.json());
app.use(function (req, res, next) {
  const origin = req.headers.origin;
  // if (allowedOrigins.some(x => x.test(origin))) {
    res.header("Access-Control-Allow-Origin", '*');
  // }
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
})

// Create an try point route for the Express app listening on port 4000.
// This code tells the service to listed to any request coming to the / route.
// Once the request is received, it will display a message "Hello from express server."
app.get('/', (req,res)=>{
  res.send("Hello from express server.")
})


// app.listen(3000, async () => {
//   console.log("server is running");
// });


https
  .createServer({
    key: fs.readFileSync("custom.key"),
    cert: fs.readFileSync("certificate.crt")
  }, app)
  .listen(3000, ()=>{
    console.log('server is runing at port 4000')
  });
