FROM ruby:3.2-alpine

# 必要なパッケージをインストール
RUN apk add --no-cache \
    build-base \
    postgresql-dev \
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

EXPOSE 3001

CMD ["rails", "server", "-b", "0.0.0.0", "-p", "3001"]
