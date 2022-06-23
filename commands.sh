#!/bin/bash
# ssh -i "Leaderboard.pem" ubuntu@ec2-18-142-183-69.ap-southeast-1.compute.amazonaws.com
# scp -r -i "Leaderboard.pem" ../leaderboard-node/ ubuntu@ec2-18-142-183-69.ap-southeast-1.compute.amazonaws.com:~/
# curl -i --header "Content-Type: application/json" --request POST --data '{"uid": "-noAnBEUpH8pH1IuQQu4n", "scoreOfLatest": "2"}' http://ec2-54-169-153-36.ap-southeast-1.compute.amazonaws.com/pushups/addToUserCumulative
#  curl -i --header "Content-Type: application/json" --request POST --data '{"nickname":"Grass Algae","age":"2","weight":"3",anonymousName:"Fake Penguin","height":"3","gender":"0","anonymous":false,"totalCal":"3800","photoURL":null}' http://ec2-54-169-153-36.ap-southeast-1.compute.amazonaws.com/pushups/addToUserCumulative
# curl -i http://ec2-54-169-153-36.ap-southeast-1.compute.amazonaws.com/pushups/user/profile/-noAnBEUpH8pH1IuQQu4n
# curl -i 'http://ec2-54-169-153-36.ap-southeast-1.compute.amazonaws.com/pushups/leaderboard'
# curl -i 'http://ec2-54-169-153-36.ap-southeast-1.compute.amazonaws.com/user/addCustomUser/'
# curl -i 'http://ec2-54-169-153-36.ap-southeast-1.compute.amazonaws.com/user/getUserStatistics/XMugbNfdE7DZbp9i20IMoDl2981A'
# curl -i --request DELETE http://ec2-54-169-153-36.ap-southeast-1.compute.amazonaws.com/pushups/deleteUser/4
# curl -i --request DELETE http://ec2-54-169-153-36.ap-southeast-1.compute.amazonaws.com/pushups/deleteAllUsers
# curl -i http://ec2-54-169-153-36.ap-southeast-1.compute.amazonaws.com/pushups/addRandomUsers
# Firewall
# sudo ufw allow 3000/tcp
# sudo ufw allow ssh
# sudo ufw allow http
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