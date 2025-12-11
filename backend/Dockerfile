FROM ruby:3.2-alpine

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

# Run migrations on container start (safe to re-run) then boot Puma
CMD ["bash", "-lc", "bundle exec rails db:migrate && bundle exec puma -C config/puma.rb"]
