const nodemailer = require("nodemailer");
const express = require('express')
const router = express.Router()
//route to send a request email to the provider
router.post("/sendRequestMail", async (req, res) => {
    const {providerEmail,providerName} = req.body
    console.log()
    try {
        await sendRequestMail(providerEmail,providerName) 
        res.json({message:"email sent successfully"})
    } catch (error) {
        res.json({ message: error.message });
    }
})
const sendRequestMail = async(ProviderEmail,ProviderName)=>{
    const transponder = nodemailer.createTransport({
       service:"gmail",
        auth: {
            user: "melahomeservicefinder@gmail.com",
            pass: "dkoz rtzz oicv bwor",
        },
      });
    
      const mailOptions = {
        from: "Mela Services",
        to: ProviderEmail,
        subject: "New Job Request!",
        html: `
          <div style="background-color: #4e8cff; padding: 20px;">
            <h1 style="color: white; font-size: 24px;">Mela Services</h1>
          </div>
          <div style="padding: 20px;">
            <p>Hello ${ProviderName}!</p>
            <p style="font-weight: bold; color: #4e8cff; font-size: 18px;">You have received a new job request.</p>
            <p>Please login to your account to view and accept the request.</p>
          </div>
        `,
      };
      
    try {
        await transponder.sendMail(mailOptions);
    } catch (error) {
        console.log(error.message);
    }
    
    }
    module.exports = router