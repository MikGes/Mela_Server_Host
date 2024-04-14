const express = require("express");
const Services = require("../schemas/Services");
const router = express.Router();
router.post("/create", async (req, res) => {
    try {
    const { name,serviceImage } = req.body;
        await Services.create({
            name,
            serviceImage
        })
        res.json({message: "service created successfully"});
    } catch (err) {
        res.json({ message: err });
    }
})
//route to get all the services
router.get("/getServices", async (req, res) => {
    try {
        const services = await Services.find();
        res.json(services);
    } catch (err) {
        res.json({ message: err });
    }
})
module.exports = router