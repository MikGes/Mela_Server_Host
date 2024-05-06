const nodemailer = require("nodemailer");
const express = require('express');
const router = express.Router()
const sendCancelMail = async(ProviderEmail,CustomerName,ProviderName)=>{
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
      subject: "Job Canceled!",
      html: `
        <div style="background-color: #4e8cff; padding: 20px;">
          <h1 style="color: white; font-size: 28px; text-align: center;">Mela Services</h1>
        </div>
        <div style="padding: 20px;">
          <p style="font-weight: bold; color: lightgreen; font-size: 16px;">Hello ${ProviderName}!</p>
          <p style="font-weight: bold; color: #4e8cff; font-size: 18px;">${CustomerName} has cancelled the job request.</p>
          <p>Please login to your account to see more details.</p>
        </div>
      `,
    };
    
  try {
      await transponder.sendMail(mailOptions);
  } catch (error) {
      console.log(error.message);
  }
  
  }
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
          <h1 style="color: white; font-size: 28px; text-align: center;">Mela Services</h1>
        </div>
        <div style="padding: 20px;">
          <p style="font-weight: bold; color: lightgreen; font-size: 16px;">Hello ${ProviderName}!</p>
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
  const sendAcceptedOrRejectedMail = async(Email,Name,SendToName,typeOfMail)=>{
    const transponder = nodemailer.createTransport({
       service:"gmail",
        auth: {
            user: "melahomeservicefinder@gmail.com",
            pass: "dkoz rtzz oicv bwor",
        },
      });
    var mailOptions = {}
     typeOfMail =="accepted"? mailOptions = {
      from: "Mela Services",
      to: Email,
      subject: "Job Accepted!",
      html: `
        <div style="background-color: #4e8cff; padding: 20px;">
          <h1 style="color: white; font-size: 28px; text-align: center;">Mela Services</h1>
        </div>
        <div style="padding: 20px;">
          <p style="font-weight: bold; color: lightgreen; font-size: 16px;">Hello ${Name}!</p>
          <p style="font-weight: bold; color: #4e8cff; font-size: 18px;">${SendToName} has accepted your job request.</p>
          <p>Please login to your account to proceed to the job.</p>
        </div>
      `,
    }:typeOfMail == "rejected" ? mailOptions = {
      from: "Mela Services",
      to: Email,
      subject: "Job Rejected!",
      html: `
        <div style="background-color: #4e8cff; padding: 20px;">
          <h1 style="color: white; font-size: 28px; text-align: center;">Mela Services</h1>
        </div>
        <div style="padding: 20px;">
          <p style="font-weight: bold; color: lightgreen; font-size: 16px;">Hello ${Name}!</p>
          <p style="font-weight: bold; color: #4e8cff; font-size: 18px;">${SendToName} has rejected your job request.</p>
          <p>Please login to your account to see more details.</p>
        </div>
      `,
    }:mailOptions = {
      from: "Mela Services",
      to: Email,
      subject: "Job Proceeded!",
      html: `
        <div style="background-color: #4e8cff; padding: 20px;">
          <h1 style="color: white; font-size: 28px; text-align: center;">Mela Services</h1>
        </div>
        <div style="padding: 20px;">
          <p style="font-weight: bold; color: lightgreen; font-size: 16px;">Hello ${Name}!</p>
          <p style="font-weight: bold; color: #4e8cff; font-size: 18px;">${SendToName} has proceeded to the job.</p>
          <p>Please login to your account to see more details.</p>
        </div>
      `,
    };
      
    try {
        await transponder.sendMail(mailOptions);
    } catch (error) {
        console.log(error.message);
    }
    
    }
  //route to send a request email to the provider
  router.post("/sendRequestMail", async (req, res) => {
    const {providerEmail,providerName} = req.body
    try {
      await sendRequestMail(providerEmail,providerName) 
      res.json({message:"email sent successfully"})
    } catch (error) {
      res.json({ message: error.message });
    }
  })
  //route to send an accepted email to the customer
  
  router.post("/sendAcceptedMail", async (req, res) => {
    const {ProviderName,CustomerEmail,CustomerName} = req.body
    try {
      await sendAcceptedOrRejectedMail(CustomerEmail,CustomerName,ProviderName,"accepted") 
      res.json({message:"email sent successfully"})
    } catch (error) {
      res.json({ message: error.message });
    }
  })
  //route to send a rejected Email to the customer
  router.post("/sendRejectedMail", async (req, res) => {
    const {ProviderName,CustomerEmail,CustomerName} = req.body
    try {
      await sendAcceptedOrRejectedMail(CustomerEmail,CustomerName,ProviderName,"rejected") 
      res.json({message:"email sent successfully"})
    } catch (error) {
      res.json({ message: error.message });
    }
  })
  //route to send proceed email to the customer
  router.post("/sendProceedMail", async (req, res) => {
    const {ProviderName,ProviderEmail,CustomerName} = req.body
    try {
      await sendAcceptedOrRejectedMail(ProviderEmail,ProviderName,CustomerName,"proceed") 
      console.log("Email sent successfully")
      res.json({message:"email sent successfully"})
    } catch (error) {
      res.json({ message: error.message });
    }
  })
   //route to send a rejected Email to the customer
   router.post("/sendCancelMail", async (req, res) => {
    const {ProviderEmail,CustomerName,ProviderName} = req.body
    try {
      await sendCancelMail(ProviderEmail,CustomerName,ProviderName) 
      res.json({message:"email sent successfully"})
    } catch (error) {
      res.json({ message: error.message });
    }
  })
  

 
  module.exports = router
  