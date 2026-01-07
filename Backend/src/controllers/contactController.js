import contactModel from '../models/contactModel.js';

export const createContact = async function (req, res) {
    console.log("Contact form submission received:", req.body);
    try {
        let { name, email, phone, countryCode, message } = req.body;

        // Validate required fields
        if (!name || !email || !phone || !message) {
            return res.status(400).json({ 
                error: "All fields are required",
                missing: {
                    name: !name,
                    email: !email,
                    phone: !phone,
                    message: !message
                }
            });
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: "Please enter a valid email address" });
        }

        // Phone validation (basic)
        if (phone.length < 10) {
            return res.status(400).json({ error: "Please enter a valid phone number" });
        }

        // Create contact entry
        let contact = await contactModel.create({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            phone: phone.trim(),
            countryCode: countryCode || '+91',
            message: message.trim()
        });

        // Send success response
        return res.status(201).json({
            message: "Thank you for contacting us! We'll get back to you soon.",
            contactId: contact._id,
            status: "success"
        });

    } catch (err) {
        console.error("Error in contact form submission:", err.message);
        
        // Handle duplicate email (if you want to prevent spam)
        if (err.code === 11000 && err.keyPattern?.email) {
            return res.status(400).json({ 
                error: "We've already received a message from this email recently. Please wait before submitting again." 
            });
        }
        
        return res.status(500).json({ 
            error: "Something went wrong. Please try again later.",
            details: err.message 
        });
    }
}

