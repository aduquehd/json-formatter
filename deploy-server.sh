#!/bin/sh

git pull
sudo docker compose -f docker-compose.prod.yml build

# Restart services
sudo supervisorctl stop json_viewer
sudo docker compose -f docker-compose.prod.yml down
sudo docker compose -f docker-compose.prod.yml stop
sudo supervisorctl restart json_viewer
