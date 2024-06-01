const express=require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcrypt');
const path = require('path');
const multer=require('multer');
const app=express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, '/views'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({ secret: 'lpdwjfghsojeds',resave:true,rolling:true,saveUninitialized: true,cookie:{
    maxAge: 7 * 24 * 3600 * 1000,
} }))
const { fetch_voter,already_voted,set_vote,get_candidate_role,get_user,get_admin,insert_vote,get_voter,get_result,get_candidate,get_candidates,insert_candidates}=require("./database.js");
const upload=multer({storage:multer.memoryStorage()});




app.get('/voting_page',async (req,res)=>{
    try{
        if (!req.session.user.username) {
            return res.redirect('/');
        }
    }
    catch(e){
        return res.redirect('/logout');
    }
    
    const voter_regno=req.session.user.username;
    const voter=await get_voter(voter_regno);
    var is_voted
    if(voter!=0){
        is_voted=voter[4];
    }
    const voter_to_candidate={
        1:["OREP"],
        2:["SREP"],
        3:["TREP","SC"],
        4:["FREP","CHM"]
    }
    if(is_voted==1){
        return res.render('success',{message:"You've already voted!!"});
    }
    console.log(req.session.user.username);
    var cd=[];
   
    for(const rl of voter_to_candidate[voter[1]]){
        var r=await get_candidate(rl)
        cd.push(r[0]);
    }
    console.log(cd);
    return res.render('voter',{cd:cd});
})

app.get("/",(req,res)=>{
    res.render("index");
})

app.get("/admin",async(req,res)=>{
    res.render("admin");
});

app.get("/admin_dashboard",async (req,res)=>{
    try{
        console.log(req.session.user.username && req.session.user.role=="admin")
        if(req.session.user.username && req.session.user.role=="admin"){
            return res.render('admin_dashboard');
        }
        else{
            return res.redirect('/admin');
        }
    }
    catch(error){
        return res.redirect('/admin');
    }
});

app.post("/add_candidates",upload.single('profile'),async (req,res)=>{
    const{reg_no,name,year,sec,dept,role}=req.body;
    const profile=req.file.buffer.toString('base64');
    
    const r=await insert_candidates(reg_no,name,year,sec,dept,role,profile);
    if(r){
        return res.redirect("/add_candidates");
    }
    else{
        console.log("Not inserted");
    }
})

app.get("/add_candidates",async (req,res)=>{
    try{
        console.log(req.session.user.username && req.session.user.role=="admin")
        if(req.session.user.username && req.session.user.role=="admin"){
            var candi=await get_candidates();
            const buffer = Buffer.from(candi[0][3]);
            const base64Image = buffer.toString('base64');
            candi[0][3] = base64Image;
            
            return res.render("add_candidates",{candidates:candi}); 
        }
        else{
            return res.redirect('/admin');
        }
    }
    catch(error){
        return res.redirect('/admin');
    }
})

app.get("/admin_result",async (req,res)=>{
    try{
        console.log(req.session.user.username && req.session.user.role=="admin")
        if(req.session.user.username && req.session.user.role=="admin"){
            const candi=await get_result();
            console.log(req.session.user.role);
            return res.render('result_admin',{candidates:candi}); 
        }
        else{
            return res.redirect('/admin');
        }
    }
    catch(error){
        return res.redirect('/admin');
    }
    
       
});

app.post("/login_voter",async (req,res)=>{
    const username=req.body.username;
    const password=req.body.password;
    
    const user=await get_user(username);
    console.log(user.length)
    if (user.length==1) {
        
        const valid=await bcrypt.compare(password, user[0][1]);
            
            console.log(valid)
            if (valid) {
                req.session.user ={username:username,role:"voter"};
                
                
                res.redirect('/voting_page');
                console.log("user found")

            }
            else {
                //res.json({ message: "incorrect", success: false });
                res.redirect('/');
                console.log("incorrect");
            }
        
    }
    else {
        //res.json({ message: "user not found", success: false });
        res.redirect('/');
        console.log("user not found")
    }

});


app.post("/login_admin",async (req,res)=>{
    const username=req.body.username;
    const password=req.body.password;
    
    const user=await get_admin(username);
    console.log(user.length)
    if (user.length==1) {
        
        const valid=await bcrypt.compare(password, user[0][1]);
            
            console.log(valid)
            if (valid) {
                req.session.user ={username:username,role:"admin"};
                
                //console.log(req.session.user);
                //res.json({ message: "user found", success: true });
                console.log("user found");
                res.redirect('/admin_dashboard');

            }
            else {
                res.redirect('/admin')
                //res.json({ message: "incorrect", success: false });
                console.log("incorrect");
            }
        
    }
    else {
        
        //res.json({ message: "user not found", success: false });
        console.log("user not found");
        res.redirect('/admin');
    }

});

app.post("/insert_vote",async (req,res)=>{
    if(!req.session.user){
        return res.redirect('/');
    }
    if (!req.session.user.username) {
        return res.redirect('/');
    }
    const cd_regno=req.body.data;
    const role=await get_candidate_role(cd_regno);
    console.log(role);
    console.log(cd_regno);
    console.log(req.session.user.username);
    voter_regno=req.session.user.username;
    
    const is_voted=await already_voted(voter_regno);
    
    if(!is_voted){
        const response=await insert_vote(cd_regno,role);
        const ack=await set_vote(voter_regno);
        if(response[0].affectedRows==1){
            res.render('success',{message:"Your vote has been saved succcessfully"});
            //res.json({message:"success"});
        }
        else{
            res.render('success',{message:"Failed to vote"});
            //res.json({message:"fail"});
        }
    }
    else{
        res.render('success',{message:"You've already voted"});
        //res.json({message:"voted"})
    }
});

// app.get("/get_result",async (req,res)=>{
//     const result =await get_result();
//     console.log(result);
//     res.json({
//         data:result
//     });
// });


app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});



app.listen(8000);