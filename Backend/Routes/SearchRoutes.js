const express = require("express");
const router = express.Router();
const User = require("../Models/UserModel");
const Post = require("../Models/PostModel");
const { AllSearchcontroller } = require("../Controllers/searchController");

// Unified search endpoint
router.get("/", AllSearchcontroller);

module.exports = router;
