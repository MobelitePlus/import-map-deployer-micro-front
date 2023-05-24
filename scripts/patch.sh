#!/bin/bash

host=192.168.66.212:31602
Green='\033[1;32m'
Red='\033[1;31m'
Blue='\033[1;34m'
NC='\033[0m'

# Get User Credential
read -p "Username: " USERNAME
stty -echo
printf "Password: "
read PASSWORD
stty echo
printf "\n"

# Ask For Env
read -p "which env ? : " ENV

# Send Patch Request
printf "${Blue}Sending Patch Request ...${NC}\n"

if curl --fail -X PATCH $USERNAME:$PASSWORD@${host}/import-map.json?env=$ENV --data "@import-map.json"  -H "Accept: application/json" -H "Content-Type: application/json"; then
    printf "\nPatch ${Green}Success${NC}\n"
else
    printf "\nPatch ${Red}Fail${NC}\n"
fi;


