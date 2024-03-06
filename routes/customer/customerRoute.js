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
      const randomIdentifier = Math.random().toString(36).slice(2, 16);
      // Update customer
      await customer.findByIdAndUpdate(customerId, {
        $push: {
          requested_Providers: {
            serviceId:randomIdentifier,
            requested_provider_id: providerId,
            service_description,  
          }
        }
      });
  
      // Update provider
      await provider.findByIdAndUpdate(providerId, {
        $push: {
          serviceRequest: {
            serviceId:randomIdentifier,
            request_customer_id: customerId,
            service_description,  
          }
        }
      });
  
      res.json({ success: true });
    } catch(err) {
      console.log(err);
      res.status(500).json({ error: err.message });
    }
  });
  //route to get all the service requests made
  route.get('/getRequestedServices/:customerId', async (req, res) => {
    const { customerId } = req.params;
    try {
        await customer.findById(customerId) 
        .populate({
            path: 'requested_Providers',
            populate: {
                path: 'requested_provider_id',
                model: 'provider',
                select: 'name provider_image' // Select the fields you want to retrieve from the customer document
            }
        }).then((customer)=>{
            const requested_services = customer.requested_Providers;
            res.status(200).json(
              requested_services,
            )     
        })
     
    } catch (error) {
       res.status(400).send(error.message); 
    }
  })
  //route to cancel a request
  route.put('/cancelRequest/:providerId/:serviceId/:customerId', async (req, res) => {
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
  
      // Find the index of the service with the given serviceId
      const serviceIndex1 = target_customer.requested_Providers.findIndex(service => service.serviceId === serviceId);
      if (serviceIndex1 === -1) {
        return res.status(404).json({ error: 'Service not found2' });
      }
  
      // Remove the service from the serviceRequest array
      target_customer.requested_Providers.splice(serviceIndex1, 1);
  
      // Save the updated provider document
      await target_customer.save();
  
      res.json({ success: true, message: 'Success' });
    } catch (error) {
      console.error('Error canceling service request:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });
  //route to proceed a service
  route.put('/proceedService/:providerId/:serviceId/:customerId', async (req, res) => {
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
      target_service.proceeded_by_Customer = true;
  
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
    service.proceed = true;

    // Save the updated customer document
    await target_customer.save();
  
      res.json({ success: true, message: 'Success' });
    } catch (error) {
      console.error('Error rejecting service:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });
  //route to cancel a request by the customer after the provider has accepted
  route.put('/cancelService/:providerId/:serviceId/:customerId', async (req, res) => {
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
      target_service.status = 'cancelled';
  
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
    service.status = 'cancelled';

    // Save the updated customer document
    await target_customer.save();
  
      res.json({ success: true, message: 'Success' });
    } catch (error) {
      console.error('Error rejecting service:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });
  
module.exports = route