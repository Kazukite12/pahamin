exports.calculateResultsBySubCourses =(answers)=> {
  const grouped = {};

  // Grouping dan penghitungan benar
  answers.forEach((item) => {
    const subCourseId = item.sub_course.sub_course_id;
    const subCourseTitle = item.sub_course.sub_course_title;

    if (!grouped[subCourseId]) {
      grouped[subCourseId] = {
        category: subCourseTitle,
        categoryName: subCourseTitle,
        correctAnswers: 0,
        totalQuestions: 0,
        maxScore: 100
      };
    }

    grouped[subCourseId].totalQuestions++;

    const userAnswer = item.userAnswer?.toLowerCase();
    const correctAnswer = item.answer?.toLowerCase();

    if (userAnswer && userAnswer === correctAnswer) {
      grouped[subCourseId].correctAnswers++;
    }
  });

  // Hitung skor per kategori dan konversi jadi array
  const resultArray = Object.values(grouped).map((item) => ({
    ...item,
    score: Math.round((item.correctAnswers / item.totalQuestions) * 100)
  }));

  return resultArray;
}


exports.generateOTP =()=> {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit
}

// Fungsi bantu untuk menyingkat nama jadi kode kategori (opsional, bisa dihardcode juga)
function getSubCourseCode(title) {
  const mapping = {
    "Tes Wawasan Kebangsaan": "TWK",
    "Tes Intelegensi Umum": "TIU",
    "Tes Karakteristik Pribadi": "TKP"
  };
  return mapping[title] || title.substring(0, 3).toUpperCase(); // fallback
}
