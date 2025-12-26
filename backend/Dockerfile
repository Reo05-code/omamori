FROM ruby:3.2-alpine

RUN apk add --no-cache \
        build-base \
        postgresql-dev \
    postgresql-client \
        tzdata \
        bash \
        git \
        nodejs \
        npm \
        yaml-dev

WORKDIR /app

# Gemfileをコピーしてbundle install
COPY Gemfile Gemfile.lock ./
RUN bundle install

# アプリケーションコードをコピー
COPY . .

# ログディレクトリとtmpディレクトリの権限を設定
RUN mkdir -p log tmp/pids tmp/cache tmp/sockets && \
    chmod -R 777 log tmp

# Make sure our start script is executable
RUN chmod +x bin/start || true

EXPOSE 3001

# Use start wrapper (runs migrations then puma)
CMD ["bash", "-lc", "bin/start"]
