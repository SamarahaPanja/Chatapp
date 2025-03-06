const User = require('../models/userModel')
const Chat = require('../models/chatModel')
const Group = require('../models/groupModel')
const Member = require('../models/memberModel')
const GroupChat = require('../models/groupChatModel')
const bcrypt = require('bcrypt')
const mongoose = require('mongoose')

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
                res.cookie(`user`,JSON.stringify(userData));
                res.redirect('/dashboard');
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
        res.clearCookie('user')
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

const deleteChat = async (req,res)=>{
    try {
        await Chat.deleteOne({_id:req.body.id});
        res.status(200).send({success: true,msg:'Chat deleted successfully'});
    } catch (error) {
        res.status(400).send({success: false,msg:error.message});
    }
}

const updateChat = async (req,res)=>{
    try {
        await Chat.findByIdAndUpdate({_id:req.body.id}, {$set:{message:req.body.message}})
        res.status(200).send({success: true,msg:'Chat updated successfully'});
    } catch (error) {
        res.status(400).send({success: false,msg:error.message});
    }
}

const fileUpload = async (req,res)=>{
     
}

const loadGroups = async (req,res)=>{
    try {
        console.log(req.session.user._id)
        const groups = await Group.find({creator_id:req.session.user._id})
        //console.log(groups)
        res.render('group',{groups:groups})
    } catch (error) {
        console.log(error.message);
    }
}

const createGroup = async (req,res)=>{
    try {

        const img = req.file && req.file.filename ? 'images/' + req.file.filename : 'images/groupPFP.png';
        console.log(req.session.user)
        const group = new Group({
            creator_id : req.session.user._id,
            name: req.body.name,
            image : img,
            limit : req.body.limit
        })
        await group.save()
        console.log(group);
        const groups = await Group.find({creator_id:req.session.user._id})
        //console.log(groups);
        res.render('group',{message :req.body.name + " Group created successfully",groups:groups})
    } catch (error) {
        console.log(error.message);
    }
}

const getMembers = async (req,res)=>{
    try {
        

        //const excludedMembers = req.body.members.map(id => new mongoose.Types.ObjectId(id));
        const groupId = new mongoose.Types.ObjectId(req.body.group_id);
        const userID = new mongoose.Types.ObjectId(req.session.user._id)
        
        const users = await User.aggregate([

            
            {
                $lookup: {
                    from: "members",
                    localField: "_id",
                    foreignField: "user_id",
                    pipeline:[
                        {
                            $match: {
                                $expr:{
                                    $and:[
                                        {$eq: ["$group_id",groupId]},
                                    ]
                                }
                            }
                        }
                    ],
                    as: "member"
                }
            },
            {
                $match : {
                    "_id" : { $nin : [userID] }
                }
            },
        ])
        //console.log(users)

        res.status(200).send({success: true,data:users});
    } catch (error) {
        res.status(400).send({success: false,msg:error.message});
    }
}

const addMembers = async (req,res)=>{
    try {
        console.log(req.body)

        if(!req.body.members){
            return res.status(200).send({success: false,msg: 'No members selected'});
        }
        else if(req.body.members.length > parseInt(req.body.limit)){
            return res.status(200).send({success: false,msg: 'Group limit exceeded'});
        }
        else{

            await Member.deleteMany({group_id : req.body.group_id}) 

            const data = []
            const members = req.body.members;
            for(let i=0;i<members.length;i++){
                data.push({group_id : req.body.group_id, user_id : members[i]})
            }

            await Member.insertMany(data);

            res.status(200).send({success: true,msg:'Member added successfully'});
        }


        // const member = new Member({
        //     group_id : req.body.group_id,
        //     user_id : req.body.user_id
        // })
        // await member.save()
        // console.log(member);
        
    } catch (error) {
        res.status(400).send({success: false,msg:error.message});
    }
}

const updateChatGroup = async (req,res)=>{
    try {
        //await Chat.updateMany({group_id:req.body.group_id}, {$set:{message:req.body.message}})
        if(parseInt(req.body.limit)<parseInt(req.body.last_limit)){
            await Member.deleteMany({group_id: req.body.id})
        }

        var updateObj;

        if(req.file !=undefined){
            updateObj = {
                name:req.body.name,
                image: 'images/'+req.file.filename,
                limit: req.body.limit
            }
        }else{
            updateObj = {
                name:req.body.name,
                limit: req.body.limit
            }
        }

        await Group.findByIdAndUpdate({_id: req.body.id},{
            $set: updateObj
        });

        res.status(200).send({success: true,msg:'Chat updated successfully'});
    } catch (error) {
        res.status(400).send({success: false,msg:error.message});
    } 
}

const deleteChatGroup = async (req,res)=>{
    try {
        await Group.deleteOne({_id:req.body.id});
        await Member.deleteMany({group_id:req.body.id})
        res.status(200).send({success: true,msg:'Chat deleted successfully'});
    } catch (error) {
        res.status(400).send({success: false,msg:error.message});
    }
}

const shareGroup = async (req,res)=>{
    try {
        const groupData = await Group.findOne({_id:req.params.id});
        if(!groupData){
            res.render('error',{message: '404 not found!'})
        }
        else if(req.session.user == undefined){
            res.render('error',{message: 'You need to login to access the share URL!'})
        }
        else{
            const totalMembers = await Member.find({group_id: req.params.id}).countDocuments();
            const available = groupData.limit - totalMembers;
            //console.log(groupData.limit,totalMembers,available)

            const isOwner = groupData.creator_id == req.session.user._id ? true : false;
            const isJoined = await Member.find({group_id : req.params.id,user_id: req.session.user._id})
            //console.log(isJoined)
            res.render('shareLink',{group:groupData,available:available,totalMembers:totalMembers,isOwner:isOwner,isJoined:isJoined})
        }
        
    } catch (error) {
        res.status(400).send({success: false,msg:error.message});
    }
}

const joinGroup = async (req,res)=>{
    try {

        const member = new  Member({
            group_id : req.body.group_id,
            user_id : req.session.user._id
        })

        await member.save()

        res.status(200).send({success: true,msg:'Chat joined successfully'});
    } catch (error) {
        res.status(400).send({success: false,msg:error.message});
    }
}

const groupChats = async (req,res)=>{
    try {
        const myGroups = await Group.find({creator_id: req.session.user._id})
        const joinedGroups = await Member.find({user_id: req.session.user._id}).populate('group_id')
        console.log("joinedGroups",joinedGroups)
        res.render('chat-group',{myGroups:myGroups,joinedGroups:joinedGroups})
    } catch (error) {
        res.status(400).send({success: false,msg:error.message});
    }
}

const saveGroupChats = async (req,res)=>{
    try {
        var chat = new GroupChat({
            sender_id: req.body.sender_id,
            group_id: req.body.group_id,
            message: req.body.message,
        })

        var newChat = await chat.save();
        console.log(newChat)
        res.status(200).send({success: true,msg:'Chat saved successfully',chat: newChat});
    } catch (error) {
        res.status(400).send({success: false,msg:error.message});
    }
}

const loadGroupChats = async (req,res)=>{
    try {
        const groupChats = await GroupChat.find({group_id: req.body.group_id});
        res.status(200).send({success: true,msg:'Chat loaded successfully',chats: groupChats});
    } catch (error) {
        res.status(400).send({success: false,msg:error.message});
    } 
}

const deleteGroupChat = async (req,res)=>{
    try {
        await GroupChat.deleteOne({_id: req.body.id})
        res.status(200).send({success: true,msg:'Chat deleted successfully'});
    } catch (error) {
        res.status(400).send({success: false,msg:error.message});
    }
}

const updateGroupChat = async (req,res)=>{
    try {
        await GroupChat.findByIdAndUpdate({_id: req.body.id},{
            $set: {message:req.body.message}
        })
        res.status(200).send({success: true,msg:'Chat updated successfully'});
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
    deleteChat,
    updateChat,
    fileUpload,
    loadGroups,
    createGroup,
    getMembers,
    addMembers,
    updateChatGroup,
    deleteChatGroup,
    shareGroup,
    joinGroup,
    groupChats,
    saveGroupChats,
    loadGroupChats,
    deleteGroupChat,
    updateGroupChat,
}