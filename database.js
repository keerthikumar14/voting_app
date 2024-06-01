const mysql= require('mysql2');

const bcrypt = require('bcrypt');

const dotenv= require('dotenv');
dotenv.config();

const pool=mysql.createPool({
    host:process.env.MYSQL_HOST,
    user:process.env.MYSQL_USER,
    password:process.env.MYSQL_PASSWORD,
    database:process.env.MYSQL_DATABASE,
    rowsAsArray: true
}).promise()


// async function fetch_voter(callback){
//     pool.query('select * from voters',function (error,result,fields){
//         if(error){
//             return error("Error in fetching data");
            
//         }
//         const Results =result.map(row => ({
//             reg_no: row.reg_no,
//             pass_word:row.pass_word,
//             name:row.name,
//             year:row.year,
//             section:row.section,
//             dept:row.dept
//           }));
//         console.log(Results[0].reg_no);
//         callback(Results[0].reg_no);
//     });
// };
async function get_candidates(){
  const candidate=await pool.query("SELECT reg_no,name,role,profile from candidates");
  return candidate[0];
}

async function get_candidate(role){
  const candidate=await pool.query("select reg_no,name,role,profile from candidates where role=?",[role]);
  
  return candidate[0];
}

async function get_candidate_role(cd_regno){
  const candidate=await pool.query("select role from candidates where reg_no=?",[cd_regno]);

  return (candidate[0][0][0]);
}





async function get_voter(username){
    if(username){
        const user=await pool.query("select reg_no,year,section,dept,is_voted from voters where reg_no=?",[username]);
        if(user[0].length==1){
          console.log(user[0][0]);
          return user[0][0];
        }
        else{
          console.log(0);
          return 0;
        }
        

    }
   else{
    console.log("Error in getting value from function parameter");
   }

}

async function insert_vote(cd_regno,role){
    const ins_value=await pool.query(`Update candidates set votes=(SELECT DISTINCT votes from candidates where reg_no=?)+1 where reg_no=? and role=?;
    `,[cd_regno,cd_regno,role]);
    return ins_value;
}


async function get_user(username){
    if(username){
        const user=await pool.query("select reg_no,pass_word from voters where reg_no=?",[username]);
        return user[0];
    }
   else{
    console.log("Error in getting value from function parameter");
   }

}

async function set_vote(voter_regno){
    if(voter_regno){
      const ack=await pool.query("UPDATE `voters` SET `is_voted` = '1' WHERE `voters`.`reg_no` = ?;",[voter_regno]);
      return ack;
    }
}

async function get_admin(username){
    if(username){
        const user=await pool.query("select admin_id,pass_word from admin where admin_id=?",[username]);
        return user[0];
    }
   else{
    console.log("Error in getting value from function parameter");
   }
}

async function insert_auth(emp_id,name,email,phno,doj,dob,dept,pass){
    bcrypt.hash(pass, 12, async function(err, hash) {
      const r=await pool.query('insert into auth_tbl values(?,?,?,?,?,?,?,?)',[emp_id,name,email,phno,new Date(doj),new Date(dob),dept,hash])
    if(r){
      console.log("inserted sucessfully")
    }
    else{
      console.log("inserted failed")
    }
    });
  }


async function get_result(){
  const result=await pool.query("SELECT votes,reg_no,name FROM candidates order by votes desc;");
  return result[0]
}


async function insert_voters(reg_no,pass,name,year,section,dept){
  bcrypt.hash(pass, 12, async function(err, hash) {
    const r=await pool.query('insert into voters values(?,?,?,?,?,?,?)',[reg_no,hash,name,year,section,dept,0]);
  if(r){
    console.log("inserted sucessfully")
  }
  else{
    console.log("inserted failed")
  }
  });
}

async function insert_candidates(reg_no,name,year,section,dept,role,profile){
  
    const r=await pool.query('insert into candidates values(?,?,?,?,?,?,?)',[reg_no,name,year,section,dept,role,profile]);
    return r;

}

async function insert_admin(user_name,pass){
  bcrypt.hash(pass, 12, async function(err, hash) {
    const r=await pool.query('insert into admin values(?,?)',[user_name,hash]);
  if(r){
    console.log("inserted sucessfully")
  }
  else{
    console.log("inserted failed")   
  }
  });
}

async function already_voted(reg_no){
  const r=await pool.query("select reg_no from voters where is_voted=1 and reg_no=?",[reg_no]);
  if(r){
    return false;
  }
  else{
    return true;
  }
}

get_voter("6178192110600")

module.exports={
    //fetch_voter
    get_user,
    get_admin,
    insert_vote,
    get_voter,
    get_result,
    get_candidate,
    get_candidate_role,
    set_vote,
    insert_candidates,already_voted,
    get_candidates

}


