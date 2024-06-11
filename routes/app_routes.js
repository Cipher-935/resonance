const express = require("express");
const router = express.Router();
const controller = require("../controllers/app_controller");
const mid = require("../middlewares/middlewares");

// User registeration route handlers
router.route("/register").get(controller.get_register);
router.route('/register').post(mid.sanitize_signup, controller.register);

// User login route handlers
router.route("/login").get(controller.get_login);
router.route("/login").post(mid.sanitize_login, controller.login);

router.route("/home").get(controller.get_home);

// User dashboard handlers
router.route("/dash").get(mid.check_login, controller.get_dash);
router.route("/dash_data").get(mid.check_login, controller.dash);


//Room handler routes
router.route("/room").get(mid.check_login, mid.check_query, mid.authorized, controller.get_room);
router.route("/update-room").post(mid.check_login, mid.authorized, controller.update_room);
router.route("/persist-chat").post(controller.persist_chat);
router.route("/get-chats").post(controller.get_chat);
router.route("/cleanup").post(controller.clean);


// Group manipulation
router.route("/make-group").post(mid.check_login, controller.make_group);
router.route("/view-group").post(mid.check_login, controller.group_details);
router.route("/verify-entry").post(mid.check_login, mid.verify_entry, controller.provide_entry);
router.route("/request").post(mid.check_login, controller.request);


module.exports = router;
