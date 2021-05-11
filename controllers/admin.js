
require('dotenv').config();
const { Account, User, Admin } = require("../models/user");
const passwordHash = require("password-hash");
const jwt = require("jsonwebtoken");
const db = require('../util/db').db;

// cookie will expire in 3 days
const maxAge = 3 * 24 * 60 * 60;
//login controller for everyone except patient
function login(req, res) {
  Account.findOne({ where: { email: req.body.email } })
    .then((account) => {
      if (account === null) {
        res.status(401).json({
          message: "Invalid email!",
        });
      } else {
    
        if (account.active) {
          let result = passwordHash.verify(req.body.password, account.Password);
          if (result) {
            // check if it's a normal user (médecin ,aide-soignant ou RH)
            User.findOne({where:{Email :account.Email}}).then(user =>{
       
              if(user !== null ) {
                //this is a normal user
                const token = jwt.sign(
                  {
                    email: user.Email,
                    IdUser:user.IdUser
                  },
                  process.env.JWT_SECRET_CODE,
                  { expiresIn: maxAge },
                  function (err, token) {
                    if (err) {
                      console.log(err);
                    } else {
                      res.cookie("jwt", token, {
                        httpOnly: true,
                        maxAge: maxAge * 1000,
                      });
    
                      res.status(200).json({
                        message: "Authentication successful! you are " + user.Role,
                        token: token,
                      });
                    }
                  }
                );
              }else {
                //this is an admin 
                Admin.findOne({where :{Email : account.Email}}).then(admin => {
                
                  if(admin !== null ){
                  const token = jwt.sign(
                    {
                      email: admin.Email,
                      IdAdmin :admin.IdAdmin
                    },
                    process.env.JWT_SECRET_CODE,
                    { expiresIn: maxAge },
                    function (err, token) {
                      if (err) {
                        console.log(err);
                      } else {
                        res.cookie("jwt", token, {
                          httpOnly: true,
                          maxAge: maxAge * 1000,
                        });
      
                        res.status(200).json({
                          message: "Authentication successful! ur an admin",
                          token: token,
                        });
                      }
                    }
                  );}
                }).catch(err => console.log(err))
               
              }
            } ).catch(err => console.log(err))

            

          } else {
            res.status(401).json({
              message: "Invalid password!",
            });
          }
        } else {
          res.json({
            message: "ACCOUNT NOT ACTIVE",
          });
        }
      }
    })
    .catch((error) => {
      res.json({
        message: "Something went wrong!",
        error: error,
      });
    });
}



const addNewUser = (req, res, next) => {
    const token = req.cookies.token;
    jwt.verify(token, process.env.JWT_SECRET_CODE,
        (err, decodedToken) => {
            if (err) {
                console.log('error', err);
                return res.status(404).send('ERROR');
            } else {
                if (req.body.role == "administrateur") {
                    db.query("INSERT INTO account (Email,Pass_word,active) VALUES (?,?,?)",
                        [req.body.email, passwordHash.generate(req.body.password), 1],
                        (err, result) => {
                            if (err) {
                                console.log('error', err);
                                return res.status(404).send('ERROR');
                            } else {
                                db.query('INSERT INTO administrator (Lastname,Firstname,Birthday,Sexe,Phonenumber,Email,IdAdmin_Second) VALUES (?,?,?,?,?,?,?)',
                                    [
                                        req.body.lastname,
                                        req.body.firstname,
                                        req.body.birthday,
                                        req.body.sexe,
                                        req.body.phonenumber,
                                        req.body.email,
                                        decodedToken.IdAdmin,
                                    ], (err, result) => {
                                        if (err) {
                                            console.log('error', err);
                                            return res.status(404).send('ERROR');
                                        }
                                        return res.status(200).send('added successfully');
                                    });
                            }
                        }
                    );

                } else {
                    db.query("INSERT INTO account (Email,Pass_word,active) VALUES (?,?,?)",
                        [req.body.email, passwordHash.generate(req.body.password), 1],
                        (err, result) => {
                            if (err) {
                                console.log('error', err);
                                return res.status(404).send('ERROR');
                            } else {
                                db.query('INSERT INTO users (Lastname,Firstname,Birthday,Sexe,Phonenumber,Email,IdAdmin_Second,Role) VALUES (?,?,?,?,?,?,?)',
                                    [
                                        req.body.lastname,
                                        req.body.firstname,
                                        req.body.birthday,
                                        req.body.sexe,
                                        req.body.phonenumber,
                                        req.body.email,
                                        decodedToken.IdAdmin,
                                        req.body.role,
                                    ], (err, result) => {
                                        if (err) {
                                            console.log('error', err);
                                            return res.status(404).send('ERROR');
                                        }
                                        return res.status(200).send('added successfully');
                                    });
                            }
                        }
                    );
                }
            }
        });

}
module.exports = {
    addNewUser,
    login
}

