const db = require('../config/db');

exports.get_all_courses = async () => {
  const [rows] = await db.execute('SELECT * FROM courses');
  return rows;
};


exports.get_sub_course_by_course_id = async(course_id) => {
    const [rows] = await db.execute('SELECT * FROM sub_courses WHERE course_id = ?',[course_id])
    return rows;
}

exports.get_practices_data = async(sub_course_id)=> {
  const [rows] = await db.execute(`SELECT 
  p.id AS practice_id,
  p.sub_course_id AS sub_course_id,
  p.title AS practice_title,
  COUNT(q.id) AS total_questions
FROM 
  practices p
LEFT JOIN 
  questions q ON p.id = q.practice_id
WHERE 
  p.sub_course_id = ?
GROUP BY 
  p.id, p.title
ORDER BY 
  p.id;`,[sub_course_id])
  return rows
}

exports.get_practices_by_sub_course_id = async(sub_course_id) => {
    const [rows] = await db.execute('SELECT * FROM practices WHERE sub_course_id = ?',[sub_course_id])
    return rows;
}

exports.get_paginated_questions_by_practice_id = async (practice_id, limit, offset) => {
  const [rows] = await db.execute(
    'SELECT * FROM questions WHERE practice_id = ? LIMIT ? OFFSET ?',
    [practice_id, limit.toString(), offset.toString()]
  );
  return rows;
};

exports.get_question_package_by_id = async (package_id) => {
  const [rows] = await db.execute(
    'SELECT * FROM question_packages WHERE id = ?',
    [package_id]
  );
  return rows[0];
};



exports.get_question_ids_by_package_id = async (package_id) => {
  const [rows] = await db.query(`
    SELECT question_id FROM question_package_items WHERE package_id = ?
  `, [package_id]);
  return rows;
};

exports.get_questions_by_ids = async (questionIds) => {
  const [rows] = await db.query(`
    SELECT * FROM questions WHERE id IN (?)
  `, [questionIds]);
  return rows;
};

exports.get_question_options_by_question_id = async(question_id) => {
        const [rows] = await db.execute('SELECT * FROM question_options WHERE question_id = ?',[question_id])
    return rows;
}

exports.get_question_packages_by_sub_course_id = async(sub_course_id) => {
    const [rows] = await db.execute('SELECT * FROM question_packages WHERE sub_course_id = ?',[sub_course_id])
    return rows;
}

exports.get_user_result_by_id = async(package_id,result_id) => {
  const [rows] = await db.execute(`
SELECT 
  ranked.*,
  u.name AS user_name,
  u.email AS user_email,
  u.profile_picture,
  qp.title AS package_title,
  qp.description AS package_description,
  qp.package_type
FROM (
  SELECT 
    ur.id,
    ur.user_id,
    ur.package_id,
    ur.total_questions,
    ur.started_at,
    ur.finished_at,
    ur.score,
    ur.status,
    ur.created_at,
    ur.updated_at,
    ur.correct_count,
    ur.wrong_count,
    ur.empty_count,
    ur.result_by_category,
    RANK() OVER (PARTITION BY ur.package_id ORDER BY ur.score DESC) AS user_rank,
    COUNT(*) OVER (PARTITION BY ur.package_id) AS total_participants_by_package_id
  FROM user_results ur
  WHERE ur.package_id = ?
) AS ranked
JOIN users u ON ranked.user_id = u.id
JOIN question_packages qp ON ranked.package_id = qp.id
WHERE ranked.id = ?;


`, [package_id,result_id]);

return rows[0]; // karena hanya 1 result

}

exports.create_user_result = async ({
  user_id,
  package_id,
  total_questions,
  correct_count,
  wrong_count,
  empty_count,
  score,
  started_at,
  finished_at,
  answers, 
  result_by_category
}) => {
  const [result] = await db.execute(
    `INSERT INTO user_results 
    (user_id, package_id, total_questions, correct_count, wrong_count, empty_count, score, started_at, finished_at, answers, result_by_category) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      user_id,
      package_id,
      total_questions,
      correct_count,
      wrong_count,
      empty_count,
      score,
      started_at,
      finished_at,
      JSON.stringify(answers),
      JSON.stringify(result_by_category)
    ]
  );
   return { insertId: result.insertId };
};


exports.get_sub_course_by_practice_id = async (practice_id) => {
  const [rows] = await db.execute(
    `SELECT sc.id as sub_course_id, sc.title as sub_course_title
     FROM practices p
     JOIN sub_courses sc ON p.sub_course_id = sc.id
     WHERE p.id = ?`,
    [practice_id]
  );
  return rows[0]; // ambil 1 karena 1 practice hanya punya 1 sub_course
};

exports.get_leaderboard_ranking_by_package_id = async (entry,package_id) => {
  const [rows] = await db.execute(
    `SELECT 
    ROW_NUMBER() OVER (ORDER BY ur.max_score DESC) AS "rank",
    u.name,
    ur.max_score AS score
FROM (
    SELECT 
        user_id,
        MAX(score) AS max_score
    FROM user_results
    WHERE status = 'finished' AND package_id = ?
    GROUP BY user_id
) AS ur
JOIN users u ON u.id = ur.user_id
ORDER BY ur.max_score DESC
LIMIT ?;
`,
    [package_id, entry]
  );
  return rows; // ambil 1 karena 1 practice hanya punya 1 sub_course
};

