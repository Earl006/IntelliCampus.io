import express from "express";
import UserController from "../controllers/user.controller";

const userController = new UserController();
const router = express.Router();

// User routes
router.get("/", userController.getAllUsers);
router.get("/active", userController.getAllActiveUsers);
router.get("/inactive", userController.getAllInactiveUsers);
router.get("/email/:email", userController.getUserByEmail);
router.get("/phone/:phoneNumber", userController.getUserByPhoneNumber);
router.get("/role/:role", userController.getAllUsersByRole);
router.get("/:id", userController.getUserById);
router.put("/password/:id", userController.changePassword);
router.put("/profile/:id", userController.updateProfile);
router.delete("/account/:id", userController.deleteAccount);
router.put("/deactivate/:id", userController.deactivateAccount);
router.put("/activate/:id", userController.ActivateAccount);

// Instructor-related routes
router.get("/instructors/requests", userController.getInstructorRequests);
router.get("/instructors/user/:userId", userController.getInstructorByUserId);
router.post("/request-instructor/:id", userController.requestInstructorRole);
router.post("/approve-instructor/:id", userController.approveInstructorRequests);
router.post("/reject-instructor/:id", userController.rejectInstructorRequests);

// Role management routes
router.post("/assign-role/:id", userController.assignRole);

export default router;
