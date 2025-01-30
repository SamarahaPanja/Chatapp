const isLogin = (req,res,next)=>{
    try {
        if((req.session.user)){}
        else{
            return res.redirect('/');
        }
        next();
    } catch (error) {
        console.log(error.message);
    }
}

const isLogout = (req,res,next)=>{
    try {
        if(req.session.user){
            return res.redirect('/dashboard');
        }
        next();
    } catch (error) {
        console.log(error.message);
    }
}

module.exports = {
    isLogin,
    isLogout
}