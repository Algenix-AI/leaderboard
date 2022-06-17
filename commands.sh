#!/bin/bash
# ssh -i "Leaderboard.pem" ubuntu@ec2-18-142-183-69.ap-southeast-1.compute.amazonaws.com
# scp -r -i "Leaderboard.pem" ../leaderboard-node/ ubuntu@ec2-18-142-183-69.ap-southeast-1.compute.amazonaws.com:~/
# curl -i --header "Content-Type: application/json" --request PUT --data '{"uid": "887879", "results": "1122"}' http://ec2-18-142-183-69.ap-southeast-1.compute.amazonaws.com/user/addCumulative
# curl -i http://ec2-54-169-153-36.ap-southeast-1.compute.amazonaws.com/user/profile/4
 curl -i 'http://ec2-54-169-153-36.ap-southeast-1.compute.amazonaws.com/leaderboard'
# curl -i --request DELETE http://ec2-54-169-153-36.ap-southeast-1.compute.amazonaws.com/user/delete/4
# curl -i --request DELETE http://ec2-54-169-153-36.ap-southeast-1.compute.amazonaws.com/user/deleteAll
#curl -i http://ec2-54-169-153-36.ap-southeast-1.compute.amazonaws.com/user/addRandom

# Firewall
# sudo ufw allow 3000/tcp
# sudo ufw allow ssh
# sudo ufw allow http
# cd /etc/ufw
# sudo nano before.rules
# sudo ln -s ./leaderboard/leaderboard.service /lib/systemd/system/leaderboard.service
#*nat
#:PREROUTING ACCEPT [0:0]
#-A PREROUTING -p tcp --dport 80 -j REDIRECT --to-port 3000
#COMMIT
# sudo ufw enable

# Systemd Daemon
# sudo systemctl daemon-reload
# sudo systemctl start leaderboard
# sudo journalctl -f -u leaderboard