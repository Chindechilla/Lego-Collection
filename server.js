/********************************************************************************
* WEB322 – Assignment 05
* 
* I declare that this assignment is my own work in accordance with Seneca's
* Academic Integrity Policy:
* 
* https://www.senecacollege.ca/about/policies/academic-integrity-policy.html
* 
* Name: ___Thi Kieu Trinh Vu_________ Student ID: ___122630221___________ Date: __22nd March 2024____________
*
* Published URL: ___________________________________________________________
*
********************************************************************************/
const legoData = require("./modules/legoSets");
const path = require("path");

const express = require('express');
const app = express();

const HTTP_PORT = process.env.PORT || 8080;
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
  res.render("home")
});

app.get('/about', (req, res) => {
  res.render("about");
});

// Route to render the addSet view with themes
app.get("/lego/addSet", async (req, res) => {
  try {
    const themes = await legoData.getAllThemes();
    res.render("addSet", { themes: themes });
  } catch (err) {
    res.status(500).render("500", { message: `I'm sorry, but we have encountered the following error: ${err}` });
  }
});
// Route to handle form submission and add a new set
app.post("/lego/addSet", async (req, res) => {
  try {
    const setData = req.body;
    await legoData.addSet(setData);
    res.redirect("/lego/sets");
  } catch (err) {
    res.status(500).render("500", { message: `I'm sorry, but we have encountered the following error: ${err}` });
  }
});
// Define routes for editing a set
app.get("/lego/editSet/:num", async (req, res) => {
  try {
    const setNum = req.params.num;
    const set = await legoData.getSetByNum(setNum);
    const themes = await legoData.getAllThemes();
    res.render('editSet', { set, themes });
  } catch (err) {
    res.status(404).render('404', { message: err });
  }
});

app.post("/lego/editSet", async (req, res) => {
  try {
    const setNum = req.body.set_num;
    const setData = {
      name: req.body.name,
      year: req.body.year,
      num_parts: req.body.num_parts,
      theme_id: req.body.theme_id,
      img_url: req.body.img_url
    };
    await legoData.editSet(setNum, setData);
    res.redirect('/lego/sets');
  } catch (err) {
    res.status(500).render('500', { message: `I'm sorry, but we have encountered the following error: ${err}` });
  }
});
app.get("/lego/deleteSet/:num", async (req, res) => {
  try {
      const setNum = req.params.num;
      console.log("Set number to delete:", setNum);
      await legoData.deleteSet(setNum);
      res.redirect('/lego/sets');
  } catch (err) {
      console.error("Error deleting set:", err);
      res.render('500', { message: `I'm sorry, but we have encountered the following error: ${err}` });
  }
});


app.get("/lego/sets", async (req,res)=>{

  let sets = [];

  try{    
    if(req.query.theme){
      sets = await legoData.getSetsByTheme(req.query.theme);
    }else{
      sets = await legoData.getAllSets();
    }

    res.render("sets", {sets})
  }catch(err){
    res.status(404).render("404", {message: err});
  }
  
});

app.get("/lego/sets/:num", async (req,res)=>{
  try{
    let set = await legoData.getSetByNum(req.params.num);
    res.render("set", {set})
  }catch(err){
    res.status(404).render("404", {message: err});
  }
});

app.use((req, res, next) => {
  res.status(404).render("404", {message: "I'm sorry, we're unable to find what you're looking for"});
});

legoData.initialize().then(()=>{
  app.listen(HTTP_PORT, () => { console.log(`server listening on: ${HTTP_PORT}`) });
});