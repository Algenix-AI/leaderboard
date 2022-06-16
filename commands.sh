#!/bin/bash
# src/redis-cli -c -h clustercfg.leaderboardpushups.8yggea.memorydb.ap-southeast-1.amazonaws.com --tls -p 6379
# ssh -i "Leaderboard.pem" ubuntu@ec2-52-221-235-3.ap-southeast-1.compute.amazonaws.com
# scp -r -i "Leaderboard.pem" ../leaderboard-node/ ubuntu@ec2-52-221-235-3.ap-southeast-1.compute.amazonaws.com:~/
curl -i --header "Content-Type: application/json" --request PUT --data '{"uid": "43", "results": "212"}' http://ec2-18-142-183-69.ap-southeast-1.compute.amazonaws.com/user/addCumulative
#curl -i http://ec2-18-142-183-69.ap-southeast-1.compute.amazonaws.com/user/profile/4
curl -i 'http://ec2-18-142-183-69.ap-southeast-1.compute.amazonaws.com/leaderboard'
#curl -i --request DELETE http://ec2-18-142-183-69.ap-southeast-1.compute.amazonaws.com/user/delete/4

