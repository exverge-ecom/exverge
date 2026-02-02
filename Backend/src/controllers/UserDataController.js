import { generateToken } from "../middleware/jwt.js";
import { getUserByEmailId, createUser } from "../model/UserDataModel.js";

export const registerUser = async (req, res, next) => {
  try {
    const { fullName, emailId, password } = req.body;

    const checkUserExist = await getUserByEmailId(emailId);

    if (checkUserExist.length == 1) {
      console.log("User already Exist");
      return res.json({
        success: false,
        message: "User Already Exist",
      });
    }

    //If not exist then create user

    const creatingUserResponse = await createUser({ fullName, emailId, password });

    //  console.log(createUser);
    //token
    if (creatingUserResponse) {
      const userData = {
        fullName: fullName,
        emailId: emailId,
      };

      const token = generateToken(userData);

      res.status(200).json({
        response: creatingUserResponse[0],
        token: token,
        message: "User created Successfully",
      });
    } else {
      res.status(400).json({
        success: false,
        message: "User creation Failed",
      });
    }
  } catch (error) {
    console.error("Error in creating user", error);
    throw error;
  }
};

export const loginUser = async (req, res) => {
  try {
    const { emailId, password } = req.body;

    const checkUserExist = await getUserByEmailId(emailId);

    if (checkUserExist.length === 0) {
      return res.json({
        success: false,
        message: `Sorry, ${emailId} Not exist`,
      });
    }

    if (checkUserExist[0].password !== password) {
      return res.json({
        success: false,
        message: `Invalid Credentials`,
      });
    }
    // const { fullName } = checkUserExist[0];

    const userData = {
     fullName: checkUserExist[0].full_name,
      emailId:  checkUserExist[0].email_id,
    }

    const token = generateToken(userData);

    const data = {
      fullName: checkUserExist[0].full_name,
      emailId:  checkUserExist[0].email_id,
      
    };

    res.status(200).json({
      success: true,
      token:token,
      data: data,
      message: `Welcome ${checkUserExist[0].full_name}, You are Successfully Logged In`,
    });
  } catch (error) {
    console.error("Error in login", error);
    throw error;
  }
};
