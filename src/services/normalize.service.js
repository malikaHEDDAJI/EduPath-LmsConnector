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
    return isNaN(d) ? null : d.toISOString().split("T")[0];
}

function safeString(value) {
    if (!value) return null;
    const str = String(value).trim();
    return str.length === 0 ? null : str;
}

export function studentInfo(data) {
    return data.map(row => {
        if (!row.id_student) return null; // ignore lignes sans id_student

        const parseIntOrNull = val => {
            const n = parseInt(val, 10);
            return isNaN(n) ? null : n;
        };

        const cleanStr = val => val && val.toString().trim() !== "" ? val.toString().trim() : null;

        return {
            student_id: cleanStr(row.id_student),
            code_module: cleanStr(row.code_module),
            code_presentation: cleanStr(row.code_presentation),
            gender: cleanStr(row.gender),
            region: cleanStr(row.region),
            highest_education: cleanStr(row.highest_education),
            imd_band: cleanStr(row.imd_band),
            age_band: cleanStr(row.age_band),
            num_of_prev_attempts: parseIntOrNull(row.num_of_prev_attempts),
            studied_credits: parseIntOrNull(row.studied_credits),
            disability: cleanStr(row.disability),
            final_result: cleanStr(row.final_result)
        };
    }).filter(r => r !== null); // retirer les lignes nulles
}


export default {
    studentInfo(rows) {
        return rows.map(r => ({
            student_id: safeInt(r.id_student),
            gender: safeString(r.gender),
            region: safeString(r.region),
            highest_education: safeString(r.highest_education),
            disability: safeString(r.disability)
        }));
    },
    studentVle(rows) {
        return rows.map(r => ({
            student_id: safeInt(r.id_student),
            module: safeString(r.code_module),
            presentation: safeString(r.code_presentation),
            activity_date: safeDate(r.date),
            activity_type: "VLE_CLICK",
            clicks: safeInt(r.sum_click)
        }));
    },
    studentAssessment(rows) {
        return rows.map(r => ({
            student_id: safeInt(r.id_student),
            activity_date: safeDate(r.date_submitted),
            activity_type: "ASSESSMENT",
            score: safeFloat(r.score),
            assessment_type: safeString(r.assessment_type || "exam")
        }));
    },
    courses(rows) {
        return rows.map(r => ({
            code_module: safeString(r.code_module),
            code_presentation: safeString(r.code_presentation),
            module_presentation_length: safeInt(r.module_presentation_length)
        }));
    },
    registrations(rows) {
        return rows.map(r => ({
            student_id: safeInt(r.id_student),
            code_module: safeString(r.code_module),
            code_presentation: safeString(r.code_presentation),
            date_registration: safeDate(r.date_registration),
            date_unregistration: safeDate(r.date_unregistration)
        }));
    },
    vleInfo(rows) {
        return rows.map(r => ({
            id_site: safeInt(r.id_site),
            code_module: safeString(r.code_module),
            code_presentation: safeString(r.code_presentation),
            activity_type: safeString(r.activity_type),
            week_from: safeInt(r.week_from),
            week_to: safeInt(r.week_to)
        }));
    }
};
