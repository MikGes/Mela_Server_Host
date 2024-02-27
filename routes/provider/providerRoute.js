const express = require("express");
const router = express.Router();
const provider = require("../../schemas/provider");
//create a new provider Api
router.post("/create", async(req, res) => {
    const {name,km,rating,birr,services,provider_image,provider_phone,provider_description} = req.body;
   try{
    await provider.create({
        name,
        km,
        rating,
        birr,
        services,
        provider_image,
        provider_phone,
        provider_description
        
    }).then(()=>{
        res.status(200).json({
            success:true
        })
    }).catch(()=>{
        res.status(400).json({
            success:false
        })
    })
   }catch(err){
    console.log("Unable to create provider",err)
    res.status(400).json({
        message:"Unable to create provider",
        success:false
    })
   }
})
//get all the providers Api
router.get("/getProviders/:job", async (req, res) => {
    const { job } = req.params;
    try {
      const providers = await provider.find({ services: { $in: [job] } });
      res.status(200).json(providers);
    } catch (error) {
      console.error("Error fetching providers:", error);
      res.status(400).send("Can't get providers");
    }
  });

  //get all the customer who rated a provider
  router.get("/getRaters/:providerId", async (req, res) => {
    const { providerId } = req.params;
    try {
        await provider.findById(providerId) 
        .populate({
            path: 'ratedBy',
            populate: {
                path: 'rated_customer',
                model: 'customer',
                select: 'name customer_image' // Select the fields you want to retrieve from the customer document
            }
        }).then((provider)=>{
            const customers = provider.ratedBy;
            console.log(typeof(customers))
            res.status(200).json(
                customers,
            )     
        })
     
    } catch (error) {
       res.status(400).send(error.message); 
    }
  })
  //route to get all the request services
  router.get("/getServiceRequests/:providerId", async (req, res) => {
    const { providerId } = req.params;
    try {
        await provider.findById(providerId) 
        .populate({
            path: 'serviceRequest',
            populate: {
                path: 'request_customer_id',
                model: 'customer',
                select: 'name customer_image' // Select the fields you want to retrieve from the customer document
            }
        }).then((provider)=>{
            const services = provider.serviceRequest;
            res.status(200).json(
                services,
            )     
        })
     
    } catch (error) {
       res.status(400).send(error.message); 
    }
  })
module.exports = router