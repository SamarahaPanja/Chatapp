const User = require('../models/userModel')
const Chat = require('../models/chatModel')
const bcrypt = require('bcrypt')


const registerLoad = async (req,res)=>{
    try {
        res.render('register') 
    } catch (error) {
        console.log(error.message);
    }
}

const register = async (req,res)=>{
    try {
        console.log(req)
        const passwordHash = await bcrypt.hash(req.body.password,10);

        const user = new User({
            name: req.body.name,
            email: req.body.email,
            image: 'images/'+req.file.filename,
            password: passwordHash
        })

        await user.save();


        res.render('register',{message: 'Registration Successful'})
    } catch (error) {
        console.log(error.message);
    }
}

const loadLogin = async (req,res)=>{
    try {
        res.render('login')
    } catch (error) {
        console.log(error.message);
    }
}

const login = async (req,res)=>{
    try {
        const email = req.body.email
        const password = req.body.password
        // console.log(req.body)
        const userData = await User.findOne({email});
        console.log(userData)
        if(userData){
            const passwordMatch  = await bcrypt.compare(password, userData.password);
            console.log(passwordMatch);
            if(passwordMatch){
                
                req.session.user = userData;
                res.redirect('/dashboard')
            }
            else{
                //return res.render('login',{message: 'Invalid Password'})
                res.render('login',{message: 'Incorrect Email & Password'})
            }
        }
        else{
            //return res.render('login',{message: 'User not found'})
            res.render('register',{message: 'User not found! Please create an account first'})
        }
        
    } catch (error) {
        console.log(error.message);
    }
}

const logout = async (req,res)=>{
    try {
        // req.session.destroy(()=>{
        //     res.redirect('/')
        // })
        req.session.destroy();
        res.redirect('/')
    } catch (error) {
        console.log(error.message);
    }
}

const loadDashboard = async (req,res)=>{
    try {
        var users = await User.find({_id: {$nin: [req.session.user._id]}})
        res.render('dashboard',{user:req.session.user,users:users})
    } catch (error) {
        console.log(error.message);
    }
}

const saveChat = async (req,res)=>{
    try {
        var chat = new Chat({
            sender_id: req.body.sender_id,
            receiver_id: req.body.receiver_id,
            message: req.body.message,
        })

        var newChat = await chat.save();

        res.status(200).send({success: true,msg:'Chat saved successfully',data: newChat});
    } catch (error) {
        res.status(400).send({success: false,msg:error.message});
    }
}

module.exports = {
    registerLoad, 
    register,
    loadLogin,
    login,
    logout,
    loadDashboard,
    saveChat,
}