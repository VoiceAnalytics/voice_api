const dotenv = require('dotenv').config()
const needle = require('needle');
const mongoose = require('mongoose');
const schedule = require('node-schedule');
const moment = require('moment');

const voiceURL = 'https://app.voice.com/graphql?operationName=PostFeed&'

// Apollo GraphQL API Parameters
const voiceExt = {
                    "persistedQuery":
                    {
                      "version": 1,
                      "sha256Hash": "1b9e92d5d212f09e8abaf6c42fca90f46fd71e5378c9849173eed5480cda740f"
                    }
                  }

// Query
const voiceVars = {
                    "type": "MOST_RECENT", // MOST_ACTIVE etc
                    "category_id": "",
// Query For getting Next Page: voicePosts.data.postFeed.pageInfo.endCursor
/*
                    "after":
                    {
                      "account": "vv1tydbix3le",
                      "post_id": "1600622305-1"
                    }
*/
                  }

let collections = {};

mongoose.connect(process.env.DBURL, { useNewUrlParser: true, useUnifiedTopology: true}, function(err, client) {
  
  if (err) {
    return console.log(err)
  }

  const db = client.connection;
  collections.posts = db.collection('posts');

  if (process.argv[2] == "history") {
    // Get History
    // This will run for a while and may get you rate-limited
    runAll()

  } else {

    // Run Now
    run()

    // Run on the minute every 5 minutes
    var j = schedule.scheduleJob('0 */5 * * * *', function(){
      run()
    });

  }

})



async function run() {
  console.log("Fetching Posts", moment(Date.now()).format())

  var voicePosts = await grabVoice()

  if (typeof voicePosts.errors !== 'undefined') {
    console.log("API Error", voicePosts.errors)
    return;
  }

  for (var i in voicePosts.data.postFeed.posts) {
    //console.log(voicePosts.data.postFeed.posts[i].post_id)
    await addUniquePost(voicePosts.data.postFeed.posts[i])
  }
  
  // Go Back One Page
  if (voicePosts.data.postFeed.pageInfo.hasNextPage) {

    voicePosts = await grabVoice(
      {
        "account": voicePosts.data.postFeed.pageInfo.endCursor.account,
        "post_id": voicePosts.data.postFeed.pageInfo.endCursor.post_id
      }
    )
    
    if (typeof voicePosts.errors !== 'undefined') {
      console.log("API Error", voicePosts.errors)
      return;
    }
    
    for (var i in voicePosts.data.postFeed.posts) {
      await addUniquePost(voicePosts.data.postFeed.posts[i])
    }

  }
  
}

// Test Function to Keep Traversing Back
async function runAll() {
  var voicePosts = await grabVoice()

  for (var i in voicePosts.data.postFeed.posts) {
    await addUniquePost(voicePosts.data.postFeed.posts[i])
  }

  if (typeof voicePosts.errors !== 'undefined') {
    console.log("API Error", voicePosts.errors)
    hasNextPage = false
    return;
  }

  var hasNextPage = voicePosts.data.postFeed.pageInfo.hasNextPage

  do {
    voicePosts = await grabVoice(
      {
        "account": voicePosts.data.postFeed.pageInfo.endCursor.account,
        "post_id": voicePosts.data.postFeed.pageInfo.endCursor.post_id
      }
    )
    
    if (typeof voicePosts.errors !== 'undefined') {
      console.log("API Error", voicePosts.errors)
      hasNextPage = false
      return;
    }

    hasNextPage = voicePosts.data.postFeed.pageInfo.hasNextPage    

    for (var i in voicePosts.data.postFeed.posts) {
      await addUniquePost(voicePosts.data.postFeed.posts[i])
    }

  }
  while (hasNextPage);

}

function grabVoice(after) {

  voiceVarsTmp = voiceVars

  if (after) {
    voiceVarsTmp.after = after
  }

  return new Promise(function(resolve, reject) {
    needle.get(voiceURL + 
      '&variables=' +
      encodeURIComponent(JSON.stringify(voiceVarsTmp)) +
      '&extensions=' +
      encodeURIComponent(JSON.stringify(voiceExt))
      , function(error, response) {
      if (!error) {
        
        //console.log(response.body);
        resolve(response.body)

      }
      // API Error
      else {
        reject()
      }
    });
  });
}

function addUniquePost(post) {
  return new Promise(function(resolve, reject) {
    collections.posts.findOneAndUpdate(
      { "post.post_id": post.post_id },
      { $set: { post } },
      { upsert: true }, 
      function (err, postsresult) {
        if (err) {
          console.log(err)
          reject()
          return;
        }
        if (!postsresult.lastErrorObject.updatedExisting) {
          console.log("Added Post:", post.post_id )
        }
        resolve()
      }

    );
  })
}
