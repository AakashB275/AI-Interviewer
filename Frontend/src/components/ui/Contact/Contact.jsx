import React from "react";
import { FaTwitter, FaLinkedin, FaInstagram } from "react-icons/fa";
import { MdEmail } from "react-icons/md";
import { FiPhone } from "react-icons/fi";
import { NavLink } from "react-router-dom";


function Contact() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 dark:bg-neutral-800 dark:text-white">
      <main className="flex flex-1 flex-col md:flex-row">

        <section className="flex flex-1 items-center justify-center p-8 text-gray-600">
          <div className="w-full max-w-2xl bg-white p-10 rounded-lg shadow dark:bg-gray-700">
            <h2 className="text-2xl font-semibold mb-4">Contact Our Team</h2>
            <p className="text-gray-600 mb-6 dark:text-white">
              We’d love to hear from you. Fill out the form below to get in touch.
            </p>
            <form className="space-y-4">
              <p className="text-left pl-2">Name</p>
              <input
                type="text"
                placeholder="Name"
                className="w-full border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />

              <p className="text-left pl-2">Email</p>
              <input
                type="email"
                placeholder="Email"
                className="w-full border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />

              <p className="text-left pl-2">Phone no.</p>
              <div className="flex gap-2">
                <select className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400">
                  <option value="+91">🇮🇳 +91</option>
                  <option value="+1">🇺🇸 +1</option>
                  <option value="+44">🇬🇧 +44</option>
                </select>
                <input
                  type="number"
                  placeholder="Number"
                  className="flex-1 border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <p className="text-left pl-2">Message</p>
              <textarea
                placeholder="Leave Us A Message"
                rows="4"
                className="w-full border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />

              <button
                type="submit"
                className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition"
              >
                Send Message
              </button>
            </form>
          </div>
        </section>

        <div className="flex flex-col justify-center p-8 bg-gradient-to-tr from-blue-100 to-teal-100 w-full md:w-80 m-8 md:rounded ">
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
              href="https://linkedin.com"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 hover:text-blue-700"
            >
              <FaLinkedin /> LinkedIn
            </NavLink>
            <NavLink
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 hover:text-pink-500"
            >
              <FaInstagram /> Instagram
            </NavLink>
            <NavLink
              href="mailto:aakashborji7@gmail.com"
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
