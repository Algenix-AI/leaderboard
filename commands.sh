#!/bin/bash
# ssh -i "Leaderboard.pem" ubuntu@ec2-52-221-235-3.ap-southeast-1.compute.amazonaws.com
# scp -r -i "Leaderboard.pem" ../leaderboard-node/ ubuntu@ec2-52-221-235-3.ap-southeast-1.compute.amazonaws.com:~/
# curl -i --header "Content-Type: application/json" --request PUT --data '{"uid": "887879", "results": "1122"}' http://ec2-18-142-183-69.ap-southeast-1.compute.amazonaws.com/user/addCumulative
# curl -i http://ec2-18-142-183-69.ap-southeast-1.compute.amazonaws.com/user/profile/4
 curl -i 'http://ec2-18-142-183-69.ap-southeast-1.compute.amazonaws.com/leaderboard'
# curl -i --request DELETE http://ec2-18-142-183-69.ap-southeast-1.compute.amazonaws.com/user/delete/4
# curl -i --request DELETE http://ec2-18-142-183-69.ap-southeast-1.compute.amazonaws.com/user/deleteAll
#curl -i http://ec2-18-142-183-69.ap-southeast-1.compute.amazonaws.com/user/addRandom
