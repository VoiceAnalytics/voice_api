const dotenv = require('dotenv').config()
const needle = require('needle');
const mongoose = require('mongoose');
const schedule = require('node-schedule');
const moment = require('moment');

const voiceURL = 'https://app.voice.com/graphql?operationName=Profile&'

// Apollo GraphQL API Parameters
const voiceExt = {
                    "persistedQuery":
                    {
                      "version": 1,
                      "sha256Hash": "9fb91f25f94918e13f0807aee8ae072a64c5a8437181ded39460d4480e906d56"
                    }
                  }


let collections = {};

mongoose.connect(process.env.DBURL, { useNewUrlParser: true, useUnifiedTopology: true}, function(err, client) {
  
  if (err) {
    return console.log(err)
  }

  const db = client.connection;
  collections.posts = db.collection('posts');
  collections.profiles = db.collection('profiles');

  collections.posts.aggregate([
      {"$group" : {_id:{username:"$post.author.username",name:"$post.author.name"}, count:{$sum:1}}},
      {$sort:{"count":-1}}
  ]).toArray(async function(err, posts) {
    console.log("Loaded Profiles:", posts.length)
    for (var i in posts) {
      var user_profile = await grabProfile(posts[i]._id.username)
      if (user_profile.data.profile) {
        await upsertProfile(user_profile.data.profile)
      } else {
        console.log("Error:", posts[i]._id.username)
      }

    }

  })

})


function grabProfile(username) {

  var voiceVars = {username: username}

  return new Promise(function(resolve, reject) {
    needle.get(voiceURL + 
      '&variables=' +
      encodeURIComponent(JSON.stringify(voiceVars)) +
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

function upsertProfile(profile) {
  return new Promise(function(resolve, reject) {
    collections.profiles.findOneAndUpdate(
      { "profile.account": profile.account },
      { $set: { profile } },
      { upsert: true }, 
      function (err, profileresult) {
        if (err) {
          console.log(err)
          reject()
          return;
        }
        if (!profileresult.lastErrorObject.updatedExisting) {
          console.log("Added Profile:", profile.account )
        } else {
          console.log("Updated Profile:", profile.account )
        }
        resolve()
      }

    );
  })
}