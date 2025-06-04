
const express = require('express');
const router = express.Router();
const courseController = require('../controllers/course.controller');



// GET all courses
router.get('/courses', courseController.getAllCourses);

// GET sub-courses by course_id
router.get('/sub-courses/:course_id', courseController.getSubCourses);

// GET practices by sub_course_id
router.get('/practices/:sub_course_id', courseController.getPractices);

// GET questions with options by practice_id + pagination
router.get('/questions/:practice_id', courseController.getQuestionsWithOptions);

//GET Question Packages
router.get('/question-packages/:sub_course_id',courseController.getQuestionPackages)
router.get('/packages/:package_id/questions', courseController.getQuestionsByPackageId);
router.get('/packges/:package_id', courseController.get_question_package_by_id)


router.get('/result/:package_id/:result_id', courseController.getUserResultById);

router.post('/submit-answer', courseController.submit_answer);

router.get('/leaderboard/:package_id/:entry', courseController.get_leaderboard_ranking_by_package_id)




module.exports = router;
