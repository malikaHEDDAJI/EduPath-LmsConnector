import swaggerUi from "swagger-ui-express";

export const setupSwagger = (app) => {
    const swaggerDocument = {
        openapi: "3.0.0",
        info: {
            title: "LMSConnector API",
            version: "1.0.0",
            description: "Microservice d'importation CSV et extraction JSON pour LMS",
        },
        servers: [
            { url: "http://localhost:3001", description: "Local server" }
        ],
        paths: {
            // ---------------------------------------------------
            // POST — IMPORT CSV
            // ---------------------------------------------------
            "/student-info": {
                post: {
                    tags: ["CSV Import"],
                    summary: "Importer étudiant (StudentInfo) via CSV",
                    requestBody: {
                        required: true,
                        content: {
                            "multipart/form-data": {
                                schema: {
                                    type: "object",
                                    properties: { file: { type: "string", format: "binary" } }
                                }
                            }
                        }
                    },
                    responses: { 200: { description: "Import StudentInfo OK" } }
                }
            },

            "/student-vle": {
                post: {
                    tags: ["CSV Import"],
                    summary: "Importer Student VLE (activités) via CSV",
                    requestBody: {
                        required: true,
                        content: {
                            "multipart/form-data": {
                                schema: {
                                    type: "object",
                                    properties: { file: { type: "string", format: "binary" } }
                                }
                            }
                        }
                    },
                    responses: { 200: { description: "Import StudentVLE OK" } }
                }
            },

            "/student-assessment": {
                post: {
                    tags: ["CSV Import"],
                    summary: "Importer StudentAssessment via CSV",
                    requestBody: {
                        required: true,
                        content: {
                            "multipart/form-data": {
                                schema: {
                                    type: "object",
                                    properties: { file: { type: "string", format: "binary" } }
                                }
                            }
                        }
                    },
                    responses: { 200: { description: "Import StudentAssessment OK" } }
                }
            },

            "/courses": {
                post: {
                    tags: ["CSV Import"],
                    summary: "Importer les cours via CSV",
                    requestBody: {
                        required: true,
                        content: {
                            "multipart/form-data": {
                                schema: {
                                    type: "object",
                                    properties: { file: { type: "string", format: "binary" } }
                                }
                            }
                        }
                    },
                    responses: { 200: { description: "Courses imported" } }
                },
                get: {
                    tags: ["GET Data"],
                    summary: "Récupérer la liste des cours",
                    responses: {
                        200: {
                            description: "Liste des cours",
                            content: {
                                "application/json": {
                                    schema: { type: "array", items: { $ref: "#/components/schemas/Course" } }
                                }
                            }
                        }
                    }
                }
            },

            "/registrations": {
                post: {
                    tags: ["CSV Import"],
                    summary: "Importer les inscriptions (Registrations)",
                    requestBody: {
                        required: true,
                        content: {
                            "multipart/form-data": {
                                schema: { type: "object", properties: { file: { type: "string", format: "binary" } } }
                            }
                        }
                    },
                    responses: { 200: { description: "Registrations imported" } }
                },
                get: {
                    tags: ["GET Data"],
                    summary: "Récupérer les inscriptions",
                    responses: {
                        200: {
                            description: "Liste des inscriptions",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "array",
                                        items: { $ref: "#/components/schemas/Registration" }
                                    }
                                }
                            }
                        }
                    }
                }
            },

            "/vle-info": {
                post: {
                    tags: ["CSV Import"],
                    summary: "Importer VLE Info via CSV",
                    requestBody: {
                        required: true,
                        content: {
                            "multipart/form-data": {
                                schema: { type: "object", properties: { file: { type: "string", format: "binary" } } }
                            }
                        }
                    },
                    responses: { 200: { description: "VLE Info imported" } }
                },
                get: {
                    tags: ["GET Data"],
                    summary: "Récupérer la table VLE Info",
                    responses: {
                        200: {
                            description: "Liste VLE Info",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "array",
                                        items: { $ref: "#/components/schemas/VleInfo" }
                                    }
                                }
                            }
                        }
                    }
                }
            },

            "/assessments": {
                post: {
                    tags: ["CSV Import"],
                    summary: "Importer Assessments via CSV",
                    requestBody: {
                        required: true,
                        content: {
                            "multipart/form-data": {
                                schema: { type: "object", properties: { file: { type: "string", format: "binary" } } }
                            }
                        }
                    },
                    responses: { 200: { description: "Assessments imported" } }
                },
                get: {
                    tags: ["GET Data"],
                    summary: "Récupérer toutes les évaluations",
                    responses: {
                        200: {
                            description: "Liste des assessments",
                            content: {
                                "application/json": {
                                    schema: { type: "array", items: { $ref: "#/components/schemas/Assessment" } }
                                }
                            }
                        }
                    }
                }
            },

            "/students": {
                get: {
                    tags: ["GET Data"],
                    summary: "Récupérer la liste des étudiants",
                    responses: {
                        200: {
                            description: "Liste des étudiants",
                            content: {
                                "application/json": {
                                    schema: { type: "array", items: { $ref: "#/components/schemas/Student" } }
                                }
                            }
                        }
                    }
                }
            },

            "/learning-logs": {
                get: {
                    tags: ["GET Data"],
                    summary: "Récupérer tous les logs VLE",
                    responses: {
                        200: {
                            description: "Learning logs list",
                            content: {
                                "application/json": {
                                    schema: { type: "array", items: { $ref: "#/components/schemas/LearningLog" } }
                                }
                            }
                        }
                    }
                }
            },

            "/student-assessment": {
                get: {
                    tags: ["GET Data"],
                    summary: "Récupérer StudentAssessment (table complète)",
                    responses: {
                        200: {
                            description: "StudentAssessment table",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "array",
                                        items: { $ref: "#/components/schemas/StudentAssessment" }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },

        // ---------------------------------------------------
        // SCHEMAS
        // ---------------------------------------------------
        components: {
            schemas: {
                Student: {
                    type: "object",
                    properties: {
                        id_student: { type: "integer" },
                        name: { type: "string" },
                        gender: { type: "string" },
                        region: { type: "string" }
                    }
                },

                Course: {
                    type: "object",
                    properties: {
                        code_module: { type: "string" },
                        code_presentation: { type: "string" },
                        module_title: { type: "string" }
                    }
                },

                Registration: {
                    type: "object",
                    properties: {
                        id_student: { type: "integer" },
                        code_module: { type: "string" },
                        code_presentation: { type: "string" },
                        date_registration: { type: "integer" }
                    }
                },

                VleInfo: {
                    type: "object",
                    properties: {
                        id_site: { type: "integer" },
                        activity_type: { type: "string" },
                        week_from: { type: "integer" },
                        week_to: { type: "integer" }
                    }
                },

                LearningLog: {
                    type: "object",
                    properties: {
                        id_student: { type: "integer" },
                        id_site: { type: "integer" },
                        sum_click: { type: "integer" }
                    }
                },

                Assessment: {
                    type: "object",
                    properties: {
                        id_assessment: { type: "integer" },
                        code_module: { type: "string" },
                        code_presentation: { type: "string" },
                        date: { type: "integer" },
                        weight: { type: "integer" }
                    }
                },

                StudentAssessment: {
                    type: "object",
                    properties: {
                        id_student: { type: "integer" },
                        id_assessment: { type: "integer" },
                        score: { type: "integer" }
                    }
                }
            }
        }
    };

    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
};
