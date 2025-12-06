-- ============================================
-- Base LMS pour microservice
-- Tables pour importer les CSVs et logs
-- ============================================

-- ---------------------------
-- Table des étudiants
-- ---------------------------
CREATE TABLE IF NOT EXISTS students (
    student_id VARCHAR(50) PRIMARY KEY,
    code_module VARCHAR(50),
    code_presentation VARCHAR(50),
    gender VARCHAR(10),
    region VARCHAR(100),
    highest_education VARCHAR(100),
    imd_band VARCHAR(50),
    age_band VARCHAR(50),
    num_of_prev_attempts INTEGER,
    studied_credits INTEGER,
    disability VARCHAR(100),
    final_result VARCHAR(50)
);

-- ---------------------------
-- Table des cours
-- ---------------------------
CREATE TABLE IF NOT EXISTS courses (
    code_module VARCHAR(50),
    code_presentation VARCHAR(50),
    module_presentation_length INT,
    PRIMARY KEY (code_module, code_presentation)
);

-- ---------------------------
-- Table des inscriptions
-- ---------------------------
CREATE TABLE IF NOT EXISTS registrations (
    student_id VARCHAR(50) REFERENCES students(student_id),
    code_module VARCHAR(50),
    code_presentation VARCHAR(50),
    date_registration DATE,
    date_unregistration DATE,
    PRIMARY KEY (student_id, code_module, code_presentation)
);

-- ---------------------------
-- Table VLE Info
-- ---------------------------
CREATE TABLE IF NOT EXISTS vle_info (
    id_site VARCHAR(50),
    code_module VARCHAR(50),
    code_presentation VARCHAR(50),
    activity_type VARCHAR(50),
    week_from INT,
    week_to INT,
    PRIMARY KEY (id_site, code_module, code_presentation)
);

-- ---------------------------
-- Table Learning Logs / Student VLE
-- ---------------------------
CREATE TABLE studentvle (
    code_module VARCHAR(10),
    code_presentation VARCHAR(10),
    id_student INT,
    id_site INT,
    activity_date DATE,
    sum_click INT,
    PRIMARY KEY (code_module, code_presentation, id_student, id_site, activity_date)
);

-- ---------------------------
-- Table Student Assessment
-- ---------------------------
CREATE TABLE IF NOT EXISTS studentassessment (
    student_id VARCHAR(50) NOT NULL,
    activity_date DATE,
    activity_type VARCHAR(50),
    score NUMERIC,
    assessment_type VARCHAR(50),
    PRIMARY KEY (student_id, activity_date, activity_type)
);

-- ---------------------------
-- Table des évaluations / assessments
-- ---------------------------
CREATE TABLE IF NOT EXISTS assessments (
    code_module VARCHAR(50),
    code_presentation VARCHAR(50),
    id_assessment VARCHAR(50),
    assessment_type VARCHAR(50),
    assessment_date DATE,
    weight NUMERIC,
    PRIMARY KEY (code_module, code_presentation, id_assessment)
);
