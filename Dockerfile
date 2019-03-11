FROM node:10-alpine

RUN mkdir -p /app
WORKDIR /app

COPY package.json /app/package.json

RUN apk --no-cache add \
        ca-certificates \
        cyrus-sasl-dev \
        lz4-dev \
        musl-dev \
        openssl-dev && \
    apk --no-cache add --virtual native-deps \
        bash \
        bsd-compat-headers \
        g++ \
        gcc \
        libc-dev \
        libgcc \
        libstdc++ \
        linux-headers \
        make \
        openssl-dev \
        python \
        py-setuptools \
        zlib-dev && \
    npm install --quiet node-gyp -g && \
    yarn && \
    rm -rf /usr/local/share/.cache/yarn && \
    rm -rf ~/.npm && \
    rm -rf ~/.node-gyp && \
    rm -rf /tmp/* && \
    apk del native-deps

COPY . /app

EXPOSE 3000

CMD yarn start