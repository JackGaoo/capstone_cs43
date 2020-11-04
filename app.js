const dotenv = require('dotenv');

dotenv.config();
const express = require('express');
const bodyParser = require('body-parser');

const Neo4jApi = require('./neo4j-api');
// const rountes = require('./route')

const app = express();
const db = new Neo4jApi();
const port = process.env.PORT;

app.set('view engine', 'pug');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/Diagnosis', (req, res) => {
  const name = req.body.name;
  db.getSymptoms (name)
    .then((name) => {
      res.json(name);
    })
    .catch(error => res.status(404).send(error));
});

app.post('/create', (req, res) => {
  const name = req.body.name;
  console.log(name);
  db.createNode(name)
    .then(() => res.redirect('/'))
    .catch(error => res.status(500).send(error));
});

app.post('/Diagnosis/prob', async (req, res) => {
  const name = req.body.name;
  let results = [];
  for (let i = 0; i < name.length; i++) {
    console.log("get one node");
    await db.getCondition(name[i])
      .then((nodes) => {
        //console.log(typeof(nodes));
        results = results.concat(nodes);
      })
      .catch(error => res.status(404).send(error));
  }
  // loop result array to count the occurrence of each disease
  let disease_count = {};
  let numSymp = {};
  for (let disease of results) {
    const name = disease.name;
    if (disease_count.hasOwnProperty(name)) {
      disease_count[name] += 1;
    } else {
      // add to size object at first seen
      await db.nodeSize(name)
        .then((n_children) => {
          numSymp[name] = n_children[0];

        })
        .catch(error => res.status(500).send(error));
      disease_count[name] = 1;
    }
  }
  // divide occurrence by number of symptoms under a disease
  for (const [key, value] of Object.entries(numSymp)) {
    disease_count[key] /= (value / 100); // a*100 / b == a / (b/100)
  }
  // console.log(disease_count);

  //get the highest probability
  let list = new Array();
  for (let i in disease_count){
    list.push(disease_count[i]);
    }
    list.sort(function(num1,num2){
      return num2-num1;
    })
    //console.log(list);
    var maxcnt= eval(list[0]);
    console.log(maxcnt);

  //sort the probabilities from big to small by condition names
  key = Object.keys(disease_count).sort(function (a, b){
    return disease_count[b] - disease_count[a]
  })
  console.log(key);
  res.json(key);
  // all["prob"] = disease_count;
  // all["Highest"] = maxcnt;

  //get the highest disease with symptoms
  let currDisease = key[0];
  let currSymps = {};
  await db.getSymptoms (currDisease)
    .then((name) => {
      currSymps = name;
      console.log(currSymps);

    })
    .catch(error => res.status(404).send(error));

  //exclude the mentioned symptoms
  const Symps = {};
  currSymps.forEach(function(al){Symps[al]=al;})
  name.forEach(function(bl){delete Symps[bl];})
  uni_Symps = Object.values(Symps);
  console.log(uni_Symps);
  //choose the first symptom to ask
  let all_sym = {};
  let label;
  let flag;
  for (let i = 0; i < uni_Symps.length; i++){
    let question = ["Do you have the following symptoms?"+uni_Symps[i]];
    console.log(question);
    if (label == "Yes"){
        flag = 1;//If the patient has the symptom.
    }else{
        flag = 0;//If the patient dont have the symptom.
    }
    if (flag == 1){
      all_sym = all_sym.append(uni_Symps[i]);

    }else {
      continue;
    }
  }




})

// // calculate prob after Dialogflow
// app.post("/Diagnosis", async (req, res) => {
//   // get symptoms
//
//   // get the disease with highest probability and then get all its symptoms
//   currDisease = "xxxx";
//   currSymps = ["aa", "bb", "cc", "dd", "ee"];  // return all symptoms of a disease
//   // exclude mentioned symptoms
//   currSymps = currSymps - name;
//   // choose first symptom to ask
//   let symp = currSymps[0];
//   let question = {......};
//   // return prob and question
//   res.json(returned_json);
// })
//
// // obtain answer and re-calculate probability
// app.post("/Diagnosis/QA", async (req, res) => {
//   const symp = req.body.name;
//   const chioce = req.body.choice;
//   if (chioce == "present") {
//     occurrence[currDisease] += 1
//   } // else the occurrence would not change
//   // calculate probability using occurrence and numSymp
//   for (const [key, value] of Object.entries(occurrence)) {
//     prob[key] = occurrence[key] * 100 / numSymp[key];
//   }
//   // check if the probability of current disease is over 95%
//   if (prob[currDisease] < 95) {
//     // remove used symptom
//     currSymps = currSymps - symp;
//     // check how many symptoms left
//     if (currSymps.length > 0) {
//       // get first symptom and ask question again
//       let symp = currSymps[0];
//       let question = {......};
//       // return prob and question
//       res.json(returned_json);
//     } else {
//       // change to second most possible disease
//
//     }
//   } else {
//     res.json(final_result)
//   }

app.post('/clear', (req, res) => {
  db.clearNodes()
    .then(() => res.redirect('/'))
    .catch(error => res.status(500).send(error));
});

app.listen(port,
  () => console.log(`Server listening on http://localhost:${port}`));
