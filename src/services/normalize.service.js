function safeInt(value) {
    const n = parseInt(value);
    return isNaN(n) ? null : n;
}

function safeFloat(value) {
    const n = parseFloat(value);
    return isNaN(n) ? null : n;
}

function safeDate(value) {
    if (!value) return null;
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d.toISOString().split("T")[0];
}

function safeString(value) {
    if (!value) return null;
    const str = String(value).trim();
    return str.length === 0 ? null : str;
}

export default {
    studentInfo(rows) {
        return rows
            .map(r => {
                if (!r.id_student) return null; // ignore lignes sans student_id
                return {
                    student_id: safeString(r.id_student),
                    code_module: safeString(r.code_module),
                    code_presentation: safeString(r.code_presentation),
                    gender: safeString(r.gender),
                    region: safeString(r.region),
                    highest_education: safeString(r.highest_education),
                    imd_band: safeString(r.imd_band),
                    age_band: safeString(r.age_band),
                    num_of_prev_attempts: safeInt(r.num_of_prev_attempts),
                    studied_credits: safeInt(r.studied_credits),
                    disability: safeString(r.disability),
                    final_result: safeString(r.final_result)
                };
            })
            .filter(r => r !== null);
    },

    studentVle(rows) {
        return rows
            .map(r => {
                if (!r.id_student) return null;
                return {
                    id_student: safeInt(r.id_student),
                    code_module: safeString(r.code_module),
                    code_presentation: safeString(r.code_presentation),
                    id_site: safeInt(r.id_site),
                    activity_date: safeDate(r.date),
                    sum_click: safeInt(r.sum_click),
                    activity_type: "VLE_CLICK"
                };
            })
            .filter(r => r !== null);
    },

    studentAssessment(rows) {
        return rows
            .map(r => {
                if (!r.id_student) return null;
                return {
                    student_id: safeString(r.id_student),
                    activity_date: safeDate(r.date_submitted),
                    activity_type: "ASSESSMENT",
                    score: safeFloat(r.score),
                    assessment_type: safeString(r.assessment_type || "exam")
                };
            })
            .filter(r => r !== null);
    },

    courses(rows) {
        return rows
            .map(r => ({
                code_module: safeString(r.code_module),
                code_presentation: safeString(r.code_presentation),
                module_presentation_length: safeInt(r.module_presentation_length)
            }))
            .filter(r => r.code_module && r.code_presentation);
    },

    registrations(rows) {
        return rows
            .map(r => ({
                student_id: safeString(r.id_student),
                code_module: safeString(r.code_module),
                code_presentation: safeString(r.code_presentation),
                date_registration: safeDate(r.date_registration),
                date_unregistration: safeDate(r.date_unregistration)
            }))
            .filter(r => r.student_id && r.code_module && r.code_presentation);
    },

    vleInfo(rows) {
        return rows
            .map(r => ({
                id_site: safeInt(r.id_site),
                code_module: safeString(r.code_module),
                code_presentation: safeString(r.code_presentation),
                activity_type: safeString(r.activity_type),
                week_from: safeInt(r.week_from),
                week_to: safeInt(r.week_to)
            }))
            .filter(r => r.id_site && r.code_module && r.code_presentation);
    }
};
