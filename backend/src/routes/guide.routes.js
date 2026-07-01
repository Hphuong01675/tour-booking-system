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

const uploadCCCD = (req, res, next) => {
  uploadCloud.fields([
    { name: 'front', maxCount: 1 },
    { name: 'back', maxCount: 1 },
    { name: 'frontImage', maxCount: 1 },
    { name: 'backImage', maxCount: 1 },
  ])(req, res, (err) => {
    if (err) {
      console.error('[uploadCCCD Middleware] Error:', {
        message: err.message,
        code: err.code,
        field: err.field,
        limit: err.limit,
        received: err.received,
        stack: err.stack
      });
      
      // More specific error messages
      let message = 'File ảnh không hợp lệ. Vui lòng chọn ảnh JPG, PNG hoặc WEBP.';
      if (err.code === 'LIMIT_FILE_SIZE') {
        message = 'Kích thước file vượt quá giới hạn 20MB.';
      } else if (err.message && err.message.includes('image')) {
        message = 'File phải là ảnh. Vui lòng chọn ảnh JPG, PNG hoặc WEBP.';
      } else if (err.message) {
        message = `Lỗi: ${err.message}`;
      }
      
      return res.status(400).json({
        success: false,
        message,
        error: err.message || message,
        code: err.code
      });
    }
    console.log('[uploadCCCD Middleware] Files parsed successfully. Fields:', Object.keys(req.files || {}), 'File details:', {
      front: req.files?.front?.map(f => ({ fieldname: f.fieldname, mimetype: f.mimetype, size: f.size })),
      back: req.files?.back?.map(f => ({ fieldname: f.fieldname, mimetype: f.mimetype, size: f.size })),
      frontImage: req.files?.frontImage?.map(f => ({ fieldname: f.fieldname, mimetype: f.mimetype, size: f.size })),
      backImage: req.files?.backImage?.map(f => ({ fieldname: f.fieldname, mimetype: f.mimetype, size: f.size }))
    });
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
router.post('/assigned-tours/:assignmentId/participants/:participantId/cccd', uploadCCCD, guideController.uploadParticipantCccd);

export default router;
