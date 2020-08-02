FROM balenalib/raspberry-pi-python

RUN apt update && apt install nodejs npm git

WORKDIR /usr/src/app

# get 433 utils
RUN git clone --recursive git://github.com/ninjablocks/433Utils.git && \
  cd 433Utils/RPi_utils && \
  git clone git://git.drogon.net/wiringPi && \
  cd wiringPi && \
  ./build && \
  cd .. && \
  cd ../..

CMD nodejs server.js
