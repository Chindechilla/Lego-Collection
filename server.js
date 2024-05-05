require('dotenv').config();
const legoData = require("./modules/legoSets");
const authData = require("./modules/auth-service");
const path = require('path');

const clientSessions = require("client-sessions");
const express = require("express");
const app = express();

const HTTP_PORT = process.env.PORT || 8080;
app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

app.use(
  clientSessions({
    cookieName: "session",
    secret: "your_secret_string",
    duration: 24 * 60 * 60 * 1000, // 24 hours
    activeDuration: 1000 * 60 * 5, // 5 minutes
  })
);

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set('views', path.join(__dirname, 'views'));
app.set("view engine", "ejs");
app.get("/", (req, res) => {
  res.render("home");
});

app.get("/about", (req, res) => {
  res.render("about");
});

const ensureLogin = (req, res, next) => {
  if (!req.session || !req.session.userName) {
    res.redirect("/login");
  } else {
    next();
  }
};
// GET route to render the login view
app.get("/login", (req, res) => {
  res.render("login");
});

// GET route to render the register view
app.get("/register", (req, res) => {
  res.render("register");
});

// POST route to handle user registration
app.post("/register", async (req, res) => {
  try {
    const userData = req.body;
    await authData.registerUser(userData);
    res.render("register", { successMessage: "User created" });
  } catch (err) {
    res.render("register", { errorMessage: err, userName: req.body.userName });
  }
});

// POST route to handle user login
app.post("/login", async (req, res) => {
  try {
    req.body.userAgent = req.get("User-Agent");
    const user = await authData.checkUser(req.body);
    req.session.user = {
      userName: user.userName,
      email: user.email,
      loginHistory: user.loginHistory,
    };
    res.redirect("/");
  } catch (err) {
    res.render("login", { errorMessage: err, userName: req.body.userName });
  }
});

// GET route to logout
app.get("/logout", (req, res) => {
  req.session.reset();
  res.redirect("/");
});

// GET route to render user history view
app.get("/userHistory", ensureLogin, (req, res) => {
  res.render("userHistory");
});

// Route to render the addSet view with themes
app.get("/lego/addSet", ensureLogin, async (req, res) => {
  try {
    const themes = await legoData.getAllThemes();
    res.render("addSet", { themes: themes });
  } catch (err) {
    res
      .status(500)
      .render("500", {
        message: `I'm sorry, but we have encountered the following error: ${err}`,
      });
  }
});
// Route to handle form submission and add a new set
app.post("/lego/addSet", ensureLogin, async (req, res) => {
  try {
    const setData = req.body;
    await legoData.addSet(setData);
    res.redirect("/lego/sets");
  } catch (err) {
    res
      .status(500)
      .render("500", {
        message: `I'm sorry, but we have encountered the following error: ${err}`,
      });
  }
});
// Define routes for editing a set
app.get("/lego/editSet/:num", ensureLogin, async (req, res) => {
  try {
    const setNum = req.params.num;
    const set = await legoData.getSetByNum(setNum);
    const themes = await legoData.getAllThemes();
    res.render("editSet", { set, themes });
  } catch (err) {
    res.status(404).render("404", { message: err });
  }
});

app.post("/lego/editSet", ensureLogin, async (req, res) => {
  try {
    const setNum = req.body.set_num;
    const setData = {
      name: req.body.name,
      year: req.body.year,
      num_parts: req.body.num_parts,
      theme_id: req.body.theme_id,
      img_url: req.body.img_url,
    };
    await legoData.editSet(setNum, setData);
    res.redirect("/lego/sets");
  } catch (err) {
    res
      .status(500)
      .render("500", {
        message: `I'm sorry, but we have encountered the following error: ${err}`,
      });
  }
});
app.get("/lego/deleteSet/:num", ensureLogin, async (req, res) => {
  try {
    const setNum = req.params.num;
    console.log("Set number to delete:", setNum);
    await legoData.deleteSet(setNum);
    res.redirect("/lego/sets");
  } catch (err) {
    console.error("Error deleting set:", err);
    res.render("500", {
      message: `I'm sorry, but we have encountered the following error: ${err}`,
    });
  }
});

app.get("/lego/sets", async (req, res) => {
  let sets = [];

  try {
    if (req.query.theme) {
      sets = await legoData.getSetsByTheme(req.query.theme);
    } else {
      sets = await legoData.getAllSets();
    }

    res.render("sets", { sets });
  } catch (err) {
    res.status(404).render("404", { message: err });
  }
});

app.get("/lego/sets/:num", async (req, res) => {
  try {
    let set = await legoData.getSetByNum(req.params.num);
    res.render("set", { set, session: req.session });
  } catch (err) {
    res.status(404).render("404", { message: err });
  }
});

app.use((req, res, next) => {
  res
    .status(404)
    .render("404", {
      message: "I'm sorry, we're unable to find what you're looking for",
    });
});

async function startServer() {
  try {
    await authData.initialize();
    await legoData.initialize();
    console.log('All promises have been resolved!');
    app.listen(HTTP_PORT, () => {
      console.log(`Server is running on port ${HTTP_PORT}`);
    });
  } catch (err) {
    console.error("Unable to start the server:", err);
  }
}

startServer();


/* phai req session va session?. */