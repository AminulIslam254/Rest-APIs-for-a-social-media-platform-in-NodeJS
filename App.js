const { urlencoded } = require('express');
const express = require('express');
const cors = require('cors');
const app = express();
const jwt = require('jsonwebtoken');
const jwt_decode = require("jwt-decode");
const crypto = require("crypto");
const port = process.env.PORT || 5000;
require("dotenv").config();


const { connectMongoose, User } = require("./Database.js");
const { UserPosts } = require("./UserPosts.js");

connectMongoose();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());



app.get("/", (req, res) => {
  res.send("This is home page");
})
app.post("/authenticate", async (req, res) => {
  const { email, password } = req.body;
  var dbarray = []
  await User.find({ email: email })
    .then((result) => {
      dbarray = result;
    })
    .catch((err) => {
      console.log(err);
    })
  if(dbarray.length===0){
    res.send({ message: "Email isn't Present" });
  }
  else if (dbarray[0].email !== email) {
    res.send({ message: "Email isn't correct" });
  }
  else if (dbarray[0].password !== password) {
    res.send({ message: "Password isn't correct" });
  }
  else {
    const user = { email: email, password: password };
    const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET);

    await User.updateOne({ email: email }, { $set: { token: accessToken } });

    res.json({ accessToken: accessToken });
  }

});

const validateToken = (req, res, next) => {
  // console.log(req.headers)
  const bearerHeader = req.headers['authorization'];
  if (bearerHeader === undefined) {
    res.send({ message: "Token is not valid" });
  }
  const bearer = bearerHeader.split(' ');
  const token = bearer[1];
  // console.log(token)
  req.token = token;
  next();
}

app.post("/follow/:id", validateToken, async (req, res) => {
  const { id } = req.params;
  let secretKey = process.env.ACCESS_TOKEN_SECRET;

  let var1;
  jwt.verify(req.token, secretKey, (err, auth) => {
    if (err) {
      var1 = "invalid";
    }
    else {
      var1 = auth;
    }
  });
  if (var1 === "invalid") {
    res.send({ message: "Invalid Token" });
  }
  else {
    const { email } = var1;


    var dbarray = {}
    await User.find({ _id: id })
      .then((result) => {
        dbarray = result;
      })
      .catch((err) => {
        console.log(err);
      })
    let initialArray = [];
    if (dbarray[0].no_of_followers === undefined) {
      initialArray.push(email);

    }
    else {
      initialArray = dbarray[0].no_of_followers;
      initialArray.push(email);
    }



    await User.updateOne({ _id: id }, { $set: { no_of_followers: initialArray } });

    dbarray = []
    await User.find({ email: email })
      .then((result) => {
        dbarray = result;
      })
      .catch((err) => {
        console.log(err);
      })
    initialArray = [];
    if (dbarray[0].no_of_followings === undefined) {
      initialArray.push(id);

    }
    else {
      initialArray = dbarray[0].no_of_followings;
      initialArray.push(id);
    }

    await User.updateOne({ email: email }, { $set: { no_of_followings: initialArray } });

    res.send({ message: "Id has been followed" });
  }



});


app.post('/unfollow/:id', validateToken, async (req, res) => {
  const { id } = req.params;
  let secretKey = process.env.ACCESS_TOKEN_SECRET;

  let var1;
  jwt.verify(req.token, secretKey, (err, auth) => {
    if (err) {
      var1 = "invalid";
    }
    else {
      var1 = auth;
    }
  });
  if (var1 === "invalid") {
    res.send({ message: "Invalid Token" });
  }
  else {
    const { email } = var1;
    var dbarray = [];
    await User.find({ _id: id })
      .then((result) => {
        dbarray = result;
      })
      .catch((err) => {
        console.log(err);
      })
    let initialArray = dbarray[0].no_of_followers;
    let index = initialArray.indexOf(email);
    if (index > -1) {
      initialArray.splice(index, 1);
    }


    await User.updateOne({ _id: id }, { $set: { no_of_followers: initialArray } });


    dbarray = [];
    await User.find({ email: email })
      .then((result) => {
        dbarray = result;
      })
      .catch((err) => {
        console.log(err);
      })
    initialArray = dbarray[0].no_of_followings;
    index = initialArray.indexOf(id);
    if (index > -1) {
      initialArray.splice(index, 1);
    }


    await User.updateOne({ email: email }, { $set: { no_of_followings: initialArray } });

    res.send({ message: "Id has been unfollowed" });
  }

});


app.get('/user', validateToken, async (req, res) => {
  let secretKey = process.env.ACCESS_TOKEN_SECRET;
  let var1;
  jwt.verify(req.token, secretKey, (err, auth) => {
    if (err) {
      var1 = "invalid";
    }
    else {
      var1 = auth;
    }
  });
  // console.log(var1);
  if (var1 === "invalid") {
    res.send({ message: "Invalid Token" });
  }
  else {
    const email = var1.email;
    var dbarray = {}
    await User.find({ email: email })
      .then((result) => {
        dbarray = result;
      })
      .catch((err) => {
        console.log(err);
      })
    let lenFollower = 0;
    let lenFollowing = 0;
    if (dbarray[0].no_of_followers !== undefined) {
      lenFollower = dbarray[0].no_of_followers.length;
    }
    if (dbarray[0].no_of_following !== undefined) {
      lenFollower = (dbarray[0].no_of_following).length;
    }

    let obj = { username: dbarray[0]._doc.username, noOfFollowers: lenFollower, noOfFollowing: lenFollowing };
    console.log(obj)
    res.send({ message: obj })

  }
});

app.post('/posts', validateToken, async (req, res) => {
  let secretKey = process.env.ACCESS_TOKEN_SECRET;
  let var1;
  jwt.verify(req.token, secretKey, (err, auth) => {
    if (err) {
      var1 = "invalid";
    }
    else {
      var1 = auth;
    }
  });
  // console.log(var1);
  if (var1 === "invalid") {
    res.send({ message: "Invalid Token" });
  }
  else {
    var dbarray = []
    const { title, description } = req.body;
    var today = new Date();
    const obj = new UserPosts({
      title: title, description: description, createdTime: today, email: var1.email,
    })
    let var2 = await obj.save();
    res.send({ title: var2.title, description: var2.description, post_id: var2._id.toString(), createdTime: var2.createdTime })
  }
})

app.delete("/posts/:id", validateToken, async (req, res) => {
  let secretKey = process.env.ACCESS_TOKEN_SECRET;
  let var1;
  jwt.verify(req.token, secretKey, (err, auth) => {
    if (err) {
      var1 = "invalid";
    }
    else {
      var1 = auth;
    }
  });
  // console.log(var1);
  if (var1 === "invalid") {
    res.send({ message: "Invalid Token" });
  }
  else {
    const { id } = req.params;
    var dbarray = []
    await UserPosts.find({ _id: id })
      .then((result) => {
        dbarray = result;
      })
      .catch((err) => {
        console.log(err);
      })

    if (dbarray[0].email === var1.email) {
      await UserPosts.deleteOne({ _id: id });
      res.send({ message: "Post is deleted" });
    } else {
      res.send({ message: "Invalid User" });
    }
  }



});

app.post("/like/:id", validateToken, async (req, res) => {
  let secretKey = process.env.ACCESS_TOKEN_SECRET;
  let var1;
  jwt.verify(req.token, secretKey, (err, auth) => {
    if (err) {
      var1 = "invalid";
    }
    else {
      var1 = auth;
    }
  });
  // console.log(var1);
  if (var1 === "invalid") {
    res.send({ message: "Invalid Token" });
  }
  else {
    const { id } = req.params;
    var dbarray = []
    await UserPosts.find({ _id: id })
      .then((result) => {
        dbarray = result;
      })
      .catch((err) => {
        console.log(err);
      })

    let likeArray = dbarray[0].likes;
    likeArray.push(var1.email);



    await UserPosts.updateOne({ _id: id }, { $set: { likes: likeArray } });

    res.send({ message: "Post is liked" });
  }
});


app.post("/unlike/:id", validateToken, async (req, res) => {
  let secretKey = process.env.ACCESS_TOKEN_SECRET;
  let var1;
  jwt.verify(req.token, secretKey, (err, auth) => {
    if (err) {
      var1 = "invalid";
    }
    else {
      var1 = auth;
    }
  });

  if (var1 === "invalid") {
    res.send({ message: "Invalid Token" });
  }
  else {
    const { id } = req.params;
    var dbarray = []
    await UserPosts.find({ _id: id })
      .then((result) => {
        dbarray = result;
      })
      .catch((err) => {
        console.log(err);
      })

    let likeArray = dbarray[0].likes;
    const index = likeArray.indexOf(var1.email);
    if (index > -1) {
      likeArray.splice(index, 1);
    }

    await UserPosts.updateOne({ _id: id }, { $set: { likes: likeArray } });

    res.send({ message: "Post is unliked" });
  }
});



app.post("/comment/:id", validateToken, async (req, res) => {
  let secretKey = process.env.ACCESS_TOKEN_SECRET;
  let var1;
  jwt.verify(req.token, secretKey, (err, auth) => {
    if (err) {
      var1 = "invalid";
    }
    else {
      var1 = auth;
    }
  });
  // console.log(var1);
  if (var1 === "invalid") {
    res.send({ message: "Invalid Token" });
  }
  else {
    const { id } = req.params;
    const { comment } = req.body;

    var dbarray = {}
    await UserPosts.find({ _id: id })
      .then((result) => {
        dbarray = result;
      })
      .catch((err) => {
        console.log(err);
      })


    let commentsArray = dbarray[0].comments;

    const commentId = crypto.randomBytes(16).toString("hex");

    commentsArray.push({ id: commentId, comment: comment });




    await UserPosts.updateOne({ _id: id }, { $set: { comments: commentsArray } });

    res.send({ commentId: commentId });
  }
});


app.get("/posts/:id", async (req, res) => {

  const { id } = req.params;

  var dbarray = {}
  await UserPosts.find({ _id: id })
    .then((result) => {
      dbarray = result;
    })
    .catch((err) => {
      console.log(err);
    })
  // console.log(dbarray);



  if (dbarray.length === 0) {
    res.send({ message: "Post with that ID doesn't exists " });
  }
  else {
    let returnArray = [];
    returnArray.push({ id: id, number_of_likes: dbarray[0].likes.length, number_of_comments: dbarray[0].comments.length, });
    res.send({ data: returnArray });
  }

});


app.get("/all_posts/", validateToken, async (req, res) => {

  let secretKey = process.env.ACCESS_TOKEN_SECRET;
  let var1;
  jwt.verify(req.token, secretKey, (err, auth) => {
    if (err) {
      var1 = "invalid";
    }
    else {
      var1 = auth;
    }
  });
  // console.log(var1);
  if (var1 === "invalid") {
    res.send({ message: "Invalid Token" });
  }
  else {
    let var1 = jwt.decode(req.token);
    const { email } = var1;

    var dbarray = {}
    await UserPosts.find({ email: email }).sort({ createdTime: 1 })
      .then((result) => {
        dbarray = result;
      })
      .catch((err) => {
        console.log(err);
      })

    // console.log(dbarray);

    let returnArray = [];

    for (let key in dbarray) {
      let id = dbarray[key]._id;
      returnArray.push({
        id: id.toString(), title: dbarray[key].title, description: dbarray[key].description,
        createdTime: dbarray[key].createdTime, comments: dbarray[key].comments, likes: dbarray[key].likes
      });
    }

    res.send({ data: returnArray });

  }

});



app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
})