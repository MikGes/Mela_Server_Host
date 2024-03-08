const express = require("express");
const router = express.Router();
const provider = require("../../schemas/provider");
const customer = require("../../schemas/customer")
//create a new provider Api
router.post("/create", async(req, res) => {
    const {name,km,rating,birr,services,provider_image,provider_phone,provider_description,location} = req.body;
   try{
    await provider.create({
        name,
        km,
        rating,
        birr,
        services,
        provider_image,
        provider_phone,
        provider_description,
        location
        
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
  //route to reject a service
  router.put('/rejectService/:providerId/:serviceId/:customerId', async (req, res) => {
    const { providerId, serviceId,customerId } = req.params;
    
    try {
      const target_provider = await provider.findById(providerId);
      if (!target_provider) {
        return res.status(404).json({ error: 'Provider not found' });
      }
  
      // Find the index of the service with the given serviceId
      const serviceIndex = target_provider.serviceRequest.findIndex(service => service.serviceId === serviceId);
      if (serviceIndex === -1) {
        return res.status(404).json({ error: 'Service not found' });
      }
  
      // Remove the service from the serviceRequest array
      target_provider.serviceRequest.splice(serviceIndex, 1);
  
      // Save the updated provider document
      await target_provider.save();
      
      //Customer SIDEEE
      const target_customer = await customer.findById(customerId);
    if (!target_customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Find the requested service with the given serviceId
    const service = target_customer.requested_Providers.find(service => service.serviceId === serviceId);
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    // Update the status of the service to "rejected"
    service.status = 'rejected';

    // Save the updated customer document
    await target_customer.save();
  
      res.json({ success: true, message: 'Success' });
    } catch (error) {
      console.error('Error rejecting service:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });
  //route to accept a service
  router.put('/acceptService/:providerId/:serviceId/:customerId', async (req, res) => {
    const { providerId, serviceId,customerId } = req.params;
    
    try {
      // Provider side...making the status to accepted
      const target_provider = await provider.findById(providerId);
      if (!target_provider) {
        return res.status(404).json({ error: 'Provider not found' });
      }
  
      // Find the requested service with the given serviceId
      const target_service = target_provider.serviceRequest.find(service => service.serviceId === serviceId);
      if (!target_service) {
        return res.status(404).json({ error: 'Service not found' });
      }
  
      // Update the status of the service to "accepted"
      target_service.status = 'accepted';
  
      // Save the updated customer document
      await target_provider.save();
      
      //Customer SIDEEE
      const target_customer = await customer.findById(customerId);
    if (!target_customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Find the requested service with the given serviceId
    const service = target_customer.requested_Providers.find(service => service.serviceId === serviceId);
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    // Update the status of the service to "rejected"
    service.status = 'accepted';

    // Save the updated customer document
    await target_customer.save();
  
      res.json({ success: true, message: 'Success' });
    } catch (error) {
      console.error('Error rejecting service:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });
  //route to update the rating attribute in the provider collection
  router.put('/updateRating/:providerId', async (req, res) => {
    const { providerId } = req.params;
    const { rating } = req.body;
    try {
      await provider.findByIdAndUpdate(providerId, { rating });
    }catch (error) {
      res.json({ success: false, message: error.message });
    }
    return res.json({ success: true, message: 'Success' });
  })
module.exports = router