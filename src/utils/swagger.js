import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "LMSConnector API",
            version: "1.0.0",
            description: "Microservice pour importer les CSV OULAD et préparer les données d'apprentissage"
        },
        servers: [
            { url: "http://localhost:3001" }
        ],
        components: {
            schemas: {
                FileUpload: {
                    type: "object",
                    properties: {
                        file: { type: "string", format: "binary", description: "Fichier CSV à importer" }
                    },
                    required: ["file"]
                },
                ResponseMessage: {
                    type: "object",
                    properties: {
                        success: { type: "boolean" },
                        message: { type: "string" }
                    }
                },
                LearningLog: {
                    type: "object",
                    properties: {
                        student_id: { type: "string" },
                        module: { type: "string" },
                        presentation: { type: "string" },
                        activity_date: { type: "string", format: "date" },
                        activity_type: { type: "string" },
                        clicks: { type: "integer" },
                        score: { type: "number" },
                        assessment_type: { type: "string" }
                    }
                },
                Registration: {
                    type: "object",
                    properties: {
                        student_id: { type: "string" },
                        code_module: { type: "string" },
                        code_presentation: { type: "string" },
                        date_registration: { type: "string", format: "date" },
                        date_unregistration: { type: "string", format: "date" }
                    }
                },
                Course: {
                    type: "object",
                    properties: {
                        code_module: { type: "string" },
                        code_presentation: { type: "string" },
                        module_presentation_length: { type: "integer" }
                    }
                },
                VLEInfo: {
                    type: "object",
                    properties: {
                        id_site: { type: "string" },
                        code_module: { type: "string" },
                        code_presentation: { type: "string" },
                        activity_type: { type: "string" },
                        week_from: { type: "integer" },
                        week_to: { type: "integer" }
                    }
                },
                Assessment: {
                    type: "object",
                    properties: {
                        code_module: { type: "string" },
                        code_presentation: { type: "string" },
                        id_assessment: { type: "string" },
                        assessment_type: { type: "string" },
                        assessment_date: { type: "string", format: "date" },
                        weight: { type: "number" }
                    }
                }
            }
        },
        paths: {
            // ---------------- Import CSV ----------------
            "/student-info": {
                post: {
                    summary: "Importer le CSV des informations des étudiants",
                    tags: ["Import"],
                    description: "Requiert OAuth. CSV importé via handleImport. Message : StudentInfo importé",
                    requestBody: {
                        required: true,
                        content: { "multipart/form-data": { schema: { $ref: "#/components/schemas/FileUpload" } } }
                    },
                    responses: {
                        200: { description: "Import réussi", content: { "application/json": { schema: { $ref: "#/components/schemas/ResponseMessage" } } } }
                    }
                }
            },
            "/student-vle": {
                post: {
                    summary: "Importer le CSV des activités VLE des étudiants",
                    tags: ["Import"],
                    description: "Requiert OAuth. CSV importé via handleImport. Message : StudentVLE importé avec succès",
                    requestBody: {
                        required: true,
                        content: { "multipart/form-data": { schema: { $ref: "#/components/schemas/FileUpload" } } }
                    },
                    responses: {
                        200: { description: "Import réussi", content: { "application/json": { schema: { $ref: "#/components/schemas/ResponseMessage" } } } }
                    }
                },
                get: {
                    summary: "Récupérer les activités VLE des étudiants (avec pagination)",
                    tags: ["Student VLE"],
                    parameters: [
                        { in: "query", name: "page", schema: { type: "integer", default: 1 }, description: "Numéro de la page" },
                        { in: "query", name: "size", schema: { type: "integer", default: 1000 }, description: "Nombre de lignes par page (max 20000)" }
                    ],
                    responses: {
                        200: {
                            description: "Liste paginée des activités VLE",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "object",
                                        properties: {
                                            page: { type: "integer" },
                                            size: { type: "integer" },
                                            rows: { type: "integer" },
                                            data: { type: "array", items: { $ref: "#/components/schemas/LearningLog" } }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "/student-assessment": {
                post: {
                    summary: "Importer le CSV des évaluations des étudiants",
                    tags: ["Import"],
                    description: "Requiert OAuth. CSV importé via handleImport. Message : StudentAssessment importé",
                    requestBody: {
                        required: true,
                        content: { "multipart/form-data": { schema: { $ref: "#/components/schemas/FileUpload" } } }
                    },
                    responses: {
                        200: { description: "Import réussi", content: { "application/json": { schema: { $ref: "#/components/schemas/ResponseMessage" } } } }
                    }
                },
                get: {
                    summary: "Récupérer toutes les évaluations des étudiants",
                    tags: ["Student Assessment"],
                    responses: {
                        200: { description: "Liste des évaluations des étudiants", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Assessment" } } } } }
                    }
                }
            },
            "/courses": {
                post: {
                    summary: "Importer le CSV des cours",
                    tags: ["Import"],
                    description: "Requiert OAuth. CSV importé via handleImport. Message : Courses importés",
                    requestBody: {
                        required: true,
                        content: { "multipart/form-data": { schema: { $ref: "#/components/schemas/FileUpload" } } }
                    },
                    responses: {
                        200: { description: "Import réussi", content: { "application/json": { schema: { $ref: "#/components/schemas/ResponseMessage" } } } }
                    }
                },
                get: {
                    summary: "Récupérer tous les cours",
                    tags: ["Courses"],
                    responses: {
                        200: { description: "Liste de tous les cours", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Course" } } } } }
                    }
                }
            },
            "/registrations": {
                post: {
                    summary: "Importer le CSV des inscriptions des étudiants",
                    tags: ["Import"],
                    description: "Requiert OAuth. CSV importé via handleImport. Message : Registrations importées",
                    requestBody: {
                        required: true,
                        content: { "multipart/form-data": { schema: { $ref: "#/components/schemas/FileUpload" } } }
                    },
                    responses: {
                        200: { description: "Import réussi", content: { "application/json": { schema: { $ref: "#/components/schemas/ResponseMessage" } } } }
                    }
                },
                get: {
                    summary: "Récupérer toutes les inscriptions",
                    tags: ["Registrations"],
                    responses: {
                        200: { description: "Liste des inscriptions", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Registration" } } } } }
                    }
                }
            },
            "/vle-info": {
                post: {
                    summary: "Importer le CSV des informations VLE",
                    tags: ["Import"],
                    description: "Requiert OAuth. CSV importé via handleImport. Message : VLE Info importé",
                    requestBody: {
                        required: true,
                        content: { "multipart/form-data": { schema: { $ref: "#/components/schemas/FileUpload" } } }
                    },
                    responses: {
                        200: { description: "Import réussi", content: { "application/json": { schema: { $ref: "#/components/schemas/ResponseMessage" } } } }
                    }
                },
                get: {
                    summary: "Récupérer toutes les infos VLE",
                    tags: ["VLE Info"],
                    responses: {
                        200: { description: "Liste des infos VLE", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/VLEInfo" } } } } }
                    }
                }
            },
            "/assessments": {
                post: {
                    summary: "Importer le CSV des évaluations",
                    tags: ["Import"],
                    description: "Requiert OAuth. CSV importé via handleImport. Message : Assessments importés",
                    requestBody: {
                        required: true,
                        content: { "multipart/form-data": { schema: { $ref: "#/components/schemas/FileUpload" } } }
                    },
                    responses: {
                        200: { description: "Import réussi", content: { "application/json": { schema: { $ref: "#/components/schemas/ResponseMessage" } } } }
                    }
                },
                get: {
                    summary: "Récupérer toutes les évaluations",
                    tags: ["Assessments"],
                    responses: {
                        200: { description: "Liste des évaluations", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Assessment" } } } } }
                    }
                }
            },
            "/students": {
                get: {
                    summary: "Récupérer tous les étudiants",
                    tags: ["Students"],
                    responses: {
                        200: { description: "Liste de tous les étudiants", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Registration" } } } } }
                    }
                }
            }
        }
    },
    apis: []
};

const swaggerSpec = swaggerJsdoc(options);

export function setupSwagger(app) {
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}
