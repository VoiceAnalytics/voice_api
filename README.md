# Voice Post Feed API Collector

Pulls the post feed from Voice's graphQL api and saves unique posts into a database.

Voice appears to be using [Apollo GraphQL](https://www.apollographql.com/) I am not an expert at this :)

Recommend metabase for analytics.

If you just want the posts - sample data (16k+ posts) in `./sampledata/posts.json`

API Link:

[https://app.voice.com/graphql?operationName=PostFeed&variables=%7B%22type%22%3A%22MOST_RECENT%22%2C%22category_id%22%3A%22%22%7D&extensions=%7B%22persistedQuery%22%3A%7B%22version%22%3A1%2C%22sha256Hash%22%3A%221b9e92d5d212f09e8abaf6c42fca90f46fd71e5378c9849173eed5480cda740f%22%7D%7D](https://app.voice.com/graphql?operationName=PostFeed&variables=%7B%22type%22%3A%22MOST_RECENT%22%2C%22category_id%22%3A%22%22%7D&extensions=%7B%22persistedQuery%22%3A%7B%22version%22%3A1%2C%22sha256Hash%22%3A%221b9e92d5d212f09e8abaf6c42fca90f46fd71e5378c9849173eed5480cda740f%22%7D%7D)

**Note:** the ` "sha256Hash": "1b9e92d5d212f09e8abaf6c42fca90f46fd71e5378c9849173eed5480cda740f" ` of the query is likely to change. Update the hash in the top of ` app.js `.

## Installation

```
npm install
```

## Configuration

Rename .env.sample to .env
Update `DBURL=` to point to a mongodb database

## Running

To trawl back through the history:

```
node app history
```

To grab the feed every 5 minutes and save unique posts

```
node app
```
