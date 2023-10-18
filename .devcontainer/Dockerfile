FROM mcr.microsoft.com/devcontainers/typescript-node:1-20-bullseye

RUN npm install -g npm@10.2.0

RUN sudo apt -y update

RUN sudo apt -y install build-essential clang libdbus-1-dev libgtk-3-dev \
                       libnotify-dev libasound2-dev libcap-dev \
                       libcups2-dev libxtst-dev \
                       libxss1 libnss3-dev gcc-multilib g++-multilib curl \
                       gperf bison python3-dbusmock
