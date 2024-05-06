const express = require("express")
const route = express.Router()
const customer = require("../../schemas/customer")
const provider = require("../../schemas/provider")
const report = require("../../schemas/report")
const bcrypt = require('bcrypt');
const nodemailer = require("nodemailer");
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
    const token = Math.floor(1000 + Math.random() * 9000);
    await customer.create({
      email,
      password: hashedPassword,
      type_of_user:"customer",
      verificationToken: token
    });
   try {
    await sendVerificationMailToCustomer(email,token)
   } catch (error) {
    return res.json({
      message:"failed to send verification email",
    })
   }
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
//route to add debt
route.post('/addDebt', async (req, res) => {
  try {
    // Extract data from request body
    const { customerId, providerId, serviceId, commission } = req.body;
    // Create a debt object
    const debt = {
      customer_Info: {
        name: req.body.customerName,
        email: req.body.customerEmail,
        customer_id: customerId
      },
      serviceId: serviceId,
      provider_Info: {
        name: req.body.providerName,
        email: req.body.providerEmail,
        provider_id: providerId
      },
      commission: commission
    };

    // Update customer's debts array
    await customer.findByIdAndUpdate(customerId, {
      $push: { debts: debt }
    });

    // Update provider's debts array
    await provider.findByIdAndUpdate(providerId, {
      $push: { debts: debt }
    });
    res.status(200).json({ message: 'Debt added successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
//route to delete a specific debt
route.delete('/deleteDebt/:customerId/:debtId', async (req, res) => {
  const { customerId, debtId } = req.params;

  try {
    // Find the provider by ID
    const target_customer = await customer.findById(customerId);

    if (!provider) {
      return res.json({ message: 'Customer not found' });
    }

    // Find the index of the debt with the specified ID in the debts array
    const debtIndex = target_customer.debts.findIndex(debt => debt._id.toString() === debtId);

    if (debtIndex === -1) {
      return res.json({ message: 'Debt not found' });
    }

    // Remove the debt from the debts array
    target_customer.debts.splice(debtIndex, 1);

    // Save the updated provider object
    await target_customer.save();

    res.json({ message: 'Debt deleted successfully' });
  } catch (error) {
    console.error(error);
    res.json({ message: 'Server error' });
  }
});
//route to get all the debts from the customer
route.get('/getDebts/:customerId', async (req, res) => {
  try {
      const target_customer = await customer.findById(req.params.customerId);
      if (!target_customer) {
          return resjson({ error: 'Customer not found' });
      }
   
      const debts = target_customer.debts;
      res.json(debts);
  } catch (err) {
      console.error(err);
      res.json({ message: 'Server Error' });
  }
});
//route to get the activatedByAdmin status of the customer
route.get('/getActivatedByAdmin/:customerId', async (req, res) => {
  try {
      const target_customer = await customer.findById(req.params.customerId);
      if (!target_customer) {
          return res.json({ error: 'Customer not found' });
      }
      res.json({activatedByAdmin:target_customer.activatedByAdmin});
  } catch (err) {
      console.error(err);
      res.json({ message: 'Server Error' });
  }
})
//function to send email verification to customer
const sendVerificationMailToCustomer = async(Email,VerificationToken)=>{
  const transponder = nodemailer.createTransport({
     service:"gmail",
      auth: {
          user: "melahomeservicefinder@gmail.com",
          pass: "dkoz rtzz oicv bwor",
      },
    });
  
    const mailOptions = {
      from: "Mela Services",
      to: Email,
      subject: "Email Verification!",
      html: `
        <div style="background-color: #4e8cff; padding: 20px;">
          <h1 style="color: white; font-size: 28px; text-align: center;">Mela Services</h1>
        </div>
        <div style="padding: 20px;">
          <p style="font-size: 16px; color: #333333; text-align: center;">Welcome to Mela Services.</p>
          <p style="font-size: 16px; color: #333333; text-align: center;">Click the button below to verify your email address.</p>
          <div style="text-align: center; margin-top: 20px;">
            <a href="http://192.168.1.5:4000/customer/verifyCustomerEmail/${VerificationToken}" style="display: inline-block; background-color: #007bff; color: #ffffff; font-size: 16px; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email</a>
          </div>
        </div>
      `,
    };
    
  try {
      await transponder.sendMail(mailOptions);
  } catch (error) {
      console.log(error.message);
  }
    
}
 //route for the cusomter to verify his or her email
 route.get("/verifyCustomerEmail/:VerificationToken", async (req, res) => {
  const VerificationToken = req.params.VerificationToken
  try {
    const user = await customer.findOne({verificationToken:VerificationToken});
    if (user) {
      user.emailVerified = true;
      user.verificationToken = undefined;
      await user.save();
      res.json({message:"email verified successfully"})
    } else {
      res.json({message:"email verification failed"})
    }
  } catch (error) {
    res.json({ message: error.message });
  }
})
module.exports = route