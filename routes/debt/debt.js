const express = require('express')
const router = express.Router()
const debt = require('../../schemas/Debt')
//route to add a debt record
router.post("/add", async (req, res) => {
    try {
        const {customer_Info,serviceId,provider_Info,commission} = req.body
        await debt.create({
            customer_Info,
            serviceId,
            provider_Info,
            commission
        })
        res.json({message:"debt added successfully"})
    } catch (err) {
        res.json({ message: err.message });
    }
})
module.exports = router