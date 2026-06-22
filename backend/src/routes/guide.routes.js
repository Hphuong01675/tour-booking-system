import express from 'express';
import { verifyAccessToken, authorizeRoles } from '../middlewares/accessToken.middleware';
import * as guideController from '../controllers/guide.controller';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import uploadCloud from '../middlewares/upload.middleware';

const router = express.Router();

router.use(verifyAccessToken, authorizeRoles('guide'));

const uploadGuideAvatar = (req, res, next) => {
  uploadCloud.single('avatar')(req, res, (err) => {
    if (err) {
      const message = 'File ảnh không hợp lệ. Vui lòng chọn ảnh JPG, PNG hoặc WEBP.';
      return res.status(400).json({
        success: false,
        message,
        error: message
      });
    }
    next();
  });
};

router.get('/stats', guideController.getGuideStats);
router.get('/assigned-tours', guideController.getAssignedTours);
router.get('/assigned-tours/export', guideController.exportAssignedTours);
router.get('/assigned-tours/:id', guideController.getTourAssignmentDetail);
router.get('/assigned-tours/:id/export-customers', guideController.exportCustomers);
router.patch('/assigned-tours/:assignmentId/status', guideController.updateAssignmentStatus);
router.get('/profile', guideController.getGuideProfile);
router.patch('/profile', guideController.updateGuideProfile);
router.post('/profile/avatar', uploadGuideAvatar, guideController.uploadGuideAvatar);
router.post('/change-password', guideController.changeGuidePassword);
router.post('/assigned-tours/:id/notify', guideController.sendGroupNotification);
router.get('/checklist-templates', guideController.getChecklistTemplates);
router.post('/checklist-templates', guideController.createChecklistTemplate);
router.get('/packing-items', guideController.getPackingItems);
router.post('/packing-items', guideController.createPackingItem);
router.patch('/packing-items/:itemId', guideController.updatePackingItem);
router.delete('/packing-items/:itemId', guideController.deletePackingItem);
router.post('/assigned-tours/:id/checkin', guideController.checkinParticipant);
// Upload CCCD images for a participant (front/back) using Cloudinary
router.post('/assigned-tours/:assignmentId/participants/:participantId/cccd', uploadCloud.fields([{ name: 'front', maxCount: 1 }, { name: 'back', maxCount: 1 }]), guideController.uploadParticipantCccd);

export default router;
