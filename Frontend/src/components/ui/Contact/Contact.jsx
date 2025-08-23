import React, { useState } from "react";
import { FaTwitter, FaLinkedin, FaInstagram } from "react-icons/fa";
import { MdEmail } from "react-icons/md";
import { FiPhone } from "react-icons/fi";
import { NavLink } from "react-router-dom";

function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    countryCode: "+91",
    message: ""
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }
    
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (formData.phone.length < 10) {
      newErrors.phone = "Please enter a valid phone number";
    }
    
    if (!formData.message.trim()) {
      newErrors.message = "Message is required";
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    
    try {
      const response = await fetch("/api/contact/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitStatus({ 
          type: "success", 
          message: data.message 
        });
        setFormData({
          name: "",
          email: "",
          phone: "",
          countryCode: "+91",
          message: ""
        });
      } else {
        setSubmitStatus({ 
          type: "error", 
          message: data.error || "Something went wrong" 
        });
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setSubmitStatus({ 
        type: "error", 
        message: "Network error. Please check your connection and try again." 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 dark:bg-neutral-800 dark:text-white">
      <main className="flex flex-1 flex-col md:flex-row">
        <section className="flex flex-1 items-center justify-center p-8 text-gray-600">
          <div className="w-full max-w-2xl bg-white p-10 rounded-lg shadow dark:bg-gray-700">
            <h2 className="text-2xl font-semibold mb-4">Contact Our Team</h2>
            <p className="text-gray-600 mb-6 dark:text-white">
              We'd love to hear from you. Fill out the form below to get in touch.
            </p>
            
            {submitStatus && (
              <div className={`mb-4 p-4 rounded-lg ${
                submitStatus.type === "success" 
                  ? "bg-green-100 text-green-700 border border-green-300" 
                  : "bg-red-100 text-red-700 border border-red-300"
              }`}>
                {submitStatus.message}
              </div>
            )}
            
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <p className="text-left pl-2">Name</p>
                <input
                  type="text"
                  name="name"
                  placeholder="Your Name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                    errors.name ? "border-red-500" : ""
                  }`}
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>

              <div>
                <p className="text-left pl-2">Email</p>
                <input
                  type="email"
                  name="email"
                  placeholder="your.email@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                    errors.email ? "border-red-500" : ""
                  }`}
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>

              <div>
                <p className="text-left pl-2">Phone no.</p>
                <div className="flex gap-2">
                  <select 
                    name="countryCode"
                    value={formData.countryCode}
                    onChange={handleInputChange}
                    className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <option value="+91">🇮🇳 +91</option>
                    <option value="+1">🇺🇸 +1</option>
                    <option value="+44">🇬🇧 +44</option>
                  </select>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="Phone Number"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={`flex-1 border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                      errors.phone ? "border-red-500" : ""
                    }`}
                  />
                </div>
                {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
              </div>

              <div>
                <p className="text-left pl-2">Message</p>
                <textarea
                  name="message"
                  placeholder="Tell us how we can help you..."
                  rows="4"
                  value={formData.message}
                  onChange={handleInputChange}
                  className={`w-full border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-vertical ${
                    errors.message ? "border-red-500" : ""
                  }`}
                />
                {errors.message && <p className="text-red-500 text-sm mt-1">{errors.message}</p>}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Sending..." : "Send Message"}
              </button>
            </form>
          </div>
        </section>

        <div className="flex flex-col justify-center p-8 bg-gradient-to-tr from-blue-100 to-teal-100 w-full md:w-80 m-8 md:rounded">
          <h3 className="text-lg font-semibold mb-4 text-black">Connect with us</h3>
          <div className="flex flex-col space-y-3 text-gray-700">
            <NavLink
              to="https://x.com/AakashBorj86238"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 hover:text-black"
            >
              <FaTwitter /> X (Twitter)
            </NavLink>
            <NavLink
              to="https://linkedin.com"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 hover:text-blue-700"
            >
              <FaLinkedin /> LinkedIn
            </NavLink>
            <NavLink
              to="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 hover:text-pink-500"
            >
              <FaInstagram /> Instagram
            </NavLink>
            <NavLink
              to="mailto:aakashborji7@gmail.com"
              className="flex items-center gap-2 hover:text-red-500"
            >
              <MdEmail /> aakashborji7@gmail.com
            </NavLink>
            <p className="flex items-center gap-2 text-gray-800">
              <FiPhone /> +91 98765 432XX
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Contact;