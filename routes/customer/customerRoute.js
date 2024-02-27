const express = require("express")
const route = express.Router()
const customer = require("../../schemas/customer")
const provider = require("../../schemas/provider")
const report = require("../../schemas/report")

//create customer account Api
route.post("/create", async(req, res) => {
    const {name,email} = req.body
    try {
        await customer.create({
          name,
          email,
          
        }).then(()=>{
            res.status(200).json({
                success:true
            })
        }).catch(()=>{
            res.status(400).json({
                success:false
            })
        })
        
    } catch (error) {
        res.status(400).json({
            message:"Unable to create customer",
            success:false
        })
    }
})
//route to rate a customer
route.post('/rateProvider', async (req, res) => {
    try {
      const { providerId, customerId, rate, rateMessage } = req.body;
      // Update the provider document with the new rating
      const t_provider = await provider.findByIdAndUpdate(providerId, {
        $push: {
          ratedBy: {
            rated_customer: customerId,
            rate,
            rateMessage
          }
        }
      }, { new: true });
  
      res.json({ success: true, t_provider });
    } catch (err) {
      console.error(err);
      res.status(500).json({ err });
    }
  });
  //route to report a provider
  route.post('/reportProvider', async (req, res) => {
    try {
      const { providerId, customerId, reportMessage } = req.body;
      await report.create({
        reporter_id: providerId,
        reported_provider_id:customerId,
        reportMessage,
      })
      res.status(200).json({ success: true });
    }catch(err){
        console.log(err)
        res.status(500).json({ err });
    }
  })
  //route to make a service request
  route.post('/makeServiceRequest', async (req, res) => {
    try {
      const { customerId, providerId, service_description } = req.body;
      await provider.findByIdAndUpdate(providerId, {
        $push: {
          serviceRequest: {
            request_customer_id: customerId,
            service_description,  
          }
        }
      }).then(()=>{
        res.json({ success: true })
      })
    }catch(err){
        console.log(err)
        res.status(500).json({ error:err.message });
    }
  })
module.exports = route