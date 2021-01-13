FROM balenalib/raspberry-pi-python

RUN apt update && apt install nodejs npm git build-essential

WORKDIR /usr/src/app

# get 433 utils
# for this, we probably only need wiringPi
RUN git clone --recursive git://github.com/ninjablocks/433Utils.git && \
  cd 433Utils/RPi_utils && \
  git clone https://github.com/WiringPi/WiringPi wiringPi && \
  cd wiringPi && \
  ./build && \
  cd .. && \
  make all && \
  cd ../..

# build etekCity
COPY build .
RUN gcc -Wall -o etekcityZapTx etekcityZapTx.c -lwiringPi


COPY package.json package-lock.json ./
RUN npm i

COPY mqtt.js .

CMD nodejs mqtt.js
