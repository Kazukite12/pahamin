// === File: src/controllers/course.controller.js ===
const courseModel = require('../models/course.model');
const helper = require('../utils/helper')

exports.getAllCourses = async (req, res) => {
  try {
    const courses = await courseModel.get_all_courses();
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getSubCourses = async (req, res) => {
  try {
    const { course_id } = req.params;
    const subCourses = await courseModel.get_sub_course_by_course_id(course_id);
    res.json(subCourses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getPractices = async (req, res) => {
  try {
    const { sub_course_id } = req.params;
    const practices = await courseModel.get_practices_by_sub_course_id(sub_course_id);
    res.json(practices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getQuestionsWithOptions = async (req, res) => {
  try {
    const { practice_id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const offset = (page - 1) * limit;

    const questions = await courseModel.get_paginated_questions_by_practice_id(practice_id, limit, offset);

    const questionsWithOptions = await Promise.all(
      questions.map(async (q) => {
        const options = await courseModel.get_question_options_by_question_id(q.id);
        return { ...q, options };
      })
    );

    const subCourse = await courseModel.get_sub_course_by_practice_id(practice_id);

    res.json({
      currentPage: page,
      subCourse,
      questions: questionsWithOptions,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getQuestionPackages =async(req,res)=> {
    try {
    const { sub_course_id } = req.params;
    const questionPackages = await courseModel.get_question_packages_by_sub_course_id(sub_course_id);
    res.json(questionPackages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

exports.getUserResultById =async(req,res)=> {
    try {
    const { package_id,result_id } = req.params;
    const userResults = await courseModel.get_user_result_by_id(package_id,result_id);
    res.json(userResults);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}


exports.getQuestionsByPackageId = async (req, res) => {
  try {
    const { package_id } = req.params;

    // Step 1: Get all question IDs for the package
    const questionIdsResult = await courseModel.get_question_ids_by_package_id(package_id);
    const questionIds = questionIdsResult.map(row => row.question_id);

    if (questionIds.length === 0) {
      return res.status(404).json({ message: "No questions found for this package." });
    }

    // Step 2: Get question data
    const questions = await courseModel.get_questions_by_ids(questionIds);

    // Step 3: Append options to each question
    const questionsWithOptions = await Promise.all(
      questions.map(async (q) => {
        const options = await courseModel.get_question_options_by_question_id(q.id);
         const subCourse = await courseModel.get_sub_course_by_practice_id(q.practice_id);
        return { ...q, sub_course:subCourse,options };
      })
    );

    res.json({ questions: questionsWithOptions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



exports.submit_answer = async (req, res) => {
  try {
    const {
      user_id,
      package_id,
      total_questions,
      started_at,
      finished_at,
      answers, // format array seperti yang kamu berikan
    } = req.body;

    if (!user_id || !package_id || !answers) {
      return res.status(400).json({ message: 'Data tidak lengkap' });
    }

    let correct_count = 0;
    let wrong_count = 0;
    let empty_count = 0;

    answers.forEach((item) => {
      const userAnswer = item.userAnswer?.toLowerCase();
      const correctAnswer = item.answer?.toLowerCase();

      if (!userAnswer || userAnswer === "") {
        empty_count++;
      } else if (userAnswer === correctAnswer) {
        correct_count++;
      } else {
        wrong_count++;
      }
    });

    const calculated_score = Math.round((correct_count / total_questions) * 100);

    const result_by_category= helper.calculateResultsBySubCourses(answers);

    const result = await courseModel.create_user_result({
      user_id,
      package_id,
      total_questions,
      correct_count,
      wrong_count,
      empty_count,
      score: calculated_score,
      started_at,
      finished_at,
      answers,
      result_by_category
    });

    res.status(200).json({
      message: 'Jawaban berhasil disimpan',
      result: result
    });

  } catch (err) {
    console.error('Error submit answer:', err);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};



exports.get_leaderboard_ranking_by_package_id =async(req,res)=> {
    try {
    const { entry,package_id } = req.params;
    const leaderboardResults = await courseModel.get_leaderboard_ranking_by_package_id(entry,package_id);
    res.json(leaderboardResults);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

exports.get_question_package_by_id =async(req,res)=> {
    try {
    const { package_id } = req.params;
    const question_package = await courseModel.get_question_package_by_id(package_id);
    res.json(question_package);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

