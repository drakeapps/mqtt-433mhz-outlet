FROM balenalib/raspberry-pi-python

RUN apt update && apt install nodejs npm git build-essential

WORKDIR /usr/src/app

# get 433 utils
RUN git clone --recursive git://github.com/ninjablocks/433Utils.git && \
  cd 433Utils/RPi_utils && \
  git clone https://github.com/WiringPi/WiringPi wiringPi && \
  cd wiringPi && \
  ./build && \
  cd .. && \
  cd ../..

COPY etekcityZapTx.c .

RUN gcc etekcityZapTX.c

COPY server.js .

CMD nodejs server.js
