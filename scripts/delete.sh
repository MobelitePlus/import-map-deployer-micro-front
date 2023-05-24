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

# Ask For Service
read -p "which Service you want to delete ? : " SERVICE

# Send Delete Request
printf "${Blue}Sending Delete Request ...${NC}\n"

if curl --fail -X DELETE $USERNAME:$PASSWORD@${host}/services/%40plateforme-sifast%2F$SERVICE?env=$ENV ; then
    printf "\nDelete ${Green}Success${NC}\n"
else
    printf "\nDelete ${Red}Fail${NC}\n"
fi;


