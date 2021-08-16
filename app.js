const express = require("express");
const app = express();
const PORT = 1000;
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const bodyParser = require("body-parser");
const nominee = require("./models/nominee");
const voter = require("./models/voter");
const db = "mongodb://localhost/i-vote";

// app.set("view engine", "ejs");
// app.use(express.static(__dirname + "/uploads"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.json());
mongoose.set("useFindAndModify", false);
mongoose.set("useCreateIndex", true);
mongoose.set("useUnifiedTopology", true);
app.use(cors());
app.use(helmet());

(async function () {
  try {
    await mongoose.connect(db, { useNewUrlParser: true });
    return console.log(`Successfully connected to ${db}`);
  } catch (error) {
    console.log("Error connecting to database: ", error);
    return process.exit(1);
  }
})();

app.get("/candidate", async (req, res) => {
  try {
    let allcandidate = await nominee.nomineeModel.find();
    console.log(allcandidate);
    if (allcandidate.length == []) {
      res.send("no candidate yet");
    } else {
      let totalcandidate = allcandidate.length;
      //console.log(totalcandidate);

      res.json({
        //category: await category.find(),
        allcandidate: allcandidate,
        allcandidateInAParticularCat: allcandidate[0].votes[0],

        totalcandidate: totalcandidate,
      });
    }
  } catch (error) {
    console.log(error);
    res.send("Contact ed_knowah for a fix");
  }
});

// add a candidate
app.post("/addCandidate", async (req, res) => {
  const { firstname, lastname, category, email } = req.body;

  const foundCandidate = await nominee.nomineeModel.findOne({
    email: email,
    category: category,
  });
  //console.log(foundCandidate);

  if (foundCandidate) {
    return res.send("candidate is already in that category");
  } else {
    //update the cantidate details
    const updatePerson = await nominee.nomineeModel.findOneAndUpdate(
      { email: email },
      {
        $push: { category: category },
      },
      { new: true }
    );

    if (!updatePerson) {
      const candidate = new nominee.nomineeModel();
      candidate.firstname = firstname;
      candidate.lastname = lastname;
      candidate.category = category;
      candidate.email = email;

      await candidate.save((err, saved) => {
        if (err) {
          console.log(err);
        }
        console.log(saved);
        res.send("Created a new user");
      });
    }
  }

  let allcandidate = await nominee.nomineeModel.find();
  res.json({
    candidate: allcandidate,
  });
});

app.post("/vote", async (req, res) => {
  const { email, voter_id, category } = req.body;

  // console.log(req.body);

  const voterDetails = { voter_id: voter_id, category: category };

  try {
    const foundVoter = await nominee.nomineeModel.find({
      "votes.voter_id": voter_id,
      category: category,
      email: email,
    });
    const foundCandidate = await nominee.nomineeModel.findOne({
      email: email,
      category: category,
    });
    //console.log(foundCandidate)
    //console.log(foundVoter.length);

    // find candidate and vote
    if (foundVoter.length == 0) {
      if (foundCandidate) {
        foundCandidate.votes.push(voterDetails);
        //console.log(foundCandidate.votes);

        //console.log(arr)
        foundCandidate.save((err, saved) => {
          if (err) {
            console.log(err);
          }
          //console.log(saved);
        });
        res.send("voted!!");
      }
    } else {
      res.send("You can only vote once");
    }

    if (!foundCandidate) {
      return res.json({
        found: "false",
        message: `no candidate with that email ${email} or category ${category}`,
      });
    }
  } catch (error) {
    return res.json({
      vote: false,
      message: "sorry can't vote at this time contact ed_knowah",
    });
  }
});

// get candidates in a particular category
app.get("/candidate/:category", async (req, res) => {
  // find candidates in a particular category
  try {
    const category = req.params.category;
    const foundCandidate = await nominee.nomineeModel.find({
      // "votes.category": category,
      category: category,
    });

    if (foundCandidate.length == 0 || null) {
      res.json({
        found: false,
        msg: ` I guess there is no category like ${category}`,
      });
    } else {
      res.send(foundCandidate);
    }
  } catch (error) {
    console.log(error);
    res.send(
      ` There was an error somewhere, its likely from the server. Kindly contact ed_knowah to fix it😎`
    );
  }
});

// get winner in a particular category
app.get("/candidate/top/:category", async (req, res) => {
  try {
    const category = req.params.category;
    const foundCandidate = await nominee.nomineeModel.find({
      "votes.category": category,
    });
    console.log(foundCandidate);

    if (foundCandidate.length == 0 || null) {
      res.json({
        found: false,
        msg: ` I guess there is no vote or nominee in ${category} or still, that category does not exist, I might be wrong`,
      });
    } else {
      let votesArray = [];
      for (let i = 0; i < foundCandidate.length; i++) {
        for (let j = 0; j < foundCandidate[i].votes.length; j++) {
          //console.log(foundCandidate[i].votes[j].category);

          if (foundCandidate[i].votes[j].category === category) {
            votesArray.push(foundCandidate[i]._id); //+ " " + foundCandidate[i].votes[j].category)
          }
        }
      }
      //console.log(votesArray);
      let itemsMap = {};
      let userId = 0;
      let maxCount = 0;

      for (let item of votesArray) {
        // 4
        if (itemsMap[item] == null) {
          itemsMap[item] = 1;
        } else {
          itemsMap[item]++;
        }
        if (itemsMap[item] > maxCount) {
          userId = item;
          maxCount = itemsMap[item];
        }
      }
      console.log(`Value : ${userId}, Count : ${maxCount}`);

      const foundWinner = await nominee.nomineeModel.findOne({
        _id: userId,
      });

      //console.log(foundWinner.firstname);
      res.json({
        //votesArray: votesArray,

        winnerVoteCount: maxCount,
        winnerDetails: foundWinner,
        //foundCandidates: foundCandidate,
      });
    }
  } catch (error) {
    console.log(error);
    res.send(
      ` There was an error somewhere, its likely from the server. Kindly contact ed_knowah to fix it😎`
    );
  }
});

app.listen(PORT, () => {
  console.log(`App is running on port ${PORT}....`);
});
