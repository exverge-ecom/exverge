import jwt from "jsonwebtoken";

export const jwtAuthMiddleware = (req, res, next)=>{
    //Extracting the jwt token from the request headers
    const token = req.headers.authorization.split(' ')[1];
    if(!token) return res.status(401).json({error:'Unauthorized'});

    try {
        //Verifying the token

       const decoded = jwt.verify(token, "your-secret-key");
        
       next();
    } catch (error) {
        console.error(error);
        res.status(401).json({error:"Invalid Token"});
    }
}


//Function to generate token

export const generateToken = (userData)=>{
   return jwt.sign(userData, "your-secret-key", {expiresIn:"3h"});
}

