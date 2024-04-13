const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config(); 

const userSchema = new mongoose.Schema({
  userName: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true },
  loginHistory: [{ dateTime: Date, userAgent: String }]
});

let User;
function initialize() {
    console.log("Connecting to mongo");
    const db = mongoose.createConnection(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  
    db.on('error', err => {
        console.error(err);
    });

    db.once('open', () => {
        console.log('auth-service mongo connected');
        User = db.model('User', userSchema);
    });
}

  function registerUser(userData) {
        // Ensure that User is defined before proceeding
        if (!User) {
            throw new Error("User model is not initialized. Call initialize() before using registerUser()");
        }    
    return new Promise((resolve, reject) => {
        // Check if passwords match
        if (userData.password !== userData.password2) {
            reject("Passwords do not match");
            return;
        }

        // Hash the password before saving it to the database
        bcrypt.hash(userData.password, 10, (err, hash) => {
            if (err) {
                reject("Error hashing password: " + err);
                return;
            }

            // Create a new user with the hashed password
            let newUser = new User({
                userName: userData.userName,
                email: userData.email,
                password: hash, // use the hashed password
                loginHistory: [] // Initialize login history
            });

            // Attempt to save the new user to the database
            newUser.save()
                .then(() => resolve("User created successfully"))
                .catch(err => {
                    if (err.code === 11000) {
                        reject("User Name already taken");
                    } else {
                        reject("There was an error creating the user: " + err);
                    }
                });
        });
    });
}
  function checkUser(userData) {
    return new Promise((resolve, reject) => {
        User.findOne({ userName: userData.userName })
            .then(user => {
                if (!user) {
                    reject("Unable to find user: " + userData.userName);
                    return;
                }

                // Compare password with hashed password in the database
                bcrypt.compare(userData.password, user.password)
                    .then(isMatch => {
                        if (!isMatch) {
                            reject("Incorrect Password for user: " + userData.userName);
                            return;
                        }

                        // Handle login history
                        if (user.loginHistory.length >= 8) {
                            user.loginHistory.pop(); // Remove the oldest entry if there are 8 already
                        }

                        // Add new login history entry at the front
                        user.loginHistory.unshift({
                            dateTime: new Date().toString(),
                            userAgent: userData.userAgent
                        });

                        // Save the updated user info
                        user.save()
                            .then(() => resolve(user))
                            .catch(err => reject("There was an error verifying the user: " + err));
                    })
                    .catch(err => reject("Password comparison failed: " + err));
            })
            .catch(err => reject("Error finding user: " + err));
    });
}
  module.exports = { initialize, registerUser, checkUser };
  