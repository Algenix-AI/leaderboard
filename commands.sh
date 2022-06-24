#!/bin/bash
# ssh -i "Leaderboard.pem" ubuntu@ec2-18-142-183-69.ap-southeast-1.compute.amazonaws.com
# scp -r -i "Leaderboard.pem" ../leaderboard-node/ ubuntu@ec2-18-142-183-69.ap-southeast-1.compute.amazonaws.com:~/
# curl -i --header "Content-Type: application/json" --request POST --data '{"uid": "-noAnBEUpH8pH1IuQQu4n", "scoreOfLatest": "2"}' http://13.228.86.60/pushups/addToUserCumulative
#  curl -i --header "Content-Type: application/json" --request POST --data '{"nickname":"Grass Algae","age":"2","weight":"3",anonymousName:"Fake Penguin","height":"3","gender":"0","anonymous":false,"photoURL":null}' http://13.228.86.60/pushups/addToUserCumulative
# curl -i http://13.228.86.60/pushups/user/-noAnBEUpH8pH1IuQQu4n
# curl -i 'http://13.228.86.60/pushups/leaderboard'
# curl -i 'http://13.228.86.60/user/addCustomUser/'
# curl -i 'http://13.228.86.60/user/getUserStatistics/XMugbNfdE7DZbp9i20IMoDl2981A'
# curl -i --request DELETE http://13.228.86.60/pushups/deleteUser/4
# curl -i --request DELETE http://13.228.86.60/pushups/deleteAllUsers
# curl -i http://13.228.86.60/pushups/addRandomUsers
# Firewall
# sudo ufw allow 3000/tcp
# sudo ufw allow ssh
# sudo ufw allow http
# sudo ufw allow https
# cd /etc/ufw
# sudo nano before.rules
# *nat
#:PREROUTING ACCEPT [0:0]
#-A PREROUTING -p tcp --dport 80 -j REDIRECT --to-port 3000
#COMMIT
# sudo ufw enable

# Systemd Daemon
# sudo systemctl daemon-reload
# sudo systemctl start leaderboard
# sudo systemctl status leaderboard
# sudo systemctl restart leaderboard
# sudo journalctl -f -u leaderboard