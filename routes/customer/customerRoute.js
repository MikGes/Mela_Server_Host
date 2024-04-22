const express = require("express")
const route = express.Router()
const customer = require("../../schemas/customer")
const provider = require("../../schemas/provider")
const report = require("../../schemas/report")
const bcrypt = require('bcrypt');
//create customer account Api
route.post("/create", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if a user with the customer email already exists
    const existingUser = await customer.findOne({ email });

    if (existingUser) {
      return res.json({
        success: false,
        message: "Email already exists"
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 5);

    // Save the user in the database
    await customer.create({
      email,
      password: hashedPassword,
      type_of_user:"customer"
    });

    res.status(200).json({
      success: true
    });
  } catch (error) {
    console.error('Error creating customer:', error);
    res.json({
      success: false,
      message: error.message
    });
  }
});
//route to get a specific customer

//route to get a specific customer
route.get("/get/:customerId", async (req, res) => {
  const { customerId } = req.params;
  try {
    const target_customer = await customer.findById(customerId);

    if (!target_customer) {
      return res.json({ error: 'Customer not found' });
    }

    res.status(200).json({
      success: true,
      user:target_customer});
  } catch (error) {
    res.send(error.message);
  }
});
//route to login a customer
route.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find the user with the provided email
    const target_customer = await customer.findOne({ email });

    // If no user is found with the provided email, return an error
    if (!target_customer) {
      return res.json({
        success: false,
        message: "Email not found"
      });
    }

    // Compare the provided password with the hashed password from the database
    const passwordMatch = await bcrypt.compare(password, target_customer.password);

    // If passwords don't match, return an error
    if (!passwordMatch) {
      return res.json({
        success: false,
        message: "Incorrect password"
      });
    }

    // If email and password are correct, return a success message
    res.status(200).json({
      success: true,
      message: "Login successful",
      user: target_customer
    });
  } catch (error) {
    console.error('Error logging in customer:', error);
    res.json({
      success: false,
      message: "Internal server error"
    });
  }
});

//route to rate a provider
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
      res.json({ err });
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
        res.json({ err });
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
      res.json({ error: err.message });
    }
  });
  //route to change the password of a customer
  route.patch('/changePassword/:customerId', async(req,res)=>{
    try {
      const id = req.params.customerId;
      const {newPassword} = req.body
      let target_customer = await customer.findById(id)
      if(!target_customer){
        return res.json({error:"Customer is not found!"})
      }
      else{
        const hashedPassword = await bcrypt.hash(newPassword, 5);
        target_customer.password = hashedPassword
        await target_customer.save()
        res.json({success:true})
      }
    } catch (error) {
      res.json({error:error.message})
    }
  })
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
                select: 'name provider_image email birr' // Select the fields you want to retrieve from the customer document
            }
        }).then((customer)=>{
            const requested_services = customer.requested_Providers;
            res.status(200).json(
              requested_services,
            )     
        })
     
    } catch (error) {
       res.send(error.message); 
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
        return res.json({ error: 'Service not found' });
      }
  
      // Remove the service from the serviceRequest array
      target_provider.serviceRequest.splice(serviceIndex, 1);
  
      // Save the updated provider document
      await target_provider.save();
      
      //Customer SIDEEE
      const target_customer = await customer.findById(customerId);
      if (!target_customer) {
        return res.json({ error: 'Customer not found' });
      }
  
      // Find the index of the service with the given serviceId
      const serviceIndex1 = target_customer.requested_Providers.findIndex(service => service.serviceId === serviceId);
      if (serviceIndex1 === -1) {
        return res.json({ error: 'Service not found2' });
      }
  
      // Remove the service from the serviceRequest array
      target_customer.requested_Providers.splice(serviceIndex1, 1);
  
      // Save the updated provider document
      await target_customer.save();
  
      res.json({ success: true, message: 'Success' });
    } catch (error) {
      console.error('Error canceling service request:', error);
      res.json({ error: 'Server error' });
    }
  });
  //route to proceed a service
  route.put('/proceedService/:providerId/:serviceId/:customerId', async (req, res) => {
    const { providerId, serviceId,customerId } = req.params;
    
    try {
      // Provider side...making the status to accepted
      const target_provider = await provider.findById(providerId);
      if (!target_provider) {
        return res.json({ error: 'Provider not found' });
      }
  
      // Find the requested service with the given serviceId
      const target_service = target_provider.serviceRequest.find(service => service.serviceId === serviceId);
      if (!target_service) {
        return res.json({ error: 'Service not found' });
      }
  
      // Update the status of the service to "accepted"
      target_service.proceeded_by_Customer = true;
  
      // Save the updated customer document
      await target_provider.save();
      
      //Customer SIDEEE
      const target_customer = await customer.findById(customerId);
    if (!target_customer) {
      return res.json({ error: 'Customer not found' });
    }

    // Find the requested service with the given serviceId
    const service = target_customer.requested_Providers.find(service => service.serviceId === serviceId);
    if (!service) {
      return res.json({ error: 'Service not found' });
    }

    // Update the status of the service to "rejected"
    service.proceed = true;

    // Save the updated customer document
    await target_customer.save();
  
      res.json({ success: true, message: 'Success' });
    } catch (error) {
      console.error('Error rejecting service:', error);
      res.json({ error: 'Server error' });
    }
  });
  //route to cancel a request by the customer after the provider has accepted
  route.put('/cancelService/:providerId/:serviceId/:customerId', async (req, res) => {
    const { providerId, serviceId,customerId } = req.params;
    
    try {
      // Provider side...making the status to accepted
      const target_provider = await provider.findById(providerId);
      if (!target_provider) {
        return res.json({ error: 'Provider not found' });
      }
  
      // Find the requested service with the given serviceId
      const target_service = target_provider.serviceRequest.find(service => service.serviceId === serviceId);
      if (!target_service) {
        return res.json({ error: 'Service not found' });
      }
  
      // Update the status of the service to "accepted"
      target_service.status = 'cancelled';
  
      // Save the updated customer document
      await target_provider.save();
      
      //Customer SIDEEE
      const target_customer = await customer.findById(customerId);
    if (!target_customer) {
      return res.json({ error: 'Customer not found' });
    }

    // Find the requested service with the given serviceId
    const service = target_customer.requested_Providers.find(service => service.serviceId === serviceId);
    if (!service) {
      return res.json({ error: 'Service not found' });
    }

    // Update the status of the service to "rejected"
    service.status = 'cancelled';

    // Save the updated customer document
    await target_customer.save();
  
      res.json({ success: true, message: 'Success' });
    } catch (error) {
      console.error('Error rejecting service:', error);
      res.json({ error: 'Server error' });
    }
  });
  
//route to save customer profile and set the completed_profile to true
route.put('/saveProfile/:customerId', async (req, res) => {
    const customerId = req.params.customerId;
    const {phone, fullname, image} = req.body;
    try {
        const target_customer = await customer.findById(customerId);

        if (!target_customer) {
            return res.json({ error: 'Customer not found' });
            
        }

        target_customer.completed_profile = true;
        target_customer.customer_phone = phone;
        target_customer.name = fullname;
        target_customer.customer_image = image;
        await target_customer.save();
        res.json({ message: 'Profile saved successfully' });
    } catch (error) {
        console.error('Error saving profile:', error);
        res.json({ message: 'Internal server error' });
    }
})
module.exports = route